import SwiftUI
import Combine

struct SpellbookView: View {
    @Bindable var book: WizardBook
    var onClose: () -> Void
    @State private var draft = ""
    @State private var confirmClear = false
    @FocusState private var writing: Bool

    var body: some View {
        VStack(spacing: 0) {
            header
            pagesView
            spells
            inkwell
        }
        .background { page }
        .padding(10)
        .background { cover }
        .padding(.horizontal, 8)
        .padding(.top, 6)
        .confirmationDialog("Tear out every page?", isPresented: $confirmClear, titleVisibility: .visible) {
            Button("Tear them out", role: .destructive) { book.spell("clear") }
        } message: { Text("Clear removes this conversation from this phone. Compact keeps the most recent pages.") }
    }

    // MARK: binding
    private var cover: some View {
        ZStack {
            PixelFrame(step: 4).fill(Ink.leatherDeep).offset(y: 4)
            PixelFrame(step: 4).fill(Ink.leather)
            PixelFrame(step: 4).inset(by: 5).stroke(Ink.gold.opacity(0.55), style: StrokeStyle(lineWidth: 2, dash: [4, 4]))
            PixelFrame(step: 4).stroke(Ink.leatherDeep, lineWidth: 4)
        }
        .overlay(alignment: .topLeading) { corner }
        .overlay(alignment: .topTrailing) { corner.scaleEffect(x: -1) }
        .overlay(alignment: .bottomLeading) { corner.scaleEffect(y: -1) }
        .overlay(alignment: .bottomTrailing) { corner.scaleEffect(x: -1, y: -1) }
    }
    private var corner: some View {
        PixelIcon(rows: ["XXXX.", "XX...", "X.X..", "X..X.", "....."], color: Ink.gold, scale: 3).padding(4)
    }
    private var page: some View {
        ZStack {
            PixelFrame(step: 3).fill(Ink.parchment)
            // ruled lines and a red margin, like a real ledger page
            Canvas { ctx, size in
                var y: CGFloat = 70
                while y < size.height - 8 {
                    ctx.fill(Path(CGRect(x: 12, y: y, width: size.width - 24, height: 1)), with: .color(Ink.parchmentShade.opacity(0.45)))
                    y += 26
                }
                ctx.fill(Path(CGRect(x: 30, y: 8, width: 1.5, height: size.height - 16)), with: .color(Ink.red.opacity(0.25)))
            }
            PixelFrame(step: 3).stroke(Ink.leatherDeep, lineWidth: 2)
        }
    }

    private var header: some View {
        VStack(spacing: 2) {
            HStack {
                PixelIcon(rows: PixelIcon.star, color: Ink.goldDeep, scale: 2.4)
                Text("The Spellbook of Thistlewick").font(Fonts.blackletter(30)).foregroundStyle(Ink.ink).lineLimit(1).minimumScaleFactor(0.7)
                PixelIcon(rows: PixelIcon.star, color: Ink.goldDeep, scale: 2.4)
            }
            .padding(.horizontal, 40)   // room for the close button, mirrored so the title stays centred
            .frame(maxWidth: .infinity)
            .overlay(alignment: .trailing) {
                Button(action: onClose) { PixelIcon(rows: PixelIcon.close, color: Ink.ink, scale: 2.4).padding(10) }
                    .accessibilityLabel("Close the book")
            }
            status
        }
        .padding(.top, 12).padding(.horizontal, 10)
    }
    private var status: some View {
        Group {
            if book.busy { SpellStatus(text: book.doing.isEmpty ? (book.casting ? "Thistlewick is weaving a spell" : "Thistlewick is working on something") : "Thistlewick is \(book.doing)") }
            else { Text(book.model.isEmpty ? "bound in violet leather" : "bound to \(book.model)").font(Fonts.pixel(12)).foregroundStyle(Ink.faded) }
        }
        .frame(height: 18)
    }

