'use strict';
// Buildings, props and furniture, painted with the quad/cylinder/cone primitives.

const PAL = {
  plaster: [238, 224, 194], plasterWarm: [240, 214, 170], plasterRose: [232, 196, 182], plasterSage: [206, 214, 182],
  timber: [94, 62, 46], stone: [158, 152, 142], stoneDark: [120, 114, 110], mortar: [104, 98, 96],
  tile: [196, 88, 60], tileDark: [160, 66, 50], thatch: [210, 170, 96], slate: [88, 98, 124], slatePurple: [104, 84, 132],
  shingle: [128, 92, 70], wood: [156, 108, 66], woodDark: [112, 76, 50], woodLight: [186, 140, 92],
  door: [126, 76, 46], glass: [66, 86, 116], iron: [60, 60, 66], gold: [232, 190, 86],
  sage: [108, 138, 98], blue: [86, 112, 152], red: [170, 70, 58], cream: [244, 236, 214],
};

/* ---------- surface shaders ---------- */
function timberWall(len, h, plaster, seed = 0, brace = true) {
  const sp = len / Math.max(1, Math.round(len / 1.25));
  return (s, t, o) => {
    const m = s % sp, mid = h * .48;
    const post = m < .1 || m > sp - .1 || s < .12 || s > len - .12;
    const beam = Math.abs(t - mid) < .07 || t > h - .14 || t < .1;
    const panel = Math.floor(s / sp);
    let br = false;
    if (brace && t < mid && (panel + seed) % 2 === 0) br = Math.abs((m / sp) - (t / mid)) < .09;
    if (post || beam || br) { o.c = PAL.timber; o.dl = (hash(s * 8 | 0, t * 3 | 0) - .5) * .5; o.flat = true; return; }
    o.c = plaster; o.dl = (noise(s * 4 + seed, t * 4) - .5) * .5 + .15;
  };
}
function stoneWall(stone = PAL.stone, seed = 0, rowH = .3, blockW = .55) {
  return (s, t, o) => {
    const r = Math.floor(t / rowH), off = (r % 2) * blockW * .5, ss = s + off;
    const col = Math.floor(ss / blockW);
    if (t % rowH < .045 || ss % blockW < .045) { o.c = PAL.mortar; o.dl = -.2; return; }
    const v = hash(col + seed, r * 3.1);
    o.c = v > .86 ? [134, 140, 112] : stone; // a few mossy blocks
    o.dl = (v - .5) * .9 + (noise(s * 6, t * 6) - .5) * .3;
  };
}
function plankShade(c, along = 's', w = .22, seed = 0) {
  return (s, t, o) => {
    const a = along === 's' ? t : s, b = along === 's' ? s : t;
    const plank = Math.floor(a / w);
    o.c = c;
    if (a % w < .03) { o.dl = -.9; return; }
    o.dl = (hash(plank + seed, Math.floor(b / 1.7 + plank * .37)) - .5) * .7 + (noise(b * 6, plank) - .5) * .25;
  };
}
function roofShade(kind, color, len) {
  if (kind === 'thatch') return (s, t, o) => {
    o.c = color;
    o.dl = (noise(s * 14, t * 1.4) - .5) * 1.3 + (t < .14 ? -.6 : 0) + (t > len - .1 ? -.5 : 0);
  };
  if (kind === 'slate') return (s, t, o) => {
    const r = Math.floor(t / .2), col = Math.floor((s + (r % 2) * .14) / .28);
    o.c = color;
    o.dl = (t % .2 < .035 ? -.8 : 0) + (hash(col, r) - .5) * .6 + (t > len - .1 ? -.4 : 0);
  };
  if (kind === 'shingle') return (s, t, o) => {
    const r = Math.floor(t / .22), col = Math.floor((s + (r % 2) * .12) / .24);
    o.c = color;
    o.dl = (t % .22 < .04 || (s + (r % 2) * .12) % .24 < .03 ? -.8 : 0) + (hash(col, r) - .5) * .7;
  };
  // clay tiles: scalloped rows, each tile its own shade, a dark ridge cap
  return (s, t, o) => {
    const rowH = .25, r = Math.floor(t / rowH), ft = (t % rowH) / rowH;
    const cs = (s + (r % 2) * .16) % .32, col = Math.floor((s + (r % 2) * .16) / .32);
    o.c = hash(col, r) > .82 ? PAL.tileDark : color;
    let dl = (hash(col * 3, r) - .5) * .6;
    if (ft < .22) dl -= .9; // the shadow under the row above
    if (cs < .04) dl -= .6;
    if (t > len - .14) { o.c = PAL.tileDark; dl = -.3; }
    o.dl = dl;
  };
}

