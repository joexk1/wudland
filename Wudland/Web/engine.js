'use strict';
// Wudland renderer.
// A fork of the Pixel Plays engine by AmirMushich (MIT, github.com/amirmushichge/pixel-plays):
// orthographic 30-degree camera, depth buffer, hue-shifted colour ramps, Bayer dither, hard cast
// shadows, depth-buffer edges and stepped 8 fps wind. Extended here with scrolling worlds (a baked
// scene plus a moving viewport), quads / cylinders / cones for buildings, a pick buffer for taps,
// emissive pixels and a day/night lighting grade.

const SIN = .5, COS = Math.sqrt(3) / 2, R2 = Math.SQRT2;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const COOL = [46, 38, 84], WARM = [255, 232, 180];
const EDGE = .28;
const FAR = -1e9;

const K_NONE = 0, K_GRASS = 3, K_PATH = 4, K_WATER = 5, K_WINDOW = 6, K_FLOOR = 7, K_SNOWY = 8, K_FIELD = 9, K_LEAF = 10;

const rgb = (r, g, b) => (255 << 24 | Math.max(0, Math.min(255, b | 0)) << 16 | Math.max(0, Math.min(255, g | 0)) << 8 | Math.max(0, Math.min(255, r | 0))) >>> 0;
const R_ = c => c & 255, G_ = c => c >> 8 & 255, B_ = c => c >> 16 & 255;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const bayerAt = (ix, iy) => BAYER[(iy & 3) * 4 + (ix & 3)];
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = ease(x - ix), fy = ease(y - iy);
  return lerp(lerp(hash(ix, iy), hash(ix + 1, iy), fx), lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), fx), fy);
}
function mixc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

// hue-shifted ramp: shadows drift to violet, lights drift to warm yellow
const ramps = new Map();
function rampOf(c) {
  const key = (c[0] | 0) << 16 | (c[1] | 0) << 8 | (c[2] | 0);
  let ramp = ramps.get(key);
  if (ramp) return ramp;
  const mix = (m, tint, k) => rgb(lerp(c[0] * m, tint[0], k), lerp(c[1] * m, tint[1], k), lerp(c[2] * m, tint[2], k));
  ramp = [mix(.4, COOL, .34), mix(.62, COOL, .18), mix(.84, COOL, .05), mix(1, WARM, 0), mix(1.1, WARM, .22)];
  ramps.set(key, ramp);
  return ramp;
}

/* ---------- raster targets ---------- */
// A target is a set of buffers plus a camera origin. Scenes bake into a big target once; every frame
// a small viewport target copies its window out of the bake and draws the moving things on top.
function makeTarget(W, H, S, OX, OY) {
  const n = W * H;
  return {
    W, H, S, OX, OY,
    pix: new Uint32Array(n), zb: new Float32Array(n).fill(FAR), ground: new Uint8Array(n), groundZ: new Float32Array(n).fill(FAR),
    kinds: new Uint8Array(n), emit: new Uint8Array(n), pick: new Uint8Array(n), shadow: new Uint8Array(n),
  };
}
let T = null; // the current target every draw call writes to
let PICK = 0, KIND = 0, EMIT = 0; // stamped into the pick / kinds / emit buffers while baking

function project(x, y, z) {
  const u = (x - y) / R2, v = (x + y) / R2;
  return { sx: T.OX + u * T.S, sy: T.OY + (v * SIN - z * COS) * T.S, d: v * COS + z * SIN };
}
function unproject(sx, sy, z = 0) {
  const u = (sx - T.OX) / T.S, v = (sy - T.OY) / (T.S * SIN) + z * COS / SIN;
  return { x: (u + v) / R2, y: (v - u) / R2 };
}
function groundDepth(x, y) { return (x + y) / R2 * COS; }

function tint(i, r, g, b) {
  const c = T.pix[i];
  T.pix[i] = rgb((c & 255) * r, (c >> 8 & 255) * g, (c >> 16 & 255) * b);
}

