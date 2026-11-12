import Foundation
import WebKit

/// Demo / screen-recording mode. It only exists in DEBUG builds and only switches on with the `-WudlandTour`
/// launch argument, so it can never run in a normal (App Store) launch. It supplies fictional village data,
/// scripted villager lines (no on-device model) and a tiny file-based command channel that the UI test
/// `WudlandTourTests` uses to read where things are on the canvas, so real touches can be sent to them.
enum TourMode {
    #if DEBUG
    static let on = ProcessInfo.processInfo.arguments.contains("-WudlandTour")
    #else
    static let on = false
    #endif

    /// Set before the first view reads defaults: the sun held at a pleasant late afternoon.
    static func prepare() {
        guard on else { return }
        UserDefaults.standard.set(16.0, forKey: "sunHour")
        UserDefaults.standard.set(false, forKey: "soundOff")
    }

    // MARK: - fictional village

    private static let launched = Date()
    private static func iso(_ minutes: Double) -> String { When.iso.string(from: launched.addingTimeInterval(minutes * 60)) }
    private static func today(_ hour: Int, _ minute: Int = 0) -> String {
        When.iso.string(from: Calendar.current.date(bySettingHour: hour, minute: minute, second: 0, of: launched) ?? launched)
    }
    private static func day(_ offset: Int, _ hour: Int, _ minute: Int = 0) -> String {
        let d = Calendar.current.date(byAdding: .day, value: offset, to: launched) ?? launched
        return When.iso.string(from: Calendar.current.date(bySettingHour: hour, minute: minute, second: 0, of: d) ?? d)
    }

