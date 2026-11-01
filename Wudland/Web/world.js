'use strict';
// Wudland: the village layout, the interiors and who lives where.
// Layout is authored in screen-aligned (u, v): u to the right, v toward the viewer. at() converts.

const at = (u, v) => [(u + v) / R2, (v - u) / R2];
const toUV = (x, y) => [(x - y) / R2, (x + y) / R2];
const ISLE = { ru: 17, rv: 31 };
function isleF(u, v) {
  const w = (noise(u * .22 + 3, v * .22) - .5) * .12;
  return Math.pow(Math.pow(Math.abs(u) / ISLE.ru, 2.4) + Math.pow(Math.abs(v) / ISLE.rv, 2.4), 1 / 2.4) + w;
}
const RIVER_Y = x => 15.6 + Math.sin(x * .32) * .7 + Math.sin(x * .11 + 1) * .5, RIVER_W = 1.25;
const BRIDGE = { x: 8, y: RIVER_Y(8) };

// season from the date: autumn palettes in Sep-Nov, snow in Dec-Feb
function seasonOf(d = new Date()) {
  const m = d.getMonth();
  return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
}
const LEAVES = {
  spring: [[[58, 98, 62], [98, 140, 76], [160, 186, 104]], [[70, 104, 70], [120, 150, 90], [236, 190, 206]]],
  summer: [[[50, 84, 58], [88, 124, 66], [140, 164, 88]], [[58, 92, 62], [100, 130, 78], [146, 162, 112]]],
  autumn: [[[132, 62, 40], [204, 106, 50], [238, 170, 78]], [[150, 96, 40], [210, 150, 60], [244, 206, 110]], [[70, 96, 60], [140, 130, 60], [214, 156, 70]], [[120, 48, 46], [184, 74, 56], [226, 120, 80]]],
  winter: [[[70, 84, 70], [110, 120, 104], [200, 206, 210]]],
};
const PINE = [[40, 70, 60], [58, 96, 70], [92, 128, 88]];
const GRASS_BY = {
  spring: [[44, 80, 52], [66, 108, 58], [98, 140, 62], [140, 166, 70]], summer: [[42, 74, 50], [62, 100, 54], [96, 130, 58], [136, 152, 66]],
  autumn: [[58, 76, 48], [86, 104, 54], [124, 130, 60], [164, 150, 72]], winter: [[200, 206, 214], [216, 222, 230], [228, 232, 238], [240, 242, 246]],
};

/* ---------- the village ---------- */
const BUILDINGS = [
  { id: 'post', name: 'The Raven Post', u: -8.6, v: -9.2, w: 4.2, d: 3.4, h: 3.1, walls: 'timber', wall: PAL.plaster, roof: 'tile', door: { face: 'x', at: .5 },
    windows: [{ face: 'y', at: .3, shutter: PAL.blue, flowers: [[226, 90, 80], [240, 200, 90]] }, { face: 'y', at: .72, shutter: PAL.blue }, { face: 'x', at: .18 }, { face: 'x', at: .82 }], chimney: { at: .25, side: -1 }, pick: 1 },
  { id: 'guild', name: "Artificers' Guild", u: 8.6, v: -9.4, w: 4.4, d: 5.2, h: 3.4, walls: 'stone', roof: 'slate', door: { face: 'y', at: .5, w: .95, h: 1.5 }, ridge: 'y',
    windows: [{ face: 'y', at: .18, arch: true }, { face: 'y', at: .82, arch: true }, { face: 'x', at: .25, arch: true }, { face: 'x', at: .55, arch: true }, { face: 'x', at: .85, arch: true }], chimney: { at: .3, side: 1, key: 'guild' }, pick: 2 },
  { id: 'tavern', name: 'The Gossiping Goose', u: 9, v: 8.6, w: 5.2, d: 3.8, h: 3.3, walls: 'timber', wall: PAL.plasterWarm, roof: 'thatch', door: { face: 'y', at: .38, w: .9 },
    windows: [{ face: 'y', at: .14, flowers: [[230, 110, 90], [250, 220, 120]] }, { face: 'y', at: .64 }, { face: 'y', at: .86 }, { face: 'x', at: .3, shutter: PAL.red }, { face: 'x', at: .72, shutter: PAL.red }], chimney: { at: .8, side: 1 }, pick: 3 },
  { id: 'home', name: 'The Cottage', u: -9.2, v: 7.2, w: 3.6, d: 3, h: 2.8, walls: 'timber', wall: PAL.plasterRose, roof: 'thatch', door: { face: 'x', at: .45 }, brace: false,
    windows: [{ face: 'y', at: .5, shutter: PAL.sage, flowers: [[236, 140, 170], [250, 240, 230], [200, 120, 220]] }, { face: 'x', at: .85, shutter: PAL.sage }], chimney: { at: .7, side: 1 }, pick: 4 },
  { id: 'shop', name: "Odette's Curiosities", u: 2.2, v: 15.2, w: 3.8, d: 3.2, h: 3, walls: 'timber', wall: [214, 196, 168], roof: 'tile', door: { face: 'y', at: .5 },
    windows: [{ face: 'y', at: .18, shutter: [110, 60, 100], flowers: [[236, 196, 90], [190, 120, 230]] }, { face: 'y', at: .82, shutter: [110, 60, 100] }, { face: 'x', at: .5, shutter: [110, 60, 100] }], chimney: { at: .3, side: -1 }, pick: 7 },
];
const TOWER = { id: 'tower', name: "The Wizard's Tower", u: -8.8, v: -23, r: 1.5, h: 6.4, pick: 5 };
const CHAPEL = { id: 'bell', name: 'The Bell Tower', u: 8.4, v: -23.5, pick: 6 };
const PLAZA = { u: 0, v: -.6, r: 4.8 };
const NAMES = Object.fromEntries([...BUILDINGS, TOWER, CHAPEL].map(b => [b.id, b.name]));
const PICKS = Object.fromEntries([...BUILDINGS, TOWER, CHAPEL].map(b => [b.pick, b.id]));
PICKS[40] = 'board';

