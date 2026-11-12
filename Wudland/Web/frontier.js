'use strict';
// The Frontier: the lands beyond the village (harbour, peaks, whisperwood, wastes), the Aimless Merchant and Nomad,
// villagers' tasks and their mini-games, arranging the cottage, sleeping, and remembering where the player was.
// Plugs into wares.js / more.js through ITEMS, MERCHANTS, BEASTS, HAT_MORE and a few step/draw/tap hooks.

/* ---------- things ---------- */
const I = (name, kind, value, rarity, desc, pal, icon, extra) => ({ name, kind, value, rarity, desc, pal, icon, ...(extra || {}) });
Object.assign(ITEMS, {
  m_compass: I('Compass of Elsewhere', 'curio', 460, 3, 'Points firmly at wherever you are not.', { a: [200, 160, 70], b: [190, 60, 60] }, ['.aaa.', 'a..ba', 'a.b.a', 'a...a', '.aaa.']),
  m_coin: I('Two-Headed Coin', 'curio', 300, 2, 'The Merchant swears it is a coincidence.', { a: [236, 196, 90], b: [170, 130, 50] }, ['.aaa.', 'abbba', 'abaha'.replace('h', 'b'), 'abbba', '.aaa.']),
  m_bottle: I('Weather in a Bottle', 'curio', 380, 3, 'A very small, very cross thunderstorm.', { a: [130, 170, 200], b: [240, 230, 120] }, ['..a..', '.a.a.', 'a.b.a', 'ab..a', 'aaaaa']),
  n_glass: I('Sunless Hourglass', 'curio', 1100, 3, 'A gift of the Nomad. The sand falls upward, slowly, when nobody looks.', { a: [200, 160, 70], b: [120, 150, 220] }, ['aaaaa', '.bbb.', '..b..', '.b.b.', 'aaaaa']),
  n_mirage: I('Bottled Mirage', 'curio', 1800, 4, 'A gift of the Nomad. Look in and see an oasis you once forgot.', { a: [120, 200, 210], b: [240, 200, 120] }, ['..a..', '.aaa.', 'abbba', 'aabaa', '.aaa.']),
  n_tooth: I('Tooth of the First Worm', 'curio', 2400, 4, 'A gift of the Nomad. Collectors weep. Dentists also.', { a: [240, 232, 208], b: [170, 140, 90] }, ['aaaaa', 'aaaaa', '.aab.', '.ab..', '..b..']),
  sardine: I('Salted Sardine', 'food', 8, 0, 'Tastes like the sea had a hard day.', { a: [150, 170, 190], b: [70, 90, 120] }, ['.....', '.aaab', 'aaaa.', '.aaab', '.....']),
  ink: I('Kraken Ink', 'magic', 150, 2, 'Writes by itself if left alone.', { a: [40, 36, 70], b: [150, 120, 220] }, ['..a..', '.aaa.', 'aabaa', 'aaaaa', '.aaa.']),
  seaglass: I('Sea Glass', 'gem', 40, 1, 'The harbour polished this for free.', { a: [120, 210, 190], b: [200, 250, 230] }, ['.....', '.ab..', 'aaaa.', '.aaaa', '.....']),
  amethyst: I('Peak Amethyst', 'gem', 210, 2, 'Grows in the cold rock. Hums when you are lying.', { a: [150, 90, 200], b: [220, 180, 250] }, ['..b..', '.aba.', '.aaa.', 'aabaa', 'aaaaa']),
  fossil: I('Curled Fossil', 'curio', 180, 2, 'Something very old, having a very long nap.', { a: [170, 150, 120], b: [90, 76, 60] }, ['.aaa.', 'abbba', 'ab.ba', 'abbaa', '.aaa.']),
  bonecharm: I('Bone Charm', 'trinket', 55, 1, 'Rattles when the wind turns.', { a: [230, 220, 196], b: [130, 70, 60] }, ['..a..', '.aba.', '..a..', '.a.a.', '.....']),
  fernseed: I('Fern Seed', 'magic', 95, 2, 'They say it makes you unseen. So far it has only made people sneeze.', { a: [90, 150, 80], b: [190, 220, 120] }, ['..b..', '.bab.', '..a..', '.aaa.', '..a..']),
  hat_wander: I("Wanderer's Hat", 'hat', 640, 3, 'A hat with more miles on it than most boots.', { a: [70, 110, 110], b: [236, 196, 90] }, ['..a..', '.aaa.', '.bbb.', 'aaaaa', 'b.b.b'], { hat: 'wander', look: { hatColor: [70, 110, 110], hatBand: [236, 196, 90] } }),
  hat_sailor: I("Harbour Cap", 'hat', 60, 1, 'Comes with an opinion on knots.', { a: [240, 240, 240], b: [40, 60, 110] }, ['.....', '.aaa.', 'aaaaa', 'bbbbb', '.....'], { hat: 'sailor', look: { hatColor: [240, 240, 240], hatBand: [40, 60, 110] } }),
  o_patch: W('outfit', 'Thousand-Patch Coat', 520, 3, 'Every patch is from somewhere. One of them is from here.', { shirt: [170, 110, 70], sleeve: [70, 110, 110], stripe: [120, 60, 100], legs: [70, 60, 56], belt: [236, 196, 90] }, { a: [170, 110, 70], b: [70, 110, 110], c: [120, 60, 100] }, ['ab.ba', 'acbca', 'abcba', 'acbca', 'a...a']),
  o_sailor: W('outfit', "Deckhand's Stripes", 70, 1, 'Horizontal stripes, as the sea intended.', { shirt: [240, 240, 240], stripe: [50, 80, 140], sleeve: [240, 240, 240], legs: [40, 54, 100] }, { a: [240, 240, 240], b: [50, 80, 140] }, ['ab.ba', 'aaaaa', 'bbbbb', 'aaaaa', 'bbbbb']),
  o_dune: W('outfit', 'Dune Wraps', 190, 2, 'Keeps the sand out and the mystery in.', { robe: true, shirt: [196, 170, 124], sleeve: [196, 170, 124], hem: [130, 90, 66], belt: [120, 60, 50] }, { a: [196, 170, 124], b: [130, 90, 66] }, ['aa.aa', '.aaa.', '.bbb.', '.aaa.', 'aabaa']),
  o_fern: W('outfit', 'Forester\'s Greens', 110, 1, 'Excellent for standing very still in.', { shirt: [70, 104, 70], sleeve: [58, 88, 62], legs: [84, 66, 50], belt: [120, 84, 50], cape: [50, 76, 54] }, { a: [70, 104, 70], b: [120, 84, 50] }, ['aa.aa', '.aaa.', 'bbbbb', '.aaa.', '.a.a.']),
});
Object.assign(MERCHANTS, {
  merchant: { sells: ['m_compass', 'm_coin', 'm_bottle', 'hat_wander', 'o_patch', 'ink', 'fernseed'], buys: { curio: .8, gem: .75, magic: .7, wear: .55 }, slots: 7 },
  marisol: { sells: ['sardine', 'seaglass', 'ink', 'hat_sailor', 'o_sailor', 'shell', 'pearl'], buys: { gem: .55, food: .45, curio: .4 }, slots: 5 },
  moss: { sells: ['fernseed', 'o_fern', 'shroom', 'acorn', 'clover', 'pinecone'], buys: { magic: .6, trinket: .55 }, slots: 5 },
  ignatia: { sells: ['amethyst', 'fossil', 'pinecone', 'hat_viking', 'n_scarf'], buys: { gem: .6, curio: .5 }, slots: 4 },
});
const ETC_SELL = { odette: ['m_coin', 'seaglass'], hilda: ['fernseed'], gearwin: ['fossil'], tobias: ['bonecharm'] };
for (const [m, ids] of Object.entries(ETC_SELL)) MERCHANTS[m].sells.push(...ids);

for (const [id, it] of Object.entries(ITEMS)) it.id = id;

/* ---------- who lives out there ---------- */
Object.assign(CAST, {
  merchant: { name: 'The Aimless Merchant', look: { skin: SKIN[2], hair: HAIR[1], shirt: [170, 110, 70], stripe: [120, 60, 100], sleeve: [70, 110, 110], legs: [70, 60, 56], cape: [120, 60, 100], belt: [236, 196, 90], hat: 'wander', hatColor: [70, 110, 110], hatBand: [236, 196, 90], beard: [60, 46, 40], back: 'pack', gear: true, blush: true } },
  nomad: { name: 'The Aimless Nomad', look: { skin: SKIN[3], hair: HAIR[4], shirt: [196, 170, 124], sleeve: [176, 150, 110], robe: true, robeW: .38, hem: [120, 82, 60], belt: [120, 60, 50], cape: [130, 90, 66], hat: 'veil', hatColor: [150, 110, 80], hatBand: [200, 170, 90], hand: 'staff', gear: true } },
  marisol: { name: 'Captain Marisol', look: { skin: SKIN[1], hair: HAIR[1], shirt: [50, 80, 140], sleeve: [50, 80, 140], legs: [230, 224, 206], belt: [236, 196, 90], hat: 'tricorn', hatColor: [40, 44, 70], hatBand: [236, 196, 90], blush: true } },
  moss: { name: 'Old Moss the Woodward', look: { skin: SKIN[2], hair: [120, 150, 90], shirt: [84, 110, 70], robe: true, hem: [60, 82, 54], belt: [120, 84, 50], beard: [130, 160, 100], hat: 'flowers', hatColor: [90, 130, 70] } },
  ignatia: { name: 'Ignatia the Mountain Warden', look: { skin: SKIN[0], hair: [190, 70, 44], shirt: [150, 56, 48], sleeve: [120, 46, 42], legs: [70, 40, 40], belt: [236, 196, 90], cape: [60, 30, 34], hat: 'kerchief', hatColor: [50, 40, 44], blush: true } },
  bryn: { name: 'Bryn the Shepherd', look: { skin: SKIN[1], hair: HAIR[3], shirt: [226, 216, 196], sleeve: [150, 110, 76], legs: [90, 76, 60], belt: [120, 84, 50], cape: [150, 90, 70], hat: 'straw', hatColor: [214, 186, 120], hatBand: [120, 150, 90], hand: 'staff', gear: true, blush: true } },
  pip: { name: 'Pip the Climber', look: { skin: SKIN[0], hair: HAIR[2], shirt: [190, 96, 60], sleeve: [150, 76, 56], legs: [80, 90, 96], belt: [150, 110, 60], hat: 'bandana', hatColor: [80, 130, 150], back: 'pack', gear: true, blush: true } },
  hobb: { name: 'Hobb the Net-Mender', look: { skin: SKIN[0], hair: HAIR[4], shirt: [120, 134, 150], legs: [80, 70, 60], beard: [200, 196, 190], apron: [190, 170, 130] } },
  tamsin: { name: 'Tamsin the Lamplighter', look: { skin: SKIN[1], hair: HAIR[5], shirt: [190, 130, 60], legs: [60, 54, 70], hat: 'cap', hatColor: [60, 60, 90], blush: true } },
});
function frontierFolk(sc) {
  const out = [];
  const stand = (id, u, v, yaw, extra) => { const [x, y] = at(u, v); out.push(makeActor({ id, ...CAST[id], x, y, yaw, stand: true, ...extra }, sc)); };
  const WAYS = [[18, -1], [11, 3], [3, 7], [-3, 12], [-5, 28], [-7, 37], [-18, -13], [-26, -12], [-2, -14], [1, -36], [3, -40], [20, -3]];
  { const r = WAYS.map(p => at(...p)), n = stockWindow() % WAYS.length, [x, y] = r[n];
    out.push(makeActor({ id: 'merchant', ...CAST.merchant, x, y, route: r, speed: 1.5, pets: ['mule', 'mule'] }, sc)); }
  stand('nomad', -9, 44, Math.PI * .4, { pets: ['fox'] });
  stand('marisol', 20.5, -2.4, Math.PI * .1);
  stand('moss', -25, -9.5, Math.PI * .6);
  stand('ignatia', 2.6, -41, Math.PI * .4);
  stand('hobb', 18, 3, -Math.PI * .4);
  stand('bryn', -11, -36, Math.PI * .3);
  stand('pip', -11.6, -38.6, Math.PI * .75);
  { const r = [[-5, -14], [0, -24], [1, -36], [-18, -13], [16, -1]].map(p => at(...p)), [x, y] = r[0]; out.push(makeActor({ id: 'tamsin', ...CAST.tamsin, x, y, route: r, speed: 1.3 }, sc)); }
  return out;
}

