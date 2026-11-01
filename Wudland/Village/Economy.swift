import SwiftUI
import Observation

// The village's economy lives in the canvas (wares.js); this is the app's mirror of it,
// plus the satchel, the bestiary, the wardrobe and the market stall views.

struct ItemDef: Codable, Identifiable {
    var id: String
    var name: String
    var kind: String
    var value: Int
    var rarity: Int
    var desc: String
    var pal: [String: [Int]]
    var icon: [String]
    var hat: String?
    var slot: String?
}
struct BeastDef: Codable {
    var name: String
    var rarity: Int
    var lore: String
    var pal: [String: [Int]]?
    var icon: [String]?
    /// the lord's dog, drawn like the beasts so it can head the bestiary
    static func dog(_ name: String) -> BeastDef {
        BeastDef(name: name, rarity: 0, lore: "", pal: ["a": [196, 140, 86], "b": [120, 80, 50], "c": [236, 226, 210], "d": [40, 30, 30], "e": [180, 50, 50]],
                 icon: [".....b..", "....baa.", "a...adad", ".a..aaa.", ".aaeea..", ".accaa..", ".aaaaa..", ".a.a.a.."])
    }
}
struct Ware: Codable, Identifiable, Equatable {
    var id: String
    var qty: Int
    var price: Int
}
struct Holding: Codable, Identifiable, Equatable {
    var id: String
    var n: Int
}

struct Toast: Identifiable, Equatable {
    let id = UUID()
    var title: String
    var sub: String?
    var item: String?
    var rarity: Int = 0
}

@MainActor @Observable
final class Economy {
    var items: [String: ItemDef] = [:]
    var beasts: [String: BeastDef] = [:]
    var rarityNames: [String] = ["common", "uncommon", "rare", "epic", "legendary"]
    var rarityRGB: [[Int]] = [[196, 180, 150], [120, 190, 100], [100, 160, 240], [190, 120, 240], [250, 200, 70]]
    var crowns = 0
    var inv: [Holding] = []
    var placed: [String] = []
    var hats: [String] = ["cavalier", "hood", "cap"]
    var seen: [String: Int] = [:]
    var dog = "Pickle"
    var companion = "dog"
    var worn: [String: String] = [:]
    static let slots: [(String, String)] = [("outfit", "Outfits"), ("back", "On your back"), ("neck", "Round your neck"), ("face", "On your face"), ("hand", "In your hand")]
    /// every hat style in the catalogue, cheapest first, with a bare head at the front
    var hatStyles: [String] { ["none"] + items.values.filter { $0.kind == "hat" && $0.hat != nil }.sorted { ($0.rarity, $0.value) < ($1.rarity, $1.value) }.compactMap(\.hat) }
    func owned(slot: String) -> [ItemDef] { inv.compactMap { items[$0.id] }.filter { $0.slot == slot }.sorted { ($0.rarity, $0.name) < ($1.rarity, $1.name) } }
    var found = 0
    var stock: [String: [Ware]] = [:]
    var offers: [String: [String: Int]] = [:]
    var toast: Toast?
    @ObservationIgnored private var toastTask: Task<Void, Never>?

    static let saveKey = "wud.econ.v1"
    static var saved: Any? {
        guard let d = UserDefaults.standard.data(forKey: saveKey) else { return nil }
        return try? JSONSerialization.jsonObject(with: d)
    }

    func color(_ rarity: Int) -> Color {
        let c = rarityRGB[min(max(rarity, 0), rarityRGB.count - 1)]
        return Color(red: Double(c[0]) / 255, green: Double(c[1]) / 255, blue: Double(c[2]) / 255)
    }
    /// the catalogue entry for a hat style ("cavalier" -> hat_cavalier), for its picture
    func hatItem(_ style: String) -> ItemDef? { items.values.first { $0.hat == style } }
    func rarityName(_ r: Int) -> String { rarityNames[min(max(r, 0), rarityNames.count - 1)] }

