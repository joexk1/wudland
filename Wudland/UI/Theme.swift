import SwiftUI

/// Parchment, ink and gold: the whole UI is drawn from these.
enum Ink {
    static let ink = Color(red: 0.23, green: 0.15, blue: 0.13)        // #3a2622
    static let inkSoft = Color(red: 0.42, green: 0.31, blue: 0.26)
    static let faded = Color(red: 0.58, green: 0.47, blue: 0.38)
    static let parchment = Color(red: 0.98, green: 0.95, blue: 0.87)  // #faf2de
    static let parchmentDeep = Color(red: 0.93, green: 0.87, blue: 0.74)
    static let parchmentShade = Color(red: 0.86, green: 0.78, blue: 0.62)
    static let gold = Color(red: 0.93, green: 0.75, blue: 0.34)
    static let goldDeep = Color(red: 0.69, green: 0.48, blue: 0.20)
    static let red = Color(red: 0.77, green: 0.25, blue: 0.20)
    static let leaf = Color(red: 0.40, green: 0.53, blue: 0.36)
    static let night = Color(red: 0.10, green: 0.08, blue: 0.10)
    static let rose = Color(red: 0.86, green: 0.36, blue: 0.42)       // hearts, "by your side"
    /// what dims the village behind a card (the web cards use the same wash)
    static let scrim = night.opacity(0.35)
    /// the inner highlight on parchment
    static let sheen = Color(red: 1, green: 0.99, blue: 0.95).opacity(0.5)
    // the spellbook
    static let leather = Color(red: 0.24, green: 0.15, blue: 0.30)
    static let leatherDeep = Color(red: 0.14, green: 0.08, blue: 0.18)
    static let arcane = Color(red: 0.70, green: 0.60, blue: 1.0)
    static let quill = Color(red: 0.18, green: 0.26, blue: 0.46)

    /// a colour from the canvas's 0-255 palette triples (item icons, swatches, rarity)
    static func rgb(_ c: [Int]) -> Color {
        guard c.count >= 3 else { return ink }
        return Color(red: Double(c[0]) / 255, green: Double(c[1]) / 255, blue: Double(c[2]) / 255)
    }
}

/// How things move: a little bounce, like something set down by hand. Everything falls back to a short fade
/// when Reduce Motion is on.
enum Motion {
    /// cards and toasts popping into place
    static let pop = Animation.spring(response: 0.36, dampingFraction: 0.68)
    /// panels sliding up, things settling
    static let settle = Animation.spring(response: 0.42, dampingFraction: 0.82)
    /// a button springing back under a thumb
    static let press = Animation.spring(response: 0.24, dampingFraction: 0.5)
    static let quick = Animation.easeOut(duration: 0.16)
    static func of(_ a: Animation, reduce: Bool) -> Animation { reduce ? .easeOut(duration: 0.15) : a }
}

enum Fonts {
    static func pixel(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font { .custom("Pixelify Sans", size: size).weight(weight) }
    static func blackletter(_ size: CGFloat) -> Font { .custom("Jacquard12-Regular", size: size) }
}

/// A rectangle with stepped, pixel-art corners.
struct PixelFrame: Shape {
    var step: CGFloat = 3
    func path(in r: CGRect) -> Path {
        let s = step
        var p = Path()
        p.move(to: CGPoint(x: r.minX + 2 * s, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX - 2 * s, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX - 2 * s, y: r.minY + s))
        p.addLine(to: CGPoint(x: r.maxX - s, y: r.minY + s))
        p.addLine(to: CGPoint(x: r.maxX - s, y: r.minY + 2 * s))
        p.addLine(to: CGPoint(x: r.maxX, y: r.minY + 2 * s))
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY - 2 * s))
        p.addLine(to: CGPoint(x: r.maxX - s, y: r.maxY - 2 * s))
        p.addLine(to: CGPoint(x: r.maxX - s, y: r.maxY - s))
        p.addLine(to: CGPoint(x: r.maxX - 2 * s, y: r.maxY - s))
        p.addLine(to: CGPoint(x: r.maxX - 2 * s, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX + 2 * s, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX + 2 * s, y: r.maxY - s))
        p.addLine(to: CGPoint(x: r.minX + s, y: r.maxY - s))
        p.addLine(to: CGPoint(x: r.minX + s, y: r.maxY - 2 * s))
        p.addLine(to: CGPoint(x: r.minX, y: r.maxY - 2 * s))
        p.addLine(to: CGPoint(x: r.minX, y: r.minY + 2 * s))
        p.addLine(to: CGPoint(x: r.minX + s, y: r.minY + 2 * s))
        p.addLine(to: CGPoint(x: r.minX + s, y: r.minY + s))
        p.addLine(to: CGPoint(x: r.minX + 2 * s, y: r.minY + s))
        p.closeSubpath()
        return p
    }
}