/* ---------- the land itself: called once while the village bakes ---------- */
const DAMP = [[34, 58, 44], [46, 74, 50], [62, 94, 56], [84, 114, 60]];
const DUST = [[150, 130, 84], [174, 152, 98], [196, 172, 112], [216, 194, 136]];
const ALPINE_FLOWERS = [[244, 150, 186], [250, 226, 120], [190, 150, 240]];
const STONY = [[66, 104, 60], [88, 126, 66], [116, 146, 76], [146, 164, 92]];
function regionGround(id, x, y, ix, iy, fine) {
  const pal = id === 'woods' ? DAMP : id === 'wastes' ? DUST : id === 'peaks' ? STONY : null;
  if (!pal) return 0;
  let n = noise(x * .7, y * .7) * 1.1 + (fine - .5) * .5 - .05;
  if (id === 'wastes' && Math.abs(noise(x * 1.7, y * 1.7) - .5) < .012) return rgb(112, 84, 60);   // cracks in the dry ground
  if (id === 'peaks' && SNOW) n += .9;
  if (id === 'peaks' && !SNOW && fine > .985) return rgb(...ALPINE_FLOWERS[hash(iy, ix) * 3 | 0]);
  return rgb(...pal[clamp(Math.floor(n * 4.2), 0, 3)]);
}
function boat(scene, x, y, L, c, sail, trim = [236, 226, 200]) {
  const halfW = t => .74 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.6)), .62);
  const sheer = t => .66 + (t > 0 ? .5 * t * t * t * t : .18 * t * t), dark = c.map(v => v * .68), step = .045;
  for (let t = -1; t < 1; t += step) {
    const w = halfW(t + step / 2), z = sheer(t), a = x + t * L, b = a + step * L * 1.15; if (w < .03) continue;
    box(a, y - w * .72, 0, b, y + w * .72, .2, dark, .3);                  // below the waterline
    box(a, y - w * .92, .2, b, y + w * .92, .36, c.map(v => v * .86), .5);  // strakes, widening as they rise
    box(a, y - w, .36, b, y + w, z - .16, c, .6);
    box(a, y - w - .025, z - .16, b, y + w + .025, z - .07, trim, .3);      // a painted band
    box(a, y - w - .04, z - .07, b, y + w + .04, z, PAL.woodDark, .3);      // the gunwale
  }
  const deckL = L * .86;
  quad([x - deckL, y - .56, .58], [deckL * 2, 0, 0], [0, 1.12, 0], (s, t, o) => { o.flat = true; o.c = (t * 5.5) % 1 < .14 ? [96, 66, 46] : Math.floor(t * 5.5) % 2 ? [190, 148, 100] : [172, 130, 86]; if (Math.abs(s - deckL) > deckL * .92 || halfW((s - deckL) / L) < Math.abs(t - .56) + .06) o.c = c; }, false, [0, 0, 1]);
  capsule([x - L * 1.0, y, .1], [x - L * 1.08, y, .72], .05, .035, () => PAL.woodDark, 'solid');   // rudder
  capsule([x + L * .94, y, sheer(.94)], [x + L * 1.34, y, sheer(1) + .28], .045, .02, () => PAL.woodDark, 'solid');   // bowsprit
  sphere(x + L * .97, y, sheer(.97) + .08, .11, [236, 196, 90], 'gloss');   // a brass figurehead knob
  for (let a = 0; a < 6.283; a += .22) { const r = 1.04 + (hash(a * 9 | 0, L * 7 | 0) - .5) * .05, px = x + Math.cos(a) * L * r, py = y + Math.sin(a) * .9 * r; plot(px, py, .005, rgb(186, 214, 220)); }   // foam at the waterline
  if (!sail) {     // the rowing boat: thwarts, oars shipped over the side
    for (const f of [-.42, .05, .5]) box(x + f * L - .08, y - halfW(f) * .85, .62, x + f * L + .08, y + halfW(f) * .85, .67, [190, 148, 100], .3);
    for (const s of [-1, 1]) { capsule([x - .05, y + s * .55, .78], [x + .5, y + s * 1.4, .04], .022, .022, () => [200, 160, 110], 'solid'); capsule([x + .5, y + s * 1.4, .04], [x + .68, y + s * 1.62, .02], .07, .02, () => [224, 214, 190], 'solid'); }
    return;
  }
  // a snug stern cabin with a lit window
  const c0 = x - L * .72, c1 = c0 + L * .5;
  box(c0, y - .42, .58, c1, y + .42, 1.24, [214, 196, 160], .5); box(c0 - .08, y - .5, 1.24, c1 + .08, y + .5, 1.34, dark, .4);
  for (const f of [.22, .64]) { EMIT = 1; quad([c0 + (c1 - c0) * f, y + .425, .82], [.24, 0, 0], [0, 0, .22], (s, t, o) => { o.c = [252, 214, 130]; o.flat = true; }, false, [0, 1, 0]); EMIT = 0; }
  addLight(scene, c0 + .3, y + .6, .9, 2.4, .5, .12);
  // mast, yard and a sail with some wind in it
  const mx = x + L * .1, top = 4.1, yardZ = 3.55, botZ = 1.25, span = Math.min(1.5, L * .68), N = 18, dx = span * 2 / N;
  capsule([mx, y, .58], [mx, y, top], .075, .045, () => PAL.woodDark, 'solid');
  capsule([mx - span - .1, y + .02, yardZ], [mx + span + .1, y + .02, yardZ], .045, .03, () => PAL.wood, 'solid');
  capsule([mx - span * .9, y + .3, botZ], [mx + span * .9, y + .3, botZ], .03, .022, () => PAL.wood, 'solid');
  const bulge = i => .34 * Math.sin((i / N) * Math.PI);
  for (let i = 0; i < N; i++) {
    const belly = bulge(i), b2 = bulge(i + 1);
    quad([mx - span + i * dx, y + .06 + belly * .25, botZ + (Math.abs(i / N - .5) * .28)], [dx, (b2 - belly) * .25, 0], [0, 0.0 + belly * .24, yardZ - botZ - (Math.abs(i / N - .5) * .28)], (s, t, o) => {
      const v = t / (yardZ - botZ), u = (i + s / dx) / N; o.flat = true; o.dl = (.5 - Math.abs(u - .5)) * .45 - .1;
      o.c = Math.floor(u * 6) % 2 ? sail : trim;
      const ex = (u - .5) * span * 2, ez = v - .55; if (Math.hypot(ex * .55, ez * 2.4) < .28) o.c = (Math.hypot(ex * .55, ez * 2.4) < .19) ? [236, 196, 90] : trim;   // the house emblem
      if (v > .95 || (t % .42) < .02) o.c = mixc(o.c, [60, 40, 40], .22);    // seams and reefing
    }, false, [0, 1, 0]);
  }
  for (const [ax, az] of [[x + L * 1.3, sheer(1) + .3], [x - L * .94, sheer(-.94)]]) capsule([mx, y, top - .1], [ax, y, az], .01, .01, () => [80, 66, 56], 'solid');   // rigging
  for (const s of [-1, 1]) capsule([mx, y, 3.2], [mx - .1, y + s * .68, sheer(.1)], .009, .009, () => [80, 66, 56], 'solid');
  quad([mx, y, top], [.8, 0, -.18], [0, 0, .32], (s, t, o) => { o.c = sail; o.flat = true; }, true, [0, 1, 0]);   // pennant
  lantern(scene, x + L * .78, y + .35, sheer(.78) + .5, .55);
}
// The range along the island's back: one long crest, [u, v, height] from west to east. Houses stand about four units tall,
// so these are real mountains. The land rises from the crest line, not from single points: a wall of rock with summits and
// cols along it, buttresses running down toward the meadows, and a low skirt of foothills at its feet. No cones.
const RANGE = [[-23, -45.6, 4], [-19, -47, 7], [-16, -48.2, 8.6], [-13, -49, 7.8], [-9.5, -49.3, 12], [-6, -49.2, 9.4], [-2.5, -48.9, 11], [1, -49.1, 9], [4.5, -49.6, 13.2],
  [7.5, -49.8, 13], [10.5, -49.7, 15.4], [13.5, -49, 13.4], [16.5, -47.8, 10.6], [19.5, -46.5, 7.6], [22.5, -44.8, 5.6], [25, -43.4, 3]];
