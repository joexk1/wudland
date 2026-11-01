import Foundation
import EventKit
import CoreLocation
import MediaPlayer

/// Everything the village knows that comes from this phone: the calendar and reminders (EventKit),
/// the weather where you are (Open-Meteo, no account), and what you've been listening to (your music library).
/// Nothing here leaves the device except a rounded location sent to Open-Meteo for the forecast.
@MainActor
final class Sources: NSObject, CLLocationManagerDelegate {
    static let shared = Sources()
    let events = EKEventStore()
    private let location = CLLocationManager()
    private var lastFix: CLLocation?
    private var musicCache: (at: Date, value: Music?)?
    private var weatherCache: (at: Date, key: String, value: Weather)?
    private var locationWaiters: [CheckedContinuation<CLLocation?, Never>] = []
    private var authWaiters: [CheckedContinuation<Void, Never>] = []
    private func flushAuth() { let w = authWaiters; authWaiters = []; w.forEach { $0.resume() } }

    override init() {
        super.init()
        location.delegate = self
        location.desiredAccuracy = kCLLocationAccuracyReduced
    }

    // MARK: permissions

    var calendarAllowed: Bool { EKEventStore.authorizationStatus(for: .event) == .fullAccess }
    var remindersAllowed: Bool { EKEventStore.authorizationStatus(for: .reminder) == .fullAccess }
    var locationAllowed: Bool { [.authorizedWhenInUse, .authorizedAlways].contains(location.authorizationStatus) }
    var musicAllowed: Bool { MPMediaLibrary.authorizationStatus() == .authorized }

    /// Asked once, on first launch: calendar and reminders (full access, so the villagers can read and add),
    /// then location for the weather, then the music library for the bard.
    func requestAll() async {
        if EKEventStore.authorizationStatus(for: .event) == .notDetermined { _ = try? await events.requestFullAccessToEvents() }
        if EKEventStore.authorizationStatus(for: .reminder) == .notDetermined { _ = try? await events.requestFullAccessToReminders() }
        if location.authorizationStatus == .notDetermined {
            // wait for the answer (or 60 s) so the next prompt doesn't land on top of this one
            await withCheckedContinuation { (c: CheckedContinuation<Void, Never>) in
                authWaiters.append(c)
                location.requestWhenInUseAuthorization()
                Task { try? await Task.sleep(for: .seconds(60)); self.flushAuth() }
            }
        }
        if MPMediaLibrary.authorizationStatus() == .notDetermined {
            _ = await withCheckedContinuation { (c: CheckedContinuation<MPMediaLibraryAuthorizationStatus, Never>) in
                MPMediaLibrary.requestAuthorization { c.resume(returning: $0) }
            }
        }
    }

    // MARK: calendar

    func almanac() -> Almanac? {
        guard calendarAllowed else { return nil }
        let cal = Calendar.current, now = Date()
        let start = cal.startOfDay(for: now), end = cal.date(byAdding: .day, value: 8, to: start)!
        let pred = events.predicateForEvents(withStart: start, end: end, calendars: nil)
        let found = events.events(matching: pred).sorted { $0.startDate < $1.startDate }
        let mapped: [Event] = found.compactMap { e in
            guard e.endDate > now || e.isAllDay && cal.isDateInToday(e.startDate) else { return nil }
            return Event(title: e.title ?? "Untitled", start: e.isAllDay ? Self.day.string(from: e.startDate) : When.iso.string(from: e.startDate),
                         all_day: e.isAllDay, location: (e.location ?? "").isEmpty ? nil : e.location)
        }
        let today = mapped.filter { When.date($0.start).map(cal.isDateInToday) ?? false }
        return Almanac(events: Array(mapped.prefix(40)), today: today)
    }

    // MARK: reminders

    struct Task_: Codable, Equatable { var id: String; var title: String; var due: String?; var overdue: Bool; var notes: String? }

    func reminders() async -> [Task_] {
        guard remindersAllowed else { return [] }
        let pred = events.predicateForIncompleteReminders(withDueDateStarting: nil, ending: nil, calendars: nil)
        let now = Date()
        return await withCheckedContinuation { c in
            events.fetchReminders(matching: pred) { found in
                let out: [Task_] = (found ?? []).map { r in
                    let due = r.dueDateComponents.flatMap { Calendar.current.date(from: $0) }
                    return Task_(id: r.calendarItemIdentifier, title: r.title ?? "Untitled", due: due.map { When.iso.string(from: $0) },
                                 overdue: due.map { $0 < now } ?? false, notes: (r.notes ?? "").isEmpty ? nil : String(r.notes!.prefix(200)))
                }
                // due soonest first, undated last
                c.resume(returning: out.sorted { ($0.due ?? "9999") < ($1.due ?? "9999") })
            }
        }
    }

