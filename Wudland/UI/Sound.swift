import AVFoundation
import UIKit

/// Every sound in Wudland is synthesised at launch: short chiptune effects and three ambient loops.
/// Ambient session category, so it mixes with music and respects the silent switch.
@MainActor
final class Sound {
    static let shared = Sound()
    private let engine = AVAudioEngine()
    private let mixer = AVAudioMixerNode()
    private var voices: [AVAudioPlayerNode] = []
    private var next = 0
    private let ambience = AVAudioPlayerNode()
    private var buffers: [String: AVAudioPCMBuffer] = [:]
    private var loops: [String: AVAudioPCMBuffer] = [:]
    private var currentLoop = ""
    private let format = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)!
    private var started = false
    var enabled: Bool { !UserDefaults.standard.bool(forKey: "soundOff") }

    private init() {
        try? AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
        engine.attach(mixer)
        engine.connect(mixer, to: engine.mainMixerNode, format: format)
        for _ in 0..<8 {
            let v = AVAudioPlayerNode()
            engine.attach(v); engine.connect(v, to: mixer, format: format)
            voices.append(v)
        }
        engine.attach(ambience); engine.connect(ambience, to: mixer, format: format)
        ambience.volume = 0.32
        mixer.outputVolume = 0.8
        buildEffects()
        NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] _ in
            Task { @MainActor in self?.restart() }
        }
    }

    func start() {
        guard !started else { return }
        do { try AVAudioSession.sharedInstance().setActive(true); try engine.start(); started = true } catch { started = false }
    }
    private func restart() { started = false; start(); if !currentLoop.isEmpty { let l = currentLoop; currentLoop = ""; ambient(l) } }
    func pause() { ambience.stop(); currentLoop = ""; engine.pause(); started = false }

    func play(_ name: String, volume: Float = 1, rate: Float = 1) {
        guard enabled, let buf = buffers[name] else { return }
        start()
        let v = voices[next]; next = (next + 1) % voices.count
        v.stop()
        v.volume = volume
        v.scheduleBuffer(buf, at: nil)
        v.play()
    }
    /// a dialogue text blip; pitch gives each villager a voice
    func blip(pitch: Double) {
        guard enabled else { return }
        let key = "blip\(Int(pitch))"
        if buffers[key] == nil { buffers[key] = synth(0.045) { t, _ in Self.square(t, pitch) * 0.16 * Self.env(t, 0.045, a: 0.003) } }
        play(key, volume: 0.6)
    }

    /// "day", "night", "indoors", "tower" or "" for silence
    func ambient(_ name: String) {
        guard name != currentLoop else { return }
        currentLoop = name
        ambience.stop()
        guard enabled, !name.isEmpty else { return }
        if loops[name] == nil { loops[name] = buildLoop(name) }
        guard let buf = loops[name] else { return }
        start()
        ambience.scheduleBuffer(buf, at: nil, options: .loops)
        ambience.play()
    }

    // MARK: - synthesis
    private static func square(_ t: Double, _ f: Double) -> Double { sin(2 * .pi * f * t) >= 0 ? 1 : -1 }
    private static func tri(_ t: Double, _ f: Double) -> Double { 2 * abs(2 * (t * f - floor(t * f + 0.5))) - 1 }
    private static func env(_ t: Double, _ len: Double, a: Double = 0.005) -> Double { t < a ? t / a : max(0, 1 - (t - a) / (len - a)) }

    private func synth(_ len: Double, _ f: (Double, inout Double) -> Double) -> AVAudioPCMBuffer {
        let n = AVAudioFrameCount(len * 44100)
        let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: n)!
        buf.frameLength = n
        let p = buf.floatChannelData![0]
        var state = 0.0
        for i in 0..<Int(n) { p[i] = Float(max(-1, min(1, f(Double(i) / 44100, &state)))) }
        return buf
    }
    private func noise() -> Double { Double.random(in: -1...1) }

    private func buildEffects() {
        buffers["step"] = synth(0.06) { t, lp in lp += (self.noise() - lp) * 0.08; return lp * 0.5 * Self.env(t, 0.06, a: 0.002) }
        buffers["tap"] = synth(0.05) { t, _ in Self.square(t, 880 - t * 4000) * 0.08 * Self.env(t, 0.05) }
        buffers["door"] = synth(0.45) { t, lp in
            lp += (self.noise() - lp) * 0.04
            let creak = t < 0.3 ? sin(2 * .pi * (180 + 160 * t) * t) * (sin(t * 90) > 0.2 ? 0.12 : 0.03) : 0
            let thud = t > 0.3 ? sin(2 * .pi * 70 * t) * Self.env(t - 0.3, 0.15, a: 0.002) * 0.5 : 0
            return creak + thud + lp * 0.1 * Self.env(t, 0.45)
        }
        buffers["open"] = synth(0.16) { t, _ in Self.tri(t, t < 0.07 ? 660 : 990) * 0.18 * Self.env(t, 0.16) }
        buffers["close"] = synth(0.14) { t, _ in Self.tri(t, t < 0.06 ? 740 : 494) * 0.16 * Self.env(t, 0.14) }
        buffers["page"] = synth(0.3) { t, lp in lp += (self.noise() - lp) * (0.2 + t); return lp * 0.25 * sin(.pi * t / 0.3) }
        buffers["chime"] = synth(0.6) { t, _ in (sin(2 * .pi * 1318 * t) + 0.5 * sin(2 * .pi * 1976 * t)) * 0.12 * exp(-t * 6) }
        buffers["bell"] = synth(1.6) { t, _ in (sin(2 * .pi * 392 * t) + 0.6 * sin(2 * .pi * 784.6 * t) + 0.3 * sin(2 * .pi * 1180 * t)) * 0.18 * exp(-t * 2.4) }
        buffers["spell"] = synth(0.9) { t, _ in
            let notes = [523.0, 659, 784, 1046, 1318]
            let k = min(4, Int(t / 0.12)), lt = t - Double(k) * 0.12
            return Self.tri(t, notes[k]) * 0.12 * exp(-lt * 9) + sin(2 * .pi * 2093 * t) * 0.03 * sin(.pi * t / 0.9)
        }
        buffers["meow"] = synth(0.5) { t, _ in
            let f = 520 + 380 * sin(.pi * t / 0.5) - 200 * t
            return (Self.tri(t, f) * 0.6 + sin(2 * .pi * f * 2 * t) * 0.2) * 0.25 * sin(.pi * t / 0.5)
        }
        buffers["quack"] = synth(0.2) { t, _ in Self.square(t, 300 - 400 * t) * 0.12 * Self.env(t, 0.2, a: 0.01) * (0.6 + 0.4 * sin(t * 300)) }
        buffers["cluck"] = synth(0.18) { t, _ in Self.tri(t, t < 0.06 ? 900 : 600) * 0.2 * Self.env(t, 0.18) }
        buffers["hoot"] = synth(0.8) { t, _ in sin(2 * .pi * (t < 0.3 ? 440 : 392) * t) * 0.22 * (t < 0.3 ? Self.env(t, 0.3, a: 0.05) : Self.env(t - 0.35, 0.45, a: 0.05)) }
        buffers["coin"] = synth(0.25) { t, _ in Self.square(t, t < 0.07 ? 988 : 1318) * 0.08 * Self.env(t, 0.25) }
        // two quick barks: a falling square with a puff of breath
        buffers["woof"] = synth(0.42) { t, lp in
            lp += (self.noise() - lp) * 0.3
            let k = t < 0.16 ? t : t - 0.22
            guard k >= 0, k < 0.16 else { return 0 }
            let f = 340 - 900 * k
            return (Self.square(k, f) * 0.11 + lp * 0.06) * Self.env(k, 0.16, a: 0.008)
        }
        buffers["hic"] = synth(0.12) { t, _ in Self.tri(t, 700 + 1400 * t) * 0.14 * Self.env(t, 0.12, a: 0.004) }
    }

    private func buildLoop(_ name: String) -> AVAudioPCMBuffer {
        let len = 12.0
        var rng = SystemRandomNumberGenerator()
        // events scheduled across the loop: bird chirps, cricket pulses, fire pops
        var events: [(Double, Double)] = []
        let count = name == "day" ? 14 : name == "night" ? 0 : 40
        for _ in 0..<count { events.append((Double.random(in: 0..<len, using: &rng), Double.random(in: 0...1, using: &rng))) }
        return synth(len) { t, lp in
            var s = 0.0
            // a soft bed of wind (outdoors) or room tone (indoors)
            lp += (self.noise() - lp) * (name == "indoors" || name == "tower" ? 0.02 : 0.012)
            s += lp * (name == "night" ? 0.22 : 0.3) * (0.7 + 0.3 * sin(t * 2 * .pi / len * 2))
            switch name {
            case "day":
                for (at, r) in events where t >= at && t < at + 0.35 {
                    let lt = t - at, f = 2400 + r * 1600 + sin(lt * 70) * 500
                    s += sin(2 * .pi * f * lt) * 0.05 * Self.env(lt, 0.35, a: 0.01) * (sin(lt * 40) > 0 ? 1 : 0.2)
                }
            case "night":
                let chirp = sin(2 * .pi * 4400 * t) * (sin(2 * .pi * 28 * t) > 0.4 ? 1 : 0)
                let gate = sin(2 * .pi * 0.9 * t) > 0.1 ? 1.0 : 0.0
                s += chirp * gate * 0.018
                let chirp2 = sin(2 * .pi * 3900 * t) * (sin(2 * .pi * 22 * t + 1) > 0.5 ? 1 : 0)
                s += chirp2 * (sin(2 * .pi * 0.6 * t + 2) > 0.3 ? 1 : 0) * 0.012
            default:
                for (at, r) in events where t >= at && t < at + 0.02 {
                    s += self.noise() * 0.25 * (1 - (t - at) / 0.02) * r
                }
                if name == "tower" { s += sin(2 * .pi * 110 * t) * 0.02 * (0.5 + 0.5 * sin(t * 0.7)) + sin(2 * .pi * 164.8 * t) * 0.012 }
            }
            return s
        }
    }
}

@MainActor
enum Haptics {
    private static let light = UIImpactFeedbackGenerator(style: .light)
    private static let soft = UIImpactFeedbackGenerator(style: .soft)
    private static let rigid = UIImpactFeedbackGenerator(style: .rigid)
    private static let notify = UINotificationFeedbackGenerator()
    static var enabled: Bool { !UserDefaults.standard.bool(forKey: "hapticsOff") }
    static func play(_ style: String) {
        guard enabled else { return }
        switch style {
        case "soft": soft.impactOccurred(intensity: 0.6)
        case "rigid": rigid.impactOccurred()
        case "success": notify.notificationOccurred(.success)
        case "warning": notify.notificationOccurred(.warning)
        default: light.impactOccurred()
        }
    }
}