const TREELINE = 4.4, SNOWLINE = 6.9;
function highUV(u, v) {
  if (v > -40 || v < -62 || Math.abs(u) > 30) return 0;
  // nearest point on the crest, and the crest's height there (dipping to a col between summits)
  let best = 1e9, ch = 0, side = 1;
  for (let k = 0; k < RANGE.length - 1; k++) {
    const a = RANGE[k], b = RANGE[k + 1], ex = b[0] - a[0], ey = b[1] - a[1];
    const t = clamp(((u - a[0]) * ex + (v - a[1]) * ey) / (ex * ex + ey * ey), 0, 1);
    const px = a[0] + ex * t, py = a[1] + ey * t, d = Math.hypot(u - px, v - py);
    if (d < best) { best = d; ch = lerp(a[2], b[2], t) * (1 - .2 * Math.sin(t * Math.PI)); side = v > py ? 1 : -1; }
  }
  // the front of the range is broad, with spurs reaching forward here and there; the back falls away steeply
  const spur = 1 - Math.abs(2 * noise(u * .3 + 5, 1.5) - 1);
  const W = side > 0 ? Math.min(6.2, ch * .56) + 1.3 * spur : 3.4, q = best / W;
  if (q >= 1) return 0;
  const core = Math.max(0, 1 - q / .78), skirt = 1 - q;
  const h = ch * (.82 * Math.pow(core, 1.15) + .18 * Math.pow(skirt, 1.5));
  // ridges and gullies cut into the faces, stronger the higher you go
  const ridge = 1 - Math.abs(2 * noise(u * .5 + 2, v * .34) - 1), fine = noise(u * 1.5, v * 1.5 + 7) - .5;
  const rough = 1 + (ridge - .5) * .3 * clamp(h / 4, .15, 1) + fine * .1;
  const coast = clamp((.97 - isleF(u, v)) / .08, 0, 1);       // settles to nothing before the shore
  return Math.max(0, h * rough * coast * coast * (3 - 2 * coast) - .3);
}
function highAt(x, y) { const [u, v] = toUV(x, y); return highUV(u, v); }
function highlands(scene) {
  const c = .24, x0 = -50, y0 = -50, n = Math.ceil(50 / c), m = Math.ceil(50 / c), H = new Float32Array((n + 1) * (m + 1));
  for (let j = 0; j <= m; j++) for (let i = 0; i <= n; i++) H[j * (n + 1) + i] = highAt(x0 + i * c, y0 + j * c);
  // the bands a walker would climb through: meadow, hill pasture, forest floor, the scrubby treeline, scree, bare rock, snow
  const MEADOW = [116, 146, 76], HILL = [124, 144, 84], FOREST = [88, 116, 74], SCRUB = [134, 136, 100], SCREE = [156, 146, 134], ROCK = [150, 138, 128], ROCK2 = [126, 118, 118], SNOWY = [240, 244, 250], SNOWSH = [206, 214, 236];
  const paint = (x, y, a, b, d) => {
    // lit from screen-left like everything else in the world: faces turned toward +y catch the sun, +x faces fall into shade
    const hx = (b - a) / c, hy = (d - a) / c, L = 1 / Math.hypot(hx, hy, 1), lit = clamp((-hx * .1 - hy * .62 + .78) * L, 0, 1);
    const h = (a + b + d) / 3, jit = h < 1 ? 0 : (noise(x * .9, y * .9) - .5) * 1.5, k = h + jit;
    let col = k < .7 ? MEADOW : k < 1.7 ? HILL : k < TREELINE - .6 ? FOREST : k < TREELINE + .5 ? SCRUB : k < TREELINE + 1.5 ? (noise(x * 3, y * 1.2) > .5 ? SCREE : ROCK) : k < SNOWLINE ? (noise(x * 2, y * 2) > .5 ? ROCK : ROCK2) : SNOWY;
    if (col === SNOWY && L < .2 + noise(x * 1.3, y * 1.3 + 4) * .16 && k < SNOWLINE + 3.5) col = noise(x * 2.4, y * 2.4) > .45 ? ROCK : ROCK2;   // faces too steep to hold snow show their stone
    else if (col !== SNOWY && k > SNOWLINE - 2 && L > .5 && noise(x * 1.7 + 9, y * 1.7) > .56) col = SNOWY;   // and snow lingers on the ledges below
    else if (col === SNOWY && lit < .5) col = SNOWSH;
    const steps = Math.round((.42 + lit * .72) * 7) / 7;        // a few flat tones, like painted pixels
    return h < 1 ? col : mixc([78, 72, 104], col, clamp(steps, .5, 1.12));
  };
  for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
    const g = j * (n + 1) + i, a = H[g], b = H[g + 1], d = H[g + n + 1], e = H[g + n + 2];
    if (Math.max(a, b, d, e) < .14) continue;
    const x = x0 + i * c, y = y0 + j * c, c1 = paint(x, y, a, b, d), c2 = paint(x + c * .5, y + c * .5, d, e, a);
    quad([x, y, a], [c, 0, b - a], [0, c, d - a], (s, t, o) => { o.c = c1; o.flat = true; }, true, [0, 0, 1]);
    quad([x + c, y + c, e], [-c, 0, d - e], [0, -c, b - e], (s, t, o) => { o.c = c2; o.flat = true; }, true, [0, 0, 1]);
  }
  // the forest climbs the lower slopes: thick and tall at the foot, thinner and smaller with every step up, and at the
  // treeline only wind-bent scrub. Nothing grows on the scree or the snow.
  for (let k = 0; k < 15000; k++) {
    const u = (hash(k, 51) * 2 - 1) * 30, v = -40 - hash(k, 52) * 16, z = highUV(u, v);
    if (z < .25 || z > TREELINE + .3) continue;
    const up = z / TREELINE;
    if (hash(k, 54) < up * up * .8 || noise(u * .35, v * .35) < .22 + up * .2) continue;
    const [x, y] = at(u, v);
    if (up > .82) {   // krummholz: low dark clumps leaning away from the wind
      const s = .13 + hash(k, 53) * .07;
      sphere(x, y, z + s * .7, s, PINE[0], 'rough'); sphere(x + s * .9, y - s * .5, z + s * .6, s * .8, PINE[1], 'rough');
      continue;
    }
    const s = (.78 - up * .5) * (.75 + hash(k, 53) * .45);
    capsule([x, y, z], [x, y, z + .3 * s], .05, .05, () => PAL.woodDark, 'solid');
    cone(x, y, z + .2 * s, z + .9 * s, .34 * s, solid(PINE[up > .5 ? 0 : 1], .7)); cone(x, y, z + .55 * s, z + 1.25 * s, .24 * s, solid(PINE[up > .5 ? 1 : 2], .7));
  }
  // boulders tumbled onto the scree
  for (let k = 0; k < 260; k++) {
    const u = (hash(k, 56) * 2 - 1) * 28, v = -41 - hash(k, 57) * 13, z = highUV(u, v);
    if (z < TREELINE || z > SNOWLINE) continue;
    const [x, y] = at(u, v), s = .1 + hash(k, 58) * .14;
    sphere(x, y, z + s * .5, s, hash(k, 59) > .5 ? [112, 106, 110] : [136, 128, 124], 'rough');
  }
}
// trees in the high country are smaller the nearer they stand to the mountains, so the peaks keep their size
function alpineScale(v) { return v > -30 ? 1 : clamp(1 - (-30 - v) / 13 * .5, .5, 1); }
function boulder(x, y, s) { sphere(x, y, s * .5, s * .7, [122, 118, 116], 'rough'); sphere(x + s * .5, y + s * .2, s * .32, s * .4, [104, 100, 104], 'rough'); castShadow(x, y, s * .4, s); }
function deadTree(x, y, s, seed) {
  const c = () => [96, 76, 60], top = [x + (hash(seed, 1) - .5) * .6, y + (hash(seed, 2) - .5) * .6, 2.4 * s];
  capsule([x, y, 0], top, .17 * s, .08 * s, c, 'solid');
  for (let k = 0; k < 4; k++) { const a = hash(seed, k + 3) * 6.28, z = (1 + k * .4) * s; capsule([x, y, z], [x + Math.cos(a) * .9 * s, y + Math.sin(a) * .9 * s, z + .6 * s], .06 * s, .02 * s, c, 'solid'); }
  castShadow(x, y, 1, .5 * s);
}
function glowcap(scene, x, y, c, s = 1) {
  capsule([x, y, 0], [x, y, .3 * s], .05 * s, .04 * s, () => [226, 220, 200], 'solid');
  EMIT = 1; sphere(x, y, .36 * s, .16 * s, c, 'solid'); EMIT = 0;
}
// a canvas ridge tent: striped slopes, a dark open flap with the door tied back, guy ropes and pegs
function tent(scene, x, y, c, L = 1.25, W = 1.15, H = 1.5, stripe = [238, 228, 204]) {
  const shade = (s, t, o) => { o.flat = true; o.c = Math.floor(s / .42) % 2 ? c : stripe; if (t < .1) o.c = mixc(o.c, [60, 44, 40], .3); };
  quad([x - L, y + W, 0], [L * 2, 0, 0], [0, -W, H], shade, false, [0, .7, .7]);
  quad([x + L, y - W, 0], [-L * 2, 0, 0], [0, W, H], shade, false, [0, -.7, .7]);
  for (const e of [x - L, x + L]) quad([e, y + W, 0], [0, -W * 2, 0], [0, -W, H], (s, t, o) => { o.flat = true; const m = Math.abs(s - W) < (H - t) * .34 && t < H * .78; o.c = e > x && m ? [40, 30, 32] : c.map(v => v * .86); }, true, [1, 0, 0]);
  for (const q of [-1, 1]) capsule([x + L * q, y, 0], [x + L * q, y, H + .12], .035, .03, () => PAL.woodDark, 'solid');
  capsule([x - L, y, H + .03], [x + L, y, H + .03], .035, .035, () => PAL.woodDark, 'solid');
  for (const [a, b] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { capsule([x + a * L, y + b * W * .55, H * .55], [x + a * (L + .55), y + b * (W + .45), .02], .008, .008, () => [210, 200, 170], 'solid'); sphere(x + a * (L + .55), y + b * (W + .45), .04, .05, PAL.woodDark, 'solid'); }
  quad([x + L, y, H + .14], [.55, 0, -.08], [0, 0, .24], (s, t, o) => { o.c = [220, 80, 80]; o.flat = true; }, true, [0, 1, 0]);
  castShadow(x, y, .8, 1.3);
}
function basecamp(scene, sky) {
  const [cx, cy] = at(-13, -41), cream = [238, 228, 204];
  // both tents can be gone into (rooms.js): the door is the tied-back flap at the +x end
  PICK = 81; tent(scene, cx - 1.8, cy - 1.5, [176, 84, 66]); PICK = 0; sky.push({ x0: cx - 3.7, y0: cy - 3.1, x1: cx + .1, y1: cy + .1 });
  scene.doors.push({ id: 'camp', x: cx + .4, y: cy - .4, face: 'x', pick: 81 });   // just in front of the flap, clear of the cook tent's ropes
  PICK = 82; tent(scene, cx + 1.7, cy - 2, [78, 118, 130], .85, .8, 1.05); PICK = 0; sky.push({ x0: cx + .5, y0: cy - 3.2, x1: cx + 3, y1: cy - .8 });
  scene.doors.push({ id: 'cook', x: cx + 3.55, y: cy - 2, face: 'x', pick: 82 });
  const fx = cx + .1, fy = cy + 1.4; campfire(scene, fx, fy); sky.push({ cx: fx, cy: fy, r: .55 });
  for (const a of [-.5, .5]) capsule([fx + a, fy + .1, 0], [fx, fy, 1.15], .025, .022, () => PAL.woodDark, 'solid');
  capsule([fx, fy, 1.15], [fx, fy, .68], .008, .008, () => [90, 86, 86], 'solid');
  sphere(fx, fy, .55, .18, [54, 50, 56], 'gloss'); disc(fx, fy, .72, .12, (a, b, o) => { o.c = [190, 150, 90]; o.flat = true; });
  scene.smokers?.push({ x: fx, y: fy, z: .85, key: 'camp' });
  for (const [dx, dy, ax] of [[-1.25, .5, 0], [1.3, .55, 0], [-.3, 2.45, 1]]) { const x = fx + dx, y = fy + dy; capsule(ax ? [x - .55, y, .14] : [x, y - .55, .14], ax ? [x + .55, y, .14] : [x, y + .55, .14], .13, .13, () => [132, 92, 60], 'solid'); disc(ax ? x + .67 : x, ax ? y : y + .67, .14, .12, (a, b, o) => { o.c = [214, 180, 130]; o.flat = true; }); sky.push({ cx: x, cy: y, r: .45 }); }
  // bedrolls, a pack, the wood stack, and a rack of drying fish
  for (const [dx, dy, c] of [[-2.8, .9, [120, 80, 110]], [-2.8, 1.75, [90, 130, 110]]]) { quad([cx + dx - .75, cy + dy - .25, .03], [1.5, 0, 0], [0, .55, 0], (s, t, o) => { o.c = s > 1.05 ? cream : c; o.flat = true; }, false, [0, 0, 1]); capsule([cx + dx + .78, cy + dy - .22, .1], [cx + dx + .78, cy + dy + .26, .1], .09, .09, () => cream, 'solid'); }
  { const x = cx + 1.8, y = cy + .8; capsule([x, y, .08], [x, y, .5], .19, .17, () => [150, 104, 60], 'solid'); sphere(x, y, .6, .17, [120, 80, 110], 'rough'); capsule([x - .15, y + .16, .2], [x - .15, y + .16, .46], .03, .03, () => [60, 44, 36], 'solid'); sky.push({ cx: x, cy: y, r: .35 }); }
  { const x = cx + 3.6, y = cy + .3; for (let r = 0; r < 3; r++) for (let q = 0; q < 3 - r; q++) capsule([x - .55, y - .2 + q * .2 + r * .1, .11 + r * .18], [x + .55, y - .2 + q * .2 + r * .1, .11 + r * .18], .1, .1, () => [150 - r * 10, 104, 66], 'solid'); sky.push({ x0: x - .65, y0: y - .35, x1: x + .65, y1: y + .45 }); }
  { const x = cx - .6, y = cy + 3.6; for (const a of [-.8, .8]) capsule([x + a, y, 0], [x + a, y, 1.3], .04, .04, () => PAL.woodDark, 'solid'); capsule([x - .8, y, 1.26], [x + .8, y, 1.26], .03, .03, () => PAL.woodDark, 'solid'); for (let q = 0; q < 5; q++) { const fsh = x - .55 + q * .28; capsule([fsh, y, 1.2], [fsh, y, .85], .05, .02, () => [150, 170, 190], 'solid'); } sky.push({ x0: x - .9, y0: y - .12, x1: x + .9, y1: y + .12 }); }
  { const x = cx + 2.6, y = cy + 2.3; capsule([x, y, 0], [x, y, 1.75], .03, .03, () => PAL.woodDark, 'solid'); capsule([x, y, 1.72], [x + .3, y, 1.72], .02, .02, () => PAL.woodDark, 'solid'); lantern(scene, x + .3, y, 1.35, .55); sky.push({ cx: x, cy: y, r: .15 }); crate(x - 3.9 - 1.3, y - .6, .72); sky.push({ cx: x - 5.2, cy: y - .6, r: .45 }); }
  addLight(scene, cx, cy + 1, .9, 6, .55, .25);
}
function campfire(scene, x, y) {
  for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; sphere(x + Math.cos(a) * .36, y + Math.sin(a) * .36, .08, .1, [110, 106, 104], 'rough'); }
  EMIT = 1; sphere(x, y, .16, .14, [250, 150, 60], 'solid'); EMIT = 0;
  addLight(scene, x, y, .5, 4.5, .9, .35);
  scene.fires.push({ x, y, z: .2, kind: 'hearth' });
}
const HOMES = [
  [18.5, 9.5, 3.4, 3, 2.6, 'timber', [214, 204, 186], 'tile'], [16.8, -7, 3.6, 3, 2.8, 'stone', 0, 'slate'], [23.5, -7.4, 3, 2.8, 2.5, 'timber', [196, 190, 170], 'thatch'], [19.5, 13.6, 3, 3, 2.6, 'stone', 0, 'tile'],
  [-11, -38, 3.6, 3.2, 2.8, 'stone', 0, 'slate'], [16, -38, 3.4, 3, 2.7, 'stone', 0, 'slate'], [-7.5, -38.5, 3, 2.8, 2.6, 'timber', [226, 210, 184], 'thatch'], [-27, -36, 3.2, 2.8, 2.5, 'timber', [214, 198, 170], 'slate'], [-21.5, -32.5, 3, 2.8, 2.5, 'timber', [222, 206, 178], 'thatch'], [-20, -41.5, 3, 2.8, 2.5, 'stone', 0, 'slate'], [23, -33.5, 3.2, 2.8, 2.6, 'timber', [226, 208, 182], 'tile'], [26.5, -39, 3, 2.8, 2.5, 'stone', 0, 'thatch'], [20.5, -40.5, 3, 2.8, 2.5, 'timber', [214, 196, 170], 'slate'], [8, -35, 3, 2.8, 2.5, 'timber', [230, 214, 186], 'thatch'], [-31, -28, 3, 2.8, 2.4, 'timber', [214, 198, 170], 'thatch'], [-18, -37, 3, 3, 2.5, 'timber', [190, 180, 170], 'slate'], [19, -35, 3, 2.8, 2.5, 'stone', 0, 'thatch'],
  [-23, -3.5, 3.2, 3, 2.5, 'timber', [176, 160, 130], 'thatch'], [-32, -18, 3, 2.8, 2.4, 'timber', [170, 150, 124], 'thatch'], [-22, -24, 3.2, 3, 2.5, 'timber', [186, 170, 140], 'thatch'],
  [-15, 39, 3.2, 3, 2.3, 'stone', [176, 150, 116], 'thatch'], [3, 41, 3, 3, 2.3, 'stone', [186, 160, 124], 'thatch'],
  [12, 20, 3.4, 3, 2.7, 'timber', [214, 196, 168], 'tile'], [-13, 25, 3.2, 3, 2.6, 'timber', [214, 200, 180], 'thatch'], [-14, -8, 3.2, 3, 2.7, 'timber', [210, 190, 170], 'tile'],
];
const WINS = () => [{ face: 'y', at: .28 }, { face: 'y', at: .72, shutter: PAL.sage, flowers: [[236, 140, 150], [250, 226, 130], [244, 240, 226]] }, { face: 'x', at: .5 }];
const LAMPS = [[15, -.8], [20.8, 5], [-13, -13], [-23, -12], [0, -24], [1, -33], [3.4, -38.6], [-5.2, 29], [-6.9, 40]];
PATHS.push([[-12.5, -38.4], [-9.4, -35.8], [-3.4, -35.4], [.6, -32.6]]);    // the track up to the camp
for (const [u, v, , d] of HOMES) {
  let bu = 0, bv = 0, bd = 1e9; const fu = u + d * .3, fv = v + d * .95;
  for (const p of PATHS) for (let k = 0; k + 1 < p.length; k++) for (let q = 0; q <= 16; q++) {
    const a = p[k][0] + (p[k + 1][0] - p[k][0]) * q / 16, b = p[k][1] + (p[k + 1][1] - p[k][1]) * q / 16, e = Math.hypot(a - fu, b - fv);
    if (e < bd) { bd = e; bu = a; bv = b; }
  }
  if (bd < 16) PATHS.push([[fu, fv], [bu, bv]]);
}
// the bits that make a house a home: picket gate, flowers, and something particular in the yard
function cottageYard(scene, sky, x, y, w, d, k) {
  const fy = y + d / 2 + 1.1, xl = x - w / 2 - .3, xr = x + w / 2 + .3, white = [236, 228, 208];
  for (const [a, b] of [[xl, x - .55], [x + .55, xr]]) { fenceLine([[a, fy], [b, fy]], white); sky.push({ x0: a, y0: fy - .08, x1: b, y1: fy + .08 }); }
  const blooms = [[236, 120, 150], [250, 220, 110], [190, 130, 230], [250, 246, 240], [240, 150, 90]];
  for (let q = 0; q < 18; q++) { const a = xl + .2 + hash(k, q) * (xr - xl - .4); if (Math.abs(a - x) < .7) continue; const b = y + d / 2 + .3 + hash(q, k) * .55; capsule([a, b, 0], [a, b, .16], .02, .02, () => [90, 130, 70], 'solid'); sphere(a, b, .2, .075, blooms[(q + k) % 5], 'solid'); }
  const yx = xr + .75, yy = y + .2;
  if (k % 4 === 0) { for (let q = 0; q < 3; q++) capsule([yx - .5, yy + q * .2 - .2, .12], [yx + .5, yy + q * .2 - .2, .12], .1, .1, () => [150, 104, 66], 'solid'); capsule([yx - .5, yy - .1, .3], [yx + .5, yy - .1, .3], .1, .1, () => [132, 92, 60], 'solid'); }
  else if (k % 4 === 1) { box(yx - .22, yy - .22, .3, yx + .22, yy + .22, .75, [226, 196, 120], .4); box(yx - .3, yy - .3, .75, yx + .3, yy + .3, .85, PAL.wood, .4); for (const a of [-.16, .16]) capsule([yx + a, yy, 0], [yx + a, yy, .3], .03, .03, () => PAL.woodDark, 'solid'); }
  else if (k % 4 === 2) { barrel(yx, yy, .7); pumpkin(yx + .1, yy + .75, .75); }
  else { for (const a of [-.6, .6]) capsule([yx + a, yy, 0], [yx + a, yy, 1.25], .04, .04, () => PAL.woodDark, 'solid'); capsule([yx - .6, yy, 1.2], [yx + .6, yy, 1.2], .012, .012, () => [220, 210, 190], 'solid'); [[236, 120, 120], [120, 170, 220], [250, 240, 220]].forEach((col, q) => quad([yx - .42 + q * .32, yy, .72], [.24, 0, 0], [0, 0, .46], (s, t, o) => { o.c = col; o.flat = true; }, false, [0, 1, 0])); }
  sky.push({ cx: yx, cy: yy, r: .75 });
}
function alpineLife(scene, sky) {
  // a waterfall spilling down the big peak into a clear little tarn
  const water = [[150, 206, 232], [210, 236, 246], [120, 180, 216]];
  let prev = null;
  for (let q = 0; q <= 34; q++) {
    const u = 9.9 + q * .042 + Math.sin(q * .5) * .3, v = -46.6 + q * .165, [x, y] = at(u, v), p = [x, y, highUV(u, v) + .07];
    if (prev) capsule(prev, p, .17, .17, () => water[q % 3], 'solid');
    prev = p;
  }
  const [px, py] = at(11.3, -40.4);
  disc(px, py, .02, 1.9, (a, b, o) => { const r = Math.hypot(a, b); o.flat = true; if (r > 1.62) { o.c = [150, 146, 136]; return; } o.c = r < .9 ? [56, 118, 150] : [84, 150, 172]; o.kind = K_WATER; });
  sky.push({ cx: px, cy: py, r: 1.95 });
  for (let k = 0; k < 13; k++) { const a = k / 13 * 6.283 + .2; if (k % 2) sphere(px + Math.cos(a) * 1.9, py + Math.sin(a) * 1.9, .1, .17 + hash(k, 4) * .1, [150, 146, 140], 'rough'); }
  for (let k = 0; k < 6; k++) { const a = hash(k, 61) * 6.28; sphere(px - .4 + Math.cos(a) * .35, py - 1.1 + Math.sin(a) * .25, .12, .12, [244, 250, 252], 'solid'); }
  // bunting across the road up, strung between two tall poles
  { const [ax, ay] = at(-1.4, -36), [bx, by] = at(3.8, -36.6), cols = [[220, 80, 80], [240, 196, 90], [90, 170, 130], [100, 150, 220], [230, 130, 180]];
    for (const [x, y] of [[ax, ay], [bx, by]]) { capsule([x, y, 0], [x, y, 2.6], .05, .04, () => PAL.woodDark, 'solid'); sky.push({ cx: x, cy: y, r: .2 }); }
    for (let q = 0; q < 16; q++) { const t = q / 15, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = 2.5 - Math.sin(t * Math.PI) * .55; quad([x - .12, y, z], [.24, (by - ay) / 15 * .4, 0], [.12, 0, -.3], (s, u, o) => { o.c = cols[q % 5]; o.flat = true; }, true, [0, 1, 0]); } }
  // cairns, drystone walls and hay on the alpine meadow
  for (const [u, v] of [[-5, -34.6], [6.4, -35], [20.6, -41]]) { const [x, y] = at(u, v); for (let q = 0; q < 4; q++) sphere(x + (q % 2) * .05, y, .14 + q * .24, .27 - q * .05, [150 - q * 8, 146 - q * 8, 138 - q * 6], 'rough'); sky.push({ cx: x, cy: y, r: .4 }); }
  for (const [u0, v0, u1, v1] of [[-16, -33.6, -9.5, -34.4], [7.5, -33.8, 14, -33.2]]) { const n = 26; for (let q = 0; q <= n; q++) { const t = q / n, [x, y] = at(u0 + (u1 - u0) * t, v0 + (v1 - v0) * t); sphere(x, y, .14 + (q % 2) * .06, .17, [136 + (q * 7) % 26, 132 + (q * 5) % 22, 124 + (q * 3) % 18], 'rough'); sky.push({ cx: x, cy: y, r: .25 }); } }
  for (const [u, v] of [[-13.5, -37], [-14.8, -36.2]]) { const [x, y] = at(u, v); hayBale(x, y); sky.push({ cx: x, cy: y, r: .7 }); }
  // wildflowers in drifts
  const blooms = [[244, 150, 186], [250, 226, 120], [190, 150, 240], [252, 250, 244], [120, 180, 240]];
  for (let k = 0; k < 760; k++) {
    const u = (hash(k, 71) * 2 - 1) * 33, v = -33 - hash(k, 72) * 25; if (noise(u * .3 + 4, v * .3) < .5 || isleF(u, v) > .9 || highUV(u, v) > .6 || pathDist(u, v) < 1.2) continue;
    const [x, y] = at(u, v), z = highUV(u, v); if (inHarbour(x, y, 1)) continue;
    capsule([x, y, z], [x, y, z + .13], .016, .016, () => [90, 132, 70], 'solid'); sphere(x, y, z + .16, .06, blooms[k % 5], 'solid');
  }
}
function buildFrontier(scene, sky, clear, pal, trees) {
  // the harbour: a long plank pier, moored boats, bollards and crates of the day's catch
  const hc = HARBOUR, y0 = hc.y - .75, y1 = hc.y + .75;
  quad([PIER.x0, y0, .03], [PIER.x1 - PIER.x0, 0, 0], [0, 1.5, 0], (s, t, o) => { o.c = Math.floor(s * 3.2) % 2 ? PAL.wood : PAL.woodLight; o.flat = true; o.kind = K_PATH; if ((s * 3.2) % 1 < .1) o.c = PAL.woodDark; }, false, [0, 0, 1]);
  for (let x = PIER.x0 + .5; x < PIER.x1; x += 2.1) for (const y of [y0, y1]) capsule([x, y, -.3], [x, y, .62], .09, .08, () => PAL.woodDark, 'solid');
  for (let x = PIER.x0 + 1.5; x < PIER.x1; x += 4.2) { lantern(scene, x, y1, 1.05, .9); sky.push({ cx: x, cy: y1 + .1, r: .1 }); }
  boat(scene, hc.x - 1, hc.y + 3.3, 2.4, [120, 76, 52], [176, 64, 60]);
  boat(scene, hc.x - 2.6, hc.y - 3.2, 1.9, [86, 104, 130], [230, 180, 80]);
  boat(scene, hc.x + 3.8, hc.y + .6, 2.8, [96, 60, 48], [60, 90, 150]);
  boat(scene, hc.x + 1.5, hc.y - 5, 1.2, [150, 120, 84], 0);
  for (const [u, v, s] of [[19.6, .8, 1], [20.4, 1.8, .8], [19, -3.6, .9]]) { const [x, y] = at(u, v); crate(x, y, s); sky.push({ cx: x, cy: y, r: .5 }); }
  { const [x, y] = at(17.6, 4.4); barrel(x, y, .85, [140, 90, 60]); sky.push({ cx: x, cy: y, r: .4 }); }
  // the warden's beacon: a ring of stones and a little fire, under the mountains
  { const [nx, ny] = at(-2.5, -41.5);
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; boulder(nx + Math.cos(a) * 2.2, ny + Math.sin(a) * 2.2, .55 + hash(k, 8) * .3); sky.push({ cx: nx + Math.cos(a) * 2.2, cy: ny + Math.sin(a) * 2.2, r: .55 }); }
    for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283, r = 1.05 + hash(k, 9) * .3; capsule([nx + Math.cos(a) * r, ny + Math.sin(a) * r, .1], [nx + Math.cos(a + .7) * (r - .3), ny + Math.sin(a + .7) * (r - .3), .24], .08, .06, () => [110, 84, 60], 'rough'); }
    EMIT = 1; sphere(nx, ny, .22, .16, [250, 170, 80], 'solid'); EMIT = 0;
    addLight(scene, nx, ny, .7, 5, .7, .3); scene.spots.nest = { x: nx, y: ny }; scene.props.nest = { x: nx, y: ny }; }
  highlands(scene);
  alpineLife(scene, sky);
  basecamp(scene, sky);
  // the nomad's camp, out where the path gives up
  { const [x, y] = at(-11, 42); PICK = 83; tent(scene, x, y, [150, 90, 70]); PICK = 0; sky.push({ cx: x, cy: y, r: 1.3 }); scene.doors.push({ id: 'nomad', x: x + 1.95, y, face: 'x', pick: 83 }); const [fx, fy] = at(-9, 41.6); campfire(scene, fx, fy); sky.push({ cx: fx, cy: fy, r: .5 }); }
  { const [x, y] = at(-25, -13); for (let k = 0; k < 11; k++) { const a = k / 11 * 6.283; glowcap(scene, x + Math.cos(a) * 1.7, y + Math.sin(a) * 1.7, [120, 220, 200]); } addLight(scene, x, y, .6, 4.5, .55, .2); }
  // lamps and houses
  for (const [u, v] of LAMPS) { const [x, y] = at(u, v); lampPost(scene, x, y); sky.push({ cx: x, cy: y, r: .3 }); }
  HOMES.forEach(([u, v, w, d, h, walls, wall, roof], hk) => {
    const [x, y] = at(u, v); if (!clear(x, y, Math.max(w, d) * .45)) return;
    // every cottage that stands can be gone into: its room is HOME_ROOMS[hk] in rooms.js
    const box = house(scene, { id: 'h' + hk, pick: 50 + hk, x, y, w, d, h, walls, wall: wall || undefined, roof, door: { face: 'y', at: .5 }, windows: WINS(), chimney: { at: .3, side: 1 } });
    sky.push({ x0: box.x0 - .25, y0: box.y0 - .25, x1: box.x1 + .25, y1: box.y1 + .25 });
    cottageYard(scene, sky, x, y, w, d, (u * 3 + v * 5 + 400) | 0);
  });
  // nature: big old trees in the woods, pines by the peaks, dead snags and bones in the wastes, glowcaps and stones everywhere
  const put = [];
  const plant = (t) => { put.push(t); trees.push(t); };
  for (let n = 0; n < 12000 && put.length < 300; n++) {
    const u = (hash(n, 21) * 2 - 1) * EXT.ru, v = (hash(n, 22) * 2 - 1) * EXT.rv, r0 = regionOf(u, v);
    if (r0 === 'village' || isleF(u, v) > .9 || (r0 === 'wastes' && hash(n, 25) > .1)) continue;
    const [x, y] = at(u, v), s = (r0 === 'woods' ? .95 + hash(n, 24) * .75 : .6 + hash(n, 24) * .4) * (r0 === 'peaks' ? alpineScale(v) : 1), pine = r0 === 'peaks' || (r0 === 'woods' ? hash(n, 23) > .6 : hash(n, 23) > .85);
    const r = (pine ? 1.1 : 1.7) * s * (r0 === 'woods' ? .72 : 1);
    if (!clear(x, y, r)) continue;
    plant({ x, y, r, pine, s, n, dead: r0 === 'wastes' });
  }
  // the alpine forest: clumps all across the top of the island, in front of and behind the range
  let alp = 0;
  for (let n = 0; n < 12000 && alp < 360; n++) {
    const u = (hash(n, 81) * 2 - 1) * 37, v = -29 - hash(n, 82) * 31;
    if (isleF(u, v) > .9 || noise(u * .2 + 8, v * .2) < .36) continue;
    const [x, y] = at(u, v), pine = hash(n, 83) < (v < -37 ? .93 : .78), s = (.55 + hash(n, 84) * .6) * alpineScale(v), r = (pine ? .85 : 1.35) * s;
    if (!clear(x, y, r)) continue;
    plant({ x, y, r, pine, s, n: n + 20000 }); alp++;
  }
  put.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const t of put) {
    if (t.dead) deadTree(t.x, t.y, t.s * 1.1, t.n);
    else if (t.pine) growPine(t.x, t.y, t.s, PINE);
    else growTree(scene, t.x, t.y, t.s, t.s > 1.3 ? 340 : 220, t.n * 97, pal[t.n % pal.length]);
    sky.push({ cx: t.x, cy: t.y, r: .45 * t.s });
  }
  for (let k = 0; k < 520; k++) {       // bushes, ferns and stones in every gap up top
    const u = (hash(k, 91) * 2 - 1) * 37, v = -29 - hash(k, 92) * 31; if (isleF(u, v) > .9) continue;
    const [x, y] = at(u, v); if (!clear(x, y, .35)) continue;
    if (hash(k, 93) > .3) { const g = [[70, 118, 66], [96, 140, 72], [52, 96, 62]][k % 3]; for (let j = 0; j < 5; j++) sphere(x + (hash(k, j) - .5) * .55, y + (hash(j, k) - .5) * .55, .2, .24, mixc(g, [160, 180, 90], (j % 3) * .15), 'rough'); castShadow(x, y, .25, .45); }
    else boulder(x, y, .3 + hash(k, 94) * .35);
    sky.push({ cx: x, cy: y, r: .4 });
  }
  for (let k = 0; k < 340; k++) {
    const u = (hash(k, 31) * 2 - 1) * EXT.ru, v = (hash(k, 32) * 2 - 1) * EXT.rv, r0 = regionOf(u, v);
    if (r0 === 'village' && isleF(u, v) < .7) continue;
    const [x, y] = at(u, v); if (!clear(x, y, .4)) continue;
    const q = hash(k, 33);
    if (r0 === 'woods' && q > .55) { glowcap(scene, x, y, [[120, 220, 200], [190, 140, 240], [240, 180, 110]][k % 3], .8 + q * .5); if (k % 9 === 0) addLight(scene, x, y, .5, 2.6, .45, .2); continue; }
    if (r0 === 'wastes' && q > .8) { capsule([x - .4, y, .06], [x + .4, y + .1, .06], .06, .05, () => [226, 216, 190], 'solid'); sphere(x + .5, y + .1, .1, .12, [226, 216, 190], 'solid'); continue; }
    const s = r0 === 'peaks' ? .5 + q * .9 : .3 + q * .5; boulder(x, y, s); sky.push({ cx: x, cy: y, r: s * .75 });
  }
}

