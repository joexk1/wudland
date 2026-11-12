'use strict';
// The rest of the island's rooms: every cottage out in the new lands, the windmill and the three tents.
// Same cutaway style as interiors.js (roomScene / room / finishRoom / doorMat), dressed by hand from a small box of
// props. Each room has something quietly moving in it: sc.anim(t) draws it every frame while the player is inside, and a few
// kinds of drifting particle (steam, flour, incense, fireflies) come from sc.smokers through ROOM_FX.

/* ---------- placing things on the two back walls ---------- */
// wall 'x' is the left wall (x = -w/2, facing +x); wall 'y' is the right-hand back wall (y = -d/2, facing +y).
// `at` runs along the wall in room coordinates, `off` is how far the thing stands out from it.
function wallPos(sc, wall, at, z, off = .06) { return wall === 'x' ? [-sc.room.w / 2 + off, at, z] : [at, -sc.room.d / 2 + off, z]; }
function onWall(sc, wall, at, z, w, h, fn, off = .03) {
  const W = sc.room.w / 2, D = sc.room.d / 2;
  if (wall === 'x') quad([-W + off, at - w / 2, z], [0, w, 0], [0, 0, h], fn, false, [1, 0, 0]);
  else quad([at - w / 2, -D + off, z], [w, 0, 0], [0, 0, h], fn, false, [0, 1, 0]);
}
// repaint both walls (log cabins, sandstone) or the floor (flagstones, sand, moss) a hair in front of what room() laid
function wallpaper(sc, fnOf) {
  const { w, d, h } = sc.room;
  quad([-w / 2 + .012, -d / 2, 0], [0, d, 0], [0, 0, h], fnOf(d, 1), false, [1, 0, 0]);
  quad([-w / 2, -d / 2 + .012, 0], [w, 0, 0], [0, 0, h], fnOf(w, 2), false, [0, 1, 0]);
}
function floorPaint(sc, fn) {
  const { w, d } = sc.room;
  KIND = K_FLOOR; quad([-w / 2, -d / 2, .008], [w, 0, 0], [0, d, 0], fn, false, [0, 0, 1]); KIND = 0;
}
const logWall = (len, seed) => (s, t, o) => {
  const row = Math.floor(t / .34), ft = (t % .34) / .34;
  o.c = hash(row, seed) > .6 ? [150, 106, 68] : [138, 96, 62];
  o.dl = (ft < .12 ? -1.1 : ft > .8 ? .5 : 0) + (noise(s * 7, row * 3 + seed) - .5) * .5;
  if (s < .16 || s > len - .16) { o.c = [196, 156, 106]; o.dl = Math.hypot((s < .16 ? s - .08 : s - len + .08) * 6, ft - .5) < .3 ? -.5 : .2; }
};
const sandstone = () => stoneWall([190, 164, 126], 13, .3, .6);
function wallMap(sc, wall, at, z, w = 1.1, h = .8, route = false) {
  onWall(sc, wall, at, z, w, h, (s, t, o) => {
    o.flat = true; o.c = [236, 220, 180]; o.dl = .3;
    if (s < .05 || t < .05 || s > w - .05 || t > h - .05) { o.c = [196, 164, 112]; return; }
    const n = noise(s * 5 + at * 3, t * 5);
    if (Math.abs(n - .5) < .04) o.c = [120, 92, 70];
    else if (n > .54 && hash(s * 14 | 0, t * 14 | 0) > .9) o.c = [124, 150, 108];
    if (route && Math.abs(t - (.2 + s / w * .5 + Math.sin(s * 9) * .06)) < .022 && Math.floor(s * 12) % 2) o.c = [190, 60, 50];
    if (Math.hypot(s - w * .7, t - h * .62) < .055) o.c = [190, 60, 50];
  });
}
// a fishing net pinned up and drooping in the middle, with a row of cork floats along its top
function netting(sc, wall, at, z, w, h) {
  onWall(sc, wall, at, z, w, h, (s, t, o) => {
    const sag = t + Math.sin(s / w * Math.PI) * .22;
    if (sag > h) return false;
    if ((s + sag) % .24 > .045 && (s - sag + 9) % .24 > .045) return false;
    o.c = [182, 156, 108]; o.flat = true; o.dl = .2;
  }, .07);
  for (let k = 0; k <= 6; k++) { const u = k / 6, p = wallPos(sc, wall, at - w / 2 + u * w, z + h - Math.sin(u * Math.PI) * .22, .12); sphere(p[0], p[1], p[2], .075, k % 2 ? [200, 80, 60] : [214, 180, 120], 'solid'); }
}
// a ring on the wall with optional spokes: ship's wheels, snowshoes, hoops
function wallRing(sc, wall, at, z, r, c, spokes = 0, squash = 1) {
  for (let a = 0; a < 6.283; a += .26) { const p = wallPos(sc, wall, at + Math.cos(a) * r * squash, z + Math.sin(a) * r, .1); sphere(p[0], p[1], p[2], .045, c, 'solid'); }
  for (let k = 0; k < spokes; k++) { const a = k / spokes * Math.PI, p = wallPos(sc, wall, at + Math.cos(a) * r * 1.22 * squash, z + Math.sin(a) * r * 1.22, .1), q = wallPos(sc, wall, at - Math.cos(a) * r * 1.22 * squash, z - Math.sin(a) * r * 1.22, .1); capsule(p, q, .03, .03, () => c, 'solid'); }
  if (spokes) { const p = wallPos(sc, wall, at, z, .14); sphere(p[0], p[1], p[2], .08, PAL.gold, 'gloss'); }
}
function ladder(sc, wall, at, h = 2.75) {
  const P = (side, t) => { const p = wallPos(sc, wall, at + side * .24, t * h, .1 + (1 - t) * .62); return p; };
  for (const s of [-1, 1]) capsule(P(s, 0), P(s, 1), .04, .04, () => PAL.woodDark, 'solid');
  for (let k = 1; k < 8; k++) capsule(P(-1, k / 8), P(1, k / 8), .03, .03, () => PAL.wood, 'solid');
}
// a plank shelf with a row of small things on it
function wallShelf(sc, wall, at, z, w, items) {
  const W = sc.room.w / 2, D = sc.room.d / 2;
  if (wall === 'x') { box(-W, at - w / 2, z, -W + .36, at + w / 2, z + .06, PAL.wood, .4); for (const e of [-1, 1]) box(-W, at + e * (w / 2 - .1) - .03, z - .16, -W + .3, at + e * (w / 2 - .1) + .03, z, PAL.woodDark, .3); }
  else { box(at - w / 2, -D, z, at + w / 2, -D + .36, z + .06, PAL.wood, .4); for (const e of [-1, 1]) box(at + e * (w / 2 - .1) - .03, -D, z - .16, at + e * (w / 2 - .1) + .03, -D + .3, z, PAL.woodDark, .3); }
  items.forEach((it, k) => { const p = wallPos(sc, wall, at - w / 2 + (k + .5) * w / items.length, z + .06, .19); trinket(sc, it, p[0], p[1], p[2]); });
}
// things hanging in a row from a rail: herbs, fish, onions, hams, pans, coils of rope, skeins of wool, socks
function hangRow(sc, wall, a0, a1, z, n, kind, seed = 0) {
  capsule(wallPos(sc, wall, a0, z, .16), wallPos(sc, wall, a1, z, .16), .028, .028, () => PAL.woodDark, 'solid');
  const wool = [[196, 80, 70], [236, 196, 100], [96, 140, 170], [236, 228, 208], [130, 160, 100], [170, 110, 170]];
  for (let k = 0; k < n; k++) {
    const u = lerp(a0, a1, (k + .5) / n), len = .1 + hash(k, seed + 3) * .12, [x, y] = wallPos(sc, wall, u, z, .18), zz = z - len;
    capsule([x, y, z], [x, y, zz], .014, .014, () => [150, 130, 100], 'solid');
    if (kind === 'herb') for (let j = 0; j < 4; j++) sphere(x + (wall === 'y' ? (hash(k, j + seed) - .5) * .1 : 0), y + (wall === 'x' ? (hash(k, j + seed) - .5) * .1 : 0), zz - .05 - j * .07, .075, [[96, 130, 70], [150, 110, 70], [170, 130, 170], [120, 150, 90]][(k + seed) % 4], 'rough');
    else if (kind === 'fish') { capsule([x, y, zz], [x, y, zz - .36], .065, .02, () => (k % 2 ? [150, 170, 190] : [184, 160, 136]), 'solid'); sphere(x, y, zz - .4, .05, [120, 140, 160], 'solid'); }
    else if (kind === 'onion') for (let j = 0; j < 3; j++) sphere(x, y, zz - .06 - j * .12, .075, (j + k) % 2 ? [226, 190, 120] : [200, 120, 110], 'solid');
    else if (kind === 'ham') { sphere(x, y, zz - .13, .14, [176, 96, 80], 'rough'); sphere(x, y, zz - .28, .09, [196, 120, 96], 'rough'); }
    else if (kind === 'pan') { sphere(x, y, zz - .16, .15 - (k % 3) * .02, k % 2 ? [70, 66, 74] : [176, 116, 70], 'gloss'); }
    else if (kind === 'skein') capsule([x, y, zz], [x, y, zz - .34], .085, .07, () => wool[(k + seed) % 6], 'rough');
    else if (kind === 'sock') capsule([x, y, zz], [x, y, zz - .22], .05, .06, () => wool[(k * 2 + seed) % 6], 'solid');
    else if (kind === 'rope') for (let a = 0; a < 6.283; a += .45) { const p = wallPos(sc, wall, u + Math.cos(a) * .15, zz - .18 + Math.sin(a) * .17, .16); sphere(p[0], p[1], p[2], .042, [206, 176, 116], 'rough'); }
  }
}

