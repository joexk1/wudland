'use strict';
// The Step Tree: an old village tree in a stone planter that stands on the plaza where the well used to be.
// Walking waters it. The state (see StepTree.swift) arrives as WUD_BOOT.data.steptree = { state, watered }
// and the tree is baked into the village like any other prop, so a new state means a rebake.
//
// states, worst to best: dead, withered, thirsty, sapling, healthy, blooming, golden, enchanted.
// golden and enchanted are for walkers who keep beating their goal: both light up after dark.

// set at boot by the app (Game.swift) and later by wud.setStepTree; null keeps the old well
let STEP_TREE = (window.WUD_BOOT || {}).steptree || null;

const STEP_TREE_STATES = ['dead', 'withered', 'thirsty', 'sapling', 'healthy', 'blooming', 'golden', 'enchanted'];

// the crown is the same layered blob as the island's oaks, but each state picks its own density and leaves
const ST_LOOK = {
  dead:     { bark: [118, 108, 102], leaves: 0,   pal: null, scale: .92, bare: true },
  withered: { bark: [100, 80, 64],   leaves: 46,  pal: [[112, 70, 44], [170, 108, 56], [206, 150, 72]], scale: .92, bare: true, fallen: [[170, 108, 56], [206, 150, 72], [130, 80, 50]] },
  thirsty:  { bark: [96, 74, 58],    leaves: 150, pal: [[96, 104, 52], [150, 150, 66], [206, 190, 96]], scale: .94, fallen: [[190, 170, 80], [160, 140, 60]] },
  sapling:  { bark: [110, 84, 62],   leaves: 0,   pal: [[58, 98, 62], [98, 148, 76], [168, 196, 108]], scale: 1 },
  healthy:  { bark: [96, 74, 58],    leaves: 260, pal: [[50, 88, 58], [90, 132, 68], [148, 176, 92]], scale: 1 },
  blooming: { bark: [96, 74, 58],    leaves: 290, pal: [[54, 92, 60], [96, 136, 72], [154, 180, 96]], bloom: [[236, 168, 190], [250, 214, 224], [214, 120, 156]], scale: 1.04, fallen: [[244, 190, 206], [250, 226, 232]] },
  golden:   { bark: [104, 78, 58],   leaves: 320, pal: [[60, 96, 54], [124, 150, 62], [214, 192, 84]], bloom: [[246, 200, 84], [255, 226, 130], [232, 164, 64]], fruit: true, scale: 1.1, fallen: [[248, 210, 222], [255, 236, 190]], lit: 1 },
  // the old magic wakes: moonlit teal leaves, glowing wisteria, lanterns in the boughs, runes in the stone
  enchanted:{ bark: [92, 76, 84],    leaves: 330, pal: [[40, 74, 84], [62, 118, 118], [132, 196, 178]], bloom: [[196, 176, 250], [226, 214, 255], [150, 210, 230]], scale: 1.16, fallen: [[200, 184, 250], [170, 226, 236]], lit: 2 },
};