/* ---------- beasts of the new lands ---------- */
const rg = () => regionNow();
Object.assign(BEASTS, {
  pup: { name: 'Harbour Selkie', rarity: 1, when: () => rg() === 'docks', speed: .7, lore: 'A seal who has heard good things about land.' },
  rockling: { name: 'Rockling', rarity: 1, when: () => rg() === 'peaks', speed: .4, lore: 'Sits very still. Then you notice it has moved.' },
  stag: { name: 'Glowhorn Stag', rarity: 3, when: m => rg() === 'woods' && m.night > .3, speed: 1.1, size: 1.5, lore: 'Its antlers are the only map of the Whisperwood.' },
  skink: { name: 'Dune Skink', rarity: 0, when: () => rg() === 'wastes', speed: 1.6, lore: 'Swims through sand. Refuses to discuss it.' },
});
Object.assign(BEAST_ICONS, {
  pup: [{ a: [120, 130, 140], b: [40, 40, 50] }, ['.....', '.aaa.', 'ababa', 'aaaaa', '.a.a.']],
  rockling: [{ a: [130, 126, 124], b: [240, 200, 90] }, ['.aaa.', 'abaab', 'aaaaa', 'aaaaa', '.a.a.']],
  stag: [{ a: [120, 90, 66], b: [130, 240, 220] }, ['b.b.b', '.bbb.', '.aa..', '.aaaa', '.a..a']],
  skink: [{ a: [206, 170, 110], b: [150, 90, 60] }, ['.....', 'a....', 'aabab', '.aaaa', '..a.a']],
});
Object.assign(BEAST_DRAW, {
  pup(o) { const { add, C, P, hop } = o, c = [120, 130, 140], z = hop || 0; add(P(-.2, 0, .16 + z), P(.16, 0, .22 + z), .14, .17, C(c)); const h = P(.34, 0, .34 + z); add(h, h, .14, .14, C(c)); for (const s of [-1, 1]) add(P(.02, s * .16, .06), P(.1, s * .3, .03), .05, .03, C([90, 100, 110])); add(P(-.32, 0, .1), P(-.46, 0, .12), .08, .02, C([90, 100, 110])); },
  rockling(o) { const { add, sglow, C, P, t } = o, l = Math.sin(t * 3) * .03; add(P(0, 0, .2), P(0, 0, .3), .24, .2, C([130, 126, 124])); add(P(.05, -.1, .44), P(.05, -.1, .44), .08, .08, C([104, 100, 104])); for (const s of [-1, 1]) { sglow?.(...P(.2, s * .08, .34 + l), .03, [240, 200, 90]); add(P(0, s * .24, .05), P(0, s * .24, .05), .1, .1, C([104, 100, 104])); } },
  stag(o) { const { add, sglow, C, P, t, c } = o, co = [120, 90, 66], st = Math.sin(c.walk || 0) * .1 * (c.moving || 0); for (const [a, s] of [[.3, -1], [.3, 1], [-.3, -1], [-.3, 1]]) add(P(a + st * s, s * .12, 0), P(a, s * .12, .55), .05, .05, C(co)); add(P(.3, 0, .68), P(-.32, 0, .66), .19, .17, C(co)); const h = P(.6, 0, 1); add(P(.36, 0, .76), h, .1, .08, C(co)); add(h, h, .12, .12, C(co)); for (const s of [-1, 1]) for (let q = 0; q < 3; q++) sglow?.(...P(.55 - q * .05, s * (.1 + q * .12), 1.14 + q * .15), .04, [130, 240, 220]); },
  skink(o) { const { add, C, P, t, c } = o, co = [206, 170, 110], w = Math.sin(t * 12) * .08 * (c.moving || 0); add(P(.2, 0, .07), P(-.16, w, .07), .08, .07, C(co)); add(P(-.16, w, .07), P(-.42, -w, .04), .05, .012, C([150, 90, 60])); const h = P(.28, 0, .1); add(h, h, .08, .08, C(co)); },
});
/* ---------- finer hats ---------- */
function bentCone(o, segs, base, rad, col, lean, tipLean) {
  const { at, add, k } = o; let prev = at(0, base), r = rad;
  for (let q = 1; q <= segs; q++) {
    const u = q / segs, a = lean * u + tipLean * Math.pow(u, 3.2), z = base + .78 * u - tipLean * .22 * Math.pow(u, 3), next = at(a, z), r2 = rad * Math.pow(1 - u, .8) + .02;
    add(prev, next, r * k, r2 * k, () => q % 3 === 1 ? col : col.map(v => Math.max(0, v - 12))); prev = next; r = r2;
  }
  return prev;
}
function wavyBrim(o, r, z, col) {
  const { head, add, k, t } = o;
  for (let a = 0; a < 6.283; a += .2) { const w = Math.sin(a * 3 + 1) * .05 + Math.sin(a * 5) * .025, R = r + w * .4, p = [head[0] + Math.cos(a) * R * k, head[1] + Math.sin(a) * R * k, head[2] + (z + w) * k]; add(p, p, .1 * k, .1 * k, () => col); }
}
Object.assign(HAT_MORE, {
  wizard(o) {
    const { at, add, k, C, look, S, t } = o, col = look.hatColor || [80, 56, 128], band = look.hatBand || [236, 196, 90];
    wavyBrim(o, .48, .24, col);
    const tip = bentCone(o, 11, .33, .25, col, .1, .42);
    add(at(0, .33), at(0, .37), .255 * k, .25 * k, C(band));
    add(tip, tip, .055 * k, .055 * k, C(band));                                            // a brass bell on the droopy tip
    for (const [a, b, z] of [[-.2, .1, .5], [-.12, -.13, .68], [-.05, .08, .84], [-.28, -.04, .38]]) add(S(a, b, z), S(a, b, z), .035 * k, .035 * k, C([250, 226, 130]));   // stitched stars
    const m = S(-.3, .12, .3); add(m, m, .05 * k, .05 * k, C([240, 244, 250]));
  },
  witch(o) {
    const { at, add, k, C, look, S } = o, col = look.hatColor || [44, 36, 56], band = look.hatBand || [140, 80, 170];
    wavyBrim(o, .58, .22, col); wavyBrim(o, .44, .24, col.map(v => v + 12));
    const tip = bentCone(o, 12, .33, .23, col, .3, .34);
    add(at(.02, .33), at(.02, .37), .24 * k, .235 * k, C(band));
    const b0 = S(-.24, 0, .35);                                                               // a square silver buckle
    for (const [a, b] of [[-.07, -.08], [.07, -.08], [.07, .08], [-.07, .08]]) add(S(-.25, b, .35 + a), S(-.25, b, .35 + a), .025 * k, .025 * k, C([214, 216, 224]));
    add(b0, b0, .02 * k, .02 * k, C(band));
    add(S(.08, .24, .44), S(.14, .2, .56), .06 * k, .05 * k, C([90, 60, 110]));               // a stitched patch
    add(tip, tip, .04 * k, .04 * k, C([230, 180, 60]));
  },
  wander(o) {
    const { at, add, k, C, look, head, t, S } = o, col = look.hatColor || [70, 110, 110], band = look.hatBand || [236, 196, 90];
    wavyBrim(o, .6, .24, col);
    add(at(0, .32), at(.06, .68), .25 * k, .15 * k, C(col));
    add(at(0, .34), at(.01, .38), .255 * k, .25 * k, C(band));
    for (let a = .3; a < 6.2; a += .85) { const p = [head[0] + Math.cos(a) * .62 * k, head[1] + Math.sin(a) * .62 * k, head[2] + .2 * k]; add(p, [p[0], p[1], p[2] - (.12 + Math.sin(t * 2 + a) * .02) * k], .022 * k, .03 * k, C(a < 3 ? band : [190, 70, 90])); }
    add(S(.3, .3, .36), S(.42, .42, .72), .04 * k, .012 * k, C([190, 90, 170]));
  },
  veil(o) {
    const { at, add, k, C, look, S, t } = o, col = look.hatColor || [150, 110, 80], band = look.hatBand || [200, 170, 90];
    add(at(.04, .06), at(.04, .12), .37 * k, .37 * k, C(col));
    add(at(.04, .3), at(.04, .34), .29 * k, .24 * k, C(band));
    for (const s of [-1, 1]) add(S(.26, s * .24, -.05), S(.4, s * .25 + Math.sin(t * 1.4 + s) * .03, -.5), .1 * k, .13 * k, C(col));
    add(S(-.2, 0, -.15), S(-.27, 0, -.3), .22 * k, .23 * k, C(col));          // the veil across the mouth
  },
  sailor(o) { const { at, add, k, C, look } = o, c = look.hatColor || [240, 240, 240], b = look.hatBand || [40, 60, 110]; add(at(0, .2), at(0, .28), .32 * k, .26 * k, C(c)); add(at(0, .17), at(0, .2), .32 * k, .32 * k, C(b)); },
});

