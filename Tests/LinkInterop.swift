// Run on macOS: swift Tests/LinkInterop.swift ../plugins/test/vectors.json
import Foundation
import CryptoKit
func hex(_ s: String) -> Data { Data(stride(from: 0, to: s.count, by: 2).map { i in let a = s.index(s.startIndex, offsetBy: i); return UInt8(s[a..<s.index(a, offsetBy: 2)], radix: 16)! }) }
func hexString(_ d: Data) -> String { d.map { String(format: "%02x", $0) }.joined() }
let vectors = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! [String: Any]
let b = vectors["box"] as! [String: String]
let key = SymmetricKey(data: hex(b["key"]!))
let box = try AES.GCM.SealedBox(combined: Data(base64Encoded: b["boxBase64"]!)!)
let plain = try AES.GCM.open(box, using: key)
precondition(String(data: plain, encoding: .utf8) == b["plaintext"])
let sealed = try AES.GCM.seal(Data(b["plaintext"]!.utf8), using: key, nonce: AES.GCM.Nonce(data: hex(b["nonce"]!)))
precondition(sealed.combined!.base64EncodedString() == b["boxBase64"]!)
var tampered = Data(base64Encoded: b["boxBase64"]!)!; tampered[tampered.count - 1] ^= 1
var rejected = false
do { _ = try AES.GCM.open(AES.GCM.SealedBox(combined: tampered), using: key) } catch { rejected = true }
precondition(rejected)
let p = (vectors["pairing"] as? [String: Any])!
let pStr = { (k: String) -> String in p[k] as! String }
let app = try Curve25519.KeyAgreement.PrivateKey(rawRepresentation: hex(pStr("appPrivateKey")))
precondition(hexString(app.publicKey.rawRepresentation) == pStr("appPublicKey"))
let peer = try Curve25519.KeyAgreement.PublicKey(rawRepresentation: hex(pStr("pluginPublicKey")))
let shared = try app.sharedSecretFromKeyAgreement(with: peer)
let derived = shared.hkdfDerivedSymmetricKey(using: SHA256.self, salt: hex(pStr("hkdfSalt")), sharedInfo: Data(pStr("hkdfInfo").utf8), outputByteCount: 32)
precondition(hexString(derived.withUnsafeBytes { Data($0) }) == pStr("derivedKey"))
let t = vectors["pairTopic"] as! [String: String]
let topic = "wudland-pair-" + hexString(Data(SHA256.hash(data: Data("wudland-pair-v1:\(t["code"]!)".utf8)))).prefix(24)
precondition(topic == t["topic"]!)
let digest = Array(SHA256.hash(data: Data("wudland-verify-v2:".utf8) + derived.withUnsafeBytes { Data($0) }))
let value = digest.prefix(4).reduce(UInt32(0)) { ($0 << 8) | UInt32($1) } % 100_000_000
let sas = String(format: "%08d", value)
precondition(String(sas.prefix(4)) + " " + String(sas.suffix(4)) == (p["verificationCode"] as? String ?? ""), "v2 SAS mismatch")
if let cm = p["commit"] as? [String: String] {
    let pkRaw = hex(pStr("pluginPublicKey"))
    let nonceRaw = hex(cm["nonce"]!)
    let want = Data(base64Encoded: cm["commitBase64"]!)
    precondition(Data(SHA256.hash(data: pkRaw + nonceRaw)) == want, "commitment mismatch")
}
print("PASS: AES-GCM encrypt/decrypt, tamper rejection, X25519, HKDF, pair topic, commitment. SAS v2:", sas.prefix(4) + " " + sas.suffix(4))
