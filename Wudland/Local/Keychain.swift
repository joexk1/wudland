import Foundation
import Security

/// Small secrets (link keys, the app token seed, API keys) live in the Keychain, on this device only.
enum Keychain {
    private static let service = "app.wudland"

    static func data(_ key: String) -> Data? { lookup(key).data }

    /// the item and the raw status, so callers can tell "not there" (errSecItemNotFound) from "can't read right now"
    static func lookup(_ key: String) -> (data: Data?, status: OSStatus) {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service,
                                kSecAttrAccount as String: key, kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]
        var out: CFTypeRef?
        let status = SecItemCopyMatching(q as CFDictionary, &out)
        return (status == errSecSuccess ? out as? Data : nil, status)
    }

    static func set(_ value: Data?, _ key: String) {
        let base: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: key]
        guard let value else { SecItemDelete(base as CFDictionary); return }
        let attrs: [String: Any] = [kSecValueData as String: value, kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
        if SecItemUpdate(base as CFDictionary, attrs as CFDictionary) == errSecItemNotFound {
            SecItemAdd(base.merging(attrs) { $1 } as CFDictionary, nil)
        }
    }

    static func string(_ key: String) -> String? { data(key).flatMap { String(data: $0, encoding: .utf8) } }
    static func setString(_ value: String?, _ key: String) { set(value.flatMap { $0.isEmpty ? nil : Data($0.utf8) }, key) }
}

/// What the villagers call you. Empty means they just say "m'lord".
enum Lord {
    static var name: String { (UserDefaults.standard.string(forKey: "lord.name") ?? "").trimmingCharacters(in: .whitespacesAndNewlines) }
    /// for prompts: "Sam" or "the lord"
    static var called: String { name.isEmpty ? "the lord" : name }
    /// for speech: "Sam" or "m'lord"
    static var hail: String { name.isEmpty ? "m'lord" : name }
}

/// Files the app keeps between launches (not secret): Application Support/Wudland/<name>.
enum Store {
    static func url(_ name: String) -> URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Wudland", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent(name)
    }
    static func load<T: Decodable>(_ type: T.Type, _ name: String) -> T? {
        guard let d = try? Data(contentsOf: url(name)) else { return nil }
        return try? JSONDecoder().decode(T.self, from: d)
    }
    static func save<T: Encodable>(_ value: T, _ name: String) {
        guard let d = try? JSONEncoder().encode(value) else { return }
        try? d.write(to: url(name), options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }
}
