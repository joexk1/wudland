import XCTest

final class WudlandUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    /// First launch walks the onboarding: name, then the "Ask me" step asks for calendar,
    /// reminders, location and music. Allow them all, then check the village is up.
    func testFirstLaunchAsksPermissionsAndShowsTheVillage() throws {
        let app = XCUIApplication()
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        app.launch()
        var answered = 0
        let buttons = ["Allow Full Access", "Allow While Using App", "Allow", "OK"]
        let tap = { (label: String) in
            let b = app.buttons[label]
            if b.waitForExistence(timeout: 4) { b.tap() }
        }
        tap("Come in")
        tap("That's me")
        tap("Next")
        tap("Ask me")
        // answer every system permission prompt that appears while onboarding asks
        let deadline = Date().addingTimeInterval(40)
        while Date() < deadline {
            let alert = springboard.alerts.firstMatch
            if alert.waitForExistence(timeout: 4) {
                if let b = buttons.lazy.map({ alert.buttons[$0] }).first(where: { $0.exists }) {
                    b.tap(); answered += 1; continue
                }
                alert.buttons.element(boundBy: alert.buttons.count - 1).tap(); answered += 1
            } else if answered > 0 { break }
        }
        XCTAssertGreaterThan(answered, 0, "the Ask me step should ask for permissions")
        tap("Maybe later")
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 20), "village canvas should load")
        add(XCTAttachment(screenshot: app.screenshot()))
        XCTAssertEqual(app.state, .runningForeground)
    }

    /// State survives a restart and the app does not ask again.
    func testRelaunchKeepsStateWithoutAskingAgain() throws {
        let app = XCUIApplication()
        app.launch()
        _ = XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch.waitForExistence(timeout: 3)
        app.terminate()
        app.launch()
        XCTAssertFalse(XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch.waitForExistence(timeout: 5),
                       "permissions are only asked once")
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 20))
    }
}