// paths as polylines in (u, v)
const PATHS = [
  [[-5, -7.4], [-2.6, -4]],                          // post office door to plaza
  [[6.4, -6.2], [3, -3.2]],                          // guild door to plaza
  [[0, 4], [1.6, 8.6], [5.6, 12.2], [6.4, 11]],       // plaza down to the tavern door
  [[-3.2, 2.8], [-5.6, 6.2], [-6.6, 7.3]],           // plaza to the cottage door
  [[0, 4], [-1.6, 10], [-5.3, 16.6]],                // plaza to the bridge
  [[-5.3, 16.6], [-6.2, 20.2], [-5.4, 23.2]],         // bridge to the windmill and fields
  [[-1.6, 10], [-.8, 14], [.3, 17.7]],                // the lane down to Odette's shop
  [[-2.2, -5], [-5.6, -14], [-7.2, -20.6]],          // north road to the tower
  [[2.2, -5], [5.8, -14], [7.4, -20.4]],             // north road to the bell tower
  [[-5.6, -14], [0, -15.2], [5.8, -14]],
  [[4.4, -2.6], [10.6, -3.6], [12.4, -2.4]],         // to the forge yard
];
const FIELD = { u: -2.4, v: 25.6, w: 4, d: 2.6 };   // in (x, y) footprint around at(u, v)
const MILL = { u: -7.4, v: 21.6 };

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}
function pathDist(u, v) {
  let best = 99;
  for (const p of PATHS) for (let k = 0; k < p.length - 1; k++) best = Math.min(best, segDist(u, v, p[k][0], p[k][1], p[k + 1][0], p[k + 1][1]));
  return best;
}