/* ---------- primitives ---------- */
let capture = null; // when set, sphere() records pixels instead of drawing them
function sphere(x, y, z, r, c, mode) {
  const ramp = rampOf(c), W = T.W, H = T.H, zb = T.zb, pix = T.pix;
  const p = project(x, y, z), rp = Math.max(r * T.S, .75);
  const y0 = Math.max(0, Math.floor(p.sy - rp)), y1 = Math.min(H - 1, Math.ceil(p.sy + rp));
  const x0 = Math.max(0, Math.floor(p.sx - rp)), x1 = Math.min(W - 1, Math.ceil(p.sx + rp));
  for (let iy = y0; iy <= y1; iy++) for (let ix = x0; ix <= x1; ix++) {
    const dx = (ix + .5 - p.sx) / rp, dy = (iy + .5 - p.sy) / rp, nn = dx * dx + dy * dy;
    if (nn > 1) continue;
    const nz = Math.sqrt(1 - nn), d = p.d + r * nz, i = iy * W + ix;
    if (d <= zb[i]) continue;
    let l = clamp(-.55 * dx - .6 * dy + .58 * nz, 0, 1);
    if (mode === 'rough') l += (hash(ix, iy) - .5) * .55;
    if (dy > .35) l = Math.max(l, .12 + dy * .24); // warm light bouncing off the ground
    if (capture) {
      capture.push(ix, iy, d, ramp[clamp(Math.floor(l * 4.4 + .2 + (bayerAt(ix, iy) - .5) * .7), 0, 4)]);
      continue;
    }
    zb[i] = d;
    if (PICK) T.pick[i] = PICK;
    if (EMIT) T.emit[i] = EMIT;
    if (mode === 'glow') { pix[i] = ramp[l > .55 ? 4 : 3]; T.emit[i] = 1; continue; }
    if (mode === 'gloss' && l > .9) { pix[i] = rgb(255, 250, 232); continue; }
    // figures get flat bands with no dither, so they read as sharp shapes against the textured ground
    if (mode === 'solid') { pix[i] = ramp[clamp(Math.floor(l * 4.4 + .2), 1, 4)]; continue; }
    pix[i] = ramp[clamp(Math.floor(l * 4.4 + .2 + (bayerAt(ix, iy) - .5) * .7), 0, 4)];
  }
}
function capsule(a, b, r0, r1, colorOf, mode) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const n = Math.max(1, Math.ceil(len / (Math.min(r0, r1) * .45)));
  for (let k = 0; k <= n; k++) {
    const t = k / n, z = lerp(a[2], b[2], t);
    sphere(lerp(a[0], b[0], t), lerp(a[1], b[1], t), z, lerp(r0, r1, t), colorOf(z, t), mode);
  }
}
function plot(x, y, z, color) {
  const p = project(x, y, z), ix = p.sx | 0, iy = p.sy | 0;
  if (ix < 0 || iy < 0 || ix >= T.W || iy >= T.H) return;
  const i = iy * T.W + ix;
  if (p.d <= T.zb[i]) return;
  T.zb[i] = p.d;
  T.pix[i] = color;
  if (PICK) T.pick[i] = PICK;
  if (EMIT) T.emit[i] = EMIT;
}
// light level of a surface from its normal: tops 3.4, faces toward screen-left 2.3, toward screen-right 1.2
function levelOf(nx, ny, nz) {
  const l = Math.hypot(nx, ny, nz) || 1;
  return 1 + 2.4 * Math.max(0, (nx * .083 + ny * .54 + nz) / l);
}
// The workhorse: paint a parallelogram (or the triangle half of it) sampled densely in world space.
// shade(s, t, out) receives distances along each edge and fills out.c (rgb array), out.dl (level offset),
// out.flat (no dither), out.kind / out.emit; returning false leaves a hole.
const OUT = { c: null, dl: 0, flat: false, kind: 0, emit: 0 };
function quad(o, eu, ev, shade, tri = false, nrm = null) {
  const lu = Math.hypot(eu[0], eu[1], eu[2]), lv = Math.hypot(ev[0], ev[1], ev[2]);
  if (!lu || !lv) return;
  const n = nrm || [eu[1] * ev[2] - eu[2] * ev[1], eu[2] * ev[0] - eu[0] * ev[2], eu[0] * ev[1] - eu[1] * ev[0]];
  const base = levelOf(n[0], n[1], n[2]);
  const nl = Math.hypot(n[0], n[1], n[2]) || 1, up = n[2] / nl;
  const step = 1 / (T.S * 1.7);
  const nu = Math.ceil(lu / step), nv = Math.ceil(lv / step);
  const W = T.W, H = T.H, zb = T.zb, pix = T.pix, kinds = T.kinds, emitB = T.emit, pickB = T.pick;
  for (let a = 0; a <= nu; a++) {
    const fa = a / nu;
    for (let b = 0; b <= nv; b++) {
      const fb = b / nv;
      if (tri && fa + fb > 1.0001) break;
      const x = o[0] + eu[0] * fa + ev[0] * fb, y = o[1] + eu[1] * fa + ev[1] * fb, z = o[2] + eu[2] * fa + ev[2] * fb;
      const u = (x - y) / R2, v = (x + y) / R2;
      const ix = (T.OX + u * T.S) | 0, iy = (T.OY + (v * SIN - z * COS) * T.S) | 0;
      if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
      const i = iy * W + ix, d = v * COS + z * SIN;
      if (d <= zb[i]) continue;
      OUT.c = null; OUT.dl = 0; OUT.flat = false; OUT.kind = KIND; OUT.emit = EMIT;
      if (shade(fa * lu, fb * lv, OUT, x, y, z) === false) continue;
      let c = OUT.c;
      if (SNOW && up > .45 && !OUT.emit && OUT.kind !== K_WINDOW) { c = SNOW_C; OUT.dl = (hash(ix, iy) - .5) * .5; }
      zb[i] = d;
      const ramp = rampOf(c);
      const lvl = base + OUT.dl;
      pix[i] = ramp[clamp(Math.floor(OUT.flat ? lvl : lvl + (bayerAt(ix, iy) - .5) * .5), 0, 4)];
      kinds[i] = OUT.kind;
      emitB[i] = OUT.emit;
      pickB[i] = PICK;
    }
  }
}
let SNOW = false;
const SNOW_C = [238, 240, 246];
function solid(c, grain = 1.1, scale = 6, seed = 0) {
  return (s, t, o) => { o.c = c; o.dl = (noise(s * scale + seed, t * scale) - .5) * grain; };
}
// axis-aligned box from shade functions per face (top, +y face, +x face); faces facing away are skipped
function boxS(x0, y0, z0, x1, y1, z1, top, front, side, back = false) {
  if (top) quad([x0, y0, z1], [x1 - x0, 0, 0], [0, y1 - y0, 0], top, false, [0, 0, 1]);
  if (front) quad([x0, y1, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], front, false, [0, 1, 0]);
  if (side) quad([x1, y0, z0], [0, y1 - y0, 0], [0, 0, z1 - z0], side, false, [1, 0, 0]);
  if (back) { // inner faces for rooms seen from outside are never needed; back faces only matter for silhouettes
    quad([x0, y0, z0], [0, y1 - y0, 0], [0, 0, z1 - z0], back, false, [1, 0, 0]);
    quad([x0, y0, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], back, false, [0, 1, 0]);
  }
}
function box(x0, y0, z0, x1, y1, z1, c, grain = 1.1) {
  const f = solid(c, grain);
  boxS(x0, y0, z0, x1, y1, z1, f, f, f);
}
// vertical cylinder: only the half that faces the camera is painted
function cylinder(cx, cy, z0, z1, r, shade, a0 = -Math.PI * .75, a1 = Math.PI * .75) {
  const step = 1 / (T.S * 1.7), na = Math.ceil((a1 - a0) * r / step), nz = Math.ceil((z1 - z0) / step);
  const W = T.W, H = T.H, zb = T.zb, pix = T.pix;
  for (let a = 0; a <= na; a++) {
    const th = lerp(a0, a1, a / na) + Math.PI / 4, nx = Math.cos(th), ny = Math.sin(th);
    const base = levelOf(nx, ny, 0);
    for (let b = 0; b <= nz; b++) {
      const z = lerp(z0, z1, b / nz), x = cx + nx * r, y = cy + ny * r;
      const u = (x - y) / R2, v = (x + y) / R2;
      const ix = (T.OX + u * T.S) | 0, iy = (T.OY + (v * SIN - z * COS) * T.S) | 0;
      if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
      const i = iy * W + ix, d = v * COS + z * SIN;
      if (d <= zb[i]) continue;
      OUT.c = null; OUT.dl = 0; OUT.flat = false; OUT.kind = KIND; OUT.emit = EMIT;
      if (shade(th * r, z - z0, OUT, x, y, z) === false) continue;
      zb[i] = d;
      pix[i] = rampOf(OUT.c)[clamp(Math.floor(base + OUT.dl + (OUT.flat ? 0 : (bayerAt(ix, iy) - .5) * .5)), 0, 4)];
      T.kinds[i] = OUT.kind; T.emit[i] = OUT.emit; T.pick[i] = PICK;
    }
  }
}
// cone (or a cut cone when r1 > 0) standing on z0, apex at z1
function cone(cx, cy, z0, z1, r0, shade, r1 = 0) {
  const h = z1 - z0, step = 1 / (T.S * 1.7);
  const na = Math.ceil(Math.PI * 2 * r0 / step), nz = Math.ceil(Math.hypot(h, r0 - r1) / step);
  const W = T.W, H = T.H, zb = T.zb, pix = T.pix;
  for (let a = 0; a <= na; a++) {
    const th = a / na * Math.PI * 2, nx = Math.cos(th), ny = Math.sin(th);
    const base = levelOf(nx * h, ny * h, r0 - r1);
    for (let b = 0; b <= nz; b++) {
      const t = b / nz, r = lerp(r0, r1, t), z = z0 + h * t, x = cx + nx * r, y = cy + ny * r;
      const u = (x - y) / R2, v = (x + y) / R2;
      const ix = (T.OX + u * T.S) | 0, iy = (T.OY + (v * SIN - z * COS) * T.S) | 0;
      if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
      const i = iy * W + ix, d = v * COS + z * SIN;
      if (d <= zb[i]) continue;
      OUT.c = null; OUT.dl = 0; OUT.flat = false; OUT.kind = KIND; OUT.emit = EMIT;
      if (shade(th * r0, t * h, OUT, x, y, z) === false) continue;
      let c = OUT.c;
      if (SNOW && t > .1 && !OUT.emit) c = SNOW_C;
      zb[i] = d;
      pix[i] = rampOf(c)[clamp(Math.floor(base + OUT.dl + (bayerAt(ix, iy) - .5) * .5), 0, 4)];
      T.kinds[i] = OUT.kind; T.emit[i] = OUT.emit; T.pick[i] = PICK;
    }
  }
}
// flat disc (well rims, table tops, rugs)
function disc(cx, cy, z, r, shade) {
  const step = 1 / (T.S * 1.7);
  for (let a = -r; a <= r; a += step) for (let b = -r; b <= r; b += step) {
    if (a * a + b * b > r * r) continue;
    const x = cx + a, y = cy + b, p = project(x, y, z), ix = p.sx | 0, iy = p.sy | 0;
    if (ix < 0 || iy < 0 || ix >= T.W || iy >= T.H) continue;
    const i = iy * T.W + ix;
    if (p.d <= T.zb[i]) continue;
    OUT.c = null; OUT.dl = 0; OUT.flat = false; OUT.kind = KIND; OUT.emit = EMIT;
    if (shade(a, b, OUT, x, y, z) === false) continue;
    T.zb[i] = p.d;
    const c = SNOW && !OUT.emit && OUT.kind !== K_WATER ? SNOW_C : OUT.c;
    T.pix[i] = rampOf(c)[clamp(Math.floor(3.4 + OUT.dl + (OUT.flat ? 0 : (bayerAt(ix, iy) - .5) * .5)), 0, 4)];
    T.kinds[i] = OUT.kind; T.emit[i] = OUT.emit; T.pick[i] = PICK;
  }
}

