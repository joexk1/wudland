'use strict';
// Wares: crowns, the satchel, villagers who trade, treasure lying about the island,
// magical creatures that come and go with the weather, and the player's dog.
// State lives here; the app mirrors it (and keeps it safe) through 'econ' bridge messages.

/* ---------- the catalogue ---------- */
const RARITY = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_COLOR = [[196, 180, 150], [120, 190, 100], [100, 160, 240], [190, 120, 240], [250, 200, 70]];

// icon: pixel rows; letters index the item's palette. kind drives what you can do with it.
const ITEMS = {
  // drink and food (use them: they do things)
  ale: { name: 'Goose Ale', kind: 'drink', value: 6, rarity: 0, desc: 'Brewed behind the Gossiping Goose. Makes walking interesting.', pal: { a: [236, 226, 204], b: [214, 150, 50], c: [120, 80, 50] }, icon: ['.aaa.', 'abbbc', 'abbbc', 'abbbc', '.ccc.'] },
  mead: { name: 'Honey Mead', kind: 'drink', value: 14, rarity: 1, desc: 'Sweet, strong, and golden as August.', pal: { a: [160, 110, 60], b: [246, 200, 80], c: [236, 230, 210] }, icon: ['..c..', '.aaa.', 'abbba', 'abbba', '.aaa.'] },
  cider: { name: 'Scrumpy Cider', kind: 'drink', value: 8, rarity: 0, desc: 'Cloudy, tart, and suspiciously fizzy.', pal: { a: [120, 160, 80], b: [230, 200, 110], c: [80, 60, 40] }, icon: ['..c..', '.aaa.', '.aba.', 'aabaa', '.aaa.'] },
  tea: { name: "Hilda's Calming Tea", kind: 'drink', value: 7, rarity: 0, desc: 'Chamomile, lemon balm, and a stern talking-to.', pal: { a: [236, 230, 214], b: [170, 120, 60], c: [140, 180, 110] }, icon: ['.c...', 'aaaa.', 'abbaa', 'abba.', '.aa..'] },
  bread: { name: 'Crusty Loaf', kind: 'food', value: 3, rarity: 0, desc: 'Still warm, somehow.', pal: { a: [200, 140, 70], b: [236, 196, 120] }, icon: ['.....', '.aaa.', 'abbba', 'aaaaa', '.....'] },
  apple: { name: 'Red Apple', kind: 'food', value: 2, rarity: 0, desc: 'Crisp. Keeps the alchemist away.', pal: { a: [200, 50, 50], b: [100, 150, 60], c: [250, 140, 120] }, icon: ['..b..', '.aaa.', 'acaaa', 'aaaaa', '.aaa.'] },
  cheese: { name: 'Wheel of Cheese', kind: 'food', value: 12, rarity: 1, desc: 'Aged in the Goose cellar. Smells like a decision.', pal: { a: [240, 200, 90], b: [200, 160, 60] }, icon: ['.....', '.aaaa', 'aabaa', 'aaaab', '.aaaa'] },
  pie: { name: 'Pumpkin Pie', kind: 'food', value: 9, rarity: 1, desc: 'An autumn speciality, spiced and sticky.', pal: { a: [200, 140, 70], b: [230, 120, 40] }, icon: ['.....', '.....', '.bbb.', 'abbba', 'aaaaa'] },
  bone: { name: 'Big Bone', kind: 'food', value: 4, rarity: 0, desc: 'For a good dog. The best dog.', pal: { a: [240, 234, 220] }, icon: ['a...a', '.a.a.', '..a..', '.a.a.', 'a...a'] },
  // little treasures found about the island
  acorn: { name: 'Shiny Acorn', kind: 'trinket', value: 2, rarity: 0, desc: "Polished by a squirrel with standards.", pal: { a: [150, 100, 50], b: [100, 70, 40] }, icon: ['.bbb.', 'bbbbb', '.aaa.', '.aaa.', '..a..'], ground: [190, 130, 60] },
  feather: { name: 'Raven Feather', kind: 'trinket', value: 4, rarity: 0, desc: 'Dropped by one of Pim\'s couriers.', pal: { a: [50, 50, 70], b: [90, 100, 130] }, icon: ['....a', '...ab', '..ab.', '.ab..', 'a....'], ground: [60, 60, 80] },
  button: { name: 'Brass Button', kind: 'trinket', value: 3, rarity: 0, desc: 'Off a very fine coat. Somebody misses it.', pal: { a: [220, 170, 80], b: [150, 110, 50] }, icon: ['.aaa.', 'aabaa', 'ababa', 'aabaa', '.aaa.'], ground: [220, 170, 80] },
  marble: { name: 'Glass Marble', kind: 'trinket', value: 6, rarity: 0, desc: 'A swirl of blue caught in glass.', pal: { a: [120, 180, 230], b: [230, 240, 250] }, icon: ['.aaa.', 'abaaa', 'aaaba', 'aabaa', '.aaa.'], ground: [120, 180, 230] },
  horseshoe: { name: 'Lucky Horseshoe', kind: 'trinket', value: 11, rarity: 1, desc: 'Points up, so the luck stays in.', pal: { a: [150, 150, 160] }, icon: ['a...a', 'a...a', 'a...a', '.a.a.', '..a..'], ground: [150, 150, 160] },
  key: { name: 'Old Iron Key', kind: 'curio', value: 18, rarity: 1, desc: 'Opens something, somewhere, once.', pal: { a: [110, 100, 100], b: [60, 56, 56] }, icon: ['.aa..', 'a.a..', '.aa..', '..a..', '..aa.'], ground: [110, 100, 100] },
  shroom: { name: 'Glowcap Mushroom', kind: 'magic', value: 15, rarity: 1, desc: 'Only fruits after rain. Hilda pays well.', pal: { a: [120, 230, 200], b: [236, 226, 200] }, icon: ['.aaa.', 'aaaaa', '..b..', '..b..', '.bbb.'], ground: [120, 230, 200], glow: true },
  snowflake: { name: 'Frozen Snowflake', kind: 'magic', value: 25, rarity: 1, desc: 'It never melts. Nobody knows why.', pal: { a: [220, 236, 250] }, icon: ['a.a.a', '.aaa.', 'aaaaa', '.aaa.', 'a.a.a'], ground: [220, 236, 250], glow: true },
  coin: { name: 'Ancient Coin', kind: 'curio', value: 30, rarity: 2, desc: 'Stamped with a king nobody remembers.', pal: { a: [200, 160, 70], b: [150, 110, 40] }, icon: ['.aaa.', 'abbba', 'ababa', 'abbba', '.aaa.'], ground: [220, 170, 70] },
  stardust: { name: 'Pinch of Stardust', kind: 'magic', value: 40, rarity: 2, desc: 'Fell last night. Still warm.', pal: { a: [250, 240, 180], b: [200, 180, 255] }, icon: ['a...b', '..a..', '.bab.', '..a..', 'b...a'], ground: [250, 240, 180], glow: true },
  rainbow: { name: 'Bottled Rainbow', kind: 'magic', value: 70, rarity: 2, desc: 'Caught at the end of a shower. Shake gently.', pal: { a: [230, 230, 240], b: [230, 90, 80], c: [240, 200, 80], d: [100, 180, 230] }, icon: ['..a..', '.aaa.', 'abcda', 'abcda', '.aaa.'], ground: [200, 200, 250], glow: true },
  moonstone: { name: 'Moonstone', kind: 'gem', value: 60, rarity: 2, desc: 'Glows faintly when the moon is up.', pal: { a: [200, 220, 250], b: [150, 170, 230] }, icon: ['..a..', '.aab.', 'aaabb', '.abb.', '..b..'], ground: [200, 220, 250], glow: true },
  amber: { name: 'Amber with a Bug', kind: 'gem', value: 45, rarity: 2, desc: 'A tiny fly, very cross about it, forever.', pal: { a: [240, 160, 50], b: [60, 40, 30] }, icon: ['.aaa.', 'aaaaa', 'aabaa', 'aaaaa', '.aaa.'], ground: [240, 160, 50] },
  ruby: { name: "Pigeon's-Blood Ruby", kind: 'gem', value: 120, rarity: 3, desc: 'Fit for a crown. Or a very smug ring.', pal: { a: [220, 40, 60], b: [255, 140, 150] }, icon: ['.aaa.', 'abaaa', 'aaaaa', '.aaa.', '..a..'], ground: [220, 40, 60], glow: true },
  scale: { name: 'Dragon Scale', kind: 'magic', value: 160, rarity: 3, desc: 'Shed by a wyrmling in a thunderstorm. Warm to touch.', pal: { a: [80, 170, 120], b: [40, 110, 80] }, icon: ['.aaa.', 'aabaa', 'abbba', '.aba.', '..a..'], ground: [80, 170, 120], glow: true },
  eggold: { name: 'Golden Egg', kind: 'gem', value: 260, rarity: 4, desc: 'The golden goose was here. Lucky you.', pal: { a: [250, 210, 80], b: [255, 245, 190] }, icon: ['.aa..', 'abaa.', 'aaaaa', 'aaaaa', '.aaa.'], ground: [250, 210, 80], glow: true },
  phoenix: { name: 'Phoenix Feather', kind: 'magic', value: 400, rarity: 4, desc: 'Flickers like a candle that refuses to go out.', pal: { a: [250, 120, 40], b: [255, 220, 90] }, icon: ['....a', '...ab', '..ab.', '.ab..', 'b....'], ground: [250, 140, 50], glow: true },
  jewel: { name: 'Lost Crown Jewel', kind: 'gem', value: 500, rarity: 4, desc: 'The old king lost it in a pond. Now it is yours.', pal: { a: [120, 220, 255], b: [255, 255, 255], c: [250, 200, 70] }, icon: ['..b..', '.aaa.', 'aabaa', '.aaa.', 'ccccc'], ground: [120, 220, 255], glow: true },
  // hats you can wear (the Mirror shows the ones you own)
  hat_cavalier: { name: 'Plumed Cavalier', kind: 'hat', hat: 'cavalier', value: 40, rarity: 1, free: true, desc: 'Your own. Swashbuckling is implied.', pal: { a: [48, 40, 52], b: [236, 190, 86], c: [213, 89, 80] }, icon: ['...cc', '..cc.', '.aaa.', '.bbb.', 'aaaaa'] },
  hat_hood: { name: 'Travelling Hood', kind: 'hat', hat: 'hood', value: 8, rarity: 0, free: true, desc: 'Keeps the drizzle off.', pal: { a: [150, 60, 50] }, icon: ['.aaa.', 'aaaaa', 'aa.aa', 'a...a', '.....'] },
  hat_cap: { name: 'Cloth Cap', kind: 'hat', hat: 'cap', value: 6, rarity: 0, free: true, desc: 'Sensible. Very sensible.', pal: { a: [70, 90, 120] }, icon: ['.....', '.aaa.', 'aaaaa', '...aa', '.....'] },
  hat_straw: { name: "Farmer's Straw Hat", kind: 'hat', hat: 'straw', value: 15, rarity: 0, desc: 'Keeps the sun off. Smells of hay.', pal: { a: [226, 196, 120], b: [160, 60, 50] }, icon: ['.....', '.aaa.', '.bbb.', 'aaaaa', '.....'] },
  hat_beret: { name: "Painter's Beret", kind: 'hat', hat: 'beret', value: 25, rarity: 0, desc: 'Instantly 40% more artistic.', pal: { a: [150, 60, 50] }, icon: ['.....', '..a..', '.aaaa', 'aaaa.', '.....'] },
  hat_helmet: { name: "Knight's Helm", kind: 'hat', hat: 'helmet', value: 60, rarity: 1, desc: 'Sir Clank\'s spare. Slightly dented.', pal: { a: [160, 164, 172], b: [196, 50, 50] }, icon: ['..b..', '.aaa.', 'aaaaa', 'a.a.a', 'aaaaa'] },
  hat_wizard: { name: 'Starry Wizard Hat', kind: 'hat', hat: 'wizard', value: 90, rarity: 2, desc: 'The wizard says it suits you. The wizard is biased.', pal: { a: [80, 56, 128], b: [236, 196, 90] }, icon: ['...a.', '..aa.', '.aba.', '.aaa.', 'aaaaa'] },
  hat_antlers: { name: 'Forest Antlers', kind: 'hat', hat: 'antlers', value: 120, rarity: 3, desc: 'A gift from the moon stag, or so the label claims.', pal: { a: [200, 170, 120] }, icon: ['a.a.a', 'aa.aa', '.a.a.', '.a.a.', '.....'] },
  hat_crown: { name: 'Golden Crown', kind: 'hat', hat: 'crown', value: 300, rarity: 3, desc: 'Lord of Wudland, for real this time.', pal: { a: [236, 196, 80], b: [220, 40, 60] }, icon: ['.....', 'a.a.a', 'aaaaa', 'abaab', 'aaaaa'] },
  hat_halo: { name: "Saint's Halo", kind: 'hat', hat: 'halo', value: 250, rarity: 4, desc: 'Brother Tobias blessed it. Glows at night.', pal: { a: [255, 236, 150] }, icon: ['.aaa.', 'a...a', '.aaa.', '.....', '.....'] },
  // things for the cottage (they appear at home once you place them)
  f_plant: { name: 'Potted Fern', kind: 'furniture', value: 20, rarity: 0, desc: 'Brings the outside in, politely.', pal: { a: [80, 140, 70], b: [170, 100, 60] }, icon: ['a.a.a', '.aaa.', '..a..', '.bbb.', '.bbb.'] },
  f_banner: { name: 'Wudland Banner', kind: 'furniture', value: 30, rarity: 1, desc: 'Red and gold, with a little lantern.', pal: { a: [170, 50, 50], b: [236, 196, 90] }, icon: ['aaaaa', 'aaaaa', 'aabaa', 'aaaaa', 'a...a'] },
  f_painting: { name: 'Your Portrait', kind: 'furniture', value: 55, rarity: 1, desc: 'Very flattering. Suspiciously flattering.', pal: { a: [200, 160, 70], b: [238, 198, 164], c: [70, 100, 80] }, icon: ['aaaaa', 'acbca', 'acbca', 'accca', 'aaaaa'] },
  f_chest: { name: 'Treasure Chest', kind: 'furniture', value: 45, rarity: 1, desc: 'For treasure. Or socks.', pal: { a: [140, 90, 50], b: [220, 170, 80] }, icon: ['.....', '.aaa.', 'abbba', 'aabaa', 'aaaaa'] },
  f_lute: { name: 'Wall Lute', kind: 'furniture', value: 35, rarity: 1, desc: 'Fennick swears it is in tune.', pal: { a: [190, 130, 70], b: [90, 60, 40] }, icon: ['....b', '...b.', '.ab..', 'aaa..', '.a...'] },
  f_globe: { name: 'Brass Globe', kind: 'furniture', value: 70, rarity: 2, desc: 'The world, as Gearwin imagines it.', pal: { a: [80, 140, 180], b: [200, 160, 70] }, icon: ['.aaa.', 'aaaba', 'aaaaa', '.aaa.', '.bbb.'] },
  f_cauldron: { name: 'Little Cauldron', kind: 'furniture', value: 50, rarity: 2, desc: 'Bubbles on its own. Do not drink.', pal: { a: [50, 46, 52], b: [120, 220, 120] }, icon: ['.....', 'abbba', 'aaaaa', 'aaaaa', '.a.a.'] },
  f_rug: { name: 'Royal Rug', kind: 'furniture', value: 60, rarity: 2, desc: 'Deep blue and gold. Shoes off.', pal: { a: [50, 70, 140], b: [236, 196, 90] }, icon: ['.....', 'aaaaa', 'ababa', 'aaaaa', '.....'] },
  f_armor: { name: 'Suit of Armour', kind: 'furniture', value: 140, rarity: 3, desc: 'Empty. Probably.', pal: { a: [170, 174, 182], b: [196, 50, 50] }, icon: ['..b..', '.aaa.', 'aaaaa', '.a.a.', '.a.a.'] },
};
for (const [id, it] of Object.entries(ITEMS)) it.id = id;

