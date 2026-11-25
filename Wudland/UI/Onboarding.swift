import SwiftUI

/// First launch: say hello, ask what the villagers should call you, explain what each permission is for
/// before iOS asks, and point at linking a computer. Shown once; everything can be changed later in Settings.
struct Onboarding: View {
    var game: Game
    var avatar: Avatar
    var onDone: (_ openSettings: Bool) -> Void

    @AppStorage("lord.name") private var lordName = ""
    @AppStorage("weather.town") private var town = ""
    @State private var page = 0
    @State private var asking = false
    @FocusState private var nameFocused: Bool

    var body: some View {
        ZStack {
            Ink.night.opacity(0.5).ignoresSafeArea()
            VStack(alignment: .leading, spacing: 18) {
                Group {
                    switch page {
                    case 0: welcome
                    case 1: name
                    case 2: who
                    case 3: permissions
                    default: link
                    }
                }
                .id(page)
                .transition(.asymmetric(insertion: .opacity.combined(with: .offset(x: 18)), removal: .opacity))
                dots
            }
            .padding(.horizontal, 24).padding(.top, 24).padding(.bottom, 18)
            .frame(maxWidth: 440)
            // one card, one shadow: the parchment style draws its drop shadow behind the page only, never
            // under each line of text (a .shadow on the whole stack used to ghost every word)
            .parchment(ornate: true)
            .padding(20)
            .animation(Motion.settle, value: page)
        }
    }

    // MARK: pages

