import Foundation

/// Who each villager is, what they know (their FACTS, built from the live village), how they open a
/// conversation, and what the lord can quickly ask them. The on-device model plays them; the scripted
/// `greeting` is the fallback when Apple Intelligence is unavailable and the first line while it warms up.
struct Villager {
    var id: String
    var name: String
    var role: String
    var voice: String            // how they talk
    var pitch: Double            // text blip pitch
    var facts: String            // what they know right now
    var greeting: String         // scripted opener (no model needed)
    var asks: [String]           // quick questions
    var ledger: Ledger = .none   // a list the lord can browse with them
}

enum Ledger {
    case none
    case letters([Letter])
    case chats([Chat])
    case agents([AgentNode])
    case events([Event])
    case notes([Note])
    case agentFacts(AgentNode)
    case chatLines(Chat)
}

enum Cast {
    static var world: String { """
    Wudland is a tiny, cozy medieval village floating on an island. \(Lord.called) is its lord, and the only human you ever speak to. \
    The village is a living picture of the lord's real life: the Raven Post holds letters sent by linked tools, the Gossiping Goose tavern hears his \
    village stories, the Artificers' Guild is where his AI agents work, the Bell Tower keeps his calendar, the Notice Board \
    holds Thistlewick's notes, and Thistlewick the wizard (his personal AI) lives in the tower.
    """
    }
    static var rules: String { """
    Rules: stay in character. Speak in 1 to 3 short sentences unless the lord asks for more. Warm, a little whimsical, lightly \
    medieval in flavour, but keep every real fact exact and plain: names, subjects, numbers, times. Only state facts listed \
    under FACTS; never invent emails, people, events or numbers. If the lord asks about something you don't know, say so kindly \
    and point him to the right place in the village. No lists or markdown, just speech.
    """
    }

