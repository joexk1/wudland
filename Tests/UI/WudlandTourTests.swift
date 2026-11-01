import XCTest

/// A scripted, paced walk through the whole app for screen recording (launch videos, store previews).
/// Skipped unless the runner is given WUDLAND_TOUR=1 (xcodebuild: `TEST_RUNNER_WUDLAND_TOUR=1`). It launches the app with
/// `-WudlandTour` (DEBUG only): fictional demo data, scripted villager lines, and a file channel in /tmp/wudland-tour
/// that tells this test where things are on the canvas, so every interaction is a real touch.
final class WudlandTourTests: XCTestCase {
    let dir = "/tmp/wudland-tour"
    var n = 1
    var app = XCUIApplication()
    let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

    override func setUp() { continueAfterFailure = false }

    // MARK: plumbing

    func pause(_ s: Double) { Thread.sleep(forTimeInterval: s) }

    func mark(_ name: String) {
        let line = String(format: "%.3f\t%@\n", Date().timeIntervalSince1970, name)
        let path = dir + "/marks.txt"
        if let h = FileHandle(forWritingAtPath: path) { h.seekToEndOfFile(); h.write(line.data(using: .utf8)!); try? h.close() }
        else { try? line.write(toFile: path, atomically: true, encoding: .utf8) }
        print("MARK", name)
    }