/* ---------- who trades what ---------- */
// sells: the pool their stall draws from; buys: kinds they want and how keenly (share of value paid)
const MERCHANTS = {
  odette: { sells: ['hat_straw', 'hat_beret', 'hat_helmet', 'hat_wizard', 'hat_antlers', 'hat_crown', 'f_plant', 'f_banner', 'f_painting', 'f_chest', 'f_globe', 'f_rug', 'f_cauldron', 'f_armor', 'key', 'marble'], buys: { gem: .7, curio: .65, magic: .55, trinket: .5, hat: .45, furniture: .45 }, slots: 7 },
  mags: { sells: ['ale', 'ale', 'mead', 'cider', 'cheese', 'pie', 'bread', 'bone'], buys: { food: .5, drink: .5, trinket: .3 }, slots: 5 },
  hilda: { sells: ['tea', 'apple', 'f_plant', 'shroom', 'bread'], buys: { magic: .75, food: .4 }, slots: 4 },
  gearwin: { sells: ['f_globe', 'key', 'f_cauldron', 'f_armor'], buys: { trinket: .65, curio: .7 }, slots: 3 },
  bram: { sells: ['apple', 'bread', 'pie', 'hat_straw', 'bone'], buys: { trinket: .45, food: .5 }, slots: 4 },
  clank: { sells: ['hat_helmet', 'f_armor', 'horseshoe'], buys: { trinket: .5, gem: .55 }, slots: 2 },
  tobias: { sells: ['hat_halo', 'tea'], buys: { curio: .75, gem: .6 }, slots: 2 },
  wren: { sells: ['marble', 'feather', 'acorn', 'apple'], buys: { trinket: .6 }, slots: 3 },
  fennick: { sells: ['f_lute', 'mead'], buys: { drink: .4 }, slots: 2 },
};
const MARKUP = [1.25, 1.3, 1.35, 1.4, 1.45];

function rngFrom(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) ^ Math.imul(s ^ (s >>> 13), 3266489917)) >>> 0) / 4294967296; }
function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

// stock turns over every two hours; what you bought stays bought until then
function stockWindow() { return Math.floor(Date.now() / 7.2e6); }
function stockFor(npc) {
  const m = MERCHANTS[npc]; if (!m) return null;
  const w = stockWindow(), r = rngFrom(strHash(npc + ':' + w)), season = seasonOf();
  const pool = m.sells.filter(id => !(id === 'pie' && season !== 'autumn'));
  const picks = new Map();
  for (let n = 0; n < 40 && picks.size < m.slots; n++) {
    const id = pool[Math.floor(r() * pool.length)], it = ITEMS[id];
    if (!it || picks.has(id)) continue;
    if (r() < it.rarity * .16) continue;            // rarer goods turn up less often
    const qty = it.kind === 'hat' || it.kind === 'furniture' || it.kind === 'wear' ? 1 : 1 + Math.floor(r() * 3);
    const price = Math.max(1, Math.round(it.value * MARKUP[it.rarity] * (.9 + r() * .25)));
    picks.set(id, { id, qty, price });
  }
  const sold = ECON.sold[npc]?.w === w ? ECON.sold[npc].ids : {};
  return [...picks.values()].map(p => ({ ...p, qty: Math.max(0, p.qty - (sold[p.id] || 0)) }));
}
function offerFor(npc, id) {
  const m = MERCHANTS[npc], it = ITEMS[id]; if (!m || !it) return 0;
  const k = m.buys[it.kind]; if (!k) return 0;
  return Math.max(1, Math.floor(it.value * k));
}

/* ---------- the purse and satchel ---------- */
const ECON = Object.assign({ companion: 'dog', crowns: 25, inv: {}, placed: [], hats: ['cavalier', 'hood', 'cap'], seen: {}, sold: {}, dog: 'Pickle', found: 0, firstDay: Date.now() }, (window.WUD_BOOT || {}).save || {});
let saveTimer = 0;
function econChanged(note) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => BR({ type: 'save', state: ECON }), 400);
  BR({ type: 'econ', state: publicEcon(), note: note || null });
}
function publicEcon() {
  return { worn: ECON.worn || {}, companion: ECON.companion, crowns: ECON.crowns, inv: Object.entries(ECON.inv).filter(([, n]) => n > 0).map(([id, n]) => ({ id, n })), placed: ECON.placed, hats: ECON.hats, seen: ECON.seen, dog: ECON.dog, found: ECON.found };
}
function give(id, n = 1) {
  const it = ITEMS[id];
  if (it?.kind === 'hat') { if (!ECON.hats.includes(it.hat)) ECON.hats.push(it.hat); return; }
  ECON.inv[id] = (ECON.inv[id] || 0) + n;
}
function take(id, n = 1) { if ((ECON.inv[id] || 0) < n) return false; ECON.inv[id] -= n; if (!ECON.inv[id]) delete ECON.inv[id]; return true; }

