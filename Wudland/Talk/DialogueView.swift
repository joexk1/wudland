import SwiftUI
import Combine

struct DialogueView: View {
    @Bindable var convo: Conversation
    var store: VillageStore
    var game: Game
    var trades = false
    var onClose: () -> Void
    @State private var draft = ""
    @State private var tab = 0
    @State private var busyRow: String?
    @State private var markedRead: Set<String> = []
    @FocusState private var typing: Bool

    private var v: Villager { convo.villager }
    private var hasLedger: Bool { if case .none = v.ledger { return false }; return true }

    var body: some View {
        VStack(spacing: 0) {
            header
            if tab == 2 { WaresView(npc: v.id, econ: game.economy, game: game) }
            else if hasLedger && tab == 1 { ledger } else { transcript }
            if tab == 0 { chips; input }
        }
        .padding(.top, 4)
        .parchment(step: 3)
        .overlay(alignment: .topLeading) {
            // a fixed slot: the plate hugs short names and shrinks long ones before they reach the tabs
            namePlate.frame(width: 190, alignment: .leading).offset(x: 14, y: -16)
        }
        .padding(.horizontal, 10)
        .padding(.bottom, 6)
    }

    // MARK: header
    private var namePlate: some View {
        Text(v.name)
            .font(Fonts.blackletter(26))
            .foregroundStyle(Ink.parchment)
            .lineLimit(1).minimumScaleFactor(0.6)
            .padding(.horizontal, 12).padding(.top, 3).padding(.bottom, 1)
            .parchment(Ink.ink, line: Ink.ink, step: 2, shadow: false)
    }
    private var header: some View {
        HStack(alignment: .center, spacing: 8) {
            Spacer(minLength: 0)
            if hasLedger || trades { tabButton("Talk", 0) }
            if hasLedger { tabButton(ledgerTitle, 1) }
            if trades { tabButton("Wares", 2) }
            Button { onClose() } label: { PixelIcon(rows: PixelIcon.close, color: Ink.ink, scale: 2.4).padding(10) }
                .accessibilityLabel("Say goodbye")
        }
        .padding(.leading, 14).padding(.trailing, 4).padding(.top, hasLedger || trades ? 22 : 10)
    }
    private func tabButton(_ title: String, _ i: Int) -> some View {
        Button { withAnimation(.snappy(duration: 0.2)) { tab = i }; Sound.shared.play("tap"); Haptics.play("soft") } label: {
            Text(title).font(Fonts.pixel(13, .semibold))
                .foregroundStyle(tab == i ? Ink.parchment : Ink.inkSoft)
                .padding(.horizontal, 9).padding(.vertical, 5)
                .background { if tab == i { PixelFrame(step: 2).fill(Ink.ink) } else { PixelFrame(step: 2).stroke(Ink.faded, lineWidth: 1.5) } }
        }.buttonStyle(.plain)
    }
    private var ledgerTitle: String {
        switch v.ledger {
        case .letters(let l): return "Letters \(l.filter(\.unread).count)"
        case .chats(let c): return "Tables \(c.count)"
        case .agents(let a): return "Ledger \(a.count)"
        case .events(let e): return "Days \(e.count)"
        case .notes(let n): return "Notices \(n.count)"
        case .agentFacts: return "Work log"
        case .chatLines: return "Overheard"
        case .none: return ""
        }
    }