    @discardableResult func js(_ src: String, timeout: Double = 20) -> String {
        let id = n; n += 1
        try? src.write(toFile: "\(dir)/in.\(id).js", atomically: true, encoding: .utf8)
        let out = "\(dir)/out.\(id).txt"
        let end = Date().addingTimeInterval(timeout)
        while Date() < end {
            if let s = try? String(contentsOfFile: out, encoding: .utf8) { try? FileManager.default.removeItem(atPath: out); return s }
            pause(0.04)
        }
        XCTFail("no answer from the app for: \(src)")
        return "null"
    }
    func json(_ src: String) -> Any? {
        let s = js(src)
        guard s != "null", let d = s.data(using: .utf8) else { return nil }
        return try? JSONSerialization.jsonObject(with: d)
    }
    func until(_ timeout: Double, _ cond: () -> Bool) -> Bool {
        let end = Date().addingTimeInterval(timeout)
        while Date() < end { if cond() { return true }; pause(0.15) }
        return cond()
    }
    func tap(_ x: Double, _ y: Double) {
        app.windows.firstMatch.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: x, dy: y)).tap()
    }
    func tap(_ p: [Double]) { tap(p[0], p[1]) }
    func idle(_ t: Double = 40) { _ = until(t) { js("T.idle()") == "true" } }
    func scene() -> String { js("T.scene()") }
    func button(_ prefix: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", prefix)).firstMatch
    }
    func buttonContaining(_ s: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", s)).firstMatch
    }
    func speakingDone() {
        pause(0.6)
        _ = until(14) { js("T.speaking()") == "false" }
        pause(0.4)
    }

    // MARK: moves

    /// walk toward a world point by tapping real ground, until the player is close or `stop` says so
    func walkToward(_ wx: Double, _ wy: Double, stop: () -> Bool) {
        for _ in 0..<40 {
            idle()
            if stop() { return }
            guard let s = json("T.step(\(wx), \(wy))") as? [Double] else { return }
            tap(s)
            pause(0.4)
        }
    }

    /// tap a villager, walking up to them first if they are off screen. Leaves the dialogue open.
    @discardableResult func talk(_ id: String) -> Bool {
        for _ in 0..<40 {
            idle()
            if js("T.talking()") == "true" { return true }
            guard let a = json("T.talkPt('\(id)')") as? [String: Any] else { return false }
            if a["gone"] != nil { return false }
            if (a["on"] as? Bool) == true, let x = a["x"] as? Double, let y = a["y"] as? Double {
                tap(x, y)
                if until(25, { js("T.talking()") == "true" }) { _ = button("Say goodbye").waitForExistence(timeout: 5); return true }
                js("T.release('\(id)')")
            } else if let x0 = a["x0"] as? Double, let y0 = a["y0"] as? Double {
                if let s = json("T.step(\(x0), \(y0))") as? [Double] { tap(s); pause(0.5) } else { pause(0.5) }
            }
        }
        return false
    }

    func closeTalk() {
        let b = button("Say goodbye")
        if b.exists { b.tap() }
        _ = until(6) { js("T.talking()") == "false" }
        pause(0.6)
    }

    /// greeting, a couple of quick questions, the ledger tab and one row
    func converse(_ id: String, chips: [String] = [], tab: String? = nil, row: String? = nil, wares: Bool = false, linger: Double = 1.8) {
        guard talk(id) else { XCTFail("could not talk to \(id)"); return }
        mark("talk \(id)")
        speakingDone(); pause(linger)
        for c in chips {
            let b = button(c)
            if b.exists && b.isHittable { b.tap(); speakingDone(); pause(linger) }
        }
        if let tab {
            let t = button(tab)
            if t.waitForExistence(timeout: 3) {
                t.tap(); pause(linger + 0.4)
                if let row {
                    let r = buttonContaining(row)
                    if r.waitForExistence(timeout: 3) { r.tap(); speakingDone(); pause(linger) }
                }
            }
        }
        if wares {
            let w = button("Wares")
            if w.exists { w.tap(); pause(2.4); let t = button("Talk"); if t.exists { t.tap(); pause(0.8) } }
        }
        closeTalk()
    }

    /// leave an interior with the Village button
    func leaveBuilding() {
        let b = button("Village")
        XCTAssertTrue(b.waitForExistence(timeout: 5))
        b.tap()
        XCTAssertTrue(until(10) { self.scene() == "village" })
        idle(); pause(1.2)
    }

    /// tap a building in the village (walking to it if needed) and wait until we are inside
    func enter(_ id: String, pick: Int, viaPill: String? = nil) {
        if let pill = viaPill {
            let b = button(pill)
            XCTAssertTrue(b.waitForExistence(timeout: 5)); b.tap()
        } else {
            for _ in 0..<40 {
                idle()
                if scene() == id { break }
                if let p = json("T.pickPt(\(pick))") as? [Double] { tap(p); pause(0.6); if until(30, { self.scene() == id }) { break } }
                else if let d = json("T.doorOf('\(id)')") as? [Double], let s = json("T.step(\(d[0]), \(d[1]))") as? [Double] { tap(s); pause(0.5) }
                else { pause(0.5) }
            }
        }
        XCTAssertTrue(until(60) { self.scene() == id }, "entering \(id)")
        idle(); pause(1.8)
    }

    func closeCard() { tap(200, 38); pause(0.9) }   // the dimmed backdrop above the parchment

    // MARK: the tour

    func testFullTour() throws {
        try XCTSkipUnless(ProcessInfo.processInfo.environment["WUDLAND_TOUR"] != nil, "recording tour only")
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        try? FileManager.default.removeItem(atPath: dir + "/marks.txt")
        app.launchArguments = ["-WudlandTour", "-lord.name", "Rowan", "-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launch()
        mark("launch")

        // 1. first-launch permission prompts
        var answered = 0
        let yes = ["Allow Full Access", "Allow While Using App", "Allow", "OK"]
        while answered < 6 {
            let alert = springboard.alerts.firstMatch
            guard alert.waitForExistence(timeout: answered == 0 ? 25 : 8) else { break }
            mark("permission prompt \(answered + 1)")
            pause(2.2)
            if let b = yes.lazy.map({ alert.buttons[$0] }).first(where: { $0.exists }) { b.tap() } else { alert.buttons.element(boundBy: alert.buttons.count - 1).tap() }
            answered += 1
            pause(1.0)
        }
        XCTAssertGreaterThan(answered, 0)
        XCTAssertTrue(until(60) { FileManager.default.fileExists(atPath: self.dir + "/ready") }, "channel ready")
        _ = until(30) { self.js("T.scene()") == "village" }
        pause(2.5)

        // 2. the village: HUD, then a slow flight over the whole island
        mark("village home view")
        pause(2.0)
        for stop in [[-8.8, -23.0], [8.4, -23.5], [0.0, -1.0], [12.0, -3.0], [9.0, 8.6], [2.2, 15.2], [-7.4, 21.6], [-9.2, 7.2]] as [[Double]] {
            js("T.fly([[\(stop[0]), \(stop[1])]], 3200)")
            _ = until(15) { self.js("T.busy") == "false" }
            pause(1.0)
        }
        js("T.fly(['player'], 2200)"); _ = until(10) { self.js("T.busy") == "false" }
        pause(1.0)
        mark("village zoom out and in")
        let web = app.webViews.firstMatch
        web.pinch(withScale: 0.5, velocity: -1.0); pause(2.2)
        web.pinch(withScale: 0.6, velocity: -1.0); pause(3.0)
        web.pinch(withScale: 2.0, velocity: 1.0); pause(1.2)
        web.pinch(withScale: 2.0, velocity: 1.0); pause(1.8)

        // 3. villagers out and about
        mark("villagers outdoors")
        converse("fennick", chips: ["What was I playing?"])
        converse("hilda", chips: ["I'm tired"])
        converse("barnaby", chips: ["Read me the news"], tab: "Notices", row: "Water the ferns")
        converse("wren", chips: ["What's new?"])
        converse("clank", chips: ["Which machines are up?"])
        converse("bram", chips: ["Will it rain?"])
        if let agentID = (js("T.ids()").split(separator: ",").map(String.init).first { $0.hasPrefix("agent:") }) {
            converse(agentID, chips: ["What are you doing?"], tab: "Work log")
        }

        // 4. notice board (reminders)
        mark("notice board")
        let bw = json("T.worldAt(3.4, 2.6)") as? [Double] ?? [0, 0]
        for _ in 0..<40 {
            idle()
            if js("T.talking()") == "true" { break }
            if let p = json("T.pickPt(40)") as? [Double] { tap(p); pause(0.6); if until(30, { self.js("T.talking()") == "true" }) { break } }
            else if let s = json("T.step(\(bw[0]), \(bw[1]))") as? [Double] { tap(s); pause(0.5) }
            else { pause(0.5) }
        }
        _ = button("Say goodbye").waitForExistence(timeout: 5)
        speakingDone(); pause(1.8)
        let notices = button("Notices")
        if notices.exists { notices.tap(); pause(2.4); let r = buttonContaining("Call the plumber"); if r.exists { r.tap(); speakingDone(); pause(1.8) } }
        closeTalk()

        // 5. buildings. The three HUD pills walk and open the post, bell tower and guild.
        // 5a. Raven Post
        mark("Raven Post")
        enter("post", pick: 1, viaPill: "Unread letters")
        converse("pim", chips: ["What's important?"], tab: "Letters", row: "Lunch on Thursday")
        leaveBuilding()

        // 5b. Bell Tower (calendar)
        mark("Bell Tower")
        enter("bell", pick: 6, viaPill: "Events today")
        converse("tobias", chips: ["What's on today?"], tab: "Days", row: "Dentist")
        leaveBuilding()

        // 5c. Artificers' Guild
        mark("Artificers' Guild")
        enter("guild", pick: 2, viaPill: "Agents at work")
        converse("gearwin", chips: ["Who's working now?"], tab: "Ledger", row: "Refactor the login")
        let ids = js("T.ids()").split(separator: ",").map(String.init).filter { $0.hasPrefix("agent:") }
        for (k, id) in ids.prefix(5).enumerated() {
            mark("guild agent \(k + 1)")
            converse(id, chips: k == 0 ? ["What are you doing?"] : [], tab: k == 0 ? "Work log" : nil)
        }
        leaveBuilding()

        // 5d. The Gossiping Goose
        mark("Gossiping Goose")
        enter("tavern", pick: 3)
        converse("mags", chips: ["Who's waiting on me?"], tab: "Tables", row: "Mina")
        let chats = js("T.ids()").split(separator: ",").map(String.init).filter { $0.hasPrefix("chat:") }
        for (k, id) in chats.prefix(4).enumerated() {
            mark("tavern patron \(k + 1)")
            converse(id, chips: k == 0 ? ["Sum it up"] : [], tab: k == 0 ? "Overheard" : nil)
        }
        leaveBuilding()

        // 5e. Odette's Curiosities
        mark("Odette's Curiosities")
        enter("shop", pick: 7)
        converse("odette", chips: ["What's good today?"], wares: true)
        leaveBuilding()

        // 5f. The Wizard's Tower and the spellbook
        mark("Wizard's Tower")
        enter("tower", pick: 5)
        mark("spellbook")
        if talk("wizard") {
            pause(2.2)
            let field = app.textFields.firstMatch
            if field.waitForExistence(timeout: 5) {
                field.tap(); pause(0.6)
                field.typeText("What is on my plate today?"); pause(1.2)
                let cast = button("Cast")
                if cast.exists { cast.tap() }
                _ = until(20) { self.app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Three bells")).firstMatch.exists }
                pause(3.0)
            }
            let close = button("Close the book")
            if close.exists { close.tap(); pause(1.0) }
            _ = until(8) { self.js("T.talking()") == "false" }
        }
        leaveBuilding()

        // 5g. The Cottage: Biscuit, today's scroll and the mirror
        mark("The Cottage")
        enter("home", pick: 4)
        converse("biscuit", chips: ["How's my day looking?"])
        mark("today's scroll")
        for _ in 0..<20 {
            idle()
            if let p = json("T.pickPt(91)") as? [Double] { tap(p); break } else { pause(0.5) }
        }
        pause(1.5); idle(); pause(2.6)
        pause(1.8)
        let sheetRegion = app.windows.firstMatch.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.6))
        sheetRegion.press(forDuration: 0.05, thenDragTo: app.windows.firstMatch.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3)), withVelocity: .slow, thenHoldForDuration: 0.5)
        pause(1.6)
        closeCard()
        mark("mirror")
        for _ in 0..<20 {
            idle()
            if let p = json("T.pickPt(92)") as? [Double] { tap(p); break } else { pause(0.5) }
        }
        pause(1.5); idle(); pause(2.6)
        closeCard()
        leaveBuilding()

        // 6. HUD: satchel, then Settings
        mark("satchel")
        let satchel = button("Satchel")
        if satchel.waitForExistence(timeout: 4) { satchel.tap(); pause(2.6); closeCard() }
        mark("settings")
        let cog = button("Settings")
        XCTAssertTrue(cog.waitForExistence(timeout: 4))
        cog.tap(); pause(2.2)
        let win = app.windows.firstMatch
        for k in 0..<5 {
            pause(k == 1 ? 3.2 : 1.8)   // the second stop is the Link a computer token
            win.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.72))
                .press(forDuration: 0.05, thenDragTo: win.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.34)), withVelocity: .slow, thenHoldForDuration: 0.4)
            if k == 0 { mark("settings link a computer") }
        }
        pause(2.0)
        closeCard()

        // 7. closing shot
        mark("closing")
        js("T.fly([[0, 0], 'player'], 3000)"); _ = until(15) { self.js("T.busy") == "false" }
        pause(3.0)
        mark("end")
    }
}