    static func make(_ id: String, name: String, v: Village, agent: AgentNode? = nil, chat: Chat? = nil) -> Villager {
        let mail = v.mail, wa = v.whatsapp, cal = v.calendar, notes = v.notices, wx = v.weather, ag = v.agents
        switch id {
        case "pim":
            let letters = mail?.letters ?? []
            let unread = letters.filter(\.unread)
            let people = unread.filter { !($0.noise ?? false) }
            let facts = "Unread letters: \(mail?.unread_count ?? 0) (\(mail?.unread_people ?? 0) look like they're from real people, the rest are shop and newsletter mail).\n"
                + unread.prefix(10).map { "- From \($0.from): \"\($0.subject)\" (\(When.ago($0.date)))\($0.flagged == true ? " [flagged]" : "")\(($0.noise ?? false) ? " [bulk]" : "")" }.joined(separator: "\n")
            let top = people.first ?? unread.first
            let greet: String
            if let n = mail?.unread_count, n > 0, let top {
                greet = "Ah, m'lord! \(n) letter\(n == 1 ? "" : "s") in your cubby. The one worth your eyes first: \(top.from), about \u{201C}\(top.subject)\u{201D}."
            } else { greet = "Not a single letter waiting, m'lord. The ravens are resting their wings today." }
            return Villager(id: id, name: name, role: "the village postmaster, who sorts the lord's letters into cubbies",
                            voice: "a fussy, kindly old postmaster who loves a tidy cubby", pitch: 520, facts: facts, greeting: greet,
                            asks: ["What's important?", "Anything I can ignore?", "Who's written to me?"], ledger: .letters(Array(letters.prefix(18))))
        case "mags":
            let chats = wa?.chats ?? []
            let facts = (wa?.last_sync.map { "The tavern last heard news \(When.ago($0)).\n" } ?? "")
                + chats.prefix(8).map { c in
                    "- \(c.name)\(c.group ? " (group)" : ""), last talk \(When.ago(c.last_at))\(c.waiting ? ", waiting on the lord's reply" : ""): "
                    + c.recent.suffix(2).map { "\($0.who): \($0.text)" }.joined(separator: " / ")
                }.joined(separator: "\n")
            let waiting = chats.filter(\.waiting)
            let greet = waiting.isEmpty
                ? (chats.first.map { "Pull up a stool, love. Quiet night. Last whispers came from \($0.name), \(When.ago($0.last_at))." } ?? "Pull up a stool, love. Not a whisper in here tonight.")
                : "Pull up a stool, love! \(waiting.count == 1 ? waiting[0].name + " is" : "\(waiting.count) folk are") still waiting on a word back from you."
            return Villager(id: id, name: name, role: "the barkeep of the Gossiping Goose, who hears the village news",
                            voice: "a warm, gossipy barkeep who calls everyone 'love'", pitch: 620, facts: facts, greeting: greet,
                            asks: ["Who's waiting on me?", "Any gossip?", "What did they last say?"], ledger: .chats(chats))
        case "gearwin", "guild":
            let nodes = ag?.nodes ?? []
            let busy = nodes.filter(\.busy)
            let hosts = (ag?.hosts ?? []).map { "\($0.name.uppercased()) is \($0.online ? "awake" : "asleep/offline")" }.joined(separator: ", ")
            let facts = "Machines: \(hosts).\nAgents busy right now: \(busy.count).\n"
                + nodes.prefix(10).map { n in
                    "- \(n.name) (\(n.source ?? "agent") on \(n.host?.uppercased() ?? "?"), \(n.busy ? "working now" : (n.failed ?? false) ? "failed" : "done \(When.ago(n.last_activity))")): \(n.detail?.last ?? "")"
                }.joined(separator: "\n")
            let greet = busy.isEmpty
                ? "The forge is cool, m'lord. Nobody's hammering right now; the last job finished \(When.ago(nodes.first?.last_activity))."
                : "\(busy.count) artificer\(busy.count == 1 ? " is" : "s are") at the bench: \(busy.prefix(2).map(\.name).joined(separator: " and "))."
            return Villager(id: "gearwin", name: name, role: "the guildmaster of the Artificers' Guild, who oversees the lord's AI agents on linked computers",
                            voice: "a gruff, proud master craftsman", pitch: 300, facts: facts, greeting: greet,
                            asks: ["Who's working now?", "What finished lately?", "Which machines are up?"], ledger: .agents(nodes))
        case "tobias":
            let today = cal?.today ?? [], events = cal?.events ?? []
            let facts = "Today: " + (today.isEmpty ? "nothing" : today.map { "\($0.title) (\(When.event($0)))" }.joined(separator: "; "))
                + "\nComing days:\n" + events.prefix(10).map { "- \($0.title), \(When.event($0))\(($0.location ?? "").isEmpty ? "" : " at \($0.location!)")" }.joined(separator: "\n")
            let next = events.first
            let greet = !today.isEmpty
                ? "Peace be with you, m'lord. The bell rings \(today.count) time\(today.count == 1 ? "" : "s") today; first: \(today[0].title)."
                : next.map { "A quiet day in the book, m'lord. Next in the great book: \($0.title), \(When.event($0))." } ?? "The great book of days is blank, m'lord. A rare and peaceful thing."
            return Villager(id: id, name: name, role: "the bell-keeper monk, who keeps the lord's calendar in a great book of days",
                            voice: "a gentle, serene monk", pitch: 360, facts: facts, greeting: greet,
                            asks: ["What's on today?", "What's this week?", "When am I free?"], ledger: .events(events))
        case "barnaby", "board":
            let ns = notes?.notes ?? []
            let facts = ns.prefix(6).map { "- \($0.title) (\(When.ago($0.at))): \($0.body)" }.joined(separator: "\n")
                + (notes?.briefing.map { "\nToday's briefing: \($0.text)" } ?? "")
            let top = ns.first
            let greet = top.map { "Hear ye, hear ye! Freshly nailed to the board: \u{201C}\($0.title)\u{201D}!" } ?? "Hear ye! ...well, nothing to hear today, m'lord."
            return Villager(id: "barnaby", name: name, role: "the town crier, who reads out Thistlewick's notices and the daily briefing",
                            voice: "a loud, theatrical town crier who loves a proclamation", pitch: 440, facts: facts, greeting: greet,
                            asks: ["Read me the news", "Anything urgent?", "What's the briefing?"], ledger: .notes(ns))
        case "biscuit":
            let facts = """
            Weather: \(wx.map { "\($0.temp)°C and \($0.kind), high \($0.high ?? $0.temp), tomorrow \($0.tomorrow ?? "unknown")" } ?? "unknown").
            Today's events: \((cal?.today ?? []).map(\.title).joined(separator: "; ").ifEmpty("none")).
            Unread letters: \(mail?.unread_count ?? 0). Chats waiting for the lord: \(wa?.waiting ?? 0). Agents working: \(ag?.busy ?? 0).
            Latest notice: \(notes?.notes.first.map { "\($0.title): \($0.body)" } ?? "none").
            """
            let greet = "Mrrp. \(wx.map { "\($0.temp)° and \($0.kind) outside" } ?? "Cosy in here"). \((cal?.today ?? []).isEmpty ? "Nothing on today, so naps are allowed." : "You have \((cal?.today ?? []).count) thing\((cal?.today ?? []).count == 1 ? "" : "s") today.") Purr."
            return Villager(id: id, name: name, role: "the lord's cat, who sleeps by the fire and somehow knows everything happening today",
                            voice: "a sleepy, smug, affectionate cat who says 'mrrp' and purrs, but still gives clear answers", pitch: 760, facts: facts, greeting: greet,
                            asks: ["How's my day looking?", "Weather?", "Anything I'm forgetting?"])
        case "bram":
            let facts = wx.map { "Now \($0.temp)°C, \($0.kind), wind \($0.wind ?? 0) km/h. Today's high \($0.high ?? $0.temp), low \($0.low ?? $0.temp). Tomorrow: \($0.tomorrow ?? "unknown"). Sunrise \(clock($0.sunrise)), sunset \(clock($0.sunset))." } ?? "No word from the sky today."
            let greet = wx.map { "Mornin'. \($0.kind.capitalized) and \($0.temp) degrees. Tomorrow smells like \($0.tomorrow ?? "more of the same")." } ?? "Mornin'. Can't read the sky today."
            return Villager(id: id, name: name, role: "an old farmer who reads the sky and knows the weather where the lord lives",
                            voice: "a slow, earthy old farmer full of folksy sayings", pitch: 260, facts: facts, greeting: greet,
                            asks: ["Will it rain?", "What about tomorrow?", "When's sunset?"])
        case "clank":
            let hs = ag?.hosts ?? []
            let facts = "The watch report: " + hs.map { "\($0.name.uppercased()) \($0.online ? "is up" : "is down") (\($0.detail ?? ""))" }.joined(separator: "; ")
            let down = hs.filter { !$0.online }
            let greet = down.isEmpty ? "All quiet on the walls, m'lord! The walls are quiet. Link a computer from the Lord’s Desk to hear its news." : "Halt! Er, I mean, hello. Keep an eye out: \(down.map { $0.name.uppercased() }.joined(separator: " and ")) \(down.count == 1 ? "has" : "have") gone dark."
            return Villager(id: id, name: name, role: "the village guard, who keeps watch over the lord's linked computers",
                            voice: "an earnest, slightly clumsy knight in rattly armour", pitch: 340, facts: facts, greeting: greet,
                            asks: ["Which machines are up?", "Anything suspicious?", "Tell me a tale"])
        case "hilda":
            let n = (cal?.today ?? []).count
            let facts = "Time now: \(Date().formatted(date: .omitted, time: .shortened)). Today's events: \(n). Weather: \(wx.map { "\($0.temp)°C \($0.kind)" } ?? "unknown"). Unread letters: \(mail?.unread_count ?? 0)."
            let greet = "Herbs for the weary, m'lord? \(n > 2 ? "A full day ahead; take a breath between bells." : "A gentle day. Mind you drink some water.")"
            return Villager(id: id, name: name, role: "the herbalist at the market stall, who looks after the lord's wellbeing with gentle advice",
                            voice: "a calm, motherly herbalist", pitch: 560, facts: facts, greeting: greet,
                            asks: ["I'm tired", "Help me focus", "What should I do next?"])
        case "fennick":
            let m = v.music
            let now = m?.now.flatMap { t in (t.playing ?? false) ? "\(t.name ?? "?") by \(t.artist ?? "?")" : nil }
            let recent = (m?.recent ?? []).prefix(8).map { "- \($0.name ?? "?") by \($0.artist ?? "?") (\(When.ago($0.at)))" }.joined(separator: "\n")
            let facts = (now.map { "the lord is playing RIGHT NOW: \($0).\n" } ?? "")
                + "the lord's recent music library plays, newest first:\n" + (recent.isEmpty ? "(none heard)" : recent)
                + ((m?.top ?? []).isEmpty ? "" : "\nHis favourite artists lately: \((m?.top ?? []).joined(separator: ", ")).")
            let last = m?.recent.first
            let greet: String
            if let now { greet = "Oh, I know this one! You're listening to \u{201C}\(now)\u{201D} right now. Shall I play along?" }
            else if let last { greet = "Ahh, m'lord! Last I heard you were humming \u{201C}\(last.name ?? "something")\u{201D} by \(last.artist ?? "someone"), \(When.ago(last.at)). A fine tune!" }
            else { greet = "A song for the lord of Wudland? My lute's been lonely; I haven't heard you play anything lately." }
            return Villager(id: id, name: name, role: "the travelling bard on the plaza, who hears every song the lord plays on music library",
                            voice: "a flamboyant, warm-hearted bard who speaks in a sing-song way and adores music gossip", pitch: 600, facts: facts, greeting: greet,
                            asks: ["What was I playing?", "Who've I been obsessed with?", "Sing me a verse about it"])
        case "odette":
            let facts = "You run Odette's Curiosities, the village shop. You sell hats, furniture for the lord's cottage and odd curios, and you buy gems, curios and treasures the lord finds lying about the island (better prices for rarer things). Stock changes every two hours. the lord has the 'Wares' tab to trade with you."
            return Villager(id: id, name: name, role: "the shrewd but kindly peddler who runs the village shop",
                            voice: "a sharp-eyed, theatrical shopkeeper who loves a bargain and a bit of gossip", pitch: 500, facts: facts,
                            greeting: "Welcome, welcome! Mind the armour, it bites. Have a look at my wares, or show me what treasures you've dug up.",
                            asks: ["What's good today?", "What do you buy?", "Any rare treasures about?"])
        case "wren":
            let facts = "Unread letters: \(mail?.unread_count ?? 0). Agents working in the guild: \(ag?.busy ?? 0). Chats waiting: \(wa?.waiting ?? 0)."
            return Villager(id: id, name: name, role: "a cheeky village kid who runs errands and chases chickens",
                            voice: "an excitable kid who asks lots of questions", pitch: 820, facts: facts,
                            greeting: "M’lord! M’lord! There's \(ag?.busy ?? 0) workers in the guild and \(mail?.unread_count ?? 0) letters at the post! Wanna race?",
                            asks: ["What's new?", "Tell me a secret", "Race you!"])
        default:
            if let agent { return artificer(agent, called: name) }
            if let chat { return patron(chat, mags: name) }
            return Villager(id: id, name: name, role: "a villager", voice: "friendly", pitch: 480, facts: "", greeting: "Good day, m'lord!", asks: [])
        }
    }

