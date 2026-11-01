'use strict';
// Scenes, the moving viewport, characters, particles and the lighting grade.

const WIND_FPS = 8; // stepped on purpose: sway should feel hand-animated, not simulated
let STILL = matchMedia('(prefers-reduced-motion: reduce)').matches;

class Scene {
  constructor(id, { S = 14, W, H, OX, OY, backdrop = 'sky', title = '' }) {
    Object.assign(this, { id, S, W, H, backdrop, title });
    this.t = makeTarget(W, H, S, OX, OY);
    this.light = new Uint8Array(W * H); // baked warm light pools from lamps, windows and fires
    this.leaves = []; this.tufts = []; this.lights = []; this.smokers = []; this.fires = []; this.sparkles = [];
    this.npcs = []; this.props = {}; this.doors = []; this.spots = {};
    this.nav = null;
    this.bounds = { x0: 0, y0: 0, x1: W, y1: H }; // pixel extent the camera may show
  }
  // run a bake step with this scene's target active
  with(fn) { const prev = T; T = this.t; try { return fn(); } finally { T = prev; } }
}

// bake the ground plane: fn(x, y, ix, iy) returns an rgb int (0 = no ground) and may set T.kinds
function bakeGround(scene, fn) {
  scene.with(() => {
    const { W, H } = T;
    for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
      const g = unproject(ix + .5, iy + .5), i = iy * W + ix;
      const c = fn(g.x, g.y, ix, iy, i);
      if (!c) continue;
      T.pix[i] = c; T.ground[i] = 1;
      T.zb[i] = groundDepth(g.x, g.y);
    }
    T.groundZ.set(T.zb);
  });
}
function growGrass(scene, density = .17) {
  const t = scene.t;
  for (let iy = 3; iy < t.H; iy++) for (let ix = 0; ix < t.W; ix++) {
    const i = iy * t.W + ix;
    if (t.kinds[i] !== K_GRASS || hash(ix * 3, iy * 5) > density) continue;
    scene.tufts.push({
      ix, iy, height: 1 + (hash(ix, iy * 2) * 3 | 0), base: Math.round(noise(ix * .09, iy * .18) * 2.2),
      phase: ix * .11 + iy * .19 + hash(ix, iy) * .9,
      bloom: hash(ix * 7, iy) < .03 ? rgb(...[[250, 246, 226], [240, 200, 84], [226, 132, 150], [190, 170, 230]][hash(ix, iy * 3) * 4 | 0]) : 0,
    });
  }
}
// finish a bake: occlusion, static shadows (kept for grass tufts), light map
function finishBake(scene) {
  scene.with(() => {
    bakeOcclusion();
    scene.staticShadow = T.shadow.slice();
    applyShadows(T.shadow);
    bakeLights(scene);
  });
}
function addLight(scene, x, y, z, r, k = 1, flicker = .15) {
  scene.lights.push({ x, y, z, r, k, flicker, seed: Math.random() * 10 });
}
function bakeLights(scene) {
  const t = scene.t, L = scene.light;
  for (const l of scene.lights) {
    const p = project(l.x, l.y, 0), rx = l.r * t.S, ry = rx * SIN;
    const x0 = Math.max(0, p.sx - rx | 0), x1 = Math.min(t.W - 1, p.sx + rx | 0);
    const y0 = Math.max(0, p.sy - ry - l.z * COS * t.S | 0), y1 = Math.min(t.H - 1, p.sy + ry | 0);
    for (let iy = y0; iy <= y1; iy++) for (let ix = x0; ix <= x1; ix++) {
      const i = iy * t.W + ix;
      // walls light up too: measure against the lamp's height for anything above the ground
      const dy = t.zb[i] === t.groundZ[i] ? (iy - p.sy) / ry : (iy - (p.sy - l.z * COS * t.S * .5)) / (ry * 1.6);
      const dx = (ix - p.sx) / rx, d = Math.sqrt(dx * dx + dy * dy);
      if (d >= 1) continue;
      const v = Math.pow(1 - d, 1.6) * l.k * 255;
      // quantised with dither so the pool reads as pixel-art rings, not a smooth gradient
      const q = Math.floor((v / 255 * 4 + bayerAt(ix, iy) - .5)) / 4 * 255;
      L[i] = Math.min(255, L[i] + Math.max(0, q));
    }
  }
}