    // MARK: bridge messages
    func catalog(_ payload: Data) {
        struct Cat: Decodable { var items: [String: ItemDef]; var beasts: [String: BeastDef]; var rarity: [String]; var rarityColor: [[Int]] }
        guard let c = try? JSONDecoder().decode(Cat.self, from: payload) else { return }
        items = c.items; beasts = c.beasts; rarityNames = c.rarity; rarityRGB = c.rarityColor
    }
    func state(_ payload: Data) {
        struct S: Decodable { var crowns: Int; var inv: [Holding]; var placed: [String]; var hats: [String]; var seen: [String: Int]; var dog: String; var found: Int; var companion: String?; var worn: [String: String]? }
        struct Note: Decodable {
            var error: String?; var found: String?; var creature: String?; var first: Bool?
            var bought: String?; var sold: String?; var price: Int?; var used: String?; var line: String?
            var placed: String?; var on: Bool?
        }
        struct Msg: Decodable { var state: S; var note: Note? }
        guard let m = try? JSONDecoder().decode(Msg.self, from: payload) else { return }
        withAnimation(.snappy) {
            crowns = m.state.crowns; inv = m.state.inv.sorted { (items[$0.id]?.rarity ?? 0, $0.id) > (items[$1.id]?.rarity ?? 0, $1.id) }
            placed = m.state.placed; hats = m.state.hats; seen = m.state.seen; dog = m.state.dog; found = m.state.found; companion = m.state.companion ?? "dog"; worn = m.state.worn ?? [:]
        }
        guard let n = m.note else { return }
        if let e = n.error { show(Toast(title: e)) }
        else if let id = n.found, let it = items[id] { show(Toast(title: "Found \(it.name)", sub: rarityName(it.rarity), item: id, rarity: it.rarity)) }
        else if let id = n.creature, let b = beasts[id] { show(Toast(title: (n.first ?? false) ? "New in the bestiary!" : b.name, sub: (n.first ?? false) ? "\(b.name) \u{00B7} \(rarityName(b.rarity))" : b.lore, rarity: b.rarity)) }
        else if let id = n.bought, let it = items[id] { show(Toast(title: "Bought \(it.name)", sub: "\(n.price ?? 0) crowns" + (it.kind == "furniture" ? " \u{00B7} it's at the cottage" : it.kind == "hat" ? " \u{00B7} try it on in the Mirror" : ""), item: id, rarity: it.rarity)) }
        else if let id = n.sold, let it = items[id] { show(Toast(title: "Sold \(it.name)", sub: "+\(n.price ?? 0) crowns", item: id, rarity: it.rarity)) }
        else if let line = n.line { show(Toast(title: line, item: n.used)) }
    }
    func stock(_ payload: Data) {
        struct S: Decodable { var npc: String; var wares: [Ware]?; var offers: [String: Int]? }
        guard let s = try? JSONDecoder().decode(S.self, from: payload) else { return }
        if let w = s.wares { stock[s.npc] = w }
        if let o = s.offers { offers[s.npc] = o }
    }
    func save(_ body: [String: Any]) {
        guard let st = body["state"], let d = try? JSONSerialization.data(withJSONObject: st) else { return }
        UserDefaults.standard.set(d, forKey: Self.saveKey)
    }
    func show(_ t: Toast) {
        toastTask?.cancel()
        withAnimation(.spring(duration: 0.35, bounce: 0.25)) { toast = t }
        toastTask = Task { try? await Task.sleep(for: .seconds(3.2)); if !Task.isCancelled { withAnimation(.easeOut(duration: 0.3)) { toast = nil } } }
    }
}

// MARK: - pixel item icons

/// Draws a catalogue icon: rows of palette letters, as crisp squares.
struct ItemIcon: View {
    let item: ItemDef?
    var scale: CGFloat = 4
    var body: some View {
        let rows = item?.icon ?? []
        Canvas { ctx, _ in
            guard let item else { return }
            for (y, row) in rows.enumerated() {
                for (x, ch) in row.enumerated() where ch != "." {
                    guard let c = item.pal[String(ch)] else { continue }
                    let col = Color(red: Double(c[0]) / 255, green: Double(c[1]) / 255, blue: Double(c[2]) / 255)
                    ctx.fill(Path(CGRect(x: CGFloat(x) * scale, y: CGFloat(y) * scale, width: scale, height: scale)), with: .color(col))
                }
            }
        }
        .frame(width: CGFloat(rows.first?.count ?? 5) * scale, height: CGFloat(rows.count) * scale)
        .accessibilityHidden(true)
    }
}