/* ---------- small things ---------- */
function trinket(sc, it, x, y, z) {
  const [kind, c] = Array.isArray(it) ? it : [it, null];
  if (kind === 'jar') { capsule([x, y, z + .07], [x, y, z + .2], .09, .085, () => c || [150, 190, 200], 'gloss'); disc(x, y, z + .3, .07, (a, b, o) => { o.c = [150, 110, 70]; o.flat = true; }); }
  else if (kind === 'pot') { sphere(x, y, z + .14, .14, c || [184, 108, 72], 'solid'); capsule([x, y, z + .24], [x, y, z + .31], .08, .1, () => c || [184, 108, 72], 'solid'); }
  else if (kind === 'vase') { capsule([x, y, z + .1], [x, y, z + .36], .11, .05, () => c || [96, 130, 170], 'gloss'); sphere(x, y, z + .4, .06, c || [96, 130, 170], 'gloss'); }
  else if (kind === 'bottle') { capsule([x, y, z + .06], [x, y, z + .17], .07, .07, () => c || [90, 150, 110], 'gloss'); capsule([x, y, z + .2], [x, y, z + .33], .03, .03, () => c || [90, 150, 110], 'gloss'); }
  else if (kind === 'books') for (let j = 0; j < 3; j++) box(x - .11 + j * .075, y - .1, z, x - .045 + j * .075, y + .1, z + .25 - j * .03, [[150, 60, 52], [70, 96, 130], [200, 160, 90]][j], .2);
  else if (kind === 'bowl') { sphere(x, y, z + .03, .14, c || [200, 170, 120], 'solid'); }
  else if (kind === 'skull') { sphere(x, y, z + .14, .13, [236, 226, 200], 'solid'); sphere(x + .05, y + .05, z + .06, .08, [226, 214, 186], 'solid'); }
  else if (kind === 'loaf') capsule([x - .09, y, z + .09], [x + .09, y, z + .09], .1, .1, () => [204, 144, 78], 'rough');
  else if (kind === 'cheese') box(x - .12, y - .1, z, x + .12, y + .1, z + .14, [240, 204, 96], .3);
  else if (kind === 'shell') { sphere(x, y, z + .08, .1, c || [240, 200, 190], 'gloss'); }
  else if (kind === 'gem') { sphere(x, y, z + .08, .08, c || [150, 120, 230], 'gloss'); }
  else if (kind === 'cup') { capsule([x, y, z + .05], [x, y, z + .13], .06, .07, () => c || [220, 200, 160], 'solid'); }
  else if (kind === 'carving') { sphere(x, y, z + .1, .1, [186, 140, 92], 'solid'); sphere(x + .07, y + .05, z + .2, .07, [186, 140, 92], 'solid'); }
  else if (kind === 'sprout') { capsule([x, y, z], [x, y, z + .1], .08, .09, () => [184, 108, 72], 'solid'); sphere(x - .04, y, z + .2, .06, [110, 160, 80], 'rough'); sphere(x + .05, y, z + .25, .055, [130, 176, 90], 'rough'); }
  else if (kind === 'candle') candle(sc, x, y, z);
  else if (kind === 'glow') {   // a jar with something bright in it
    EMIT = 1; sphere(x, y, z + .13, .11, c || [206, 240, 130], 'glow'); EMIT = 0;
    disc(x, y, z + .26, .09, (a, b, o) => { o.c = [150, 110, 70]; o.flat = true; });
    addLight(sc, x, y, z, 1.7, .5, .3);
  }
}
function sack(x, y, s = 1, c = [224, 210, 178], tie = [150, 120, 90]) {
  sphere(x, y, .3 * s, .36 * s, c, 'rough'); sphere(x, y, .64 * s, .22 * s, c, 'rough'); sphere(x, y, .84 * s, .1 * s, tie, 'solid');
}
function ropeCoil(x, y, z = .05, r = .3, c = [206, 176, 116]) {
  for (let k = 0; k < 3; k++) for (let a = 0; a < 6.283; a += .42) sphere(x + Math.cos(a) * (r - k * .035), y + Math.sin(a) * (r - k * .035), z + k * .075, .065, c, 'rough');
}
function chest(x, y, c = [124, 78, 50]) {
  box(x - .48, y - .32, 0, x + .48, y + .32, .42, c, .5);
  box(x - .5, y - .34, .42, x + .5, y + .34, .58, [c[0] * .8, c[1] * .8, c[2] * .8], .4);
  for (const e of [-.36, .36]) box(x + e - .045, y - .355, 0, x + e + .045, y + .355, .6, [70, 66, 72], .3);
  box(x - .07, y + .32, .3, x + .07, y + .37, .5, PAL.gold, .2);
}
function basket(x, y, r = .3, fill = null) {
  cylinder(x, y, 0, .34, r, (a, t, o) => { o.c = [176, 132, 80]; o.dl = ((a * 9 + Math.floor(t / .07)) % 2 < 1 ? .5 : -.5) + (t % .07 < .02 ? -.6 : 0); }, -Math.PI, Math.PI);
  if (fill) for (let k = 0; k < 6; k++) sphere(x + Math.cos(k * 1.1) * r * .45, y + Math.sin(k * 1.1) * r * .45, .36 + (k % 2) * .06, r * .42, fill, 'rough');
}
function chair(x, y, face = 'y') {   // face: which way the sitter looks ('x' or 'y', both toward the camera)
  for (const [a, b] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) box(x + a - .04, y + b - .04, 0, x + a + .04, y + b + .04, .45, PAL.woodDark, .4);
  box(x - .26, y - .26, .45, x + .26, y + .26, .52, PAL.wood, .5);
  if (face === 'y') box(x - .26, y - .26, .52, x + .26, y - .2, 1.15, PAL.wood, .5); else box(x - .26, y - .26, .52, x - .2, y + .26, 1.15, PAL.wood, .5);
}
function cushion(x, y, c, z = 0) { sphere(x, y, z + .08, .27, c, 'rough'); sphere(x, y, z + .2, .08, [236, 196, 90], 'solid'); }
function stump(x, y, r = .32, h = .45) {
  cylinder(x, y, 0, h, r, (a, t, o) => { o.c = [112, 84, 62]; o.dl = (noise(a * 14, t * 2) - .5) * 1.2; }, -Math.PI, Math.PI);
  disc(x, y, h + .005, r, (a, b, o) => { const q = Math.hypot(a, b); o.c = [206, 170, 118]; o.flat = true; o.dl = (q * 14 % 1 < .3 ? -.6 : .2); });
}
function logStack(x, y, n = 4, len = 1.1, alongX = false) {
  for (let r = 0; r < n; r++) for (let q = 0; q < n - r; q++) {
    const off = (q - (n - r - 1) / 2) * .24, z = .12 + r * .21, c = [150 - r * 8, 104 - r * 4, 66];
    if (alongX) { capsule([x - len / 2, y + off, z], [x + len / 2, y + off, z], .115, .115, () => c, 'rough'); sphere(x + len / 2 + .06, y + off, z, .09, [214, 180, 130], 'solid'); }
    else { capsule([x + off, y - len / 2, z], [x + off, y + len / 2, z], .115, .115, () => c, 'rough'); sphere(x + off, y + len / 2 + .06, z, .09, [214, 180, 130], 'solid'); }
  }
}
// a pot-bellied iron stove with a glowing door and a pipe up through the roof
function stove(sc, x, y, pipe = 3) {
  for (const [a, b] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) capsule([x + a, y + b, 0], [x + a, y + b, .16], .045, .045, () => PAL.iron, 'solid');
  cylinder(x, y, .14, .98, .38, (a, t, o) => { o.c = [64, 60, 68]; o.dl = (Math.abs(t - .06) < .05 || Math.abs(t - .62) < .04) ? .9 : (hash(a * 9 | 0, t * 9 | 0) - .5) * .4; }, -Math.PI, Math.PI);
  disc(x, y, .985, .38, (a, b, o) => { o.c = [78, 74, 82]; });
  EMIT = 1; sphere(x + .27, y + .27, .52, .13, [255, 176, 76], 'glow'); EMIT = 0;
  capsule([x - .12, y - .12, .98], [x - .12, y - .12, pipe], .1, .1, () => [54, 52, 58], 'solid');
  addLight(sc, x + .6, y + .6, .4, 3.4, .9, .3);
  sc.obst.push({ cx: x, cy: y, r: .52 });
}
function kettle(sc, x, y, z, c = [96, 92, 104]) {
  sphere(x, y, z + .13, .15, c, 'gloss'); capsule([x + .1, y + .02, z + .15], [x + .25, y + .04, z + .24], .035, .025, () => c, 'solid');
  sc.smokers.push({ x: x + .26, y: y + .04, z: z + .3, key: 'steam' });
}
function bunk(x, y, quilts) {
  bed(x, y, quilts[0]);
  for (const [a, b] of [[-.55, -1.05], [.5, -1.05], [-.55, 1], [.5, 1]]) box(x + a - .05, y + b - .05, 0, x + a + .05, y + b + .05, 1.9, PAL.woodDark, .4);
  box(x - .58, y - 1.05, 1.2, x + .55, y + 1.02, 1.32, PAL.wood, .5);
  quad([x - .52, y - .95, 1.33], [1.04, 0, 0], [0, 1.9, 0], (s, t, o) => { o.c = t < .45 ? PAL.cream : (Math.floor(s / .26) + Math.floor(t / .26)) % 2 ? quilts[1] : mixc(quilts[1], PAL.cream, .5); o.flat = true; o.dl = .2; }, false, [0, 0, 1]);
  sphere(x, y - .64, 1.42, .18, PAL.cream, 'solid');
  for (let k = 1; k < 5; k++) capsule([x + .56, y + .75, k * .26], [x + .56, y + 1.0, k * .26], .03, .03, () => PAL.wood, 'solid');
}
function bedroll(x, y, c, alongX = true) {
  const cream = [238, 228, 204];
  if (alongX) { quad([x - .8, y - .28, .03], [1.6, 0, 0], [0, .56, 0], (s, t, o) => { o.c = s < .4 ? cream : (Math.floor(s / .2) % 2 ? c : mixc(c, cream, .3)); o.flat = true; o.dl = .2; }, false, [0, 0, 1]); capsule([x - .78, y - .2, .1], [x - .78, y + .2, .1], .1, .1, () => cream, 'solid'); }
  else { quad([x - .28, y - .8, .03], [.56, 0, 0], [0, 1.6, 0], (s, t, o) => { o.c = t < .4 ? cream : (Math.floor(t / .2) % 2 ? c : mixc(c, cream, .3)); o.flat = true; o.dl = .2; }, false, [0, 0, 1]); capsule([x - .2, y - .78, .1], [x + .2, y - .78, .1], .1, .1, () => cream, 'solid'); }
}
function pack(x, y, c = [150, 104, 60], roll = [120, 80, 110]) {
  capsule([x, y, .1], [x, y, .52], .22, .19, () => c, 'solid'); capsule([x - .2, y, .68], [x + .2, y, .68], .1, .1, () => roll, 'rough');
  box(x - .1, y + .19, .2, x + .1, y + .24, .4, [c[0] * .75, c[1] * .75, c[2] * .75], .3);
}
// a hanging lamp's fixed parts: the hook in the beam and its pool of light (the lamp itself swings, see swingLamp)
function lampHook(sc, x, y, z, r = 4, k = .85) { sphere(x, y, z, .05, PAL.iron, 'solid'); addLight(sc, x, y, 1.2, r, k, .2); }

