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
        tapButton("That's me"); pause(1.0); snap("permissions")
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
    }
}
