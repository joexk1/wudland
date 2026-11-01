import Foundation
import CryptoKit
import Observation

/// Wudland Link: computers and coding agents report to the village through an ntfy relay, end-to-end encrypted.
/// See PROTOCOL.md in the plugins repo. The 6-digit app token (a TOTP that changes every minute) is how a
/// computer finds this phone the first time; after that each linked computer has its own inbox and key.
@MainActor @Observable
final class LinkHub {
    static let shared = LinkHub()

    struct LinkRecord: Codable, Identifiable, Equatable {
        var id: String
        var inbox: String
        var key: String          // base64, 32 bytes
        var name: String         // "Claude Code"
        var kind: String         // claude | codex | opencode | cli
        var host: String
        var created: Date
        var lastSeen: Date?
    }
    struct PairRequest: Identifiable, Equatable {
        var id: String { nonce }
        var nonce: String
        var pk: String
        var name: String
        var kind: String
        var host: String
        var topic: String
        var verificationCode: String
        var created: Date
        fileprivate var ephemeralKey: Data
    }
    struct Session: Codable, Equatable {
        var link: String
        var sid: String
        var parent: String?
        var src: String
        var host: String
        var name: String
        var `where`: String?
        var state: String
        var tool: String?
        var tools: Int
        var model: String?
        var started: String?
        var at: Date
        var notes: [String]
    }
    struct LetterItem: Codable, Equatable, Identifiable {
        var id: String
        var from: String
        var title: String
        var body: String
        var at: Date
        var read: Bool
    }
    private struct Saved: Codable { var sessions: [String: Session]; var letters: [LetterItem]; var since: String?; var seenBoxes: [String]? }

    private(set) var links: [LinkRecord] = []
    private(set) var sessions: [String: Session] = [:]
    private(set) var letters: [LetterItem] = []
    var pending: [PairRequest] = []
    var pairingNote: String?
    /// bumps whenever something the village shows has changed
    private(set) var revision = 0

    private var since: String?
    private var seenBoxes: [String] = []
    private var pairTask: Task<Void, Never>?
    private var seenHello: Set<String> = []

    static let defaultRelay = "https://ntfy.sh"
    var relay: String {
        get { UserDefaults.standard.string(forKey: "link.relay").flatMap { $0.isEmpty ? nil : $0 } ?? Self.defaultRelay }
        set {
            let v = newValue.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            UserDefaults.standard.set(v.hasPrefix("https://") ? v : "", forKey: "link.relay")
        }
    }

    init() {
        if let d = Keychain.data("links"), let l = try? JSONDecoder().decode([LinkRecord].self, from: d) { links = l }
        if let s = Store.load(Saved.self, "link-state.json") { sessions = s.sessions; letters = s.letters; since = s.since; seenBoxes = Array((s.seenBoxes ?? []).suffix(1000)) }
        prune()
    }

    // MARK: - the app token (RFC 6238, 6 digits, 60 seconds)

    /// Loaded once and kept in memory, so the code can never drift between reads even if the Keychain is briefly unavailable.
    @ObservationIgnored private var cachedSecret: SymmetricKey?
    private var secret: SymmetricKey {
        if let k = cachedSecret { return k }
        let k: SymmetricKey
        if let d = Keychain.data("token.secret"), d.count == 32 { k = SymmetricKey(data: d) }
        else { k = SymmetricKey(size: .bits256); Keychain.set(k.withUnsafeBytes { Data($0) }, "token.secret") }
        cachedSecret = k
        return k
    }
    func code(at date: Date = .now) -> String {
        var counter = UInt64(date.timeIntervalSince1970 / 60).bigEndian
        let mac = HMAC<Insecure.SHA1>.authenticationCode(for: Data(bytes: &counter, count: 8), using: secret)
        let b = Array(mac)
        let o = Int(b[b.count - 1] & 0x0f)
        let n = (UInt32(b[o] & 0x7f) << 24) | (UInt32(b[o + 1]) << 16) | (UInt32(b[o + 2]) << 8) | UInt32(b[o + 3])
        return String(format: "%06d", n % 1_000_000)
    }
    /// a fresh token secret: every code shown before stops working (links already made keep working)
    func rotateToken() { Keychain.set(nil, "token.secret"); cachedSecret = nil; _ = secret }

    static func pairTopic(_ code: String) -> String {
        let h = SHA256.hash(data: Data("wudland-pair-v1:\(code)".utf8)).map { String(format: "%02x", $0) }.joined()
        return "wudland-pair-" + h.prefix(24)
    }

    // MARK: - pairing (only while the Link screen is open)

    func startPairing() {
        pairTask?.cancel()
        pairTask = Task { [weak self] in
            while !Task.isCancelled {
                await self?.pollPairing()
                try? await Task.sleep(for: .seconds(3))
            }
        }
    }
    func stopPairing() { pairTask?.cancel(); pairTask = nil; pending = []; seenHello = []; pairingNote = nil }

