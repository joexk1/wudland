import Foundation
import HealthKit
import Observation

// MARK: - the rules (pure, no HealthKit, so it can be replayed and tested)

/// How the Step Tree is doing. Worst to best.
enum StepTreeState: String, CaseIterable, Codable {
    case dead, withered, thirsty, sapling, healthy, blooming, golden, enchanted

    var title: String {
        switch self {
        case .dead: "Dead"
        case .withered: "Withered"
        case .thirsty: "Thirsty"
        case .sapling: "Sapling"
        case .healthy: "Healthy"
        case .blooming: "In bloom"
        case .golden: "Golden"
        case .enchanted: "Enchanted"
        }
    }
}

/// The tree's life is replayed from the day it was planted, one finished day at a time, so nothing but the
/// planting date and the goal history needs saving: the same steps always grow the same tree.
///
/// - Vigour runs 0 to 100. A new tree is planted as a sapling at 40.
/// - Each finished day moves it by how close you came to that day's goal:
///   150%+ → +16, 100%+ → +12, 75%+ → −4, 50%+ → −8, under 50% → −14.
/// - Vigour 0 kills the tree. Two goal days in a row bring a new sapling (vigour 35) out of the stump.
/// - A sapling grows into a tree once vigour reaches 55.
/// - The streak is consecutive goal days. Golden needs a 7-day streak, or 3+ days well over goal (each at 150%, or averaging 140%).
///   Enchanted needs a 14-day streak with at least 10 of those days at 125%+, or any 30-day streak.
/// - Today never hurts: it only counts once it's over. If today's goal is already met, today's boost shows now.
enum StepTreeRules {
    struct Day: Equatable { var date: Date; var steps: Int; var goal: Int }
    struct Outcome: Equatable {
        var state: StepTreeState
        var vigour: Int
        var streak: Int
        var watered: Bool        // today's goal is met
        var todaySteps: Int
        var goal: Int
        var size: Int = 1        // 1–5: how big it has grown, from the best streak in this tree's life
    }

    static let goalRange = 5_000...15_000
    /// best streak → size: 1 day, 3, 7, 14, 30
    static func size(_ best: Int) -> Int { best >= 30 ? 5 : best >= 14 ? 4 : best >= 7 ? 3 : best >= 3 ? 2 : 1 }
    static let defaultGoal = 8_000

    static func delta(_ ratio: Double) -> Int {
        switch ratio {
        case 1.5...: 16
        case 1.0...: 12
        case 0.75...: -4
        case 0.5...: -8
        default: -14
        }
    }

    /// `days` are finished days, oldest first, starting on the planting day. `today` is the day in progress.
    static func evaluate(days: [Day], today: Day) -> Outcome {
        var vigour = 40, streak = 0, young = true, dead = false, deadMet = 0, best = 0
        var recent: [Double] = []   // ratios of the current streak, newest last

        func apply(_ d: Day) {
            let r = Double(d.steps) / Double(max(1, d.goal)), met = r >= 1
            if dead {
                deadMet = met ? deadMet + 1 : 0
                if deadMet >= 2 { dead = false; young = true; vigour = 35; deadMet = 0; best = 0 }   // a new sapling starts small
            } else {
                vigour = min(100, max(0, vigour + delta(r)))
                if vigour == 0 { dead = true; young = false; deadMet = 0 }
                if young && vigour >= 55 { young = false }
            }
            if met { streak += 1; recent.append(r) } else { streak = 0; recent.removeAll() }
            if !dead { best = max(best, streak) }   // growth is kept: a big tree that has a bad week is still big, just thirsty
        }
        for d in days { apply(d) }

        // today: show the boost once it's earned, never the penalty
        let todayRatio = Double(today.steps) / Double(max(1, today.goal))
        if todayRatio >= 1 { apply(today) }

        let state: StepTreeState
        if dead { state = .dead }
        else if young { state = .sapling }
        else if vigour < 25 { state = .withered }
        else if vigour < 50 { state = .thirsty }
        else {
            let last14 = recent.suffix(14), strong = last14.filter { $0 >= 1.25 }.count
            // well over goal, consistently: three 150% days in a row, or a streak averaging 140%+
            let blazing = (recent.count >= 3 && recent.suffix(3).allSatisfy { $0 >= 1.5 })
                || (recent.count >= 3 && recent.reduce(0, +) / Double(recent.count) >= 1.4)
            if streak >= 30 || (streak >= 14 && strong >= 10) { state = .enchanted }
            else if streak >= 7 || blazing { state = .golden }
            else if vigour >= 80 || streak >= 3 { state = .blooming }
            else { state = .healthy }
        }
        return Outcome(state: state, vigour: vigour, streak: streak, watered: todayRatio >= 1, todaySteps: today.steps, goal: today.goal, size: size(best))
    }
}

// MARK: - the tree in the app

/// Reads daily step counts from Health, keeps the goal and planting day, and hands the tree's look to the canvas.
@MainActor @Observable
final class StepTree {
    static let shared = StepTree()