    func completeReminder(_ id: String) {
        guard let r = events.calendarItem(withIdentifier: id) as? EKReminder else { return }
        r.isCompleted = true
        try? events.save(r, commit: true)
    }

    /// used by the wizard's spells
    func addReminder(title: String, due: Date?) throws -> String {
        guard remindersAllowed else { throw SourceError.noAccess("reminders") }
        let r = EKReminder(eventStore: events)
        r.title = title
        r.calendar = events.defaultCalendarForNewReminders()
        if let due { r.dueDateComponents = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: due); r.addAlarm(EKAlarm(absoluteDate: due)) }
        try events.save(r, commit: true)
        return "Added reminder \u{201C}\(title)\u{201D}" + (due.map { " for \($0.formatted(date: .abbreviated, time: .shortened))" } ?? "")
    }
    func addEvent(title: String, start: Date, minutes: Int) throws -> String {
        guard calendarAllowed else { throw SourceError.noAccess("calendar") }
        let e = EKEvent(eventStore: events)
        e.title = title; e.startDate = start; e.endDate = start.addingTimeInterval(TimeInterval(max(5, min(minutes, 24 * 60)) * 60))
        e.calendar = events.defaultCalendarForNewEvents
        try events.save(e, span: .thisEvent, commit: true)
        return "Added \u{201C}\(title)\u{201D} on \(start.formatted(date: .abbreviated, time: .shortened))"
    }
    enum SourceError: LocalizedError {
        case noAccess(String)
        var errorDescription: String? { if case .noAccess(let w) = self { return "Wudland isn't allowed to use your \(w). You can turn it on in iOS Settings." }; return nil }
    }

    // MARK: weather (Open-Meteo, no key)

    func weather() async -> Weather? {
        var lat: Double, lon: Double
        let chosenTown = (UserDefaults.standard.string(forKey: "weather.town") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !chosenTown.isEmpty {
            guard let town = await townCoordinates() else { return weatherCache?.value }
            (lat, lon) = town
        } else if let fix = await currentLocation() {
            // two decimal places is about a kilometre: plenty for a forecast, kind to privacy
            lat = (fix.coordinate.latitude * 100).rounded() / 100; lon = (fix.coordinate.longitude * 100).rounded() / 100
        } else { return nil }
        let key = "\(lat),\(lon)"
        if let c = weatherCache, c.key == key, -c.at.timeIntervalSinceNow < 20 * 60 { return c.value }
        var u = URLComponents(string: "https://api.open-meteo.com/v1/forecast")!
        u.queryItems = [.init(name: "latitude", value: "\(lat)"), .init(name: "longitude", value: "\(lon)"),
                        .init(name: "current", value: "temperature_2m,weather_code,wind_speed_10m"),
                        .init(name: "daily", value: "temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset"),
                        .init(name: "timezone", value: "auto"), .init(name: "forecast_days", value: "2")]
        struct R: Decodable {
            struct Cur: Decodable { var temperature_2m: Double; var weather_code: Int; var wind_speed_10m: Double }
            struct Day: Decodable { var temperature_2m_max: [Double]; var temperature_2m_min: [Double]; var weather_code: [Int]; var sunrise: [String]; var sunset: [String] }
            var current: Cur; var daily: Day; var utc_offset_seconds: Int
        }
        guard let url = u.url, let (d, resp) = try? await URLSession.shared.data(for: URLRequest(url: url, timeoutInterval: 12)),
              (resp as? HTTPURLResponse)?.statusCode == 200, let r = try? JSONDecoder().decode(R.self, from: d) else { return weatherCache?.value }
        let off = r.utc_offset_seconds
        func iso(_ local: String) -> String? {
            let f = DateFormatter(); f.locale = Locale(identifier: "en_US_POSIX"); f.dateFormat = "yyyy-MM-dd'T'HH:mm"; f.timeZone = TimeZone(secondsFromGMT: off)
            return f.date(from: local).map { When.iso.string(from: $0) }
        }
        let w = Weather(temp: Int(r.current.temperature_2m.rounded()), kind: Self.kind(r.current.weather_code), wind: Int(r.current.wind_speed_10m.rounded()),
                        high: r.daily.temperature_2m_max.first.map { Int($0.rounded()) }, low: r.daily.temperature_2m_min.first.map { Int($0.rounded()) },
                        tomorrow: r.daily.weather_code.count > 1 ? Self.kind(r.daily.weather_code[1]) : nil,
                        sunrise: r.daily.sunrise.first.flatMap(iso), sunset: r.daily.sunset.first.flatMap(iso))
        weatherCache = (.now, key, w)
        return w
    }

    /// WMO weather codes, in the words the village understands
    static func kind(_ code: Int) -> String {
        switch code {
        case 0: return "clear"
        case 1: return "mainly clear"
        case 2: return "partly cloudy"
        case 3: return "overcast"
        case 45, 48: return "fog"
        case 51...57: return "drizzle"
        case 61...67, 80...82: return "rain"
        case 71...77, 85, 86: return "snow"
        case 95...99: return "storm"
        default: return "cloudy"
        }
    }

    /// a town typed in Settings, for people who'd rather not share location
    private func townCoordinates() async -> (Double, Double)? {
        let town = (UserDefaults.standard.string(forKey: "weather.town") ?? "").trimmingCharacters(in: .whitespaces)
        guard !town.isEmpty else { return nil }
        if let c = UserDefaults.standard.array(forKey: "weather.townCoord") as? [Double], c.count == 3, UserDefaults.standard.string(forKey: "weather.townFor") == town { return (c[0], c[1]) }
        var u = URLComponents(string: "https://geocoding-api.open-meteo.com/v1/search")!
        u.queryItems = [.init(name: "name", value: town), .init(name: "count", value: "1")]
        struct G: Decodable { struct P: Decodable { var latitude: Double; var longitude: Double }; var results: [P]? }
        guard let url = u.url, let (d, _) = try? await URLSession.shared.data(for: URLRequest(url: url, timeoutInterval: 12)), let p = (try? JSONDecoder().decode(G.self, from: d))?.results?.first else { return nil }
        UserDefaults.standard.set([p.latitude, p.longitude, 1], forKey: "weather.townCoord"); UserDefaults.standard.set(town, forKey: "weather.townFor")
        return (p.latitude, p.longitude)
    }

    private func currentLocation() async -> CLLocation? {
        guard locationAllowed else { return nil }
        if let f = lastFix, -f.timestamp.timeIntervalSinceNow < 30 * 60 { return f }
        location.requestLocation()
        return await withCheckedContinuation { c in
            locationWaiters.append(c)
            Task { try? await Task.sleep(for: .seconds(8)); self.flushLocation(self.lastFix) }
        }
    }
    private func flushLocation(_ l: CLLocation?) { let w = locationWaiters; locationWaiters = []; w.forEach { $0.resume(returning: l) } }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        guard status != .notDetermined else { return }
        Task { @MainActor in self.flushAuth() }
    }
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let l = locations.last
        Task { @MainActor in self.lastFix = l ?? self.lastFix; self.flushLocation(self.lastFix) }
    }
    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in self.flushLocation(self.lastFix) }
    }

    // MARK: music (the library's play history; no account, nothing sent anywhere)

    // the media query walks the whole library, so it never waits on the main thread; cached 10 minutes
    func music() async -> Music? {
        guard musicAllowed else { return nil }
        if let cache = musicCache, -cache.at.timeIntervalSinceNow < 600 { return cache.value }
        let library: (recent: [Music.Track], top: [String]) = await Task.detached(priority: .utility) { () -> (recent: [Music.Track], top: [String]) in
            let songs = (MPMediaQuery.songs().items ?? [])
            let recent = songs.filter { $0.lastPlayedDate != nil }
                .sorted { ($0.lastPlayedDate ?? .distantPast) > ($1.lastPlayedDate ?? .distantPast) }
                .prefix(10)
                .map { Music.Track(name: $0.title, artist: $0.artist, album: $0.albumTitle, at: $0.lastPlayedDate.map { When.iso.string(from: $0) }, playing: false) }
            var plays: [String: Int] = [:]
            for s in songs { if let a = s.artist, s.playCount > 0 { plays[a, default: 0] += s.playCount } }
            return (recent, plays.sorted { $0.value > $1.value }.prefix(5).map(\.key))
        }.value
        var now: Music.Track?
        let nowPlaying = await MainActor.run { () -> MPMediaItem? in
            let player = MPMusicPlayerController.systemMusicPlayer
            return player.playbackState == .playing ? player.nowPlayingItem : nil
        }
        if let item = nowPlaying {
            now = Music.Track(name: item.title, artist: item.artist, album: item.albumTitle, at: When.iso.string(from: .now), playing: true)
        }
        let result: Music? = library.recent.isEmpty && now == nil ? nil : Music(now: now, recent: library.recent, top: library.top)
        musicCache = (.now, result)
        return result
    }

    static let day: DateFormatter = { let f = DateFormatter(); f.locale = Locale(identifier: "en_US_POSIX"); f.dateFormat = "yyyy-MM-dd"; return f }()
}