    static func village() -> Village {
        let letters = [
            Letter(id: "l1", from: "Ines Okafor", address: nil, subject: "Lunch on Thursday?", date: iso(-35), unread: true, flagged: true, noise: false,
                   summary: "Ines is free at noon on Thursday and suggests the new noodle place by the harbour. She wants a quick yes or no by tomorrow evening."),
            Letter(id: "l2", from: "Maple Street Bakery", address: nil, subject: "Your sourdough class is on Saturday", date: iso(-95), unread: true, flagged: nil, noise: false,
                   summary: "The sourdough class starts at ten on Saturday morning. Bring an apron, the starter is provided."),
            Letter(id: "l3", from: "Tomas Reyes", address: nil, subject: "Notes from the design review", date: iso(-180), unread: true, flagged: nil, noise: false,
                   summary: "Tomas shared the notes from the design review. Two decisions need a reply from you before Friday."),
            Letter(id: "l4", from: "Harbor Library", address: nil, subject: "Your book is ready for pickup", date: iso(-60 * 20), unread: true, flagged: nil, noise: false,
                   summary: "The book you reserved is waiting at the front desk until next Wednesday."),
            Letter(id: "l5", from: "Orchard Co-op", address: nil, subject: "This week's seed catalogue", date: iso(-60 * 30), unread: false, flagged: nil, noise: true,
                   summary: "A newsletter about autumn seeds and discount turnips."),
        ]
        let chats = [
            Chat(id: "c1", name: "Mina", group: false, last_at: iso(-22), waiting: true, recent: [
                ChatLine(who: "Mina", me: false, at: iso(-40), text: "Are you still coming Saturday?"),
                ChatLine(who: "Rowan", me: true, at: iso(-30), text: "Wouldn't miss it."),
                ChatLine(who: "Mina", me: false, at: iso(-22), text: "Great! I'll save you a seat by the window.")]),
            Chat(id: "c2", name: "Book Club", group: true, last_at: iso(-150), waiting: false, recent: [
                ChatLine(who: "Priya", me: false, at: iso(-170), text: "Next month's pick: the one with the dragon?"),
                ChatLine(who: "Rowan", me: true, at: iso(-160), text: "Yes please."),
                ChatLine(who: "Jonah", me: false, at: iso(-150), text: "Three votes for the dragon so far.")]),
            Chat(id: "c3", name: "Dad", group: false, last_at: iso(-60 * 9), waiting: false, recent: [
                ChatLine(who: "Dad", me: false, at: iso(-60 * 9), text: "Tomatoes are finally ripe. Come by Sunday."),
                ChatLine(who: "Rowan", me: true, at: iso(-60 * 8.5), text: "Sunday it is.")]),
            Chat(id: "c4", name: "Sam", group: false, last_at: iso(-60 * 26), waiting: false, recent: [
                ChatLine(who: "Sam", me: false, at: iso(-60 * 26), text: "That hike photo is going on my wall.")]),
        ]
        let events = [
            Event(title: "Team stand-up", start: today(11), all_day: false, location: "Studio"),
            Event(title: "Dentist", start: today(15, 30), all_day: false, location: "Elm Street Clinic"),
            Event(title: "Piano lesson", start: today(19), all_day: false, location: nil),
            Event(title: "Farmers' market", start: day(1, 9), all_day: false, location: "Town square"),
            Event(title: "Lunch with Ines", start: day(3, 12), all_day: false, location: "Harbour noodles"),
            Event(title: "Launch day prep", start: day(4, 10), all_day: false, location: nil),
            Event(title: "Hike at Lake Ridge", start: day(5, 8, 30), all_day: false, location: "Lake Ridge trailhead"),
        ]
        let notes = [
            Note(id: "n1", title: "Water the ferns", body: "Both in the sunroom, the big one gets extra.", at: today(9), read: false),
            Note(id: "n2", title: "Call the plumber", body: "Ask about the kitchen tap.", at: today(12), read: false),
            Note(id: "n3", title: "Pick up parcel at the post office", body: "Bring the grey card.", at: day(1, 10), read: false),
            Note(id: "n4", title: "Renew library card", body: "Expires on Friday.", at: day(2, 9), read: false),
            Note(id: "n5", title: "Buy oat milk", body: "And lemons.", at: day(1, 17), read: false),
        ]
        let briefing = Briefing(text: "Good morning, Rowan. Three bells today: stand-up at eleven, the dentist at half past three and piano at seven. Light rain is due tomorrow, so the ferns can have today's sunshine. Ines is waiting on an answer about Thursday.", at: iso(-240))
        let weather = Weather(temp: 14, kind: "partly cloudy", wind: 11, high: 16, low: 9, tomorrow: "light rain", sunrise: today(7, 4), sunset: today(16, 52))
        func node(_ id: String, _ parent: String? = nil, _ src: String, _ host: String, _ name: String, busy: Bool, failed: Bool = false, status: String,
                  model: String, folder: String, tools: Int, started: Double, last: Double, detail: [String]) -> AgentNode {
            AgentNode(id: id, parent: parent, source: src, host: host, name: name, status: status, busy: busy, failed: failed, model: model, where: folder,
                      started: iso(started), last_activity: iso(last), tool_calls: tools, detail: detail)
        }
        let nodes = [
            node("a1", nil, "claude", "studio", "Refactor the login flow", busy: true, status: "busy", model: "claude-opus", folder: "~/projects/aurora/web", tools: 142, started: -52, last: -1,
                 detail: ["Read src/auth/session.ts", "Edit src/auth/login.tsx", "Ran 18 unit tests: all passing", "Extracting useSession hook"]),
            node("a2", "a1", "claude", "studio", "Run the test suite", busy: true, status: "busy", model: "claude-sonnet", folder: "~/projects/aurora/web", tools: 23, started: -9, last: 0,
                 detail: ["Ran npm test", "41 passed, 0 failed"]),
            node("a3", nil, "codex", "laptop", "Write release notes", busy: false, status: "done", model: "gpt-5-codex", folder: "~/projects/aurora", tools: 64, started: -140, last: -35,
                 detail: ["Collected 27 merged pull requests", "Grouped changes by feature", "Wrote RELEASE_NOTES.md"]),
            node("a4", nil, "opencode", "homelab", "Fix the flaky upload test", busy: true, status: "busy", model: "qwen3-coder", folder: "~/projects/aurora/api", tools: 88, started: -31, last: -2,
                 detail: ["Reproduced the failure in 3 of 20 runs", "Found a race in the chunk writer", "Adding a retry with backoff"]),
            node("a5", nil, "codex", "laptop", "Summarise customer feedback", busy: true, status: "busy", model: "gpt-5-codex", folder: "~/research/feedback", tools: 37, started: -18, last: -1,
                 detail: ["Read 212 survey answers", "Clustering by theme", "Drafting a one-page summary"]),
            node("a6", nil, "claude", "studio", "Migrate the database schema", busy: false, status: "done", model: "claude-opus", folder: "~/projects/aurora/api", tools: 51, started: -300, last: -120,
                 detail: ["Wrote migration 0042", "Applied to staging", "Rollback verified"]),
        ]
        return Village(
            generated_at: iso(0),
            mail: Mail(unread_count: 4, unread_people: 3, letters: letters),
            whatsapp: WhatsApp(chats: chats, waiting: 1, last_sync: iso(-3)),
            calendar: Almanac(events: events, today: Array(events.prefix(3))),
            notices: Notices(notes: notes, briefing: briefing),
            weather: weather,
            agents: Agents(hosts: [Host(name: "studio", online: true, detail: "last heard just now"), Host(name: "laptop", online: true, detail: "last heard 1m ago"),
                                   Host(name: "homelab", online: true, detail: "last heard 2m ago")],
                           busy: 3, nodes: nodes),
            music: Music(now: Music.Track(name: "Golden Hour", artist: "The Larkspurs", album: "Long Light", at: iso(0), playing: true),
                         recent: [Music.Track(name: "Golden Hour", artist: "The Larkspurs", album: "Long Light", at: iso(-2), playing: false),
                                  Music.Track(name: "Slow Orchard", artist: "Moss & Marlow", album: "Lanterns", at: iso(-40), playing: false),
                                  Music.Track(name: "Paper Boats", artist: "Pip Hollis", album: "Paper Boats", at: iso(-90), playing: false)],
                         top: ["The Larkspurs", "Moss & Marlow", "Pip Hollis"]))
    }

