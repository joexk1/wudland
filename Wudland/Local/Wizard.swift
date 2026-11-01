import Foundation
import FoundationModels
import Observation

/// The wizard's conversation stays on this phone unless the user explicitly selects a provider.
@MainActor @Observable
final class WizardBook {
    var pages = Store.load([Page].self, "spellbook.json") ?? []
    var model = "on this phone"
    var casting = false
    var loading = false
    var error: String?
    var spellNote: String?
    var doing = ""
    var onBusy: ((Bool) -> Void)?
    @ObservationIgnored private var task: Task<Void, Never>?
    var busy: Bool { casting }
    func open() { loading = false }
    func close() { task?.cancel(); task = nil; casting = false; onBusy?(false); onBusy = nil }
    func load() async {}
    func cast(_ text: String) {
        let text = String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(4000))
        guard !text.isEmpty, !casting else { return }
        pages.append(Page(role: "joe", text: text)); persist()
        casting = true; error = nil; onBusy?(true)
        task = Task {
            defer { casting = false; onBusy?(false); task = nil }
            do {
                let reply = try await answer()
                try Task.checkCancellation()
                pages.append(Page(role: "wizard", text: reply)); persist()
                Sound.shared.play("chime"); Haptics.play("success")
            } catch is CancellationError {} catch { self.error = error.localizedDescription }
        }
    }
    private func persist() { pages = Array(pages.suffix(100)); Store.save(pages, "spellbook.json") }
    func spell(_ name: String) {
        guard !busy else { return }
        if name == "clear" { pages = []; spellNote = "A fresh book." }
        else { pages = Array(pages.suffix(12)); spellNote = "The latest twelve pages kept. Older pages removed." }
        persist()
    }
    private func answer() async throws -> String {
        let provider = UserDefaults.standard.string(forKey: "wizard.provider") ?? "device"
        let instructions = "You are Thistlewick, a kindly wizard in Wudland. Speak plainly with a little medieval warmth. You are a chat companion, not an agent that can act on the world. Never claim to have changed calendars, reminders, files or linked computers. Do not invent personal facts."
        if provider == "device" {
            guard Conversation.modelReady else { throw WizardError.message(Conversation.modelProblem ?? "The on-device model is unavailable.") }
            model = "on this phone"
            let session = LanguageModelSession(instructions: instructions)
            let prompt = pages.suffix(8).map { "\($0.role == "joe" ? "Lord" : "Wizard"): \($0.text.prefix(700))" }.joined(separator: "\n")
            return try await session.respond(to: prompt, options: GenerationOptions(maximumResponseTokens: 700)).content
        }
        guard UserDefaults.standard.bool(forKey: "wizard.remoteConsent") else {
            throw WizardError.message("Allow sending spellbook messages to your chosen provider in Settings first.")
        }
        guard let key = Keychain.string("wizard.key.\(provider)"), !key.isEmpty else { throw WizardError.message("Add your provider’s API key in Settings.") }
        let chosenModel = UserDefaults.standard.string(forKey: "wizard.model.\(provider)") ?? ""
        guard !chosenModel.isEmpty else { throw WizardError.message("Enter a model name from your provider in Settings.") }
        let anthropic = provider == "anthropic"
        guard anthropic || provider == "openai" else { throw WizardError.message("Choose a supported provider in Settings.") }
        model = chosenModel
        let messages = pages.suffix(20).map { ["role": $0.role == "joe" ? "user" : "assistant", "content": String($0.text.prefix(4000))] }
        var body: [String: Any] = ["model": chosenModel, "messages": messages]
        if anthropic { body["system"] = instructions; body["max_tokens"] = 1000 }
        else { body["messages"] = [["role": "system", "content": instructions]] + messages; body["max_completion_tokens"] = 1000; body["store"] = false }
        let url = URL(string: anthropic ? "https://api.anthropic.com/v1/messages" : "https://api.openai.com/v1/chat/completions")!
        var request = URLRequest(url: url, timeoutInterval: 60)
        request.httpMethod = "POST"; request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if anthropic { request.setValue(key, forHTTPHeaderField: "x-api-key"); request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version") }
        else { request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization") }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode) else {
            throw WizardError.message("The provider declined this spell. Check your API key, model name, balance and connection.")
        }
        guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw WizardError.message("The provider’s answer could not be read.") }
        if anthropic, let content = object["content"] as? [[String: Any]] {
            let text = content.compactMap { $0["text"] as? String }.joined(separator: "\n")
            guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw WizardError.message("The provider returned no words. Try another model.") }
            return text
        }
        if let choices = object["choices"] as? [[String: Any]], let message = choices.first?["message"] as? [String: Any], let text = message["content"] as? String, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return text }
        throw WizardError.message("The provider returned no words. Try another model.")
    }
    enum WizardError: LocalizedError { case message(String); var errorDescription: String? { if case .message(let s) = self { return s }; return nil } }
}