/* ---------- viewport ---------- */
function makeView(W, H, S) {
  const v = makeTarget(W, H, S, 0, 0);
  v.light = new Uint8Array(W * H);
  v.sceneX = 0; v.sceneY = 0;
  return v;
}
// copy the camera window out of the bake; outside the scene is backdrop (FAR depth)
function copyWindow(scene, V, camX, camY) {
  const s = scene.t, W = V.W, H = V.H;
  V.S = s.S; V.OX = s.OX - camX; V.OY = s.OY - camY; V.sceneX = camX; V.sceneY = camY;
  for (let r = 0; r < H; r++) {
    const sy = camY + r, d = r * W;
    if (sy < 0 || sy >= s.H) { blankRow(V, d, W); continue; }
    let sx0 = camX, sx1 = camX + W, off = 0;
    if (sx0 < 0) { off = -sx0; sx0 = 0; }
    if (sx1 > s.W) sx1 = s.W;
    if (off > 0) blankRange(V, d, d + off);
    if (sx1 - sx0 > 0) {
      const a = sy * s.W + sx0, b = sy * s.W + sx1, at = d + off;
      V.pix.set(s.pix.subarray(a, b), at); V.zb.set(s.zb.subarray(a, b), at);
      V.groundZ.set(s.groundZ.subarray(a, b), at); V.ground.set(s.ground.subarray(a, b), at);
      V.kinds.set(s.kinds.subarray(a, b), at); V.emit.set(s.emit.subarray(a, b), at);
      V.light.set(scene.light.subarray(a, b), at);
    }
    const end = d + off + Math.max(0, sx1 - sx0);
    if (end < d + W) blankRange(V, end, d + W);
  }
}
function blankRow(V, d, W) { blankRange(V, d, d + W); }
function blankRange(V, a, b) {
  V.pix.fill(0, a, b); V.zb.fill(FAR, a, b); V.groundZ.fill(FAR, a, b); V.ground.fill(0, a, b);
  V.kinds.fill(0, a, b); V.emit.fill(0, a, b); V.light.fill(0, a, b);
}

function drawLeaves(scene, V, t) {
  const W = V.W, H = V.H, ox = V.sceneX, oy = V.sceneY, zb = V.zb, pix = V.pix;
  for (const leaf of scene.leaves) {
    const px = leaf.pixels;
    if (!px.length) continue;
    const fx = px[0] - ox, fy = px[1] - oy;
    if (fx < -24 || fy < -24 || fx > W + 24 || fy > H + 24) continue;
    const reach = clamp((leaf.z - 2.5) / 3, .3, 1);
    const swayX = (Math.sin(t * .9 + leaf.x * .5 + leaf.z * .7) + .55 * Math.sin(t * 2.3 + leaf.k * 1.7)) * reach * WIND;
    const dx = Math.round(swayX * .9) - ox, dy = Math.round(Math.sin(t * 1.3 + leaf.y + leaf.k) * reach * .45 * WIND) - oy;
    for (let n = 0; n < px.length; n += 4) {
      const ix = px[n] + dx, iy = px[n + 1] + dy;
      if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
      const i = iy * W + ix;
      if (px[n + 2] <= zb[i]) continue;
      zb[i] = px[n + 2];
      pix[i] = px[n + 3];
      V.kinds[i] = K_LEAF;
    }
    if (leaf.k % 2 === 0) castShadow(leaf.x + swayX * .12, leaf.y, leaf.z, leaf.r);
  }
}
let WIND = 1;
function drawTufts(scene, V, t, lit, dark) {
  const W = V.W, H = V.H, ox = V.sceneX, oy = V.sceneY, ss = scene.staticShadow, sw = scene.t.W;
  for (const tuft of scene.tufts) {
    const vx = tuft.ix - ox, vy = tuft.iy - oy;
    if (vx < -2 || vy < 0 || vx > W + 2 || vy > H + 4) continue;
    const gust = (Math.sin(t * .8 + tuft.phase) + .5 * Math.sin(t * 2.1 + tuft.phase * 2.3)) * WIND;
    const colors = ss[tuft.iy * sw + tuft.ix] ? dark : lit;
    for (let k = 1; k <= tuft.height; k++) {
      const jx = vx + Math.round(gust * .95 * k / 3), jy = vy - k;
      if (jx < 0 || jx >= W || jy < 0 || jy >= H) continue;
      const j = jy * W + jx;
      if ((V.kinds[j] !== K_GRASS && V.kinds[j] !== K_NONE) || V.zb[j] !== V.groundZ[j]) continue;
      V.pix[j] = tuft.bloom && k === tuft.height ? tuft.bloom : colors[clamp(tuft.base + k + (gust > 1 ? 1 : 0), 1, 4)];
    }
  }
}