function buildVillage(data) {
  const season = seasonOf();
  SNOW = season === 'winter';
  const S = 14, W = 2 * ISLE.ru * S + 60, H = 600;
  const scene = new Scene('village', { S, W, H, OX: W / 2, OY: 330, backdrop: 'sky', title: 'Wudland' });
  const grass = GRASS_BY[season];
  const fieldC = at(FIELD.u, FIELD.v), plazaC = at(PLAZA.u, PLAZA.v);
  const cobble = [[206, 190, 160], [190, 176, 150], [214, 200, 172], [180, 166, 146]];
  const dirt = [[172, 138, 98], [160, 126, 90], [186, 152, 108]];
  const sky = scene.obst = [];
  bakeGround(scene, (x, y, ix, iy, i) => {
    const [u, v] = toUV(x, y), f = isleF(u, v);
    if (f > 1) return 0;
    const fine = hash(ix, iy);
    const ry = RIVER_Y(x), rd = Math.abs(y - ry);
    if (rd < RIVER_W) {
      T.kinds[i] = K_WATER;
      const depth = 1 - rd / RIVER_W, n = noise(x * .8, y * 2.2) * .5 + depth * .7;
      const c = SNOW ? [[150, 176, 200], [170, 196, 218], [190, 212, 230]] : [[46, 92, 118], [56, 112, 136], [74, 134, 150], [100, 156, 160]];
      return rgb(...c[clamp(Math.floor(n * c.length + (bayerAt(ix, iy) - .5) * .7), 0, c.length - 1)]);
    }
    if (rd < RIVER_W + .38) { T.kinds[i] = K_PATH; return rampOf(SNOW ? [210, 214, 220] : [150, 126, 90])[clamp(Math.floor(2 + noise(x * 3, y * 3) * 2 + (fine - .5)), 1, 4)]; }
    const pd = Math.hypot(u - PLAZA.u, v - PLAZA.v);
    if (pd < PLAZA.r + (noise(u, v) - .5) * .8) {
      T.kinds[i] = K_PATH;
      // round cobbles laid in offset rows, a little bigger toward the well
      const sc = 2.4, row = Math.floor(y * sc), gx = x * sc + (row & 1) * .5;
      const cx = Math.floor(gx), cy = row, fx = gx - cx, fy = y * sc - row;
      const e = Math.min(fx, 1 - fx, fy, 1 - fy) + (hash(cx, cy) - .5) * .06;
      if (e < .1) return rgb(...(SNOW ? [196, 200, 210] : [146, 132, 112]));
      const c = SNOW && hash(cx, cy) > .4 ? [232, 236, 242] : cobble[hash(cx, cy) * 4 | 0];
      return rampOf(c)[clamp(Math.floor(2.4 + (1 - fy) * .9 + (fx < .5 ? .3 : 0) + (fine - .5) * .4), 1, 4)];
    }
    const wob = (noise(u * 1.4, v * 1.4) - .5) * .5;
    const pth = pathDist(u, v);
    if (pth < .95 + wob) {
      T.kinds[i] = K_PATH;
      if (SNOW) return rgb(...[[210, 212, 218], [196, 196, 204]][fine > .7 ? 1 : 0]);
      if (fine > .93) return rgb(...cobble[hash(ix, iy * 3) * 4 | 0]);
      return rgb(...dirt[clamp(Math.floor(noise(x * 2, y * 2) * 3 + (bayerAt(ix, iy) - .5) * .8), 0, 2)]);
    }
    if (Math.abs(x - fieldC[0]) < FIELD.w / 2 && Math.abs(y - fieldC[1]) < FIELD.d / 2) {
      T.kinds[i] = K_FIELD;
      const row = (y - fieldC[1] + 10) % .5;
      return rgb(...(SNOW ? (row < .18 ? [200, 196, 196] : [236, 238, 244]) : row < .2 ? [104, 74, 52] : [132, 96, 64]));
    }
    if (f > .955) { T.kinds[i] = K_PATH; return rampOf([120, 96, 70])[clamp(Math.floor(2 + fine * 1.5), 1, 3)]; }
    T.kinds[i] = K_GRASS;
    const t = noise(x * .7, y * .7) * 1.1 + (fine - .5) * .5 - .05;
    if (season === 'autumn' && fine > .985) return rgb(...[[214, 120, 50], [226, 170, 70], [180, 70, 50]][hash(iy, ix) * 3 | 0]);
    return rgb(...grass[clamp(Math.floor(t * 4.2), 0, 3)]);
  });
  islandSkirt(scene);
  growGrass(scene, SNOW ? .03 : .17);

  scene.with(() => {
    // buildings
    for (const b of BUILDINGS) {
      const [x, y] = at(b.u, b.v);
      const box = house(scene, { ...b, x, y });
      sky.push({ x0: box.x0 - .25, y0: box.y0 - .25, x1: box.x1 + .25, y1: box.y1 + .25 });
      scene.props[b.id] = { x, y, top: b.h + box.rh, name: b.name };
    }
    tower(scene); chapel(scene);
    // the plaza
    const [wx, wy] = at(PLAZA.u + .2, PLAZA.v - .4);
    PICK = 0; well(scene, wx, wy);
    sky.push({ cx: wx, cy: wy, r: 1.15 });
    scene.props.well = { x: wx, y: wy };
    const [nbx, nby] = at(3.4, 2.6);
    noticeBoard(scene, nbx, nby, (data?.notices?.notes || []).length || 3);
    sky.push({ x0: nbx - 1.05, y0: nby - .35, x1: nbx + 1.05, y1: nby + .35 });
    scene.props.board = { x: nbx, y: nby, top: 2.2, name: 'Notice Board' };
    const [stx, sty] = at(-3.8, 3.4);
    const goods = season === 'autumn' ? [[222, 120, 44], [204, 60, 50], [236, 196, 90], [222, 120, 44], [130, 160, 70], [204, 60, 50], [222, 120, 44], [236, 196, 90], [150, 90, 160], [204, 60, 50]]
      : [[204, 60, 50], [130, 160, 70], [236, 196, 90], [204, 60, 50], [150, 90, 160], [130, 160, 70], [236, 196, 90], [204, 60, 50], [130, 160, 70], [236, 196, 90]];
    stall(scene, stx, sty, [176, 64, 60], goods);
    sky.push({ x0: stx - 1.2, y0: sty - .8, x1: stx + 1.2, y1: sty + .95 });
    scene.spots.stall = { x: stx, y: sty - 1.1 };
    for (const [u, v] of [[-4.2, -3.6], [4.6, -3.2], [4.4, 3.8], [-1.2, 5.6], [-3.2, -12], [3.4, -12.2], [-2.4, 12.4], [3.6, 9.2], [-6.8, 15.2], [-4.4, 21.4], [11.4, -1.4]]) {
      const [x, y] = at(u, v); lampPost(scene, x, y); sky.push({ cx: x, cy: y, r: .3 });
    }
    for (const [u, v, ax] of [[-3, -4.8, false], [1.6, 4.9, true]]) { const [x, y] = at(u, v); bench(x, y, ax); sky.push({ cx: x, cy: y, r: .8 }); }
    // the forge yard beside the guild, where busy agents work out in the open
    const [fx, fy] = at(13.2, -3.6), [ax, ay] = at(12, -1.6);
    forge(scene, fx, fy); anvil(ax, ay);
    sky.push({ x0: fx - .75, y0: fy - .65, x1: fx + .75, y1: fy + .65 }, { cx: ax, cy: ay, r: .55 });
    scene.spots.anvil = { x: ax, y: ay };
    for (const [u, v] of [[11.6, 5.6], [12.2, 6.4]]) { const [x, y] = at(u, v); barrel(x, y); sky.push({ cx: x, cy: y, r: .45 }); }
    for (const [u, v, s] of [[13.4, -6.4, 1], [13.9, -5.6, .8]]) { const [x, y] = at(u, v); crate(x, y, s); sky.push({ cx: x, cy: y, r: .5 }); }
    { const [x, y] = at(5.2, 12.8); barrel(x, y, .9, [140, 90, 60]); sky.push({ cx: x, cy: y, r: .4 }); }
    // the cottage garden
    const [hx, hy] = at(-9.2, 7.2);
    fenceLine([[hx - 2.6, hy + 2.4], [hx + .2, hy + 2.4]].map(p => p)); sky.push({ x0: hx - 2.7, y0: hy + 2.3, x1: hx + .3, y1: hy + 2.5 });
    if (season === 'autumn') for (const [dx, dy] of [[-1.6, 2], [-.6, 2.05], [.6, 2.1]]) pumpkin(hx + dx, hy + dy, .9);
    // the mill and the fields across the river
    const [mx, my] = at(MILL.u, MILL.v);
    windmillBase(scene, mx, my); sky.push({ cx: mx, cy: my, r: 1.5 });
    scene.props.mill = { x: mx, y: my };
    for (const [dx, dy] of [[2.2, -.6], [2.6, .4]]) { hayBale(mx + dx, my + dy); sky.push({ cx: mx + dx, cy: my + dy, r: .7 }); }
    for (let k = 0; k < 8; k++) for (let r = 0; r < 5; r++) {
      const x = fieldC[0] - FIELD.w / 2 + .3 + k * .5, y = fieldC[1] - FIELD.d / 2 + .25 + r * .5;
      if (SNOW) continue;
      if (season === 'autumn' && hash(k, r) > .7) pumpkin(x, y, .6);
      else sphere(x, y, .16, .17, season === 'autumn' ? [170, 150, 70] : [90, 140, 70], 'rough');
    }
    fenceLine([[fieldC[0] - FIELD.w / 2 - .3, fieldC[1] - FIELD.d / 2 - .3], [fieldC[0] + FIELD.w / 2 + .3, fieldC[1] - FIELD.d / 2 - .3]]);
    sky.push({ x0: fieldC[0] - FIELD.w / 2 - .4, y0: fieldC[1] - FIELD.d / 2 - .4, x1: fieldC[0] + FIELD.w / 2 + .4, y1: fieldC[1] + FIELD.d / 2 + .2 });
    scene.spots.field = { x: fieldC[0], y: fieldC[1] - FIELD.d / 2 - .8 };
    bridge(scene, BRIDGE.x, BRIDGE.y, 4.2, 1.5, false);
    // trees and pines around the rim, never on a path, building, river or each other
    const trees = [];
    const pal = LEAVES[season];
    const clear = (x, y, r) => {
      const [u, v] = toUV(x, y), f = isleF(u, v);
      if (f > .9 || pathDist(u, v) < 1.6 + r * .4 || Math.hypot(u - PLAZA.u, v - PLAZA.v) < PLAZA.r + 1.5) return false;
      if (Math.abs(y - RIVER_Y(x)) < RIVER_W + 1 + r * .3) return false;
      if (Math.abs(x - fieldC[0]) < FIELD.w / 2 + 1.2 && Math.abs(y - fieldC[1]) < FIELD.d / 2 + 1.5) return false;
      for (const o of sky) {
        if (o.r ? Math.hypot(x - o.cx, y - o.cy) < o.r + r + .6 : x > o.x0 - r - 1.4 && x < o.x1 + r + .8 && y > o.y0 - r - 1.4 && y < o.y1 + r + .8) return false;
      }
      for (const t of trees) if (Math.hypot(x - t.x, y - t.y) < (t.r + r) * 1.05) return false;
      return true;
    };
    for (let n = 0; n < 2600 && trees.length < 64; n++) {
      const u = (hash(n, 1) * 2 - 1) * ISLE.ru, v = (hash(n, 2) * 2 - 1) * ISLE.rv, f = isleF(u, v);
      if (f > .9 || (f < .62 && hash(n, 5) > .12)) continue;
      const [x, y] = at(u, v), pine = v < -12 ? hash(n, 3) > .35 : hash(n, 3) > .82, s = .62 + hash(n, 4) * .32;
      const r = pine ? 1.1 * s : 1.7 * s;
      if (!clear(x, y, r)) continue;
      trees.push({ x, y, r, pine, s, n });
    }
    trees.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const t of trees) {
      if (t.pine) growPine(t.x, t.y, t.s, PINE);
      else growTree(scene, t.x, t.y, t.s, 220, t.n * 97, pal[t.n % pal.length]);
      sky.push({ cx: t.x, cy: t.y, r: .45 * t.s });
    }
    for (let k = 0; k < 40; k++) { // bushes and stones dotted about
      const u = (hash(k, 11) * 2 - 1) * ISLE.ru, v = (hash(k, 12) * 2 - 1) * ISLE.rv;
      const [x, y] = at(u, v);
      if (!clear(x, y, .4)) continue;
      if (hash(k, 13) > .55) { for (let j = 0; j < 5; j++) sphere(x + (hash(k, j) - .5) * .5, y + (hash(j, k) - .5) * .5, .25, .28, pal[k % pal.length][j % 3], 'rough'); castShadow(x, y, .3, .5); }
      else { sphere(x, y, .05, .26, [140, 138, 132], 'rough'); castShadow(x, y, .1, .26); }
      sky.push({ cx: x, cy: y, r: .4 });
    }
  });
  finishBake(scene);
  scene.nav = makeNav(scene, (x, y) => {
    const [u, v] = toUV(x, y);
    if (isleF(u, v) > .9) return false;
    const onBridge = Math.abs(x - BRIDGE.x) < .7 && Math.abs(y - BRIDGE.y) < 2.4;
    if (!onBridge && Math.abs(y - RIVER_Y(x)) < RIVER_W + .3) return false;
    for (const o of sky) if (o.r ? Math.hypot(x - o.cx, y - o.cy) < o.r + .25 : x > o.x0 - .25 && x < o.x1 + .25 && y > o.y0 - .25 && y < o.y1 + .25) return false;
    return true;
  }, (x, y) => { const [u, v] = toUV(x, y); return pathDist(u, v) < 1 || Math.hypot(u - PLAZA.u, v - PLAZA.v) < PLAZA.r ? .6 : 1; });
  for (const d of scene.doors) d.name = NAMES[d.id];
  // camera bounds: the island's projected extent
  scene.bounds = { x0: 10, y0: 40, x1: W - 10, y1: H - 6 };
  scene.sunAt = 0;
  return scene;
}

