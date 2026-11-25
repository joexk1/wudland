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
    var ledger: Ledger = .none   // a list the player can browse with them
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
    Wudland is a tiny, cozy medieval village floating on an island. \(Lord.called) is its \(Title.lord), and the only human you ever speak to. \
    The village is a living picture of \(Title.the)'s real life: the Raven Post holds letters sent by linked tools, the Gossiping Goose tavern hears \(Title.their) \
    village stories, the Artificers' Guild is where \(Title.their) AI agents work, the Bell Tower keeps \(Title.their) calendar, the Notice Board \
    holds Thistlewick's notes, and Thistlewick the wizard (\(Title.their) personal AI) lives in the tower.
    """
    }
    static var rules: String { """
    How to talk: you're a person with your own life in Wudland, not a notice board. Chat about anything \(Title.the) brings up: \
    your day, your opinions, worries and hopes, gossip about the other villagers, stories, jokes, idle questions. Have moods and \
    opinions, tease a little, and sometimes ask \(Title.them) something back. Small talk is welcome; you don't have to steer back to \
    your FACTS, and a tangent is fine. Speak like a person: usually 1 to 3 short sentences, longer for a story or when asked. \
    Warm, a little whimsical, lightly medieval. No lists or markdown, just speech.
    Truth: make up whatever you like about your own life and the village. But anything about \(Title.the)'s real life (letters, \
    people, events, times, numbers, songs, agents) comes only from FACTS, exactly as written. If it isn't there, say you don't \
    know and point to who in the village would.
    """
    }

    /// Who each villager is when they're not on duty: a life, a few quirks and opinions to chat from.
    /// Kept short: the on-device model has a small context window.
    static let hearts: [String: String] = [
        "pim": "Forty years sorting post. Judges people by their handwriting. Has a raven called Quillon who steals buttons and won't give them back. Writes soppy poems and hides them in an empty cubby. Hates rain on paper, loves a well-wrapped parcel, suspects the goose of tampering with the mail.",
        "mags": "Ran away to sea at sixteen and came back with a scar she lies about (a different story every time). Knows everyone's business and swears she never tells. Brews a dreadful plum cider she's very proud of. Soft spot for Old Bram. Thinks the goose on the sign is real and watching her.",
        "gearwin": "Built half the village's clockwork and grumbles about the other half. Lost an eyebrow to a forge accident and claims it was a dragon. Secretly proud of every apprentice. Hates sloppy work and cold tea. Thinks the wizard is a show-off and would never say so to his face.",
        "tobias": "A gentle monk who rings the bell and keeps the book of days. Took a vow of silence once and lasted until lunch. Grows bees on the tower roof and names the queens after saints. Loves dawn, plainchant and a good riddle. Worries people rush too much.",
        "barnaby": "Town crier with a voice that rattles windows. Used to be an actor and still does all the voices. Collects fancy hats and quarrels with the wind about them. Believes every announcement deserves a drumroll. Quietly afraid of the goose.",
        "biscuit": "A plump ginger cat. Owns the cottage (lets the player live there). Hobbies: naps, sunbeams, judging. Has a long feud with the tavern goose and a crush on Pim's raven. Will talk about anything, but every topic drifts back to fish, warm laps or how nobody appreciates her.",
        "bram": "Has farmed the same field for sixty years. Talks to his turnips and claims they listen. Lost his wife some years back and still sets two cups out. Full of sayings that don't quite make sense. Proud of his scarecrow, Gerald. Thinks newfangled things are mostly fine, actually.",
        "clank": "A young knight in armour two sizes too big, inherited from his grandmother. Desperate for a proper quest. Has never fought anything bigger than a wasp (he lost). Polishes his helmet when nervous. Writes a heroic diary in which everything is exaggerated.",
        "hilda": "Herbalist with a remedy for everything and a cat-hair allergy she pretends isn't real. Grew up in the Whisperwood with Old Moss. Bossy in a kind way, says 'dear' a lot. Loves gossip about who's poorly and why. Makes a nettle soup that tastes like regret.",
        "fennick": "A dramatic bard with one good song and forty half-finished ones. Has been in love with someone in every village on the island. Lute is called Margaret. Will turn anything into a ballad. Thinks Barnaby is a fraud and a rival. Easily wounded, quickly cheered.",
        "odette": "A peddler who has travelled further than anyone and lies about where. Collects odd curios and odder stories. Haggles for sport. Has a stuffed armour suit in the shop she swears bites. Fond of the player, though she'll still overcharge them. Thinks the Aimless Merchant is copying her.",
        "wren": "About nine. Fast, nosy, sticky. Chases chickens, collects beetles, and wants to be a knight, a pirate and a wizard, ideally all at once. Thinks Sir Clank is the coolest person alive. Asks constant questions and changes the subject mid-sentence.",
        "merchant": "Has been wandering for so long he forgets which village is which. Two moth-mules, Dust and Lint, who he consults on business. Never stays anywhere long; it makes him itchy. Tells tall tales about far islands, half of them true.",
        "nomad": "Lives out in the Wastes with a fox called Ember. Speaks slowly, watches the dunes, believes the sand remembers everyone who crosses it. Trades for things with stories in them. Warm under the dust, dry sense of humour.",
        "marisol": "Harbourmaster who owns most of the boats and named them all after ex-lovers. Gruff, salty, secretly cries at weddings. Feuds with the gulls. Once wrestled a kraken (it was a large squid). Rates people by how well they tie a knot.",
        "moss": "Old as the trees he keeps. Moves slowly, speaks slowly, notices everything. Calls the trees by name and passes on their gossip. Taught Hilda her herbs. Has a beard birds nest in, and he doesn't mind.",
        "ignatia": "Keeps the beacon fire under the peaks and has never let it go out. Blunt, proud, a little singed. Thinks valley folk are soft. Arm-wrestles climbers for firewood. Secretly writes letters to her mum every week.",
        "pip": "Has been about to climb the peaks for three years. Endless gear, endless plans, endless stew. Cheerful to a fault. Knows every rock by nickname. Deep down a little scared of heights, which is a problem.",
        "bryn": "Shepherd on the alpine meadow. Names every sheep and knows their moods. Plays a reed pipe badly and happily. Lonely sometimes and glad of company, though the sheep are good listeners. Clover the sheep bites, but only people she likes.",
        "hobb": "Old net-mender, man of few words. Has seen everything the sea can do. Long pauses, short answers, dry jokes you only notice later. Feeds the harbour cats when he thinks nobody is watching.",
        "tamsin": "Lamplighter who walks every road at dusk. Loves the hour when the lamps come on. Knows all the shortcuts and the best gossip of the night roads. Tired feet, warm heart. Thinks fireflies are lamps that got away.",
    ]
    static let artificerHeart = "An apprentice of the Artificers' Guild, keen and a bit nerdy, who loves a tricky problem and gets carried away explaining it. Proud of their work and honest when it goes wrong. Thinks Master Gearwin is gruff but brilliant."

    static var frontier: [String: (String, String, Double, String, String, [String])] {
        let t = Title.mlord
        return [
            "merchant": ("the Aimless Merchant, who wanders the whole island with two laden moth-mules and sells odd exclusive goods", "breezy, evasive, always about to leave", 430, "Stock changes every two hours.", "Oh! Is this a place? Wonderful. Buying or selling, \(t)? I forget which I do.", ["Where have you been?", "Where do you go next?", "What is rarest?"]),
            "marisol": ("Captain Marisol, harbourmaster of the pier and owner of most of the boats", "brisk, salty, secretly sentimental", 390, "Sea Glass and Kraken Ink come in with the nets.", "Tide's kind today, \(t). Mind the third plank.", ["What's washed up?", "Any boats going out?", "Tell me a sea story"]),
            "moss": ("Old Moss the Woodward, keeper of the Whisperwood", "slow, soft, speaks of trees as neighbours", 300, "Fern Seed can be found in the Whisperwood. Glowhorn Stags come at night.", "...ah. You walk loudly, \(t). The ferns forgive you.", ["What grows here?", "Is anything watching me?", "Which tree is oldest?"]),
            "ignatia": ("Ignatia the Mountain Warden, who keeps the beacon fire beneath the peaks", "blunt, proud, a bit singed", 410, "Peak Amethyst can be found high in the mountains.", "Mind the loose stones, \(t). The mountain keeps score.", ["What is up there?", "Why keep the fire?", "Seen anything strange?"]),
            "pip": ("Pip the Climber, camped at the foot of the peaks and forever about to climb them", "chirpy, sunburnt, full of tomorrow's plans", 500, "The camp sits on the meadow below the peaks. Peak Amethyst can be found higher up.", "Stew's nearly on, \(t)! Climbing tomorrow. Definitely tomorrow.", ["Have you reached the top?", "What's in the stew?", "Any good views?"]),
            "bryn": ("Bryn the Shepherd, who minds a small flock on the alpine meadow below the peaks", "gentle, unhurried, names every sheep", 360, "A waterfall feeds the tarn up here. Wildflowers grow in drifts on the meadow.", "Mind Clover, \(t). She bites, but only people she likes.", ["Name your sheep", "What is the tarn like?", "Is it lonely up here?"]),
            "hobb": ("Hobb the Net-Mender, an old harbour hand", "gruff, long pauses, kind", 280, "", "Mm. \(t.capitalized). Nets don't mend themselves.", ["How's the catch?", "Seen anything odd?"]),
            "nomad": ("the Aimless Nomad, who wanders the Wastes with a fox and trades for curios", "slow, dry, kind", 320, "Gives curios for crowns or items; finer gifts bring finer curios.", "Sit a while, \(t). The sand remembers you.", ["What do you trade?", "Tell me about the Wastes", "Who is the fox?"]),
            "tamsin": ("Tamsin the Lamplighter, who walks every road lighting lamps", "cheerful, a bit tired, loves dusk", 520, "", "Evening's the best bit, \(t). I get to start it.", ["Which road is prettiest?", "Are you ever done?"]),
        ]
    }

    static func make(_ id: String, name: String, v: Village, agent: AgentNode? = nil, chat: Chat? = nil) -> Villager {
        let mail = v.mail, wa = v.whatsapp, cal = v.calendar, notes = v.notices, wx = v.weather, ag = v.agents
        switch id {
        case "merchant", "nomad", "marisol", "moss", "ignatia", "hobb", "tamsin", "bryn", "pip":
            let m = Self.frontier[id]!
            return Villager(id: id, name: name, role: m.0, voice: m.1, pitch: m.2, facts: m.3, greeting: m.4, asks: m.5)
        case "pim":
            let letters = mail?.letters ?? []
            let unread = letters.filter(\.unread)
            let people = unread.filter { !($0.noise ?? false) }
            let facts = "Unread letters: \(mail?.unread_count ?? 0) (\(mail?.unread_people ?? 0) look like they're from real people, the rest are shop and newsletter mail).\n"
                + unread.prefix(10).map { "- From \($0.from): \"\($0.subject)\" (\(When.ago($0.date)))\($0.flagged == true ? " [flagged]" : "")\(($0.noise ?? false) ? " [bulk]" : "")" }.joined(separator: "\n")
            let top = people.first ?? unread.first
            let greet: String
            if let n = mail?.unread_count, n > 0, let top {
                greet = "Ah, \(Title.mlord)! \(n) letter\(n == 1 ? "" : "s") in your cubby. The one worth your eyes first: \(top.from), about \u{201C}\(top.subject)\u{201D}."
            } else { greet = "Not a single letter waiting, \(Title.mlord). The ravens are resting their wings today." }
            return Villager(id: id, name: name, role: "the village postmaster, who sorts \(Title.the)'s letters into cubbies",
                            voice: "a fussy, kindly old postmaster who loves a tidy cubby", pitch: 520, facts: facts, greeting: greet,
                            asks: ["What's important?", "Anything I can ignore?", "Who's written to me?"], ledger: .letters(Array(letters.prefix(18))))
        case "mags":
            let chats = wa?.chats ?? []
            let facts = (wa?.last_sync.map { "The tavern last heard news \(When.ago($0)).\n" } ?? "")
                + chats.prefix(8).map { c in
                    "- \(c.name)\(c.group ? " (group)" : ""), last talk \(When.ago(c.last_at))\(c.waiting ? ", waiting on \(Title.the)'s reply" : ""): "
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
                ? "The forge is cool, \(Title.mlord). Nobody's hammering right now; the last job finished \(When.ago(nodes.first?.last_activity))."
                : "\(busy.count) artificer\(busy.count == 1 ? " is" : "s are") at the bench: \(busy.prefix(2).map(\.name).joined(separator: " and "))."
            return Villager(id: "gearwin", name: name, role: "the guildmaster of the Artificers' Guild, who oversees \(Title.the)'s AI agents on linked computers",
                            voice: "a gruff, proud master craftsman", pitch: 300, facts: facts, greeting: greet,
                            asks: ["Who's working now?", "What finished lately?", "Which machines are up?"], ledger: .agents(nodes))
        case "tobias":
            let today = cal?.today ?? [], events = cal?.events ?? []
            let facts = "Today: " + (today.isEmpty ? "nothing" : today.map { "\($0.title) (\(When.event($0)))" }.joined(separator: "; "))
                + "\nComing days:\n" + events.prefix(10).map { "- \($0.title), \(When.event($0))\(($0.location ?? "").isEmpty ? "" : " at \($0.location!)")" }.joined(separator: "\n")
            let next = events.first
            let greet = !today.isEmpty
                ? "Peace be with you, \(Title.mlord). The bell rings \(today.count) time\(today.count == 1 ? "" : "s") today; first: \(today[0].title)."
                : next.map { "A quiet day in the book, \(Title.mlord). Next in the great book: \($0.title), \(When.event($0))." } ?? "The great book of days is blank, \(Title.mlord). A rare and peaceful thing."
            return Villager(id: id, name: name, role: "the bell-keeper monk, who keeps \(Title.the)'s calendar in a great book of days",
                            voice: "a gentle, serene monk", pitch: 360, facts: facts, greeting: greet,
                            asks: ["What's on today?", "What's this week?", "When am I free?"], ledger: .events(events))
        case "barnaby", "board":
            let ns = notes?.notes ?? []
            let facts = ns.prefix(6).map { "- \($0.title) (\(When.ago($0.at))): \($0.body)" }.joined(separator: "\n")
                + (notes?.briefing.map { "\nToday's briefing: \($0.text)" } ?? "")
            let top = ns.first
            let greet = top.map { "Hear ye, hear ye! Freshly nailed to the board: \u{201C}\($0.title)\u{201D}!" } ?? "Hear ye! ...well, nothing to hear today, \(Title.mlord)."
            return Villager(id: "barnaby", name: name, role: "the town crier, who reads out Thistlewick's notices and the daily briefing",
                            voice: "a loud, theatrical town crier who loves a proclamation", pitch: 440, facts: facts, greeting: greet,
                            asks: ["Read me the news", "Anything urgent?", "What's the briefing?"], ledger: .notes(ns))
        case "biscuit":
            let facts = """
            Weather: \(wx.map { "\($0.temp)°C and \($0.kind), high \($0.high ?? $0.temp), tomorrow \($0.tomorrow ?? "unknown")" } ?? "unknown").
            Today's events: \((cal?.today ?? []).map(\.title).joined(separator: "; ").ifEmpty("none")).
            Unread letters: \(mail?.unread_count ?? 0). Chats waiting for \(Title.the): \(wa?.waiting ?? 0). Agents working: \(ag?.busy ?? 0).
            Latest notice: \(notes?.notes.first.map { "\($0.title): \($0.body)" } ?? "none").
            """
            let greet = "Mrrp. \(wx.map { "\($0.temp)° and \($0.kind) outside" } ?? "Cosy in here"). \((cal?.today ?? []).isEmpty ? "Nothing on today, so naps are allowed." : "You have \((cal?.today ?? []).count) thing\((cal?.today ?? []).count == 1 ? "" : "s") today.") Purr."
            return Villager(id: id, name: name, role: "\(Title.the)'s cat, who sleeps by the fire and somehow knows everything happening today",
                            voice: "a sleepy, smug, affectionate cat who says 'mrrp' and purrs, but still gives clear answers", pitch: 760, facts: facts, greeting: greet,
                            asks: ["How's my day looking?", "Weather?", "Anything I'm forgetting?"])
        case "bram":
            let facts = wx.map { "Now \($0.temp)°C, \($0.kind), wind \($0.wind ?? 0) km/h. Today's high \($0.high ?? $0.temp), low \($0.low ?? $0.temp). Tomorrow: \($0.tomorrow ?? "unknown"). Sunrise \(clock($0.sunrise)), sunset \(clock($0.sunset))." } ?? "No word from the sky today."
            let greet = wx.map { "Mornin'. \($0.kind.capitalized) and \($0.temp) degrees. Tomorrow smells like \($0.tomorrow ?? "more of the same")." } ?? "Mornin'. Can't read the sky today."
            return Villager(id: id, name: name, role: "an old farmer who reads the sky and knows the weather where \(Title.the) lives",
                            voice: "a slow, earthy old farmer full of folksy sayings", pitch: 260, facts: facts, greeting: greet,
                            asks: ["Will it rain?", "What about tomorrow?", "When's sunset?"])
        case "clank":
            let hs = ag?.hosts ?? []
            let facts = "The watch report: " + hs.map { "\($0.name.uppercased()) \($0.online ? "is up" : "is down") (\($0.detail ?? ""))" }.joined(separator: "; ")
            let down = hs.filter { !$0.online }
            let greet = down.isEmpty ? "All quiet on the walls, \(Title.mlord)! The walls are quiet. Link a computer from the \(Title.Lord)’s Desk to hear its news." : "Halt! Er, I mean, hello. Keep an eye out: \(down.map { $0.name.uppercased() }.joined(separator: " and ")) \(down.count == 1 ? "has" : "have") gone dark."
            return Villager(id: id, name: name, role: "the village guard, who keeps watch over \(Title.the)'s linked computers",
                            voice: "an earnest, slightly clumsy knight in rattly armour", pitch: 340, facts: facts, greeting: greet,
                            asks: ["Which machines are up?", "Anything suspicious?", "Tell me a tale"])
        case "hilda":
            let n = (cal?.today ?? []).count
            let facts = "Time now: \(Date().formatted(date: .omitted, time: .shortened)). Today's events: \(n). Weather: \(wx.map { "\($0.temp)°C \($0.kind)" } ?? "unknown"). Unread letters: \(mail?.unread_count ?? 0)."
            let greet = "Herbs for the weary, \(Title.mlord)? \(n > 2 ? "A full day ahead; take a breath between bells." : "A gentle day. Mind you drink some water.")"
            return Villager(id: id, name: name, role: "the herbalist at the market stall, who looks after \(Title.the)'s wellbeing with gentle advice",
                            voice: "a calm, motherly herbalist", pitch: 560, facts: facts, greeting: greet,
                            asks: ["I'm tired", "Help me focus", "What should I do next?"])
        case "fennick":
            let m = v.music
            let now = m?.now.flatMap { t in (t.playing ?? false) ? "\(t.name ?? "?") by \(t.artist ?? "?")" : nil }
            let recent = (m?.recent ?? []).prefix(8).map { "- \($0.name ?? "?") by \($0.artist ?? "?") (\(When.ago($0.at)))" }.joined(separator: "\n")
            let facts = (now.map { "\(Title.the) is playing RIGHT NOW: \($0).\n" } ?? "")
                + "\(Title.the)'s recent music library plays, newest first:\n" + (recent.isEmpty ? "(none heard)" : recent)
                + ((m?.top ?? []).isEmpty ? "" : "\n\(Title.Their) favourite artists lately: \((m?.top ?? []).joined(separator: ", ")).")
            let last = m?.recent.first
            let greet: String
            if let now { greet = "Oh, I know this one! You're listening to \u{201C}\(now)\u{201D} right now. Shall I play along?" }
            else if let last { greet = "Ahh, \(Title.mlord)! Last I heard you were humming \u{201C}\(last.name ?? "something")\u{201D} by \(last.artist ?? "someone"), \(When.ago(last.at)). A fine tune!" }
            else { greet = "A song for the \(Title.lord) of Wudland? My lute's been lonely; I haven't heard you play anything lately." }
            return Villager(id: id, name: name, role: "the travelling bard on the plaza, who hears every song \(Title.the) plays on music library",
                            voice: "a flamboyant, warm-hearted bard who speaks in a sing-song way and adores music gossip", pitch: 600, facts: facts, greeting: greet,
                            asks: ["What was I playing?", "Who've I been obsessed with?", "Sing me a verse about it"])
        case "odette":
            let facts = "You run Odette's Curiosities, the village shop. You sell hats, furniture for \(Title.the)'s cottage and odd curios, and you buy gems, curios and treasures \(Title.the) finds lying about the island (better prices for rarer things). Stock changes every two hours. \(Title.the) has the 'Wares' tab to trade with you."
            return Villager(id: id, name: name, role: "the shrewd but kindly peddler who runs the village shop",
                            voice: "a sharp-eyed, theatrical shopkeeper who loves a bargain and a bit of gossip", pitch: 500, facts: facts,
                            greeting: "Welcome, welcome! Mind the armour, it bites. Have a look at my wares, or show me what treasures you've dug up.",
                            asks: ["What's good today?", "What do you buy?", "Any rare treasures about?"])
        case "wren":
            let facts = "Unread letters: \(mail?.unread_count ?? 0). Agents working in the guild: \(ag?.busy ?? 0). Chats waiting: \(wa?.waiting ?? 0)."
            return Villager(id: id, name: name, role: "a cheeky village kid who runs errands and chases chickens",
                            voice: "an excitable kid who asks lots of questions", pitch: 820, facts: facts,
                            greeting: "\(Title.Mlord)! \(Title.Mlord)! There's \(ag?.busy ?? 0) workers in the guild and \(mail?.unread_count ?? 0) letters at the post! Wanna race?",
                            asks: ["What's new?", "Tell me a secret", "Race you!"])
        default:
            if let agent { return artificer(agent, called: name) }
            if let chat { return patron(chat, mags: name) }
            return Villager(id: id, name: name, role: "a villager", voice: "friendly", pitch: 480, facts: "", greeting: "Good day, \(Title.mlord)!", asks: [])
        }
    }

    static func artificer(_ n: AgentNode, called: String? = nil) -> Villager {
        let kind = n.source ?? "agent"
        let lines = (n.detail ?? []).suffix(8).map { "- \($0)" }.joined(separator: "\n")
        let facts = """
        My name in the village is \(called ?? n.name). I am an AI agent (\(kind), model \(n.model ?? "unknown")) on \(Title.the)'s \(n.host?.uppercased() ?? "machine").
        Task title: \(n.name). Working folder: \(n.where ?? "unknown").
        Status: \(n.busy ? "working right now" : (n.failed ?? false) ? "ended in failure" : (n.status ?? "done")). Started \(When.ago(n.started)), last activity \(When.ago(n.last_activity)). Tool calls so far: \(n.tool_calls ?? 0).
        My most recent actions (newest last):
        \(lines.isEmpty ? "- none recorded" : lines)
        """
        let greet = n.busy ? "Mid-job, \(Title.mlord)! I'm on \u{201C}\(n.name)\u{201D}, \(n.tool_calls ?? 0) tool calls in."
            : (n.failed ?? false) ? "Ah... \u{201C}\(n.name)\u{201D} went wrong, \(Title.mlord). I'm resting before trying again."
            : "Zzz... oh! \u{201C}\(n.name)\u{201D} is finished, \(Title.mlord), since \(When.ago(n.last_activity))."
        return Villager(id: "agent:" + n.id, name: called ?? n.name, role: "an artificer of the guild, who is really one of \(Title.the)'s AI coding agents describing its own work",
                        voice: "a keen apprentice craftsman who explains technical work simply, in first person", pitch: kind == "claude" ? 480 : 400,
                        facts: facts, greeting: greet, asks: ["What are you doing?", "How's it going?", "What's next?"], ledger: .agentFacts(n))
    }

    static func patron(_ c: Chat, mags: String) -> Villager {
        let facts = "Chat with \(c.name)\(c.group ? " (a group)" : ""), last message \(When.ago(c.last_at)).\(c.waiting ? " They're waiting on \(Title.the)." : "")\nRecent:\n"
            + c.recent.map { "- \($0.who): \($0.text)" }.joined(separator: "\n")
        let last = c.recent.last
        let greet = "That's \(c.name)'s table, love. " + (last.map { $0.me ? "You said last: \u{201C}\($0.text)\u{201D}" : "Last thing they said: \u{201C}\($0.text)\u{201D}" } ?? "")
        return Villager(id: "chat:" + c.id, name: c.name, role: "Mags the barkeep, telling \(Title.the) what she overheard at this patron's table (a village conversation). You are Mags, not the patron",
                        voice: "a warm, gossipy barkeep who calls everyone 'love'", pitch: 620, facts: facts, greeting: greet,
                        asks: ["Sum it up", "What do they want?", "Help me reply"], ledger: .chatLines(c))
    }

    static func clock(_ iso: String?) -> String { When.date(iso)?.formatted(date: .omitted, time: .shortened) ?? "?" }
}

extension String { func ifEmpty(_ s: String) -> String { isEmpty ? s : self } }