/* ---------- a canvas tent, seen with two walls folded away ---------- */
function tentRoom(sc, { c, stripe = [238, 228, 204], floor }) {
  const { w, d, h } = sc.room, x0 = -w / 2, x1 = w / 2, y0 = -d / 2, y1 = d / 2;
  KIND = K_FLOOR;
  quad([x0, y0, 0], [w, 0, 0], [0, d, 0], floor, false, [0, 0, 1]);
  KIND = 0;
  const earth = (s, t, o) => { o.c = t > .4 ? [104, 122, 66] : t > .3 ? [96, 76, 56] : [116, 88, 64]; o.dl = (noise(s * 5, t * 6) - .5) * 1.1; };
  quad([x0, y1, -.5], [w, 0, 0], [0, 0, .5], earth, false, [0, 1, 0]);
  quad([x1, y0, -.5], [0, d, 0], [0, 0, .5], earth, false, [1, 0, 0]);
  // canvas walls that rise to the ridge in the middle and sag between the poles
  const cloth = len => (s, t, o) => {
    const top = h * (.74 + .26 * Math.sin(s / len * Math.PI));
    if (t > top) return false;
    o.c = Math.floor(s / .52) % 2 ? c : stripe;
    o.dl = Math.sin(s * 12.1) * .3 + (t > top - .09 ? -.9 : 0) + (t < .1 ? -.7 : 0) + (noise(s * 3, t * 3) - .5) * .4;
  };
  quad([x0, y0, 0], [0, d, 0], [0, 0, h], cloth(d), false, [1, 0, 0]);
  quad([x0, y0, 0], [w, 0, 0], [0, 0, h], cloth(w), false, [0, 1, 0]);
  for (const [px, py] of [[x0 + .06, y0 + .06], [x0 + .06, y1 - .04], [x1 - .04, y0 + .06]]) capsule([px, py, 0], [px, py, h * .74 + .12], .055, .05, () => PAL.woodDark, 'solid');
  // guy ropes pegged down at the open corners
  for (const [px, py, qx, qy] of [[x0 + .06, y1 - .04, x0 + .5, y1 + .0], [x1 - .04, y0 + .06, x1, y0 + .5]]) sphere(qx, qy, .05, .06, PAL.woodDark, 'solid');
}
const clothFloor = (c, c2) => (s, t, o) => { o.c = (noise(s * 1.3, t * 1.3) > .55) ? c2 : c; o.dl = (noise(s * 6, t * 6) - .5) * .6; };

/* ---------- things that move: drawn every frame from sc.anim(t) ---------- */
const IRON_F = () => PAL.iron, WOODD_F = () => PAL.woodDark, WOOD_F = () => PAL.wood;
const SWX = 1 / R2, SWY = -1 / R2;   // "screen right" in room coordinates
function swingLamp(x, y, zTop, len, t, ph = 0, c = PAL_LAMP) {
  const a = Math.sin(t * 1.7 + ph) * .2, s = Math.sin(a) * len, bx = x + s * SWX, by = y + s * SWY, bz = zTop - Math.cos(a) * len;
  capsule([x, y, zTop], [bx, by, bz + .24], .03, .03, IRON_F, 'solid');
  sphere(bx, by, bz + .2, .13, PAL.iron, 'solid');          // the cap
  sphereGlow(bx, by, bz, .17, c);                            // the glass, alight
  sphere(bx, by, bz - .19, .07, PAL.iron, 'solid');
}
const PAL_LAMP = [255, 214, 130];
// a wheel turning flat against a wall (axis 'x': against the left wall, 'y': against the right-hand back wall)
function turnWheel(cx, cy, cz, r, ang, axis, teeth, c, toothR = .09) {
  for (let k = 0; k < teeth; k++) {
    const a = ang + k / teeth * 6.283, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
    sphere(axis === 'x' ? cx : cx + ca, axis === 'x' ? cy + ca : cy, cz + sa, toothR, c, 'solid');
  }
  for (let k = 0; k < 4; k++) {
    const a = ang + k * Math.PI / 2, ca = Math.cos(a) * r * .9, sa = Math.sin(a) * r * .9;
    capsule([cx, cy, cz], [axis === 'x' ? cx : cx + ca, axis === 'x' ? cy + ca : cy, cz + sa], .05, .05, WOODD_F, 'solid');
  }
  sphere(cx, cy, cz, .12, PAL.woodDark, 'solid');
}
// marks going round on something that turns flat: a millstone, a potter's wheel
function turnMarks(x, y, z, r, ang, n, c) {
  for (let k = 0; k < n; k++) { const a = ang + k / n * 6.283; sphere(x + Math.cos(a) * r, y + Math.sin(a) * r, z, .05, c, 'solid'); }
}

/* ---------- drifting particles for rooms ---------- */
const STEAM_C = rgb(236, 236, 240), FLOUR_C = rgb(250, 244, 226), INCENSE_C = rgb(200, 190, 210), FLY_A = rgb(220, 255, 140), FLY_B = rgb(120, 160, 80), SAW_C = rgb(226, 196, 140);
const flyColor = p => (Math.sin(p.life * 5) > 0 ? FLY_A : FLY_B);
const ROOM_FX = {
  steam(s, k, sc) { if (!STILL && Math.random() < (s.rate || 5) * k) { const r = s.r || .06; emit({ scene: sc.id, x: s.x + (Math.random() - .5) * r, y: s.y + (Math.random() - .5) * r, z: s.z, vx: .05, vy: -.05, vz: .42 + Math.random() * .25, life: 1 + Math.random() * .6, wob: 5, c: STEAM_C, over: true }); } },
  dust(s, k, sc) { if (!STILL && Math.random() < (s.rate || 3) * k) emit({ scene: sc.id, x: (Math.random() - .5) * sc.room.w * .8, y: (Math.random() - .5) * sc.room.d * .8, z: .4 + Math.random() * 2.2, vx: .07, vy: -.07, vz: -.06, life: 3.6, wob: 2, c: s.c || FLOUR_C, over: true }); },
  bubbles(s, k, sc) { if (!STILL && Math.random() < 4 * k) emit({ scene: sc.id, x: s.x + (Math.random() - .5) * .4, y: s.y + (Math.random() - .5) * .4, z: s.z, vx: 0, vy: 0, vz: .5, life: .45, c: s.c, glow: s.glow ? 1 : 0, over: true }); },
  incense(s, k, sc) { if (!STILL && Math.random() < 3 * k) emit({ scene: sc.id, x: s.x, y: s.y, z: s.z, vx: 0, vy: 0, vz: .34, life: 2.6, wob: 4, c: INCENSE_C, over: true }); },
  flies(s, k, sc) { if (!STILL && Math.random() < 2.4 * k) emit({ scene: sc.id, x: s.x + (Math.random() - .5) * s.r, y: s.y + (Math.random() - .5) * s.r, z: .5 + Math.random() * 1.8, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: (Math.random() - .5) * .2, life: 4, c: flyColor, glow: 1, over: true }); },
};

/* ---------- h2: the Net Loft, down by the harbour ---------- */
function buildNetLoft() {
  const sc = roomScene('h2', 7, 6, 'The Net Loft', 20);
  sc.with(() => {
    room(sc, { w: 7, d: 6, wall: [214, 208, 192], floor: [150, 114, 80], wainscot: [86, 104, 130], windows: [{ wall: 'y', at: .74 }] });
    netting(sc, 'x', .5, 1.15, 3, 1.6);
    hangRow(sc, 'y', -3.1, -1.2, 2.55, 6, 'fish');
    wallRing(sc, 'y', -.1, 2.0, .42, [150, 104, 64], 4);
    wallShelf(sc, 'y', -.1, 1.05, 1.5, [['shell', [240, 200, 190]], ['jar', [120, 170, 200]], ['shell', [236, 226, 200]], 'candle']);
    // an oar and a boathook leaning in the corner
    capsule([-3.2, -2.8, 0], [-3.3, -2.9, 2.6], .04, .04, () => [200, 160, 110], 'solid'); capsule([-3.3, -2.9, 2.2], [-3.3, -2.9, 2.75], .1, .07, () => [224, 214, 190], 'solid');
    // the mending bench: a heap of net, a ship in a bottle, a candle
    table(-1.4, -2.2, 1.9, .9, .8, PAL.woodLight);
    for (let k = 0; k < 5; k++) sphere(-2 + k * .11, -2.2 + (k % 2) * .12, .96, .16, [182, 156, 108], 'rough');
    capsule([-1.25, -2.15, 1.04], [-.8, -2.15, 1.04], .15, .15, () => [176, 214, 214], 'gloss'); capsule([-.8, -2.15, 1.04], [-.6, -2.15, 1.04], .06, .05, () => [176, 214, 214], 'gloss');
    box(-1.2, -2.0, .98, -.9, -1.96, 1.05, [110, 70, 48], .2); quad([-1.1, -1.97, 1.05], [.14, 0, 0], [0, 0, .16], (s, t, o) => { o.c = PAL.cream; o.flat = true; }, true, [0, 1, 0]);
    candle(sc, -.5, -2.45, .88);
    stool(-1.3, -1.35);
    sc.obst.push({ x0: -2.4, y0: -2.7, x1: -.4, y1: -1.1 });
    // barrels of the day's catch, crates, coils of rope and a sea chest
    for (const [x, y, s] of [[2.85, -2.35, .9], [2.1, -2.45, .75]]) { barrel(x, y, s, [140, 90, 60]); for (let k = 0; k < 4; k++) capsule([x - .12 + k * .08, y - .1, .82 * s], [x + .1 - k * .03, y + .12, .86 * s], .05, .03, () => [150, 172, 192], 'solid'); sc.obst.push({ cx: x, cy: y, r: .42 }); }
    crate(2.95, -1.3, .8);
    ropeCoil(1.2, -2.4); ropeCoil(-2.9, 2.35, .05, .26);
    chest(-2.85, -.9); sc.obst.push({ x0: -3.4, y0: -1.3, x1: -2.3, y1: -.5 });
    for (const [x, y] of [[-2.9, .6], [-2.6, 1.3]]) { basket(x, y, .3, [150, 172, 192]); sc.obst.push({ cx: x, cy: y, r: .36 }); }
    // an anchor propped against the wall
    capsule([.9, -2.85, .1], [.9, -2.9, 1.3], .05, .05, IRON_F, 'solid'); capsule([.55, -2.85, .3], [.9, -2.85, .1], .05, .04, IRON_F, 'solid'); capsule([1.25, -2.85, .3], [.9, -2.85, .1], .05, .04, IRON_F, 'solid'); capsule([.7, -2.9, 1.15], [1.1, -2.9, 1.15], .035, .035, IRON_F, 'solid');
    rug(.6, .5, 2.4, 1.6, [70, 100, 140], [230, 220, 196]);
    stove(sc, 1.9, -1.1); kettle(sc, 1.9, -1.1, .99);
    lampHook(sc, .2, .3, 3);
    sc.obst.push({ x0: 2.5, y0: -1.75, x1: 3.4, y1: -.85 }, { cx: 1.2, cy: -2.4, r: .35 });
    doorMat(sc);
  });
  sc.anim = t => swingLamp(.2, .3, 3, 1, t);
  sc.critters = [{ kind: 'cat2', x: .2, y: 1.0, yaw: .6 }];
  return finishRoom(sc);
}

