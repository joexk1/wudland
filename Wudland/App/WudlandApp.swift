import SwiftUI

@main
struct WudlandApp: App {
    var body: some Scene {
        WindowGroup { RootView().preferredColorScheme(.dark).statusBarHidden() }
    }
}

/// Who the lord is talking to right now, if anyone.
enum Talking {
    case villager(Conversation, trades: Bool)
    case wizard
}

/// A parchment card floating over the village.
enum Card: Identifiable {
    case mirror, scroll, settings, satchel
    var id: Int { hashValue }
}

struct RootView: View {
    @State private var game = Game()
    @State private var store = VillageStore()
    @State private var avatar = Avatar()
    @State private var book = WizardBook()
    @State private var talking: Talking?
    @State private var card: Card?
    @State private var showSplash = true
    @Environment(\.scenePhase) private var phase

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Ink.night.ignoresSafeArea()
                GameView(game: game, boot: store.raw, avatar: avatar.look)
                    .ignoresSafeArea()
                    .opacity(game.ready ? 1 : 0)

                if talking == nil && card == nil { hud.transition(.opacity) }

                panel(height: geo.size.height)

                if let t = game.economy.toast, card == nil {
                    VStack { ToastView(toast: t, econ: game.economy).padding(.top, 70); Spacer() }
                        .transition(.move(edge: .top).combined(with: .opacity))
                        .allowsHitTesting(false)
                        .id(t.id)
                }

                if let card {
                    Color.black.opacity(0.35).ignoresSafeArea()
                        .onTapGesture { close(card) }
                        .transition(.opacity)
                    cardView(card)
                        .frame(maxWidth: 460, maxHeight: geo.size.height * 0.78)
                        .transition(.scale(scale: 0.92).combined(with: .opacity))
                }