// soil: dark and damp once today's steps are in, pale and cracked when the tree has gone thirsty
function stPlanter(x, y, state, watered) {
  const R = 1.0, H = .34;
  cylinder(x, y, 0, H, R, stoneWall(PAL.stone, 7, .17, .3), -Math.PI, Math.PI);
  const dry = state === 'dead' || state === 'withered' || (state === 'thirsty' && !watered);
  disc(x, y, H + .01, R, (a, b, o) => {
    const r = Math.hypot(a, b);
    if (r > R - .12) { o.c = PAL.stone; o.dl = (hash(a * 9 | 0, b * 9 | 0) - .5) * .5 + .2; return; }
    const n = noise(a * 7 + 3, b * 7);
    o.c = watered ? [70, 50, 40] : dry ? [150, 122, 92] : [104, 78, 58];
    o.dl = (n - .5) * .9 + (watered && n > .7 ? -.5 : 0);
    // cracks in parched earth
    if (dry && Math.abs(noise(a * 5, b * 5 + 9) - .5) < .035) { o.c = [96, 76, 60]; o.dl = -.8; }
    // a little moss creeping in at the rim when it is thriving
    if (!dry && r > R - .3 && noise(a * 6, b * 6 + 4) > .62) { o.c = [92, 128, 70]; o.dl = 0; }
  });
}
// carved runes round the planter that glow once the tree is enchanted
function stRunes(x, y) {
  const R = 1.0, H = .34;
  for (let j = 0; j < 9; j++) {
    const a = j / 9 * 6.283 + .2, rx = x + Math.cos(a) * (R + .005), ry = y + Math.sin(a) * (R + .005);
    // only the faces turned toward the camera are seen
    if (Math.cos(a) + Math.sin(a) < -.3) continue;
    EMIT = 1;
    for (let t = 0; t < 4; t++) sphere(rx, ry, .08 + t * .055, .028, j % 2 ? [150, 230, 220] : [200, 180, 255], 'glow');
    sphere(rx + Math.sin(a) * .05, ry - Math.cos(a) * .05, .19, .026, [150, 230, 220], 'glow');
    EMIT = 0;
  }
  // a fairy ring of glowing toadstools on the cobbles
  for (let j = 0; j < 11; j++) {
    const a = j / 11 * 6.283 + .15, d = 1.35 + hash(j, 77) * .25, fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d, sz = .7 + hash(j, 78) * .5;
    capsule([fx, fy, 0], [fx, fy, .16 * sz], .03 * sz, .025 * sz, () => [226, 220, 200], 'solid');
    EMIT = 1; sphere(fx, fy, .19 * sz, .08 * sz, j % 3 ? [140, 220, 230] : [200, 170, 255], 'glow'); EMIT = 0;
  }
}
// one swaying cluster of the crown; glow keeps it bright after dark
function stLeaf(scene, x, y, z, r, c, k, glow = false, mode = 'rough') {
  capture = [];
  sphere(x, y, z, r, c, mode);
  scene.leaves.push({ x, y, z, k, r: Math.max(.2, r * 1.6), pixels: capture, pick: PICK, glow });
  capture = null;
}
// a point on the camera side of the crown (the camera looks along -x -y), so hung things are not buried in leaves
function stFront(x, y, s, j, seed, out = 1.02) {
  const [cx, cy, cz, spread] = CROWN[j % 5];
  const a = Math.PI / 4 + (hash(j, seed + 31) - .5) * 2.6, d = spread * out;
  return [x + (cx + Math.cos(a) * d) * s, y + (cy + Math.sin(a) * d) * s, (cz - .35 - hash(j, 5) * .5) * s];
}

function stCrown(scene, x, y, s, look, seed) {
  const n = look.leaves;
  for (let j = 0; j < n; j++) {
    const k = j + seed, [cx, cy, cz, spread] = CROWN[j % CROWN.length];
    const a = hash(k, 7) * 6.283, tilt = hash(k, 8) * 2 - 1, d = Math.cbrt(hash(k, 9)) * spread, flat = Math.sqrt(1 - tilt * tilt);
    // a thirsty crown droops: the outer clusters hang lower
    const droop = look === ST_LOOK.thirsty ? d / spread * .5 : 0;
    const rx = cx + Math.cos(a) * flat * d, ry = cy + Math.sin(a) * flat * d, rz = cz + tilt * d * .8 - droop;
    const tone = hash(k, 10) + (rz - 4.2) * .22 + (d / spread - .5) * .3;
    let leaf = tone > .72 ? look.pal[2] : tone > .3 ? look.pal[1] : look.pal[0], glow = false;
    // blossom sits on the sunny outside of the crown
    if (look.bloom && tone > .5 && hash(k, 12) < (look.fruit ? .5 : .42)) { leaf = look.bloom[hash(k, 13) * 3 | 0]; glow = look.lit > 1 || (look.lit && hash(k, 14) < .45); }
    // an enchanted crown glows from within: its palest leaves shine too
    if (look.lit > 1 && tone > .86) glow = true;
    const r = (look.leaves < 100 ? .14 + hash(k, 11) * .14 : .2 + hash(k, 11) * .22) * s;
    stLeaf(scene, x + rx * s, y + ry * s, rz * s, r, leaf, k, glow);
  }
}