    private func pollPairing() async {
        let now = Date()
        pending.removeAll { now.timeIntervalSince($0.created) > 120 }
        if seenHello.count > 500 { return }
        let topics = [code(at: now), code(at: now.addingTimeInterval(-60))].map(Self.pairTopic)
        for m in await fetch(topics: Array(Set(topics)), since: "2m") {
            guard !Task.isCancelled else { return }
            guard let d = m.message.data(using: .utf8), let o = try? JSONSerialization.jsonObject(with: d) as? [String: Any],
                  o["t"] as? String == "hello", let nonce = o["nonce"] as? String, let pk = o["pk"] as? String,
                  !seenHello.contains(nonce), pending.count < 5, Data(base64Encoded: pk)?.count == 32, Data(base64Encoded: nonce)?.count == 16 else { continue }
            seenHello.insert(nonce)
            let clean = { (s: Any?, n: Int, def: String) in String(((s as? String) ?? def).filter { !$0.isNewline }.prefix(n)) }
            guard let pkData = Data(base64Encoded: pk), let nonceData = Data(base64Encoded: nonce),
                  let peer = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: pkData) else { continue }
            let eph = Curve25519.KeyAgreement.PrivateKey()
            guard let shared = try? eph.sharedSecretFromKeyAgreement(with: peer) else { continue }
            let key = shared.hkdfDerivedSymmetricKey(using: SHA256.self, salt: nonceData, sharedInfo: Data("wudland-pair-v1".utf8), outputByteCount: 32)
            let digest = Array(SHA256.hash(data: Data("wudland-verify-v1:".utf8) + key.withUnsafeBytes { Data($0) }))
            let value = digest.prefix(4).reduce(UInt32(0)) { ($0 << 8) | UInt32($1) } % 100_000_000
            let digits = String(format: "%08d", value)
            let verification = String(digits.prefix(4)) + " " + String(digits.suffix(4))
            guard await post(topic: m.topic, json: ["t": "challenge", "v": 1, "to": nonce, "pk": eph.publicKey.rawRepresentation.base64EncodedString()]) else { continue }
            pending.append(PairRequest(nonce: nonce, pk: pk, name: clean(o["name"], 40, "A computer"), kind: clean(o["kind"], 16, "cli").lowercased(),
                                       host: clean(o["host"], 24, "computer"), topic: m.topic, verificationCode: verification, created: now, ephemeralKey: eph.rawRepresentation))
            Sound.shared.play("bell"); Haptics.play("warning")
        }
    }

    func approve(_ r: PairRequest) async {
        guard pending.contains(where: { $0.nonce == r.nonce }), Date().timeIntervalSince(r.created) < 120 else { pairingNote = "That request expired. Try a fresh code."; return }
        pending.removeAll { $0.nonce == r.nonce }
        guard let pkData = Data(base64Encoded: r.pk), let nonce = Data(base64Encoded: r.nonce),
              let peer = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: pkData) else { pairingNote = "That request was garbled. Try linking again."; return }
        guard let eph = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: r.ephemeralKey),
              let shared = try? eph.sharedSecretFromKeyAgreement(with: peer) else { return }
        let k = shared.hkdfDerivedSymmetricKey(using: SHA256.self, salt: nonce, sharedInfo: Data("wudland-pair-v1".utf8), outputByteCount: 32)
        let link = LinkRecord(id: Self.randomHex(8), inbox: "wudland-" + Self.randomHex(16), key: SymmetricKey(size: .bits256).withUnsafeBytes { Data($0) }.base64EncodedString(),
                              name: r.name, kind: r.kind, host: r.host, created: .now)
        let inner: [String: Any] = ["id": link.id, "inbox": link.inbox, "key": link.key, "relay": relay]
        guard let plain = try? JSONSerialization.data(withJSONObject: inner), let box = try? AES.GCM.seal(plain, using: k).combined else { return }
        let welcome: [String: Any] = ["t": "welcome", "v": 1, "to": r.nonce, "pk": eph.publicKey.rawRepresentation.base64EncodedString(), "box": box.base64EncodedString()]
        guard await post(topic: r.topic, json: welcome) else { pairingNote = "Couldn't reach the relay. Check your connection and try again."; return }
        links.append(link); saveLinks()
        pairingNote = "\(r.name) on \(r.host) is linked."
        Sound.shared.play("spell"); Haptics.play("success")
    }
    func deny(_ r: PairRequest) async {
        pending.removeAll { $0.nonce == r.nonce }
        _ = await post(topic: r.topic, json: ["t": "deny", "v": 1, "to": r.nonce])
    }
    func unlink(_ id: String) {
        links.removeAll { $0.id == id }
        sessions = sessions.filter { $0.value.link != id }
        saveLinks(); persist(); revision += 1
    }

    // MARK: - reading the inboxes

    func poll() async {
        guard !links.isEmpty else { return }
        let byInbox = Dictionary(uniqueKeysWithValues: links.map { ($0.inbox, $0) })
        let msgs = await fetch(topics: Array(byInbox.keys), since: since ?? "12h")
        var changed = false
        for m in msgs {
            since = m.id
            guard let link = byInbox[m.topic], m.message.hasPrefix("w1."), let key = Data(base64Encoded: link.key),
                  let boxData = Data(base64Encoded: String(m.message.dropFirst(3))),
                  let box = try? AES.GCM.SealedBox(combined: boxData),
                  let plain = try? AES.GCM.open(box, using: SymmetricKey(data: key)),
                  let o = try? JSONSerialization.jsonObject(with: plain) as? [String: Any],
                  let timestamp = o["at"] as? String, let sentAt = When.date(timestamp),
                  sentAt.timeIntervalSinceNow <= 300, -sentAt.timeIntervalSinceNow < 24 * 3600 else { continue }
            // Authenticate age from the encrypted payload, never the relay-controlled timestamp.
            let fingerprint = link.id + ":" + SHA256.hash(data: boxData).map { String(format: "%02x", $0) }.joined()
            guard !seenBoxes.contains(fingerprint) else { continue }
            seenBoxes.append(fingerprint); seenBoxes = Array(seenBoxes.suffix(1000))
            if let i = links.firstIndex(where: { $0.id == link.id }) { links[i].lastSeen = max(links[i].lastSeen ?? .distantPast, sentAt) }
            apply(o, link: link, msgTime: sentAt, fingerprint: fingerprint)
            changed = true
        }
        if !msgs.isEmpty { saveLinks() }
        if prune() { changed = true }
        if changed { persist(); revision += 1 }
    }

    private func apply(_ o: [String: Any], link: LinkRecord, msgTime: Date, fingerprint: String) {
        let s = { (k: String, n: Int) -> String? in (o[k] as? String).map { String($0.filter { !$0.isNewline }.prefix(n)) }.flatMap { $0.isEmpty ? nil : $0 } }
        if o["kind"] as? String == "letter" {
            let body = (o["body"] as? String).map { String($0.prefix(600)) } ?? ""
            let id = fingerprint
            letters.insert(LetterItem(id: id, from: s("from", 40) ?? link.host, title: s("title", 120) ?? "A note", body: body, at: msgTime, read: false), at: 0)
            letters = Array(letters.prefix(60))
            Sound.shared.play("page")
            return
        }
        guard let sid = s("sid", 80) else { return }
        let key = link.id + ":" + sid
        if let previous = sessions[key], msgTime < previous.at { return }
        var cur = sessions[key] ?? Session(link: link.id, sid: sid, parent: nil, src: s("src", 16) ?? link.kind, host: s("host", 24) ?? link.host,
                                           name: s("name", 60) ?? "An errand", where: nil, state: "busy", tool: nil, tools: 0, model: nil, started: s("started", 40), at: msgTime, notes: [])
        if let v = s("src", 16) { cur.src = v.lowercased() }
        if let v = s("host", 24) { cur.host = v }
        if let v = s("name", 60) { cur.name = v }
        if let v = s("where", 60) { cur.where = v }
        if let v = s("state", 12), ["busy", "waiting", "idle", "done", "failed"].contains(v) { cur.state = v }
        if let v = s("tool", 40) { cur.tool = v }
        if let v = o["tools"] as? Int { cur.tools = max(0, v) }
        if let v = s("model", 40) { cur.model = v }
        if let v = s("parent", 80) { cur.parent = link.id + ":" + v }
        if let v = s("note", 120) { cur.notes.append(v); cur.notes = Array(cur.notes.suffix(8)) }
        cur.at = msgTime
        sessions[key] = cur
        if sessions.count > 120 {
            sessions = Dictionary(uniqueKeysWithValues: sessions.sorted { $0.value.at > $1.value.at }.prefix(120).map { ($0.key, $0.value) })
        }
    }

    /// forget sessions quiet for a day, and letters older than a fortnight
    @discardableResult private func prune() -> Bool {
        let before = sessions.count + letters.count
        sessions = sessions.filter { -$0.value.at.timeIntervalSinceNow < 24 * 3600 }
        letters = letters.filter { -$0.at.timeIntervalSinceNow < 14 * 24 * 3600 }
        return before != sessions.count + letters.count
    }

    func markRead(_ id: String) {
        guard let i = letters.firstIndex(where: { $0.id == id }) else { return }
        letters[i].read = true; persist(); revision += 1
    }

    // MARK: - what the village sees

    var agents: Agents? {
        guard !links.isEmpty else { return nil }
        let now = Date()
        let shown = sessions.filter { (_, s) in
            let active = s.state == "busy" || s.state == "waiting"
            return (active && -s.at.timeIntervalSince(now) < 45 * 60) || -s.at.timeIntervalSince(now) < 45 * 60
        }
        var nodes: [AgentNode] = shown.map { (key, s) in
            let stale = -s.at.timeIntervalSince(now) > 45 * 60
            let busy = !stale && (s.state == "busy" || s.state == "waiting")
            return AgentNode(id: key, parent: s.parent, source: s.src, host: s.host, name: s.name, status: s.state == "waiting" ? "waiting for you" : s.state,
                             busy: busy, failed: s.state == "failed", model: s.model, where: s.where, started: s.started,
                             last_activity: When.iso.string(from: s.at), tool_calls: s.tools,
                             detail: s.notes.isEmpty ? (s.tool.map { ["Last used \($0)"] }) : s.notes)
        }
        // parents first, busy first, newest first; subagents only alongside their parent; ten at most
        let ids = Set(nodes.map(\.id))
        nodes = nodes.filter { $0.parent == nil || ids.contains($0.parent!) }
        nodes.sort {
            if ($0.parent == nil) != ($1.parent == nil) { return $0.parent == nil }
            if $0.busy != $1.busy { return $0.busy }
            if $0.last_activity != $1.last_activity { return ($0.last_activity ?? "") > ($1.last_activity ?? "") }
            return $0.id < $1.id
        }
        nodes = Array(nodes.prefix(10))
        var hostMap: [String: Date] = [:]
        for l in links { hostMap[l.host] = max(hostMap[l.host] ?? .distantPast, l.lastSeen ?? .distantPast) }
        let hosts = hostMap.map { Host(name: $0.key, online: -$0.value.timeIntervalSince(now) < 15 * 60, detail: $0.value == .distantPast ? "not heard from yet" : "last heard \(When.ago(When.iso.string(from: $0.value)))") }
            .sorted { $0.name < $1.name }
        return Agents(hosts: hosts, busy: nodes.filter { $0.busy && $0.parent == nil }.count, nodes: nodes)
    }

    var mail: Mail? {
        guard !letters.isEmpty || !links.isEmpty else { return nil }
        let ls = letters.map { Letter(id: $0.id, from: $0.from, address: nil, subject: $0.title, date: When.iso.string(from: $0.at), unread: !$0.read, flagged: nil, noise: nil, summary: $0.body) }
        let unread = ls.filter(\.unread).count
        return Mail(unread_count: unread, unread_people: unread, letters: Array(ls.prefix(30)))
    }

    // MARK: - relay plumbing

    private struct Msg: Decodable { var id: String; var time: Int; var event: String; var topic: String; var message: String }

    private func fetch(topics: [String], since: String) async -> [Msg] {
        guard !topics.isEmpty, topics.allSatisfy(Self.topicOK),
              let url = URL(string: "\(relay)/\(topics.joined(separator: ","))/json?poll=1&since=\(since.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? "12h")") else { return [] }
        var r = URLRequest(url: url, timeoutInterval: 15)
        r.setValue("Wudland/1.0", forHTTPHeaderField: "User-Agent")
        guard let (d, resp) = try? await URLSession.shared.data(for: r), (resp as? HTTPURLResponse)?.statusCode == 200 else { return [] }
        return d.split(separator: UInt8(ascii: "\n")).prefix(500).compactMap { try? JSONDecoder().decode(Msg.self, from: Data($0)) }.filter { $0.event == "message" }
    }
    private func post(topic: String, json: [String: Any]) async -> Bool {
        guard Self.topicOK(topic), let url = URL(string: "\(relay)/\(topic)"), let body = try? JSONSerialization.data(withJSONObject: json) else { return false }
        var r = URLRequest(url: url, timeoutInterval: 15)
        r.httpMethod = "POST"; r.httpBody = body
        guard let (_, resp) = try? await URLSession.shared.data(for: r) else { return false }
        return (resp as? HTTPURLResponse)?.statusCode == 200
    }
    private static func topicOK(_ t: String) -> Bool { !t.isEmpty && t.count <= 64 && t.allSatisfy { $0.isLetter && $0.isASCII || $0.isNumber || $0 == "-" || $0 == "_" } }
    static func randomHex(_ bytes: Int) -> String {
        var b = [UInt8](repeating: 0, count: bytes)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes, &b)
        return b.map { String(format: "%02x", $0) }.joined()
    }

    private func saveLinks() { Keychain.set(try? JSONEncoder().encode(links), "links") }
    private func persist() { Store.save(Saved(sessions: sessions, letters: letters, since: since, seenBoxes: seenBoxes), "link-state.json") }
}