/* ---------- houses ---------- */
// def: { x, y, w, d, h, walls, wall, roof, roofColor, rh, door:{face,at}, windows:[{face,at,z,w,h,shutter}], chimney:{at,side}, pick }
function house(scene, def) {
  const { x, y, w, d, h } = def, x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2;
  const ridgeX = def.ridge ? def.ridge === 'x' : w >= d;
  const rh = def.rh || Math.min(w, d) * .55, ov = .28;
  PICK = def.pick || 0;
  const plaster = def.wall || PAL.plaster;
  // foundation
  const fnd = stoneWall(PAL.stoneDark, 3, .16, .34);
  boxS(x0 - .06, y0 - .06, 0, x1 + .06, y1 + .06, .32, solid(PAL.stoneDark), fnd, fnd);
  // walls
  const wallFn = (len, seed) => def.walls === 'stone' ? stoneWall(def.stone || PAL.stone, seed) : def.walls === 'plaster'
    ? (s, t, o) => { o.c = plaster; o.dl = (noise(s * 3 + seed, t * 3) - .5) * .5 + .2; if (s < .14 || s > len - .14) { o.c = PAL.stone; o.dl = (hash(s * 9 | 0, t * 4 | 0) - .5) * .8; } }
    : timberWall(len, h - .32, plaster, seed, def.brace !== false);
  boxS(x0, y0, .32, x1, y1, h, null, wallFn(w, 1), wallFn(d, 2));
  // roof
  const rs = def.roof || 'tile', rc = def.roofColor || (rs === 'thatch' ? PAL.thatch : rs === 'slate' ? PAL.slate : rs === 'shingle' ? PAL.shingle : PAL.tile);
  if (ridgeX) {
    const half = d / 2 + ov, slope = Math.hypot(half, rh + .14);
    quad([x0 - ov, y1 + ov, h - .14], [w + ov * 2, 0, 0], [0, -half, rh + .14], roofShade(rs, rc, slope), false, [0, rh, d / 2]);
    quad([x0 - ov, y0 - ov, h - .14], [w + ov * 2, 0, 0], [0, half, rh + .14], roofShade(rs, rc, slope), false, [0, -rh, d / 2]);
    quad([x1, y0, h], [0, d, 0], [0, d / 2, rh], wallFn(d, 5), true, [1, 0, 0]);
    // eave and barge boards give the roof a thickness
    quad([x0 - ov, y1 + ov, h - .3], [w + ov * 2, 0, 0], [0, 0, .16], solid(PAL.woodDark, .4), false, [0, 1, 0]);
    quad([x1 + ov, y1 + ov, h - .3], [0, -half, rh + .14], [0, 0, .16], solid(PAL.woodDark, .4), false, [1, 0, 0]);
    quad([x1 + ov, y0 - ov, h - .3], [0, half, rh + .14], [0, 0, .16], solid(PAL.woodDark, .4), false, [1, 0, 0]);
    castRoofShadow(x0 - ov, y0 - ov, x1 + ov, y1 + ov, h, rh, true);
  } else {
    const half = w / 2 + ov, slope = Math.hypot(half, rh + .14);
    quad([x1 + ov, y0 - ov, h - .14], [0, d + ov * 2, 0], [-half, 0, rh + .14], roofShade(rs, rc, slope), false, [rh, 0, w / 2]);
    quad([x0 - ov, y0 - ov, h - .14], [0, d + ov * 2, 0], [half, 0, rh + .14], roofShade(rs, rc, slope), false, [-rh, 0, w / 2]);
    quad([x0, y1, h], [w, 0, 0], [w / 2, 0, rh], wallFn(w, 6), true, [0, 1, 0]);
    quad([x1 + ov, y0 - ov, h - .3], [0, d + ov * 2, 0], [0, 0, .16], solid(PAL.woodDark, .4), false, [1, 0, 0]);
    quad([x1 + ov, y1 + ov, h - .3], [-half, 0, rh + .14], [0, 0, .16], solid(PAL.woodDark, .4), false, [0, 1, 0]);
    quad([x0 - ov, y1 + ov, h - .3], [half, 0, rh + .14], [0, 0, .16], solid(PAL.woodDark, .4), false, [0, 1, 0]);
    castRoofShadow(x0 - ov, y0 - ov, x1 + ov, y1 + ov, h, rh, false);
  }
  castBoxShadow(x0, y0, x1, y1, h);
  // chimney
  if (def.chimney) {
    const c = def.chimney, cx = ridgeX ? lerp(x0, x1, c.at) : x + (c.side || 0) * w * .22, cy = ridgeX ? y + (c.side || 0) * d * .22 : lerp(y0, y1, c.at);
    const top = h + rh + .5;
    const sw = stoneWall(PAL.stoneDark, 9, .2, .3);
    boxS(cx - .24, cy - .24, h, cx + .24, cy + .24, top, solid(PAL.stoneDark), sw, sw);
    boxS(cx - .3, cy - .3, top, cx + .3, cy + .3, top + .12, solid(PAL.stoneDark), solid(PAL.stoneDark), solid(PAL.stoneDark));
    disc(cx, cy, top + .125, .16, (a, b, o) => { o.c = [30, 24, 24]; o.flat = true; });
    castBoxShadow(cx - .24, cy - .24, cx + .24, cy + .24, top);
    scene.smokers.push({ x: cx, y: cy, z: top + .2, rate: c.rate || 1, key: c.key || null });
  }
  // door and windows sit a hair in front of the wall
  const onFace = (face, at, z0, ww, hh, fn) => {
    if (face === 'y') quad([lerp(x0, x1, at) - ww / 2, y1 + .025, z0], [ww, 0, 0], [0, 0, hh], fn, false, [0, 1, 0]);
    else quad([x1 + .025, lerp(y0, y1, at) - ww / 2, z0], [0, ww, 0], [0, 0, hh], fn, false, [1, 0, 0]);
  };
  for (const win of def.windows || []) {
    const ww = win.w || .62, hh = win.h || .74, z0 = win.z || 1.15;
    onFace(win.face, win.at, z0, ww, hh, windowShade(ww, hh, win.arch));
    if (win.shutter) {
      for (const side of [-1, 1]) {
        const off = side * (ww / 2 + .13);
        if (win.face === 'y') quad([lerp(x0, x1, win.at) + off - .11, y1 + .03, z0], [.22, 0, 0], [0, 0, hh], plankShade(win.shutter, 't', .07), false, [0, 1, 0]);
        else quad([x1 + .03, lerp(y0, y1, win.at) + off - .11, z0], [0, .22, 0], [0, 0, hh], plankShade(win.shutter, 't', .07), false, [1, 0, 0]);
      }
    }
    if (win.flowers) flowerBox(win.face, win.face === 'y' ? lerp(x0, x1, win.at) : x1, win.face === 'y' ? y1 : lerp(y0, y1, win.at), z0, ww, win.flowers);
  }
  if (def.door) {
    const dd = def.door, dw = dd.w || .74, dh = dd.h || 1.3;
    onFace(dd.face, dd.at, .32, dw, dh, doorShade(dw, dh, dd.color || PAL.door));
    // a step stone and the spot the player walks to
    const dx = dd.face === 'y' ? lerp(x0, x1, dd.at) : x1 + .35, dy = dd.face === 'y' ? y1 + .35 : lerp(y0, y1, dd.at);
    PICK = def.pick || 0;
    box(dx - (dd.face === 'y' ? .5 : .3), dy - (dd.face === 'y' ? .3 : .5), 0, dx + (dd.face === 'y' ? .5 : .3), dy + (dd.face === 'y' ? .3 : .5), .16, PAL.stone, .6);
    const ex = dd.face === 'y' ? dx : dx + .75, ey = dd.face === 'y' ? dy + .75 : dy;
    scene.doors.push({ id: def.id, x: ex, y: ey, face: dd.face, doorX: dd.face === 'y' ? dx : x1, doorY: dd.face === 'y' ? y1 : dy, pick: def.pick });
    if (dd.lamp !== false) {
      const lx = dd.face === 'y' ? dx + dw / 2 + .25 : x1 + .1, ly = dd.face === 'y' ? y1 + .1 : dy + dw / 2 + .25;
      wallLantern(scene, lx, ly, 1.55, dd.face);
    }
  }
  PICK = 0;
  return { x0, y0, x1, y1, h, rh };
}
function windowShade(ww, hh, arch) {
  return (s, t, o) => {
    const fr = .07;
    if (arch) { const cx = ww / 2, r = ww / 2, ty = hh - r; if (t > ty && Math.hypot(s - cx, t - ty) > r) return false; }
    if (s < fr || s > ww - fr || t < fr || t > hh - fr) { o.c = PAL.woodDark; o.flat = true; return; }
    if (Math.abs(s - ww / 2) < .035 || Math.abs(t - hh * .55) < .035) { o.c = PAL.woodDark; o.flat = true; return; }
    o.c = PAL.glass; o.kind = K_WINDOW;
    o.dl = ((s + t) % .5 < .1 ? .9 : 0) - .2; // a glint across the pane
    o.flat = true;
  };
}
function doorShade(dw, dh, color) {
  return (s, t, o) => {
    const cx = dw / 2, r = dw / 2, ty = dh - r;
    if (t > ty && Math.hypot(s - cx, t - ty) > r) return false;
    if (t > ty && Math.hypot(s - cx, t - ty) > r - .07 || s < .06 || s > dw - .06) { o.c = PAL.woodDark; o.flat = true; return; }
    o.c = color;
    o.dl = (s % .18 < .03 ? -.8 : 0) + (Math.abs(t - .35) < .04 || Math.abs(t - dh * .7) < .04 ? -.6 : 0);
    if (Math.abs(s - dw * .78) < .05 && Math.abs(t - .65) < .05) { o.c = PAL.gold; o.dl = .6; }
  };
}
function flowerBox(face, x, y, z0, ww, colors) {
  const pick = PICK;
  if (face === 'y') {
    box(x - ww / 2 - .05, y, z0 - .22, x + ww / 2 + .05, y + .2, z0 - .04, PAL.woodDark, .4);
    for (let k = 0; k < 7; k++) sphere(x - ww / 2 + k * ww / 6, y + .1 + hash(k, 2) * .06, z0 + .02, .085, k % 3 === 1 ? [92, 140, 72] : colors[k % colors.length], 'rough');
  } else {
    box(x, y - ww / 2 - .05, z0 - .22, x + .2, y + ww / 2 + .05, z0 - .04, PAL.woodDark, .4);
    for (let k = 0; k < 7; k++) sphere(x + .1 + hash(k, 2) * .06, y - ww / 2 + k * ww / 6, z0 + .02, .085, k % 3 === 1 ? [92, 140, 72] : colors[k % colors.length], 'rough');
  }
  PICK = pick;
}
function wallLantern(scene, x, y, z, face) {
  const p = PICK;
  capsule([x, y, z + .32], face === 'y' ? [x, y - .1, z + .32] : [x - .1, y, z + .32], .03, .03, () => PAL.iron, 'solid');
  lantern(scene, x, y, z, .55);
  PICK = p;
}
function lantern(scene, x, y, z, s = 1) {
  box(x - .11 * s, y - .11 * s, z, x + .11 * s, y + .11 * s, z + .04 * s, PAL.iron, .3);
  EMIT = 1;
  box(x - .08 * s, y - .08 * s, z + .04 * s, x + .08 * s, y + .08 * s, z + .26 * s, [255, 214, 130], .2);
  EMIT = 0;
  box(x - .13 * s, y - .13 * s, z + .26 * s, x + .13 * s, y + .13 * s, z + .31 * s, PAL.iron, .3);
  addLight(scene, x, y, z, 3.1, .8);
  scene.fires.push({ x, y, z: z + .15 * s, kind: 'lamp' });
}
function lampPost(scene, x, y) {
  capsule([x, y, 0], [x, y, 2.05], .07, .06, () => PAL.iron, 'solid');
  sphere(x, y, .06, .13, PAL.iron, 'solid');
  capsule([x, y, 2.05], [x + .22, y - .22, 2.15], .035, .035, () => PAL.iron, 'solid');
  lantern(scene, x, y, 2.1, .9);
  castShadow(x, y, 1, .1); castShadow(x, y, 1.8, .14);
}

