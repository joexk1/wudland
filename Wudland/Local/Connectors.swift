import SwiftUI
import Observation
import EventKit
import CoreLocation
import MediaPlayer

/// The things on this phone the village can read, each with its own switch in Settings.
/// Off means the village stops reading it at once. Turning one back on runs a little reconnect: the app asks iOS
/// again (iOS only shows its prompt if it has never been answered; otherwise it reports the standing answer),
/// then reads the connector once so you see it come back to life.
enum Connector: String, CaseIterable, Identifiable {
    case calendar, reminders, weather, music, steps
    var id: String { rawValue }

    var title: String {
        switch self { case .calendar: "Calendar"; case .reminders: "Reminders"; case .weather: "Weather"; case .music: "Music"; case .steps: "Steps" }
    }
    var place: String {
        switch self {
        case .calendar: "rings from the bell tower"
        case .reminders: "goes up on the notice board"
        case .weather: "the farmer reads your sky"
        case .music: "the bard hums your songs"
        case .steps: "waters the Step Tree"
        }
    }
    var icon: [String] {
        switch self {
        case .calendar: PixelIcon.bell
        case .reminders: ["XXXXX", "X...X", "X.X.X", "X...X", "XXXXX"]
        case .weather: PixelIcon.sun
        case .music: ["..XXX", "..X.X", "..X.X", "XXX.X", "XXXXX"]
        case .steps: ["..X..", ".XXX.", "XXXXX", "..X..", ".XXX."]
        }
    }

    /// on unless switched off; read wherever the village gathers news (Sources)
    /// Steps is the Step Tree's own switch (off until you turn it on); the rest are on unless switched off
    private var key: String { self == .steps ? "steptree.on" : "conn." + rawValue }
    var isOn: Bool { UserDefaults.standard.object(forKey: key) as? Bool ?? (self != .steps) }
    func save(_ on: Bool) {
        if self == .steps { Task { @MainActor in StepTree.shared.enabled = on }; return }
        UserDefaults.standard.set(on, forKey: key)
    }
}

@MainActor @Observable
final class Connections {
    static let shared = Connections()

    enum Phase: Equatable {
        case idle
        case reconnecting
        case connected(String)   // what came back, e.g. "9 bells this week"
        case blocked             // iOS says no: only Settings can change that
    }
    private(set) var on: [Connector: Bool] = Dictionary(uniqueKeysWithValues: Connector.allCases.map { ($0, $0.isOn) })
    private(set) var phase: [Connector: Phase] = [:]

    // Steps reads the Step Tree live: it can also be switched in the Step Tree section below
    func isOn(_ c: Connector) -> Bool { c == .steps ? StepTree.shared.enabled : (on[c] ?? true) }

    func set(_ c: Connector, _ value: Bool, refresh: @escaping () async -> Void) async {
        if !value {
            on[c] = false; c.save(false); phase[c] = .idle
            await refresh()
            return
        }
        on[c] = true   // the switch moves at once; it falls back if iOS refuses
        phase[c] = .reconnecting
        let started = Date.now
        let allowed = await Sources.shared.request(c)
        let summary = allowed ? await Sources.shared.summary(c) : nil
        // let the reconnect breathe for a moment, so it reads as reaching out rather than a flicker
        let left = 1.3 - Date.now.timeIntervalSince(started)
        if left > 0 { try? await Task.sleep(for: .seconds(left)) }
        if allowed {
            c.save(true)
            phase[c] = .connected(summary ?? "connected")
            Haptics.play("success"); Sound.shared.play("chime")
            await refresh()
        } else {
            on[c] = false; c.save(false)
            phase[c] = .blocked
            Haptics.play("warning")
        }
    }
}

// MARK: - the Settings rows