/* ---------- region helpers ---------- */
function regionNow() { if (G.scene?.id !== 'village') return 'indoors'; const [u, v] = toUV(G.player.x, G.player.y); return regionOf(u, v); }
function frontierFinds(t, m) {
  const r = regionNow();
  if (r === 'docks') t.push(['seaglass', 9], ['shell', 8], ['sardine', 6], ['pearl', 1]);
  if (r === 'woods') t.push(['fernseed', 3], ['shroom', 9], ['acorn', 8], ['clover', 2]);
  if (r === 'wastes') t.push(['fossil', 2.5], ['bonecharm', 5]);
  if (r === 'peaks') t.push(['amethyst', 1.6], ['pinecone', 5]);
  if (r !== 'village') for (const row of t) if (['apple', 'bread', 'marble', 'acorn', 'horseshoe', 'feather'].includes(row[0])) row[1] *= .3;
}

/* ---------- cards: pixel parchment over the canvas ---------- */
const mlord = () => (G.baseLook || BOOT_AVATAR()).title || "m'lord";
const Lord = () => ({ "m'lord": 'lord', "m'lady": 'lady' })[mlord()] || 'liege';
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
// cards fold away over a beat rather than vanishing; G.card clears at once so the village takes taps again straight away
function closeCard(quiet) {
  const c = G.card, s = G.scrim; G.card = G.scrim = null;
  if (!c) return;
  if (!quiet) BR({ type: 'card', open: ARR.on });
  c.classList.add('out'); if (s) s.classList.add('out');
  setTimeout(() => { c.remove(); if (s) s.remove(); }, 150);
}
// a little storybook rule: dots either side of a diamond
function flourish() {
  const s = 2, rows = ['..............g..............', 'g.g.g.g.g.g.ggggg.g.g.g.g.g.g', '..............g..............'], c = el('canvas', 'flourish'); c.width = rows[0].length * s; c.height = rows.length * s;
  const x = c.getContext('2d'); x.fillStyle = '#b07a33';
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'g') x.fillRect(i * s, j * s, s, s); }));
  return c;
}
function openCard(title, sub, cls) {
  closeCard(true);
  BR({ type: 'card', open: true });
  const c = el('div', cls ? 'card ' + cls : 'card'), scrim = el('div', 'scrim');
  c.append(el('h2', '', title), flourish());
  if (sub) c.append(el('p', 'sub', sub));
  const body = el('div', 'body'); c.append(body);
  const acts = el('div', 'acts'); c.append(acts);
  c.addEventListener('pointerdown', e => e.stopPropagation());
  document.body.append(scrim, c); G.card = c; G.scrim = scrim;
  BR({ type: 'sfx', name: 'open' });
  return { c, body, acts, sub: c.querySelector('.sub') };
}
function act(acts, label, fn, gold) { const b = el('button', gold ? 'pb gold' : 'pb', label); b.onclick = () => { BR({ type: 'haptic', style: 'light' }); fn(); }; acts.append(b); return b; }
function iconOf(id, s = 5) {
  const it = ITEMS[id], rows = it?.icon || [], c = el('canvas'); c.width = 5 * s; c.height = rows.length * s; const x = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => { const col = it.pal?.[ch]; if (col) { x.fillStyle = `rgb(${col})`; x.fillRect(i * s, j * s, s, s); } }));
  return c;
}
function release(a) { if (a) { a.hold = false; a.wait = 2; } }