function buy(npc, id) {
  const s = (stockFor(npc) || []).find(p => p.id === id);
  if (!s || s.qty < 1) return econChanged({ error: 'Sold out, m\'lord.' });
  if (ECON.crowns < s.price) return econChanged({ error: 'Not enough crowns.' });
  ECON.crowns -= s.price;
  const w = stockWindow();
  if (ECON.sold[npc]?.w !== w) ECON.sold[npc] = { w, ids: {} };
  ECON.sold[npc].ids[id] = (ECON.sold[npc].ids[id] || 0) + 1;
  const it = ITEMS[id];
  if (it.kind === 'hat') { if (!ECON.hats.includes(it.hat)) ECON.hats.push(it.hat); }
  else give(id);
  if (it.kind === 'furniture' && !ECON.placed.includes(id)) { ECON.placed.push(id); refreshHome(); }
  BR({ type: 'sfx', name: 'coin' }); BR({ type: 'haptic', style: 'success' });
  econChanged({ bought: id, npc, price: s.price });
  BR({ type: 'stock', npc, wares: stockFor(npc) });
}
function sell(npc, id) {
  const price = offerFor(npc, id);
  if (!price || !take(id)) return econChanged({ error: 'They won\'t take that.' });
  ECON.crowns += price;
  if (ITEMS[id].kind === 'furniture' && !(ECON.inv[id] > 0)) { ECON.placed = ECON.placed.filter(p => p !== id); refreshHome(); }
  if (ITEMS[id].slot && ECON.worn[ITEMS[id].slot] === id && !(ECON.inv[id] > 0)) { delete ECON.worn[ITEMS[id].slot]; redress(); }
  BR({ type: 'sfx', name: 'coin' }); BR({ type: 'haptic', style: 'light' });
  econChanged({ sold: id, npc, price });
}

/* ---------- using things ---------- */
const FX = { tipsy: 0, glow: 0 };
function useItem(id) {
  const it = ITEMS[id]; if (!it) return;
  if (typeof USE_MORE !== 'undefined' && USE_MORE[id]) return USE_MORE[id](it);
  if (it.kind === 'wear') return wear(it.slot, id);
  const p = G.player;
  if (it.kind === 'drink') {
    if (!take(id)) return;
    FX.tipsy = Math.min(60, FX.tipsy + (id === 'tea' ? -FX.tipsy : id === 'mead' ? 35 : 22));
    burst(p.x, p.y, 1.8, id === 'tea' ? [180, 220, 160] : [250, 230, 160], 6);
    BR({ type: 'sfx', name: 'chime' });
    return econChanged({ used: id, line: id === 'tea' ? 'Clear-headed again. Hilda would approve.' : FX.tipsy > 40 ? 'The cobbles have started to sway.' : 'Hic. Lovely stuff.' });
  }
  if (it.kind === 'food') {
    if (!take(id)) return;
    if (id === 'bone') { DOG.joy = 6; burstHearts(DOG.x, DOG.y, (DOG.z || 0) + .8); BR({ type: 'sfx', name: 'chime' }); return econChanged({ used: id, line: `${companionName()} is the happiest ${companionBeast() ? 'creature' : 'dog'} in Wudland.` }); }
    burstHearts(p.x, p.y, 1.9);
    BR({ type: 'sfx', name: 'chime' });
    return econChanged({ used: id, line: 'Delicious. Your cheeks go pink.' });
  }
  if (it.kind === 'magic' || it.kind === 'gem') {
    FX.glow = 20; burst(p.x, p.y, 1, it.pal.a, 14);
    BR({ type: 'sfx', name: 'spell' });
    return econChanged({ used: id, line: 'It hums in your hand. Better keep it, or sell it to someone who knows.' });
  }
}
function placeItem(id, on) {
  if (!ITEMS[id] || ITEMS[id].kind !== 'furniture' || !(ECON.inv[id] > 0)) return;
  ECON.placed = ECON.placed.filter(p => p !== id);
  if (on) ECON.placed.push(id);
  refreshHome();
  econChanged({ placed: id, on });
}
function refreshHome() { delete G.scenes.home; if (G.scene?.id === 'home') { const sc = getInterior('home'), p = G.player; G.scene = sc; Object.assign(p, { path: null }); G.actors = sc.npcs.map(n => makeActor(n, sc)); } }
function burst(x, y, z, c, n) { for (let k = 0; k < n; k++) emit({ scene: G.scene.id, x, y, z, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: 1 + Math.random() * 1.5, g: 3, life: .9, c: rgb(...c), glow: 1, over: true }); }
function burstHearts(x, y, z) { for (let k = 0; k < 3; k++) emit({ scene: G.scene.id, x: x + (Math.random() - .5) * .4, y: y + (Math.random() - .5) * .4, z, vx: 0, vy: 0, vz: .6 + k * .15, life: 1.4, c: rgb(236, 90, 110), over: true, size: 2 }); }

/* ---------- treasure lying about ---------- */
// what can turn up depends on the hour, the weather and the season; rarer finds are rarer
function findTable() {
  const w = G.weather, night = G.night > .5, season = seasonOf();
  const t = [['acorn', 10], ['feather', 8], ['button', 7], ['marble', 6], ['apple', 5], ['bone', 3], ['horseshoe', 4], ['key', 3], ['coin', 2], ['amber', 1.4], ['ruby', .35], ['jewel', .06], ['phoenix', .05]];
  if (/rain|drizzle|storm/.test(w)) t.push(['shroom', 8], ['rainbow', .8]);
  if (w === 'storm') t.push(['scale', .6]);
  if (w === 'snow' || season === 'winter') t.push(['snowflake', 7]);
  if (night) t.push(['stardust', 2.4], ['moonstone', 1.2]);
  if (season === 'autumn') t.push(['acorn', 8]);
  moreFinds(t, { wet: /rain|drizzle|storm/.test(w), storm: w === 'storm', snow: w === 'snow', clear: /clear|sunny/.test(w), night, season, luck: FX.luck > 0 });
  return t;
}
function roll(table) {
  const sum = table.reduce((s, [, w]) => s + w, 0); let r = Math.random() * sum;
  for (const [id, w] of table) if ((r -= w) <= 0) return id;
  return table[0][0];
}
const FINDS = [];
let findAcc = 0;
function stepFinds(dt) {
  const sc = G.scene;
  if (sc.id !== 'village') return;
  findAcc += dt;
  if ((FINDS.length < 7 && findAcc > 12) || FINDS.length < 3) {
    findAcc = 0;
    const pt = randomSpot(sc, 3, 26);
    if (pt) FINDS.push({ id: roll(findTable()), x: pt.x, y: pt.y, t: 0 });
  }
  const p = G.player;
  for (let k = FINDS.length - 1; k >= 0; k--) {
    const f = FINDS[k]; f.t += dt;
    if (Math.hypot(f.x - p.x, f.y - p.y) < .65) {
      FINDS.splice(k, 1);
      give(f.id); ECON.found++;
      const it = ITEMS[f.id];
      burst(f.x, f.y, .4, RARITY_COLOR[it.rarity], 8 + it.rarity * 4);
      BR({ type: 'sfx', name: it.rarity >= 2 ? 'chime' : 'coin' });
      BR({ type: 'haptic', style: it.rarity >= 2 ? 'success' : 'light' });
      showLabel(it.name, f.x, f.y, 1.2);
      econChanged({ found: f.id });
    } else if (f.t > 600) FINDS.splice(k, 1);
  }
}
function randomSpot(sc, minD, maxD) {
  const p = G.player;
  for (let n = 0; n < 40; n++) {
    const a = Math.random() * 6.283, d = minD + Math.random() * (maxD - minD), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    const [i, j] = navCell(sc.nav, x, y);
    if (navOk(sc.nav, i, j)) return { x, y };
  }
  return null;
}
function drawFinds() {
  if (G.scene.id !== 'village') return;
  for (const f of FINDS) {
    const it = ITEMS[f.id], c = it.ground || it.pal.a, bob = STILL ? 0 : Math.sin(f.t * 3) * .03;
    if (it.glow) sphereGlow(f.x, f.y, .14 + bob, .1, c);
    else sphere(f.x, f.y, .12 + bob, .11, c, 'gloss');
    // a twinkle in the rarity's colour, brighter for better things
    const tw = (f.t * (1.5 + it.rarity) + f.x) % 2.2;
    if (tw < .35) { const rc = rgb(...RARITY_COLOR[it.rarity]); plotGlow(f.x, f.y, .42 + tw * .3, rc); if (it.rarity >= 2) { plotGlow(f.x + .08, f.y - .08, .42 + tw * .3, rc); plotGlow(f.x - .08, f.y + .08, .42 + tw * .3, rc); } }
  }
}

