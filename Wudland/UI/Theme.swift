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
    // the spellbook
    static let leather = Color(red: 0.24, green: 0.15, blue: 0.30)
    static let leatherDeep = Color(red: 0.14, green: 0.08, blue: 0.18)
    static let arcane = Color(red: 0.70, green: 0.60, blue: 1.0)
    static let quill = Color(red: 0.18, green: 0.26, blue: 0.46)
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
    func body(content: Content) -> some View {
        content
            .background {
                ZStack {
                    if shadow { PixelFrame(step: step).fill(line.opacity(0.35)).offset(y: step) }
                    PixelFrame(step: step).fill(fill)
                    PixelFrame(step: step).inset(by: step).stroke(Color.white.opacity(0.45), lineWidth: 1.5).padding(1)
                    PixelFrame(step: step).stroke(line, lineWidth: step)
                }
            }
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
    func parchment(_ fill: Color = Ink.parchment, line: Color = Ink.ink, step: CGFloat = 3, shadow: Bool = true) -> some View {
        modifier(Parchment(fill: fill, line: line, step: step, shadow: shadow))
    }
}

/// A chunky pixel button that presses down.
struct PixelButtonStyle: ButtonStyle {
    var fill: Color = Ink.parchmentDeep
    var ink: Color = Ink.ink
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Fonts.pixel(15, .medium))
            .foregroundStyle(ink)
            .padding(.horizontal, 12).padding(.vertical, 8)
            .background {
                ZStack {
                    PixelFrame(step: 2).fill(ink.opacity(0.4)).offset(y: configuration.isPressed ? 0 : 2.5)
                    PixelFrame(step: 2).fill(configuration.isPressed ? fill.opacity(0.75) : fill)
                    PixelFrame(step: 2).stroke(ink, lineWidth: 2)
                }
            }
            .offset(y: configuration.isPressed ? 2 : 0)
            .animation(.easeOut(duration: 0.08), value: configuration.isPressed)
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