/* ---------- shadows & edges ---------- */
let SHADOW_X = 1.3, SHADOW_Y = -.12;
function castShadow(x, y, z, r, strength = 1, dither = .4, mask = null) {
  const p = project(x + SHADOW_X * z, y + SHADOW_Y * z, 0);
  const rx = r * T.S * 1.05, ry = rx * SIN + 1, W = T.W, H = T.H, m = mask || T.shadow;
  const y0 = Math.max(0, Math.floor(p.sy - ry)), y1 = Math.min(H - 1, Math.ceil(p.sy + ry));
  const x0 = Math.max(0, Math.floor(p.sx - rx)), x1 = Math.min(W - 1, Math.ceil(p.sx + rx));
  for (let iy = y0; iy <= y1; iy++) for (let ix = x0; ix <= x1; ix++) {
    const dx = (ix + .5 - p.sx) / rx, dy = (iy + .5 - p.sy) / ry;
    if (dx * dx + dy * dy + (bayerAt(ix, iy) - .5) * dither > 1) continue;
    const i = iy * W + ix;
    if (m[i] < strength) m[i] = strength;
  }
}
// project a vertical box's shadow onto the ground (buildings, walls, stalls)
function castBoxShadow(x0, y0, x1, y1, h, strength = 1) {
  const step = 1 / (T.S * 1.2);
  for (let z = 0; z <= h; z += step * 2) {
    const sx = SHADOW_X * z, sy = SHADOW_Y * z;
    for (let x = x0; x <= x1; x += step) for (const y of [y0, y1]) shadowPoint(x + sx, y + sy, strength);
    for (let y = y0; y <= y1; y += step) for (const x of [x0, x1]) shadowPoint(x + sx, y + sy, strength);
  }
  // fill the top footprint offset so the shadow is solid
  const sx = SHADOW_X * h, sy = SHADOW_Y * h;
  for (let x = x0; x <= x1; x += step) for (let y = y0; y <= y1; y += step) shadowPoint(x + sx, y + sy, strength);
}
function shadowPoint(x, y, s) {
  const p = project(x, y, 0), ix = p.sx | 0, iy = p.sy | 0;
  for (let k = 0; k < 2; k++) {
    const jx = ix + k;
    if (jx < 0 || iy < 0 || jx >= T.W || iy >= T.H) continue;
    const i = iy * T.W + jx;
    if (T.shadow[i] < s) T.shadow[i] = s;
  }
}
// gable roof shadow: sweep the ridge triangle along its length
function castRoofShadow(x0, y0, x1, y1, h, rh, alongX) {
  const step = 1 / (T.S * 1.1);
  if (alongX) {
    const ym = (y0 + y1) / 2, half = (y1 - y0) / 2;
    for (let x = x0; x <= x1; x += step) for (let o = -half; o <= half; o += step) {
      const z = h + rh * (1 - Math.abs(o) / half);
      shadowPoint(x + SHADOW_X * z, ym + o + SHADOW_Y * z, 1);
    }
  } else {
    const xm = (x0 + x1) / 2, half = (x1 - x0) / 2;
    for (let y = y0; y <= y1; y += step) for (let o = -half; o <= half; o += step) {
      const z = h + rh * (1 - Math.abs(o) / half);
      shadowPoint(xm + o + SHADOW_X * z, y + SHADOW_Y * z, 1);
    }
  }
}
function applyShadows(mask, clear = true) {
  const pix = T.pix, ground = T.ground, zb = T.zb, gz = T.groundZ;
  for (let i = 0; i < pix.length; i++) {
    const s = mask[i];
    if (!s) continue;
    if (clear) mask[i] = 0;
    if (!ground[i] || zb[i] !== gz[i]) continue;
    if (s === 1) tint(i, .56, .54, .74);
    else tint(i, .38, .36, .58);
  }
}
// pixel-art edges from the depth buffer: an object darkens its own silhouette against the ground and
// gets a warm rim where it sits over another object
function shadeEdges() {
  const W = T.W, H = T.H, zb = T.zb, gz = T.groundZ, pix = T.pix, GY = COS / (T.S * SIN);
  for (let iy = 1; iy < H - 1; iy++) for (let ix = 1; ix < W - 1; ix++) {
    const i = iy * W + ix, d = zb[i];
    if (d < -1e8 || d === gz[i]) continue;
    const a = i - W, b = i + W, c = i - 1, e = i + 1;
    if (zb[a] === gz[a] || zb[b] === gz[b] || zb[c] === gz[c] || zb[e] === gz[e] || zb[a] < -1e8 || zb[c] < -1e8 || zb[e] < -1e8) {
      tint(i, .66, .62, .74);
    } else if (d - zb[a] - GY > EDGE || d - zb[c] > EDGE) {
      const p = pix[i];
      pix[i] = rgb(lerp(p & 255, WARM[0], .28), lerp(p >> 8 & 255, WARM[1], .28), lerp(p >> 16 & 255, WARM[2], .2));
    } else if (zb[e] - d > EDGE || zb[b] - GY - d > EDGE) {
      tint(i, .74, .72, .82);
    }
  }
}
function bakeOcclusion() {
  const offsets = [], W = T.W, H = T.H, zb = T.zb, gz = T.groundZ;
  for (const r of [2, 4]) for (let k = 0; k < 8; k++) {
    offsets.push(Math.round(Math.sin(k * Math.PI / 4) * r * .7) * W + Math.round(Math.cos(k * Math.PI / 4) * r));
  }
  for (let iy = 4; iy < H - 4; iy++) for (let ix = 4; ix < W - 4; ix++) {
    const i = iy * W + ix;
    if (!T.ground[i] || zb[i] !== gz[i]) continue;
    let hits = 0;
    for (const o of offsets) if (zb[i + o] !== gz[i + o] && zb[i + o] > -1e8) hits++;
    if (!hits) continue;
    if (hits >= 8) tint(i, .6, .58, .74);
    else if (hits / 8 > bayerAt(ix, iy)) tint(i, .78, .76, .86);
  }
}

