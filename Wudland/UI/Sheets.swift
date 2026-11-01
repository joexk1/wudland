import SwiftUI

// MARK: - avatar

/// the lord's look, kept in UserDefaults and handed to the canvas as a palette.
@MainActor @Observable
final class Avatar {
    static let skins: [[Int]] = [[238, 198, 164], [220, 170, 132], [186, 132, 96], [142, 98, 72]]
    static let hairs: [[Int]] = [[74, 52, 40], [40, 34, 34], [150, 94, 54], [212, 170, 96], [170, 160, 150], [160, 70, 46]]
    static let tunics: [[Int]] = [[66, 112, 92], [70, 96, 150], [150, 60, 56], [110, 80, 140], [200, 150, 70], [80, 80, 90]]
    static let capes: [[Int]] = [[168, 60, 52], [60, 80, 140], [70, 110, 70], [60, 50, 60], [200, 170, 90], [236, 228, 210]]
    static let hats: [String] = ["cavalier", "none", "hood", "cap", "beret", "straw", "helmet", "wizard", "antlers", "crown", "halo"]

    var skin = UserDefaults.standard.integer(forKey: "av.skin") { didSet { save() } }
    var hair = UserDefaults.standard.integer(forKey: "av.hair") { didSet { save() } }
    var tunic = UserDefaults.standard.integer(forKey: "av.tunic") { didSet { save() } }
    var cape = UserDefaults.standard.integer(forKey: "av.cape") { didSet { save() } }
    var hatName = UserDefaults.standard.string(forKey: "av.hatName") ?? "cavalier" { didSet { save() } }

    private func save() {
        let d = UserDefaults.standard
        d.set(skin, forKey: "av.skin"); d.set(hair, forKey: "av.hair"); d.set(tunic, forKey: "av.tunic"); d.set(cape, forKey: "av.cape"); d.set(hatName, forKey: "av.hatName")
    }
    var look: [String: Any] {
        var l: [String: Any] = ["skin": Self.skins[skin % 4], "hair": Self.hairs[hair % 6], "shirt": Self.tunics[tunic % 6], "sleeve": Self.tunics[tunic % 6], "cape": Self.capes[cape % 6]]
        let h = hatName
        if h != "none" { l["hat"] = h; l["hatColor"] = Self.capes[cape % 6].map { Int(Double($0) * 0.85) } }
        let plume = Self.capes[cape % 6].map { min(255, Int(Double($0) * 1.15) + 20) }
        switch h {
        case "straw": l["hatColor"] = [226, 196, 120]; l["hatBand"] = [160, 60, 50]
        case "cavalier": l["hatColor"] = [48, 40, 52]; l["hatBand"] = [236, 190, 86]; l["plume"] = plume
        case "wizard": l["hatColor"] = [80, 56, 128]; l["hatBand"] = [236, 196, 90]
        case "helmet": l["plume"] = plume
        case "antlers": l["hatColor"] = [214, 186, 136]
        default: break
        }
        return l
    }
}