    // MARK: - scripted villagers (no on-device model in the simulator)

    private static let lines: [String: [(String, String)]] = [
        "pim": [("important", "Ines Okafor first, m'lord: she needs a yes or no about lunch on Thursday. The bakery wrote too, about Saturday's class."),
                ("ignore", "Only the Orchard Co-op newsletter, m'lord. Seed catalogues and discount turnips. It will keep."),
                ("written", "Four letters wait in your cubby: Ines, Tomas, the bakery and the library.")],
        "mags": [("waiting", "Mina's still waiting on a word back, love. She's saving you a seat by the window on Saturday."),
                 ("gossip", "The Book Club's all abuzz about next month's pick, love. Three votes for the one with the dragon."),
                 ("last", "Last from Mina: \u{201C}Great! I'll save you a seat by the window.\u{201D}")],
        "gearwin": [("working", "Three artificers at the bench, m'lord: one on the login flow, one on a flaky upload test, one reading customer feedback."),
                    ("finished", "The release notes are written and the schema migration is done and checked. Clean work, both."),
                    ("machines", "STUDIO, LAPTOP and HOMELAB are all awake and humming.")],
        "tobias": [("today", "Three bells today, m'lord: stand-up at eleven, the dentist at half past three and piano at seven."),
                   ("week", "Tomorrow the farmers' market, Thursday lunch with Ines, and Saturday a hike at Lake Ridge."),
                   ("free", "Tomorrow afternoon lies wide open, m'lord. A fine afternoon for a walk.")],
        "barnaby": [("news", "Hear ye! The ferns need water, the plumber awaits a call, and a parcel sits at the post office!"),
                    ("urgent", "Most urgent, m'lord: the library card expires on Friday! Hear ye!"),
                    ("briefing", "Three bells today, rain tomorrow, and Ines awaits your answer about Thursday! Hear ye, hear ye!")],
        "biscuit": [("day", "Mrrp. Three things today. The dentist is the only scary one. Purr."),
                    ("weather", "Mrrp. Fourteen degrees and cloudy outside. Perfect for a nap on the windowsill."),
                    ("forgetting", "Mrrp. The ferns have not been watered. I am not judging. Much.")],
        "bram": [("rain", "Tomorrow smells like rain, friend. Bring a coat, and a good hat."),
                 ("tomorrow", "Light rain by the afternoon. The wind will drop by evening."),
                 ("sunset", "Sun's down at eight minutes to five. Short days now.")],
        "clank": [("machines", "All three machines are up, m'lord: STUDIO, LAPTOP and HOMELAB. The walls are quiet!"),
                  ("suspicious", "Only a goose by the river. I suspect it of nothing. Yet."),
                  ("tale", "Once I chased a rooster round the keep for an hour. The rooster won.")],
        "hilda": [("tired", "A cup of chamomile and a minute with your eyes closed, m'lord. The bells can wait."),
                  ("focus", "Clear the desk, one task, one cup of tea. Start with the dentist call."),
                  ("next", "Water the ferns, then the dentist. A short walk after, I think.")],
        "fennick": [("playing", "Why, \u{201C}Golden Hour\u{201D} by the Larkspurs, ten plays this week! A fine, fine tune."),
                    ("obsessed", "The Larkspurs, Moss & Marlow, and little Pip Hollis. Excellent taste, m'lord!"),
                    ("verse", "Oh, the ferns are green and the bells are bright, and the lord of Wudland sleeps tonight!")],
        "odette": [("good", "Fresh this morning: a feathered cap, a brass lantern, and a hat that hums if you ask nicely."),
                   ("buy", "Gems, curios and treasures, love. The rarer, the richer."),
                   ("rare", "Rumour has it a moonstone washed up by the river last night.")],
        "wren": [("new", "Three workers in the guild and four letters at the post! Wanna race?"),
                 ("secret", "Psst. Old Bram's scarecrow is just Old Bram in a different hat."),
                 ("race", "Ready, steady... too slow! I win again!")],
        "agent": [("doing", "Right now I'm deep in the work, m'lord. Reading, editing, running the checks, then reading again."),
                  ("going", "Nicely! The hard part is behind me and the tests are mostly green."),
                  ("next", "Tidy up, write a short summary, and hand it back to you.")],
        "chat": [("sum", "A friendly little chat, love, nothing to worry about, and they'd love a quick word back."),
                 ("want", "They'd like a yes or a no, love. Plans for the weekend."),
                 ("reply", "Try something short and warm, love: \u{201C}Wouldn't miss it, see you there!\u{201D}")],
    ]