/// A creature's portrait; unseen ones are a faded silhouette.
struct BeastIcon: View {
    let beast: BeastDef
    var seen = true
    var scale: CGFloat = 4
    var body: some View {
        let rows = beast.icon ?? ["..XX..", ".X..X.", "...X..", "......", "...X.."]
        Canvas { ctx, _ in
            for (y, row) in rows.enumerated() {
                for (x, ch) in row.enumerated() where ch != "." {
                    let col: Color
                    if seen, let c = beast.pal?[String(ch)] { col = Color(red: Double(c[0]) / 255, green: Double(c[1]) / 255, blue: Double(c[2]) / 255) }
                    else { col = Ink.parchmentShade }
                    ctx.fill(Path(CGRect(x: CGFloat(x) * scale, y: CGFloat(y) * scale, width: scale, height: scale)), with: .color(col))
                }
            }
        }
        .frame(width: CGFloat(rows.first?.count ?? 6) * scale, height: CGFloat(rows.count) * scale)
        .accessibilityHidden(true)
    }
}

/// A crown: the currency mark.
struct CrownMark: View {
    var scale: CGFloat = 2
    var body: some View {
        PixelIcon(rows: ["X.X.X", "XXXXX", "XXXXX"], color: Ink.goldDeep, scale: scale)
            .accessibilityLabel("crowns")
    }
}