// bare limbs that reach out to where the crown would be: the dead and withered trees show their bones
function stLimbs(x, y, s, bark, seed, broken) {
  const c = () => bark, base = [x + .3 * s, y + .1 * s, 2.2 * s];
  for (let j = 0; j < CROWN.length; j++) {
    if (broken && j === 5) continue;   // the top has snapped off
    const [cx, cy, cz] = CROWN[j];
    const tip = [x + cx * s * 1.05, y + cy * s * 1.05, (cz + .3) * s];
    const mid = [lerp(base[0], tip[0], .55) + (hash(seed, j) - .5) * .3 * s, lerp(base[1], tip[1], .55), lerp(base[2], tip[2], .5) + .25 * s];
    capsule(base, mid, .12 * s, .08 * s, c, 'rough');
    capsule(mid, tip, .08 * s, .035 * s, c, 'rough');
    for (let t = 0; t < 2; t++) {   // twigs
      const a = hash(seed + j, t + 4) * 6.283;
      capsule(tip, [tip[0] + Math.cos(a) * .4 * s, tip[1] + Math.sin(a) * .4 * s, tip[2] + (.15 + hash(j, t) * .3) * s], .03 * s, .015 * s, c, 'solid');
    }
  }
  if (broken) capsule(base, [x + .2 * s, y + .05 * s, 2.75 * s], .17 * s, .14 * s, c, 'rough');
}

function stTrunk(x, y, s, bark) {
  const c = () => bark;
  capsule([x, y, .3], [x + .3 * s, y + .1 * s, 2.2 * s], .36 * s, .22 * s, c, 'rough');
  // roots gripping the planter's soil
  for (let j = 0; j < 4; j++) {
    const a = j * 1.57 + .4;
    capsule([x, y, .55], [x + Math.cos(a) * .55, y + Math.sin(a) * .55, .36], .14, .07, c, 'rough');
  }
}

// leaves or petals lying on the soil and the cobbles about the planter
function stFallen(x, y, cols, n, seed) {
  for (let j = 0; j < n; j++) {
    const a = hash(j, seed) * 6.283, inside = j % 3 === 0, d = inside ? .2 + hash(seed, j) * .7 : 1.08 + hash(seed, j) * 1.1;
    const fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d, z = inside ? .36 : .01, col = cols[j % cols.length];
    disc(fx, fy, z, .045 + hash(j, 3) * .03, (p, q, o) => { o.c = col; o.flat = true; o.dl = .2; });
  }
}

function stSapling(scene, x, y, look, g = 1) {
  const c = () => look.bark, Z = z => .34 + (z - .34) * g;   // g: a taller sapling the longer its streak
  capsule([x, y, .34], [x + .04, y, Z(1.5)], .07 * g, .045 * g, c, 'solid');
  capsule([x + .02, y, Z(1.0)], [x + .36 * g, y + .1 * g, Z(1.35)], .035, .025, c, 'solid');
  capsule([x + .03, y, Z(1.2)], [x - .3 * g, y - .1 * g, Z(1.55)], .035, .025, c, 'solid');
  // a stake and a red ribbon: someone planted this on purpose
  box(x - .3, y + .2, .3, x - .24, y + .26, 1.3, PAL.woodLight, .4);
  capsule([x - .27, y + .23, 1.05], [x + .03, y, Math.min(1.05, Z(1.05))], .03, .03, () => [196, 60, 56], 'solid');
  const pts = [[.04, 0, 1.62, .2], [.38, .12, 1.42, .15], [-.32, -.1, 1.62, .15], [.18, .05, 1.78, .14], [-.12, .08, 1.48, .13], [.24, -.12, 1.58, .12], [-.04, -.08, 1.9, .11]];
  pts.forEach(([dx, dy, z, r], k) => stLeaf(scene, x + dx * g, y + dy * g, Z(z), r * g, look.pal[k % 3], k));
}