/// Parchment card with an ink outline, an inner highlight and a hard drop shadow.
struct Parchment: ViewModifier {
    var fill: Color = Ink.parchment
    var line: Color = Ink.ink
    var step: CGFloat = 3
    var shadow = true
    /// storybook corners: a small gilt curl tucked into each corner of the page
    var ornate = false
    func body(content: Content) -> some View {
        content
            .background {
                ZStack {
                    if shadow { PixelFrame(step: step).fill(line.opacity(0.35)).offset(y: step) }
                    PixelFrame(step: step).fill(fill)
                    PixelFrame(step: step).inset(by: step).stroke(Ink.sheen, lineWidth: 1.5).padding(1)
                    PixelFrame(step: step).stroke(line, lineWidth: step)
                    if ornate { CornerCurls(inset: step * 2 + 1) }
                }
            }
    }
}

/// Four little gilt corner curls, mirrored round a frame.
struct CornerCurls: View {
    var color: Color = Ink.goldDeep.opacity(0.55)
    var inset: CGFloat = 7
    var scale: CGFloat = 2
    private static let rows = ["XXXX.", "X....", "X.X..", "X....", "....."]
    var body: some View {
        ZStack {
            curl.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            curl.scaleEffect(x: -1).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
            curl.scaleEffect(y: -1).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            curl.scaleEffect(x: -1, y: -1).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
        }
        .padding(inset)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
    private var curl: some View { PixelIcon(rows: Self.rows, color: color, scale: scale) }
}

/// A storybook rule: a run of dots either side of a small diamond. Sits under titles.
struct Flourish: View {
    var color: Color = Ink.goldDeep
    var scale: CGFloat = 2
    private static let rows = ["..............X..............", "X.X.X.X.X.X.XXXXX.X.X.X.X.X.X", "..............X.............."]
    var body: some View {
        PixelIcon(rows: Self.rows, color: color, scale: scale).accessibilityHidden(true)
    }
}
extension PixelFrame: InsettableShape {
    func inset(by amount: CGFloat) -> some InsettableShape { Inset(base: self, amount: amount) }
    struct Inset: InsettableShape {
        var base: PixelFrame; var amount: CGFloat
        func path(in r: CGRect) -> Path { base.path(in: r.insetBy(dx: amount, dy: amount)) }
        func inset(by a: CGFloat) -> some InsettableShape { Inset(base: base, amount: amount + a) }
    }
}
extension View {
    func parchment(_ fill: Color = Ink.parchment, line: Color = Ink.ink, step: CGFloat = 3, shadow: Bool = true, ornate: Bool = false) -> some View {
        modifier(Parchment(fill: fill, line: line, step: step, shadow: shadow, ornate: ornate))
    }
}

/// A chunky pixel button that squashes down under a thumb and springs back.
struct PixelButtonStyle: ButtonStyle {
    var fill: Color = Ink.parchmentDeep
    var ink: Color = Ink.ink
    func makeBody(configuration: Configuration) -> some View {
        PixelButtonBody(configuration: configuration, fill: fill, ink: ink)
    }
}
private struct PixelButtonBody: View {
    let configuration: ButtonStyleConfiguration
    let fill: Color
    let ink: Color
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        let down = configuration.isPressed
        configuration.label
            .font(Fonts.pixel(15, .medium))
            .foregroundStyle(ink)
            .padding(.horizontal, 12).padding(.vertical, 8)
            .frame(minHeight: 40)
            .background {
                ZStack {
                    PixelFrame(step: 2).fill(ink.opacity(0.4)).offset(y: down ? 0 : 2.5)
                    PixelFrame(step: 2).fill(fill)
                    if down { PixelFrame(step: 2).fill(ink.opacity(0.1)) }
                    PixelFrame(step: 2).inset(by: 2).stroke(Ink.sheen.opacity(down ? 0 : 0.8), lineWidth: 1).padding(1)
                    PixelFrame(step: 2).stroke(ink, lineWidth: 2)
                }
            }
            .offset(y: down ? 2 : 0)
            .scaleEffect(x: down && !reduceMotion ? 1.03 : 1, y: down && !reduceMotion ? 0.95 : 1, anchor: .bottom)
            .opacity(isEnabled ? 1 : 0.55)
            .contentShape(Rectangle())
            .animation(down ? .easeOut(duration: 0.06) : Motion.of(Motion.press, reduce: reduceMotion), value: down)
    }
}

