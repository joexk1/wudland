import SwiftUI
import WebKit
import Observation

/// What the village canvas tells the app.
enum GameEvent {
    case ready
    case scene(id: String, title: String)
    case talk(npc: String, name: String, agent: AgentNode?, chat: Chat?, trades: Bool)
    case inspect(String)
    case endTalk
}

/// Owns the WKWebView running the pixel village and speaks to it through `window.wud`.
@MainActor @Observable
final class Game: NSObject, WKScriptMessageHandler {
    var ready = false
    var sceneID = "village"
    var sceneTitle = "Wudland"
    let economy = Economy()
    @ObservationIgnored var onEvent: ((GameEvent) -> Void)?
    @ObservationIgnored private(set) var webView: WKWebView!

    func makeWebView(boot: Data, avatar: [String: Any]) -> WKWebView {
        if let webView { return webView }
        let cfg = WKWebViewConfiguration()
        let ucc = WKUserContentController()
        let avatarJSON = (try? JSONSerialization.data(withJSONObject: avatar)).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        let dataJSON = String(data: boot, encoding: .utf8) ?? "{}"
        let lordJSON = q(Lord.name)
        let reduce = UIAccessibility.isReduceMotionEnabled ? "true" : "false"
        let saveJSON = Economy.saved.flatMap { try? JSONSerialization.data(withJSONObject: $0) }.flatMap { String(data: $0, encoding: .utf8) } ?? "null"
        ucc.addUserScript(WKUserScript(source: "window.WUD_BOOT = { lord: \(lordJSON), data: \(dataJSON), avatar: \(avatarJSON), save: \(saveJSON) }; if (\(reduce)) window.matchMedia = q => ({ matches: q.includes('reduce') });",
                                       injectionTime: .atDocumentStart, forMainFrameOnly: true))
        ucc.add(WeakMessageHandler(self), name: "wud")
        cfg.userContentController = ucc
        cfg.suppressesIncrementalRendering = true
        cfg.mediaTypesRequiringUserActionForPlayback = []
        let wv = WKWebView(frame: .zero, configuration: cfg)
        wv.isOpaque = false
        wv.backgroundColor = UIColor(Ink.night)
        wv.scrollView.isScrollEnabled = false
        wv.scrollView.bounces = false
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        wv.scrollView.pinchGestureRecognizer?.isEnabled = false
        #if DEBUG
        wv.isInspectable = true
        #endif
        if let index = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") {
            wv.loadFileURL(index, allowingReadAccessTo: index.deletingLastPathComponent())
        }
        webView = wv
        return wv
    }

    nonisolated func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        Task { @MainActor [weak self] in
            guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
            let payload = (try? JSONSerialization.data(withJSONObject: body)) ?? Data()
            self?.handle(type, body: body, payload: payload)
        }
    }

    private func handle(_ type: String, body: [String: Any], payload: Data) {
        switch type {
        case "ready":
            ready = true
            onEvent?(.ready)
        case "scene":
            sceneID = body["id"] as? String ?? "village"
            sceneTitle = body["title"] as? String ?? "Wudland"
            onEvent?(.scene(id: sceneID, title: sceneTitle))
        case "talk":
            struct Talk: Decodable { var npc: String; var name: String; var agent: AgentNode?; var chat: Chat?; var trades: Bool? }
            if let t = try? JSONDecoder().decode(Talk.self, from: payload) { onEvent?(.talk(npc: t.npc, name: t.name, agent: t.agent, chat: t.chat, trades: t.trades ?? false)) }
        case "inspect":
            onEvent?(.inspect(body["what"] as? String ?? ""))
        case "endTalk":
            onEvent?(.endTalk)
        case "sfx":
            let name = body["name"] as? String ?? ""
            Sound.shared.play(name, volume: name == "step" ? 0.35 : 1)
        case "catalog": economy.catalog(payload)
        case "econ": economy.state(payload)
        case "stock": economy.stock(payload)
        case "save": economy.save(body)
        case "haptic":
            Haptics.play(body["style"] as? String ?? "light")
        default: break
        }
    }

    // MARK: - calls into the village
    private func js(_ s: String) { webView?.evaluateJavaScript(s, completionHandler: nil) }
    func setData(_ data: Data) { if let s = String(data: data, encoding: .utf8) { js("wud.setData(\(s))") } }
    func setLordName() { js("window.WUD_BOOT.lord = \(q(Lord.name))") }
    func setAvatar(_ look: [String: Any]) {
        if let d = try? JSONSerialization.data(withJSONObject: look), let s = String(data: d, encoding: .utf8) { js("wud.setAvatar(\(s))") }
    }
    func endTalk() { js("wud.endTalk()") }
    func leave() { js("wud.leave()") }
    func setPanel(_ frac: Double) { js("wud.setPanel(\(frac))") }
    func setSpeaking(_ on: Bool) { js("wud.setSpeaking(\(on))") }
    func setWizard(_ busy: Bool) { js("wud.setWizard(\(busy))") }
    func setPaused(_ p: Bool) { js("wud.setPaused(\(p))") }
    func setHour(_ h: Double?) { js("wud.setHour(\(h.map { String($0) } ?? "null"))") }
    func goTo(_ id: String) { js("wud.goTo('\(id)')") }
    func zoom(_ step: Int) { js("wud.zoom(\(step))") }
    // trading and the satchel
    /// a string as a safe JS literal (JSON-encode it inside an array, then drop the brackets)
    private func q(_ s: String) -> String {
        guard let d = try? JSONSerialization.data(withJSONObject: [s]), let a = String(data: d, encoding: .utf8) else { return "\"\"" }
        return String(a.dropFirst().dropLast())
    }
    func buy(_ npc: String, _ id: String) { js("wud.buy(\(q(npc)), \(q(id)))") }
    func sell(_ npc: String, _ id: String) { js("wud.sell(\(q(npc)), \(q(id))); wud.stock(\(q(npc)))") }
    func requestStock(_ npc: String) { js("wud.stock(\(q(npc)))") }
    func useItem(_ id: String) { js("wud.use(\(q(id)))") }
    func placeItem(_ id: String, on: Bool) { js("wud.place(\(q(id)), \(on))") }
    func nameDog(_ n: String) { js("wud.name(\(q(n)))") }
    func wear(_ slot: String, _ id: String?) { js("wud.wear(\(q(slot)), \(id.map { q($0) } ?? "null"))") }
    func setCompanion(_ id: String) { js("wud.companion(\(q(id)))") }
}

struct GameView: UIViewRepresentable {
    let game: Game
    let boot: Data
    let avatar: [String: Any]
    func makeUIView(context: Context) -> WKWebView { game.makeWebView(boot: boot, avatar: avatar) }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

/// WKUserContentController retains its handlers; this proxy keeps it from retaining Game.
private final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    weak var target: Game?
    init(_ target: Game) { self.target = target }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(controller, didReceive: message)
    }
}