    static func reply(_ villagerID: String, _ question: String) -> String? {
        let key = villagerID.hasPrefix("agent:") ? "agent" : villagerID.hasPrefix("chat:") ? "chat" : villagerID
        let q = question.lowercased()
        guard let table = lines[key] else { return nil }
        if let hit = table.first(where: { q.contains($0.0) }) { return hit.1 }
        // chip wording that doesn't share a keyword with the table
        let alt: [(String, String)] = [("who's working", "working"), ("finished lately", "finished"), ("which machines", "machines"), ("what's this week", "week"), ("when am i free", "free"),
                                       ("what's on today", "today"), ("read me the news", "news"), ("anything urgent", "urgent"), ("how's my day", "day"), ("will it rain", "rain"),
                                       ("what about tomorrow", "tomorrow"), ("when's sunset", "sunset"), ("anything suspicious", "suspicious"), ("tell me a tale", "tale"),
                                       ("i'm tired", "tired"), ("help me focus", "focus"), ("what should i do next", "next"), ("what was i playing", "playing"),
                                       ("obsessed", "obsessed"), ("sing me", "verse"), ("what's good", "good"), ("what do you buy", "buy"), ("rare treasures", "rare"),
                                       ("what's new", "new"), ("tell me a secret", "secret"), ("race you", "race"), ("what are you doing", "doing"), ("how's it going", "going"),
                                       ("what's next", "next"), ("sum it up", "sum"), ("what do they want", "want"), ("help me reply", "reply"), ("who's waiting", "waiting"),
                                       ("any gossip", "gossip"), ("what did they last say", "last"), ("who's written", "written"), ("anything i can ignore", "ignore"),
                                       ("what's important", "important"), ("what's the briefing", "briefing")]
        if let a = alt.first(where: { q.contains($0.0) }), let hit = table.first(where: { $0.0 == a.1 }) { return hit.1 }
        return nil
    }