/* ---------- h5: the Tarnside Bathhouse ---------- */
function buildBath() {
  const sc = roomScene('h5', 7, 6, 'The Tarnside Bathhouse', 20);
  sc.with(() => {
    room(sc, { w: 7, d: 6, stone: true, floor: [150, 128, 104], windows: [{ wall: 'x', at: .3, arch: true, h: 1.3 }] });
    floorPaint(sc, (s, t, o) => { const cx = Math.floor(s / .7), cy = Math.floor((t + (cx % 2) * .35) / .7); o.c = hash(cx, cy) > .5 ? [156, 148, 140] : [140, 134, 130]; o.dl = (s % .7 < .05 || (t + (cx % 2) * .35) % .7 < .05 ? -1 : (hash(cx * 3, cy) - .5) * .5); });
    // the great tub: oak staves, iron hoops, water from the hot spring
    const tx = -.5, ty = -.3;
    cylinder(tx, ty, 0, .9, 1.25, (a, t, o) => { o.c = [150, 104, 64]; o.dl = (Math.abs(t - .2) < .05 || Math.abs(t - .7) < .05 ? -1.4 : (a * 4.6 % 1 < .12 ? -.7 : (hash(a * 4.6 | 0, 3) - .5) * .5)); }, -Math.PI, Math.PI);
    disc(tx, ty, .9, 1.25, (a, b, o) => { const r = Math.hypot(a, b); if (r > 1.1) { o.c = [176, 128, 82]; o.flat = true; return; } o.c = r < .6 ? [96, 170, 186] : [120, 190, 200]; o.kind = K_WATER; o.flat = true; });
    sc.smokers.push({ x: tx, y: ty, z: 1, r: 1.8, rate: 9, key: 'steam' });
    box(tx + .9, ty + 1.0, 0, tx + 1.5, ty + 1.5, .3, PAL.wood, .5); box(tx + 1.0, ty + .75, 0, tx + 1.5, ty + 1.05, .6, PAL.wood, .5);
    sc.obst.push({ cx: tx, cy: ty, r: 1.35 }, { x0: tx + .85, y0: ty + .7, x1: tx + 1.55, y1: ty + 1.55 });
    for (const [x, y] of [[-2.3, 1.5], [1.2, -1.6], [-2.2, -2.2]]) candle(sc, x, y, 0);
    // towels on a rail, a shelf of soaps and oils
    capsule(wallPos(sc, 'y', .7, 2.2, .16), wallPos(sc, 'y', 3.1, 2.2, .16), .03, .03, WOODD_F, 'solid');
    [[236, 228, 208], [200, 110, 100], [110, 150, 180], [236, 196, 110]].forEach((c, k) => onWall(sc, 'y', 1.05 + k * .58, 1.35, .44, .86, (s, t, o) => { o.c = t < .12 || (t > .3 && t < .38) ? mixc(c, [255, 255, 255], .5) : c; o.flat = true; o.dl = Math.sin(s * 14) * .3; }, .17));
    wallShelf(sc, 'x', 1.9, 1.5, 1.5, [['bottle', [200, 150, 190]], ['jar', [236, 220, 170]], ['bottle', [120, 180, 150]], ['bowl', [236, 226, 204]]]);
    // a bench with folded towels and a pair of slippers; buckets and a ladle
    box(-3.4, .9, .4, -2.85, 2.7, .48, PAL.wood, .5); for (const y of [1.0, 2.6]) box(-3.35, y - .05, 0, -2.9, y + .05, .4, PAL.woodDark, .4);
    for (let k = 0; k < 3; k++) box(-3.3, 1.2, .48 + k * .1, -2.95, 1.75, .57 + k * .1, [[236, 228, 208], [200, 110, 100], [110, 150, 180]][k], .3);
    for (const y of [2.15, 2.4]) capsule([-2.7, y, .05], [-2.5, y, .05], .07, .06, () => [150, 60, 60], 'solid');
    sc.obst.push({ x0: -3.5, y0: .8, x1: -2.8, y1: 2.8 });
    for (const [x, y] of [[2.9, -2.3], [2.3, -2.5]]) { cylinder(x, y, 0, .42, .24, (a, t, o) => { o.c = [160, 112, 70]; o.dl = Math.abs(t - .3) < .04 ? -1.2 : 0; }, -Math.PI, Math.PI); disc(x, y, .36, .2, (a, b, o) => { o.c = [120, 190, 200]; o.kind = K_WATER; o.flat = true; }); sc.obst.push({ cx: x, cy: y, r: .3 }); }
    stove(sc, 2.85, -.9); for (let k = 0; k < 5; k++) sphere(2.85 + Math.cos(k * 1.3) * .16, -.9 + Math.sin(k * 1.3) * .16, 1.06, .1, [120, 112, 110], 'rough');
    // a fern in a pot, because steam is good for ferns
    capsule([-2.9, -2.5, 0], [-2.9, -2.5, .3], .2, .24, () => [184, 108, 72], 'solid'); for (let k = 0; k < 8; k++) sphere(-2.9 + Math.cos(k * .8) * .25, -2.5 + Math.sin(k * .8) * .25, .5 + (k % 3) * .12, .13, k % 2 ? [96, 150, 84] : [70, 122, 70], 'rough');
    sc.obst.push({ cx: -2.9, cy: -2.5, r: .4 });
    rug(2.0, 1.0, 1.3, 1.0, [200, 110, 100], [236, 228, 208]);
    doorMat(sc);
  });
  // a wooden duck going round and round
  sc.anim = t => {
    const a = t * .35, x = -.5 + Math.cos(a) * .55, y = -.3 + Math.sin(a) * .5, z = .98 + Math.sin(t * 2.2) * .02, fx = -Math.sin(a), fy = Math.cos(a);
    sphere(x, y, z, .12, [244, 206, 80], 'solid'); sphere(x + fx * .1, y + fy * .1, z + .13, .08, [244, 206, 80], 'solid'); sphere(x + fx * .19, y + fy * .19, z + .12, .035, [236, 130, 50], 'solid');
  };
  return finishRoom(sc);
}

/* ---------- h7: Bryn's Bothy (the shepherd's) ---------- */
function buildBothy() {
  const sc = roomScene('h7', 7, 6, "Bryn's Bothy", 20);
  sc.with(() => {
    room(sc, { w: 7, d: 6, wall: [228, 214, 190], floor: [156, 114, 76], windows: [{ wall: 'y', at: .2 }] });
    fireplace(sc, -3.5, -.4, true); sc.obst.push({ x0: -3.5, y0: -1.5, x1: -2.9, y1: .7 });
    onWall(sc, 'x', -.4, 2.1, .9, .5, (s, t, o) => { if (Math.abs(t - .25 - Math.abs(s - .45) * .5) > .07) return false; o.c = [214, 190, 150]; o.flat = true; }, .42);   // a ram's horns over the hearth
    rug(-.9, .5, 2.6, 1.8, [238, 230, 212], [206, 192, 168]);
    // the spinning wheel's bench (the wheel itself turns, see anim) and a stool
    box(.4, -2.75, .0, .5, -2.65, .95, PAL.woodDark, .4); box(1.5, -2.75, 0, 1.6, -2.65, .6, PAL.woodDark, .4); box(.35, -2.8, .5, 1.95, -2.55, .58, PAL.wood, .5);
    capsule([1.8, -2.65, .58], [1.8, -2.65, 1.25], .03, .03, WOODD_F, 'solid'); sphere(1.8, -2.65, 1.36, .15, [238, 232, 216], 'rough');
    stool(1.5, -1.9);
    sc.obst.push({ x0: .2, y0: -3, x1: 2.1, y1: -2.3 });
    // a little loom with a half-woven blanket
    for (const x of [-2.3, -1.0]) box(x - .05, -2.85, 0, x + .05, -2.75, 1.9, PAL.woodDark, .4);
    box(-2.35, -2.85, 1.85, -.95, -2.75, 1.95, PAL.woodDark, .4);
    onWall(sc, 'y', -1.65, .5, 1.2, 1.35, (s, t, o) => { o.flat = true; if (t > .75) { o.c = s % .1 < .03 ? [236, 228, 208] : [214, 200, 176]; return; } o.c = [[196, 80, 70], [236, 196, 100], [96, 140, 170], [236, 228, 208]][Math.floor(t / .1) % 4]; o.dl = s % .2 < .1 ? .2 : -.2; }, .2);
    sc.obst.push({ x0: -2.5, y0: -3, x1: -.8, y1: -2.5 });
    hangRow(sc, 'y', 2.2, 3.4, 2.55, 4, 'skein');
    hangRow(sc, 'x', 1.2, 2.8, 2.5, 4, 'skein', 3);
    // baskets of fleece, a crook in the corner, a row of sheep bells
    for (const [x, y, c] of [[-2.95, 1.6, [240, 236, 224]], [-2.5, 2.35, [200, 190, 176]], [-3.0, 2.4, [120, 104, 96]]]) { basket(x, y, .3, c); sc.obst.push({ cx: x, cy: y, r: .36 }); }
    capsule([3.2, -2.85, 0], [3.25, -2.9, 2.1], .04, .04, WOOD_F, 'solid'); for (let a = 0; a < 3.3; a += .4) sphere(3.25 - .18 + Math.cos(a) * .18, -2.9, 2.1 + Math.sin(a) * .18, .04, PAL.wood, 'solid');
    wallShelf(sc, 'x', 1.9, 1.35, 1.5, [['gem', [214, 170, 80]], ['gem', [200, 150, 70]], ['gem', [226, 190, 96]], 'cheese', ['jar', [236, 228, 208]]]);
    bed(2.85, -.9, [150, 96, 80]); sc.obst.push({ x0: 2.2, y0: -2.1, x1: 3.5, y1: .2 });
    // a rocking chair by the fire with a blanket over it
    chair(-1.7, -1.5, 'x'); box(-1.95, -1.76, .52, -1.44, -1.24, .6, [196, 80, 70], .4); sc.obst.push({ cx: -1.7, cy: -1.5, r: .4 });
    candle(sc, 2.35, .65, 0);
    doorMat(sc);
  });
  // the wheel turns; an orphan lamb sleeps by the fire, breathing
  sc.anim = t => {
    turnWheel(.95, -2.5, 1.15, .52, t * 1.4, 'y', 12, PAL.wood, .05);
    const b = Math.sin(t * 1.6) * .012, x = -2.2, y = .55;
    sphere(x, y, .2 + b, .25 + b, [244, 240, 230], 'solid'); sphere(x - .18, y + .12, .17, .19, [240, 236, 224], 'solid');
    sphere(x + .22, y + .16, .19, .13, [70, 60, 60], 'solid'); sphere(x + .2, y + .06, .29, .05, [70, 60, 60], 'solid');
  };
  sc.smokers.push({ key: 'dust', rate: 1.2, c: rgb(250, 246, 236) });
  return finishRoom(sc);
}

