import XCTest

/// A lean walk through the app that only captures the honest store screenshots:
/// the village and the interiors of the buildings, no recording, no scripted dialogue chains.
/// Skipped unless the runner is given WUDLAND_SHOTS=1 (`xcodebuild: TEST_RUNNER_WUDLAND_SHOTS=1`).
/// Uses the same DEBUG `-WudlandTour` demo mode as `WudlandTourTests`, which must not fire in release.
final class WudlandShotsTests: XCTestCase {
    /// the app side of the channel is hardcoded to /tmp/wudland-tour (TourMode.swift)
    let dir = "/tmp/wudland-tour"
    var n = 1
    var app = XCUIApplication()
    let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

    override func setUp() { continueAfterFailure = true }

    func snap(_ name: String) {
        let a = XCTAttachment(screenshot: app.screenshot())
        a.name = name
        a.lifetime = .keepAlways
        add(a)
    }

    func pause(_ s: Double) { Thread.sleep(forTimeInterval: s) }

    @discardableResult func js(_ src: String, timeout: Double = 8) -> String {
        let id = n; n += 1
        try? src.write(toFile: "\(dir)/in.\(id).js", atomically: true, encoding: .utf8)
        let out = "\(dir)/out.\(id).txt"
        let end = Date().addingTimeInterval(timeout)
        while Date() < end {
            if let s = try? String(contentsOfFile: out, encoding: .utf8) { try? FileManager.default.removeItem(atPath: out); return s }
            pause(0.04)
        }
        print("WARN: no answer from the app for:", src)
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
    func idle(_ t: Double = 40) { _ = until(t) { js("TOUR.idle()") == "true" } }
    func scene() -> String { js("TOUR.scene()") }
    func button(_ prefix: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", prefix)).firstMatch
    }
    func buttonContaining(_ s: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", s)).firstMatch
    }

    // MARK: moves

    func walkOnboarding() {
        guard app.buttons["Come in"].waitForExistence(timeout: 6) else { return }
        app.buttons["Come in"].tap()
        for label in ["That's me", "Next"] {
            let b = app.buttons[label]
            if b.waitForExistence(timeout: 6) { b.tap(); pause(1.0) }
        }
        let ask = app.buttons["Ask me"]
        if ask.waitForExistence(timeout: 6) { ask.tap() }
        let yes = ["Allow Full Access", "Allow While Using App", "Allow", "OK"]
        let deadline = Date().addingTimeInterval(40)
        while Date() < deadline {
            let alert = springboard.alerts.firstMatch
            if alert.waitForExistence(timeout: 4) {
                if let b = yes.lazy.map({ alert.buttons[$0] }).first(where: { $0.exists }) { b.tap() } else { alert.buttons.element(boundBy: alert.buttons.count - 1).tap() }
                pause(1.0)
            } else { break }
        }
        let later = app.buttons["Maybe later"]
        if later.waitForExistence(timeout: 6) { later.tap() }
        pause(1.5)
    }

    /// if WebKit's process died and the village reloaded with fresh state, the tutorial cards come back
    func dismissOnboarding() {
        for label in ["Come in", "That's me", "Next", "Ask me", "Maybe later"] {
            let b = app.buttons[label]
            if b.exists { b.tap(); pause(0.6) }
        }
    }

    func leaveBuilding() {
        guard scene() != "village" else { return }
        let b = button("Village")
        if b.waitForExistence(timeout: 5) { b.tap() }
        _ = until(10) { self.scene() == "village" }
        idle(); pause(1.0)
    }

    func enter(_ id: String, pick: Int, viaPill: String? = nil) {
        if let pill = viaPill {
            let b = button(pill)
            if b.waitForExistence(timeout: 5) { b.tap() }
        }
        for _ in 0..<20 {
            dismissOnboarding()
            idle()
            if scene() == id { break }
            var moved = false
            if let p = json("TOUR.pickPt(\(pick))") as? [Double] { tap(p); pause(0.6); if until(30, { self.scene() == id }) { break }; moved = true }
            if !moved, let d = json("TOUR.doorOf('\(id)')") as? [Double], let s = json("TOUR.step(\(d[0]), \(d[1]))") as? [Double] { tap(s); pause(0.5) }
        }
        _ = until(45) { self.scene() == id }
        idle(); pause(1.6)
        dismissOnboarding()
        idle()
    }

    func closeCard() { tap(200, 38); pause(0.9) }

    // MARK: the shots

    func testShots() throws {
        try XCTSkipUnless(ProcessInfo.processInfo.environment["WUDLAND_SHOTS"] != nil, "store shots only")
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        app.launchArguments = ["-WudlandTour", "-lord.name", "Rowan", "-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launch()
        walkOnboarding()
        var answered = 0
        let yes = ["Allow Full Access", "Allow While Using App", "Allow", "OK"]
        let deadline = Date().addingTimeInterval(40)
        while Date() < deadline, answered < 6 {
            let alert = springboard.alerts.firstMatch
            guard alert.waitForExistence(timeout: 4) else { break }
            pause(1.8)
            if let b = yes.lazy.map({ alert.buttons[$0] }).first(where: { $0.exists }) { b.tap() } else { alert.buttons.element(boundBy: alert.buttons.count - 1).tap() }
            answered += 1
            pause(1.0)
        }
        XCTAssertTrue(until(60) { FileManager.default.fileExists(atPath: self.dir + "/ready") }, "channel ready")
        _ = until(40) { self.js("TOUR.scene()") == "village" }
        pause(2.5)
        snap("01-village")

        // Bell Tower (calendar)
        enter("bell", pick: 6, viaPill: "Events today")
        snap("02-bell-tower")
        leaveBuilding()

        // Raven Post (mail)
        enter("post", pick: 1, viaPill: "Unread letters")
        snap("03-raven-post")
        leaveBuilding()

        // notice board (reminders): stand by it if we can, else keep walking
        let bw = json("TOUR.worldAt(3.4, 2.6)") as? [Double] ?? [0, 0]
        for _ in 0..<20 {
            idle()
            if let p = json("TOUR.pickPt(40)") as? [Double] { tap(p); break }
            if let s = json("TOUR.step(\(bw[0]), \(bw[1]))") as? [Double] { tap(s); pause(0.5) }
        }
        pause(1.5); idle(); pause(1.6)
        snap("04-notice-board")
        leaveBuilding()

        // Artificers' Guild (agents)
        enter("guild", pick: 2, viaPill: "Agents at work")
        snap("05-guild")
        leaveBuilding()

        // Wizard's tower and spellbook
        enter("tower", pick: 5)
        snap("06-tower")
        leaveBuilding()

        // Cottage: Biscuit and today's scroll
        enter("home", pick: 4)
        snap("07-cottage")
        for _ in 0..<16 {
            idle()
            if let p = json("TOUR.pickPt(91)") as? [Double] { tap(p); break } else { pause(0.5) }
        }
        pause(1.5); idle(); pause(2.4)
        snap("08-scroll")
        leaveBuilding()

        // Settings: Link a computer with the live rotating code
        let cog = button("Settings")
        if cog.waitForExistence(timeout: 4) {
            cog.tap(); pause(2.0)
            let win = app.windows.firstMatch
            for k in 0..<5 {
                pause(k == 1 ? 3.2 : 1.8)
                win.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.72))
                    .press(forDuration: 0.05, thenDragTo: win.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.34)), withVelocity: .slow, thenHoldForDuration: 0.4)
                if k == 1 { snap("09-settings-link") }
            }
            closeCard()
        }
    }
}