    // MARK: pages
    private var pagesView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 18) {
                    if book.loading && book.pages.isEmpty { SpellStatus(text: "Opening the book").padding(.top, 30).frame(maxWidth: .infinity) }
                    if !book.loading && book.pages.isEmpty {
                        Text("A blank page. Write to Thistlewick below and he'll answer here.").font(Fonts.pixel(15)).foregroundStyle(Ink.faded).padding(.top, 24)
                    }
                    ForEach(book.pages) { p in entry(p).id(p.id) }
                    if book.casting { SpellStatus(text: "the ink is still moving").padding(.leading, 26) }
                    if let e = book.error { Text(e).font(Fonts.pixel(13)).foregroundStyle(Ink.red).padding(.leading, 26) }
                    Color.clear.frame(height: 1).id("end")
                }
                .padding(.leading, 12).padding(.trailing, 16).padding(.vertical, 12)
            }
            .scrollIndicators(.hidden)
            .defaultScrollAnchor(.bottom)
            .onChange(of: book.pages.count) { withAnimation(.smooth) { proxy.scrollTo("end", anchor: .bottom) } }
            .onChange(of: book.casting) { withAnimation(.smooth) { proxy.scrollTo("end", anchor: .bottom) } }
        }
    }
    @ViewBuilder private func entry(_ p: Page) -> some View {
        if p.role == "joe" {
            VStack(alignment: .trailing, spacing: 3) {
                Text(p.text).font(Fonts.pixel(16)).foregroundStyle(Ink.quill).multilineTextAlignment(.trailing).textSelection(.enabled)
                Text("\u{2014} You").font(Fonts.blackletter(18)).foregroundStyle(Ink.quill.opacity(0.7))
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
            .padding(.leading, 50)
        } else {
            VStack(alignment: .leading, spacing: 6) {
                if p.notice == true {
                    Text("NOTICE").font(Fonts.pixel(10, .bold)).foregroundStyle(Ink.parchment)
                        .padding(.horizontal, 5).padding(.vertical, 2).background(Ink.red)
                }
                illuminated(p.text)
                if let m = p.marg { MarginNote(marg: m) }
            }
            .padding(.leading, 26)
        }
    }
    /// the wizard's words, with a gilded drop cap
    private func illuminated(_ text: String) -> some View {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        let first = trimmed.first.map(String.init) ?? ""
        let rest = String(trimmed.dropFirst())
        let startsWithLetter = trimmed.first?.isLetter ?? false
        return HStack(alignment: .top, spacing: 4) {
            if startsWithLetter {
                Text(first).font(Fonts.blackletter(44)).foregroundStyle(Ink.goldDeep)
                    .frame(width: 34, height: 40)
                    .background { PixelFrame(step: 2).fill(Ink.leather.opacity(0.12)) }
                    .padding(.top, 2)
            }
            Text(markdown(startsWithLetter ? rest : trimmed))
                .font(Fonts.pixel(16)).foregroundStyle(Ink.ink).lineSpacing(4).textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
    private func markdown(_ s: String) -> AttributedString {
        (try? AttributedString(markdown: s, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace))) ?? AttributedString(s)
    }

    // MARK: spells + writing
    private var spells: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                spellButton("Keep recent", icon: PixelIcon.fold, hint: "Keep twelve recent pages and remove older ones") { book.spell("compact") }
                spellButton("Clear", icon: PixelIcon.tear, hint: "Tear out every page") { confirmClear = true }
                Spacer()
            }
            if let n = book.spellNote { Text(n).font(Fonts.pixel(12)).foregroundStyle(Ink.inkSoft).transition(.opacity) }
        }
        .padding(.horizontal, 14).padding(.top, 6)
    }
    private func spellButton(_ title: String, icon: [String], hint: String, action: @escaping () -> Void) -> some View {
        Button { Haptics.play("light"); action() } label: {
            HStack(spacing: 6) {
                PixelIcon(rows: icon, color: Ink.arcane, scale: 2)
                Text(title).font(Fonts.pixel(13, .semibold))
            }
        }
        .buttonStyle(PixelButtonStyle(fill: Ink.leather, ink: Ink.leatherDeep))
        .foregroundStyle(Ink.parchment)
        .environment(\.colorScheme, .dark)
        .disabled(book.busy)
        .opacity(book.busy ? 0.55 : 1)
        .accessibilityHint(hint)
    }
    private var inkwell: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField("", text: $draft, prompt: Text("Write in the book\u{2026}").foregroundStyle(Ink.faded), axis: .vertical)
                .font(Fonts.pixel(16)).foregroundStyle(Ink.quill).tint(Ink.quill)
                .lineLimit(1...5)
                .focused($writing)
                .submitLabel(.send)
                .onChange(of: draft) { _, v in
                    guard v.contains("\n") else { return }
                    let t = v.replacingOccurrences(of: "\n", with: " ").trimmingCharacters(in: .whitespaces); draft = ""
                    if !t.isEmpty { book.cast(t) }
                }
                .padding(.horizontal, 12).padding(.vertical, 10)
                .background { PixelFrame(step: 2).fill(Ink.parchmentDeep); PixelFrame(step: 2).stroke(Ink.inkSoft, lineWidth: 2) }
            Button {
                let t = draft; draft = ""; book.cast(t)
            } label: {
                HStack(spacing: 5) { PixelIcon(rows: PixelIcon.star, color: Ink.gold, scale: 2); Text("Cast").font(Fonts.pixel(15, .bold)) }
                    .foregroundStyle(Ink.parchment)
            }
            .buttonStyle(PixelButtonStyle(fill: Ink.leather, ink: Ink.leatherDeep))
            .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty || book.busy)
        }
        .padding(.horizontal, 14).padding(.top, 8).padding(.bottom, 14)
    }
}