/* ---------- h9: the Climbers' Hut, under the range ---------- */
function buildClimbers() {
  const sc = roomScene('h9', 7, 6, "The Climbers' Hut", 20);
  sc.with(() => {
    room(sc, { w: 7, d: 6, stone: true, floor: [140, 108, 80], windows: [{ wall: 'x', at: .72 }] });
    bunk(2.85, -1.85, [[190, 96, 60], [80, 130, 150]]); sc.obst.push({ x0: 2.2, y0: -3, x1: 3.5, y1: -.7 });
    stove(sc, -.3, -2.35); kettle(sc, -.3, -2.35, .99);
    // boots drying by the stove, two pairs
    for (const [x, y] of [[.45, -1.75], [.75, -1.75], [-1.1, -1.8], [-.82, -1.8]]) { capsule([x, y, .05], [x, y, .3], .08, .09, () => [86, 62, 48], 'solid'); capsule([x, y, .06], [x + .02, y + .14, .06], .08, .07, () => [86, 62, 48], 'solid'); }
    hangRow(sc, 'x', -2.6, -.4, 2.5, 4, 'rope');
    // crossed ice axes and a pair of snowshoes on the wall
    for (const s of [-1, 1]) { capsule(wallPos(sc, 'x', .5 - s * .4, 1.45, .1), wallPos(sc, 'x', .5 + s * .4, 2.35, .1), .03, .03, WOOD_F, 'solid'); capsule(wallPos(sc, 'x', .5 + s * .4, 2.35, .1), wallPos(sc, 'x', .5 + s * .15, 2.42, .1), .05, .02, () => [170, 174, 184], 'solid'); }
    wallRing(sc, 'y', -2.6, 1.9, .42, [176, 132, 80], 3, .5); wallRing(sc, 'y', -1.9, 1.9, .42, [176, 132, 80], 3, .5);
    wallMap(sc, 'y', 1.0, 1.4, 1.5, 1.0, true);
    // the table with the summit book, mugs and a candle
    table(-1.6, 1.0, 1.5, .9, .78, PAL.woodLight); stool(-1.7, .2); stool(-.55, 1.1);
    quad([-2.05, .78, .87], [.6, 0, 0], [0, .44, 0], (s, t, o) => { o.c = Math.abs(s - .3) < .02 ? [120, 90, 60] : PAL.cream; o.flat = true; o.dl = .4; if (t % .09 < .025 && Math.abs(s - .3) > .06) o.c = [150, 130, 120]; }, false, [0, 0, 1]);
    trinket(sc, ['cup', [190, 96, 60]], -1.2, 1.25, .86); trinket(sc, ['cup', [80, 130, 150]], -1.05, .8, .86); candle(sc, -1.5, 1.3, .86);
    sc.obst.push({ x0: -2.45, y0: .45, x1: -.75, y1: 1.55 });
    pack(-3.0, -2.5); pack(-2.45, -2.6, [96, 120, 80], [200, 150, 70]); sc.obst.push({ x0: -3.4, y0: -2.95, x1: -2.1, y1: -2.2 });
    ropeCoil(-3.0, 2.4); sc.obst.push({ cx: -3, cy: 2.4, r: .36 });
    // summit stones: one from every peak
    wallShelf(sc, 'y', -.3, 2.05, 1.3, [['gem', [150, 146, 150]], ['gem', [200, 190, 210]], ['gem', [120, 130, 150]], ['gem', [236, 240, 250]]]);
    rug(.3, .7, 2.0, 1.4, [150, 60, 56], [236, 196, 90]);
    lampHook(sc, .3, .2, 3);
    doorMat(sc);
  });
  sc.anim = t => swingLamp(.3, .2, 3, .95, t, 1);
  return finishRoom(sc);
}

/* ---------- h18: the Woodcutter's Cabin ---------- */
function buildWoodcutter() {
  const sc = roomScene('h18', 7, 6, "The Woodcutter's Cabin", 20);
  sc.with(() => {
    room(sc, { w: 7, d: 6, wall: [150, 106, 68], floor: [134, 98, 66], windows: [{ wall: 'y', at: .62 }] });
    wallpaper(sc, logWall);
    logStack(-2.9, -1.2, 5, 1.2, false); logStack(-2.9, .5, 4, 1.2, false); sc.obst.push({ x0: -3.5, y0: -2, x1: -2.2, y1: 1.3 });
    // the chopping block, with the axe left in it and kindling all round
    stump(-.6, .4, .36, .5);
    capsule([-.55, .4, .52], [-.2, .15, 1.15], .035, .035, WOOD_F, 'solid'); box(-.68, .3, .5, -.5, .5, .78, [170, 174, 184], .3);
    for (let k = 0; k < 7; k++) { const a = hash(k, 5) * 6.28, r = .6 + hash(k, 6) * .4; capsule([-.6 + Math.cos(a) * r, .4 + Math.sin(a) * r, .05], [-.6 + Math.cos(a) * r + .22, .4 + Math.sin(a) * r + .08, .05], .045, .04, () => [206, 170, 118], 'solid'); }
    sc.obst.push({ cx: -.6, cy: .4, r: .45 });
    // a sawhorse with a log across it, and the sawdust under
    for (const x of [.9, 1.9]) { capsule([x, -1.4, 0], [x, -1.1, .6], .04, .04, WOODD_F, 'solid'); capsule([x, -.8, 0], [x, -1.1, .6], .04, .04, WOODD_F, 'solid'); }
    capsule([.6, -1.1, .68], [2.2, -1.1, .68], .14, .14, () => [150, 104, 66], 'rough'); sphere(2.26, -1.1, .68, .11, [214, 180, 130], 'solid');
    for (let k = 0; k < 9; k++) sphere(1.4 + (hash(k, 1) - .5) * .9, -1.0 + (hash(k, 2) - .5) * .5, .03, .09, [226, 196, 140], 'rough');
    sc.obst.push({ x0: .6, y0: -1.5, x1: 2.3, y1: -.7 });
    stove(sc, 2.9, -2.4); kettle(sc, 2.9, -2.4, .99);
    // a shelf of whittled animals, hams and onions by the stove
    wallShelf(sc, 'y', -1.6, 1.6, 2.0, ['carving', 'carving', ['bowl', [186, 140, 92]], 'carving', 'candle']);
    hangRow(sc, 'y', 1.7, 3.3, 2.55, 4, 'ham'); hangRow(sc, 'y', -3.2, -2.4, 2.55, 2, 'onion');
    // a two-handed saw hung on the log wall
    onWall(sc, 'x', 2.1, 1.7, 1.5, .34, (s, t, o) => { if (t < .1 && s % .1 > .05) return false; if (s < .12 || s > 1.38) { o.c = PAL.wood; o.flat = true; return; } o.c = [176, 180, 190]; o.flat = true; o.dl = .3; }, .1);
    bed(2.85, .1, [96, 120, 80]); sc.obst.push({ x0: 2.2, y0: -1, x1: 3.5, y1: 1.2 });
    rug(.4, 1.7, 1.8, 1.2, [120, 84, 60], [86, 60, 46]);
    // the owl's perch
    capsule([-3.0, -2.6, 0], [-3.0, -2.6, 1.9], .05, .05, WOODD_F, 'solid'); capsule([-3.3, -2.6, 1.9], [-2.7, -2.6, 1.9], .04, .04, WOODD_F, 'solid'); sc.obst.push({ cx: -3, cy: -2.6, r: .3 });
    lampHook(sc, -.2, -.6, 3, 4.2);
    doorMat(sc);
  });
  sc.anim = t => swingLamp(-.2, -.6, 3, .9, t, 2);
  sc.critters = [{ kind: 'owl', x: -3.0, y: -2.6, z: 1.94 }];
  sc.smokers.push({ key: 'dust', rate: 1.6, c: SAW_C });
  return finishRoom(sc);
}

/* ---------- h19: Old Moss's Hollow ---------- */
function buildHollow() {
  const sc = roomScene('h19', 7, 6, "Old Moss's Hollow", 20);
  sc.with(() => {
    room(sc, { w: 7, d: 6, wall: [186, 176, 140], floor: [124, 96, 66], wainscot: [84, 100, 66], windows: [{ wall: 'y', at: .26 }] });
    // moss has crept in across the boards, and nobody minded
    floorPaint(sc, (s, t, o) => { const n = noise(s * .9 + 3, t * .9) + (hash(s * 12 | 0, t * 12 | 0) - .5) * .25; if (n < .64) return false; o.c = n > .76 ? [92, 126, 68] : [74, 104, 60]; o.dl = (hash(s * 16 | 0, t * 16 | 0) - .5) * 1.2; });
    hangRow(sc, 'x', -2.8, 2.6, 2.6, 11, 'herb'); hangRow(sc, 'y', .2, 3.3, 2.6, 6, 'herb', 2);
    // the pot over a little fire, always something simmering
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; sphere(-1.1 + Math.cos(a) * .5, -.7 + Math.sin(a) * .5, .08, .11, [116, 112, 108], 'rough'); }
    for (const a of [0, 2.1, 4.2]) capsule([-1.1 + Math.cos(a) * .55, -.7 + Math.sin(a) * .55, 0], [-1.1, -.7, 1.5], .03, .03, IRON_F, 'solid');
    sphere(-1.1, -.7, .7, .36, [176, 110, 66], 'gloss');
    EMIT = 1; disc(-1.1, -.7, .98, .26, (a, b, o) => { o.c = [150, 214, 120]; o.flat = true; o.dl = hash(a * 20 | 0, b * 20 | 0) * .8; }); EMIT = 0;
    sc.fires.push({ x: -1.1, y: -.7, z: .1, kind: 'hearth' }, { x: -1.1, y: -.7, z: 1.0, kind: 'cauldron' });
    addLight(sc, -1.1, -.7, .4, 4, 1, .3);
    sc.obst.push({ cx: -1.1, cy: -.7, r: .7 });
    // glowcaps growing where the damp is, and a mossy log of them
    for (const [x, y, c, s] of [[-3.1, -2.6, [120, 220, 200], 1.2], [-2.7, -2.75, [190, 140, 240], .8], [-3.2, -2.1, [240, 180, 110], .7], [-3.15, 2.5, [120, 220, 200], 1], [-2.75, 2.7, [190, 140, 240], .7], [3.1, -2.7, [240, 180, 110], .9]]) glowcap(sc, x, y, c, s);
    addLight(sc, -3, -2.5, .4, 2.6, .6, .2); addLight(sc, -3, 2.6, .4, 2.2, .5, .2);
    capsule([1.7, -2.5, .16], [3.0, -2.5, .16], .17, .15, () => [104, 84, 62], 'rough'); for (const [x, c] of [[2.0, [120, 220, 200]], [2.45, [240, 180, 110]], [2.8, [190, 140, 240]]]) { capsule([x, -2.5, .3], [x, -2.5, .46], .03, .03, () => [226, 220, 200], 'solid'); EMIT = 1; sphere(x, -2.5, .5, .1, c, 'solid'); EMIT = 0; }
    sc.obst.push({ x0: 1.5, y0: -2.8, x1: 3.2, y1: -2.2 }, { cx: -3, cy: -2.5, r: .5 }, { cx: -3, cy: 2.6, r: .4 });
    // a stump for a table, stumps for stools, tea things, and jars of fireflies on the sill
    stump(.9, .6, .55, .6); stump(.1, 1.3, .26, .4); stump(1.75, .1, .26, .4); sc.obst.push({ cx: .9, cy: .6, r: .62 }, { cx: .1, cy: 1.3, r: .3 }, { cx: 1.75, cy: .1, r: .3 });
    trinket(sc, ['pot', [120, 150, 110]], .8, .5, .6); trinket(sc, ['cup', [236, 226, 204]], 1.15, .8, .6); trinket(sc, ['cup', [236, 226, 204]], .6, .9, .6);
    wallShelf(sc, 'y', -1.7, 1.0, 1.5, ['sprout', ['glow', [206, 240, 130]], 'sprout', ['glow', [150, 230, 200]], 'sprout']);
    wallShelf(sc, 'x', .4, 1.45, 1.9, [['jar', [150, 190, 120]], ['bottle', [170, 120, 190]], 'books', ['jar', [200, 170, 110]], ['bottle', [120, 170, 150]]]);
    // an old armchair with a green blanket, and a bed of ferns in the corner
    box(-3.3, .6, 0, -2.5, 1.5, .5, [110, 84, 60], .6); box(-3.4, .6, .5, -3.15, 1.5, 1.3, [110, 84, 60], .6); box(-3.15, .7, .5, -2.55, 1.4, .6, [96, 140, 80], .5); sc.obst.push({ x0: -3.5, y0: .5, x1: -2.4, y1: 1.6 });
    bed(2.85, -.5, [96, 140, 80]); sc.obst.push({ x0: 2.2, y0: -1.7, x1: 3.5, y1: .6 });
    doorMat(sc);
  });
  // a snail crossing the floor: it will get there
  sc.anim = t => {
    const u = (t * .02) % 1, x = -.4 + u * 1.6, y = 2.35;
    capsule([x, y, .04], [x + .2, y, .04], .04, .035, () => [214, 196, 150], 'solid'); sphere(x + .04, y, .13, .1, [176, 120, 80], 'solid');
    sphere(x + .22, y, .11, .02, [214, 196, 150], 'solid');
  };
  sc.smokers.push({ key: 'flies', x: 0, y: 0, r: 5 });
  return finishRoom(sc);
}