/* ---------- magical creatures ---------- */
// when: a test on the moment. weight: how often, before rarity. Rarer beasts stay longer.
const BEASTS = {
  wisp: { name: 'Glimmerwisp', rarity: 0, when: m => m.night > .3, fly: .8, speed: .7, lore: 'A lost spark that follows warm windows.' },
  toad: { name: 'Puddle Toad', rarity: 0, when: m => m.wet, speed: 1.2, hop: true, lore: 'Sings only when it is raining. Badly.' },
  snail: { name: 'Mossback Snail', rarity: 0, when: m => !m.night && (m.wet || m.grey), speed: .12, lore: 'Carries a tiny garden on its shell.' },
  fae: { name: 'Thimble Fae', rarity: 1, when: m => !m.night && m.clear, fly: .8, speed: 1.1, lore: 'Steals buttons. Returns them polished.' },
  moth: { name: 'Lantern Moth', rarity: 1, when: m => m.night > .4, fly: 1, speed: 1, lore: 'Its belly glows the colour of candlelight.' },
  shroomkin: { name: 'Mushroom Sprite', rarity: 1, when: m => m.wet || m.grey || m.season === 'autumn', speed: .5, lore: 'Walks very seriously. Nobody knows where to.' },
  sheep: { name: 'Cloud Sheep', rarity: 2, when: m => m.grey || m.wet, fly: 2, speed: .35, lore: 'Grazes on fog. Rains a little when sheared.' },
  newt: { name: 'Ember Newt', rarity: 2, when: m => !m.wet, speed: .9, lore: 'Lives in the forge coals. Hates puddles.' },
  hare: { name: 'Frost Hare', rarity: 2, when: m => m.snow || m.season === 'winter', speed: 2, hop: true, lore: 'Leaves frost flowers where it sits.' },
  stag: { name: 'Moon Stag', rarity: 3, size: 1.25, when: m => m.night > .6 && m.clear, speed: .6, lore: 'Seen only under a clear moon. Do not follow it.' },
  wyrm: { name: 'Storm Wyrmling', rarity: 3, when: m => m.storm || (m.wet && m.night > .5), fly: 1.6, speed: 1.6, lore: 'A baby dragon that rides the thunder home.' },
  fox: { name: 'Nine-Star Fox', rarity: 4, when: m => m.night > .7, speed: 1.1, lore: 'Each tail is a star that fell. It has nine.' },
  soot: { name: 'Soot Puff', rarity: 0, when: m => !m.wet, speed: 1.4, hop: true, lore: 'Lives in chimneys. Sneezes when startled.' },
  hedgehog: { name: 'Bramble Hog', rarity: 0, when: m => !m.night && m.season !== 'winter', speed: .6, lore: 'Carries one berry on its spines at all times.' },
  butterfly: { name: 'Glass Butterfly', rarity: 1, when: m => !m.night && !m.wet && m.season !== 'winter', fly: 1, speed: 1, lore: 'Its wings are so clear you see the sky through them.' },
  imp: { name: 'Pumpkin Imp', rarity: 1, when: m => m.season === 'autumn' && m.night > .2, speed: 1.3, hop: true, lore: 'Carves its own grin every October. Giggles.' },
  koi: { name: 'Sky Koi', rarity: 2, when: m => m.wet || m.grey, fly: 1.4, speed: .8, lore: 'Swims through the air whenever it is damp enough.' },
  lantern: { name: "Will-o'-Lantern", rarity: 2, when: m => m.night > .5 && (m.grey || m.wet), fly: 1.1, speed: .5, lore: 'Leads lost walkers home. Mostly.' },
  frog: { name: 'The Frog Prince', rarity: 2, when: m => m.wet && !m.night, speed: 1, hop: true, lore: 'Insists he is royalty. Has the crown to prove it.' },
  ram: { name: 'Thunder Ram', rarity: 3, when: m => m.storm || (m.wet && m.grey), speed: .9, lore: 'Its horns crackle. Do not headbutt it back.' },
  ghost: { name: 'The Pale Knight', rarity: 3, when: m => m.night > .6 && (m.season === 'autumn' || m.grey), speed: .5, lore: 'Patrols the village every night since the old war. Very polite.' },
  mimic: { name: 'Mimic Chest', rarity: 3, when: () => true, speed: .8, hop: true, lore: 'Looks like treasure. Is treasure, in a sense. Bites.' },
  teacup: { name: 'Teacup Dragon', rarity: 4, when: m => !m.night, speed: .7, lore: 'Sleeps in a teacup. Breathes steam, not fire.' },
  whale: { name: 'Celestial Whale', rarity: 4, when: m => m.night > .7 && !m.wet, fly: 3.4, speed: .45, size: 1.3, lore: 'Swims between the stars. Sings in a key only owls can hear.' },
  goose: { name: 'The Golden Goose', rarity: 4, when: m => !m.night, speed: .7, lore: 'Lays one golden egg, then vanishes for a year.' },
};