                if showSplash { Splash().transition(.opacity) }
            }
            .animation(.spring(duration: 0.38, bounce: 0.18), value: talkKey)
            .animation(.easeOut(duration: 0.22), value: card?.id)
        }
        .onAppear(perform: boot)
        .onDisappear { store.stop(); book.close(); game.onEvent = nil; game.setPaused(true); Sound.shared.pause() }
        .onChange(of: phase) { _, p in
            switch p {
            case .active:
                game.setPaused(false)
                store.start { game.setData($0) }
                Sound.shared.start(); ambience()
            case .background:
                game.setPaused(true); store.stop(); book.close(); Sound.shared.pause()
            default: break
            }
        }
    }

    private var talkKey: Int { switch talking { case .none: 0; case .villager: 1; case .wizard: 2 } }

    // MARK: - HUD

    private var hud: some View {
        VStack {
            HStack(alignment: .top) {
                if game.sceneID != "village" {
                    Button { Sound.shared.play("tap"); Haptics.play("light"); game.leave() } label: {
                        HStack(spacing: 6) { PixelIcon(rows: PixelIcon.back, scale: 2.2); Text("Village") }
                    }
                    .buttonStyle(PixelButtonStyle())
                    .transition(.move(edge: .leading).combined(with: .opacity))
                }
                Spacer()
                Button { Sound.shared.play("tap"); card = .settings } label: {
                    PixelIcon(rows: PixelIcon.cog, scale: 2.6).padding(2)
                }
                .buttonStyle(PixelButtonStyle())
                .accessibilityLabel("Settings")
            }
            .overlay { ribbon }
            Spacer()
            HStack(alignment: .bottom) {
                if game.sceneID == "village" { pills.transition(.move(edge: .bottom).combined(with: .opacity)) }
                Spacer(minLength: 8)
                satchelButton
            }
        }
        .padding(.horizontal, 14)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .animation(.easeOut(duration: 0.25), value: game.sceneID)
    }

    private var ribbon: some View {
        VStack(spacing: 2) {
            Text(game.sceneTitle)
                .font(Fonts.blackletter(game.sceneID == "village" ? 34 : 28))
                .foregroundStyle(Ink.parchment)
                .shadow(color: .black.opacity(0.7), radius: 0, x: 2, y: 2)
                .lineLimit(1).minimumScaleFactor(0.6)
                .id(game.sceneTitle)
                .transition(.opacity)
            if game.sceneID == "village", let w = store.village.weather {
                HStack(spacing: 5) {
                    PixelIcon(rows: weatherIcon(w.kind), color: Ink.parchment, scale: 1.6)
                    Text("\(w.temp)\u{00B0} \u{00B7} \(w.kind)").font(Fonts.pixel(12, .medium)).foregroundStyle(Ink.parchment)
                }
                .shadow(color: .black.opacity(0.7), radius: 0, x: 1, y: 1)
            }
            if store.offline {
                HStack(spacing: 4) {
                    PixelIcon(rows: PixelIcon.raven, color: Ink.gold, scale: 1.6)
                    Text("the raven is lost \u{00B7} old news").font(Fonts.pixel(11)).foregroundStyle(Ink.gold)
                }
            }
        }
        .padding(.top, 2)
        // keep clear of the Village button on the left and the cog on the right (equal, so it stays centred)
        .padding(.horizontal, game.sceneID == "village" ? 64 : 124)
        .allowsHitTesting(false)
        .animation(.easeInOut(duration: 0.3), value: game.sceneTitle)
    }

    private var pills: some View {
        let v = store.village
        return HStack(spacing: 8) {
            pill(PixelIcon.mail, "\(v.mail?.unread_count ?? 0)", lit: (v.mail?.unread_people ?? 0) > 0, label: "Unread letters") { game.goTo("post") }
            pill(PixelIcon.note, "\(v.calendar?.today.count ?? 0)", lit: !(v.calendar?.today.isEmpty ?? true), label: "Events today") { game.goTo("bell") }
            pill(PixelIcon.star, "\(v.agents?.busy ?? 0)", lit: (v.agents?.busy ?? 0) > 0, label: "Agents at work") { game.goTo("guild") }
        }
    }

    private var satchelButton: some View {
        Button { Sound.shared.play("open"); Haptics.play("light"); card = .satchel } label: {
            HStack(spacing: 6) {
                PixelIcon(rows: ["..XXX..", ".X...X.", "XXXXXXX", "X..X..X", "X.....X", "XXXXXXX"], color: Ink.ink, scale: 2.2)
                Text("\(game.economy.crowns)").font(Fonts.pixel(15, .semibold)).monospacedDigit().contentTransition(.numericText())
                CrownMark(scale: 1.8)
            }
        }
        .buttonStyle(PixelButtonStyle(fill: Ink.gold))
        .accessibilityLabel("Satchel, \(game.economy.crowns) crowns")
    }

    private func pill(_ icon: [String], _ text: String, lit: Bool, label: String, action: @escaping () -> Void) -> some View {
        Button { Sound.shared.play("tap"); Haptics.play("light"); action() } label: {
            HStack(spacing: 6) {
                PixelIcon(rows: icon, color: lit ? Ink.red : Ink.ink, scale: 2.2)
                Text(text).font(Fonts.pixel(15, .semibold)).monospacedDigit().contentTransition(.numericText())
            }
        }
        .buttonStyle(PixelButtonStyle(fill: lit ? Ink.gold : Ink.parchmentDeep))
        .accessibilityLabel("\(label): \(text)")
    }

    private func weatherIcon(_ kind: String) -> [String] {
        let k = kind.lowercased()
        if k.contains("rain") || k.contains("drizzle") || k.contains("storm") || k.contains("shower") { return PixelIcon.rain }
        if k.contains("cloud") || k.contains("overcast") || k.contains("fog") { return PixelIcon.cloud }
        let h = Calendar.current.component(.hour, from: .now)
        return h >= 7 && h < 19 ? PixelIcon.sun : PixelIcon.moon
    }

    // MARK: - talk panels

    @ViewBuilder private func panel(height: CGFloat) -> some View {
        switch talking {
        case .villager(let convo, let trades):
            VStack {
                Spacer()
                DialogueView(convo: convo, store: store, game: game, trades: trades, onClose: endTalk)
                    .frame(height: height * 0.5)
            }
            .transition(.move(edge: .bottom))
        case .wizard:
            VStack {
                Spacer()
                SpellbookView(book: book, onClose: endTalk)
                    .frame(height: height * 0.62)
            }
            .transition(.move(edge: .bottom))
        case .none:
            EmptyView()
        }
    }

    private func startTalk(npc: String, name: String, agent: AgentNode?, chat: Chat?, trades: Bool = false) {
        if case .villager(let old, _) = talking { old.stop() }
        if npc == "wizard" {
            book.onBusy = { game.setWizard($0) }
            book.open()
            talking = .wizard
            game.setPanel(0.6)
            return
        }
        let convo = Conversation(Cast.make(npc, name: name, v: store.village, agent: agent, chat: chat))
        convo.onSpeaking = { game.setSpeaking($0) }
        convo.open()
        talking = .villager(convo, trades: trades)
        game.setPanel(0.48)
    }

    private func endTalk() {
        switch talking {
        case .villager(let c, _): c.stop()
        case .wizard: book.close()
        case .none: break
        }
        talking = nil
        game.setPanel(0)
        game.setSpeaking(false)
        game.endTalk()
    }

    // MARK: - cards

    @ViewBuilder private func cardView(_ c: Card) -> some View {
        switch c {
        case .mirror: MirrorSheet(avatar: avatar, owned: game.economy.hats, econ: game.economy, onChange: { game.setAvatar(avatar.look) }, onClose: { close(c) })
        case .satchel: SatchelSheet(econ: game.economy, game: game, avatar: avatar, onClose: { close(c) })
        case .scroll: ScrollSheet(village: store.village, onClose: { close(c) })
        case .settings: SettingsSheet(store: store, game: game, onClose: { close(c) })
        }
    }

    private func close(_ c: Card) {
        Sound.shared.play("tap")
        card = nil
        game.endTalk()
    }

    // MARK: - wiring

    private func boot() {
        game.onEvent = { e in
            switch e {
            case .ready:
                let held = UserDefaults.standard.object(forKey: "sunHour") as? Double ?? -1
                if held >= 0 { game.setHour(held) }
                withAnimation(.easeOut(duration: 0.6).delay(0.15)) { showSplash = false }
                ambience()
            case .scene:
                if talking != nil { endTalk() }
                ambience()
            case .talk(let npc, let name, let agent, let chat, let trades):
                startTalk(npc: npc, name: name, agent: agent, chat: chat, trades: trades)
            case .inspect(let what):
                switch what {
                case "board": startTalk(npc: "board", name: "Notice Board", agent: nil, chat: nil)
                case "scroll": card = .scroll
                case "mirror": card = .mirror
                default: break
                }
            case .endTalk:
                if talking != nil { endTalk() }
            }
        }
        Task { await Sources.shared.requestAll(); await store.refresh { game.setData($0) } }
        store.start { game.setData($0) }
        Sound.shared.start()
        // never leave the lord staring at the splash if the canvas is slow
        Task { try? await Task.sleep(for: .seconds(6)); withAnimation { showSplash = false } }
    }

    private func ambience() {
        let h = Calendar.current.component(.hour, from: .now)
        let held = UserDefaults.standard.object(forKey: "sunHour") as? Double ?? -1
        let hr = held >= 0 ? Int(held) : h
        switch game.sceneID {
        case "village": Sound.shared.ambient(hr >= 7 && hr < 19 ? "day" : "night")
        case "tower": Sound.shared.ambient("tower")
        default: Sound.shared.ambient("indoors")
        }
    }
}

private struct Splash: View {
    @State private var glow = false
    var body: some View {
        ZStack {
            Ink.night.ignoresSafeArea()
            VStack(spacing: 18) {
                Image("Lamp")
                    .interpolation(.none)
                    .resizable()
                    .frame(width: 96, height: 96)
                    .shadow(color: Ink.gold.opacity(glow ? 0.8 : 0.3), radius: glow ? 26 : 10)
                Text("Wudland").font(Fonts.blackletter(54)).foregroundStyle(Ink.parchment)
                Text("lighting the lamps\u{2026}").font(Fonts.pixel(13)).foregroundStyle(Ink.faded)
            }
        }
        .onAppear { withAnimation(.easeInOut(duration: 1.1).repeatForever()) { glow = true } }
    }
}