/* ---------- h20: the Bone-Digger's Hut, out in the Wastes ---------- */
function buildBones() {
  const sc = roomScene('h20', 7, 6, "The Bone-Digger's Hut", 20);
  const sand = (s, t, o) => { o.c = noise(s * 1.2, t * 1.2) > .5 ? [206, 182, 128] : [192, 168, 116]; o.dl = (hash(s * 14 | 0, t * 14 | 0) - .5) * .9 + Math.sin(s * 5 + t * 2) * .2; };
  sc.with(() => {
    room(sc, { w: 7, d: 6, stone: true, floor: [170, 140, 100], windows: [{ wall: 'x', at: .68 }] });
    wallpaper(sc, sandstone); floorPaint(sc, sand);
    // the great skull on its plinth, and the ribs of whatever it was rising behind
    box(-1.5, -2.7, 0, .3, -1.6, .5, [150, 124, 90], .6);
    const bone = [238, 228, 200], boneD = [206, 192, 160];
    sphere(-.7, -2.15, 1.0, .55, bone, 'solid'); sphere(-.25, -1.75, .82, .36, bone, 'solid'); sphere(-.05, -1.55, .7, .22, boneD, 'solid');
    sphere(-.5, -1.72, 1.12, .13, [44, 34, 36], 'solid'); sphere(-.86, -1.66, 1.1, .12, [44, 34, 36], 'solid');
    capsule([-1.05, -2.3, 1.35], [-1.5, -2.6, 2.05], .1, .03, () => boneD, 'solid'); capsule([-.4, -2.5, 1.4], [-.2, -2.85, 2.1], .1, .03, () => boneD, 'solid');
    for (let k = 0; k < 5; k++) { const x = .9 + k * .5; for (let j = 0; j < 9; j++) { const a = j / 8 * 1.9; sphere(x, -2.85 + Math.sin(a) * .5, .1 + (1 - Math.cos(a)) * (1.3 - k * .12), .055, j % 2 ? bone : boneD, 'solid'); } }
    sc.obst.push({ x0: -1.6, y0: -3, x1: 3.2, y1: -1.5 });
    // an ammonite set in a slab on the wall
    onWall(sc, 'x', -1.5, 1.3, 1.2, 1.1, (s, t, o) => { const dx = s - .6, dy = t - .55, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); o.flat = true; o.c = [150, 132, 110]; o.dl = .2; if (r < .48 && ((r * 9 - a / 6.283 + 9) % 1) < .32) o.c = [214, 196, 160]; if (s < .05 || t < .05 || s > 1.15 || t > 1.05) o.c = [112, 96, 84]; }, .05);
    wallShelf(sc, 'x', .7, 1.5, 1.8, ['skull', ['shell', [226, 214, 186]], ['gem', [214, 170, 80]], ['bowl', [206, 192, 160]], ['shell', [200, 180, 150]]]);
    wallShelf(sc, 'x', .7, 2.15, 1.8, [['jar', [206, 192, 160]], 'books', ['gem', [120, 200, 190]], 'skull']);
    // the worktable: brushes, small bones laid out in order, a lens, sketches
    table(-1.8, 1.2, 1.7, .9, .78, PAL.woodLight); stool(-1.8, .35);
    for (let k = 0; k < 5; k++) capsule([-2.45 + k * .2, 1.0, .88], [-2.45 + k * .2, 1.3 - (k % 2) * .08, .88], .035, .03, () => bone, 'solid');
    quad([-1.4, .95, .87], [.5, 0, 0], [0, .4, 0], (s, t, o) => { o.c = PAL.cream; o.flat = true; o.dl = .4; if (Math.abs(Math.hypot(s - .25, t - .2) - .12) < .025) o.c = [120, 92, 70]; }, false, [0, 0, 1]);
    for (let a = 0; a < 6.283; a += .5) sphere(-1.25 + Math.cos(a) * .1, 1.48 + Math.sin(a) * .1, .89, .028, PAL.gold, 'solid');
    candle(sc, -2.45, 1.5, .86);
    sc.obst.push({ x0: -2.75, y0: .65, x1: -.85, y1: 1.75 });
    // crates of finds packed in straw, a shovel and a pick, a sieve
    crate(2.9, -.9, .9); crate(2.95, .1, .7); for (let k = 0; k < 5; k++) sphere(2.8 + hash(k, 1) * .25, -1 + hash(k, 2) * .25, .56, .09, k % 2 ? PAL.thatch : bone, 'rough');
    sc.obst.push({ x0: 2.4, y0: -1.4, x1: 3.4, y1: .5 });
    capsule([-3.2, -2.7, 0], [-3.3, -2.9, 1.9], .04, .04, WOOD_F, 'solid'); box(-3.34, -2.9, 0, -3.1, -2.6, .34, [150, 154, 164], .3);
    capsule([-2.7, -2.85, 0], [-2.75, -2.92, 1.7], .04, .04, WOOD_F, 'solid'); capsule([-3.0, -2.92, 1.6], [-2.5, -2.92, 1.6], .05, .02, () => [150, 154, 164], 'solid');
    bedroll(1.6, 1.3, [176, 110, 80], true); pack(.5, 2.4, [176, 150, 110], [150, 90, 70]);
    sc.obst.push({ cx: .5, cy: 2.4, r: .3 }, { cx: -3, cy: -2.75, r: .45 });
    lampHook(sc, .4, -.2, 3, 4.4, .9);
    doorMat(sc);
  });
  sc.anim = t => swingLamp(.4, -.2, 3, .9, t, 3);
  sc.smokers.push({ key: 'dust', rate: 2, c: rgb(236, 214, 160) });
  return finishRoom(sc);
}

/* ---------- h21: the Potter's Kiln ---------- */
function buildPotter() {
  const sc = roomScene('h21', 7, 6, "The Potter's Kiln", 20);
  const glaze = [[184, 108, 72], [96, 130, 170], [236, 226, 204], [120, 160, 120], [200, 150, 70], [150, 90, 120]];
  sc.with(() => {
    room(sc, { w: 7, d: 6, stone: true, floor: [156, 116, 84], windows: [{ wall: 'y', at: .72 }] });
    wallpaper(sc, sandstone);
    // the kiln: a brick beehive with its mouth glowing
    const brick = stoneWall([176, 98, 70], 17, .16, .34);
    boxS(-3.45, -2.95, 0, -1.9, -1.5, 1.2, solid([150, 84, 62]), brick, brick);
    sphere(-2.68, -2.22, 1.2, .78, [170, 96, 70], 'rough');
    capsule([-2.9, -2.5, 1.8], [-2.9, -2.5, 3], .13, .11, () => [90, 70, 66], 'solid');
    EMIT = 1; quad([-2.6, -1.49, .2], [.7, 0, 0], [0, 0, .75], (s, t, o) => { const r = Math.hypot(s - .35, Math.max(0, t - .4)); if (t > .4 && r > .35) return false; o.c = Math.hypot(s - .35, t - .2) < .2 ? [255, 228, 140] : [240, 130, 50]; o.flat = true; }, false, [0, 1, 0]); EMIT = 0;
    sc.fires.push({ x: -2.25, y: -1.3, z: .3, kind: 'forge' });
    addLight(sc, -2.2, -.8, .5, 4.6, 1.1, .35);
    sc.obst.push({ x0: -3.5, y0: -3, x1: -1.8, y1: -1.35 });
    // the wheel in the middle of the floor (the pot on it turns), a stool, a bucket of slip
    cylinder(.2, .2, 0, .5, .16, solid(PAL.woodDark), -Math.PI, Math.PI); disc(.2, .2, .52, .5, (a, b, o) => { o.c = [150, 130, 116]; o.dl = Math.hypot(a, b) * 12 % 1 < .3 ? -.4 : .1; });
    cylinder(.2, .2, 0, .1, .55, solid([110, 84, 66]), -Math.PI, Math.PI);
    stool(.2, -.75);
    cylinder(1.2, .7, 0, .4, .22, (a, t, o) => { o.c = [160, 112, 70]; o.dl = Math.abs(t - .3) < .04 ? -1.2 : 0; }, -Math.PI, Math.PI); disc(1.2, .7, .35, .19, (a, b, o) => { o.c = [176, 150, 130]; o.kind = K_WATER; o.flat = true; });
    for (let k = 0; k < 9; k++) sphere(.2 + (hash(k, 3) - .5) * 1.7, .2 + (hash(k, 4) - .5) * 1.5, .02, .07, [150, 126, 108], 'rough');
    sc.obst.push({ cx: .2, cy: .2, r: .6 }, { cx: 1.2, cy: .7, r: .28 });
    // shelves and shelves of pots
    wallShelf(sc, 'y', .6, 1.0, 2.6, [['pot', glaze[0]], ['vase', glaze[1]], ['bowl', glaze[2]], ['pot', glaze[3]], ['vase', glaze[4]], ['pot', glaze[1]], ['bowl', glaze[0]]]);
    wallShelf(sc, 'y', -.5, 1.9, 2.0, [['vase', glaze[5]], ['pot', glaze[2]], ['pot', glaze[4]], ['bowl', glaze[1]], ['vase', glaze[3]]]);
    wallShelf(sc, 'x', 1.0, 1.2, 2.2, [['pot', glaze[2]], ['bowl', glaze[3]], ['vase', glaze[0]], ['pot', glaze[5]], ['bowl', glaze[4]]]);
    wallShelf(sc, 'x', 1.0, 2.0, 2.2, [['bottle', glaze[1]], ['bottle', glaze[3]], ['bottle', glaze[4]], ['jar', glaze[2]], ['bottle', glaze[5]]]);
    // the drying board: grey pots waiting their turn in the fire
    table(2.75, -1.6, .9, 2.0, .7, PAL.woodLight);
    for (let k = 0; k < 6; k++) trinket(sc, [k % 3 === 0 ? 'vase' : k % 3 === 1 ? 'pot' : 'bowl', [176, 166, 156]], 2.55 + (k % 2) * .4, -2.4 + Math.floor(k / 2) * .7, .78);
    sc.obst.push({ x0: 2.2, y0: -2.7, x1: 3.4, y1: -.5 });
    // sacks of clay, big jars by the door wall, an apron on its peg
    sack(-2.9, 2.3, 1, [176, 150, 130]); sack(-2.35, 2.55, .85, [166, 140, 122]); sc.obst.push({ x0: -3.4, y0: 1.9, x1: -1.9, y1: 3 });
    for (const [x, y, c, s] of [[-3.0, .2, glaze[1], 1.5], [-2.9, 1.0, glaze[0], 1.2]]) { sphere(x, y, .3 * s, .28 * s, c, 'gloss'); capsule([x, y, .5 * s], [x, y, .66 * s], .14 * s, .18 * s, () => c, 'gloss'); sc.obst.push({ cx: x, cy: y, r: .4 }); }
    onWall(sc, 'x', -.6, 1.2, .6, 1.1, (s, t, o) => { if (t > .8 && Math.abs(s - .3) > .12) return false; o.c = [214, 200, 176]; o.flat = true; o.dl = Math.sin(s * 16) * .3; if (hash(s * 9 | 0, t * 9 | 0) > .86) o.c = [176, 130, 100]; }, .08);
    cushion(2.0, .9, [150, 90, 120]);
    doorMat(sc);
  });
  sc.anim = t => {
    const w = Math.sin(t * 5) * .012;
    sphere(.2 + w, .2, .72, .2, [176, 150, 130], 'solid'); capsule([.2 + w, .2, .86], [.2 + w, .2, 1.02], .12, .15, () => [176, 150, 130], 'solid');
    turnMarks(.2, .2, .55, .42, t * 4, 3, [120, 100, 90]);
  };
  sc.critters = [{ kind: 'cat2', x: 2.0, y: .9, yaw: .9, z: 0 }];
  return finishRoom(sc);
}