/// A hat as a little picture tile with its name under it.
struct HatChip: View {
    let style: String
    let item: ItemDef?
    let on: Bool
    var label: String? = nil
    let action: () -> Void
    var body: some View {
        Button { action(); Sound.shared.play("tap"); Haptics.play("soft") } label: {
            VStack(spacing: 5) {
                Group {
                    if style == "none" { PixelIcon(rows: [".XXX.", "X...X", "X.X.X", "X...X", ".XXX."], color: Ink.inkSoft, scale: 6) }
                    else if item != nil { ItemIcon(item: item, scale: 6) }
                    else { PixelIcon(rows: [".....", ".XXX.", "XXXXX"], color: Ink.inkSoft, scale: 6) }
                }
                .frame(height: 32)
                Text(label ?? (style == "none" ? "bare head" : style.capitalized))
                    .font(Fonts.pixel(11, on ? .bold : .regular)).foregroundStyle(Ink.ink)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            .frame(width: 70, height: 64)
            .background { PixelFrame(step: 2).fill(on ? Ink.gold.opacity(0.45) : Ink.parchmentDeep) }
            .overlay { PixelFrame(step: 2).stroke(on ? Ink.goldDeep : Ink.faded.opacity(0.5), lineWidth: on ? 2.5 : 1.5) }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(item?.name ?? (style == "none" ? "bare head" : style))
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

// MARK: - the satchel (inventory, wardrobe, bestiary)

struct SatchelSheet: View {
    var econ: Economy
    var game: Game
    var avatar: Avatar
    var onClose: () -> Void
    @State private var tab = 0
    @State private var picked: String?
    @State private var dogName = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center) {
                Text("The Satchel").font(Fonts.blackletter(30)).foregroundStyle(Ink.ink)
                Spacer()
                HStack(spacing: 5) { CrownMark(scale: 2.4); Text("\(econ.crowns)").font(Fonts.pixel(18, .bold)).monospacedDigit().contentTransition(.numericText()) }
                    .foregroundStyle(Ink.ink)
                    .accessibilityElement(children: .combine)
                Button(action: onClose) { PixelIcon(rows: PixelIcon.close, scale: 2.4).padding(8) }.accessibilityLabel("Close")
            }
            HStack(spacing: 6) {
                tabButton("Satchel", 0); tabButton("Wardrobe", 1); tabButton("Bestiary", 2)
            }
            switch tab {
            case 1: wardrobe
            case 2: bestiary
            default: satchel
            }
        }
        .padding(18)
        .parchment()
        .padding(12)
        .onAppear { dogName = econ.dog }
    }

    private func tabButton(_ t: String, _ i: Int) -> some View {
        Button { withAnimation(.snappy(duration: 0.2)) { tab = i; picked = nil }; Sound.shared.play("tap") } label: {
            Text(t).font(Fonts.pixel(13, .semibold))
                .foregroundStyle(tab == i ? Ink.parchment : Ink.inkSoft)
                .padding(.horizontal, 10).padding(.vertical, 5)
                .background { if tab == i { PixelFrame(step: 2).fill(Ink.ink) } else { PixelFrame(step: 2).stroke(Ink.faded, lineWidth: 1.5) } }
        }.buttonStyle(.plain)
    }

    // the bag
    private var satchel: some View {
        VStack(alignment: .leading, spacing: 10) {
            if econ.inv.isEmpty {
                Text("Empty, save for crumbs. Wander the island: things glint in the grass, and the rarest only turn up at night or in odd weather.")
                    .font(Fonts.pixel(14)).foregroundStyle(Ink.faded).padding(.vertical, 20)
            } else {
                ScrollView {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 62), spacing: 8)], spacing: 8) {
                        ForEach(econ.inv) { h in tile(h) }
                    }
                    .padding(2)
                }
                .scrollIndicators(.hidden)
                .frame(maxHeight: 250)
            }
            if let id = picked, let it = econ.items[id] { detail(it) }
            else { Text("\(econ.found) treasure\(econ.found == 1 ? "" : "s") found so far. Tap one to look closer.").font(Fonts.pixel(12)).foregroundStyle(Ink.faded) }
        }
    }
    private func tile(_ h: Holding) -> some View {
        let it = econ.items[h.id]
        return Button { withAnimation(.snappy(duration: 0.2)) { picked = picked == h.id ? nil : h.id }; Sound.shared.play("tap"); Haptics.play("light") } label: {
            ItemIcon(item: it, scale: 5)
                .frame(width: 58, height: 58)
                .background { PixelFrame(step: 2).fill(picked == h.id ? Ink.gold.opacity(0.35) : Ink.parchmentDeep) }
                .overlay { PixelFrame(step: 2).stroke(econ.color(it?.rarity ?? 0), lineWidth: (it?.rarity ?? 0) >= 2 ? 3 : 2) }
                .overlay(alignment: .bottomTrailing) {
                    if h.n > 1 { Text("\(h.n)").font(Fonts.pixel(11, .bold)).foregroundStyle(Ink.parchment).padding(.horizontal, 4).background(Ink.ink).offset(x: -3, y: -3) }
                }
                .overlay(alignment: .topTrailing) {
                    if econ.placed.contains(h.id) { PixelIcon(rows: [".X.", "XXX", "X.X"], color: Ink.leaf, scale: 2).padding(4) }
                }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(it?.name ?? h.id), \(h.n)")
    }
    private func detail(_ it: ItemDef) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(it.name).font(Fonts.pixel(17, .bold)).foregroundStyle(Ink.ink)
                Text(econ.rarityName(it.rarity)).font(Fonts.pixel(12, .semibold)).foregroundStyle(econ.color(it.rarity)).shadow(color: Ink.ink.opacity(0.4), radius: 0, x: 1, y: 1)
                Spacer()
                HStack(spacing: 3) { Text("worth ~\(it.value)").font(Fonts.pixel(12)); CrownMark(scale: 1.6) }.foregroundStyle(Ink.faded)
            }
            Text(it.desc).font(Fonts.pixel(14)).foregroundStyle(Ink.inkSoft)
            HStack(spacing: 8) {
                switch it.kind {
                case "drink": action("Drink") { game.useItem(it.id) }
                case "food": action(it.id == "bone" ? "Give to \(econ.dog)" : "Eat") { game.useItem(it.id) }
                case "magic", "gem": action("Hold it up") { game.useItem(it.id) }
                case "curio" where ["firework", "snowglobe", "musicbox", "map"].contains(it.id): action("Use it") { game.useItem(it.id) }
                case "wear":
                    let on = econ.worn[it.slot ?? ""] == it.id
                    action(on ? "Take it off" : "Wear it") { game.wear(it.slot ?? "", on ? nil : it.id) }
                case "furniture":
                    let home = econ.placed.contains(it.id)
                    action(home ? "Take it back" : "Put it at home") { game.placeItem(it.id, on: !home) }
                default: EmptyView()
                }
                Spacer()
                Text("Sell to villagers who want it").font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
            }
        }
        .padding(10)
        .background { PixelFrame(step: 2).fill(Ink.parchmentDeep.opacity(0.6)) }
        .transition(.opacity.combined(with: .move(edge: .bottom)))
    }
    private func action(_ t: String, _ f: @escaping () -> Void) -> some View {
        Button(t) { Haptics.play("light"); f() }.buttonStyle(PixelButtonStyle(fill: Ink.gold)).font(Fonts.pixel(13))
    }

    // hats and the dog
    private var wardrobe: some View {
        ScrollView { VStack(alignment: .leading, spacing: 12) {
            Text("Hats").font(Fonts.pixel(13, .semibold)).foregroundStyle(Ink.inkSoft)
            FlowRow {
                ForEach(econ.hatStyles.filter { $0 == "none" || econ.hats.contains($0) }, id: \.self) { h in
                    HatChip(style: h, item: econ.hatItem(h), on: avatar.hatName == h) { avatar.hatName = h; game.setAvatar(avatar.look) }
                }
            }
            let missing = econ.hatStyles.filter { $0 != "none" && !econ.hats.contains($0) }.count
            if missing > 0 { Text("\(missing) more hat\(missing == 1 ? "" : "s") out there, at the stalls or lying in the grass.").font(Fonts.pixel(12)).foregroundStyle(Ink.faded) }
            ForEach(Economy.slots, id: \.0) { slot, title in
                let mine = econ.owned(slot: slot)
                DottedRule()
                Text(title).font(Fonts.pixel(13, .semibold)).foregroundStyle(Ink.inkSoft)
                if mine.isEmpty {
                    Text("Nothing yet. The villagers sell all sorts, and some things only turn up at the right hour.").font(Fonts.pixel(12)).foregroundStyle(Ink.faded)
                } else {
                    FlowRow {
                        ForEach(mine) { it in
                            HatChip(style: it.id, item: it, on: econ.worn[slot] == it.id, label: shortName(it.name)) { game.wear(slot, econ.worn[slot] == it.id ? nil : it.id) }
                        }
                    }
                }
            }
            DottedRule()
            Text("Your dog").font(Fonts.pixel(13, .semibold)).foregroundStyle(Ink.inkSoft)
            HStack {
                TextField("", text: $dogName, prompt: Text("name").foregroundStyle(Ink.faded))
                    .font(Fonts.pixel(15)).foregroundStyle(Ink.ink).textInputAutocapitalization(.words).autocorrectionDisabled()
                    .padding(.horizontal, 10).padding(.vertical, 7)
                    .background { PixelFrame(step: 2).fill(Ink.parchmentDeep) }
                    .onSubmit { game.nameDog(dogName) }
                Button("Rename") { game.nameDog(dogName); Sound.shared.play("woof") }.buttonStyle(PixelButtonStyle()).font(Fonts.pixel(13))
            }
            Text("Tap \(econ.dog) in the village for a cuddle. Bones make for a very happy dog. Any creature you've met can walk with you instead: see the Bestiary.").font(Fonts.pixel(12)).foregroundStyle(Ink.faded)
        } }
        .scrollIndicators(.hidden)
        .frame(maxHeight: 470)
    }
    /// the last word or two of a name, to fit under a tile ("Royal Doublet" -> "Doublet")
    private func shortName(_ n: String) -> String {
        let words = n.split(separator: " ").filter { !["of", "the", "a"].contains($0.lowercased()) }
        return words.last.map(String.init) ?? n
    }

    /// "Walk with me", or a quiet "by your side" for whoever is already following
    @ViewBuilder private func companionButton(_ id: String) -> some View {
        if econ.companion == id {
            HStack(spacing: 4) { PixelIcon(rows: [".X.X.", "XXXXX", ".XXX.", "..X.."], color: Color(red: 0.86, green: 0.36, blue: 0.42), scale: 1.6); Text("by your side").font(Fonts.pixel(11, .semibold)) }
                .foregroundStyle(Ink.inkSoft)
        } else {
            Button("Walk with me") { game.setCompanion(id); Haptics.play("success") }
                .buttonStyle(PixelButtonStyle(fill: Ink.gold)).font(Fonts.pixel(11))
        }
    }

    // creatures you've spotted
    private var bestiary: some View {
        let all = econ.beasts.sorted { ($0.value.rarity, $0.value.name) < ($1.value.rarity, $1.value.name) }
        return VStack(alignment: .leading, spacing: 8) {
            Text("\(econ.seen.count) of \(all.count) spotted. They come and go with the hour, the weather and the season.").font(Fonts.pixel(12)).foregroundStyle(Ink.faded)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top, spacing: 10) {
                        BeastIcon(beast: .dog(econ.dog), scale: 4)
                            .frame(width: 50, height: 50)
                            .background { PixelFrame(step: 2).fill(Ink.parchmentDeep) }
                            .overlay { PixelFrame(step: 2).stroke(Ink.goldDeep, lineWidth: 2) }
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(alignment: .firstTextBaseline) {
                                Text(econ.dog).font(Fonts.pixel(15, .semibold)).foregroundStyle(Ink.ink)
                                Text("your dog").font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
                                Spacer()
                                companionButton("dog")
                            }
                            Text("A good dog, the best in Wudland. Follows you everywhere, and loves a bone.").font(Fonts.pixel(12)).foregroundStyle(Ink.inkSoft)
                        }
                    }
                    .padding(.vertical, 7)
                    .overlay(alignment: .bottom) { DottedRule() }
                    ForEach(all, id: \.key) { id, b in
                        let n = econ.seen[id] ?? 0
                        HStack(alignment: .top, spacing: 10) {
                            BeastIcon(beast: b, seen: n > 0, scale: 4)
                                .frame(width: 50, height: 50)
                                .background { PixelFrame(step: 2).fill(n > 0 ? Ink.parchmentDeep : Ink.parchmentDeep.opacity(0.5)) }
                                .overlay { PixelFrame(step: 2).stroke(n > 0 ? econ.color(b.rarity) : Ink.faded.opacity(0.4), lineWidth: n > 0 && b.rarity >= 2 ? 3 : 2) }
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(alignment: .firstTextBaseline) {
                                    Text(n > 0 ? b.name : "???").font(Fonts.pixel(15, .semibold)).foregroundStyle(n > 0 ? Ink.ink : Ink.faded)
                                    Text(econ.rarityName(b.rarity)).font(Fonts.pixel(11)).foregroundStyle(Ink.faded)
                                    Spacer()
                                    if n > 0 { Text("seen \u{00D7}\(n)").font(Fonts.pixel(11)).foregroundStyle(Ink.faded) }
                                }
                                Text(n > 0 ? b.lore : "Not yet seen.").font(Fonts.pixel(12)).foregroundStyle(Ink.inkSoft)
                                if n > 0 { HStack { Spacer(); companionButton(id) }.padding(.top, 3) }
                            }
                        }
                        .padding(.vertical, 7)
                        .overlay(alignment: .bottom) { DottedRule() }
                    }
                }
            }
            .scrollIndicators(.hidden)
            .frame(maxHeight: 330)
        }
    }
}