/* bestiary pictures: rows of palette letters, like the item icons */
const BEAST_ICONS = {
  wisp: [{ a: [170, 220, 255], b: [240, 250, 255], c: [120, 170, 240] }, ['........', '....aa..', '...abba.', '...abba.', '.c..aa..', 'c.c.....', '.c......']],
  toad: [{ a: [90, 140, 120], b: [110, 170, 140], c: [250, 230, 120], d: [60, 100, 85] }, ['.bb..bb.', 'bcbaabcb', '.aaaaaa.', 'aaaaaaaa', 'aaaaaaaa', '.d.dd.d.']],
  snail: [{ a: [150, 110, 80], b: [110, 160, 80], c: [200, 180, 140], d: [236, 150, 180] }, ['....db..', '...bbbb.', '..aaaaaa', 'c.aabbaa', 'cc.aaaa.', 'cccccccc']],
  fae: [{ a: [150, 220, 160], b: [220, 240, 255], c: [250, 236, 150], d: [240, 200, 170] }, ['...cc...', '...dd...', 'bb.aa.bb', 'bbbaabbb', '.b.aa.b.', '...a.a..']],
  moth: [{ a: [210, 190, 140], b: [120, 90, 60], c: [255, 230, 140] }, ['.c....c.', '..c..c..', 'aa.bb.aa', 'aaabbaaa', 'aacbbcaa', '.a.bb.a.', '...bb...']],
  shroomkin: [{ a: [200, 60, 60], b: [250, 240, 230], c: [240, 226, 200], d: [40, 30, 30] }, ['..aaaa..', '.abaaba.', 'aaaaaaaa', '...cc...', '.cdccdc.', '..cccc..', '..c..c..']],
  sheep: [{ a: [240, 240, 250], b: [90, 90, 110], c: [120, 170, 240] }, ['.aa.aa..', 'aaaaaaa.', 'aaaaaabb', 'aaaaaabb', '.aaaaa..', '.c.c.c..', 'c.c.c...']],
  newt: [{ a: [230, 110, 50], b: [255, 200, 80], c: [40, 30, 30] }, ['.....aac', 'a...aaaa', '.aabaab.', '..aaaa..', '..a..a..']],
  hare: [{ a: [240, 244, 250], b: [236, 180, 190], c: [60, 60, 90], d: [170, 220, 255] }, ['.ab.....', '.ab.....', '.aaa....', '.acaaaa.', '..aaaaaa', '..aaaaaa', '.d.a..a.']],
  stag: [{ a: [200, 210, 240], b: [240, 240, 255], c: [255, 250, 200] }, ['b.b.b...', '.bbb....', '..aa....', '.caa....', '..aaaaaa', '..aaaaaa', '..a...a.', '..a...a.']],
  wyrm: [{ a: [80, 100, 170], b: [150, 200, 255], c: [255, 240, 120] }, ['....c...', '.aa..cc.', 'acab..c.', '.aaabb..', '..aaaa.a', '...aaaa.']],
  fox: [{ a: [240, 140, 60], b: [250, 240, 230], c: [255, 236, 150], d: [40, 30, 30] }, ['c......c', 'a.a...a.', 'aaa..aa.', 'adaa.aac', 'baaaaaa.', '.aaaaaaa', '.b.b.b.a']],
  goose: [{ a: [240, 200, 70], b: [230, 120, 40], c: [40, 30, 30] }, ['..aa....', '.aca....', 'bba.....', '..a.....', '..aaaaa.', '.aaaaaaa', '..aaaaa.', '...b.b..']],
  soot: [{ a: [40, 36, 44], b: [250, 250, 250] }, ['.a.aa.a.', 'aaaaaaaa', 'aabaabaa', 'aaaaaaaa', '.aaaaaa.', 'a.a..a.a']],
  hedgehog: [{ a: [80, 56, 40], b: [150, 110, 80], c: [210, 180, 150], d: [200, 40, 60] }, ['...d....', '.aaaa...', 'aaaaaa..', 'aaaaaac.', 'abbbbccc', '.b..b...']],
  butterfly: [{ a: [160, 210, 250], b: [200, 240, 255], c: [60, 60, 80] }, ['.c...c.', '..c.c..', 'aab.baa', 'aaacaaa', '.abcba.', '.aacaa.', '..a.a..']],
  imp: [{ a: [230, 120, 40], b: [90, 120, 50], c: [255, 220, 90] }, ['...bb...', '..b.....', '.aaaaaa.', 'aacaacaa', 'aaaaaaaa', 'aacccaaa', '.aaaaaa.']],
  koi: [{ a: [236, 120, 60], b: [250, 246, 240], c: [30, 30, 30] }, ['...ba...', '.abbaa.a', 'acbaaaaa', '.aaaab.a', '...aa...']],
  lantern: [{ a: [60, 50, 50], b: [150, 240, 200], c: [220, 255, 240] }, ['...a...', '..aaa..', '.aaaaa.', '.abcba.', '.abbba.', '.aaaaa.', '...b...']],
  frog: [{ a: [90, 160, 80], b: [240, 200, 70], c: [30, 30, 30], d: [130, 190, 100] }, ['.b.b.b.', '.bbbbb.', 'dcdadcd', 'aaaaaaa', 'aaaaaaa', '.a...a.']],
  ram: [{ a: [200, 200, 210], b: [80, 80, 90], c: [150, 200, 255] }, ['.c......', 'bbb.....', 'b.bb....', '.bbaaaa.', '.baaaaaa', '..aaaaaa', '...b..b.', '..cb..b.']],
  ghost: [{ a: [190, 210, 235], b: [150, 170, 200], c: [140, 200, 255], d: [40, 50, 80] }, ['...c...', '..bbb..', '.bbbbb.', '.bdddb.', '.bbbbb.', 'aaaaaaa', '.aaaaa.', '.a.a.a.']],
  mimic: [{ a: [150, 100, 56], b: [220, 170, 80], c: [250, 250, 240], d: [200, 60, 80], e: [60, 30, 20] }, ['.aaaaaa.', 'aaaaaaaa', 'bbbbbbbb', 'ecececec', 'edddddde', 'bbbbbbbb', 'aaabbaaa', 'aaaaaaaa']],
  teacup: [{ a: [240, 236, 230], b: [150, 100, 200], c: [220, 220, 240], d: [200, 160, 240] }, ['...c....', '..c.bb..', '..dbbb..', '...bbd..', 'aaaaaa..', 'aaaaaaaa', 'aaaaaa.a', '.aaaa.a.', '..aa....']],
  whale: [{ a: [90, 110, 180], b: [170, 190, 230], c: [255, 250, 200] }, ['.c..c..c..', '.......a.a', '.aaaaa..a.', 'aacaaaaaa.', 'abbbbbaa..', '.bbbb.....']],
};
const RARITY_WEIGHT = [60, 26, 10, 3.2, .7];
const CREATURES = [];
let beastAcc = 6;
function moment() {
  const w = G.weather;
  return { night: G.night, wet: /rain|drizzle|storm/.test(w), storm: w === 'storm', snow: w === 'snow', grey: /overcast|cloud|fog/.test(w), clear: w === 'clear' || w === 'sunny' || w === 'mainly clear', season: seasonOf() };
}
function stepCreatures(dt) {
  const sc = G.scene;
  if (sc.id !== 'village') { CREATURES.length = 0; return; }
  beastAcc += dt;
  const m = moment();
  if (beastAcc > 14 && CREATURES.length < 5) {
    beastAcc = Math.random() * 4;
    const table = Object.entries(BEASTS).filter(([, b]) => b.when(m)).map(([id, b]) => [id, RARITY_WEIGHT[b.rarity]]);
    if (table.length) {
      const id = roll(table), b = BEASTS[id], pt = randomSpot(sc, 4, 20);
      if (pt) CREATURES.push({ id, x: pt.x, y: pt.y, z: b.fly || 0, yaw: Math.random() * 6.28, t: 0, life: 70 + b.rarity * 40 + Math.random() * 40, path: null, wait: 0, walk: 0, moving: 0, seed: Math.random() * 10 });
    }
  }
  for (let k = CREATURES.length - 1; k >= 0; k--) {
    const c = CREATURES[k], b = BEASTS[c.id];
    c.t += dt;
    if (c.t > c.life || !b.when(m) && c.t > 20) { if ((c.fade = (c.fade || 0) + dt) > 1.2) { CREATURES.splice(k, 1); continue; } }
    if (c.goose && c.t > c.eggAt && !c.laid) { c.laid = true; FINDS.push({ id: 'eggold', x: c.x, y: c.y, t: 0 }); }
    if (b.fly) {
      c.yaw += Math.sin(c.t * .7 + c.seed) * dt * 1.4;
      const nx = c.x + Math.cos(c.yaw) * b.speed * dt, ny = c.y + Math.sin(c.yaw) * b.speed * dt, [i, j] = navCell(sc.nav, nx, ny);
      if (i >= 0 && j >= 0 && i < sc.nav.nx && j < sc.nav.ny) { c.x = nx; c.y = ny; } else c.yaw += Math.PI * .7;
      c.z = b.fly + Math.sin(c.t * 1.6 + c.seed) * .25;
    } else {
      if (!c.path) {
        c.wait -= dt;
        if (c.wait <= 0) { const a = Math.random() * 6.28, d = 1 + Math.random() * 3.5; walkTo(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, () => { c.wait = 1 + Math.random() * 4; }, c); if (!c.path) c.wait = 1.5; }
      }
      stepWalker(c, dt, b.speed);
    }
  }
}
function drawCreatures() {
  for (const c of CREATURES) {
    if (c.fade && Math.floor(c.fade * 12) % 2) continue;   // shimmer out of the world
    drawBeast(c);
  }
}
function drawBeast(c) {
  // beasts are modelled small and drawn bigger, scaled about the spot beneath them
  const S = BEASTS[c.id].size || 1.5, T3 = q => [c.x + (q[0] - c.x) * S, c.y + (q[1] - c.y) * S, q[2] * S];
  const add = (a, b, r0, r1, f) => dynamicAdd(T3(a), T3(b), r0 * S, r1 * S, f);
  const glow = (x, y, z, col) => plotGlow(...T3([x, y, z]), col), sglow = (x, y, z, r, col) => sphereGlow(...T3([x, y, z]), r * S, col);
  const face = (h, fx, fy, sx, sy, k, look, pose) => window.face(T3(h), fx, fy, sx, sy, k * S, look, pose);
  const C = col => () => col, t = c.t, fx = Math.cos(c.yaw), fy = Math.sin(c.yaw), sx = -fy, sy = fx;
  const hop = BEASTS[c.id].hop ? Math.abs(Math.sin(c.walk * 1.2)) * .25 * c.moving : 0;
  const P = (a, b, z) => [c.x + fx * a + sx * b, c.y + fy * a + sy * b, z];
  if (typeof BEAST_DRAW !== 'undefined' && BEAST_DRAW[c.id]) return BEAST_DRAW[c.id]({ c, add, glow, sglow, face, C, P, t, hop, fx, fy, sx, sy });
  switch (c.id) {
    case 'wisp': {
      sglow(c.x, c.y, c.z, .1 + Math.sin(t * 6) * .02, [210, 240, 255]);
      for (let k = 1; k < 5; k++) glow(c.x - fx * k * .12, c.y - fy * k * .12, c.z - k * .03 + Math.sin(t * 5 + k) * .04, k % 2 ? rgb(170, 220, 255) : rgb(120, 170, 240));
      break;
    }
    case 'toad': {
      const z = hop;
      add(P(0, 0, z + .14), P(-.06, 0, z + .16), .17, .15, C([90, 140, 120]));
      for (const s of [-1, 1]) { const e = P(.08, s * .08, z + .3); add(e, e, .06, .06, C([110, 170, 140])); glow(e[0] + fx * .04, e[1] + fy * .04, e[2] + .02, rgb(250, 230, 120)); }
      break;
    }
    case 'snail': {
      add(P(.12, 0, .06), P(-.18, 0, .05), .07, .06, C([200, 180, 140]));
      add(P(-.05, 0, .2), P(-.05, 0, .2), .15, .15, C([150, 110, 80]));
      add(P(-.05, 0, .34), P(-.05, 0, .34), .07, .07, C([110, 160, 80]));
      glow(...P(-.02, .04, .4), rgb(236, 150, 180));
      break;
    }
    case 'fae': {
      const z = c.z, flap = Math.sin(t * 30) > 0;
      add([c.x, c.y, z], [c.x, c.y, z + .14], .05, .04, C([150, 220, 160]));
      add([c.x, c.y, z + .22], [c.x, c.y, z + .22], .06, .06, C([238, 210, 180]));
      for (const s of [-1, 1]) for (let k = 1; k < 4; k++) glow(c.x + sx * s * k * .06, c.y + sy * s * k * .06, z + .14 + (flap ? k * .05 : -k * .02), rgb(220, 250, 240));
      if (Math.random() < .15) emit({ scene: G.scene.id, x: c.x, y: c.y, z, vx: 0, vy: 0, vz: -.3, life: .6, c: rgb(250, 240, 180), glow: 1, over: true });
      break;
    }
    case 'moth': {
      const z = c.z, flap = Math.sin(t * 22);
      add([c.x, c.y, z], [c.x - fx * .1, c.y - fy * .1, z], .045, .035, C([140, 120, 100]));
      sglow(c.x - fx * .14, c.y - fy * .14, z, .05, [255, 210, 120]);
      for (const s of [-1, 1]) add([c.x + sx * s * .06, c.y + sy * s * .06, z], [c.x + sx * s * .16, c.y + sy * s * .16, z + flap * .08], .05, .03, C([200, 180, 150]));
      break;
    }
    case 'shroomkin': {
      const step = Math.sin(c.walk) * .05 * c.moving;
      for (const s of [-1, 1]) add(P(step * s, s * .06, .02), P(0, s * .06, .12), .04, .04, C([236, 226, 200]));
      add(P(0, 0, .12), P(0, 0, .26), .08, .08, C([236, 226, 200]));
      add(P(0, 0, .34), P(0, 0, .34), .2, .2, C([200, 60, 50]));
      for (const [a, b2] of [[.06, .08], [-.08, .04], [.02, -.1]]) glow(...P(a, b2, .5), rgb(250, 246, 236));
      face([c.x, c.y, .26], fx, fy, sx, sy, .5, { blush: true }, { t });
      break;
    }
    case 'sheep': {
      const z = c.z;
      for (const [a, b2, zz] of [[0, 0, 0], [.15, .1, .05], [-.15, -.08, .03], [.05, -.15, .08], [-.05, .15, .06]]) add(P(a, b2, z + zz), P(a, b2, z + zz), .2, .2, C([248, 248, 252]));
      add(P(.3, 0, z), P(.3, 0, z), .1, .1, C([60, 60, 70]));
      if (Math.random() < .1) emit({ scene: G.scene.id, x: c.x + (Math.random() - .5) * .4, y: c.y + (Math.random() - .5) * .4, z: z - .2, vx: 0, vy: 0, vz: -2, life: .7, c: rgb(170, 200, 230), over: true });
      break;
    }
    case 'newt': {
      const wig = Math.sin(c.walk * 2) * .05 * c.moving;
      add(P(.18, wig, .06), P(-.1, -wig, .06), .07, .06, C([220, 100, 40]));
      add(P(-.1, -wig, .05), P(-.32, wig, .04), .05, .02, C([200, 80, 40]));
      for (const a of [.12, 0, -.12]) glow(...P(a, 0, .13), rgb(255, 200, 80));
      if (Math.random() < .08) emit({ scene: G.scene.id, x: c.x, y: c.y, z: .15, vx: 0, vy: 0, vz: .6, life: .5, c: rgb(255, 170, 60), glow: 1, over: true });
      break;
    }
    case 'hare': {
      const z = hop;
      add(P(-.08, 0, z + .14), P(.06, 0, z + .16), .14, .12, C([244, 246, 250]));
      const h = P(.16, 0, z + .28); add(h, h, .09, .09, C([244, 246, 250]));
      for (const s of [-1, 1]) add(P(.12, s * .04, z + .34), P(.06, s * .06, z + .52), .035, .025, C([236, 240, 248]));
      break;
    }
    case 'stag': {
      const ghost = [196, 220, 255], step = Math.sin(c.walk) * .12 * c.moving;
      for (const [a, s] of [[.25, -1], [.25, 1], [-.25, -1], [-.25, 1]]) add(P(a + step * s, s * .1, 0), P(a, s * .1, .55), .05, .045, C(ghost));
      add(P(.3, 0, .7), P(-.3, 0, .68), .2, .18, C(ghost));
      const h = P(.5, 0, 1.05); add(P(.35, 0, .78), h, .1, .09, C(ghost)); add(h, P(.66, 0, 1.0), .1, .07, C(ghost));
      for (const s of [-1, 1]) for (let k = 0; k < 5; k++) glow(h[0] + sx * s * (.08 + k * .05) - fx * k * .03, h[1] + sy * s * (.08 + k * .05) - fy * k * .03, h[2] + .12 + k * .07 + (k === 3 ? .05 : 0), rgb(220, 236, 255));
      if (Math.random() < .3) emit({ scene: G.scene.id, x: c.x + (Math.random() - .5) * .6, y: c.y + (Math.random() - .5) * .6, z: Math.random() * .9, vx: 0, vy: 0, vz: .3, life: 1.2, c: rgb(200, 220, 255), glow: 1, over: true });
      break;
    }
    case 'wyrm': {
      const z = c.z, flap = Math.sin(t * 9);
      add(P(.2, 0, z + .05), P(-.25, 0, z), .1, .08, C([80, 170, 120]));
      add(P(-.25, 0, z), P(-.5, 0, z - .08), .06, .02, C([60, 140, 100]));
      const h = P(.32, 0, z + .12); add(h, h, .09, .09, C([90, 180, 130]));
      for (const s of [-1, 1]) add(P(0, s * .08, z + .08), P(-.05, s * .42, z + .1 + flap * .2), .05, .02, C([140, 210, 160]));
      glow(h[0] + fx * .07, h[1] + fy * .07, h[2] + .03, rgb(255, 230, 90));
      if (Math.random() < .04) for (let k = 0; k < 4; k++) emit({ scene: G.scene.id, x: h[0], y: h[1], z: h[2], vx: fx * 2 + (Math.random() - .5), vy: fy * 2 + (Math.random() - .5), vz: 0, life: .4, c: rgb(255, 160, 60), glow: 1, over: true });
      break;
    }
    case 'fox': {
      const step = Math.sin(c.walk) * .08 * c.moving, gold = [236, 160, 70];
      for (const [a, s] of [[.14, -1], [.14, 1], [-.14, -1], [-.14, 1]]) add(P(a + step * s, s * .07, 0), P(a, s * .07, .2), .04, .035, C([90, 60, 50]));
      add(P(.18, 0, .28), P(-.16, 0, .27), .12, .11, C(gold));
      const h = P(.3, 0, .42); add(h, h, .1, .1, C(gold));
      for (const s of [-1, 1]) add(P(.28, s * .05, .5), P(.26, s * .07, .6), .035, .015, C(gold));
      for (let k = 0; k < 9; k++) { const a = (k - 4) * .22 + Math.sin(t * 2 + k) * .08; glow(c.x - fx * .45 + sx * Math.sin(a) * .35, c.y - fy * .45 + sy * Math.sin(a) * .35, .35 + Math.cos(a) * .3, k % 2 ? rgb(255, 240, 170) : rgb(200, 220, 255)); }
      break;
    }
    case 'soot': {
      const z = hop;
      for (let k = 0; k < 6; k++) { const a = k * 1.05 + t * 2; add([c.x + Math.cos(a) * .06, c.y + Math.sin(a) * .06, z + .14], [c.x + Math.cos(a) * .06, c.y + Math.sin(a) * .06, z + .14], .12, .12, C([40, 36, 44])); }
      for (const s2 of [-1, 1]) glow(...P(.13, s2 * .05, z + .18), rgb(250, 250, 250));
      break;
    }
    case 'hedgehog': {
      add(P(-.05, 0, .12), P(.08, 0, .1), .14, .11, C([120, 84, 60]));
      add(P(.17, 0, .08), P(.22, 0, .07), .06, .04, C([210, 180, 150]));
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI; glow(...P(-.05 + Math.cos(a) * .12, (k % 3 - 1) * .07, .14 + Math.sin(a) * .12), rgb(80, 56, 40)); }
      add(P(-.04, 0, .3), P(-.04, 0, .3), .05, .05, C([200, 40, 60]));
      break;
    }
    case 'butterfly': {
      const z = c.z, flap = Math.abs(Math.sin(t * 14));
      add([c.x, c.y, z], [c.x - fx * .1, c.y - fy * .1, z], .025, .02, C([60, 60, 80]));
      for (const s2 of [-1, 1]) for (let k = 1; k < 4; k++) for (let j = 0; j < 2; j++)
        glow(c.x + sx * s2 * k * .05 * flap - fx * j * .05, c.y + sy * s2 * k * .05 * flap - fy * j * .05, z + k * .04 * (1 - flap) + .02, j ? rgb(200, 240, 255) : rgb(160, 210, 250));
      break;
    }
    case 'imp': {
      const z = hop;
      add([c.x, c.y, z + .2], [c.x, c.y, z + .2], .2, .2, C([230, 120, 40]));
      add([c.x, c.y, z + .4], [c.x, c.y, z + .46], .03, .02, C([90, 120, 50]));
      const flick = Math.sin(t * 13) > -.6 ? rgb(255, 220, 90) : rgb(255, 160, 50);
      for (const s2 of [-1, 1]) glow(...P(.19, s2 * .07, z + .26), flick);
      for (const b2 of [-.07, 0, .07]) glow(...P(.19, b2, z + .13 + Math.abs(b2) * .5), flick);
      break;
    }
    case 'koi': {
      const z = c.z, sw = Math.sin(t * 5) * .08;
      add(P(.2, 0, z), P(-.15, sw * .5, z), .1, .07, () => [236, 120, 60]);
      add(P(.05, .02, z + .07), P(-.05, 0, z + .07), .05, .04, C([250, 246, 240]));
      for (const s2 of [-1, 1]) add(P(-.18, sw, z), P(-.36, sw * 2 + s2 * .1, z + s2 * .05), .04, .02, C([250, 160, 100]));
      glow(...P(.27, .05, z + .03), rgb(30, 30, 30));
      if (Math.random() < .1) emit({ scene: G.scene.id, x: c.x, y: c.y, z: z + .2, vx: 0, vy: 0, vz: .5, life: .8, c: rgb(200, 230, 250), over: true });
      break;
    }
    case 'lantern': {
      const z = c.z;
      add([c.x, c.y, z + .28], [c.x, c.y, z + .4], .015, .015, C([60, 50, 50]));
      add([c.x, c.y, z + .22], [c.x, c.y, z + .26], .1, .06, C([60, 50, 50]));
      sglow(c.x, c.y, z + .08, .11 + Math.sin(t * 9) * .015, [150, 240, 200]);
      add([c.x, c.y, z - .06], [c.x, c.y, z - .04], .1, .1, C([60, 50, 50]));
      if (Math.random() < .2) emit({ scene: G.scene.id, x: c.x, y: c.y, z: z, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: -.2, life: 1, c: rgb(150, 240, 200), glow: 1, over: true });
      break;
    }
    case 'frog': {
      const z = hop;
      add(P(0, 0, z + .14), P(-.06, 0, z + .16), .17, .15, C([90, 160, 80]));
      for (const s2 of [-1, 1]) { const e = P(.08, s2 * .08, z + .3); add(e, e, .06, .06, C([110, 180, 90])); }
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; add([c.x + Math.cos(a) * .08, c.y + Math.sin(a) * .08, z + .32], [c.x + Math.cos(a) * .08, c.y + Math.sin(a) * .08, z + .42], .025, .015, C([240, 200, 70])); }
      break;
    }
    case 'ram': {
      const wool = [200, 200, 210], step = Math.sin(c.walk) * .08 * c.moving;
      for (const [a, s2] of [[.16, -1], [.16, 1], [-.16, -1], [-.16, 1]]) add(P(a + step * s2, s2 * .09, 0), P(a, s2 * .09, .25), .045, .04, C([60, 60, 70]));
      for (const [a, b2] of [[.1, 0], [-.1, .05], [0, -.06], [-.12, -.05]]) add(P(a, b2, .38), P(a, b2, .38), .17, .17, C(wool));
      const h = P(.3, 0, .48); add(h, h, .1, .1, C([80, 80, 90]));
      for (const s2 of [-1, 1]) for (let k = 0; k < 7; k++) { const a = k / 7 * 5; glow(h[0] + sx * s2 * (.1 + Math.cos(a) * .07) - fx * Math.sin(a) * .07, h[1] + sy * s2 * (.1 + Math.cos(a) * .07) - fy * Math.sin(a) * .07, h[2] + .04 + Math.sin(a) * .07, (t * 6 + k) % 4 < 1 ? rgb(230, 240, 255) : rgb(120, 170, 255)); }
      if (Math.random() < .05) emit({ scene: G.scene.id, x: h[0], y: h[1], z: h[2] + .2, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: 1, life: .25, c: rgb(200, 230, 255), glow: 1, over: true });
      break;
    }
    case 'ghost': {
      const pale = [190, 210, 235];
      const look = { skin: [200, 220, 240], hair: pale, shirt: pale, sleeve: pale, legs: [150, 170, 200], hat: 'helmet', plume: [140, 200, 255], cape: [120, 150, 200], shoes: [150, 170, 200] };
      person(c.x, c.y, c.yaw, { walk: c.walk, moving: c.moving * .3, t, z: .15 + Math.sin(t * 2) * .05 }, look);
      if (Math.random() < .25) emit({ scene: G.scene.id, x: c.x + (Math.random() - .5) * .5, y: c.y + (Math.random() - .5) * .5, z: Math.random() * .4, vx: 0, vy: 0, vz: .4, life: 1, c: rgb(190, 220, 255), glow: 1, over: true });
      break;
    }
    case 'mimic': {
      const z = hop, gape = Math.max(0, Math.sin(t * 3)) * .12;
      add(P(0, 0, z + .12), P(0, 0, z + .12), .2, .2, C([140, 90, 50]));
      add(P(-.03, 0, z + .28 + gape), P(-.03, 0, z + .3 + gape), .19, .17, C([150, 100, 56]));
      add(P(0, 0, z + .24), P(0, 0, z + .24), .21, .21, C([220, 170, 80]));
      if (gape > .05) { for (const b2 of [-.1, -.03, .04, .11]) glow(...P(.18, b2, z + .26 + gape * .4), rgb(250, 250, 240)); glow(...P(.16, 0, z + .25), rgb(200, 60, 80)); }
      break;
    }
    case 'teacup': {
      add([c.x, c.y, .08], [c.x, c.y, .2], .17, .2, C([240, 236, 230]));
      add([c.x + sx * .22, c.y + sy * .22, .16], [c.x + sx * .22, c.y + sy * .22, .16], .06, .06, C([240, 236, 230]));
      add([c.x, c.y, .22], [c.x, c.y, .22], .15, .15, C([140, 90, 180]));
      const h = P(.06, 0, .38 + Math.sin(t * 2) * .02); add(P(0, 0, .26), h, .07, .06, C([150, 100, 200])); add(h, h, .08, .08, C([160, 110, 210]));
      for (const s2 of [-1, 1]) add(P(-.02, s2 * .08, .32), P(-.08, s2 * .2, .42 + Math.sin(t * 6) * .05), .04, .015, C([200, 160, 240]));
      if (Math.random() < .12) emit({ scene: G.scene.id, x: h[0] + fx * .1, y: h[1] + fy * .1, z: h[2], vx: fx * .3, vy: fy * .3, vz: .5, life: 1, c: rgb(240, 240, 250), over: true, size: 2 });
      break;
    }
    case 'whale': {
      const z = c.z, sw = Math.sin(t * 1.4) * .1, body = [90, 110, 180];
      add(P(.5, 0, z), P(-.4, sw, z + .05), .32, .2, C(body));
      add(P(.35, 0, z - .18), P(-.2, 0, z - .14), .16, .12, C([170, 190, 230]));
      add(P(-.4, sw, z + .05), P(-.75, sw * 2, z + .15), .12, .04, C(body));
      for (const s2 of [-1, 1]) add(P(-.75, sw * 2, z + .15), P(-.85, sw * 2 + s2 * .25, z + .22), .06, .02, C(body));
      for (const s2 of [-1, 1]) add(P(.15, s2 * .25, z - .1), P(0, s2 * .5, z - .2), .07, .02, C(body));
      for (let k = 0; k < 6; k++) glow(...P(.6 - k * .2, (k % 2 - .5) * .2, z + .3), (t * 3 + k) % 3 < 1.5 ? rgb(255, 250, 200) : rgb(180, 200, 255));
      if (Math.random() < .3) emit({ scene: G.scene.id, x: c.x + (Math.random() - .5) * 2, y: c.y + (Math.random() - .5) * 2, z: z * 1.3, vx: 0, vy: 0, vz: -.2, life: 1.6, c: rgb(255, 250, 220), glow: 1, over: true });
      break;
    }
    case 'goose': {
      if (!c.goose) { c.goose = true; c.eggAt = 25 + Math.random() * 30; }
      const g = [244, 200, 70], step = Math.sin(c.walk) * .05 * c.moving;
      for (const s of [-1, 1]) add(P(step * s, s * .07, 0), P(0, s * .07, .14), .03, .03, C([236, 150, 50]));
      add(P(.08, 0, .26), P(-.16, 0, .28), .17, .14, C(g));
      add(P(.16, 0, .32), P(.24, 0, .58), .06, .05, C(g));
      const h = P(.26, 0, .62); add(h, h, .08, .08, C(g)); add(P(.33, 0, .6), P(.4, 0, .59), .03, .02, C([236, 150, 50]));
      if (Math.random() < .2) glow(c.x + (Math.random() - .5) * .5, c.y + (Math.random() - .5) * .5, Math.random() * .7, rgb(255, 240, 160));
      break;
    }
  }
}
function tapCreature(sx, sy) {
  const sc = G.scene;
  for (const c of CREATURES) {
    const [hx, hy] = sceneProject(sc, c.x, c.y, (c.z || 0) + .3);
    if (Math.hypot(sx - hx, sy - hy) < 9 * sc.S / 14) {
      const b = BEASTS[c.id], first = !ECON.seen[c.id];
      ECON.seen[c.id] = (ECON.seen[c.id] || 0) + 1;
      showLabel(`${b.name} · ${RARITY[b.rarity]}`, c.x, c.y, (c.z || 0) + .9);
      BR({ type: 'sfx', name: b.rarity >= 3 ? 'spell' : 'chime' }); BR({ type: 'haptic', style: b.rarity >= 2 ? 'success' : 'light' });
      if (!c.fly) { c.path = null; c.wait = 2; }
      econChanged({ creature: c.id, first });
      return true;
    }
  }
  return false;
}