/* ---------- the Windmill ---------- */
function buildMill() {
  const sc = roomScene('mill', 7, 6.5, 'The Windmill', 20, 3.2);
  sc.with(() => {
    room(sc, { w: 7, d: 6.5, h: 3.2, wall: PAL.plaster, floor: [170, 130, 88], windows: [{ wall: 'y', at: .78, w: .7 }] });
    // the great spur wheel's rim on the wall (its teeth and arms turn, see anim) and the shaft down to the stones
    for (let a = 0; a < 6.283; a += .12) { const p = wallPos(sc, 'x', -.6 + Math.cos(a) * 1.0, 2.0 + Math.sin(a) * 1.0, .1); sphere(p[0], p[1], p[2], .07, PAL.woodDark, 'solid'); }
    capsule([-3.3, -.6, 2.0], [-1.6, -.6, 2.0], .09, .09, WOODD_F, 'solid');
    box(-1.75, -.75, 1.85, -1.45, -.45, 2.15, PAL.woodDark, .4);
    capsule([-1.6, -.6, 2.0], [-1.6, -.6, .9], .08, .08, WOODD_F, 'solid');
    // the stones on their bed, the hopper over them, the chute and the sack it fills
    box(-2.45, -1.45, 0, -.75, .25, .4, PAL.woodDark, .5);
    cylinder(-1.6, -.6, .4, .68, .82, (a, t, o) => { o.c = [176, 170, 160]; o.dl = (hash(a * 7 | 0, 1) - .5) * .6; }, -Math.PI, Math.PI);
    cylinder(-1.6, -.6, .7, .96, .76, (a, t, o) => { o.c = [190, 184, 172]; o.dl = (hash(a * 7 | 0, 2) - .5) * .6 + (t < .04 ? -1 : 0); }, -Math.PI, Math.PI);
    disc(-1.6, -.6, .965, .76, (a, b, o) => { o.c = [200, 194, 182]; o.dl = (Math.atan2(b, a) * 3.2 % 1 < .15 ? -.6 : 0); });
    cone(-1.2, -1.15, 1.25, 1.9, .12, solid(PAL.wood, .6), .42);
    for (const [a, b] of [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) capsule([-1.2 + a, -1.15 + b, .4], [-1.2 + a * .8, -1.15 + b * .8, 1.85], .03, .03, WOODD_F, 'solid');
    quad([-.85, -.35, .7], [.7, 0, -.45], [0, .3, 0], solid(PAL.woodLight, .5), false, [.45, 0, .7]);
    sack(.05, -.2, .9); disc(.05, -.2, .8, .16, (a, b, o) => { o.c = [252, 248, 236]; o.flat = true; });
    sc.obst.push({ x0: -2.6, y0: -1.6, x1: .5, y1: .5 });
    // sacks of flour stacked to the beams, grain bins, a scale
    for (const [x, y, s] of [[2.9, -2.6, 1.05], [2.2, -2.7, 1], [2.95, -1.8, .95], [1.5, -2.75, .9], [2.3, -2.0, .85]]) sack(x, y, s);
    for (const [x, y] of [[2.9, -2.6], [2.2, -2.7]]) { sphere(x, y, 1.15, .3, [224, 210, 178], 'rough'); sphere(x, y, 1.45, .1, [150, 120, 90], 'solid'); }
    quad([2.02, -2.35, .25], [.36, 0, 0], [0, 0, .3], (s, t, o) => { o.c = [176, 64, 60]; o.flat = true; }, false, [0, 1, 0]);
    sc.obst.push({ x0: 1.1, y0: -3.25, x1: 3.5, y1: -1.4 });
    for (const y of [1.6, 2.5]) { box(-3.45, y - .4, 0, -2.75, y + .4, .7, PAL.wood, .6); quad([-3.4, y - .35, .705], [.6, 0, 0], [0, .7, 0], (s, t, o) => { o.c = [226, 190, 110]; o.dl = (hash(s * 20 | 0, t * 20 | 0) - .5) * 1.2; }, false, [0, 0, 1]); }
    sc.obst.push({ x0: -3.5, y0: 1.1, x1: -2.65, y1: 3 });
    table(.9, -2.75, 1.0, .7, .8, PAL.woodLight);
    capsule([.9, -2.75, .88], [.9, -2.75, 1.4], .025, .025, IRON_F, 'solid'); capsule([.55, -2.75, 1.38], [1.25, -2.75, 1.38], .02, .02, IRON_F, 'solid');
    for (const e of [-.35, .35]) { capsule([.9 + e, -2.75, 1.38], [.9 + e, -2.75, 1.12], .008, .008, IRON_F, 'solid'); sphere(.9 + e, -2.75, 1.08, .1, PAL.gold, 'gloss'); }
    sc.obst.push({ x0: .3, y0: -3.25, x1: 1.1, y1: -2.3 });
    ladder(sc, 'y', -.3, 3.1); sc.obst.push({ x0: -.7, y0: -3.25, x1: .1, y1: -2.5 });
    // a broom, a scoop, and a dusting of flour on everything
    floorPaint(sc, (s, t, o) => { const n = noise(s * 1.1 + 5, t * 1.1) + (hash(s * 20 | 0, t * 20 | 0) - .5) * .5 + (Math.hypot(s - 2.2, t - 2.6) < 1.6 ? .1 : 0); if (n < .88) return false; o.c = [236, 228, 208]; o.flat = true; o.dl = .2; });
    candle(sc, 1.25, -2.6, .88);
    lampHook(sc, 1.0, .8, 3.2, 4.4, .9);
    doorMat(sc);
  });
  sc.anim = t => {
    turnWheel(-3.34, -.6, 2.0, 1.0, t * .5, 'x', 14, PAL.wood, .1);
    turnMarks(-1.6, -.6, .98, .52, -t * 1.1, 5, [150, 144, 134]);
    swingLamp(1.0, .8, 3.2, 1.0, t, 4);
  };
  sc.critters = [{ kind: 'cat2', x: 1.6, y: -1.2, yaw: .5 }];
  sc.smokers.push({ key: 'dust', rate: 4 });
  return finishRoom(sc);
}

/* ---------- the three tents ---------- */
function buildCampTent() {
  const sc = roomScene('camp', 6.5, 5.5, 'Base Camp', 20, 2.8);
  sc.with(() => {
    tentRoom(sc, { c: [176, 84, 66], floor: clothFloor([156, 136, 104], [144, 124, 96]) });
    // the centre pole
    capsule([-.4, -.3, 0], [-.4, -.3, 2.9], .06, .05, WOODD_F, 'solid'); sc.obst.push({ cx: -.4, cy: -.3, r: .15 });
    bedroll(-2.2, -1.9, [120, 80, 110], true); bedroll(-2.2, -1.1, [90, 130, 110], true); bedroll(-2.2, 2.0, [200, 150, 70], true);
    pack(-2.85, .1); pack(-2.4, .5, [96, 120, 80], [200, 150, 70]); sc.obst.push({ x0: -3.2, y0: -.3, x1: -2, y1: .9 });
    // the map table: the route up, a compass, two mugs
    table(1.0, -1.9, 1.5, .9, .7, PAL.woodLight);
    quad([.45, -2.2, .79], [1.0, 0, 0], [0, .6, 0], (s, t, o) => { o.c = [236, 220, 180]; o.flat = true; o.dl = .3; const n = noise(s * 6, t * 6); if (Math.abs(n - .5) < .04) o.c = [120, 92, 70]; if (Math.abs(t - (.1 + s * .4)) < .025 && Math.floor(s * 14) % 2) o.c = [190, 60, 50]; }, false, [0, 0, 1]);
    sphere(1.55, -1.65, .82, .07, PAL.gold, 'gloss'); trinket(sc, ['cup', [190, 96, 60]], 1.6, -2.1, .78); candle(sc, .5, -1.6, .78);
    stool(1.0, -1.1); sc.obst.push({ x0: .2, y0: -2.4, x1: 1.8, y1: -1.4 });
    // crates of supplies, coiled rope, an ice axe, snowshoes
    crate(2.7, -2.3, .9); crate(2.75, -1.5, .7); ropeCoil(2.7, -.6); ropeCoil(2.75, -2.3, .56, .24);
    sc.obst.push({ x0: 2.2, y0: -2.75, x1: 3.2, y1: -.25 });
    // a line of socks drying across the back
    capsule([-3.1, -2.6, 1.9], [3.1, -2.6, 1.75], .012, .012, () => [220, 210, 190], 'solid');
    [[196, 80, 70], [236, 228, 208], [96, 140, 170], [236, 196, 100], [130, 160, 100]].forEach((c, k) => { const x = -1.9 + k * .5; capsule([x, -2.58, 1.86 - k * .008], [x, -2.58, 1.6], .05, .06, () => c, 'solid'); capsule([x, -2.58, 1.6], [x + .1, -2.58, 1.58], .06, .05, () => c, 'solid'); });
    // a little camp stove and the kettle that is always on
    cylinder(.6, .9, 0, .4, .22, (a, t, o) => { o.c = [70, 66, 72]; o.dl = t > .3 ? .6 : 0; }, -Math.PI, Math.PI);
    EMIT = 1; sphere(.75, 1.05, .2, .08, [255, 176, 76], 'glow'); EMIT = 0; addLight(sc, .8, 1.1, .3, 2.6, .8, .3);
    kettle(sc, .6, .9, .4); sc.obst.push({ cx: .6, cy: .9, r: .32 });
    rug(1.6, .6, 1.4, 1.0, [150, 90, 70], [236, 196, 90]);
    lampHook(sc, -.4, .3, 2.7, 4.2, .9);
    doorMat(sc);
  });
  sc.anim = t => swingLamp(-.4, .3, 2.7, .75, t, 5);
  return finishRoom(sc);
}
function buildCookTent() {
  const sc = roomScene('cook', 6, 5, 'The Cook Tent', 21, 2.6);
  sc.with(() => {
    tentRoom(sc, { c: [78, 118, 130], floor: clothFloor([150, 132, 100], [138, 120, 92]) });
    // the stew pot on its brazier
    cylinder(-.6, -.4, 0, .45, .34, (a, t, o) => { o.c = [64, 60, 68]; o.dl = t > .36 ? .7 : (hash(a * 9 | 0, 2) - .5) * .4; }, -Math.PI, Math.PI);
    EMIT = 1; disc(-.6, -.4, .46, .3, (a, b, o) => { o.c = hash(a * 20 | 0, b * 20 | 0) > .5 ? [255, 190, 90] : [236, 110, 40]; o.flat = true; }); EMIT = 0;
    sphere(-.6, -.4, .82, .36, [58, 54, 60], 'gloss');
    disc(-.6, -.4, 1.08, .26, (a, b, o) => { o.c = hash(a * 16 | 0, b * 16 | 0) > .7 ? [226, 150, 70] : [176, 104, 60]; o.flat = true; });
    capsule([-.5, -.35, 1.08], [-.2, -.1, 1.5], .03, .03, WOOD_F, 'solid');
    sc.fires.push({ x: -.6, y: -.4, z: .5, kind: 'forge' });
    sc.smokers.push({ x: -.6, y: -.4, z: 1.15, r: .4, rate: 7, key: 'steam' }, { x: -.6, y: -.4, z: 1.1, key: 'bubbles', c: rgb(236, 170, 90) });
    addLight(sc, -.4, -.2, .5, 4, 1.1, .35); sc.obst.push({ cx: -.6, cy: -.4, r: .5 });
    // pans, onions and hams on the back rails
    hangRow(sc, 'y', -2.6, -.6, 1.95, 4, 'pan'); hangRow(sc, 'y', .2, 1.4, 1.95, 3, 'onion'); hangRow(sc, 'x', -1.8, -.4, 1.9, 2, 'ham');
    // the chopping table: a loaf, a cheese, a bowl of apples
    table(1.4, -1.8, 1.6, .8, .74, PAL.woodLight);
    trinket(sc, 'loaf', .95, -1.8, .82); trinket(sc, 'cheese', 1.45, -1.95, .82); trinket(sc, ['bowl', [176, 132, 80]], 1.9, -1.75, .84);
    for (let k = 0; k < 4; k++) sphere(1.85 + (k % 2) * .1, -1.8 + Math.floor(k / 2) * .1, .96, .06, k % 2 ? [196, 60, 50] : [150, 180, 80], 'solid');
    sc.obst.push({ x0: .55, y0: -2.25, x1: 2.25, y1: -1.35 });
    barrel(2.5, -.4, .8); for (let k = 0; k < 6; k++) sphere(2.5 + Math.cos(k) * .14, -.4 + Math.sin(k) * .14, .68, .07, k % 2 ? [196, 60, 50] : [214, 150, 60], 'solid');
    sack(-2.5, -1.9, .95, [214, 196, 160]); sack(-2.0, -2.1, .8, [206, 188, 150]); crate(-2.5, 1.7, .8); basket(-2.4, .8, .3, [226, 190, 110]);
    sc.obst.push({ cx: 2.5, cy: -.4, r: .4 }, { x0: -3, y0: -2.5, x1: -1.6, y1: -1.5 }, { x0: -2.95, y0: .4, x1: -2, y1: 2.2 });
    stool(.5, .7); stool(-1.2, .9);
    lampHook(sc, .8, .4, 2.5, 3.8, .8);
    doorMat(sc);
  });
  sc.anim = t => swingLamp(.8, .4, 2.5, .6, t, 6);
  return finishRoom(sc);
}
function buildNomadTent() {
  const sc = roomScene('nomad', 6.5, 6, "The Nomad's Tent", 20, 2.9);
  sc.with(() => {
    tentRoom(sc, { c: [150, 90, 70], stripe: [200, 164, 112], floor: clothFloor([176, 150, 110], [166, 138, 100]) });
    // carpets on carpets
    rug(-.6, -.6, 3.6, 2.8, [150, 60, 56], [236, 196, 90]); rug(.9, .9, 2.4, 1.8, [50, 80, 130], [230, 220, 196]); rug(-1.9, 1.6, 1.8, 1.3, [110, 70, 120], [236, 196, 90]);
    // a low brass table: tea, an hourglass in which the sand falls upward, the bowl
    cylinder(-.6, -.5, 0, .32, .12, solid([150, 110, 60]), -Math.PI, Math.PI); disc(-.6, -.5, .34, .62, (a, b, o) => { o.c = Math.abs(Math.hypot(a, b) - .5) < .05 ? [200, 150, 70] : PAL.gold; o.dl = .3; });
    sphere(-.85, -.6, .5, .13, [200, 150, 70], 'gloss'); capsule([-.75, -.6, .52], [-.6, -.6, .6], .03, .02, () => [200, 150, 70], 'solid');
    sc.smokers.push({ x: -.58, y: -.6, z: .66, key: 'steam', rate: 3 });
    for (const z of [.36, .66]) disc(-.3, -.3, z, .09, (a, b, o) => { o.c = [150, 110, 60]; o.flat = true; });
    capsule([-.3, -.3, .38], [-.3, -.3, .64], .07, .07, () => [176, 206, 220], 'gloss'); sphere(-.3, -.3, .58, .05, [236, 206, 140], 'solid');
    sphere(-.55, -.2, .38, .11, PAL.gold, 'gloss');
    sc.obst.push({ cx: -.6, cy: -.5, r: .68 });
    for (const [x, y, c] of [[-1.6, -.7, [176, 64, 60]], [-.9, .45, [60, 110, 120]], [.3, -.9, [200, 150, 70]], [-.2, -1.5, [110, 70, 120]], [.45, .1, [96, 140, 80]]]) cushion(x, y, c);
    // the bed: a heap of blankets and furs against the wall
    for (let k = 0; k < 4; k++) box(-3.15, -2.6, k * .12, -1.5 - k * .05, -1.75, k * .12 + .13, [[176, 110, 80], [200, 164, 112], [120, 80, 110], [236, 228, 208]][k], .5);
    sphere(-2.9, -2.2, .56, .2, [236, 228, 208], 'solid'); sc.obst.push({ x0: -3.25, y0: -2.9, x1: -1.4, y1: -1.6 });
    // an open chest of things found on the road, and rolled carpets
    chest(2.4, -2.3, [110, 70, 48]); EMIT = 1; for (let k = 0; k < 6; k++) sphere(2.15 + hash(k, 1) * .5, -2.35 + hash(k, 2) * .2, .62, .05, k % 3 ? [255, 220, 120] : [150, 230, 220], 'glow'); EMIT = 0;
    addLight(sc, 2.4, -2, .5, 2, .5, .2);
    for (const [y, c] of [[-1.2, [150, 60, 56]], [-.85, [50, 80, 130]]]) { capsule([2.2, y, .16], [3.0, y, .16], .16, .16, () => c, 'rough'); sphere(3.02, y, .16, .1, [230, 220, 196], 'solid'); }
    sc.obst.push({ x0: 1.8, y0: -2.8, x1: 3.2, y1: -.6 });
    // a tall water jar, the staff, an incense burner, a bottled mirage
    sphere(-2.8, .3, .4, .36, [176, 120, 84], 'gloss'); capsule([-2.8, .3, .7], [-2.8, .3, .95], .16, .2, () => [176, 120, 84], 'gloss'); sc.obst.push({ cx: -2.8, cy: .3, r: .42 });
    capsule([-3.05, -1.2, 0], [-3.1, -1.3, 2.2], .04, .035, WOOD_F, 'solid'); sphere(-3.1, -1.3, 2.26, .08, [120, 200, 210], 'gloss');
    capsule([1.1, -2.6, 0], [1.1, -2.6, .5], .04, .08, () => [200, 150, 70], 'solid'); sphere(1.1, -2.6, .56, .09, [200, 150, 70], 'gloss'); sc.smokers.push({ x: 1.1, y: -2.6, z: .68, key: 'incense' });
    trinket(sc, ['glow', [120, 210, 220]], .2, -2.6, 0);
    hangRow(sc, 'y', -1.2, .6, 2.1, 4, 'herb', 5);
    lampHook(sc, -.6, -.5, 2.8, 4.6, .95); lampHook(sc, 1.4, 1.0, 2.6, 3, .7);
    doorMat(sc);
  });
  const TEAL = [150, 236, 220];
  sc.anim = t => { swingLamp(-.6, -.5, 2.8, 1.0, t, 7); swingLamp(1.4, 1.0, 2.6, .7, t, 9, TEAL); };
  return finishRoom(sc);
}

/* ---------- registering them ---------- */
// cottages are HOMES[k] in frontier.js: door id 'h' + k, pick 50 + k
const HOME_ROOMS = { 2: buildNetLoft, 5: buildBath, 7: buildBothy, 9: buildClimbers, 18: buildWoodcutter, 19: buildHollow, 20: buildBones, 21: buildPotter };
const HOME_NAMES = { 2: 'The Net Loft', 5: 'The Tarnside Bathhouse', 7: "Bryn's Bothy", 9: "The Climbers' Hut", 18: "The Woodcutter's Cabin", 19: "Old Moss's Hollow", 20: "The Bone-Digger's Hut", 21: "The Potter's Kiln" };
for (const k of Object.keys(HOME_ROOMS)) { INTERIORS['h' + k] = HOME_ROOMS[k]; NAMES['h' + k] = HOME_NAMES[k]; PICKS[50 + +k] = 'h' + k; }
const EXTRA_ROOMS = { mill: [80, 'The Windmill', buildMill], camp: [81, 'Base Camp', buildCampTent], cook: [82, 'The Cook Tent', buildCookTent], nomad: [83, "The Nomad's Tent", buildNomadTent] };
for (const id of Object.keys(EXTRA_ROOMS)) { const [pick, name, fn] = EXTRA_ROOMS[id]; INTERIORS[id] = fn; NAMES[id] = name; PICKS[pick] = id; }