// MARK: - a villager's wares (a tab in the dialogue)

struct WaresView: View {
    let npc: String
    var econ: Economy
    var game: Game
    @State private var mode = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                seg("Buy", 0); seg("Sell", 1)
                Spacer()
                HStack(spacing: 4) { CrownMark(); Text("\(econ.crowns)").font(Fonts.pixel(15, .bold)).monospacedDigit().contentTransition(.numericText()) }.foregroundStyle(Ink.ink)
            }
            .padding(.horizontal, 14)
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    if mode == 0 { buyList } else { sellList }
                }
                .padding(.horizontal, 14)
            }
            .scrollIndicators(.hidden)
            .frame(maxHeight: .infinity)
        }
        .padding(.top, 4)
        .onAppear { game.requestStock(npc) }
    }
    private func seg(_ t: String, _ i: Int) -> some View {
        Button { withAnimation(.snappy(duration: 0.2)) { mode = i }; Sound.shared.play("tap") } label: {
            Text(t).font(Fonts.pixel(13, .semibold)).foregroundStyle(mode == i ? Ink.ink : Ink.faded)
                .padding(.horizontal, 4).padding(.bottom, 3)
                .overlay(alignment: .bottom) { if mode == i { Rectangle().fill(Ink.goldDeep).frame(height: 2) } }
        }.buttonStyle(.plain)
    }
    @ViewBuilder private var buyList: some View {
        let wares = econ.stock[npc] ?? []
        if wares.isEmpty { Text("Nothing on the table right now. Stock turns over every couple of hours.").font(Fonts.pixel(13)).foregroundStyle(Ink.faded).padding(.vertical, 12) }
        ForEach(wares) { w in
            let it = econ.items[w.id]
            row(it, sub: w.qty > 0 ? "\(it?.desc ?? "")" : "sold out", faded: w.qty == 0) {
                Button { game.buy(npc, w.id) } label: { HStack(spacing: 3) { Text("\(w.price)"); CrownMark(scale: 1.6) } }
                    .buttonStyle(PixelButtonStyle(fill: econ.crowns >= w.price && w.qty > 0 ? Ink.gold : Ink.parchmentDeep)).font(Fonts.pixel(13))
                    .disabled(econ.crowns < w.price || w.qty == 0)
                    .accessibilityLabel("Buy for \(w.price) crowns")
            }
        }
        Text("Prices shift every two hours. Odette pays best for gems and curios.").font(Fonts.pixel(11)).foregroundStyle(Ink.faded).padding(.top, 8)
    }
    @ViewBuilder private var sellList: some View {
        let offers = econ.offers[npc] ?? [:]
        let sellable = econ.inv.filter { (offers[$0.id] ?? 0) > 0 }
        if sellable.isEmpty { Text("Nothing in your satchel they want. Try someone else, or go treasure hunting.").font(Fonts.pixel(13)).foregroundStyle(Ink.faded).padding(.vertical, 12) }
        ForEach(sellable) { h in
            let it = econ.items[h.id], price = offers[h.id] ?? 0
            row(it, sub: "you have \(h.n)", faded: false) {
                Button { game.sell(npc, h.id) } label: { HStack(spacing: 3) { Text("+\(price)"); CrownMark(scale: 1.6) } }
                    .buttonStyle(PixelButtonStyle()).font(Fonts.pixel(13))
                    .accessibilityLabel("Sell for \(price) crowns")
            }
        }
    }
    private func row<B: View>(_ it: ItemDef?, sub: String, faded: Bool, @ViewBuilder button: () -> B) -> some View {
        HStack(spacing: 10) {
            ItemIcon(item: it, scale: 4).frame(width: 36, height: 36)
                .background { PixelFrame(step: 2).fill(Ink.parchmentDeep) }
                .overlay { PixelFrame(step: 2).stroke(econ.color(it?.rarity ?? 0), lineWidth: 2) }
            VStack(alignment: .leading, spacing: 1) {
                Text(it?.name ?? "?").font(Fonts.pixel(15, .medium)).foregroundStyle(faded ? Ink.faded : Ink.ink).lineLimit(1)
                Text(sub).font(Fonts.pixel(11)).foregroundStyle(Ink.faded).lineLimit(1)
            }
            Spacer(minLength: 6)
            button()
        }
        .padding(.vertical, 7)
        .overlay(alignment: .bottom) { DottedRule() }
    }
}

// MARK: - toast

struct ToastView: View {
    let toast: Toast
    var econ: Economy
    var body: some View {
        HStack(spacing: 10) {
            if let id = toast.item, let it = econ.items[id] {
                ItemIcon(item: it, scale: 4).frame(width: 30, height: 30)
            } else {
                PixelIcon(rows: PixelIcon.star, color: econ.color(toast.rarity), scale: 3)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(toast.title).font(Fonts.pixel(15, .semibold)).foregroundStyle(Ink.ink).lineLimit(2)
                if let s = toast.sub { Text(s).font(Fonts.pixel(12)).foregroundStyle(toast.rarity >= 2 ? econ.color(toast.rarity) : Ink.faded).lineLimit(2) }
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
        .parchment(step: 2)
        .overlay { if toast.rarity >= 2 { PixelFrame(step: 2).stroke(econ.color(toast.rarity), lineWidth: 2).padding(3) } }
        .padding(.horizontal, 22)
        .accessibilityElement(children: .combine)
    }
}