// glowing wisteria strands hanging from the outer crown, and little lanterns tied in the boughs
function stWisteria(scene, x, y, s, look, seed) {
  for (let j = 0; j < 22; j++) {
    const [fx, fy, top] = stFront(x, y, s, j + 40, seed, .9 + hash(j, 8) * .15), len = (.5 + hash(j, 9) * .7) * s;
    for (let t = 0; t < 6; t++) {
      const f = t / 5;
      stLeaf(scene, fx + Math.sin(t * 1.3 + j) * .03, fy, top + .2 * s - f * len, (.085 - f * .04) * s, look.bloom[(j + t) % 3], 700 + j * 7 + t, true, 'solid');
    }
  }
  // lanterns: a warm counterpoint to all that moonlight
  for (let j = 0; j < 5; j++) {
    const [lx, ly, lz] = stFront(x, y, s, j * 3 + 7, seed + 5, .88);
    stLeaf(scene, lx, ly, lz + .12, .05, PAL.iron, 800 + j, false, 'solid');
    stLeaf(scene, lx, ly, lz, .1, [255, 214, 130], 800 + j, true, 'glow');
  }
}
// golden apples hang on the outside of the crown and glow a little after dark
function stFruit(scene, x, y, s, seed) {
  for (let j = 0; j < 18; j++) {
    const [fx, fy, fz] = stFront(x, y, s, j, seed, .95 + hash(j, 6) * .12);
    stLeaf(scene, fx, fy, fz, .14 * s, j % 4 ? [238, 150, 50] : [252, 210, 90], 900 + j, true, 'solid');
  }
}

function stepTree(scene, x, y, info = {}) {
  const state = STEP_TREE_STATES.includes(info.state) ? info.state : 'healthy';
  // five sizes for every state, grown by the best streak of the tree's life (StepTree.swift size): small to towering
  const size = clamp(Math.round(info.size || 3), 1, 5), grow = [.7, .82, .94, 1.06, 1.18][size - 1];
  const look = ST_LOOK[state], s = look.scale * grow, seed = 1709;
  stPlanter(x, y, state, !!info.watered);
  if (state === 'sapling') stSapling(scene, x, y, look, [.8, .9, 1, 1.12, 1.24][size - 1]);
  else {
    stTrunk(x, y, s, look.bark);
    if (look.bare) stLimbs(x, y, s, look.bark, seed, state === 'dead');
    else {
      // limbs under the crown, as on the island's oaks
      const c = () => look.bark;
      capsule([x + .3 * s, y + .1 * s, 2.2 * s], [x - .8 * s, y - .4 * s, 3.3 * s], .2 * s, .13 * s, c, 'rough');
      capsule([x + .3 * s, y + .1 * s, 2.2 * s], [x + 1.2 * s, y + .4 * s, 3.4 * s], .2 * s, .13 * s, c, 'rough');
    }
    if (look.leaves) stCrown(scene, x, y, s, look, seed);
    if (look.fruit) stFruit(scene, x, y, s, seed);
    if (state === 'enchanted') { stWisteria(scene, x, y, s, look, seed); stRunes(x, y); }
    // a lit tree throws a pool of light over the plaza, and motes drift up out of its crown (game.js 'enchant')
    if (look.lit) {
      addLight(scene, x, y, 2.6 * s, look.lit > 1 ? 5.6 : 4.2, look.lit > 1 ? 1.1 : .8, .2);
    }
    if (look.lit || look.bloom) scene.smokers.push({ x, y, z: 3.2 * s, r: 1.9 * s, key: 'enchant', tone: state });
  }
  if (look.fallen) stFallen(x, y, look.fallen, state === 'withered' ? 34 : state === 'thirsty' ? 14 : 26, seed);
  if (state === 'dead') stFallen(x, y, [[110, 90, 70], [130, 106, 80]], 10, seed + 3);
  castShadow(x, y, .2, 1.0);
  if (state !== 'sapling') castShadow(x, y, 1.6 * s, .3 * s);
  return { top: state === 'sapling' ? 2.1 : 5.2 * s, name: 'The Step Tree', size };
}