/* ---------- the companion: the dog, or any beast he has met ---------- */
const DOG = { x: 0, y: 0, yaw: 0, walk: 0, moving: 0, t: 0, joy: 0, seed: 3 };
const companionBeast = () => ECON.companion !== 'dog' && BEASTS[ECON.companion] && ECON.seen[ECON.companion] ? ECON.companion : null;
function companionName() { const b = companionBeast(); return b ? BEASTS[b].name : ECON.dog; }
function dogArrive() { const p = G.player; DOG.x = p.x - Math.cos(p.yaw) * 1.1 + .3; DOG.y = p.y - Math.sin(p.yaw) * 1.1 - .3; DOG.path = null; }
function stepDog(dt) {
  const p = G.player, d = Math.hypot(p.x - DOG.x, p.y - DOG.y), beast = companionBeast(), fly = beast ? BEASTS[beast].fly || 0 : 0;
  DOG.t += dt; DOG.joy = Math.max(0, DOG.joy - dt);
  DOG.z = fly ? Math.min(fly, G.scene.id === 'village' ? fly : 1.6) + Math.sin(DOG.t * 1.6) * .15 : 0;
  if (d > 8) dogArrive();
  if (DOG.joy > 0) { DOG.yaw += dt * 9; DOG.moving = .6; DOG.walk += dt * 10; return; }
  const keep = beast && (BEASTS[beast].size || 1) > 1.2 ? 2.2 : 1.5;
  if (d > keep) {
    const a = Math.atan2(p.y - DOG.y, p.x - DOG.x), sp = Math.min(4.6, 1.6 + d * 1.1), nx = DOG.x + Math.cos(a) * sp * dt, ny = DOG.y + Math.sin(a) * sp * dt;
    const nav = G.scene.nav, [i, j] = navCell(nav, nx, ny);
    if (fly || navOk(nav, i, j) || d > 3.5) { DOG.x = nx; DOG.y = ny; }
    DOG.yaw = turnToward(DOG.yaw, a, dt * 10);
    DOG.moving = Math.min(1, DOG.moving + dt * 6); DOG.walk += dt * sp * 4;
  } else {
    DOG.moving = Math.max(0, DOG.moving - dt * 5);
    if (!p.moving) DOG.yaw = turnToward(DOG.yaw, Math.atan2(p.y - DOG.y, p.x - DOG.x), dt * 3);
  }
}
function drawDog() {
  const beast = companionBeast();
  if (beast) { DOG.id = beast; return drawBeast(DOG); }
  const add = dynamicAdd, C = col => () => col, fx = Math.cos(DOG.yaw), fy = Math.sin(DOG.yaw), sx = -fy, sy = fx;
  const P = (a, b, z) => [DOG.x + fx * a + sx * b, DOG.y + fy * a + sy * b, z];
  const coat = [196, 140, 86], dark = [120, 80, 50], st = Math.sin(DOG.walk) * .09 * DOG.moving, bob = Math.abs(Math.sin(DOG.walk)) * .03 * DOG.moving;
  for (const [a, s] of [[.16, -1], [.16, 1], [-.14, -1], [-.14, 1]]) add(P(a + st * s * (a > 0 ? 1 : -1), s * .08, 0), P(a, s * .08, .2), .045, .04, C(coat));
  add(P(.18, 0, .3 + bob), P(-.16, 0, .29 + bob), .14, .13, C(coat));
  add(P(.02, 0, .35 + bob), P(-.06, 0, .36 + bob), .1, .1, C([236, 226, 210]));     // a pale saddle
  const h = P(.32, 0, .48 + bob); add(h, h, .12, .12, C(coat));
  add(P(.42, 0, .44 + bob), P(.46, 0, .43 + bob), .06, .05, C([236, 226, 210]));
  plotGlow(...P(.51, 0, .45 + bob), rgb(40, 30, 30));
  for (const s of [-1, 1]) add(P(.28, s * .1, .56 + bob), P(.26, s * .14, .42 + bob), .045, .03, C(dark));
  const wag = Math.sin(DOG.t * (DOG.moving > .3 || DOG.joy ? 18 : 7)) * .12;
  add(P(-.24, 0, .34), P(-.36, wag, .5), .035, .025, C(coat));
  face(h, fx, fy, sx, sy, .45, {}, { t: DOG.t });
  add(P(.24, 0, .38 + bob), P(.24, 0, .38 + bob), .06, .06, C([180, 50, 50]));          // red collar
}
function tapDog(sx, sy) {
  const [hx, hy] = sceneProject(G.scene, DOG.x, DOG.y, (DOG.z || 0) + .4);
  if (Math.hypot(sx - hx, sy - hy) > 8 * G.scene.S / 14) return false;
  DOG.joy = 1.4; burstHearts(DOG.x, DOG.y, (DOG.z || 0) + .9);
  BR({ type: 'sfx', name: companionBeast() ? 'chime' : 'woof' }); BR({ type: 'haptic', style: 'soft' });
  showLabel(companionName(), DOG.x, DOG.y, (DOG.z || 0) + 1.1);
  return true;
}
function setCompanion(id) {
  if (id !== 'dog' && !(BEASTS[id] && ECON.seen[id])) return;
  ECON.companion = id; dogArrive(); DOG.joy = 1.2;
  burst(DOG.x, DOG.y, .6, id === 'dog' ? [236, 196, 90] : RARITY_COLOR[BEASTS[id].rarity], 14);
  BR({ type: 'sfx', name: id === 'dog' ? 'woof' : 'spell' });
  econChanged({ companion: id });
}