struct MirrorSheet: View {
    @Bindable var avatar: Avatar
    var owned: [String] = Avatar.hats
    var econ: Economy? = nil
    var onChange: () -> Void
    var onClose: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("The Mirror").font(Fonts.blackletter(30)).foregroundStyle(Ink.ink)
                Spacer()
                Button(action: onClose) { PixelIcon(rows: PixelIcon.close, scale: 2.4).padding(8) }
            }
            Text("Who's the fairest lord of Wudland?").font(Fonts.pixel(13)).foregroundStyle(Ink.faded)
            swatches("Skin", Avatar.skins, $avatar.skin)
            swatches("Hair", Avatar.hairs, $avatar.hair)
            swatches("Tunic", Avatar.tunics, $avatar.tunic)
            swatches("Cape", Avatar.capes, $avatar.cape)
            VStack(alignment: .leading, spacing: 6) {
                Text("Hat").font(Fonts.pixel(13, .semibold)).foregroundStyle(Ink.inkSoft)
                FlowRow {
                    ForEach((econ?.hatStyles ?? Avatar.hats).filter { $0 == "none" || owned.contains($0) }, id: \.self) { h in
                        HatChip(style: h, item: econ?.hatItem(h), on: avatar.hatName == h) { avatar.hatName = h; onChange() }
                    }
                }
            }
        }
        .padding(18)
        .parchment()
        .padding(12)
    }
    private func changed() { Sound.shared.play("tap"); Haptics.play("soft"); onChange() }
    private func swatches(_ title: String, _ colors: [[Int]], _ sel: Binding<Int>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(Fonts.pixel(13, .semibold)).foregroundStyle(Ink.inkSoft)
            HStack(spacing: 8) {
                ForEach(colors.indices, id: \.self) { i in
                    Button { sel.wrappedValue = i; changed() } label: {
                        let c = colors[i]
                        PixelFrame(step: 2).fill(Color(red: Double(c[0]) / 255, green: Double(c[1]) / 255, blue: Double(c[2]) / 255))
                            .overlay { PixelFrame(step: 2).stroke(Ink.ink, lineWidth: sel.wrappedValue == i ? 3 : 1.5) }
                            .frame(width: 34, height: 28)
                            .offset(y: sel.wrappedValue == i ? -2 : 0)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// MARK: - the briefing scroll on the lord's desk

struct ScrollSheet: View {
    var village: Village
    var onClose: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Today's Scroll").font(Fonts.blackletter(30)).foregroundStyle(Ink.ink)
                Spacer()
                Button(action: onClose) { PixelIcon(rows: PixelIcon.close, scale: 2.4).padding(8) }
            }
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if let w = village.weather {
                        Text("\(w.temp)\u{00B0} and \(w.kind), high \(w.high ?? w.temp)\u{00B0}. Tomorrow: \(w.tomorrow ?? "?").").font(Fonts.pixel(15, .medium)).foregroundStyle(Ink.ink)
                    }
                    if let b = village.notices?.briefing {
                        Text("Thistlewick's briefing \u{00B7} \(When.ago(b.at))").font(Fonts.pixel(12)).foregroundStyle(Ink.faded)
                        Text(b.text).font(Fonts.pixel(15)).foregroundStyle(Ink.ink).lineSpacing(4).textSelection(.enabled)
                    }
                    ForEach(village.notices?.notes ?? []) { n in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(n.title).font(Fonts.pixel(15, .semibold)).foregroundStyle(Ink.ink)
                            Text(n.body).font(Fonts.pixel(14)).foregroundStyle(Ink.inkSoft).lineSpacing(3).textSelection(.enabled)
                            Text(When.ago(n.at)).font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
                        }
                        .padding(.vertical, 6)
                        .overlay(alignment: .bottom) { DottedRule() }
                    }
                }
            }
            .scrollIndicators(.hidden)
        }
        .padding(18)
        .parchment()
        .padding(12)
    }
}

// MARK: - settings

