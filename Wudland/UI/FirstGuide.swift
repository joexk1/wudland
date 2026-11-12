import SwiftUI

/// After onboarding: dim the village, light up one thing at a time, and point at it with a bobbing arrow.
/// 1. the little map (tap it)  2. the open map (tap a place to travel there)  3. the zoom rail on the right edge.
/// Shown once; `onDone` records that.
struct FirstGuide: View {
    var game: Game
    var onDone: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var step = 0
    @State private var target: CGRect?
    @State private var bob = false

    private struct Step { let selector: String; let title: String; let body: String; let button: String; let side: Side }
    private enum Side { case below, above, left, aboveTarget }

    private let steps: [Step] = [
        Step(selector: ".mini", title: "Your map", body: "This little map shows the whole island. Tap it to open it up.",
             button: "Open the map", side: .below),
        Step(selector: ".card .map", title: "Travel anywhere", body: "Tap any place on the map and you'll be whisked straight there. Wander about, or hop across the island in a blink.",
             button: "Lovely", side: .below),
        Step(selector: ".zs", title: "Zoom", body: "Slide this little rail up to get close, and right down to see all of Wudland at once.",
             button: "Off I go", side: .left),
    ]

    var body: some View {
        GeometryReader { geo in
            let s = steps[step], pad: CGFloat = 8
            let screen = CGRect(origin: .zero, size: geo.size).insetBy(dx: 3, dy: 3)
            let hole = target.map { $0.insetBy(dx: -pad, dy: -pad).intersection(screen) }
            ZStack(alignment: .topLeading) {
                // the dim, with a pixel-cornered window cut round whatever we're pointing at
                Ink.night.opacity(0.66)
                    .mask {
                        ZStack {
                            Rectangle()
                            if let h = hole {
                                PixelFrame(step: 4).frame(width: h.width, height: h.height)
                                    .position(x: h.midX, y: h.midY).blendMode(.destinationOut)
                            }
                        }
                        .compositingGroup()
                    }
                    .contentShape(Rectangle())
                    .onTapGesture { location in
                        // tapping the lit-up map does what the button does
                        if step == 0, let h = hole, h.contains(location) { advance() }
                    }

                if let h = hole {
                    PixelFrame(step: 4).stroke(Ink.gold, lineWidth: 3)
                        .frame(width: h.width, height: h.height).position(x: h.midX, y: h.midY)
                        .allowsHitTesting(false)
                    let aSide: Side = step == 1 ? .aboveTarget : s.side
                    arrow(aSide)
                        .position(arrowPoint(aSide, h))
                        .offset(arrowBob(aSide))
                        .allowsHitTesting(false)
                    note(s)
                        .frame(width: min(geo.size.width - 40, s.side == .left ? 260 : 320))
                        .position(notePoint(s.side, h, in: geo.size))
                        .id(step)
                        .transition(.opacity.combined(with: .scale(scale: 0.94)))
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .ignoresSafeArea()
        .animation(Motion.of(Motion.settle, reduce: reduceMotion), value: step)
        .animation(Motion.of(Motion.settle, reduce: reduceMotion), value: target)
        .task(id: step) { await locate() }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 0.55).repeatForever(autoreverses: true)) { bob = true }
        }
    }

    // MARK: steps

    private func advance() {
        Sound.shared.play("tap"); Haptics.play("light")
        switch step {
        case 0: game.run("mapCard()")
        case 1: game.run("closeCard(); ZS.el && ZS.el.classList.add('open')")
        default:
            game.run("ZS.el && ZS.el.classList.remove('open')")
            onDone(); return
        }
        target = nil
        step += 1
    }

    /// ask the village where the thing is; it may still be animating in, so look a few times
    private func locate() async {
        try? await Task.sleep(for: .milliseconds(step == 0 ? 200 : 420))
        for _ in 0..<12 {
            if let r = await game.rect(of: steps[step].selector) { target = r; return }
            try? await Task.sleep(for: .milliseconds(150))
        }
    }

    // MARK: pieces

    private func note(_ s: Step) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            VStack(alignment: .leading, spacing: 5) {
                Text(s.title).font(Fonts.blackletter(26)).foregroundStyle(Ink.ink)
                Flourish(scale: 1.5)
            }
            Text(s.body).font(Fonts.pixel(15)).foregroundStyle(Ink.inkSoft).fixedSize(horizontal: false, vertical: true)
            HStack {
                ForEach(0..<steps.count, id: \.self) { i in
                    Rectangle().fill(i == step ? Ink.gold : Ink.parchmentShade)
                        .frame(width: 7, height: 7).rotationEffect(.degrees(45))
                }
                Spacer()
                Button { advance() } label: { Text(s.button).font(Fonts.pixel(15, .bold)) }
                    .buttonStyle(PixelButtonStyle(fill: Ink.gold))
                    .accessibilityIdentifier("guide.next")
            }
            .padding(.top, 4)
        }
        .padding(18)
        .parchment(ornate: true)
    }

    private static let arrowRows = ["...X...", "..XXX..", ".XXXXX.", "XXXXXXX", "..XXX..", "..XXX..", "..XXX.."]
    private func arrow(_ side: Side) -> some View {
        ZStack {
            PixelIcon(rows: Self.arrowRows, color: Ink.ink, scale: 6).offset(x: 2, y: 3)
            PixelIcon(rows: Self.arrowRows, color: Ink.gold, scale: 6)
        }
        .rotationEffect(.degrees(side == .below ? 0 : side == .left ? 90 : 180))
    }
    private func arrowPoint(_ side: Side, _ h: CGRect) -> CGPoint {
        switch side {
        case .below: CGPoint(x: h.midX, y: h.maxY + 34)
        case .above: CGPoint(x: h.midX, y: h.maxY + 34)
        case .left: CGPoint(x: h.minX - 34, y: h.midY)
        case .aboveTarget: CGPoint(x: h.midX, y: h.minY + 56)   // in the night sky over the island, pointing down at it
        }
    }
    private func arrowBob(_ side: Side) -> CGSize {
        let d: CGFloat = bob ? 7 : 0
        switch side {
        case .below: return CGSize(width: 0, height: d)
        case .above: return CGSize(width: 0, height: -d + 7)
        case .left: return CGSize(width: -d, height: 0)
        case .aboveTarget: return CGSize(width: 0, height: -d)
        }
    }
    private func notePoint(_ side: Side, _ h: CGRect, in size: CGSize) -> CGPoint {
        let w = min(size.width - 40, side == .left ? 260 : 320)
        switch side {
        case .below: return CGPoint(x: max(20 + w / 2, min(size.width - 20 - w / 2, h.midX + w / 2 - 50)), y: min(size.height - 125, h.maxY + 160))
        case .above: return CGPoint(x: size.width / 2, y: min(size.height - 130, h.maxY + 150))
        case .left, .aboveTarget: return CGPoint(x: max(20 + w / 2, h.minX - 70 - w / 2), y: h.midY)
        }
    }
}
