import XCTest

/// Walks a fresh install through onboarding and the first-run guide, saving a screenshot of every step.
/// Skipped unless the runner is given WUDLAND_ONBOARDING_SHOTS=1 (`xcodebuild: TEST_RUNNER_WUDLAND_ONBOARDING_SHOTS=1`).
/// Screenshots land in /tmp/wudland-onboarding on the host running the simulator.
final class WudlandOnboardingShotsTests: XCTestCase {
    let dir = "/tmp/wudland-onboarding"
    var app = XCUIApplication()
    var n = 1

    override func setUp() { continueAfterFailure = true }

    func pause(_ s: Double) { Thread.sleep(forTimeInterval: s) }

    func snap(_ name: String) {
        let shot = XCUIScreen.main.screenshot()
        try? shot.pngRepresentation.write(to: URL(fileURLWithPath: String(format: "%@/%02d-%@.png", dir, n, name)))
        n += 1
        let a = XCTAttachment(screenshot: shot); a.name = name; a.lifetime = .keepAlways; add(a)
    }

    func tapButton(_ label: String, timeout: Double = 8) {
        let b = app.buttons[label]
        XCTAssertTrue(b.waitForExistence(timeout: timeout), "no button \(label)")
        b.tap()
    }

    func testOnboardingShots() throws {
        try XCTSkipUnless(ProcessInfo.processInfo.environment["WUDLAND_ONBOARDING_SHOTS"] != nil, "onboarding shots only")
        try? FileManager.default.removeItem(atPath: dir)
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        app.launchArguments = ["-WudlandSilent", "-AppleLanguages", "(en)", "-AppleLocale", "en_GB"]
        app.launch()

        XCTAssertTrue(app.buttons["Come in"].waitForExistence(timeout: 30))
        pause(1.2); snap("welcome")
        tapButton("Come in"); pause(1.0); snap("name-empty")
        let field = app.textFields.firstMatch
        if field.waitForExistence(timeout: 5) { field.tap(); pause(0.6) }
        field.typeText("Rowan"); pause(0.6); snap("name-typed")
        tapButton("That's me"); pause(1.2); snap("who-lord")
        // the character page: pick each title in turn, ending on Lady so the village shows her look
        tapButton("Liege, m\u{2019}liege"); pause(0.8); snap("who-liege")
        tapButton("Lady, m\u{2019}lady"); pause(0.6)
        let skin = app.buttons["Skin 3"]; if skin.exists { skin.tap(); pause(0.3) }
        let hair = app.buttons["Hair 6"]; if hair.exists { hair.tap(); pause(0.3) }
        pause(0.6); snap("who-lady")
        tapButton("Onward"); pause(1.0); snap("permissions")
        tapButton("Not now"); pause(1.0); snap("link")
        tapButton("Maybe later"); pause(1.6); snap("village")

        // the first-run guide, if this build has one: step through it by tapping, a shot per step
        for step in 1...4 {
            let next = app.buttons.matching(identifier: "guide.next").firstMatch
            guard next.waitForExistence(timeout: 4) else { break }
            pause(0.9); snap("guide-\(step)")
            next.tap()
        }
        pause(1.2); snap("after-guide")

        // Settings: the title row and the connector switches, then switch Calendar off and back on to reconnect
        let sys = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        func allow() {
            for label in ["Allow Full Access", "Allow", "Allow While Using App", "OK"] {
                let b = sys.buttons[label]
                if b.waitForExistence(timeout: 1.5) { b.tap(); return }
            }
        }
        tapButton("Settings"); pause(2.4); snap("settings")
        let conn = app.descendants(matching: .any)["conn.calendar"]
        if conn.waitForExistence(timeout: 4) {
            conn.swipeUp(velocity: .slow); pause(1.0)
            let row = app.descendants(matching: .any)["conn.calendar"]
            snap("connectors-on")
            row.tap(); pause(1.2); snap("connector-off")
            row.tap(); pause(0.6); snap("reconnecting")
            // iOS asks for real when it has never been answered: photograph the prompt untouched, then answer Allow
            addUIInterruptionMonitor(withDescription: "permission") { alert in
                let ok = alert.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Allow'")).firstMatch
                if ok.exists { ok.tap(); return true }
                return false
            }
            pause(1.6); snap("reconnect-ios-asks")
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.04)).tap()
            pause(2.6); snap("reconnected")
        }
    }
}