/* ---------- plants ---------- */
const BARK = [96, 74, 58];
const CROWN = [[.1, 0, 3.7, 1.6], [-1.4, -.7, 3.3, 1.2], [1.6, .7, 3.4, 1.25], [-.6, 1.1, 3.9, 1.1], [.9, -1.1, 4, 1.1], [.2, .1, 4.9, 1.05]];
// a gnarled trunk, then a dark core under leaf clusters that sway in drawLeaves (scene coordinates)
function growTree(scene, x, y, scale, count, seed, palette) {
  const bark = () => BARK;
  capsule([x, y, 0], [x + .3 * scale, y + .1 * scale, 2.2 * scale], .36 * scale, .22 * scale, bark, 'rough');
  capsule([x + .3 * scale, y + .1 * scale, 2.2 * scale], [x - .8 * scale, y - .4 * scale, 3.3 * scale], .2 * scale, .13 * scale, bark, 'rough');
  capsule([x + .3 * scale, y + .1 * scale, 2.2 * scale], [x + 1.2 * scale, y + .4 * scale, 3.4 * scale], .2 * scale, .13 * scale, bark, 'rough');
  const [deep, mid, light] = palette;
  for (let n = 0; n < count; n++) {
    const k = n + seed, [cx, cy, cz, spread] = CROWN[n % CROWN.length];
    const a = hash(k, 7) * 6.283, tilt = hash(k, 8) * 2 - 1, d = Math.cbrt(hash(k, 9)) * spread, flat = Math.sqrt(1 - tilt * tilt);
    const rx = cx + Math.cos(a) * flat * d, ry = cy + Math.sin(a) * flat * d, rz = cz + tilt * d * .8;
    const tone = hash(k, 10) + (rz - 4.2) * .22 + (d / spread - .5) * .3;
    const leaf = SNOW && tone > .55 ? SNOW_C : tone > .72 ? light : tone > .3 ? mid : deep;
    capture = [];
    sphere(x + rx * scale, y + ry * scale, rz * scale, (.2 + hash(k, 11) * .22) * scale, leaf, 'rough');
    scene.leaves.push({ x: x + rx * scale, y: y + ry * scale, z: rz * scale, k, r: .42 * scale, pixels: capture, pick: PICK });
    capture = null;
  }
}
// a conifer: stacked cones of needles, no sway (they are stiff), baked straight into the scene
function growPine(x, y, scale, palette) {
  capsule([x, y, 0], [x, y, 1.2 * scale], .2 * scale, .16 * scale, () => BARK, 'rough');
  const [deep, mid, light] = palette;
  for (let k = 0; k < 3; k++) {
    const z0 = (.9 + k * 1.05) * scale, r = (1.35 - k * .33) * scale;
    cone(x, y, z0, z0 + 1.7 * scale, r, (s, t, o) => {
      const v = noise(s * 3, t * 4 + k) + t * .25;
      o.c = SNOW && t < .5 && hash(s * 9 | 0, t * 9 | 0) > .45 ? SNOW_C : v > .78 ? light : v > .38 ? mid : deep;
      o.dl = (hash(s * 40 | 0, t * 40 | 0) - .5) * .9;
    });
  }
}