// the floating island's earth: hang a cliff of soil and rock under the front edge
function islandSkirt(scene) {
  const t = scene.t, W = t.W, H = t.H;
  const soil = [[118, 86, 62], [98, 72, 56], [84, 64, 54], [104, 96, 92], [86, 80, 80]];
  for (let ix = 0; ix < W; ix++) {
    let low = -1;
    for (let iy = H - 1; iy >= 0; iy--) if (t.ground[iy * W + ix]) { low = iy; break; }
    if (low < 0) continue;
    const z = t.zb[low * W + ix];
    const depth = 10 + Math.round(noise(ix * .09, 3) * 14 + hash(ix, 7) * 2);
    for (let k = 1; k <= depth && low + k < H; k++) {
      const i = (low + k) * W + ix, band = k / depth;
      let c = band < .18 ? soil[0] : band < .55 ? soil[1] : band < .8 ? soil[3] : soil[4];
      if (k <= 2) c = [96, 112, 62]; // grass lip
      const l = 2 + (noise(ix * .3, k * .4) - .5) * 1.6 - band * .8 + (bayerAt(ix, low + k) - .5) * .6;
      t.pix[i] = rampOf(c)[clamp(Math.floor(l), 0, 4)];
      t.zb[i] = z - .001 * k;
      t.groundZ[i] = FAR + 1; // not ground, never shadowed
    }
  }
}