    private var welcome: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack { Spacer(); Image("Lamp").interpolation(.none).resizable().frame(width: 64, height: 64).accessibilityHidden(true); Spacer() }
            title("Welcome to Wudland", 32)
            Text("A little village where your day lives. Your calendar rings from the bell tower, your reminders go up on the notice board, the farmer watches the weather and the bard knows your music.")
                .font(Fonts.pixel(15)).foregroundStyle(Ink.inkSoft).fixedSize(horizontal: false, vertical: true)
            Text("Link a computer later and your coding agents move into the guild.")
                .font(Fonts.pixel(15)).foregroundStyle(Ink.inkSoft).fixedSize(horizontal: false, vertical: true)
            next("Come in") { page = 1; nameFocused = true }
        }
    }

    private var name: some View {
        VStack(alignment: .leading, spacing: 12) {
            title("What should we call you?", 28)
            Text("The villagers will greet you by name, and the cottage will be yours.")
                .font(Fonts.pixel(14)).foregroundStyle(Ink.inkSoft).fixedSize(horizontal: false, vertical: true)
            TextField("", text: $lordName, prompt: Text("Your name").foregroundStyle(Ink.faded))
                .font(Fonts.pixel(20)).foregroundStyle(Ink.ink)
                .textInputAutocapitalization(.words).autocorrectionDisabled()
                .submitLabel(.next).focused($nameFocused)
                .onSubmit(saveName)
                .padding(10).background(Ink.parchmentDeep)
                .overlay(Rectangle().stroke(Ink.ink, lineWidth: 2))
                .onChange(of: lordName) { _, v in if v.count > 24 { lordName = String(v.prefix(24)) } }
                // the field only exists once the page has slid in, so ask for the keyboard then
                .task { try? await Task.sleep(for: .milliseconds(350)); nameFocused = true }
            HStack {
                skip("Skip") { lordName = ""; saveName() }
                Spacer()
                next(lordName.trimmingCharacters(in: .whitespaces).isEmpty ? "Next" : "That's me") { saveName() }
            }
        }
    }

    // choose how the village addresses you and how you look; the character in the village behind changes as you pick
    private var who: some View {
        VStack(alignment: .leading, spacing: 12) {
            title("Who walks into Wudland?", 28)
            Text("Pick how the villagers greet you. You can change it, and your look, any time in Settings and at the mirror.")
                .font(Fonts.pixel(14)).foregroundStyle(Ink.inkSoft).fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 8) {
                ForEach(Title.forms, id: \.0) { f in formCard(f.0, f.1) }
            }
            swatchRow("Skin", Avatar.skins, Binding(get: { avatar.skin }, set: { avatar.skin = $0; restyle() }))
            swatchRow("Hair", Avatar.hairs, Binding(get: { avatar.hair }, set: { avatar.hair = $0; restyle() }))
            HStack {
                Spacer()
                next("Onward") { page = 3 }
            }
        }
    }

    private func formCard(_ form: String, _ label: String) -> some View {
        let on = avatar.form == form
        return Button {
            avatar.form = form; restyle()
        } label: {
            VStack(spacing: 6) {
                PixelSprite(rows: PixelSprite.figures[form] ?? [], palette: [
                    "s": Ink.rgb(Avatar.skins[avatar.skin % 4]), "h": Ink.rgb(Avatar.hairs[avatar.hair % 6]),
                    "t": Ink.rgb(Avatar.tunics[avatar.tunic % 6]), "c": Ink.rgb(Avatar.capes[avatar.cape % 6]),
                    "w": Color(red: 0.19, green: 0.16, blue: 0.2), "g": Ink.gold, "e": Ink.ink, "k": Ink.inkSoft,
                ], scale: 4)
                .offset(y: on ? -2 : 0)
                Text(label).font(Fonts.pixel(15, .bold)).foregroundStyle(Ink.ink)
                Text("m\u{2019}\(form)").font(Fonts.pixel(12)).foregroundStyle(Ink.faded)
            }
            .frame(maxWidth: .infinity).padding(.vertical, 10)
            .background { PixelFrame(step: 3).fill(on ? Ink.gold.opacity(0.45) : Ink.parchmentDeep) }
            .overlay { PixelFrame(step: 3).stroke(on ? Ink.ink : Ink.inkSoft.opacity(0.5), lineWidth: on ? 3 : 1.5) }
            .animation(Motion.press, value: on)
        }
        .buttonStyle(SquishStyle(scale: 0.94))
        .accessibilityLabel("\(label), m\u{2019}\(form)")
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    private func swatchRow(_ label: String, _ colors: [[Int]], _ sel: Binding<Int>) -> some View {
        HStack(spacing: 4) {
            Text(label).font(Fonts.pixel(13, .semibold)).foregroundStyle(Ink.inkSoft).frame(width: 40, alignment: .leading)
            ForEach(colors.indices, id: \.self) { i in
                let on = sel.wrappedValue == i
                Button { sel.wrappedValue = i } label: {
                    PixelFrame(step: 2).fill(Ink.rgb(colors[i]))
                        .overlay { PixelFrame(step: 2).stroke(on ? Ink.ink : Ink.inkSoft, lineWidth: on ? 3 : 1.5) }
                        .frame(width: 30, height: 26).offset(y: on ? -2 : 0)
                        .frame(minWidth: 36, minHeight: 40)
                }
                .buttonStyle(SquishStyle(scale: 0.88))
                .accessibilityLabel("\(label) \(i + 1)")
            }
        }
    }

    private func restyle() {
        Sound.shared.play("tap"); Haptics.play("soft")
        game.setAvatar(avatar.look)
    }

    private var permissions: some View {
        VStack(alignment: .leading, spacing: 12) {
            title("Bringing your day in", 28)
            Text("iOS will ask for a few things. Each one is optional and stays on this phone.")
                .font(Fonts.pixel(14)).foregroundStyle(Ink.inkSoft).fixedSize(horizontal: false, vertical: true)
            reason("Calendar", "the bell tower rings for what's coming up")
            reason("Reminders", "the notice board, and ticking things off")
            reason("Location", "the farmer's weather, rounded to your town")
            reason("Music", "the bard plays what you've been listening to")
            reason("Steps", "a tree grows where the well stands, watered by your walking")
            HStack {
                skip("Not now") { page = 4 }
                Spacer()
                next(asking ? "Asking…" : "Ask me") {
                    guard !asking else { return }
                    asking = true
                    Task {
                        await Sources.shared.requestAll()
                        asking = false
                        page = 4
                    }
                }
            }
        }
    }

    private var link: some View {
        VStack(alignment: .leading, spacing: 12) {
            title("Got coding agents?", 28)
            Text("Install the free Wudland plugins on your computer and link it with the six-digit code in Settings. Claude Code, Codex and opencode sessions then turn up in the guild, working, waiting or done.")
                .font(Fonts.pixel(14)).foregroundStyle(Ink.inkSoft).fixedSize(horizontal: false, vertical: true)
            Text("Everything they send is end-to-end encrypted. No account needed.")
                .font(Fonts.pixel(13)).foregroundStyle(Ink.faded).fixedSize(horizontal: false, vertical: true)
            HStack {
                skip("Maybe later") { onDone(false) }
                Spacer()
                next("Link a computer") { onDone(true) }
            }
        }
    }

    // MARK: bits

    private func title(_ t: String, _ size: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(t).font(Fonts.blackletter(size)).foregroundStyle(Ink.ink).fixedSize(horizontal: false, vertical: true)
            Flourish(scale: 1.5)
        }
        .accessibilityElement(children: .combine)
    }

    private func saveName() {
        lordName = lordName.trimmingCharacters(in: .whitespacesAndNewlines)
        game.setLordName()
        nameFocused = false
        page = 2
    }

    private func reason(_ title: String, _ why: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Text("•").font(Fonts.pixel(14, .bold)).foregroundStyle(Ink.goldDeep)
            (Text(title + "  ").font(Fonts.pixel(14, .bold)).foregroundStyle(Ink.ink)
             + Text(why).font(Fonts.pixel(14)).foregroundStyle(Ink.inkSoft))
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func next(_ title: String, _ action: @escaping () -> Void) -> some View {
        Button { Sound.shared.play("tap"); Haptics.play("light"); action() } label: { Text(title).font(Fonts.pixel(15, .bold)) }
            .buttonStyle(PixelButtonStyle())
    }

    private func skip(_ title: String, _ action: @escaping () -> Void) -> some View {
        Button { Sound.shared.play("tap"); action() } label: { Text(title).font(Fonts.pixel(14)).foregroundStyle(Ink.faded).underline() }
            .buttonStyle(.plain)
    }

    private var dots: some View {
        HStack(spacing: 6) {
            Spacer()
            ForEach(0..<5) { i in
                Rectangle().fill(i == page ? Ink.gold : Ink.parchmentShade)
                    .overlay(Rectangle().stroke(i == page ? Ink.goldDeep : .clear, lineWidth: 1.5))
                    .frame(width: 8, height: 8).rotationEffect(.degrees(45))
                    .scaleEffect(i == page ? 1.25 : 1)
            }
            Spacer()
        }
        .accessibilityHidden(true)
    }
}