/* ---------- the nomad's bowl ---------- */
const NOMAD_GIFTS = ['n_glass', 'n_mirage', 'n_tooth'];
function nomadCard(a) {
  const { body, acts, sub } = openCard('The Aimless Nomad', 'Holds out a chipped bowl and says nothing at all.');
  const give2 = (value, line, doTake) => {
    if (!doTake()) return;
    const w = stockWindow(), ready = ECON.nomadW !== w, p = Math.min(.85, .02 + Math.pow(value / 500, 1.2) * .5);
    if (ready && Math.random() < p) {
      ECON.nomadW = w; const id = NOMAD_GIFTS[value > 800 ? 1 + (Math.random() * 2 | 0) : Math.random() * 3 | 0]; give(id);
      BR({ type: 'sfx', name: 'spell' }); BR({ type: 'haptic', style: 'success' }); burst(G.player.x, G.player.y, 1.6, RARITY_COLOR[4], 28);
      econChanged({ found: id }); closeCard(); release(a); return;
    }
    BR({ type: 'sfx', name: 'chime' }); burstHearts(G.player.x, G.player.y, 1.9);
    if (sub) sub.textContent = line; econChanged({}); draw();
  };
  const draw = () => {
    body.textContent = '';
    const row = el('div', 'row');
    for (const n of [10, 50, 250, 1000]) { const b = el('button', 'pb gold', `${n} crowns`); b.disabled = ECON.crowns < n; b.onclick = () => give2(n, 'The bowl is a little heavier. The Nomad nods at the horizon.', () => { if (ECON.crowns < n) return false; ECON.crowns -= n; return true; }); row.append(b); }
    body.append(row, el('p', 'sub', 'Or give something from your satchel:'));
    const grid = el('div', 'grid');
    for (const [id, n] of Object.entries(ECON.inv)) {
      const it = ITEMS[id]; if (!it || !(n > 0)) continue;
      const b = el('button', 'tile'); b.append(iconOf(id, 6)); b.title = it.name;
      b.onclick = () => give2(it.value, `${it.name}, gone into the dust. Something shifts behind the veil.`, () => { if (!take(id)) return false; if (it.kind === 'furniture' && !(ECON.inv[id] > 0)) { ECON.placed = ECON.placed.filter(p => p !== id); refreshHome(); } return true; });
      grid.append(b);
    }
    body.append(grid);
  };
  draw();
  act(acts, 'Walk on', () => { closeCard(); release(a); });
}

/* ---------- mini-games ---------- */
function game_lights(n, done) {
  const { body, acts, sub } = openCard('The Rune Lamps', 'Light every lamp. Each press flips its neighbours too.');
  const cells = Array(n * n).fill(true);
  const flip = i => { for (const j of [i, i - n, i + n, i % n ? i - 1 : -1, (i + 1) % n ? i + 1 : -1]) if (j >= 0 && j < n * n) cells[j] = !cells[j]; };
  for (let q = 0; q < n * 3; q++) flip(Math.random() * n * n | 0);
  if (cells.every(Boolean)) flip(0);
  const g = el('div', 'board'); g.style.gridTemplateColumns = `repeat(${n}, 1fr)`; body.append(g);
  let moves = 0;
  const btns = cells.map((_, i) => { const b = el('button', 'lamp'); b.onclick = () => { flip(i); moves++; paint(); BR({ type: 'sfx', name: 'tap' }); if (cells.every(Boolean)) { sub.textContent = 'All aglow!'; setTimeout(() => { closeCard(); done(true); }, 500); } }; g.append(b); return b; });
  const paint = () => cells.forEach((v, i) => btns[i].classList.toggle('on', v));
  paint();
  act(acts, 'Give up', () => { closeCard(); done(false); });
}
function game_chant(len, done, title = 'The Chant') {
  const { body, acts, sub } = openCard(title, 'Watch the runes, then tap them in the same order.');
  const glyphs = ['seaglass', 'fossil', 'ink', 'amethyst'], seq = Array.from({ length: len }, () => Math.random() * 4 | 0);
  const g = el('div', 'board'); g.style.gridTemplateColumns = 'repeat(2, 1fr)'; body.append(g);
  let at_ = 0, showing = true, alive = true;
  const btns = glyphs.map((id, i) => { const b = el('button', 'lamp rune'); b.append(iconOf(id, 7)); g.append(b); b.onclick = () => press(i); return b; });
  const flash = i => { btns[i].classList.add('on'); BR({ type: 'sfx', name: 'tap' }); setTimeout(() => btns[i].classList.remove('on'), 320); };
  const press = i => {
    if (showing || !alive) return; flash(i);
    if (seq[at_] !== i) { sub.textContent = 'Not quite. Watch again.'; showing = true; at_ = 0; BR({ type: 'haptic', style: 'light' }); return setTimeout(play, 800); }
    if (++at_ === seq.length) { alive = false; sub.textContent = 'Perfect!'; setTimeout(() => { closeCard(); done(true); }, 500); }
  };
  const play = () => { let k = 0; const tick = () => { if (!alive || !G.card) return; if (k >= seq.length) { showing = false; sub.textContent = 'Your turn.'; return; } flash(seq[k++]); setTimeout(tick, 620); }; tick(); };
  setTimeout(play, 500);
  act(acts, 'Give up', () => { alive = false; closeCard(); done(false); });
}
function game_match(pairs, done) {
  const { body, acts, sub } = openCard('Lost and Found', 'Turn two tiles at a time and pair them all.');
  const pool = Object.keys(ITEMS).filter(k => ITEMS[k].icon).sort(() => Math.random() - .5).slice(0, pairs);
  const deck = [...pool, ...pool].sort(() => Math.random() - .5);
  const g = el('div', 'board'); g.style.gridTemplateColumns = `repeat(${pairs > 6 ? 4 : 3}, 1fr)`; body.append(g);
  let first = null, lock = false, left = pairs;
  deck.forEach(id => {
    const b = el('button', 'lamp'); g.append(b); const ic = iconOf(id, 6); ic.style.visibility = 'hidden'; b.append(ic); b.id_ = id;
    b.onclick = () => {
      if (lock || b.classList.contains('on') || b === first) return;
      ic.style.visibility = 'visible'; b.classList.add('peek'); BR({ type: 'sfx', name: 'tap' });
      if (!first) { first = b; return; }
      if (first.id_ === id) { b.classList.add('on'); first.classList.add('on'); first = null; if (!--left) { sub.textContent = 'All paired!'; setTimeout(() => { closeCard(); done(true); }, 500); } return; }
      lock = true; const a = first; first = null;
      setTimeout(() => { for (const x of [a, b]) { x.classList.remove('peek'); x.firstChild.style.visibility = 'hidden'; } lock = false; }, 700);
    };
  });
  act(acts, 'Give up', () => { closeCard(); done(false); });
}

/* ---------- villagers' tasks ---------- */
const GIVERS = ['pip', 'bryn', 'barnaby', 'bram', 'clank', 'wren', 'hilda', 'fennick', 'pim', 'mags', 'gearwin', 'tobias', 'odette', 'marisol', 'moss', 'ignatia', 'hobb', 'tamsin'];
const HUNT_SPOTS = [['woods', 'somewhere in the Whisperwood'], ['docks', 'down by the harbour'], ['wastes', 'out in the Wastes'], ['peaks', 'high among the peaks']];
const BRINGS = [['acorn', 'shell', 'apple', 'cheese', 'seaglass', 'bonecharm', 'horseshoe'], ['fossil', 'fernseed', 'ink', 'seaglass'], ['amethyst', 'pearl', 'm_coin', 'm_bottle']];
const dayNo = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
function quests() {
  const d = dayNo();
  if (ECON.q?.day === d) return ECON.q;
  const r = rngFrom(strHash('q' + d)), givers = {}, pool = [...GIVERS].sort(() => r() - .5).slice(0, 5);
  const pick = a => a[r() * a.length | 0];
  for (const npc of pool) {
    const roll_ = r(), tier = roll_ < .5 ? 0 : roll_ < .86 ? 1 : 2, kind = pick(['lights', 'chant', 'match', 'hunt', 'bring']);
    const q = { npc, tier, kind, state: 'open' };
    if (kind === 'bring') q.item = pick(BRINGS[tier]);
    if (kind === 'hunt') q.spot = pick(HUNT_SPOTS);
    givers[npc] = q;
  }
  ECON.q = { day: d, givers, hunt: null };
  return ECON.q;
}
const questFor = id => quests().givers[id];
const questWaiting = id => { const q = questFor(id); return q && q.state !== 'done'; };
const REWARDS = [[30, 70], [120, 240], [420, 760]];
function questAsk(q) {
  const who = mlord();
  if (q.kind === 'lights') return `The lamps in the old shrine went out, ${who}. Could you set them right?`;
  if (q.kind === 'chant') return `I can never hold this chant in my head, ${who}. Run it with me?`;
  if (q.kind === 'match') return `My whole shelf fell over, ${who}. Help me pair it all back up?`;
  if (q.kind === 'bring') return `I would pay well for ${ITEMS[q.item].name}, ${who}. Have you one to spare?`;
  return `I buried something ${q.spot[1]} and cannot find it, ${who}. Walk about; you will feel it when you are close.`;
}
function reward(q) {
  const [lo, hi] = REWARDS[q.tier], n = Math.round(lo + Math.random() * (hi - lo)); ECON.crowns += n; q.state = 'done';
  let line = `Paid ${n} crowns.`, found = null;
  if (q.tier === 1 && Math.random() < .55) { found = ['ink', 'amethyst', 'fossil', 'fernseed'][Math.random() * 4 | 0]; }
  if (q.tier === 2) found = ['n_glass', 'm_compass', 'm_bottle', 'amethyst'][Math.random() * 4 | 0];
  if (found) { give(found); line = `${n} crowns, and ${ITEMS[found].name}!`; }
  BR({ type: 'sfx', name: 'coin' }); BR({ type: 'haptic', style: 'success' }); burst(G.player.x, G.player.y, 1.6, [236, 196, 90], 18);
  econChanged({ line, used: found || undefined });
}
function runGame(q, a) {
  const after = ok => { if (ok) reward(q); release(a); };
  const t = q.tier;
  if (q.kind === 'lights') game_lights(3 + t, after);
  else if (q.kind === 'chant') game_chant(4 + t * 2, after);
  else game_match(3 + t * 2, after);
}
// returns true if this conversation became a task card instead
function questGate(a) {
  if (a.id === 'nomad') { nomadCard(a); return true; }
  const q = questFor(a.id);
  if (!q || q.state === 'done') return false;
  const tag = ['An easy favour', 'A proper job', 'A hard one, well paid'][q.tier];
  const { body, acts } = openCard(a.name, tag);
  const talk = () => { closeCard(); startTalk(a, true); };
  if (q.kind === 'bring') {
    body.append(el('p', '', questAsk(q)));
    if (ECON.inv[q.item] > 0) act(acts, `Hand over ${ITEMS[q.item].name}`, () => { take(q.item); closeCard(); reward(q); release(a); }, true);
  } else if (q.kind === 'hunt') {
    if (q.state === 'open') { body.append(el('p', '', questAsk(q))); act(acts, 'I will find it', () => { q.state = 'hunting'; const s = huntSpot(q); ECON.q.hunt = s; econChanged({}); closeCard(); release(a); }, true); }
    else body.append(el('p', '', `Still out there, ${q.spot[1]}. I can feel it in my knees.`));
  } else { body.append(el('p', '', questAsk(q))); act(acts, 'Show me', () => { closeCard(); runGame(q, a); }, true); }
  act(acts, 'Just chatting', talk);
  return true;
}
function huntSpot(q) {
  const sc = G.scenes.village;
  for (let n = 0; n < 400; n++) {
    const u = (Math.random() * 2 - 1) * EXT.ru, v = (Math.random() * 2 - 1) * EXT.rv;
    if (regionOf(u, v) !== q.spot[0]) continue;
    const [x, y] = at(u, v), [ci, cj] = navCell(sc.nav, x, y);
    if (navOk(sc.nav, ci, cj)) return { npc: q.npc, x, y };
  }
  return { npc: q.npc, ...sc.spots.anvil };
}
let huntAcc = 0;
function stepHunt(dt) {
  const h = ECON.q?.hunt; if (!h || G.scene.id !== 'village' || G.talking) return;
  huntAcc += dt; const p = G.player, d = Math.hypot(p.x - h.x, p.y - h.y);
  if (d < 1.1) {
    const q = ECON.q.givers[h.npc]; ECON.q.hunt = null;
    burst(h.x, h.y, .5, [236, 196, 90], 26); showLabel('Found it!', h.x, h.y, 1.2);
    if (q) reward(q);
    return;
  }
  if (huntAcc < 3.5 || !p.moving) return; huntAcc = 0;
  if (d < 22) showLabel(d < 4 ? 'Burning hot!' : d < 9 ? 'Warmer...' : d < 15 ? 'A faint tingle' : 'Cold...', p.x, p.y, 2.3);
}
function questLog() {
  const q = quests(), { body, acts } = openCard('Today\'s Errands', 'New favours are asked every morning. Look for a gold "!".');
  for (const g of Object.values(q.givers)) {
    const name = (CAST[g.npc]?.name || g.npc), t = g.kind === 'bring' ? `Bring ${ITEMS[g.item].name}` : g.kind === 'hunt' ? `Dig ${g.spot[1]}` : { lights: 'Fix the rune lamps', chant: 'Learn a chant', match: 'Sort a shelf' }[g.kind];
    const r = el('div', 'quest' + (g.state === 'done' ? ' done' : '')); r.append(el('b', '', name), el('span', '', `${t} · ${['easy', 'proper', 'hard'][g.tier]}${g.state === 'done' ? ' · done' : ''}`)); body.append(r);
  }
  act(acts, 'Close', closeCard);
}