/* ---------- props ---------- */
function well(scene, x, y) {
  cylinder(x, y, 0, .75, .85, stoneWall(PAL.stone, 4, .2, .32), -Math.PI, Math.PI);
  disc(x, y, .76, .85, (a, b, o) => { const r = Math.hypot(a, b); if (r < .62) { o.c = [40, 56, 72]; o.kind = K_WATER; o.flat = true; o.dl = -.8; } else { o.c = PAL.stone; o.dl = (hash(a * 9 | 0, b * 9 | 0) - .5) * .6; } });
  for (const s of [-1, 1]) box(x + s * .62 - .06, y - .06, .7, x + s * .62 + .06, y + .06, 2.0, PAL.woodDark, .5);
  capsule([x - .66, y, 1.65], [x + .66, y, 1.65], .06, .06, () => PAL.wood, 'rough');
  // little roof
  quad([x - .9, y + .7, 1.85], [1.8, 0, 0], [0, -.7, .5], roofShade('shingle', PAL.shingle, .9), false, [0, .5, .7]);
  quad([x - .9, y - .7, 1.85], [1.8, 0, 0], [0, .7, .5], roofShade('shingle', PAL.shingle, .9), false, [0, -.5, .7]);
  sphere(x + .1, y + .1, 1.2, .16, PAL.woodLight, 'solid');
  capsule([x + .1, y + .1, 1.3], [x + .1, y + .05, 1.62], .015, .015, () => [180, 170, 150], 'solid');
  castShadow(x, y, .4, .9); castShadow(x, y, 1.9, .9);
}
function barrel(x, y, s = 1, c = PAL.wood) {
  cylinder(x, y, 0, .8 * s, .32 * s, (a, t, o) => { o.c = c; o.dl = (Math.abs(t - .12 * s) < .05 || Math.abs(t - .66 * s) < .05) ? -1.2 : (hash(a * 9 | 0, 1) - .5) * .5 + Math.sin(t / s * 3.9) * .3; }, -Math.PI, Math.PI);
  disc(x, y, .8 * s, .3 * s, (a, b, o) => { o.c = PAL.woodLight; o.dl = -.3 + ((a + 5) % .12 < .02 ? -.6 : 0); });
  castShadow(x, y, .4 * s, .34 * s);
}
function crate(x, y, s = 1) {
  const f = (a, t, o) => { o.c = PAL.woodLight; o.dl = (a < .06 || t < .06 || a > .6 * s - .06 || t > .6 * s - .06 || Math.abs(a - t) < .05) ? -.9 : (hash(t * 12 | 0, 3) - .5) * .4; };
  boxS(x - .3 * s, y - .3 * s, 0, x + .3 * s, y + .3 * s, .6 * s, f, f, f);
  castBoxShadow(x - .3 * s, y - .3 * s, x + .3 * s, y + .3 * s, .6 * s);
}
function hayBale(x, y) {
  const f = (a, t, o) => { o.c = PAL.thatch; o.dl = (noise(a * 18, t * 3) - .5) * 1.2 + (Math.abs(a - .4) < .04 ? -1 : 0); };
  boxS(x - .55, y - .35, 0, x + .55, y + .35, .6, f, f, f);
  castBoxShadow(x - .55, y - .35, x + .55, y + .35, .6);
}
function pumpkin(x, y, s = 1) {
  for (let k = 0; k < 5; k++) sphere(x + Math.cos(k * 1.25) * .1 * s, y + Math.sin(k * 1.25) * .1 * s, .2 * s, .2 * s, [222, 120, 44], 'rough');
  capsule([x, y, .36 * s], [x + .03, y, .48 * s], .035, .03, () => [92, 110, 60], 'solid');
  castShadow(x, y, .15, .28 * s);
}
function bench(x, y, alongX = true) {
  const [w, d] = alongX ? [1.4, .4] : [.4, 1.4];
  box(x - w / 2, y - d / 2, .38, x + w / 2, y + d / 2, .46, PAL.wood, .6);
  for (const s of [-1, 1]) {
    const lx = alongX ? x + s * (w / 2 - .12) : x, ly = alongX ? y : y + s * (d / 2 - .12);
    box(lx - .06, ly - .06, 0, lx + .06, ly + .06, .38, PAL.woodDark, .4);
  }
  castBoxShadow(x - w / 2, y - d / 2, x + w / 2, y + d / 2, .46);
}
function fenceLine(pts, c = PAL.woodLight) {
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1], len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(len / 1.1));
    for (let j = 0; j <= n; j++) {
      const x = lerp(ax, bx, j / n), y = lerp(ay, by, j / n);
      box(x - .07, y - .07, 0, x + .07, y + .07, .78, PAL.woodDark, .5);
      castShadow(x, y, .4, .08);
    }
    for (const z of [.34, .64]) capsule([ax, ay, z], [bx, by, z], .045, .045, () => c, 'rough');
  }
}
function stall(scene, x, y, stripe, goods) {
  PICK = 0;
  for (const [dx, dy] of [[-.9, -.6], [.9, -.6], [-.9, .6], [.9, .6]]) box(x + dx - .06, y + dy - .06, 0, x + dx + .06, y + dy + .06, dy < 0 ? 2.1 : 1.75, PAL.woodDark, .5);
  box(x - 1, y - .7, .8, x + 1, y + .7, .9, PAL.wood, .6);
  boxS(x - 1, y + .55, 0, x + 1, y + .7, .8, null, plankShade(PAL.woodDark, 't', .2), null);
  // striped awning sloping toward the front
  quad([x - 1.15, y - .75, 2.15], [2.3, 0, 0], [0, 1.65, -.45], (s, t, o) => { o.c = Math.floor(s / .29) % 2 ? stripe : PAL.cream; o.flat = false; o.dl = .1; }, false, [0, .45, 1.65]);
  quad([x - 1.15, y + .9, 1.7], [2.3, 0, 0], [0, 0, -.22], (s, t, o) => { if (t < .12 && (s % .29) > .145 + t) return false; o.c = Math.floor(s / .29) % 2 ? stripe : PAL.cream; }, false, [0, 1, 0]);
  castBoxShadow(x - 1.15, y - .75, x + 1.15, y + .9, 2.1);
  goods.forEach((g, k) => sphere(x - .7 + (k % 5) * .35, y - .35 + Math.floor(k / 5) * .32, 1.0 + hash(k, 9) * .05, .14, g, 'rough'));
}
function noticeBoard(scene, x, y, notes) {
  PICK = 40;
  for (const s of [-1, 1]) box(x + s * .75 - .07, y - .07, 0, x + s * .75 + .07, y + .07, 2, PAL.woodDark, .5);
  quad([x - .8, y + .09, .85], [1.6, 0, 0], [0, 0, 1.0], plankShade(PAL.wood, 's', .25), false, [0, 1, 0]);
  quad([x - .95, y + .3, 1.95], [1.9, 0, 0], [0, -.42, .26], roofShade('shingle', PAL.shingle, .5), false, [0, .26, .42]);
  for (let k = 0; k < Math.min(notes, 6); k++) {
    const nx = x - .62 + (k % 3) * .44 + hash(k, 1) * .06, nz = 1.02 + Math.floor(k / 3) * .44 + hash(k, 2) * .05;
    quad([nx, y + .11, nz], [.3, 0, 0], [0, 0, .34], (s, t, o) => { o.c = PAL.cream; o.flat = true; o.dl = .3; if (t > .26 && Math.abs(s - .15) < .03) { o.c = PAL.red; } else if (t < .26 && t % .07 < .02 && s > .05 && s < .25) o.c = [140, 120, 100]; }, false, [0, 1, 0]);
  }
  castBoxShadow(x - .95, y - .2, x + .95, y + .2, 2);
  PICK = 0;
}
function bridge(scene, x, y, len, w, alongX) {
  // a gentle wooden arch with rails
  const n = Math.ceil(len / .3);
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n, z0 = Math.sin(t0 * Math.PI) * .55 + .12, z1 = Math.sin(t1 * Math.PI) * .55 + .12;
    const a = -len / 2 + t0 * len, b = -len / 2 + t1 * len;
    if (alongX) quad([x + a, y - w / 2, z0], [b - a, 0, z1 - z0], [0, w, 0], (s, t, o) => { o.c = PAL.wood; o.dl = (s > (b - a) - .04 ? -.8 : 0) + (hash(k, 2) - .5) * .6; }, false, [-(z1 - z0), 0, b - a]);
    else quad([x - w / 2, y + a, z0], [w, 0, 0], [0, b - a, z1 - z0], (s, t, o) => { o.c = PAL.wood; o.dl = (t > (b - a) - .04 ? -.8 : 0) + (hash(k, 2) - .5) * .6; }, false, [0, -(z1 - z0), b - a]);
  }
  for (const side of [-1, 1]) {
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, z = Math.sin(t * Math.PI) * .55 + .12, a = -len / 2 + t * len;
      const p = alongX ? [x + a, y + side * w / 2, z] : [x + side * w / 2, y + a, z];
      pts.push(p);
      capsule(p, [p[0], p[1], p[2] + .6], .05, .05, () => PAL.woodDark, 'solid');
    }
    for (let k = 0; k < 6; k++) capsule([pts[k][0], pts[k][1], pts[k][2] + .58], [pts[k + 1][0], pts[k + 1][1], pts[k + 1][2] + .58], .05, .05, () => PAL.wood, 'rough');
  }
}
function anvil(x, y) {
  box(x - .2, y - .2, 0, x + .2, y + .2, .35, PAL.woodDark, .4);
  box(x - .32, y - .14, .35, x + .32, y + .14, .52, PAL.iron, .3);
  capsule([x + .32, y, .46], [x + .52, y, .5], .07, .02, () => PAL.iron, 'solid');
  castShadow(x, y, .3, .35);
}
function forge(scene, x, y) {
  const sw = stoneWall(PAL.stoneDark, 7, .2, .3);
  boxS(x - .6, y - .5, 0, x + .6, y + .5, .8, solid(PAL.stoneDark), sw, sw);
  EMIT = 1;
  disc(x, y, .81, .38, (a, b, o) => { o.c = Math.hypot(a, b) < .2 ? [255, 220, 120] : [236, 110, 40]; o.flat = true; o.dl = hash(a * 20 | 0, b * 20 | 0) * .8; });
  EMIT = 0;
  boxS(x - .3, y - .5, .8, x + .3, y - .2, 2.6, solid(PAL.stoneDark), sw, sw);
  castBoxShadow(x - .6, y - .5, x + .6, y + .5, .8); castBoxShadow(x - .3, y - .5, x + .3, y - .2, 2.6);
  addLight(scene, x, y, .9, 3.4, 1, .35);
  scene.fires.push({ x, y, z: .85, kind: 'forge' });
}
function windmillBase(scene, x, y) {
  cylinder(x, y, 0, 3.6, 1.2, (a, t, o) => { o.c = PAL.plaster; o.dl = (noise(a * 3, t * 3) - .5) * .4 + .1; if (Math.abs(t - 1.8) < .08) { o.c = PAL.timber; o.flat = true; } }, -Math.PI, Math.PI);
  cone(x, y, 3.55, 5.1, 1.42, roofShade('thatch', PAL.thatch, 1.6));
  // door facing +x+y
  quad([x + .88, y + .62, .1], [-.24, .26, 0], [0, 0, 1.1], doorShade(.36, 1.1, PAL.door), false, [1, 1, 0]);
  castShadow(x, y, 1.5, 1.2); castShadow(x, y, 3, 1.2); castShadow(x, y, 4.2, .8);
}
// the sails turn, so they are drawn every frame into the viewport
function windmillSails(x, y, z, t) {
  const hub = [x + 1.05, y + 1.05, z];
  sphere(hub[0], hub[1], hub[2], .18, PAL.woodDark, 'solid');
  for (let k = 0; k < 4; k++) {
    const a = t * .7 + k * Math.PI / 2, dx = Math.cos(a), dz = Math.sin(a);
    // the sail plane faces +x+y, so its in-plane horizontal axis is (1,-1)/sqrt2
    const ax = dx / R2, ay = -dx / R2;
    const tip = [hub[0] + ax * 2.3, hub[1] + ay * 2.3, hub[2] + dz * 2.3];
    capsule(hub, tip, .05, .04, () => PAL.woodDark, 'solid');
    const px = -dz / R2, py = dz / R2, pz = dx; // perpendicular within the plane
    for (let s = .5; s <= 2.2; s += .1) {
      const p = [hub[0] + ax * s, hub[1] + ay * s, hub[2] + dz * s];
      capsule(p, [p[0] + px * .45, p[1] + py * .45, p[2] + pz * .45], .05, .05, () => (Math.round(s * 10) % 4 === 0 ? PAL.woodDark : PAL.cream), 'solid');
    }
  }
}