/// A tiny multicolour pixel figure: each character in a row picks a colour from the palette, "." is clear.
struct PixelSprite: View {
    let rows: [String]
    var palette: [Character: Color]
    var scale: CGFloat = 4
    var body: some View {
        Canvas { ctx, _ in
            for (y, row) in rows.enumerated() {
                for (x, ch) in row.enumerated() {
                    guard let c = palette[ch] else { continue }
                    ctx.fill(Path(CGRect(x: CGFloat(x) * scale, y: CGFloat(y) * scale, width: scale, height: scale)), with: .color(c))
                }
            }
        }
        .frame(width: CGFloat(rows.first?.count ?? 0) * scale, height: CGFloat(rows.count) * scale)
        .accessibilityHidden(true)
    }

    // the three ways to walk in: a cavalier lord, a lady in a gown with a long braid, a hooded liege
    static let figures: [String: [String]] = [
        "lord": [
            ".......gg...", "....wwwwg...", "..wwggggww..", "...hsssshh..", "...sesses...", "...ssssss...", "....ssss....",
            "..cttttttc..", ".cctttgttcc.", ".cctttttttcc", ".c.tttttt.c.", "...tt..tt...", "...kk..kk...",
        ],
        "lady": [
            "....hhhh....", "...hhhhhh...", "..hhsssshh..", "..hsesseshh.", "..hssssssh..", "..hh.ss.hh..", "..hhtttthh..",
            "..htttgtth..", "...tttttt...", "..tttttttt..", ".tttttttttt.", ".cccccccccc.", "...kk..kk...",
        ],
        "liege": [
            "....cccc....", "...cccccc...", "..cchhhhcc..", "..chsssshc..", "..csessesc..", "..cssssssc..", "..cc.ss.cc..",
            "..cttttttc..", ".cctttgttcc.", ".cctttttttc.", "..ctttttc...", "...tt..tt...", "...kk..kk...",
        ],
    ]
}
