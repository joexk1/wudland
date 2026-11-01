import Foundation

// The hub's /api/village snapshot. Every section is optional: a source that is down simply
// leaves its building quiet instead of breaking the village.
struct Village: Codable, Equatable {
    var generated_at: String?
    var mail: Mail?
    var whatsapp: WhatsApp?
    var calendar: Almanac?
    var notices: Notices?
    var weather: Weather?
    var agents: Agents?
    var music: Music?
}

struct Music: Codable, Equatable {
    struct Track: Codable, Equatable { var name: String?; var artist: String?; var album: String?; var at: String?; var playing: Bool? }
    var now: Track?
    var recent: [Track] = []
    var top: [String]?
}

struct Mail: Codable, Equatable {
    var unread_count: Int = 0
    var unread_people: Int = 0
    var letters: [Letter] = []
}
struct Letter: Codable, Equatable, Identifiable {
    var id: String
    var from: String
    var address: String?
    var subject: String
    var date: String?
    var unread: Bool
    var flagged: Bool?
    var noise: Bool?
    var summary: String?
}
struct LetterDetail: Codable {
    var id: String
    var subject: String?
    var from: String?
    var date: String?
    var text: String?
}

struct WhatsApp: Codable, Equatable {
    var chats: [Chat] = []
    var waiting: Int = 0
    var last_sync: String?
}
struct Chat: Codable, Equatable, Identifiable {
    var id: String
    var name: String
    var group: Bool
    var last_at: String
    var waiting: Bool
    var recent: [ChatLine] = []
}
struct ChatLine: Codable, Equatable {
    var who: String
    var me: Bool
    var at: String
    var text: String
}
struct ChatDetail: Codable {
    var id: String
    var name: String
    var group: Bool
    var messages: [ChatLine]
}

struct Almanac: Codable, Equatable {
    var events: [Event] = []
    var today: [Event] = []
}
struct Event: Codable, Equatable, Identifiable {
    var id: String { title + start }
    var title: String
    var start: String
    var all_day: Bool
    var location: String?
}

struct Notices: Codable, Equatable {
    var notes: [Note] = []
    var briefing: Briefing?
}
struct Note: Codable, Equatable, Identifiable {
    var id: String
    var title: String
    var body: String
    var at: String?
    var read: Bool
}
struct Briefing: Codable, Equatable {
    var text: String
    var at: String?
}

struct Weather: Codable, Equatable {
    var temp: Int
    var kind: String
    var wind: Int?
    var high: Int?
    var low: Int?
    var tomorrow: String?
    var sunrise: String?
    var sunset: String?
}

struct Agents: Codable, Equatable {
    var hosts: [Host] = []
    var busy: Int = 0
    var nodes: [AgentNode] = []
}
struct Host: Codable, Equatable {
    var name: String
    var online: Bool
    var detail: String?
}
struct AgentNode: Codable, Equatable, Identifiable {
    var id: String
    var parent: String?
    var source: String?
    var host: String?
    var name: String
    var status: String?
    var busy: Bool
    var failed: Bool?
    var model: String?
    var `where`: String?
    var started: String?
    var last_activity: String?
    var tool_calls: Int?
    var detail: [String]?
}

// Pages in the wizard's spellbook
struct Spellbook: Codable {
    var pages: [Page]
    var busy: Bool
    var model: String?
    var doing: String?
    var error: String?
}
/// What Thistlewick did behind an answer: the spells (tools) he cast, memories and skills he drew on, his private thought.
struct Marginalia: Codable, Equatable {
    struct Tool: Codable, Equatable { var name: String; var args: String; var ok: Bool; var out: String? }
    var tools: [Tool]?
    var memories: [String]?
    var skills: [String]?
    var plugins: [String]?
    var thought: String?
}
struct Page: Codable, Equatable, Identifiable {
    var id = UUID()
    var role: String   // "joe" | "wizard"
    var text: String
    var notice: Bool?
    var marg: Marginalia?
    enum CodingKeys: String, CodingKey { case role, text, notice, marg }
}

// MARK: - time helpers

enum When {
    static let iso: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()
    static let isoFrac: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    static func date(_ s: String?) -> Date? {
        guard let s else { return nil }
        if let d = iso.date(from: s) ?? isoFrac.date(from: s) { return d }
        if s.count == 10 {  // all-day dates
            let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.date(from: s)
        }
        return nil
    }
    /// "just now", "12m ago", "3h ago", "yesterday", "4 Oct"
    static func ago(_ s: String?) -> String {
        guard let d = date(s) else { return "" }
        let m = Int(-d.timeIntervalSinceNow / 60)
        if m < 1 { return "just now" }
        if m < 60 { return "\(m)m ago" }
        if m < 60 * 24 { return "\(m / 60)h ago" }
        if m < 60 * 48 { return "yesterday" }
        return d.formatted(.dateTime.day().month(.abbreviated))
    }
    /// "Today 14:00", "Tue 09:30", "Mon (all day)"
    static func event(_ e: Event) -> String {
        guard let d = date(e.start) else { return e.start }
        let cal = Calendar.current
        let day = cal.isDateInToday(d) ? "Today" : cal.isDateInTomorrow(d) ? "Tomorrow" : d.formatted(.dateTime.weekday(.abbreviated).day())
        return e.all_day ? "\(day), all day" : "\(day) \(d.formatted(.dateTime.hour(.twoDigits(amPM: .omitted)).minute()))"
    }
}