/* ---------- characters ---------- */
const pendingShadows = [];
const dynamicAdd = (a, b, r0, r1, f) => { capsule(a, b, r0, r1, f, 'solid'); pendingShadows.push(a, r0, b, r1); };
function flushShadows() {
  for (let i = 0; i < pendingShadows.length; i += 4) {
    const a = pendingShadows[i], ra = pendingShadows[i + 1], c = pendingShadows[i + 2];
    const n = Math.max(1, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]) / .25));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      castShadow(lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t), ra * .9, 1, 0);
    }
    if (a[2] < .25) castShadow(a[0], a[1], 0, .22, 2, 0); // contact under the feet
  }
  pendingShadows.length = 0;
}
const SHOE = [70, 52, 44];
const EYE = rgb(30, 22, 26), BLUSH = rgb(236, 140, 130), SHADES = rgb(20, 18, 24), WHITE = rgb(255, 250, 240);
// A chibi villager: big head, short body. look = palette + accessories, pose = animation state.
// pose: { walk (phase, radians), moving (0..1), act: 'idle'|'hammer'|'write'|'wave'|'sit'|'sleep'|'pour'|'talk', t, talk (0..1) }
function person(x, y, yaw, pose, look, add = dynamicAdd) {
  const k = look.scale || 1, fx = Math.cos(yaw), fy = Math.sin(yaw), sx = -fy, sy = fx;
  const base = pose.z || 0;
  const P = (a, b, c) => [x + (fx * a + sx * b) * k, y + (fy * a + sy * b) * k, base + c * k];
  const A = (a, b, r0, r1, f) => add(a, b, r0 * k, r1 * k, f);
  const C = c => () => c;
  const t = pose.t || 0, walk = pose.walk || 0, mv = pose.moving || 0;
  const sitting = pose.act === 'sit' || pose.act === 'sleep' || pose.act === 'write';
  const bob = mv ? Math.abs(Math.sin(walk)) * .06 : (STILL ? 0 : Math.sin(t * 2.2 + x) * .012);
  const hip = (sitting ? .5 : .56) + bob;
  // legs
  const stride = Math.sin(walk) * .2 * mv;
  if (!look.robe) {
    for (const side of [-1, 1]) {
      const s = side * stride, lift = Math.max(0, Math.sin(walk + (side > 0 ? 0 : Math.PI))) * .08 * mv;
      const foot = sitting ? P(.34, side * .12, .32) : P(s, side * .12, .07 + lift);
      A(P(0, side * .12, hip), foot, .13, .11, C(look.legs));
      A(foot, [foot[0] + fx * .08 * k, foot[1] + fy * .08 * k, foot[2]], .1, .09, C(look.shoes || SHOE));
    }
  } else if (mv) { // little feet peeking under a robe
    for (const side of [-1, 1]) {
      const f = P(side * stride * .7 + .08, side * .1, .06);
      A(f, f, .09, .09, C(look.shoes || SHOE));
    }
  }
  // body
  const shZ = hip + .5, lean = pose.act === 'write' ? .12 : pose.act === 'sleep' ? .22 : 0;
  const neck = P(lean, 0, shZ + .02);
  if (look.robe) A(P(0, 0, sitting ? hip : .08), P(lean * .5, 0, shZ), look.robeW || .34, .25, z => z < .3 + base && look.hem ? look.hem : look.shirt);
  else A(P(0, 0, hip), P(lean * .6, 0, shZ), .27, .25, (z) => look.stripe && Math.floor(z * 6) % 2 ? look.stripe : look.shirt);
  if (look.belt) A(P(0, 0, hip + .12), P(0, 0, hip + .14), .28, .28, C(look.belt));
  if (look.apron) A(P(.17, 0, hip - .12), P(.18 + lean, 0, shZ - .06), .17, .15, C(look.apron));
  if (look.cape) A(P(-.16, 0, hip - .1), P(-.12, 0, shZ), .25, .26, C(look.cape));
  // arms
  const swing = Math.sin(walk) * .5 * mv;
  let armR = -swing, armL = swing, reachR = 0, reachL = 0;
  const act = pose.act;
  if (act === 'hammer') { const h = Math.max(0, Math.sin(t * 7)); armR = -1.7 * h - .3; reachR = .2; }
  else if (act === 'write') { armR = -.9 + Math.sin(t * 9) * .08; armL = -.7; reachR = .1; reachL = .1; }
  else if (act === 'wave') { armR = -2.5 + Math.sin(t * 8) * .35; }
  else if (act === 'pour') { armR = -1.1; armL = -1.0; }
  else if (act === 'talk' || pose.talk) { armR = -.5 + Math.sin(t * 5) * .25; }
  else if (act === 'staff') { armR = -.6; }
  else if (act === 'lute') { armL = -1.25; reachL = .05; armR = -.75 + Math.sin(t * 9) * .1; reachR = .12; }
  else if (act === 'sleep') { armR = -.3; armL = -.3; }
  const arm = (side, ang, reach) => {
    const sh = P(lean * .6, side * .3, shZ - .06);
    const hand = P(lean * .6 + Math.sin(-ang) * .42 + reach, side * (.36 + reach * .3), shZ - .06 - Math.cos(ang) * .42);
    A(sh, hand, .1, .085, C(look.sleeve || look.shirt));
    A(hand, hand, .085, .085, C(look.skin));
    return hand;
  };
  const handR = arm(1, armR, reachR), handL = arm(-1, armL, reachL);
  // head
  const nod = pose.act === 'sleep' ? .12 : 0;
  const head = P(lean + nod * .4, 0, shZ + .34 - nod * .5);
  A(neck, neck, .1, .1, C(look.skin));
  add(head, head, .33 * k, .33 * k, C(look.skin));
  const hairBack = [head[0] - fx * .07 * k, head[1] - fy * .07 * k, head[2] + .07 * k];
  if (look.hair && !look.hideHair && look.hat !== 'hood' && look.hat !== 'helmet') add(hairBack, hairBack, .315 * k, .315 * k, C(look.hair));
  if (look.beard) {
    const b = [head[0] + fx * .17 * k, head[1] + fy * .17 * k, head[2] - .17 * k];
    add(b, [b[0], b[1], b[2] - .1 * k], .17 * k, .12 * k, C(look.beard));
  }
  hat(look, head, fx, fy, k, add);
  if (look.gear && typeof gear === 'function') gear(look, { P, A, add, k, fx, fy, sx, sy, shZ, hip, head, handR, handL, t, mv, walk });
  // the cute part: eyes and blush as single pixels pushed just in front of the head
  face(head, fx, fy, sx, sy, k, look, pose);
  return { head, handR, handL };
}
function hat(look, head, fx, fy, k, add) {
  const C = c => () => c, h = look.hat, col = look.hatColor || [120, 60, 50];
  const at = (a, z) => [head[0] - fx * a * k, head[1] - fy * a * k, head[2] + z * k];
  if (typeof HAT_MORE !== 'undefined' && HAT_MORE[h]) {
    const sx = -fy, sy = fx, S = (a, b, z) => [head[0] - fx * a * k + sx * b * k, head[1] - fy * a * k + sy * b * k, head[2] + z * k];
    return HAT_MORE[h]({ look, head, fx, fy, sx, sy, k, add, at, S, C, col, t: G.time });
  }
  if (h === 'hood') {
    add(at(.05, .04), at(.05, .04), .36 * k, .36 * k, C(col));
    add(at(.22, .2), at(.36, .34), .14 * k, .05 * k, C(col));
  } else if (h === 'wizard') {
    add(at(0, .2), at(0, .2), .4 * k, .4 * k, C(col)); // brim
    add(at(0, .26), at(.08, .62), .27 * k, .12 * k, C(col));
    add(at(.08, .62), at(.26, .82), .12 * k, .04 * k, C(col));
    if (look.hatBand) add(at(0, .3), at(0, .32), .27 * k, .26 * k, C(look.hatBand));
  } else if (h === 'cap') {
    add(at(.02, .18), at(.02, .22), .3 * k, .26 * k, C(col));
    add(at(-.2, .12), at(-.26, .12), .1 * k, .08 * k, C(col));
  } else if (h === 'straw') {
    for (let a = 0; a < 6.283; a += .5) {
      const p = [head[0] + Math.cos(a) * .42 * k, head[1] + Math.sin(a) * .42 * k, head[2] + .14 * k];
      add(p, p, .13 * k, .13 * k, C(col));
    }
    add(at(0, .22), at(0, .32), .28 * k, .22 * k, C(col));
    if (look.hatBand) add(at(0, .2), at(0, .22), .29 * k, .29 * k, C(look.hatBand));
  } else if (h === 'helmet') {
    // an open-faced knight's helm: steel dome, raised crest, riveted rim, cheek guards, a nasal and a sweeping plume
    const sx = -fy, sy = fx, steel = [168, 172, 182], dark = [112, 116, 128], hi = [222, 226, 234];
    const S = (a, b, z) => [head[0] - fx * a * k + sx * b * k, head[1] - fy * a * k + sy * b * k, head[2] + z * k];
    add(at(.04, .1), at(.06, .2), .35 * k, .3 * k, C(steel));                                   // dome
    add(S(-.1, -.1, .36), S(-.1, -.1, .36), .07 * k, .07 * k, C(hi));                             // a polished glint
    for (let q = 0; q <= 6; q++) { const u = q / 6 - .5; add(S(u * .62, 0, .4 - u * u * .5), S(u * .62, 0, .4 - u * u * .5), .055 * k, .055 * k, C(dark)); } // the crest ridge
    for (let a = 0; a < 6.283; a += .3) {                                                          // the rim, studded with rivets
      const p = [head[0] + Math.cos(a) * .33 * k, head[1] + Math.sin(a) * .33 * k, head[2] + .04 * k];
      const front = Math.cos(a) * fx + Math.sin(a) * fy;
      if (front > .55) continue;                                                                   // leave the face open
      add(p, p, .07 * k, .07 * k, C(dark));
    }
    for (const sd of [-1, 1]) add(S(.02, sd * .3, .02), S(-.08, sd * .27, -.24), .1 * k, .07 * k, C(steel));  // cheek guards
    add(S(-.3, 0, .12), S(-.37, 0, -.1), .05 * k, .04 * k, C(dark));                              // nasal
    const plume = look.plume || [190, 50, 50];
    for (let q = 0; q < 10; q++) {
      const u = q / 9, p = S(.05 + u * .6, 0, .46 + Math.sin(u * 2.6) * .26 - u * .1);
      add(p, p, (.1 - u * .05) * k, (.1 - u * .05) * k, C(q % 3 === 1 ? mixc(plume, [255, 255, 255], .3) : plume));
    }
  } else if (h === 'kerchief') {
    add(at(.02, .12), at(.02, .12), .34 * k, .34 * k, C(col));
    add(at(.3, .02), at(.4, -.04), .08 * k, .05 * k, C(col));
  } else if (h === 'beret') {
    add(at(.06, .26), at(.1, .28), .3 * k, .22 * k, C(col));
  } else if (h === 'crown') {
    for (let a = 0; a < 6.283; a += .9) {
      const p = [head[0] + Math.cos(a) * .2 * k, head[1] + Math.sin(a) * .2 * k, head[2] + .34 * k];
      add(p, [p[0], p[1], p[2] + .1 * k], .06 * k, .04 * k, C([236, 196, 80]));
    }
  } else if (h === 'cavalier') {
    // a swashbuckler's wide brim cocked up on one side, tall dark crown, thin gold band, sweeping plume
    const sx = -fy, sy = fx;
    for (let a = 0; a < 6.283; a += .32) {
      const side = Math.cos(a) * sx + Math.sin(a) * sy;
      const p = [head[0] + Math.cos(a) * .4 * k, head[1] + Math.sin(a) * .4 * k, head[2] + (.17 + Math.max(0, side) * .14) * k];
      add(p, p, .085 * k, .085 * k, C(col));
    }
    add(at(0, .24), at(.02, .46), .25 * k, .2 * k, C(col));
    const band = look.hatBand || [236, 190, 86];
    for (let a = 0; a < 6.283; a += .45) {
      const p = [head[0] + Math.cos(a) * .25 * k, head[1] + Math.sin(a) * .25 * k, head[2] + .27 * k];
      add(p, p, .045 * k, .045 * k, C(band));
    }
    const plume = look.plume || [236, 232, 220];
    const b0 = [head[0] + sx * .2 * k, head[1] + sy * .2 * k, head[2] + .4 * k];
    for (let q = 0; q < 9; q++) {
      const u = q / 8, p = [b0[0] - fx * u * .62 * k + sx * u * .08 * k, b0[1] - fy * u * .62 * k + sy * u * .08 * k, b0[2] + Math.sin(u * 2.4) * .3 * k];
      add(p, p, (.11 - u * .07) * k, (.11 - u * .07) * k, C(q % 3 === 1 ? mixc(plume, [255, 255, 255], .35) : plume));
    }
  } else if (h === 'antlers') {
    const sx = -fy, sy = fx, bone = look.hatColor || [200, 170, 120];
    for (const s of [-1, 1]) {
      const b0 = [head[0] + sx * s * .2 * k, head[1] + sy * s * .2 * k, head[2] + .26 * k], tip = [b0[0] + sx * s * .26 * k, b0[1] + sy * s * .26 * k, b0[2] + .36 * k];
      add(b0, tip, .045 * k, .03 * k, C(bone));
      for (const u of [.4, .75]) { const m = [lerp(b0[0], tip[0], u), lerp(b0[1], tip[1], u), lerp(b0[2], tip[2], u)]; add(m, [m[0] - fx * .1 * k, m[1] - fy * .1 * k, m[2] + .14 * k], .03 * k, .02 * k, C(bone)); }
    }
  } else if (h === 'halo') {
    for (let a = 0; a < 6.283; a += .4) plotGlow(head[0] + Math.cos(a) * .24 * k, head[1] + Math.sin(a) * .24 * k, head[2] + .62 * k, rgb(255, 236, 150));
  } else if (h === 'bun') {
    add(at(.18, .26), at(.18, .26), .15 * k, .15 * k, C(look.hair));
  }
}
// faces sit on the head's surface: only a sliver of depth slack, or they show through hats, walls and the back of the head
const FACE_EPS = .14;
function face(head, fx, fy, sx, sy, k, look, pose) {
  // only when the face turns toward the camera (+x+y)
  if (fx + fy < -.35 || look.noFace) return;
  const r = .335 * k, eyeZ = head[2] - .02 * k;
  const closed = pose.act === 'sleep' || (!STILL && ((pose.t || 0) * 1.3 + head[0]) % 4 < .12);
  for (const side of [-1, 1]) {
    const ex = head[0] + fx * r * .93 + sx * side * .13 * k, ey = head[1] + fy * r * .93 + sy * side * .13 * k;
    const p = project(ex, ey, eyeZ), ix = Math.round(p.sx), iy = Math.round(p.sy);
    dot(ix, iy, look.shades ? SHADES : EYE, p.d + FACE_EPS);
    if (look.shades) { dot(ix + 1, iy, SHADES, p.d + FACE_EPS); dot(ix - 1, iy, SHADES, p.d + FACE_EPS); }
    else if (closed) dot(ix + 1, iy, EYE, p.d + FACE_EPS);
    if (look.specs || look.patch || look.stache) { const m = project(head[0] + fx * r * .97, head[1] + fy * r * .97, head[2] - .12 * k); faceGear(look, side, ix, iy, p.d + FACE_EPS + .01, [Math.round(m.sx), Math.round(m.sy), m.d + FACE_EPS + .01]); }
    if (look.blush && !look.shades) {
      const b = project(ex + fx * .02, ey + fy * .02, eyeZ - .13 * k);
      dot(Math.round(b.sx) + side, Math.round(b.sy), BLUSH, b.d + FACE_EPS);
    }
  }
  if (pose.talk && Math.floor((pose.t || 0) * 9) % 2) {
    const m = project(head[0] + fx * r * .95, head[1] + fy * r * .95, head[2] - .17 * k);
    dot(Math.round(m.sx), Math.round(m.sy), rgb(120, 40, 40), m.d + FACE_EPS);
  }
}
function dot(ix, iy, color, d) {
  if (ix < 0 || iy < 0 || ix >= T.W || iy >= T.H) return;
  const i = iy * T.W + ix;
  if (T.zb[i] > d) return;
  T.pix[i] = color;
}
function drawDots(points, color) {
  for (let n = 0; n < points.length; n += 2) {
    const ix = points[n] | 0, iy = points[n + 1] | 0;
    if (ix >= 0 && iy >= 0 && ix < T.W && iy < T.H) T.pix[iy * T.W + ix] = color;
  }
}