    /// what a villager says after being handed a letter, a table, a notice or an agent's log
    @MainActor static func digest(_ label: String, _ material: String) -> String {
        let l = label.lowercased()
        if l.contains("lunch on thursday") { return "From Ines Okafor, m'lord: she is free at noon on Thursday and suggests the noodle place by the harbour. She would like a yes or no by tomorrow evening." }
        if l.contains("sourdough") { return "The bakery on Maple Street: your sourdough class starts at ten on Saturday morning. Bring an apron, the starter is provided." }
        if l.contains("design review") { return "Tomas Reyes sent notes from the design review. Two decisions need your reply before Friday." }
        if l.contains("mina") { return "Mina is asking whether you are still coming on Saturday. She is saving you a seat by the window, so a quick yes would make her happy." }
        if l.contains("book club") { return "The Book Club is voting on next month's pick. The dragon book leads with three votes, and your vote is already in." }
        if l.contains("refactor the login") { return "Midway through the login refactor: the session hook is extracted and 18 tests pass. A sub-agent is running the full suite right now." }
        if l.contains("fix the flaky") { return "Found it: a race in the chunk writer made the upload test fail in three of twenty runs. I'm adding a retry with backoff." }
        if l.contains("release notes") { return "Finished! I gathered 27 merged pull requests, grouped them by feature and wrote the release notes." }
        if l.contains("stand-up") { return "Team stand-up is at eleven this morning, in the studio. Bring your updates, m'lord." }
        if l.contains("dentist") { return "The dentist at half past three, Elm Street Clinic. Leave a little early." }
        if l.contains("farmers") { return "The farmers' market is tomorrow at nine, in the town square." }
        if l.contains("water the ferns") { return "Water the ferns, m'lord: both in the sunroom, and the big one gets extra." }
        if l.contains("plumber") { return "Call the plumber about the kitchen tap. The line opens at noon." }
        return Conversation.digest(material)
    }

    static func wizardReply(_ prompt: String) -> String {
        "Ah, a fine question, Rowan. Three bells toll today: stand-up at eleven, the dentist at half past three and piano at seven. Between them the ferns could use a drink, and Ines is still waiting to hear about Thursday. Shall we plan the gaps together?"
    }
}

