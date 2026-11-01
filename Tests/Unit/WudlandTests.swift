import XCTest
import EventKit
@testable import Wudland

@MainActor
final class LinkTokenTests: XCTestCase {
    func testTokenIsSixDigitsAndStableWithinAMinute() {
        let hub = LinkHub.shared
        let start = Date(timeIntervalSince1970: (Date().timeIntervalSince1970 / 60).rounded(.down) * 60)
        let a = hub.code(at: start), b = hub.code(at: start.addingTimeInterval(59))
        XCTAssertEqual(a.count, 6)
        XCTAssertTrue(a.allSatisfy(\.isNumber))
        XCTAssertEqual(a, b, "the token must hold for the whole 60 second step")
    }

    func testTokenRefreshesEveryMinute() {
        let hub = LinkHub.shared, now = Date()
        let codes = Set((0..<12).map { hub.code(at: now.addingTimeInterval(Double($0) * 60)) })
        XCTAssertGreaterThan(codes.count, 8, "consecutive minutes should give different tokens")
    }

    func testRotatingTheSecretChangesTheToken() {
        let hub = LinkHub.shared, now = Date()
        let before = (0..<3).map { hub.code(at: now.addingTimeInterval(Double($0) * 60)) }
        hub.rotateToken()
        let after = (0..<3).map { hub.code(at: now.addingTimeInterval(Double($0) * 60)) }
        XCTAssertNotEqual(before, after)
    }

    func testPairTopicMatchesThePluginVector() {
        XCTAssertEqual(LinkHub.pairTopic("123456"), "wudland-pair-a4df464352f33f65bd04c5b3")
    }
}

@MainActor
final class SourcesTests: XCTestCase {
    func testWeatherCodes() {
        XCTAssertEqual(Sources.kind(0), "clear")
        XCTAssertEqual(Sources.kind(3), "overcast")
        XCTAssertEqual(Sources.kind(45), "fog")
        XCTAssertEqual(Sources.kind(63), "rain")
        XCTAssertEqual(Sources.kind(73), "snow")
        XCTAssertEqual(Sources.kind(95), "storm")
    }

    func testStoreRoundTrip() {
        struct Probe: Codable, Equatable { var n: Int; var s: String }
        let p = Probe(n: 42, s: "duck")
        Store.save(p, "unit-test-probe.json")
        XCTAssertEqual(Store.load(Probe.self, "unit-test-probe.json"), p)
        try? FileManager.default.removeItem(at: Store.url("unit-test-probe.json"))
    }
}

/// Needs calendar and reminders access on the simulator (granted by the UI test or `simctl privacy grant`).
@MainActor
final class EventKitTests: XCTestCase {
    let src = Sources.shared

    func testAddAndReadBackAnEvent() throws {
        try XCTSkipUnless(src.calendarAllowed, "calendar access not granted on this simulator")
        let title = "Wudland test \(UUID().uuidString.prefix(6))"
        let start = Date().addingTimeInterval(3600)
        _ = try src.addEvent(title: title, start: start, minutes: 30)
        defer {
            let pred = src.events.predicateForEvents(withStart: start.addingTimeInterval(-60), end: start.addingTimeInterval(3600), calendars: nil)
            src.events.events(matching: pred).filter { $0.title == title }.forEach { try? src.events.remove($0, span: .thisEvent) }
        }
        let almanac = try XCTUnwrap(src.almanac())
        XCTAssertTrue(almanac.events.contains { $0.title == title }, "new event should show in the bell tower")
    }

    func testAddReadAndCompleteAReminder() async throws {
        try XCTSkipUnless(src.remindersAllowed, "reminders access not granted on this simulator")
        let title = "Wudland test \(UUID().uuidString.prefix(6))"
        _ = try src.addReminder(title: title, due: Date().addingTimeInterval(-60))
        let board = await src.reminders()
        let found = try XCTUnwrap(board.first { $0.title == title }, "new reminder should be on the notice board")
        defer { if let r = src.events.calendarItem(withIdentifier: found.id) as? EKReminder { try? src.events.remove(r, commit: true) } }
        XCTAssertTrue(found.overdue)
        src.completeReminder(found.id)
        let after = await src.reminders()
        XCTAssertFalse(after.contains { $0.title == title }, "completed reminders leave the board")
    }
}