/* ---------- arrange the cottage ---------- */
const WALL_AXIS = { f_painting: 'x', f_banner: 'x', f_lute: 'x', f_bunting: 'x', f_stars: 'x', f_tapestry: 'y' };
const ROOM_FIT = { x0: -3.6, x1: 3.6, y0: -2.6, y1: 2.7 };
const FURN = {};
function layoutOf(id) { ECON.layout = ECON.layout || {}; return ECON.layout[id] || { dx: 0, dy: 0 }; }
function furnBegin(id, on) {
  furnEnd();
  if (!on) return;
  const l = layoutOf(id); ORG = { id, dx: l.dx, dy: l.dy, n: 0, x: 0, y: 0, z: 0 }; ORG_U = l.dx - l.dy; ORG_V = l.dx + l.dy;
}
function furnEnd() { if (ORG) { const o = ORG; FURN[o.id] = { x: o.x / Math.max(1, o.n), y: o.y / Math.max(1, o.n), z: o.z / Math.max(1, o.n) }; ORG = null; ORG_U = ORG_V = 0; } }
function shiftPush(arr) {
  const raw = arr.push;
  arr.push = function (...os) {
    if (ORG) for (const o of os) { if (o.cx != null) { o.cx += ORG.dx; o.cy += ORG.dy; } else if (o.x0 != null) { o.x0 += ORG.dx; o.x1 += ORG.dx; o.y0 += ORG.dy; o.y1 += ORG.dy; } else if (o.x != null) { o.x += ORG.dx; o.y += ORG.dy; } }
    return raw.apply(this, os);
  };
}
const ARR = { on: false, sel: null, bar: null };
const ARR_HINT = 'Tap a piece with a gold mark, then tap where it should go';
const arrangeable = () => ECON.placed.filter(id => FURN[id] && ECON.inv[id] > 0);
function arrange(on) {
  if (on && G.scene?.id !== 'home') return;
  const was = ARR.on;
  ARR.on = !!on; ARR.sel = null;
  if (ARR.bar) { ARR.bar.remove(); ARR.bar = null; }
  // the app's own buttons sit over the bottom of the screen: they stand down while the bar is up
  if (was !== ARR.on) BR({ type: 'card', open: ARR.on || !!G.card });
  if (!on) return;
  const b = el('div', 'bar'); b.append(el('span', '', arrangeable().length ? ARR_HINT : 'Nothing to move yet. Furniture bought at the stalls can be arranged; the bed and desk stay put.'));
  const d = el('button', 'pb gold', 'Done'); d.onclick = () => arrange(false); b.append(d);
  b.addEventListener('pointerdown', e => e.stopPropagation());
  document.body.append(b); ARR.bar = b; ARR.label = b.firstChild;
}
function arrangeTap(sx, sy) {
  const sc = G.scene;
  if (!ARR.sel) {
    let best = null, bd = 30;
    for (const id of ECON.placed) { const f = FURN[id]; if (!f) continue; const l = layoutOf(id), [px, py] = sceneProject(sc, f.x + l.dx, f.y + l.dy, f.z), d = Math.hypot(sx - px, sy - py); if (d < bd) { bd = d; best = id; } }
    if (best) { ARR.sel = best; ARR.label.textContent = `Now tap where the ${ITEMS[best].name} should go`; BR({ type: 'haptic', style: 'light' }); BR({ type: 'sfx', name: 'tap' }); }
    return;
  }
  const id = ARR.sel, f = FURN[id], prev = T; T = sc.t; const g = unproject(sx, sy); T = prev;
  const ax = WALL_AXIS[id];
  let dx = clamp(g.x, ROOM_FIT.x0, ROOM_FIT.x1) - f.x, dy = clamp(g.y, ROOM_FIT.y0, ROOM_FIT.y1) - f.y;
  if (ax === 'x') dy = 0; if (ax === 'y') dx = 0;
  layoutOf(id); ECON.layout[id] = { dx, dy }; ARR.sel = null; ARR.label.textContent = ARR_HINT;
  refreshHome(); navNudge(); BR({ type: 'sfx', name: 'tap' }); econChanged({});
}
// while arranging, every piece that can be moved wears a small bobbing gold mark; the one in hand gets the arrow
const ARR_MARK = ['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..'];
function drawArrangeMarks() {
  if (!ARR.on || G.scene.id !== 'home') return;
  const sc = G.scene, bob = STILL ? 0 : Math.round(Math.sin(G.time * 4) * 1.2);
  for (const id of arrangeable()) {
    const f = FURN[id], l = layoutOf(id), [sx, sy] = sceneProject(sc, f.x + l.dx, f.y + l.dy, f.z + .9), x = Math.round(sx - G.camI[0]), y = Math.round(sy - G.camI[1]);
    if (id === ARR.sel) { arrowAt(x - 4, y - 9 + bob, 1, 1); continue; }
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) sprite(ARR_MARK, x - 2 + dx, y - 5 + dy + bob, INK);
    sprite(ARR_MARK, x - 2, y - 5 + bob, GOLDC); px(x, y - 4 + bob, PAPER);
  }
}
function navNudge() { const p = G.player, n = G.scene.nav, [i, j] = navCell(n, p.x, p.y); if (!navOk(n, i, j)) { const q = navNearest(n, p.x, p.y); if (q) { const c = navCenter(n, q[0], q[1]); p.x = c[0]; p.y = c[1]; } } }

/* ---------- sleeping ---------- */
const BED = { x: 2.6, y: -1.8 };
function goSleep() {
  if (G.scene?.id !== 'home' || G.player.sleeping) return;
  walkTo(1.6, -1.2, () => { G.player.sleeping = true; G.player.x = BED.x; G.player.y = BED.y; G.player.moving = 0; savePos(true); BR({ type: 'sfx', name: 'chime' }); });
}
function wake() { const p = G.player; p.sleeping = false; p.x = 1.55; p.y = -1.2; p.yaw = 0; savePos(true); }
function drawSleeper() {
  const p = G.player, l = p.look, add = dynamicAdd, C = c => () => c, br = Math.sin(G.time * 1.3) * .012;
  add([BED.x, BED.y - .1, .62 + br], [BED.x, BED.y + .78, .58], .34, .3, C(l.shirt || [96, 130, 170]));
  add([BED.x, BED.y - .1, .72 + br], [BED.x, BED.y + .78, .66], .24, .22, C([96, 130, 170]));
  const h = [BED.x, BED.y - .62, .74]; add(h, h, .28, .28, C(l.skin));
  if (l.hair && !l.hideHair) add([h[0], h[1] - .08, h[2] + .05], [h[0], h[1] - .08, h[2] + .05], .27, .27, C(l.hair));
  add([h[0], h[1] - .1, h[2] + .1], [h[0] + .1, h[1] - .34, h[2] + .2], .22, .04, C([150, 60, 70]));   // a nightcap
  add([h[0] + .12, h[1] - .36, h[2] + .2], [h[0] + .12, h[1] - .36, h[2] + .2], .05, .05, C([250, 246, 230]));
  if (Math.random() < .018) emit({ scene: G.scene.id, x: h[0], y: h[1], z: 1.2, vx: .25, vy: -.15, vz: .45, life: 1.8, c: rgb(236, 236, 255), over: true, size: 2 });
}

/* ---------- remembering where the player was ---------- */
let posAcc = 0, posKey = '';
function savePos(now) {
  if (!G.scene || G.iris) return;
  const p = G.player, spot = { scene: G.scene.id, x: +p.x.toFixed(2), y: +p.y.toFixed(2), yaw: +p.yaw.toFixed(2), sleep: !!p.sleeping }, key = JSON.stringify(spot);
  if (key === posKey) return; posKey = key; ECON.pos = spot;
  if (now) BR({ type: 'save', state: ECON });
}
function restorePos() {
  const s = ECON.pos; if (!s) return false;
  try {
    const sc = s.scene === 'village' ? G.scenes.village : INTERIORS[s.scene] ? getInterior(s.scene) : null;
    if (!sc) return false;
    const [i, j] = navCell(sc.nav, s.x, s.y); let { x, y } = s;
    if (!navOk(sc.nav, i, j) && !s.sleep) { const q = navNearest(sc.nav, x, y); if (!q) return false; [x, y] = navCenter(sc.nav, q[0], q[1]); }
    setScene(sc, x, y, s.yaw); G.player.sleeping = !!s.sleep && s.scene === 'home';
    return true;
  } catch (e) { return false; }
}