    // MARK: transcript
    private var transcript: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if let note = convo.modelNote {
                        Text(note).font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
                    }
                    ForEach(convo.lines) { line in
                        if line.joe {
                            Text(line.text)
                                .font(Fonts.pixel(15))
                                .foregroundStyle(Ink.quill)
                                .frame(maxWidth: .infinity, alignment: .trailing)
                                .multilineTextAlignment(.trailing)
                                .padding(.leading, 40)
                        } else if line.text.isEmpty && convo.thinking {
                            ThinkingDots()
                        } else {
                            Text(line.text)
                                .font(Fonts.pixel(17))
                                .foregroundStyle(Ink.ink)
                                .lineSpacing(3)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .textSelection(.enabled)
                        }
                    }
                    Color.clear.frame(height: 1).id("end")
                }
                .padding(.horizontal, 18).padding(.vertical, 8)
            }
            .scrollIndicators(.hidden)
            .onChange(of: convo.lines.last?.text) { proxy.scrollTo("end", anchor: .bottom) }
            .onChange(of: convo.lines.count) { withAnimation { proxy.scrollTo("end", anchor: .bottom) } }
        }
    }

    private var chips: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(v.asks, id: \.self) { q in
                    Button(q) { Sound.shared.play("tap"); Haptics.play("light"); convo.ask(q) }
                        .buttonStyle(PixelButtonStyle())
                        .disabled(convo.speaking || convo.thinking)
                }
            }
            .padding(.horizontal, 14).padding(.vertical, 6)
        }
        .scrollIndicators(.hidden)
    }

    private var input: some View {
        HStack(spacing: 8) {
            TextField("", text: $draft, prompt: Text("Say something\u{2026}").foregroundStyle(Ink.faded), axis: .vertical)
                .font(Fonts.pixel(16))
                .foregroundStyle(Ink.ink)
                .tint(Ink.ink)
                .lineLimit(1...3)
                .focused($typing)
                .submitLabel(.send)
                .onSubmit(send)
                // a vertical field turns Return into a newline: treat it as Send instead
                .onChange(of: draft) { _, v in if v.contains("\n") { draft = v.replacingOccurrences(of: "\n", with: " ").trimmingCharacters(in: .whitespaces); send() } }
                .padding(.horizontal, 12).padding(.vertical, 9)
                .background { PixelFrame(step: 2).fill(Ink.parchmentDeep); PixelFrame(step: 2).stroke(Ink.inkSoft, lineWidth: 2) }
            Button(action: send) { PixelIcon(rows: PixelIcon.quill, color: Ink.parchment, scale: 2.6).frame(width: 22, height: 22) }
                .buttonStyle(PixelButtonStyle(fill: Ink.ink, ink: Ink.ink))
                .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty || convo.thinking)
                .accessibilityLabel("Say it")
        }
        .padding(.horizontal, 14).padding(.top, 2).padding(.bottom, 14)
    }
    private func send() {
        let t = draft; draft = ""
        Sound.shared.play("tap")
        convo.ask(t)
    }

    // MARK: ledger
    private var ledger: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                switch v.ledger {
                case .letters(let ls): ForEach(ls) { l in letterRow(l) }
                case .chats(let cs): ForEach(cs) { c in chatRow(c) }
                case .agents(let ns): ForEach(ns) { n in agentRow(n) }
                case .events(let es): ForEach(es) { e in row(title: e.title, sub: When.event(e) + ((e.location ?? "").isEmpty ? "" : " \u{00B7} \(e.location!)"), mark: nil) { readEvent(e) } }
                case .notes(let ns): ForEach(ns) { n in row(title: n.title, sub: When.ago(n.at), mark: n.read ? nil : "!") { tab = 0; convo.read("Read me \u{201C}\(n.title)\u{201D}", material: n.body, ask: "Proclaim this notice to the lord in your own words, keeping the facts exact.") } }
                case .agentFacts(let n): agentFacts(n)
                case .chatLines(let c): ForEach(Array(c.recent.enumerated()), id: \.offset) { _, m in chatLine(m) }
                case .none: EmptyView()
                }
            }
            .padding(.horizontal, 14).padding(.vertical, 8)
        }
        .scrollIndicators(.hidden)
        .frame(maxHeight: .infinity)
    }
    private func row(title: String, sub: String, mark: String?, faded: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: { Sound.shared.play("page"); Haptics.play("light"); action() }) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(mark ?? " ").font(Fonts.pixel(14, .bold)).foregroundStyle(Ink.red).frame(width: 10)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(Fonts.pixel(15, .medium)).foregroundStyle(faded ? Ink.faded : Ink.ink).lineLimit(2).multilineTextAlignment(.leading)
                    Text(sub).font(Fonts.pixel(12)).foregroundStyle(Ink.faded).lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, 9)
            .contentShape(Rectangle())
            .overlay(alignment: .bottom) { DottedRule() }
        }
        .buttonStyle(.plain)
    }
    private func letterRow(_ l: Letter) -> some View {
        let unread = l.unread && !markedRead.contains(l.id)
        return HStack(spacing: 0) {
            row(title: l.subject, sub: "\(l.from) \u{00B7} \(When.ago(l.date))", mark: unread ? "\u{2022}" : nil, faded: (l.noise ?? false) && !unread) {
                Task { await openLetter(l) }
            }
            if unread {
                Button { Task { LinkHub.shared.markRead(l.id); markedRead.insert(l.id); Sound.shared.play("coin"); Haptics.play("success"); await store.refresh() } } label: {
                    Text("seal").font(Fonts.pixel(11, .semibold)).foregroundStyle(Ink.inkSoft)
                        .padding(.horizontal, 7).padding(.vertical, 4)
                        .background { PixelFrame(step: 2).stroke(Ink.faded, lineWidth: 1.5) }
                }
                .buttonStyle(.plain).padding(.leading, 6)
                .accessibilityLabel("Mark as read")
            }
        }
        .opacity(busyRow == l.id ? 0.5 : 1)
    }
    private func chatRow(_ c: Chat) -> some View {
        row(title: c.name + (c.group ? " (group)" : ""), sub: (c.recent.last.map { "\($0.who): \($0.text)" } ?? "") , mark: c.waiting ? "!" : nil) {
            Task { await openChat(c) }
        }
    }
    private func agentRow(_ n: AgentNode) -> some View {
        row(title: n.name, sub: "\(n.source ?? "agent") \u{00B7} \(n.host?.uppercased() ?? "") \u{00B7} \(n.busy ? "working" : (n.failed ?? false) ? "failed" : When.ago(n.last_activity))", mark: n.busy ? "\u{2022}" : (n.failed ?? false) ? "!" : nil) {
            Task { await openAgent(n) }
        }
    }
    private func agentFacts(_ n: AgentNode) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            fact("Machine", n.host?.uppercased() ?? "?")
            fact("Kind", n.source ?? "agent")
            fact("Model", n.model ?? "?")
            fact("Folder", n.where ?? "?")
            fact("Started", When.ago(n.started))
            fact("Last seen", When.ago(n.last_activity))
            fact("Tool calls", "\(n.tool_calls ?? 0)")
            Text("Recent work").font(Fonts.pixel(13, .semibold)).foregroundStyle(Ink.inkSoft).padding(.top, 6)
            ForEach(Array((n.detail ?? []).enumerated()), id: \.offset) { _, d in
                Text(d).font(.system(size: 12, design: .monospaced)).foregroundStyle(Ink.ink).lineLimit(3)
                    .padding(.vertical, 3).overlay(alignment: .bottom) { DottedRule() }
            }
        }
    }
    private func fact(_ k: String, _ val: String) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(k).font(Fonts.pixel(13)).foregroundStyle(Ink.faded).frame(width: 84, alignment: .leading)
            Text(val).font(Fonts.pixel(14, .medium)).foregroundStyle(Ink.ink).lineLimit(2)
        }
    }
    private func chatLine(_ m: ChatLine) -> some View {
        VStack(alignment: m.me ? .trailing : .leading, spacing: 2) {
            Text(m.who + " \u{00B7} " + When.ago(m.at)).font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
            Text(m.text).font(Fonts.pixel(15)).foregroundStyle(m.me ? Ink.quill : Ink.ink).multilineTextAlignment(m.me ? .trailing : .leading)
        }
        .frame(maxWidth: .infinity, alignment: m.me ? .trailing : .leading)
        .padding(.vertical, 6)
    }

    // MARK: ledger actions
    private func openLetter(_ l: Letter) async {
        busyRow = l.id
        defer { busyRow = nil }
        tab = 0
        let material = "From: \(l.from)\nSubject: \(l.subject)\n\(l.summary ?? "")"
        convo.read("Read me \u{201C}\(l.subject)\u{201D}", material: material,
                   ask: "the lord hands you this letter. Tell him who it's from, what it actually says, and whether he needs to do anything (with any deadline). Two or three sentences.")
    }
    private func openChat(_ c: Chat) async {
        busyRow = c.id
        defer { busyRow = nil }
        tab = 0
        let lines = c.recent
        let material = lines.suffix(24).map { "\($0.who): \($0.text)" }.joined(separator: "\n")
        convo.read("What's happening at \(c.name)'s table?", material: material,
                   ask: "Tell the lord what this conversation with \(c.name) is about lately and whether he owes them a reply. Two or three sentences.")
    }
    private func openAgent(_ n: AgentNode) async {
        busyRow = n.id
        defer { busyRow = nil }
        tab = 0
        let full = n
        let material = "\(full.name) (\(full.source ?? "agent") on \(full.host?.uppercased() ?? "?"), model \(full.model ?? "?"), folder \(full.where ?? "?"), \(full.busy ? "working now" : full.status ?? "done"), \(full.tool_calls ?? 0) tool calls)\n" + (full.detail ?? []).joined(separator: "\n")
        convo.read("What's \(n.name) up to?", material: material,
                   ask: "Tell the lord, plainly, what this artificer (an AI agent) is working on and how far along it is. Two or three sentences.")
    }
    private func readEvent(_ e: Event) {
        tab = 0
        convo.read("Tell me about \u{201C}\(e.title)\u{201D}", material: "\(e.title)\nWhen: \(When.event(e))\nWhere: \(e.location ?? "not given")",
                   ask: "Remind the lord about this in your own words, with the exact time.")
    }
}

struct ThinkingDots: View {
    @State private var phase = 0
    let timer = Timer.publish(every: 0.28, on: .main, in: .common).autoconnect()
    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<3) { i in Rectangle().fill(Ink.inkSoft).frame(width: 5, height: 5).offset(y: phase == i ? -3 : 0) }
        }
        .padding(.vertical, 8)
        .onReceive(timer) { _ in phase = (phase + 1) % 3 }
        .accessibilityLabel("Thinking")
    }
}

struct DottedRule: View {
    var color: Color = Ink.parchmentShade
    var body: some View {
        Canvas { ctx, size in
            var x: CGFloat = 0
            while x < size.width { ctx.fill(Path(CGRect(x: x, y: 0, width: 2, height: 2)), with: .color(color)); x += 5 }
        }
        .frame(height: 2)
    }
}