#if DEBUG
// MARK: - command channel for the UI test (read-only helpers for the canvas, nothing the player can reach)
extension TourMode {
    @MainActor static func start(game: Game) {
        guard on else { return }
        let dir = "/tmp/wudland-tour"
        let fm = FileManager.default
        try? fm.createDirectory(atPath: dir, withIntermediateDirectories: true)
        for f in (try? fm.contentsOfDirectory(atPath: dir)) ?? [] where f.hasPrefix("in.") || f.hasPrefix("out.") { try? fm.removeItem(atPath: dir + "/" + f) }
        Task { @MainActor in
            while !game.ready { try? await Task.sleep(for: .milliseconds(200)) }
            _ = await eval(game, prelude)
            try? "ready".write(toFile: dir + "/ready", atomically: true, encoding: .utf8)
            var n = 1
            var pending: String? = nil
            while true {
                try? await Task.sleep(for: .milliseconds(40))
                if let src = pending {
                    // WebKit's process may have died mid-command; the village reloaded with fresh state,
                    // so wait for the game, re-install the bridge, then run the same command again.
                    if !game.ready { continue }
                    guard await eval(game, prelude, timeout: 8) == "ok" else { continue }
                    let out = await eval(game, src)
                    if !out.hasPrefix("ERR") {
                        pending = nil
                        try? out.write(toFile: "\(dir)/out.\(n).txt", atomically: true, encoding: .utf8)
                        n += 1
                    }
                    continue
                }
                let path = "\(dir)/in.\(n).js"
                guard let src = try? String(contentsOfFile: path, encoding: .utf8) else { continue }
                try? fm.removeItem(atPath: path)
                let out = await eval(game, src)
                if out.hasPrefix("ERR") {
                    pending = src
                    continue
                }
                try? out.write(toFile: "\(dir)/out.\(n).txt", atomically: true, encoding: .utf8)
                n += 1
            }
        }
    }

