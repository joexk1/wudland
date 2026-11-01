import Foundation
import FoundationModels
import Observation

struct Line: Identifiable, Equatable {
    let id = UUID()
    var joe: Bool
    var text: String
}

/// One conversation with one villager, played by Apple's on-device model.
@MainActor @Observable
final class Conversation {
    var villager: Villager
    var lines: [Line] = []
    var thinking = false
    var speaking = false
    var modelNote: String?           // why we're on scripted lines, if we are
    @ObservationIgnored private var session: LanguageModelSession?
    @ObservationIgnored private var task: Task<Void, Never>?
    @ObservationIgnored var onSpeaking: ((Bool) -> Void)?

    static var modelReady: Bool {
        if case .available = SystemLanguageModel.default.availability { return true }
        return false
    }
    static var modelProblem: String? {
        switch SystemLanguageModel.default.availability {
        case .available: return nil
        case .unavailable(.appleIntelligenceNotEnabled): return "Turn on Apple Intelligence to let the villagers think for themselves."
        case .unavailable(.modelNotReady): return "The villagers' minds are still downloading. Scripted lines for now."
        case .unavailable(.deviceNotEligible): return "This device can't run the on-device model; villagers use scripted lines."
        default: return "The on-device model is unavailable right now."
        }
    }

    init(_ v: Villager) {
        villager = v
        modelNote = Self.modelProblem
        makeSession()
    }

    private func makeSession() {
        guard Self.modelReady else { session = nil; return }
        let v = villager
        let instructions = """
        You are \(v.name), \(v.role). Your manner: \(v.voice).
        \(Cast.world)
        \(Cast.rules)

        FACTS (true right now):
        \(v.facts.isEmpty ? "(nothing special)" : String(v.facts.prefix(2600)))
        """
        session = LanguageModelSession(instructions: instructions)
        session?.prewarm()
    }

    /// The opener: scripted instantly, then (if the model is up) the villager phrases it in their own words.
    func open() {
        lines = [Line(joe: false, text: "")]
        speak(scripted: villager.greeting, prompt: "the lord has just walked up to you. Greet him in character and tell him the single most useful thing from your FACTS. Two sentences at most.")
    }

    func ask(_ text: String) {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return }
        lines.append(Line(joe: true, text: t))
        lines.append(Line(joe: false, text: ""))
        speak(scripted: nil, prompt: t)
    }

    /// Hand the villager something to read (a letter, a chat, an agent's log) and have them sum it up.
    func read(_ label: String, material: String, ask: String) {
        lines.append(Line(joe: true, text: label))
        lines.append(Line(joe: false, text: ""))
        let prompt = "\(ask)\n\nMATERIAL (real, quote names exactly):\n\(material.prefix(2800))"
        speak(scripted: Self.digest(material), prompt: prompt)
    }

    func stop() { task?.cancel(); task = nil; setSpeaking(false); onSpeaking = nil; thinking = false }

    private func setSpeaking(_ on: Bool) { if speaking != on { speaking = on; onSpeaking?(on) } }

    private func speak(scripted: String?, prompt: String) {
        task?.cancel()
        let idx = lines.count - 1
        guard let session else {
            // no model: the scripted line, or an honest pointer for free questions
            let text = scripted ?? fallbackAnswer(prompt)
            task = Task { await self.type(text, into: idx) }
            return
        }
        thinking = true
        task = Task {
            do {
                var shown = ""
                let stream = session.streamResponse(to: prompt, options: GenerationOptions(temperature: 0.8, maximumResponseTokens: 220))
                for try await snap in stream {
                    if Task.isCancelled { return }
                    thinking = false
                    let full = snap.content
                    // reveal new text at a readable pace, with a blip per couple of letters
                    if full.count > shown.count {
                        let add = String(full.dropFirst(shown.count))
                        await reveal(add, into: idx)
                        shown = full
                    }
                }
                setSpeaking(false)
                if shown.trimmingCharacters(in: .whitespaces).isEmpty, let scripted { await type(scripted, into: idx) }
            } catch let e as LanguageModelSession.GenerationError {
                thinking = false
                if case .exceededContextWindowSize = e { makeSession() }
                await type(scripted ?? "Forgive me, m'lord, my thoughts wandered. Ask me again?", into: idx)
            } catch {
                thinking = false
                if !Task.isCancelled { await type(scripted ?? "Hmm, I lost my words there. Try again?", into: idx) }
            }
        }
    }

    private func reveal(_ add: String, into idx: Int) async {
        setSpeaking(true)
        var n = 0
        for ch in add {
            if Task.isCancelled { return }
            guard idx < lines.count else { return }
            lines[idx].text.append(ch)
            n += 1
            if ch.isLetter && n % 2 == 0 { Sound.shared.blip(pitch: villager.pitch + Double.random(in: -30...30)) }
            try? await Task.sleep(for: .milliseconds(ch == "." || ch == "!" || ch == "?" ? 90 : ch == "," ? 45 : 16))
        }
    }
    private func type(_ text: String, into idx: Int) async {
        guard idx < lines.count else { return }
        lines[idx].text = ""
        await reveal(text, into: idx)
        setSpeaking(false)
    }

    private func fallbackAnswer(_ q: String) -> String {
        let lower = q.lowercased()
        let first = villager.facts.split(separator: "\n").first.map(String.init) ?? ""
        if lower.contains("ignore") || lower.contains("important") || lower.contains("who") || lower.contains("what") || lower.contains("today") || lower.contains("news") {
            return first.isEmpty ? villager.greeting : first
        }
        return "\(villager.greeting) (I'm speaking from my notes; \(modelNote ?? "my thinking cap is off").)"
    }

    /// a scripted digest of material when the model is down: the first meaningful lines
    static func digest(_ material: String) -> String {
        let lines = material.split(separator: "\n").map { $0.trimmingCharacters(in: .whitespaces) }.filter { $0.count > 3 }
        return String(lines.prefix(3).joined(separator: " ").prefix(360)) + (lines.count > 3 ? "\u{2026}" : "")
    }
}