/* ---------- interiors ---------- */
// a cutaway room: plank floor, two back walls, a floor slab with visible thickness
function room(scene, { w, d, h = 3, floor = PAL.wood, wall = PAL.plaster, wainscot = PAL.woodDark, stone = false, windows = [] }) {
  const x0 = -w / 2, x1 = w / 2, y0 = -d / 2, y1 = d / 2;
  KIND = K_FLOOR;
  quad([x0, y0, 0], [w, 0, 0], [0, d, 0], plankShade(floor, 't', .36), false, [0, 0, 1]);
  KIND = 0;
  // slab edges (front faces)
  quad([x0, y1, -.5], [w, 0, 0], [0, 0, .5], stoneWall(PAL.stoneDark, 2, .25, .5), false, [0, 1, 0]);
  quad([x1, y0, -.5], [0, d, 0], [0, 0, .5], stoneWall(PAL.stoneDark, 3, .25, .5), false, [1, 0, 0]);
  const wallFn = stone ? stoneWall(PAL.stone, 5) : (s, t, o) => {
    if (t < .9) { o.c = wainscot; o.dl = (s % .3 < .04 ? -.7 : 0) + (t > .82 ? .6 : 0); return; }
    o.c = wall; o.dl = (noise(s * 3, t * 3) - .5) * .4 + (t < 1.0 ? -.4 : 0);
    if (s % 2.2 < .12) { o.c = PAL.timber; o.flat = true; o.dl = 0; }
  };
  // back walls face the camera: the x0 wall faces +x, the y0 wall faces +y
  quad([x0, y0, 0], [0, d, 0], [0, 0, h], wallFn, false, [1, 0, 0]);
  quad([x0, y0, 0], [w, 0, 0], [0, 0, h], wallFn, false, [0, 1, 0]);
  // wall tops
  box(x0 - .25, y0 - .25, h, x0, y1, h + .14, PAL.timber, .4);
  box(x0 - .25, y0 - .25, h, x1, y0, h + .14, PAL.timber, .4);
  for (const win of windows) {
    const ww = win.w || .9, hh = win.h || 1.1, z0 = win.z || 1.3;
    if (win.wall === 'x') quad([x0 + .02, lerp(y0, y1, win.at) - ww / 2, z0], [0, ww, 0], [0, 0, hh], windowShade(ww, hh, win.arch), false, [1, 0, 0]);
    else quad([lerp(x0, x1, win.at) - ww / 2, y0 + .02, z0], [ww, 0, 0], [0, 0, hh], windowShade(ww, hh, win.arch), false, [0, 1, 0]);
  }
  return { x0, y0, x1, y1 };
}
function counter(x0, y0, x1, y1, h = 1.05, c = PAL.wood) {
  boxS(x0, y0, 0, x1, y1, h, plankShade(PAL.woodLight, 's', .3), plankShade(c, 't', .18), plankShade(c, 't', .18));
}
function shelf(x0, y0, x1, y1, z0, z1, goods) {
  boxS(x0, y0, z0, x1, y1, z1, solid(PAL.woodDark), solid(PAL.woodDark), solid(PAL.woodDark));
}
function bookshelf(x, y, alongY = true, h = 2.4, w = 1.6) {
  const [x0, y0, x1, y1] = alongY ? [x, y - w / 2, x + .45, y + w / 2] : [x - w / 2, y, x + w / 2, y + .45];
  const front = (s, t, o) => {
    if (s < .08 || s > w - .08 || t < .1 || t > h - .1 || t % .55 < .07) { o.c = PAL.woodDark; o.flat = true; return; }
    const book = Math.floor(s / .09), row = Math.floor(t / .55);
    if ((t % .55) > .46 - hash(book, row) * .12) { o.c = [44, 30, 28]; return; }
    o.c = [[150, 60, 52], [70, 96, 130], [96, 120, 72], [200, 160, 90], [110, 70, 110]][hash(book, row * 7) * 5 | 0];
    o.dl = (s % .09 < .015 ? -.7 : 0);
  };
  if (alongY) boxS(x0, y0, 0, x1, y1, h, solid(PAL.woodDark), solid(PAL.woodDark), front);
  else boxS(x0, y0, 0, x1, y1, h, solid(PAL.woodDark), front, solid(PAL.woodDark));
}
function table(x, y, w = 1.2, d = .8, h = .78, c = PAL.wood) {
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(x + sx * (w / 2 - .1) - .05, y + sy * (d / 2 - .1) - .05, 0, x + sx * (w / 2 - .1) + .05, y + sy * (d / 2 - .1) + .05, h, PAL.woodDark, .4);
  boxS(x - w / 2, y - d / 2, h, x + w / 2, y + d / 2, h + .08, plankShade(c, 't', .2), solid(PAL.woodDark), solid(PAL.woodDark));
}
function stool(x, y) {
  cylinder(x, y, .0, .45, .06, solid(PAL.woodDark), -Math.PI, Math.PI);
  disc(x, y, .48, .2, (a, b, o) => { o.c = PAL.wood; });
}
function candle(scene, x, y, z) {
  capsule([x, y, z], [x, y, z + .14], .04, .04, () => PAL.cream, 'solid');
  scene.fires.push({ x, y, z: z + .2, kind: 'candle' });
  addLight(scene, x, y, z, 2.2, .7, .25);
}
function fireplace(scene, x, y, alongY = true) {
  const sw = stoneWall(PAL.stone, 11, .22, .36);
  if (alongY) {
    boxS(x, y - 1, 0, x + .55, y + 1, 1.5, solid(PAL.stoneDark), sw, sw);
    boxS(x, y - .7, 1.5, x + .4, y + .7, 3, null, sw, sw);
    quad([x + .56, y - .55, .05], [0, 1.1, 0], [0, 0, .95], (s, t, o) => { const r = Math.hypot(s - .55, Math.max(0, t - .45)); if (t > .45 && r > .55) return false; o.c = [30, 20, 18]; o.flat = true; }, false, [1, 0, 0]);
    scene.fires.push({ x: x + .7, y, z: .2, kind: 'hearth' });
    addLight(scene, x + .8, y, .4, 4.2, 1, .3);
    box(x + .58, y - .9, 1.5, x + .78, y + .9, 1.6, PAL.woodDark, .4);
  } else {
    boxS(x - 1, y, 0, x + 1, y + .55, 1.5, solid(PAL.stoneDark), sw, sw);
    boxS(x - .7, y, 1.5, x + .7, y + .4, 3, null, sw, sw);
    quad([x - .55, y + .56, .05], [1.1, 0, 0], [0, 0, .95], (s, t, o) => { const r = Math.hypot(s - .55, Math.max(0, t - .45)); if (t > .45 && r > .55) return false; o.c = [30, 20, 18]; o.flat = true; }, false, [0, 1, 0]);
    scene.fires.push({ x, y: y + .7, z: .2, kind: 'hearth' });
    addLight(scene, x, y + .8, .4, 4.2, 1, .3);
    box(x - .9, y + .58, 1.5, x + .9, y + .78, 1.6, PAL.woodDark, .4);
  }
}
function rug(x, y, w, d, c1, c2) {
  quad([x - w / 2, y - d / 2, .02], [w, 0, 0], [0, d, 0], (s, t, o) => {
    const e = Math.min(s, t, w - s, d - t);
    o.c = e < .12 ? c2 : (Math.floor(s / .3) + Math.floor(t / .3)) % 2 && e > .3 ? mixc(c1, c2, .35) : c1;
    o.flat = true; o.dl = .2;
  }, false, [0, 0, 1]);
}
function banner(x, y, z, c, emblem, alongY = true) {
  const w = .7, h = 1.3;
  const f = (s, t, o) => {
    if (t < .25 && Math.abs(s - w / 2) > t * 1.4) return false;
    o.c = c; o.flat = true; o.dl = .2;
    if (Math.abs(s - w / 2) < .14 && Math.abs(t - h * .6) < .14) o.c = emblem;
    if (t > h - .08) o.c = PAL.gold;
  };
  if (alongY) quad([x + .03, y - w / 2, z - h], [0, w, 0], [0, 0, h], f, false, [1, 0, 0]);
  else quad([x - w / 2, y + .03, z - h], [w, 0, 0], [0, 0, h], f, false, [0, 1, 0]);
}
function bed(x, y, quilt) {
  box(x - .55, y - 1, 0, x + .55, y + 1, .45, PAL.woodDark, .4);
  quad([x - .52, y - .95, .46], [1.04, 0, 0], [0, 1.9, 0], (s, t, o) => { o.c = t < .5 ? PAL.cream : (Math.floor(s / .26) + Math.floor(t / .26)) % 2 ? quilt : mixc(quilt, PAL.cream, .5); o.flat = true; o.dl = .2; }, false, [0, 0, 1]);
  boxS(x - .55, y - 1.1, 0, x + .55, y - .95, 1.05, solid(PAL.woodDark), solid(PAL.wood), solid(PAL.wood));
  sphere(x, y - .62, .55, .2, PAL.cream, 'solid');
}
function pigeonholes(x, y, h, letters) {
  // a wall of cubbies on the x0 wall, one letter per unread mail
  const w = 2.4;
  boxS(x, y - w / 2, .9, x + .4, y + w / 2, .9 + h, solid(PAL.woodDark), solid(PAL.woodDark), (s, t, o) => {
    const cw = w / 6, ch = h / 4, cx = Math.floor(s / cw), cy = Math.floor(t / ch), idx = (3 - cy) * 6 + cx;
    if (s % cw < .05 || t % ch < .05) { o.c = PAL.wood; o.flat = true; return; }
    const ls = s % cw, lt = t % ch;
    if (idx < letters && lt < ch * .62 && ls > .1 && ls < cw - .08) { o.c = idx % 5 === 0 ? [236, 214, 170] : PAL.cream; o.flat = true; o.dl = .3; if (Math.abs(ls - cw / 2) < .04 && lt > ch * .4) o.c = PAL.red; return; }
    o.c = [52, 36, 32]; o.flat = true;
  });
}