/* ---------- the tipsy walk and other effects on the player ---------- */
function stepEffects(dt) {
  FX.tipsy = Math.max(0, FX.tipsy - dt); FX.glow = Math.max(0, FX.glow - dt);
  const p = G.player;
  if (FX.tipsy > 0 && p.moving > .2) p.yaw += Math.sin(G.time * 3.1) * dt * Math.min(1, FX.tipsy / 20) * 2.2;
  if (FX.tipsy > 15 && Math.random() < dt * .3) { emit({ scene: G.scene.id, x: p.x, y: p.y, z: 1.9, vx: .2, vy: -.1, vz: .5, life: 1.1, c: rgb(236, 236, 250), over: true, size: 2 }); BR({ type: 'sfx', name: 'hic' }); }
  if (FX.glow > 0 && Math.random() < dt * 8) emit({ scene: G.scene.id, x: p.x + (Math.random() - .5) * .6, y: p.y + (Math.random() - .5) * .6, z: Math.random() * 1.6, vx: 0, vy: 0, vz: .4, life: .8, c: rgb(220, 200, 255), glow: 1, over: true });
}

/* ---------- the shop: Odette's Curiosities ---------- */
function buildShop(data) {
  const sc = roomScene('shop', 8, 6.5, "Odette's Curiosities");
  sc.with(() => {
    room(sc, { w: 8, d: 6.5, wall: [200, 170, 140], floor: [130, 90, 60], windows: [{ wall: 'y', at: .6 }] });
    // shelves crowded with wares along both back walls
    const goods = [[200, 60, 60], [80, 140, 210], [236, 196, 90], [120, 190, 120], [190, 120, 230], [236, 226, 210], [180, 120, 70]];
    // open shelving: a thin back board, planks, and wares sitting out on the planks
    const shelfRun = (along, from, to) => {
      const len = to - from, n = Math.floor(len / .34);
      if (along) { box(-4, from, 0, -3.88, to, 2.3, PAL.woodDark, .4); for (const e of [from, to - .06]) box(-4, e, 0, -3.45, e + .06, 2.3, PAL.woodDark, .4); }
      else { box(from, -3.25, 0, to, -3.13, 2.3, PAL.woodDark, .4); for (const e of [from, to - .06]) box(e, -3.25, 0, e + .06, -2.7, 2.3, PAL.woodDark, .4); }
      for (const z of [.05, .65, 1.25, 1.85]) {
        if (along) box(-3.88, from, z, -3.45, to, z + .06, PAL.wood, .4); else box(from, -3.13, z, to, -2.7, z + .06, PAL.wood, .4);
        if (z > 1.8) continue;
        for (let k = 0; k < n; k++) {
          const h = hash(k, z * 10 + (along ? 0 : 5)), c = goods[(k * 3 + (z * 7 | 0)) % goods.length], u = from + .2 + k * .34;
          const x = along ? -3.66 : u, y = along ? u : -2.92, z0 = z + .06;
          if (h < .3) capsule([x, y, z0 + .02], [x, y, z0 + .18 + h * .2], .08, .06, () => c, 'gloss');
          else if (h < .55) box(x - .11, y - .11, z0, x + .11, y + .11, z0 + .17, c, .3);
          else if (h < .78) sphere(x, y, z0 + .1, .1, c, 'gloss');
          else if (h < .9) { for (let j = 0; j < 3; j++) box(x - .12, y - .09 + j * .07, z0, x + .12, y - .04 + j * .07, z0 + .26, goods[(k + j) % goods.length], .2); }
        }
      }
    };
    shelfRun(true, -3.25, .4);
    shelfRun(false, -2.6, 2.6);
    sc.obst.push({ x0: -4, y0: -3.25, x1: -3.4, y1: .5 }, { x0: -2.7, y0: -3.25, x1: 2.7, y1: -2.65 });
    // the counter, with a brass till and a cat-shaped bell
    counter(-.8, -1.4, 2.4, -.9, 1.05, [110, 70, 46]);
    box(1.6, -1.3, 1.05, 2.1, -1, 1.35, [200, 160, 70], .4);
    sphere(-.4, -1.15, 1.14, .09, PAL.gold, 'gloss');
    sc.obst.push({ x0: -.9, y0: -1.5, x1: 2.5, y1: -.8 });
    // a hat stand and a mannequin wearing the finest thing in stock
    capsule([3.2, -2.2, 0], [3.2, -2.2, 1.8], .04, .04, () => PAL.woodDark, 'solid');
    for (const [dx, dy, z, c] of [[.25, 0, 1.75, [80, 56, 128]], [-.2, .15, 1.6, [150, 60, 50]], [0, -.25, 1.45, [226, 196, 120]]]) sphere(3.2 + dx, -2.2 + dy, z, .16, c, 'solid');
    sc.obst.push({ cx: 3.2, cy: -2.2, r: .45 });
    // a display table of trinkets under a glass dome, glowing
    table(-2, 1.4, 1.2, .9, .8, PAL.woodLight);
    for (let k = 0; k < 5; k++) sphere(-2.4 + k * .2, 1.4 + (k % 2) * .15, .95, .06, goods[k], 'gloss');
    EMIT = 1; sphere(-1.7, 1.25, 1.02, .1, [120, 220, 255], 'glow'); EMIT = 0;
    addLight(sc, -1.7, 1.25, 1.1, 2.2, .5, .2);
    sc.obst.push({ x0: -2.7, y0: .85, x1: -1.3, y1: 1.95 });
    // a rolled rug for sale, a chest, a suit of armour in the corner
    box(-3.9, .8, 0, -3.2, 1.6, .45, [140, 90, 50], .5); box(-3.9, .8, .45, -3.2, 1.6, .55, [220, 170, 80], .3);
    sc.obst.push({ x0: -4, y0: .7, x1: -3.1, y1: 1.7 });
    furnitureArmor(-3.4, 2.4);
    sc.obst.push({ cx: -3.4, cy: 2.4, r: .5 });
    rug(.4, 1.2, 2.4, 1.8, [120, 60, 90], [80, 40, 70]);
    candle(sc, 1.2, -1.1, 1.06);
    for (const [x, y] of [[-3, -1.6], [2, -2.4]]) addLight(sc, x, y, 2.2, 3, .6, .25);
    doorMat(sc);
  });
  sc.npcs.push({ id: 'odette', ...CAST.odette, x: .8, y: -1.95, yaw: Math.PI * .25, stand: true, talkAt: { x: .8, y: -.1 } });
  return finishRoom(sc);
}
function furnitureArmor(x, y) {
  const C = c => () => c, steel = [170, 174, 182];
  for (const s of [-1, 1]) capsule([x + s * .12, y, 0], [x + s * .12, y, .7], .08, .07, C(steel), 'gloss');
  capsule([x, y, .75], [x, y, 1.25], .24, .22, C(steel), 'gloss');
  sphere(x, y, 1.48, .2, steel, 'gloss');
  capsule([x, y, 1.66], [x, y, 1.86], .04, .02, C([196, 50, 50]), 'solid');
  for (const s of [-1, 1]) capsule([x + s * .3, y, 1.2], [x + s * .32, y + .05, .8], .07, .06, C(steel), 'gloss');
}