    /// evaluateJavaScript wrapped with a timeout: if WebKit's content process died while the command was
    /// pending, the completion handler never fires, and a plain continuation would block the bridge forever.
    @MainActor private static func eval(_ game: Game, _ src: String, timeout seconds: Double = 12) async -> String {
        await withCheckedContinuation { c -> Void in
            var resolved = false
            func resolve(_ v: String) {
                guard !resolved else { return }
                resolved = true
                c.resume(returning: v)
            }
            guard let wv = game.webView else { resolve("ERR: no webview"); return }
            wv.evaluateJavaScript(src) { r, e in
                if let e { resolve("ERR: \(e.localizedDescription)"); return }
                switch r {
                case nil: resolve("null")
                case let s as String: resolve(s)
                case let n as NSNumber: resolve(CFGetTypeID(n) == CFBooleanGetTypeID() ? (n.boolValue ? "true" : "false") : n.stringValue)
                default: resolve("null")
                }
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { resolve("ERR: timeout") }
        }
    }

    static let prelude = #"""
    window.TOUR = {
      busy: false,
      scr(x, y, z) { const [sx, sy] = sceneProject(G.scene, x, y, z); return [(sx - G.camI[0] - G.fracX) * K / DPR, (sy - G.camI[1] - G.fracY) * K / DPR]; },
      toScene(p) { return [p[0] * DPR / K + G.fracX + G.camI[0], p[1] * DPR / K + G.fracY + G.camI[1]]; },
      safe(p) { return p[0] > 40 && p[0] < innerWidth - 40 && p[1] > 150 && p[1] < innerHeight - 200; },
      scene() { return G.scene.id; },
      idle() { return !G.player.path && !G.iris && !G.talking && !TOUR.busy; },
      talking() { return !!G.talking; },
      speaking() { return !!G.speaking; },
      ids() { return G.actors.map(a => a.id).join(','); },
      actor(id) { return G.actors.find(a => a.id === id); },
      clearOf(p, except) {
        const [sx, sy] = TOUR.toScene(p), sc = G.scene;
        for (const a of G.actors) {
          if (a === except) continue;
          const [hx, hy] = sceneProject(sc, a.x, a.y, a.sit ? .9 : 1.1);
          if (Math.hypot((sx - hx) * 1.2, sy - hy) < 13 * sc.S / 14 + 6) return false;
        }
        for (const c of G.critters) { const [hx, hy] = sceneProject(sc, c.x, c.y, c.z || .3); if (Math.hypot(sx - hx, sy - hy) < 14) return false; }
        return true;
      },
      pickAt(p) { const [sx, sy] = TOUR.toScene(p), sc = G.scene, ix = sx | 0, iy = sy | 0; return ix >= 0 && iy >= 0 && ix < sc.W && iy < sc.H ? sc.t.pick[iy * sc.W + ix] : -1; },
      // where to tap a villager. Freezes a wandering one first so the tap lands.
      talkPt(id) {
        const a = TOUR.actor(id); if (!a) return JSON.stringify({ gone: true });
        const p = TOUR.scr(a.x, a.y, a.sit ? .9 : 1.1), on = TOUR.safe(p);
        if (on) { a.hold = true; a.path = null; }
        return JSON.stringify({ on, x: p[0], y: p[1], x0: a.x, y0: a.y });
      },
      release(id) { const a = TOUR.actor(id); if (a && !G.talking) a.hold = false; },
      // a point on screen to tap on the ground to walk toward world (wx, wy)
      step(wx, wy) {
        const p = G.player, path = findPath(G.scene.nav, p.x, p.y, wx, wy);
        if (!path || !path.length) return 'null';
        const pts = []; let px = p.x, py = p.y;
        for (const [x, y] of path) { const d = Math.hypot(x - px, y - py), n = Math.max(1, Math.ceil(d / .5)); for (let k = 1; k <= n; k++) pts.push([px + (x - px) * k / n, py + (y - py) * k / n]); px = x; py = y; }
        for (let i = pts.length - 1; i >= 0; i--) {
          const [x, y] = pts[i]; if (Math.hypot(x - p.x, y - p.y) < 1.6) break;
          const s = TOUR.scr(x, y, 0);
          if (TOUR.safe(s) && TOUR.pickAt(s) === 0 && TOUR.clearOf(s, null)) return JSON.stringify(s);
        }
        return 'null';
      },
      doorOf(id) { const d = G.scene.doors.find(d => d.id === id); return d ? JSON.stringify([d.x, d.y]) : 'null'; },
      // a screen point on a pickable object (building wall, scroll, mirror, exit door)
      pickPt(pk) {
        const sc = G.scene, hits = []; let cx = 0, cy = 0;
        for (let y = 150; y < innerHeight - 200; y += 3) for (let x = 40; x < innerWidth - 40; x += 3) if (TOUR.pickAt([x, y]) === pk) { hits.push([x, y]); cx += x; cy += y; }
        if (!hits.length) return 'null';
        cx /= hits.length; cy /= hits.length;
        hits.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
        for (const h of hits) if (TOUR.clearOf(h, null)) return JSON.stringify(h);
        return 'null';
      },
      worldAt(u, v) { return JSON.stringify(at(u, v)); },
      // a smooth camera flight over a list of stops: [u, v] in village layout units, or 'player' to come back
      fly(stops, ms) {
        TOUR.busy = true; G.cam.follow = false;
        const sc = G.scene, b = sc.bounds;
        const tgt = s => {
          if (s === 'player') return cameraTarget();
          const [x, y] = at(s[0], s[1]), [fx, fy] = sceneProject(sc, x, y, 1);
          return [b.x1 - b.x0 <= V.W ? (b.x0 + b.x1) / 2 - V.W / 2 : clamp(fx - V.W / 2, b.x0, b.x1 - V.W),
                  b.y1 - b.y0 <= V.H ? (b.y0 + b.y1) / 2 - V.H / 2 : clamp(fy - V.H * .5, b.y0, b.y1 - V.H)];
        };
        let i = 0, from = [G.cam.x, G.cam.y], to = tgt(stops[0]), t0 = performance.now();
        const tick = now => {
          const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          if (stops[i] === 'player') to = cameraTarget();
          G.cam.x = from[0] + (to[0] - from[0]) * e; G.cam.y = from[1] + (to[1] - from[1]) * e;
          if (k < 1) { requestAnimationFrame(tick); return; }
          i++;
          if (i < stops.length) { from = [G.cam.x, G.cam.y]; to = tgt(stops[i]); t0 = now; requestAnimationFrame(tick); }
          else { if (stops[stops.length - 1] === 'player') G.cam.follow = true; TOUR.busy = false; }
        };
        requestAnimationFrame(tick);
        return 'ok';
      },
      zoom() { return G.zoom; },
    };
    'ok'
    """#
}
#endif