struct SettingsSheet: View {
    var store: VillageStore
    var game: Game
    var onClose: () -> Void
    @AppStorage("lord.name") private var lordName = ""
    @AppStorage("weather.town") private var town = ""
    @AppStorage("wizard.provider") private var provider = "device"
    @AppStorage("wizard.remoteConsent") private var remoteConsent = false
    @State private var apiKey = ""
    @State private var remoteModel = ""
    @State private var link = LinkHub.shared
    @State private var unlinkID: String?
    @State private var confirmUnlink = false
    @AppStorage("soundOff") private var soundOff = false
    @AppStorage("hapticsOff") private var hapticsOff = false
    /// the sun's held hour, or -1 when it follows the real clock
    @AppStorage("sunHour") private var sunHour: Double = -1

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("The Lord's Desk").font(Fonts.blackletter(30)).foregroundStyle(Ink.ink)
                Spacer()
                Button(action: onClose) { PixelIcon(rows: PixelIcon.close, scale: 2.4).padding(8) }
            }
            ScrollView {
            VStack(alignment: .leading, spacing: 18) {
            group("Your village") {
                field("Your name", text: $lordName, placeholder: "m’lord")
                field("Weather town", text: $town, placeholder: "or use location")
                Text("Your calendar, reminders and music stay on this phone. Weather sends your town or rounded location to Open-Meteo.")
                    .font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
                Button("Permissions in iOS Settings") { if let u = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(u) } }
                    .font(Fonts.pixel(13)).buttonStyle(PixelButtonStyle())
                Button("Refresh village") { Task { await store.refresh { game.setData($0) } } }
                    .font(Fonts.pixel(13)).buttonStyle(PixelButtonStyle())
            }
            group("Link a computer") {
                TimelineView(.periodic(from: .now, by: 1)) { tick in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(link.code(at: tick.date)).font(Fonts.pixel(36, .bold)).monospacedDigit().textSelection(.enabled)
                        Text("Refreshes in \(60 - Int(tick.date.timeIntervalSince1970) % 60)s").font(Fonts.pixel(12)).foregroundStyle(Ink.faded)
                    }
                }
                Text("On your computer: wudland link <code>. Keep this screen open and only allow a request you recognise.")
                    .font(Fonts.pixel(12)).foregroundStyle(Ink.inkSoft)
                ForEach(link.pending) { request in
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(request.name) on \(request.host)").font(Fonts.pixel(15, .semibold))
                        Text(request.verificationCode).font(Fonts.pixel(28, .bold)).monospacedDigit()
                        Text("Compare this with the verification code in your terminal. Only continue if they match exactly.").font(Fonts.pixel(12))
                        HStack {
                            Button("Codes match") { Task { await link.approve(request) } }.buttonStyle(PixelButtonStyle(fill: Ink.gold))
                            Button("Deny") { Task { await link.deny(request) } }.buttonStyle(PixelButtonStyle())
                        }
                    }
                }
                if let note = link.pairingNote { Text(note).font(Fonts.pixel(12)).foregroundStyle(Ink.inkSoft) }
                ForEach(link.links) { record in
                    HStack {
                        Text("\(record.name) · \(record.host)").font(Fonts.pixel(12))
                        Spacer()
                        Button("Unlink") { unlinkID = record.id; confirmUnlink = true }.font(Fonts.pixel(12))
                    }
                }
                Text("Linked updates are encrypted before reaching the ntfy relay. The relay can see connection metadata, but not your letters or agent messages.")
                    .font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
            }
            group("The wizard") {
                Picker("Where spells think", selection: $provider) {
                    Text("On this phone").tag("device")
                    Text("Anthropic · your key").tag("anthropic")
                    Text("OpenAI · your key").tag("openai")
                }.tint(Ink.ink)
                if provider != "device" {
                    Text("Your spellbook messages go directly to \(provider == "anthropic" ? "Anthropic" : "OpenAI"). API use may cost money on your provider account. Calendar, reminders and agent data are not attached automatically.")
                        .font(Fonts.pixel(12)).foregroundStyle(Ink.inkSoft)
                    Toggle("Allow sending my spellbook messages", isOn: $remoteConsent).font(Fonts.pixel(13)).tint(Ink.leaf)
                    field("API key", text: $apiKey, placeholder: "saved in Keychain", secure: true)
                    field("Model name", text: $remoteModel, placeholder: "from your provider")
                    Button("Save key & model") {
                        Keychain.setString(apiKey, "wizard.key.\(provider)")
                        UserDefaults.standard.set(remoteModel.trimmingCharacters(in: .whitespacesAndNewlines), forKey: "wizard.model.\(provider)")
                    }.font(Fonts.pixel(13)).buttonStyle(PixelButtonStyle())
                    Link("Provider privacy policy", destination: URL(string: provider == "anthropic" ? "https://www.anthropic.com/legal/privacy" : "https://openai.com/policies/privacy-policy/")!).font(Fonts.pixel(12))
                }
            }
            group("Comforts") {
                Toggle(isOn: Binding(get: { !soundOff }, set: { soundOff = !$0; if soundOff { Sound.shared.ambient("") } })) { Text("Sounds").font(Fonts.pixel(15)) }.tint(Ink.leaf)
                Toggle(isOn: Binding(get: { !hapticsOff }, set: { hapticsOff = !$0 })) { Text("Haptics").font(Fonts.pixel(15)) }.tint(Ink.leaf)
            }
            group("Turn the sun") {
                Slider(value: Binding(get: { sunHour >= 0 ? sunHour : Self.nowHour },
                                      set: { sunHour = $0; game.setHour($0) }),
                       in: 0...23.75, step: 0.25) { Text("Hour") }
                    .tint(Ink.goldDeep)
                HStack {
                    let h = sunHour >= 0 ? sunHour : Self.nowHour
                    Text(String(format: "%02d:%02d", Int(h), Int((h.truncatingRemainder(dividingBy: 1) * 60).rounded())) + (sunHour >= 0 ? "  \u{00B7} held" : "  \u{00B7} live"))
                        .font(Fonts.pixel(13)).foregroundStyle(Ink.inkSoft).monospacedDigit()
                    Spacer()
                    Button("Back to now") { sunHour = -1; game.setHour(nil); Sound.shared.play("tap") }
                        .buttonStyle(PixelButtonStyle(fill: sunHour >= 0 ? Ink.gold : Ink.parchmentDeep)).font(Fonts.pixel(12))
                        .disabled(sunHour < 0)
                }
            }
            Text(Conversation.modelProblem ?? "Villagers think with Apple's on-device model. The wizard stays on this phone unless you choose an external provider above.")
                .font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
            Text("iPhone duo mode · coming soon").font(Fonts.pixel(12)).foregroundStyle(Ink.inkSoft)
            Text("Weather: Open-Meteo (CC BY 4.0). Fonts: Jacquard 12 and Pixelify Sans (SIL OFL).").font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
            Text("Renderer forked from Pixel Plays by AmirMushich (MIT).").font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
            }
            }.scrollIndicators(.hidden)
        .onAppear { loadProvider(); link.startPairing() }
        .onDisappear { link.stopPairing() }
        .onChange(of: lordName) { _, _ in game.setLordName() }
        .onChange(of: provider) { _, _ in remoteConsent = false; loadProvider() }
        .confirmationDialog("Unlink this computer?", isPresented: $confirmUnlink, titleVisibility: .visible) {
            Button("Unlink", role: .destructive) { if let id = unlinkID { link.unlink(id) } }
        }
        }
        .padding(18)
        .parchment()
        .padding(12)
    }
    private func loadProvider() {
        apiKey = Keychain.string("wizard.key.\(provider)") ?? ""
        remoteModel = UserDefaults.standard.string(forKey: "wizard.model.\(provider)") ?? ""
    }
    static var nowHour: Double {
        let c = Foundation.Calendar.current.dateComponents([.hour, .minute], from: .now)
        return Double(c.hour ?? 12) + Double(c.minute ?? 0) / 60
    }
    private func group<C: View>(_ title: String, @ViewBuilder _ c: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(Fonts.pixel(13, .semibold)).foregroundStyle(Ink.inkSoft)
            c()
        }
        .foregroundStyle(Ink.ink)
    }
    private func field(_ label: String, text: Binding<String>, placeholder: String, secure: Bool = false) -> some View {
        HStack {
            Text(label).font(Fonts.pixel(13)).foregroundStyle(Ink.faded).frame(width: 92, alignment: .leading)
            Group {
                if secure { SecureField("", text: text, prompt: Text(placeholder).foregroundStyle(Ink.faded)) }
                else { TextField("", text: text, prompt: Text(placeholder).foregroundStyle(Ink.faded)) }
            }
            .font(Fonts.pixel(14)).foregroundStyle(Ink.ink).textInputAutocapitalization(.never).autocorrectionDisabled()
            .padding(.horizontal, 8).padding(.vertical, 6)
            .background { PixelFrame(step: 2).fill(Ink.parchmentDeep) }
        }
    }
}


/// Lays chips out left to right, wrapping onto new lines.
struct FlowRow: Layout {
    var spacing: CGFloat = 6
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let w = proposal.width ?? 320
        var x: CGFloat = 0, y: CGFloat = 0, row: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > 0 && x + s.width > w { x = 0; y += row + spacing; row = 0 }
            x += s.width + spacing; row = max(row, s.height)
        }
        return CGSize(width: w, height: y + row)
    }
    func placeSubviews(in b: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = b.minX, y = b.minY, row: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > b.minX && x + s.width > b.maxX { x = b.minX; y += row + spacing; row = 0 }
            v.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(s))
            x += s.width + spacing; row = max(row, s.height)
        }
    }
}