    var enabled = UserDefaults.standard.bool(forKey: "steptree.on") { didSet { UserDefaults.standard.set(enabled, forKey: "steptree.on"); if enabled { plantIfNeeded() }; push() } }
    var goal: Int = {
        let g = UserDefaults.standard.integer(forKey: "steptree.goal")
        return g == 0 ? StepTreeRules.defaultGoal : g
    }() { didSet { if goal != oldValue { saveGoal() } } }
    /// clamp to 5,000–15,000 before it is stored
    func setGoal(_ g: Int) {
        let c = min(StepTreeRules.goalRange.upperBound, max(StepTreeRules.goalRange.lowerBound, (g / 500) * 500))
        if c != goal { goal = c }
    }
    private(set) var outcome: StepTreeRules.Outcome?
    private(set) var problem: String?

    @ObservationIgnored var onChange: (([String: Any]?) -> Void)?
    @ObservationIgnored private let health = HKHealthStore()
    @ObservationIgnored private let cal = Calendar.current

    init() { UserDefaults.standard.removeObject(forKey: "steptree.preview") }   // the old try-a-look picker is gone: the tree is a surprise

    /// what the canvas needs: { state, watered }, or nil for the old well
    var look: [String: Any]? {
        guard enabled else { return nil }
        guard let o = outcome else { return ["state": StepTreeState.healthy.rawValue, "watered": false, "size": 1] }
        return ["state": o.state.rawValue, "watered": o.watered, "size": o.size]
    }
    var lookJSON: String {
        guard let l = look, let d = try? JSONSerialization.data(withJSONObject: l), let s = String(data: d, encoding: .utf8) else { return "null" }
        return s
    }

    private var planted: Date {
        let t = UserDefaults.standard.double(forKey: "steptree.planted")
        return t > 0 ? Date(timeIntervalSince1970: t) : cal.startOfDay(for: .now)
    }
    private func plantIfNeeded() {
        if UserDefaults.standard.double(forKey: "steptree.planted") == 0 {
            UserDefaults.standard.set(cal.startOfDay(for: .now).timeIntervalSince1970, forKey: "steptree.planted")
        }
    }

    // goal history: [startOfDay seconds: goal], so changing the goal never rewrites the past
    private var goals: [String: Int] { UserDefaults.standard.dictionary(forKey: "steptree.goals") as? [String: Int] ?? [:] }
    // never assign `goal` in here: with @Observable that re-enters didSet forever (the slider crash)
    private func saveGoal() {
        UserDefaults.standard.set(goal, forKey: "steptree.goal")
        var g = goals
        g[String(Int(cal.startOfDay(for: .now).timeIntervalSince1970))] = goal
        UserDefaults.standard.set(g, forKey: "steptree.goals")
    }
    private func goal(on day: Date) -> Int {
        let key = cal.startOfDay(for: day).timeIntervalSince1970
        let g = goals.compactMap { k, v in Double(k).map { ($0, v) } }.filter { $0.0 <= key }.max { $0.0 < $1.0 }
        return g?.1 ?? goal
    }

    /// Ask Health for steps (read only) and rework the tree. Safe to call often.
    func refresh() async {
        guard enabled else { push(); return }
        guard HKHealthStore.isHealthDataAvailable() else { problem = "Health isn't available on this device."; push(); return }
        let steps = HKQuantityType(.stepCount)
        do {
            try await health.requestAuthorization(toShare: [], read: [steps])
            let start = cal.startOfDay(for: planted), now = Date.now
            let counts = try await dailySteps(from: start, to: now)
            var days: [StepTreeRules.Day] = []
            var d = start
            let todayStart = cal.startOfDay(for: now)
            while d < todayStart {
                days.append(.init(date: d, steps: counts[d] ?? 0, goal: goal(on: d)))
                d = cal.date(byAdding: .day, value: 1, to: d)!
            }
            outcome = StepTreeRules.evaluate(days: days, today: .init(date: todayStart, steps: counts[todayStart] ?? 0, goal: goal))
            problem = nil
        } catch {
            problem = "Couldn't read steps: \(error.localizedDescription)"
        }
        push()
    }

    private func dailySteps(from start: Date, to end: Date) async throws -> [Date: Int] {
        let type = HKQuantityType(.stepCount)
        let query = HKStatisticsCollectionQueryDescriptor(
            predicate: .quantitySample(type: type, predicate: HKQuery.predicateForSamples(withStart: start, end: end)),
            options: .cumulativeSum, anchorDate: start, intervalComponents: DateComponents(day: 1))
        let results = try await query.result(for: health)
        var out: [Date: Int] = [:]
        results.enumerateStatistics(from: start, to: end) { stat, _ in
            out[self.cal.startOfDay(for: stat.startDate)] = Int(stat.sumQuantity()?.doubleValue(for: .count()) ?? 0)
        }
        return out
    }

    private func push() { onChange?(look) }
}