struct ConnectorRows: View {
    var refresh: () async -> Void
    @State private var conns = Connections.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Connector.allCases) { c in row(c) }
            Text("Everything stays on this phone. Weather sends your town, or a rounded location, to Open-Meteo.")
                .font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
        }
    }

    private func row(_ c: Connector) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Toggle(isOn: Binding(get: { conns.isOn(c) }, set: { v in
                Sound.shared.play("tap")
                Task { await conns.set(c, v, refresh: refresh) }
            })) {
                HStack(spacing: 10) {
                    PixelIcon(rows: c.icon, color: conns.isOn(c) ? Ink.goldDeep : Ink.faded, scale: 3)
                        .frame(width: 22)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(c.title).font(Fonts.pixel(15, .semibold)).foregroundStyle(Ink.ink)
                        Text(c.place).font(Fonts.pixel(12)).foregroundStyle(Ink.faded)
                    }
                }
            }
            .toggleStyle(PixelToggleStyle())
            .accessibilityIdentifier("conn." + c.rawValue)
            .disabled(conns.phase[c] == .reconnecting)
            status(c).padding(.leading, 32)
        }
    }

    @ViewBuilder private func status(_ c: Connector) -> some View {
        switch conns.phase[c] ?? .idle {
        case .reconnecting:
            TimelineView(.periodic(from: .now, by: 0.3)) { t in
                let n = Int(t.date.timeIntervalSince1970 / 0.3) % 4
                Text((c == .steps ? "Asking Health for your steps" : "Sending a raven to your \(c.title.lowercased())") + String(repeating: ".", count: n))
                    .font(Fonts.pixel(12)).foregroundStyle(Ink.quill)
            }
        case .connected(let what):
            HStack(spacing: 4) {
                PixelIcon(rows: ["....X", "...X.", "X.X..", ".X..."], color: Ink.leaf, scale: 2)
                Text("Reconnected \u{00B7} \(what)").font(Fonts.pixel(12)).foregroundStyle(Ink.leaf)
            }
            .transition(.opacity)
        case .blocked:
            HStack(spacing: 8) {
                Text("iOS is keeping your \(c.title.lowercased()) closed.").font(Fonts.pixel(12)).foregroundStyle(Ink.red)
                Button("Open Settings") { if let u = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(u) } }
                    .font(Fonts.pixel(12)).buttonStyle(PixelButtonStyle())
            }
        case .idle:
            if !conns.isOn(c) { Text("Switched off. The village won't read it.").font(Fonts.pixel(12)).foregroundStyle(Ink.faded) }
        }
    }
}

/// A chunky pixel switch: a stepped track that lights green when on, and a gold square knob that clicks across.
struct PixelToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack {
            configuration.label
            Spacer(minLength: 8)
            ZStack(alignment: configuration.isOn ? .trailing : .leading) {
                PixelFrame(step: 3).fill(configuration.isOn ? Ink.leaf : Ink.parchmentShade)
                    .overlay { PixelFrame(step: 3).stroke(Ink.ink, lineWidth: 2) }
                    .overlay(alignment: configuration.isOn ? .leading : .trailing) {
                        // a little lit window when on, a dark slot when off
                        Rectangle().fill(configuration.isOn ? Ink.gold : Ink.inkSoft.opacity(0.35))
                            .frame(width: 4, height: 8).padding(.horizontal, 9)
                    }
                PixelFrame(step: 2).fill(configuration.isOn ? Ink.gold : Ink.parchment)
                    .overlay { PixelFrame(step: 2).stroke(Ink.ink, lineWidth: 2) }
                    .overlay(alignment: .topLeading) { Rectangle().fill(Color.white.opacity(0.6)).frame(width: 4, height: 4).padding(4) }
                    .frame(width: 22, height: 22).padding(3)
            }
            .frame(width: 54, height: 30)
            .animation(Motion.press, value: configuration.isOn)
        }
        .frame(minHeight: 44)
        .contentShape(Rectangle())
        // the whole row flips the switch
        .onTapGesture { configuration.isOn.toggle(); Haptics.play("soft") }
    }
}