/* ---------- furniture at the cottage ---------- */
// each piece has its own place; build happens inside buildHome's sc.with()
function placeFurniture(sc) {
  const has = id => ECON.placed.includes(id) && ECON.inv[id] > 0;
  const C = c => () => c;
  if (has('f_plant')) {
    cylinder(3.5, -.3, 0, .4, .2, solid([170, 100, 60]), -Math.PI, Math.PI);
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; capsule([3.5, -.3, .4], [3.5 + Math.cos(a) * .35, -.3 + Math.sin(a) * .35, .75 + hash(k, 2) * .3], .06, .03, C([70 + k * 6, 140, 70]), 'solid'); }
    sc.obst.push({ cx: 3.5, cy: -.3, r: .35 });
  }
  if (has('f_armor')) { furnitureArmor(-2.7, -2.5); sc.obst.push({ cx: -2.7, cy: -2.5, r: .45 }); }
  if (has('f_globe')) {
    cylinder(1.6, 1.9, 0, .6, .06, solid(PAL.woodDark), -Math.PI, Math.PI);
    sphere(1.6, 1.9, .85, .25, [80, 140, 180], 'gloss');
    for (let k = 0; k < 24; k++) { const a = k / 24 * 6.28; plot(1.6 + Math.cos(a) * .3, 1.9, .85 + Math.sin(a) * .3, rgb(210, 170, 80)); }
    sc.obst.push({ cx: 1.6, cy: 1.9, r: .4 });
  }
  if (has('f_chest')) { box(-.95, 2.3, 0, -.15, 2.85, .45, [140, 90, 50], .5); box(-.95, 2.3, .45, -.15, 2.85, .55, [220, 170, 80], .3); sc.obst.push({ x0: -1, y0: 2.2, x1: -.1, y1: 2.95 }); }
  if (has('f_cauldron')) {
    sphere(1, 2.6, .32, .36, [50, 46, 52], 'gloss');
    EMIT = 1; disc(1, 2.6, .62, .27, (a, b, o) => { o.c = [120, 220, 120]; o.flat = true; }); EMIT = 0;
    addLight(sc, 1, 2.6, .7, 2, .5, .25);
    sc.fires.push({ x: 1, y: 2.6, z: .66, kind: 'cauldron' });
    sc.obst.push({ cx: 1, cy: 2.6, r: .45 });
  }
  if (has('f_painting')) {
    quad([-2.7, -2.97, 1.2], [1, 0, 0], [0, 0, .8], (s, t, o) => {
      o.flat = true;
      if (s < .07 || s > .93 || t < .07 || t > .73) { o.c = PAL.gold; return; }
      const r = Math.hypot(s - .5, t - .48); o.c = [70, 100, 80];
      if (r < .14) o.c = [238, 198, 164]; if (t > .52 && Math.abs(s - .5) < .16 && r < .22) o.c = [48, 40, 52];
      if (t < .3 && Math.abs(s - .5) < .22) o.c = [168, 60, 52];
    }, false, [0, 1, 0]);
  }
  if (has('f_banner')) banner(2.6, -2.97, 2.5, [170, 50, 50], [236, 196, 90], false);
  if (has('f_lute')) {
    capsule([-.2, -2.92, 1.5], [-.2, -2.92, 1.75], .17, .14, C([190, 130, 70]), 'solid');
    capsule([-.2, -2.92, 1.8], [-.05, -2.92, 2.3], .03, .03, C([90, 60, 40]), 'solid');
  }
  placeMoreFurniture(sc, has);
}

/* ---------- the bard ---------- */
function drawLute(a, parts) {
  const h = parts.handL, r = parts.handR, strum = Math.sin((G.time + a.t0) * 9) * .04;
  capsule([h[0], h[1], h[2] - .05], [r[0], r[1], r[2] + strum], .13, .1, () => [190, 130, 70], 'solid');
  capsule([h[0], h[1], h[2]], [h[0] + (h[0] - r[0]) * .9, h[1] + (h[1] - r[1]) * .9, h[2] + .35], .03, .025, () => [90, 60, 40], 'solid');
  if (Math.random() < .06) emit({ scene: G.scene.id, x: a.x, y: a.y, z: 1.6, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5, vz: .6, life: 1.6, c: Math.random() < .5 ? rgb(236, 196, 90) : rgb(250, 240, 220), over: true, note: true });
}

/* ---------- per-frame hooks (called from game.js) ---------- */
function stepWares(dt) { stepFinds(dt); stepCreatures(dt); stepDog(dt); stepEffects(dt); stepMore(dt); }
function drawWares() { drawFinds(); drawCreatures(); drawDog(); if (G.scene.id !== 'village') drawRoomExtras(); }
function tapWares(sx, sy) { return tapDog(sx, sy) || (G.scene.id === 'village' && tapCreature(sx, sy)); }

const WARES_API = {
  buy, sell, use: useItem, place: placeItem,
  stock(npc) { BR({ type: 'stock', npc, wares: stockFor(npc), offers: Object.fromEntries(Object.keys(ECON.inv).map(id => [id, offerFor(npc, id)])) }); },
  companion(id) { setCompanion(id); },

  name(n) { ECON.dog = String(n || 'Pickle').slice(0, 20); econChanged({}); },
  catalog() { redress(); BR({ type: 'catalog', items: ITEMS, beasts: Object.fromEntries(Object.entries(BEASTS).map(([id, b]) => [id, { name: b.name, rarity: b.rarity, lore: b.lore, pal: (BEAST_ICONS[id] || [])[0], icon: (BEAST_ICONS[id] || [])[1] }])), rarity: RARITY, rarityColor: RARITY_COLOR, merchants: Object.keys(MERCHANTS) }); econChanged(); },
};