/// A line of text with runes that cycle, for anything the wizard is busy with.
struct SpellStatus: View {
    var text: String
    @State private var i = 0
    private let runes = ["\u{16A0}", "\u{16B1}", "\u{16C7}", "\u{16DF}", "\u{16A8}", "\u{16D7}", "\u{16C9}", "\u{16DE}"]
    private let timer = Timer.publish(every: 0.18, on: .main, in: .common).autoconnect()
    var body: some View {
        HStack(spacing: 6) {
            Text(runes[i % runes.count] + runes[(i + 3) % runes.count]).font(.system(size: 13, weight: .bold)).foregroundStyle(Ink.arcane)
            Text(text + String(repeating: ".", count: i / 2 % 4)).font(Fonts.pixel(12, .medium)).foregroundStyle(Ink.leather)
        }
        .onReceive(timer) { _ in i += 1 }
    }
}


/// A folded note in the margin under Thistlewick's answer: one compact line of what he did,
/// unfolding into the spells cast, memories consulted and his private thought.
struct MarginNote: View {
    let marg: Marginalia
    @State private var open = false

    private var summary: String {
        var bits: [String] = []
        if let t = marg.tools, !t.isEmpty { bits.append("\(t.count) spell\(t.count == 1 ? "" : "s")") }
        if let m = marg.memories, !m.isEmpty { bits.append("\(m.count) memor\(m.count == 1 ? "y" : "ies")") }
        if let s = marg.skills, !s.isEmpty { bits.append("\(s.count) skill\(s.count == 1 ? "" : "s")") }
        if marg.thought != nil { bits.append("a thought") }
        return bits.joined(separator: " \u{00B7} ")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Button {
                Haptics.play("light"); Sound.shared.play("page")
                withAnimation(.snappy(duration: 0.25)) { open.toggle() }
            } label: {
                HStack(spacing: 6) {
                    PixelIcon(rows: open ? ["XXXXX", ".XXX.", "..X.."] : ["X..", "XX.", "XXX", "XX.", "X.."], color: Ink.leather.opacity(0.75), scale: 1.6)
                    Text(summary).font(Fonts.pixel(11, .medium)).foregroundStyle(Ink.faded)
                }
                .padding(.vertical, 4).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(open ? "Hide what Thistlewick did" : "Show what Thistlewick did: \(summary)")

            if open {
                VStack(alignment: .leading, spacing: 8) {
                    if let tools = marg.tools, !tools.isEmpty {
                        section("Spells cast") {
                            ForEach(Array(tools.enumerated()), id: \.offset) { _, t in
                                VStack(alignment: .leading, spacing: 1) {
                                    HStack(spacing: 5) {
                                        Circle().fill(t.ok ? Ink.leaf : Ink.red).frame(width: 5, height: 5)
                                        Text(t.name.replacingOccurrences(of: "_", with: " ")).font(Fonts.pixel(12, .semibold)).foregroundStyle(Ink.inkSoft)
                                    }
                                    if !t.args.isEmpty && t.args != t.name {
                                        Text(t.args).font(Fonts.pixel(11)).foregroundStyle(Ink.faded).lineLimit(2).padding(.leading, 10)
                                    }
                                }
                            }
                        }
                    }
                    if let m = marg.memories, !m.isEmpty { section("Remembered") { ForEach(m, id: \.self) { line($0) } } }
                    if let s = marg.skills, !s.isEmpty { section("Skills") { ForEach(s, id: \.self) { line($0) } } }
                    if let th = marg.thought { section("His thought") { Text(th).font(Fonts.pixel(11)).italic().foregroundStyle(Ink.faded).lineLimit(8).textSelection(.enabled) } }
                }
                .padding(10)
                .background { PixelFrame(step: 2).fill(Ink.leather.opacity(0.07)) }
                .overlay { PixelFrame(step: 2).stroke(Ink.parchmentShade, lineWidth: 1) }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }
    private func section<C: View>(_ title: String, @ViewBuilder _ c: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title.uppercased()).font(Fonts.pixel(9, .bold)).foregroundStyle(Ink.leather.opacity(0.8)).kerning(1)
            c()
        }
    }
    private func line(_ s: String) -> some View {
        Text("\u{2022} " + s).font(Fonts.pixel(11)).foregroundStyle(Ink.faded).lineLimit(3)
    }
}