/* ---------- particles ---------- */
const parts = [];
function emit(p) { if (parts.length < 900) parts.push(p); }
function stepParticles(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.g) p.vz -= p.g * dt;
    if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
  }
}
function drawParticles(sceneId) {
  for (const p of parts) {
    if (p.scene !== sceneId) continue;
    const q = project(p.x, p.y, p.z), ix = q.sx | 0, iy = q.sy | 0;
    if (ix < 0 || iy < 0 || ix >= T.W || iy >= T.H) continue;
    const i = iy * T.W + ix;
    if (!p.over && q.d < T.zb[i]) continue;
    const c = typeof p.c === 'function' ? p.c(p) : p.c;
    T.pix[i] = c;
    if (p.glow) T.emit[i] = 1;
    if (p.size === 2) {
      if (ix + 1 < T.W) T.pix[i + 1] = c;
      if (iy + 1 < T.H) T.pix[i + T.W] = c;
      if (ix + 1 < T.W && iy + 1 < T.H) T.pix[i + T.W + 1] = c;
    }
  }
}

/* ---------- lighting grade ---------- */
// amb: rgb multipliers for unlit pixels; night 0..1 turns on windows and light pools
const GRADE = { amb: [1, 1, 1], night: 0, warm: [1.28, 1.02, .62], flick: 1, windowGlow: [255, 206, 120] };
function grade(V) {
  const pix = V.pix, emit = V.emit, kinds = V.kinds, light = V.light, n = pix.length;
  const [ar, ag, ab] = GRADE.amb, night = GRADE.night, [wr, wg, wb] = GRADE.warm, fl = GRADE.flick;
  if (ar === 1 && ag === 1 && ab === 1 && night < .02) return;
  const glowOn = night > .25, wg0 = GRADE.windowGlow;
  for (let i = 0; i < n; i++) {
    const c = pix[i];
    if (!c || emit[i]) continue;
    let r = c & 255, g = c >> 8 & 255, b = c >> 16 & 255;
    if (glowOn && kinds[i] === K_WINDOW) {
      const lum = (r + g + b) / 765;
      pix[i] = rgb(wg0[0] * (.75 + lum * .5) * fl, wg0[1] * (.7 + lum * .5) * fl, wg0[2] * (.6 + lum * .6));
      continue;
    }
    let L = night > .02 ? light[i] / 255 * night * fl : 0;
    if (kinds[i] === K_LEAF) L *= .3; // lamp pools are on the ground, not up in the canopy
    pix[i] = rgb(r * (ar + L * wr), g * (ag + L * wg), b * (ab + L * wb));
  }
}
// a moving light (the player's lantern at night): adds into the light buffer before the grade
function dynamicLight(V, x, y, z, r, k) {
  const p = project(x, y, 0), rx = r * V.S, ry = rx * SIN;
  const x0 = Math.max(0, p.sx - rx | 0), x1 = Math.min(V.W - 1, p.sx + rx | 0);
  const y0 = Math.max(0, p.sy - ry - z * COS * V.S | 0), y1 = Math.min(V.H - 1, p.sy + ry | 0);
  for (let iy = y0; iy <= y1; iy++) for (let ix = x0; ix <= x1; ix++) {
    const i = iy * V.W + ix, dx = (ix - p.sx) / rx, dy = (iy - p.sy) / ry, d = Math.sqrt(dx * dx + dy * dy);
    if (d >= 1) continue;
    const q = Math.floor(((1 - d) * k * 4 + bayerAt(ix, iy) - .5)) / 4 * 255;
    if (q > 0) V.light[i] = Math.min(255, V.light[i] + q);
  }
}

