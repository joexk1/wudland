import SwiftUI

/// First launch: say hello, ask what the villagers should call you, explain what each permission is for
/// before iOS asks, and point at linking a computer. Shown once; everything can be changed later in Settings.
struct Onboarding: View {
    var game: Game
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
                    case 2: permissions
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

    private var permissions: some View {
        VStack(alignment: .leading, spacing: 12) {
            title("Bringing your day in", 28)
            Text("iOS will ask for a few things. Each one is optional and stays on this phone.")
                .font(Fonts.pixel(14)).foregroundStyle(Ink.inkSoft).fixedSize(horizontal: false, vertical: true)
            reason("Calendar", "the bell tower rings for what's coming up")
            reason("Reminders", "the notice board, and ticking things off")
            reason("Location", "the farmer's weather, rounded to your town")
            reason("Music", "the bard plays what you've been listening to")
            HStack {
                skip("Not now") { page = 3 }
                Spacer()
                next(asking ? "Asking…" : "Ask me") {
                    guard !asking else { return }
                    asking = true
                    Task {
                        await Sources.shared.requestAll()
                        asking = false
                        page = 3
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
            ForEach(0..<4) { i in
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