function tower(scene) {
  const [x, y] = at(TOWER.u, TOWER.v), r = TOWER.r, h = TOWER.h;
  PICK = TOWER.pick;
  const sw = stoneWall([150, 146, 158], 21, .32, .5);
  cylinder(x, y, 0, h, r, (a, t, o) => {
    sw(a + 20, t, o);
    if (t < .4) o.dl -= .3;
  }, -Math.PI, Math.PI);
  // a ledge and the conical slate hat, a little crooked like a wizard's
  cylinder(x, y, h, h + .18, r + .14, solid(PAL.stoneDark), -Math.PI, Math.PI);
  cone(x, y, h + .18, h + 3.4, r + .55, roofShade('slate', PAL.slatePurple, 3.2));
  sphere(x, y, h + 3.45, .14, PAL.gold, 'gloss');
  // windows spiral up the front
  for (const [ang, z] of [[0, 1.6], [-.55, 3.3], [.5, 4.8]]) {
    const th = ang + Math.PI / 4, nx = Math.cos(th), ny = Math.sin(th);
    quad([x + nx * (r + .02) + ny * .28, y + ny * (r + .02) - nx * .28, z], [-ny * .56, nx * .56, 0], [0, 0, .8], windowShade(.56, .8, true), false, [nx, ny, 0]);
  }
  const th = Math.PI / 4 + .62, nx = Math.cos(th), ny = Math.sin(th);
  quad([x + nx * (r + .02) + ny * .4, y + ny * (r + .02) - nx * .4, .02], [-ny * .8, nx * .8, 0], [0, 0, 1.4], doorShade(.8, 1.4, [96, 70, 120]), false, [nx, ny, 0]);
  castShadow(x, y, 1, r * 1.05); castShadow(x, y, 3, r * 1.05); castShadow(x, y, 5, r * 1.05); castShadow(x, y, h + 1, r); castShadow(x, y, h + 2.4, r * .5);
  const ex = x + nx * (r + .9), ey = y + ny * (r + .9);
  scene.doors.push({ id: 'tower', x: ex, y: ey, face: 'r', pick: TOWER.pick });
  lantern(scene, x + nx * (r + .3) + ny * .9, y + ny * (r + .3) - nx * .9, 0, 1);
  PICK = 0;
  scene.obst.push({ cx: x, cy: y, r: r + .3 });
  scene.props.tower = { x, y, top: h + 3.6, name: TOWER.name };
  scene.smokers.push({ x, y, z: h + 3.5, rate: .3, key: 'magic' });
}
function chapel(scene) {
  const [x, y] = at(CHAPEL.u, CHAPEL.v);
  const b = house(scene, { id: 'bell', x, y, w: 4.6, d: 3, h: 3.2, walls: 'stone', roof: 'slate', door: { face: 'y', at: .3, w: .9, h: 1.6 }, pick: CHAPEL.pick,
    windows: [{ face: 'y', at: .7, arch: true, h: 1.2 }, { face: 'x', at: .5, arch: true, h: 1.2, w: .5 }] });
  // the bell tower rises from the left end
  PICK = CHAPEL.pick;
  const tx0 = b.x0 - .1, ty0 = y - 1.2, tx1 = b.x0 + 2.2, ty1 = y + 1.2, th = 6.2;
  const sw = stoneWall(PAL.stone, 31);
  boxS(tx0, ty0, 0, tx1, ty1, th - 1.5, null, sw, sw);
  // open belfry with the bell
  for (const [px, py] of [[tx0, ty1], [tx1, ty1], [tx1, ty0]]) box(px - .18, py - .18, th - 1.5, px + .18, py + .18, th, PAL.stone, .7);
  boxS(tx0, ty0, th - 1.5, tx1, ty1, th - 1.4, solid(PAL.stoneDark), solid(PAL.stoneDark), solid(PAL.stoneDark));
  const bx = (tx0 + tx1) / 2, by = (ty0 + ty1) / 2;
  cone(bx, by, th - 1.3, th - .45, .5, (a, t, o) => { o.c = [196, 156, 70]; o.dl = .4; }, .2);
  scene.props.bellAt = { x: bx, y: by, z: th - .9 };
  // pyramid roof
  const cx = bx, cy = by, top = th + 2.4, ov = .25;
  const rs = roofShade('slate', PAL.slate, 3);
  quad([tx0 - ov, ty1 + ov, th], [tx1 - tx0 + ov * 2, 0, 0], [cx - tx0 + ov, cy - ty1 - ov, top - th], rs, true, [0, top - th, (ty1 - ty0) / 2]);
  quad([tx1 + ov, ty0 - ov, th], [0, ty1 - ty0 + ov * 2, 0], [cx - tx1 - ov, cy - ty0 + ov, top - th], rs, true, [top - th, 0, (tx1 - tx0) / 2]);
  quad([tx1 + ov, ty1 + ov, th], [-(tx1 - tx0 + ov * 2), 0, 0], [cx - tx1 - ov, cy - ty1 - ov, top - th], rs, true, [0, top - th, (ty1 - ty0) / 2]);
  quad([tx1 + ov, ty1 + ov, th], [0, -(ty1 - ty0 + ov * 2), 0], [cx - tx1 - ov, cy - ty1 - ov, top - th], rs, true, [top - th, 0, (tx1 - tx0) / 2]);
  sphere(cx, cy, top + .1, .1, PAL.gold, 'gloss');
  castBoxShadow(tx0, ty0, tx1, ty1, th);
  PICK = 0;
  scene.obst.push({ x0: tx0 - .25, y0: ty0 - .25, x1: b.x1 + .25, y1: ty1 + .25 }, { x0: b.x0 - .25, y0: b.y0 - .25, x1: b.x1 + .25, y1: b.y1 + .25 });
  scene.props.bell = { x, y, top: top, name: CHAPEL.name };
}