/* ---------- backdrop ---------- */
// day: warm parchment; dusk: peach to lilac; night: deep navy with stars. Interiors sit in warm dark.
const BACK = { top: [236, 228, 210], bottom: [244, 238, 222], stars: 0 };
function fillBackdrop(V, kind, time) {
  const pix = V.pix, zb = V.zb, W = V.W, H = V.H;
  let top = BACK.top, bot = BACK.bottom;
  if (kind === 'room') { top = [26, 19, 22]; bot = [34, 25, 27]; }
  const rows = new Uint32Array(H * 2);
  for (let y = 0; y < H; y++) {
    const t = y / H;
    for (let k = 0; k < 2; k++) {
      const tt = clamp(t + (k ? .03 : -.03), 0, 1);
      rows[y * 2 + k] = rgb(lerp(top[0], bot[0], tt), lerp(top[1], bot[1], tt), lerp(top[2], bot[2], tt));
    }
  }
  const stars = kind !== 'room' ? BACK.stars : 0, ox = V.sceneX, oy = V.sceneY;
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
    const i = iy * W + ix;
    if (zb[i] > -1e8) continue;
    const t = iy / H, b = bayerAt(ix, iy);
    pix[i] = rows[iy * 2 + (b > .5 ? 1 : 0)];
    if (stars > 0) {
      const sx = ix + ox, sy = iy + oy;
      const h = hash(sx * .37 | 0, sy * .41 | 0);
      if (h > 1 - .004 * stars && hash(sx, sy) > .5) {
        const tw = STILL ? 1 : .6 + .4 * Math.sin(time * (1 + h * 3) + sx);
        pix[i] = rgb(lerp(top[0], 255, tw * stars), lerp(top[1], 246, tw * stars), lerp(top[2], 220, tw * stars));
      }
    }
    if (kind === 'room' && t > 0) {
      // soft dithered vignette toward the edges
      const e = Math.min(ix, W - ix, iy, H - iy) / 40;
      if (e < 1 && e < b) pix[i] = rgb(18, 13, 15);
    }
  }
}