/* ---------- followers and hooks ---------- */
const PETS = [];
function stepFrontier(dt) {
  posAcc += dt; if (posAcc > 4) { posAcc = 0; savePos(false) ; if (ECON.pos) { clearTimeout(saveTimer); saveTimer = setTimeout(() => BR({ type: 'save', state: ECON }), 200); } }
  stepHunt(dt);
  stepMinimap();
  if (G.scene.id !== 'village') return;
  stepFlock(dt);
  for (const a of G.actors) if (a.pets) {
    a.petState = a.petState || a.pets.map((kind, k) => ({ kind, x: a.x - 1 - k, y: a.y + .6 * k, yaw: 0, walk: 0, moving: 0, t: k }));
    let lead = a;
    a.petState.forEach((f, k) => {
      const d = Math.hypot(lead.x - f.x, lead.y - f.y), keep = 1.3; f.t += dt;
      if (d > keep) { const an = Math.atan2(lead.y - f.y, lead.x - f.x), sp = Math.min(3, d * 1.4); f.x += Math.cos(an) * sp * dt; f.y += Math.sin(an) * sp * dt; f.yaw = turnToward(f.yaw, an, dt * 6); f.moving = 1; f.walk += dt * sp * 4; } else f.moving = Math.max(0, f.moving - dt * 4);
      if (d > 12) { f.x = lead.x - .8; f.y = lead.y; }
      lead = f;
    });
  }
}
const FLOCK = [];
function stepFlock(dt) {
  if (!FLOCK.length) {
    for (const [u, v] of [[-14, -36], [-12, -38], [-16.5, -38], [-9.5, -36.6], [-13, -34.8], [13, -35.2], [14.8, -35.6]]) { const [x, y] = at(u, v); FLOCK.push({ kind: 'sheep', x, y, hx: x, hy: y, yaw: u, walk: 0, moving: 0, t: u, wait: 1 + Math.abs(v) % 5 }); }
    for (const [u, v] of [[-3.5, -45.5], [15.5, -44.6]]) { const [x, y] = at(u, v); FLOCK.push({ kind: 'goat', x, y, z: highUV(u, v), yaw: u, walk: 0, moving: 0, t: v }); }
  }
  const nav = G.scene.nav;
  for (const f of FLOCK) {
    f.t += dt; if (f.kind !== 'sheep') continue;
    if (f.goal) { const dx = f.goal[0] - f.x, dy = f.goal[1] - f.y, d = Math.hypot(dx, dy); if (d < .15) { f.goal = null; f.wait = 3 + (f.t * 7) % 7; } else { f.yaw = turnToward(f.yaw, Math.atan2(dy, dx), dt * 5); f.x += dx / d * .55 * dt; f.y += dy / d * .55 * dt; f.walk += dt * 5; f.moving = 1; } }
    else { f.moving = Math.max(0, f.moving - dt * 4); if ((f.wait -= dt) <= 0) { const x = f.hx + Math.sin(f.t * 3.1) * 2.4, y = f.hy + Math.cos(f.t * 2.3) * 2.4, [i, j] = navCell(nav, x, y); if (navOk(nav, i, j) && lineClear(nav, f.x, f.y, x, y)) f.goal = [x, y]; else f.wait = 2; } }
  }
}
function drawEagle() {
  const [nx, ny] = at(3, -46), t = G.time * .22, x = nx + Math.cos(t) * 11, y = ny + Math.sin(t) * 7, z = 17.5 + Math.sin(t * 2.3) * .6, yaw = t + Math.PI / 2, fx = Math.cos(yaw), fy = Math.sin(yaw), f = Math.sin(G.time * 1.6) * .1, add = dynamicAdd, C = c => () => c;
  const P = (a, b, c) => [x + fx * a - fy * b, y + fy * a + fx * b, z + c];
  add(P(.3, 0, 0), P(-.3, 0, 0), .09, .06, C([90, 66, 54])); add(P(.36, 0, .03), P(.36, 0, .03), .07, .07, C([240, 236, 226]));
  for (const s of [-1, 1]) add(P(.05, s * .08, 0), P(-.1, s * .95, .16 + f), .1, .03, C([70, 54, 48]));
}
function drawFrontier() {
  if (G.scene.id !== 'village') return;
  for (const f of FLOCK) drawPet(f);
  if (G.night < .5) drawEagle();
  for (const a of G.actors) if (a.petState) for (const f of a.petState) drawPet(f);
}
function drawPet(f) {
  const add = dynamicAdd, C = c => () => c, fx = Math.cos(f.yaw), fy = Math.sin(f.yaw), P = (a, b, z) => [f.x + fx * a - fy * b, f.y + fy * a + fx * b, z], st = Math.sin(f.walk) * .1 * f.moving;
  if (f.kind === 'sheep' || f.kind === 'goat') {
    const sheep = f.kind === 'sheep', z = f.z || 0, wool = sheep ? [244, 240, 228] : [226, 214, 196], skin = sheep ? [64, 54, 56] : [150, 120, 96], nib = sheep && !f.moving ? Math.max(0, Math.sin(f.t * .9)) * .14 : 0;
    for (const [a, s] of [[.16, -1], [.16, 1], [-.16, -1], [-.16, 1]]) add(P(a + st * s, s * .1, z), P(a, s * .1, z + .24), .03, .03, C(skin));
    if (sheep) for (const [a, b, c, r] of [[.14, 0, .36, .2], [-.14, 0, .36, .21], [0, .1, .42, .19], [0, -.1, .42, .19], [0, 0, .5, .16]]) add(P(a, b, z + c), P(a, b, z + c), r, r, C(wool));
    else add(P(.16, 0, z + .36), P(-.16, 0, z + .36), .15, .14, C(wool));
    const h = P(.32, 0, z + .46 - nib); add(h, h, .12, .12, C(skin));
    if (sheep) { add(P(.26, 0, z + .56 - nib), P(.26, 0, z + .56 - nib), .09, .09, C(wool)); for (const s of [-1, 1]) add(P(.28, s * .1, z + .47 - nib), P(.26, s * .2, z + .44 - nib), .04, .025, C(skin)); }
    else for (const s of [-1, 1]) add(P(.28, s * .07, z + .55), P(.18, s * .12, z + .76), .03, .012, C([70, 60, 56]));
    window.face(h, fx, fy, -fy, fx, .38, {}, { t: f.t });
    return;
  }
  if (f.kind === 'mule') {
    const c = [120, 100, 130], w = [226, 210, 180];
    for (const [a, s] of [[.3, -1], [.3, 1], [-.3, -1], [-.3, 1]]) add(P(a + st * s, s * .15, 0), P(a, s * .15, .5), .06, .06, C(c));
    add(P(.3, 0, .66), P(-.34, 0, .64), .22, .2, C(w));
    const h = P(.6, 0, .98); add(P(.34, 0, .74), h, .1, .08, C(c)); add(h, h, .14, .14, C(c));
    for (const s of [-1, 1]) { add(P(.56, s * .1, 1.1), P(.5, s * .3, 1.34), .02, .012, C(c)); add(P(.5, s * .3, 1.34), P(.5, s * .3, 1.34), .04, .04, C([236, 196, 90])); add(P(0, s * .28, .52), P(-.1, s * .28, .78), .14, .13, C([150, 66, 60])); }
    add(P(-.1, 0, .92), P(-.1, 0, 1.08), .13, .1, C([70, 110, 110]));
    sphereGlow(...P(.1, 0, 1.2), .06, [255, 214, 130]);
  } else {
    const c = [214, 170, 110], w = [250, 240, 220];
    for (const [a, s] of [[.14, -1], [.14, 1], [-.14, -1], [-.14, 1]]) add(P(a + st * s, s * .07, 0), P(a, s * .07, .2), .03, .03, C(c));
    add(P(.16, 0, .26), P(-.16, 0, .25), .11, .1, C(c));
    const h = P(.28, 0, .4); add(h, h, .1, .1, C(c)); add(P(.38, 0, .36), P(.42, 0, .35), .05, .02, C(w));
    for (const s of [-1, 1]) add(P(.25, s * .09, .48), P(.24, s * .16, .72), .05, .012, C(c));   // enormous ears
    add(P(-.2, 0, .3), P(-.4, Math.sin(f.t * 5) * .08, .44), .06, .1, C(w));
  }
}
function bootFrontier() {
  if (ECON.companion === 'pet_dragon') ECON.companion = 'dog';
  delete ECON.dragon;
  for (const id of Object.keys(ECON.inv)) if (!ITEMS[id]) delete ECON.inv[id];
  quests();
}
Object.assign(WARES_API, { arrange, sleep: goSleep, quests: questLog, savePos() { savePos(true); } });

/* ---------- the map: a little one in the corner, a big one to travel by ---------- */
// [label, door id | 'u', u, v, kind]: 'land' names are lettered straight onto the chart, places get a little parchment tag
const LANDMARKS = [
  ['Well', 'u', .6, 2.4], ['Post', 'post'], ['Guild', 'guild'], ['Goose', 'tavern'], ['Home', 'home'], ['Odette', 'shop'], ['Tower', 'tower'], ['Bell', 'bell'],
  ['Mill', 'u', -4.6, 23], ['Harbour', 'u', 19.4, -1, 'land'], ['Woods', 'u', -24, -12, 'land'], ['Peaks', 'u', 2.6, -39.5, 'land'], ['Tarn', 'u', 8.8, -38.6], ['Camp', 'u', -11.4, -37.8], ['Wastes', 'u', -7.6, 40.5, 'land'],
];
const MAP = { img: null, big: null, box: null, mini: null, dot: null };
function mapBox() {
  if (MAP.box) return MAP.box;
  const t = G.scenes.village.t, st = 3;
  let x0 = t.W, y0 = t.H, x1 = 0, y1 = 0;
  for (let y = 0; y < t.H; y += st) for (let x = 0; x < t.W; x += st) if (t.ground[y * t.W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  y0 = Math.max(0, y0 - 190); y1 = Math.min(t.H - 1, y1 + 44); x0 = Math.max(0, x0 - 14); x1 = Math.min(t.W - 1, x1 + 14);   // room for the peaks above and the cliff below
  return MAP.box = { x0, y0, W: x1 - x0, H: y1 - y0 };
}
// the island as a picture: every st-th pixel of the bake (coarse for the corner glance, finer for the chart)
function mapPicture(st) {
  const t = G.scenes.village.t, { x0, y0, W: bw, H: bh } = mapBox(), far = farPixels(G.scenes.village);
  const w = Math.ceil(bw / st), h = Math.ceil(bh / st), c = el('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), im = g.createImageData(w, h), out = new Uint32Array(im.data.buffer);
  // the island rides above a night of thin cloud and a few stars, like an old sky-chart
  const wisp = rgb(52, 59, 80), wispLit = rgb(72, 82, 108), star = rgb(214, 206, 170);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const sx = x0 + i * st, sy = y0 + j * st, p = far[sy * t.W + sx];
    if (p) { out[j * w + i] = p | 0xff000000; continue; }
    const v = CLOUDS[((sy >> 1) & (CLOUD_H - 1)) * CLOUD_W + ((sx >> 2) & (CLOUD_W - 1))] + (bayerAt(i, j) - .5) * 10;
    if (v > 150) out[j * w + i] = v > 164 ? wispLit : wisp;
    else if (hash(sx * .29 | 0, sy * .31 | 0) > .9965 && ((sx / st | 0) & 1) && ((sy / st | 0) & 1)) out[j * w + i] = star;
  }
  g.putImageData(im, 0, 0);
  return c;
}
function mapImage() { return MAP.img || (MAP.img = mapPicture(3)); }
const mapPct = (x, y) => { const [sx, sy] = sceneProject(G.scenes.village, x, y, 0), b = mapBox(); return [(sx - b.x0) / b.W * 100, (sy - b.y0) / b.H * 100]; };
function landmarkSpot(m) {
  const sc = G.scenes.village;
  if (m[1] === 'u') return at(m[2], m[3]);
  const d = sc.doors.find(k => k.id === m[1]);
  return [d.x, d.y];
}
function travel(m) {
  const sc = G.scenes.village; closeCard();
  let [x, y] = landmarkSpot(m); const [i, j] = navCell(sc.nav, x, y);
  if (!navOk(sc.nav, i, j)) { const q = navNearest(sc.nav, x, y); if (!q) return; [x, y] = navCenter(sc.nav, q[0], q[1]); }
  BR({ type: 'sfx', name: 'spell' }); BR({ type: 'haptic', style: 'light' });
  iris(() => setScene(sc, x, y, Math.PI * .25));
}
// a little compass rose for the corner of the chart
const ROSE = ['.....g.....', '.....g.....', '....ggg....', '....gpg....', '..p.gpg.p..', 'ggggpgpgggg', '..p.gpg.p..', '....gpg....', '....ggg....', '.....g.....', '.....g.....'];
function compassRose() {
  const s = 3, c = el('canvas', 'rose'); c.width = c.height = 11 * s; const x = c.getContext('2d');
  ROSE.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; x.fillStyle = ch === 'g' ? '#edbf57' : '#faf2de'; x.fillRect(i * s, j * s, s, s); }));
  return c;
}
function mapCard() {
  const big = MAP.big || (MAP.big = mapPicture(2));
  const { c, body, acts } = openCard('Map of Wudland', '', 'wide');
  const w = el('div', 'map'), img = el('canvas'); img.width = big.width; img.height = big.height; img.getContext('2d').drawImage(big, 0, 0);
  w.style.aspectRatio = `${big.width} / ${big.height}`; w.append(img, compassRose());
  for (const m of LANDMARKS) {
    const [x, y] = landmarkSpot(m), [l, t] = mapPct(x, y), b = el('button', m[4] === 'land' ? 'pin land' : 'pin'); b.style.left = l + '%'; b.style.top = t + '%';
    const lab = el('span', '', m[0]), nudge = { Home: [-18, 0], Odette: [16, 8], Tarn: [16, 0], Goose: [16, 0], Post: [-14, 0], Camp: [-10, 0], Peaks: [-16, 0], Guild: [10, -1], Mill: [-12, 2] }[m[0]]; if (nudge) lab.style.transform = `translate(${nudge[0]}px, ${nudge[1]}px)`; b.append(el('i'), lab); b.setAttribute('aria-label', `Go to ${m[0]}`); b.onclick = () => travel(m); w.append(b);
  }
  const [l, t] = mapPct(G.player.x, G.player.y), you = el('b', 'you'); you.style.left = l + '%'; you.style.top = t + '%'; w.append(you);
  const trader = G.actors.find(a => a.id === 'merchant');
  if (trader) { const [a, b] = mapPct(trader.x, trader.y), d = el('b', 'trader'); d.style.left = a + '%'; d.style.top = b + '%'; w.append(d); }
  body.append(w);
  const key = el('div', 'legend'), k1 = el('span', '', 'You are here'); k1.prepend(el('b', 'you')); key.append(k1);
  if (trader) { const k2 = el('span', '', 'The Aimless Merchant'); k2.prepend(el('b', 'trader')); key.append(k2); }
  body.append(key);
  act(acts, 'Close', closeCard);
}
let mapAcc = 1;
function stepMinimap() {
  if ((mapAcc += 1 / 60) < .2) return; mapAcc = 0;
  if (!MAP.mini) {
    mapImage();
    const b = el('button', 'mini hide'); b.setAttribute('aria-label', 'Open map');
    const c = el('canvas'); c.width = MAP.img.width; c.height = MAP.img.height; c.getContext('2d').drawImage(MAP.img, 0, 0);
    b.style.aspectRatio = `${c.width + 12} / ${c.height + 14}`;
    MAP.dot = el('b', 'you'); b.append(c, MAP.dot);
    b.onclick = () => { if (!G.iris && !G.talking && G.scene.id === 'village') mapCard(); };
    b.addEventListener('pointerdown', e => e.stopPropagation());
    document.body.append(b); MAP.mini = b; MAP.shown = false;
  }
  const show = G.scene.id === 'village' && !G.talking && !G.card && !G.iris && FAR_F === 1;
  if (show !== MAP.shown) { MAP.shown = show; MAP.mini.classList.toggle('hide', !show); }
  if (show) { const [l, t] = mapPct(G.player.x, G.player.y); MAP.dot.style.left = l + '%'; MAP.dot.style.top = t + '%'; }
}