/* ---------- navigation ---------- */
// a 0.5-unit walk grid over the scene; A* with path-friendly costs, then string-pulled
function makeNav(scene, walkable, cost) {
  const t = scene.t;
  const [c0, c1, c2, c3] = scene.with(() => [unproject(0, 0), unproject(t.W, 0), unproject(0, t.H), unproject(t.W, t.H)]);
  const xs = [c0.x, c1.x, c2.x, c3.x], ys = [c0.y, c1.y, c2.y, c3.y];
  const x0 = Math.floor(Math.min(...xs)), y0 = Math.floor(Math.min(...ys)), cs = .5;
  const nx = Math.ceil((Math.max(...xs) - x0) / cs), ny = Math.ceil((Math.max(...ys) - y0) / cs);
  const ok = new Uint8Array(nx * ny), w = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + (i + .5) * cs, y = y0 + (j + .5) * cs;
    if (walkable(x, y)) { ok[j * nx + i] = 1; w[j * nx + i] = cost ? cost(x, y) : 1; }
  }
  keepLargestRegion(ok, nx, ny);
  return { x0, y0, cs, nx, ny, ok, w };
}
// walkable pockets cut off from the main ground (behind a building, inside a ring of rocks) would strand
// anyone placed there, so only the largest connected region stays walkable; doors and taps snap onto it
function keepLargestRegion(ok, nx, ny) {
  const label = new Int32Array(nx * ny), sizes = [0], stack = [];
  for (let s = 0; s < nx * ny; s++) {
    if (ok[s] !== 1 || label[s]) continue;
    const id = sizes.length; let n = 0;
    label[s] = id; stack.push(s);
    while (stack.length) {
      const c = stack.pop(); n++;
      const cx = c % nx, cy = (c / nx) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const i = cx + dx, j = cy + dy;
        if ((!dx && !dy) || i < 0 || j < 0 || i >= nx || j >= ny) continue;
        const k = j * nx + i;
        if (ok[k] !== 1 || label[k]) continue;
        // diagonal moves need both side cells open, matching findPath
        if (dx && dy && (ok[cy * nx + i] !== 1 || ok[j * nx + cx] !== 1)) continue;
        label[k] = id; stack.push(k);
      }
    }
    sizes.push(n);
  }
  let best = 1;
  for (let id = 2; id < sizes.length; id++) if (sizes[id] > sizes[best]) best = id;
  for (let k = 0; k < ok.length; k++) if (ok[k] === 1 && label[k] !== best) ok[k] = 0;
}
function navCell(nav, x, y) { return [Math.floor((x - nav.x0) / nav.cs), Math.floor((y - nav.y0) / nav.cs)]; }
function navOk(nav, i, j) { return i >= 0 && j >= 0 && i < nav.nx && j < nav.ny && nav.ok[j * nav.nx + i] === 1; }
function navNearest(nav, x, y) {
  const [ci, cj] = navCell(nav, x, y);
  if (navOk(nav, ci, cj)) return [ci, cj];
  for (let r = 1; r < 14; r++) {
    let best = null, bd = 1e9;
    for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
      if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r || !navOk(nav, i, j)) continue;
      const d = (i - ci) ** 2 + (j - cj) ** 2;
      if (d < bd) { bd = d; best = [i, j]; }
    }
    if (best) return best;
  }
  return null;
}
function navCenter(nav, i, j) { return [nav.x0 + (i + .5) * nav.cs, nav.y0 + (j + .5) * nav.cs]; }
function lineClear(nav, ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / (nav.cs * .4));
  for (let k = 1; k <= n; k++) {
    const t = k / n, [i, j] = navCell(nav, lerp(ax, bx, t), lerp(ay, by, t));
    if (!navOk(nav, i, j)) return false;
    // a little clearance so figures don't shave corners: probe a quarter cell to each side
    const px = lerp(ax, bx, t), py = lerp(ay, by, t), q = nav.cs * .3;
    for (const [dx, dy] of [[q, 0], [-q, 0], [0, q], [0, -q]]) { const [a, b] = navCell(nav, px + dx, py + dy); if (!navOk(nav, a, b)) return false; }
  }
  return true;
}
function findPath(nav, sx, sy, tx, ty) {
  const s = navNearest(nav, sx, sy), g = navNearest(nav, tx, ty);
  if (!s || !g) return null;
  const N = nav.nx * nav.ny, start = s[1] * nav.nx + s[0], goal = g[1] * nav.nx + g[0];
  const gs = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [], push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const h = i => { const x = i % nav.nx, y = (i / nav.nx) | 0; const dx = Math.abs(x - g[0]), dy = Math.abs(y - g[1]); return (Math.max(dx, dy) + .414 * Math.min(dx, dy)) * .6; };
  gs[start] = 0; push(start, h(start));
  let steps = 0;
  while (heap.length && steps++ < 40000) {
    const [, cur] = pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % nav.nx, cy = (cur / nav.nx) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const ni = cx + dx, nj = cy + dy;
      if (!navOk(nav, ni, nj)) continue;
      if (dx && dy && (!navOk(nav, cx + dx, cy) || !navOk(nav, cx, cy + dy))) continue;
      const n = nj * nav.nx + ni, step = (dx && dy ? 1.414 : 1) * nav.w[n];
      if (gs[cur] + step < gs[n]) { gs[n] = gs[cur] + step; from[n] = cur; push(n, gs[n] + h(n)); }
    }
  }
  if (from[goal] < 0 && goal !== start) return null;
  const cells = [];
  for (let c = goal; c >= 0 && c !== start; c = from[c]) cells.push(c);
  cells.reverse();
  const pts = [[sx, sy], ...cells.map(c => navCenter(nav, c % nav.nx, (c / nav.nx) | 0))];
  // the final point is the real target when it is walkable, else the nearest open cell
  const [ti, tj] = navCell(nav, tx, ty);
  if (navOk(nav, ti, tj)) pts.push([tx, ty]);
  const out = [pts[0]];
  let k = 0;
  while (k < pts.length - 1) {
    let far = k + 1;
    for (let j = pts.length - 1; j > k + 1; j--) if (lineClear(nav, pts[k][0], pts[k][1], pts[j][0], pts[j][1])) { far = j; break; }
    out.push(pts[far]);
    k = far;
  }
  return out.slice(1);
}