/// For tiles, tabs and icon buttons that draw themselves: a gentle squish when pressed.
struct SquishStyle: ButtonStyle {
    var scale: CGFloat = 0.92
    func makeBody(configuration: Configuration) -> some View {
        SquishBody(configuration: configuration, scale: scale)
    }
}
private struct SquishBody: View {
    let configuration: ButtonStyleConfiguration
    let scale: CGFloat
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        let down = configuration.isPressed
        configuration.label
            .scaleEffect(down && !reduceMotion ? scale : 1)
            .opacity(down ? 0.8 : (isEnabled ? 1 : 0.5))
            .contentShape(Rectangle())
            .animation(down ? .easeOut(duration: 0.06) : Motion.of(Motion.press, reduce: reduceMotion), value: down)
    }
}

/// The little cross that closes a card, with a full-size place to put a thumb.
struct CloseButton: View {
    var label = "Close"
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            PixelIcon(rows: PixelIcon.close, color: Ink.ink, scale: 2.4).frame(width: 44, height: 44)
        }
        .buttonStyle(SquishStyle(scale: 0.8))
        .accessibilityLabel(label)
    }
}

/// The top of every parchment card: a blackletter title, something optional on the right, the cross, and a flourish.
struct SheetHeader<Accessory: View>: View {
    let title: String
    let onClose: () -> Void
    let accessory: Accessory
    init(title: String, onClose: @escaping () -> Void, @ViewBuilder accessory: () -> Accessory) {
        self.title = title; self.onClose = onClose; self.accessory = accessory()
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .center, spacing: 8) {
                Text(title).font(Fonts.blackletter(30)).foregroundStyle(Ink.ink).lineLimit(1).minimumScaleFactor(0.7)
                    .accessibilityAddTraits(.isHeader)
                Spacer(minLength: 4)
                accessory
                CloseButton(action: onClose).padding(.trailing, -10)
            }
            Flourish().padding(.top, -4)
        }
    }
}
extension SheetHeader where Accessory == EmptyView {
    init(title: String, onClose: @escaping () -> Void) { self.init(title: title, onClose: onClose, accessory: { EmptyView() }) }
}

/// A tab drawn as an inked plate when chosen and an outline when not (dialogue tabs, the satchel).
struct PixelTab: View {
    let title: String
    let on: Bool
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(title).font(Fonts.pixel(13, .semibold))
                .foregroundStyle(on ? Ink.parchment : Ink.inkSoft)
                .padding(.horizontal, 10).padding(.vertical, 6)
                .background { if on { PixelFrame(step: 2).fill(Ink.ink) } else { PixelFrame(step: 2).stroke(Ink.faded, lineWidth: 1.5) } }
                .frame(minHeight: 36)
        }
        .buttonStyle(SquishStyle())
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

/// Tiny pixel icons drawn from strings, so they match the canvas art.
struct PixelIcon: View {
    let rows: [String]
    var color: Color = Ink.ink
    var scale: CGFloat = 2
    var body: some View {
        Canvas { ctx, _ in
            for (y, row) in rows.enumerated() {
                for (x, ch) in row.enumerated() where ch == "X" {
                    ctx.fill(Path(CGRect(x: CGFloat(x) * scale, y: CGFloat(y) * scale, width: scale, height: scale)), with: .color(color))
                }
            }
        }
        .frame(width: CGFloat(rows.first?.count ?? 0) * scale, height: CGFloat(rows.count) * scale)
    }
    static let mail = ["XXXXXXX", "XX...XX", "X.X.X.X", "X..X..X", "XXXXXXX"]
    static let note = ["..XXX", "..X.X", "..X..", "XXX..", "XXX.."]
    static let gear = [".X.X.", "XXXXX", "XX.XX", "XXXXX", ".X.X."]
    static let bell = ["..X..", ".XXX.", ".XXX.", "XXXXX", "..X.."]
    static let close = ["X...X", ".X.X.", "..X..", ".X.X.", "X...X"]
    static let back = ["..X..", ".X...", "XXXXX", ".X...", "..X.."]
    static let cog = [".X.X.", "XX.XX", ".X.X.", "XX.XX", ".X.X."]
    static let quill = ["....XX", "...XX.", "..XX..", ".XX...", "XX....", "X....."]
    static let star = ["..X..", ".XXX.", "XXXXX", ".XXX.", "..X.."]
    static let sun = ["X.X.X", ".XXX.", "XXXXX", ".XXX.", "X.X.X"]
    static let moon = [".XXX.", "XX...", "XX...", "XX...", ".XXX."]
    static let rain = [".XXX.", "XXXXX", ".....", "X.X.X", ".X.X."]
    static let cloud = [".....", ".XXX.", "XXXXX", "XXXXX", "....."]
    static let raven = ["...XX", "..XXX", "XXXX.", ".XXX.", ".X.X."]
    static let fold = ["XXXXX", ".XXX.", "..X..", ".XXX.", "XXXXX"]
    static let tear = ["XX.XX", "X.X.X", ".X.X.", "X.X.X", "XX.XX"]
}