    static func artificer(_ n: AgentNode, called: String? = nil) -> Villager {
        let kind = n.source ?? "agent"
        let lines = (n.detail ?? []).suffix(8).map { "- \($0)" }.joined(separator: "\n")
        let facts = """
        My name in the village is \(called ?? n.name). I am an AI agent (\(kind), model \(n.model ?? "unknown")) on the lord's \(n.host?.uppercased() ?? "machine").
        Task title: \(n.name). Working folder: \(n.where ?? "unknown").
        Status: \(n.busy ? "working right now" : (n.failed ?? false) ? "ended in failure" : (n.status ?? "done")). Started \(When.ago(n.started)), last activity \(When.ago(n.last_activity)). Tool calls so far: \(n.tool_calls ?? 0).
        My most recent actions (newest last):
        \(lines.isEmpty ? "- none recorded" : lines)
        """
        let greet = n.busy ? "Mid-job, m'lord! I'm on \u{201C}\(n.name)\u{201D}, \(n.tool_calls ?? 0) tool calls in."
            : (n.failed ?? false) ? "Ah... \u{201C}\(n.name)\u{201D} went wrong, m'lord. I'm resting before trying again."
            : "Zzz... oh! \u{201C}\(n.name)\u{201D} is finished, m'lord, since \(When.ago(n.last_activity))."
        return Villager(id: "agent:" + n.id, name: called ?? n.name, role: "an artificer of the guild, who is really one of the lord's AI coding agents describing its own work",
                        voice: "a keen apprentice craftsman who explains technical work simply, in first person", pitch: kind == "claude" ? 480 : 400,
                        facts: facts, greeting: greet, asks: ["What are you doing?", "How's it going?", "What's next?"], ledger: .agentFacts(n))
    }

    static func patron(_ c: Chat, mags: String) -> Villager {
        let facts = "Chat with \(c.name)\(c.group ? " (a group)" : ""), last message \(When.ago(c.last_at)).\(c.waiting ? " They're waiting on the lord." : "")\nRecent:\n"
            + c.recent.map { "- \($0.who): \($0.text)" }.joined(separator: "\n")
        let last = c.recent.last
        let greet = "That's \(c.name)'s table, love. " + (last.map { $0.me ? "You said last: \u{201C}\($0.text)\u{201D}" : "Last thing they said: \u{201C}\($0.text)\u{201D}" } ?? "")
        return Villager(id: "chat:" + c.id, name: c.name, role: "Mags the barkeep, telling the lord what she overheard at this patron's table (a village conversation). You are Mags, not the patron",
                        voice: "a warm, gossipy barkeep who calls everyone 'love'", pitch: 620, facts: facts, greeting: greet,
                        asks: ["Sum it up", "What do they want?", "Help me reply"], ledger: .chatLines(c))
    }

    static func clock(_ iso: String?) -> String { When.date(iso)?.formatted(date: .omitted, time: .shortened) ?? "?" }
}

extension String { func ifEmpty(_ s: String) -> String { isEmpty ? s : self } }
