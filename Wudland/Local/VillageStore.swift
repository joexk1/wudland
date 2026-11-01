import Foundation
import Observation

@MainActor @Observable
final class VillageStore {
    var village = Village()
    var raw = Data("{}".utf8)
    var offline = false
    var lastError: String?
    var updated: Date?
    @ObservationIgnored private var polling: Task<Void, Never>?
    @ObservationIgnored private var refreshing = false

    init() {
        if let v = Store.load(Village.self, "village.json") { village = v; raw = (try? JSONEncoder().encode(v)) ?? raw }
    }
    func start(_ deliver: @escaping (Data) -> Void) {
        stop()
        polling = Task { [weak self] in
            while !Task.isCancelled {
                await self?.refresh(deliver)
                try? await Task.sleep(for: .seconds(8))
            }
        }
    }
    func stop() { polling?.cancel(); polling = nil; LinkHub.shared.stopPairing() }
    func refresh(_ deliver: ((Data) -> Void)? = nil) async {
        guard !refreshing else { return }
        refreshing = true
        defer { refreshing = false }
        let sources = Sources.shared
        await LinkHub.shared.poll()
        let reminders = await sources.reminders()
        let weather = await sources.weather()
        guard !Task.isCancelled else { return }
        village = Village(generated_at: When.iso.string(from: .now), mail: LinkHub.shared.mail,
                          calendar: sources.almanac(), notices: Notices(notes: reminders.prefix(30).map {
            Note(id: $0.id, title: $0.title, body: ($0.due.map { "Due: \(When.ago($0))\n" } ?? "") + ($0.notes ?? ""), at: $0.due, read: false)
        }), weather: weather ?? village.weather, agents: LinkHub.shared.agents, music: sources.music())
        raw = (try? JSONEncoder().encode(village)) ?? raw
        Store.save(village, "village.json")
        updated = .now
        deliver?(raw)
    }
}
