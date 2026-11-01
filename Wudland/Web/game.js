'use strict';
// Wudland: the loop, the camera, walking, villagers, critters, weather and the bridge to the app.

const DEV = !(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.wud);
const BR = msg => { try { if (DEV) console.log('bridge', JSON.stringify(msg)); else window.webkit.messageHandlers.wud.postMessage(msg); } catch (e) { } };
const BOOT = window.WUD_BOOT || {};

const canvas = document.getElementById('c'), ctx = canvas.getContext('2d', { alpha: false });
const overlay = document.getElementById('ov');
const G = {
  data: BOOT.data || {}, scene: null, scenes: {}, sigs: {}, time: 0, zoom: 0, paused: false,
  cam: { x: 0, y: 0, follow: true, focusY: .5 }, talking: null, speaking: false, panel: 0,
  player: { x: 0, y: 0, yaw: Math.PI * .25, walk: 0, moving: 0, path: null, then: null, look: { ...PLAYER_LOOK, ...(BOOT.avatar || {}) } },
  actors: [], critters: [], iris: null, marker: null, label: null, wizBusy: false, hourOverride: BOOT.hour ?? null,
  weather: 'clear', flash: 0, stepAcc: 0, lastHaptic: 0,
};
let V = null, IMG = null, IMGPIX = null, K = 6, DPR = 1;

/* ---------- sizing ---------- */
function resize() {
  DPR = window.devicePixelRatio || 1;
  const wpx = innerWidth * DPR, hpx = innerHeight * DPR;
  const base = Math.round(wpx / 212);
  K = clamp(base + G.zoom, Math.max(2, base - 2), base + 3);
  const VW = Math.ceil(wpx / K) + 2, VH = Math.ceil(hpx / K) + 2;
  V = makeView(VW, VH, 14);
  canvas.width = VW; canvas.height = VH;
  canvas.style.width = VW * K / DPR + 'px'; canvas.style.height = VH * K / DPR + 'px';
  IMG = ctx.createImageData(VW, VH); IMGPIX = new Uint32Array(IMG.data.buffer);
  if (G.scene) { snapCamera(); try { render(); } catch (e) {} }
}
addEventListener('resize', resize);

/* ---------- scenes ---------- */
function sig(id, d) {
  if (id === 'post') return String(Math.min(24, d?.mail?.unread_count || 0));
  if (id === 'tavern') return (d?.whatsapp?.chats || []).slice(0, 6).map(c => c.id + c.waiting).join();
  if (id === 'home') return ECON.placed.filter(p => ECON.inv[p] > 0).sort().join();
  if (id === 'guild') return (d?.agents?.nodes || []).filter(n => !n.parent).slice(0, 9).map(n => n.id + n.busy + n.failed).join();
  return 'x';
}
function getInterior(id) {
  const s = sig(id, G.data);
  if (!G.scenes[id] || G.sigs[id] !== s) { G.scenes[id] = INTERIORS[id](G.data); G.sigs[id] = s; }
  return G.scenes[id];
}
function sceneProject(sc, x, y, z = 0) {
  const u = (x - y) / R2, v = (x + y) / R2, t = sc.t;
  return [t.OX + u * t.S, t.OY + (v * SIN - z * COS) * t.S];
}
function setScene(sc, px, py, yaw) {
  G.scene = sc;
  Object.assign(G.player, { x: px, y: py, yaw: yaw ?? G.player.yaw, path: null, then: null, moving: 0 });
  G.actors = sc.npcs.map(n => makeActor(n, sc));
  if (sc.id === 'village') G.actors.push(...villagers(sc));
  G.critters = critters(sc);
  dogArrive();
  G.marker = null; G.label = null;
  for (const p of parts) p.scene === sc.id || (p.life = 0);
  G.cam.follow = true;
  snapCamera();
  BR({ type: 'scene', id: sc.id, title: sc.title });
}
function makeActor(n, sc) {
  return { ...n, yaw: n.yaw ?? 0, walk: 0, moving: 0, path: null, wait: 1 + Math.random() * 3, home: { x: n.x, y: n.y }, homeYaw: n.yaw ?? 0, t0: Math.random() * 10 };
}

/* ---------- the village folk ---------- */
const ROUTES = {
  barnaby: [[2.4, 1.2], [-2.2, -2.6], [3.6, -1.6], [0.2, 3.4], [-1.4, 1.8]],
  bram: [[-4.2, 22.4], [-6.6, 18.4], [-3.4, 24.6], [-5.8, 23.4]],
  clank: [[-4.6, 14.6], [-1, 6.4], [2.6, -6.8], [6, -15.6], [0, -15.2], [-5.4, -15.4], [-2.4, -6.4]],
  wren: [[-6.6, 9.6], [-4.8, 5.2], [-1.6, 3], [1.2, 5.4], [-7.8, 4.6], [-2.4, 7.4]],
};
function villagers(sc) {
  const out = [];
  for (const id of Object.keys(ROUTES)) {
    const [x, y] = at(...ROUTES[id][0]);
    out.push(makeActor({ id, ...CAST[id], x, y, route: ROUTES[id].map(p => at(...p)), speed: id === 'wren' ? 2.6 : id === 'bram' ? 1.2 : 1.6 }, sc));
  }
  const st = sc.spots.stall;
  out.push(makeActor({ id: 'hilda', ...CAST.hilda, x: st.x, y: st.y - .2, yaw: Math.PI * .25, stand: true, talkAt: { x: st.x + 1.4, y: st.y + 1.4 } }, sc));
  // busy agents come out to the forge yard and hammer at the anvil (three at most)
  { const [x, y] = at(-1.9, -3.7); out.push(makeActor({ id: 'fennick', ...CAST.fennick, x, y, yaw: Math.PI * .3, stand: true, act: 'lute', outdoorStill: true }, sc)); }
  const busy = (G.data?.agents?.nodes || []).filter(n => n.busy && !n.parent).slice(0, 3);
  const an = sc.spots.anvil;
  busy.forEach((n, k) => {
    const a = [Math.PI * .75, Math.PI * 1.25, Math.PI * .25][k], x = an.x + Math.cos(a) * .95, y = an.y + Math.sin(a) * .95;
    out.push(makeActor({ id: 'agent:' + n.id, name: agentName(n), agent: n, look: agentLook(n, k + 3), x, y, yaw: Math.atan2(an.y - y, an.x - x), stand: true, act: 'hammer', outdoor: true }, sc));
  });
  return out;
}
function critters(sc) {
  const out = (sc.critters || []).map(c => ({ ...c }));
  if (sc.id === 'village') {
    const [hx, hy] = at(-9.2, 7.2);
    for (let k = 0; k < 3; k++) out.push({ kind: 'chicken', x: hx + .2 + k * .7, y: hy + 3.4 + (k % 2) * .5, yaw: k, t: k, hop: 0 });
    for (let k = 0; k < 3; k++) out.push({ kind: 'duck', x: 2 + k * 5.5, y: 0, yaw: 0, t: k * 3, along: k % 2 ? 1 : -1 });
  }
  if (sc.id === 'home') out.push({ kind: 'cat', x: -2.9, y: -.6, yaw: Math.PI * .25 });
  return out;
}

/* ---------- camera ---------- */
function focusPoint() {
  const sc = G.scene, p = G.player;
  if (G.talking) {
    const a = G.talking;
    return sceneProject(sc, (p.x + a.x) / 2, (p.y + a.y) / 2, 1);
  }
  return sceneProject(sc, p.x, p.y, 1);
}
function cameraTarget() {
  const [fx, fy] = focusPoint(), b = G.scene.bounds, sc = G.scene;
  const fy0 = G.talking ? clamp((1 - G.panel) * .48, .2, .5) : .52;
  let x = fx - V.W / 2, y = fy - V.H * fy0;
  // small scenes (rooms) sit centred in the space above the dialogue
  if (b.x1 - b.x0 <= V.W) x = (b.x0 + b.x1) / 2 - V.W / 2; else x = clamp(x, b.x0, b.x1 - V.W);
  if (b.y1 - b.y0 <= V.H * (G.talking ? 1 - G.panel : 1)) y = (b.y0 + b.y1) / 2 - V.H * (G.talking ? (1 - G.panel) / 2 : .5);
  else y = clamp(y, b.y0 - (G.talking ? V.H * G.panel * .5 : 0), b.y1 - V.H + (G.talking ? V.H * G.panel : 0));
  return [x, y];
}
function snapCamera() { const [x, y] = cameraTarget(); G.cam.x = x; G.cam.y = y; }
function stepCamera(dt) {
  if (!G.cam.follow) return;
  const [tx, ty] = cameraTarget(), k = 1 - Math.exp(-dt * (G.talking ? 5 : 6));
  G.cam.x += (tx - G.cam.x) * k; G.cam.y += (ty - G.cam.y) * k;
}

/* ---------- walking ---------- */
function walkTo(x, y, then, actor = G.player) {
  const path = findPath(G.scene.nav, actor.x, actor.y, x, y);
  if (!path) { if (then) then(); return false; }
  actor.path = path; actor.then = then || null;
  if (actor === G.player) { G.cam.follow = true; }
  return true;
}
function stepWalker(a, dt, speed) {
  if (!a.path || !a.path.length) {
    a.moving = Math.max(0, a.moving - dt * 6);
    if (a.path && !a.path.length) { a.path = null; const f = a.then; a.then = null; if (f) f(); }
    return;
  }
  const [tx, ty] = a.path[0], dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
  a.moving = Math.min(1, a.moving + dt * 6);
  const step = speed * dt;
  if (d <= step) { a.x = tx; a.y = ty; a.path.shift(); }
  else { a.x += dx / d * step; a.y += dy / d * step; }
  if (d > .01) a.yaw = turnToward(a.yaw, Math.atan2(dy, dx), dt * 12);
  const before = Math.floor(a.walk / Math.PI);
  a.walk += dt * speed * 3.3;
  if (a === G.player && Math.floor(a.walk / Math.PI) !== before) BR({ type: 'sfx', name: 'step' });
}
function turnToward(a, b, k) {
  let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * Math.min(1, k);
}

/* ---------- interactions ---------- */
function goEnter(id) {
  const door = G.scene.doors.find(d => d.id === id);
  if (!door || !INTERIORS[id]) return;
  showLabel(NAMES[id] || id, door.x, door.y, 2.6);
  walkTo(door.x, door.y, () => {
    BR({ type: 'sfx', name: 'door' });
    iris(() => {
      const sc = getInterior(id);
      setScene(sc, sc.spawn.x, sc.spawn.y, -Math.PI * .75);
    }, door);
  });
}
function leaveInterior() {
  if (!G.scene || G.scene.id === 'village') return;
  const id = G.scene.id;
  G.talking = null;
  BR({ type: 'sfx', name: 'door' });
  iris(() => {
    const v = G.scenes.village, d = v.doors.find(dd => dd.id === id);
    setScene(v, d.x, d.y, d.face === 'y' ? Math.PI / 2 : d.face === 'x' ? 0 : Math.PI / 4);
  });
}
function talkTo(a) {
  if (G.talking) return;
  const p = G.player;
  let tx, ty;
  if (a.talkAt) { tx = a.talkAt.x; ty = a.talkAt.y; }
  else { const d = Math.hypot(p.x - a.x, p.y - a.y) || 1; tx = a.x + (p.x - a.x) / d * 1.2; ty = a.y + (p.y - a.y) / d * 1.2; }
  a.hold = true; a.path = null; // villagers wait for you
  showLabel(a.name, a.x, a.y, a.sit ? 2.1 : 2.4);
  BR({ type: 'haptic', style: 'light' });
  walkTo(tx, ty, () => startTalk(a));
}
function startTalk(a) {
  const p = G.player;
  p.yaw = Math.atan2(a.y - p.y, a.x - p.x);
  if (!a.sit && !a.outdoor) a.yaw = Math.atan2(p.y - a.y, p.x - a.x);
  else if (!a.sit) a.faceYaw = Math.atan2(p.y - a.y, p.x - a.x);
  G.talking = a;
  G.label = null;
  BR({ type: 'talk', npc: a.id, name: a.name, scene: G.scene.id, agent: a.agent || null, chat: a.chat || null, trades: !!MERCHANTS[a.id] });
}
function endTalk() {
  if (G.talking) { G.talking.hold = false; G.talking.faceYaw = null; G.talking.wait = 2; }
  G.talking = null; G.speaking = false;
}
function showLabel(text, x, y, z) { G.label = { text, x, y, z, until: G.time + 2.6 }; }

function tap(cx, cy) {
  if (!G.scene || G.iris) return;
  const sx = (cx * DPR + G.fracX * K) / K + G.camI[0], sy = (cy * DPR + G.fracY * K) / K + G.camI[1];
  const sc = G.scene;
  if (G.talking) return; // the dialogue owns input until it closes
  // villagers first: a generous box around each figure
  let best = null, bd = 1e9;
  for (const a of G.actors) {
    const [hx, hy] = sceneProject(sc, a.x, a.y, a.sit ? .9 : 1.1), d = Math.hypot((sx - hx) * 1.2, sy - hy);
    if (d < 13 * sc.S / 14 && d < bd) { best = a; bd = d; }
  }
  if (best) return talkTo(best);
  if (tapWares(sx, sy)) return;
  for (const c of G.critters) {
    const [hx, hy] = sceneProject(sc, c.x, c.y, c.z || .3);
    if (Math.hypot(sx - hx, sy - hy) < 8) { critterPoke(c); return; }
  }
  const ix = sx | 0, iy = sy | 0;
  const pk = ix >= 0 && iy >= 0 && ix < sc.W && iy < sc.H ? sc.t.pick[iy * sc.W + ix] : 0;
  if (sc.id === 'village' && PICKS[pk]) {
    const id = PICKS[pk];
    if (id === 'board') {
      const b = sc.props.board;
      showLabel('Notice Board', b.x, b.y, 2.4);
      return walkTo(b.x + .3, b.y + 1.3, () => { G.player.yaw = -Math.PI / 2; BR({ type: 'inspect', what: 'board' }); });
    }
    BR({ type: 'haptic', style: 'light' });
    return goEnter(id);
  }
  if (pk === 90) return walkTo(sc.exit.x, sc.exit.y, leaveInterior);
  if (pk === 91) return walkTo(.2, -1.4, () => { G.player.yaw = -Math.PI / 2; BR({ type: 'inspect', what: 'scroll' }); });
  if (pk === 92) return walkTo(1.5, -2.0, () => { G.player.yaw = -Math.PI / 2; BR({ type: 'inspect', what: 'mirror' }); });
  // the ground
  const prev = T; T = sc.t; const g = unproject(sx, sy); T = prev;
  if (walkTo(g.x, g.y)) { G.marker = { x: g.x, y: g.y, t: G.time }; BR({ type: 'haptic', style: 'soft' }); }
}
function critterPoke(c) {
  BR({ type: 'sfx', name: c.kind === 'cat' || c.kind === 'cat2' ? 'meow' : c.kind === 'duck' ? 'quack' : c.kind === 'owl' ? 'hoot' : 'cluck' });
  c.hop = .4; c.flee = 1.2;
}

/* ---------- transitions ---------- */
function iris(mid, at) {
  G.iris = { t: 0, mid, done: false };
}
function stepIris(dt) {
  const ir = G.iris;
  if (!ir) return;
  ir.t += dt;
  if (!ir.done && ir.t >= .34) { ir.done = true; ir.mid(); }
  if (ir.t >= .7) G.iris = null;
}
function applyIris() {
  const ir = G.iris;
  if (!ir) return;
  const k = ir.t < .34 ? 1 - ir.t / .34 : (ir.t - .36) / .34; // 1 open .. 0 closed
  const [px, py] = sceneProject(G.scene, G.player.x, G.player.y, .9);
  const cx = px - G.camI[0], cy = py - G.camI[1], R = Math.max(0, ease(clamp(k, 0, 1))) * Math.hypot(V.W, V.H);
  const pix = V.pix, W = V.W, H = V.H, ink = rgb(20, 14, 18);
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
    const d = Math.hypot(ix - cx, (iy - cy) * 1.15) - R;
    if (d > 0 || d > -6 * bayerAt(ix, iy)) pix[iy * W + ix] = ink;
  }
}

/* ---------- sky & weather ---------- */
function sky(now) {
  const w = G.data?.weather || {};
  G.weather = BOOT.weather || w.kind || 'clear';
  const hour = G.hourOverride ?? (now.getHours() + now.getMinutes() / 60);
  const rise = w.sunrise ? localHour(w.sunrise) : 7.2, set = w.sunset ? localHour(w.sunset) : 17.8;
  // 0 = full day, 1 = full night, through a warm dusk
  let night;
  if (hour < rise - .6 || hour > set + .9) night = 1;
  else if (hour < rise + .4) night = clamp((rise + .4 - hour) / 1, 0, 1);
  else if (hour > set - .2) night = clamp((hour - set + .2) / 1.1, 0, 1);
  else night = 0;
  const golden = clamp(1 - Math.abs(hour - (set - .6)) / 1.2, 0, 1) * (1 - night);
  const gloom = { overcast: .1, rain: .16, drizzle: .12, storm: .26, fog: .12, cloudy: .05, snow: .04 }[G.weather] || 0;
  const day = [1 - gloom, 1 - gloom * .9, 1 - gloom * .5], dusk = [.74, .6, .78], dark = [.36, .4, .64];
  const mid = night < .5 ? mixc(day, dusk, night * 2) : mixc(dusk, dark, (night - .5) * 2);
  G.night = night;
  GRADE.amb = mixc(mid, [1.08, .97, .82], golden * .7);
  GRADE.night = night;
  const skyDay = gloom > .08 ? [[214, 216, 214], [230, 228, 220]] : [[236, 228, 210], [246, 238, 222]];
  const skyDusk = [[232, 176, 150], [176, 150, 176]], skyNight = [[14, 18, 40], [30, 34, 66]];
  const top = night < .5 ? mixc(skyDay[0], skyDusk[0], night * 2) : mixc(skyDusk[0], skyNight[0], (night - .5) * 2);
  const bot = night < .5 ? mixc(skyDay[1], skyDusk[1], night * 2) : mixc(skyDusk[1], skyNight[1], (night - .5) * 2);
  BACK.top = mixc(top, [250, 214, 160], golden * .5); BACK.bottom = mixc(bot, [244, 200, 170], golden * .5);
  BACK.stars = clamp((night - .55) * 2.2, 0, 1) * (gloom > .1 ? .3 : 1);
}
function localHour(iso) { const d = new Date(iso); return d.getHours() + d.getMinutes() / 60; }

const drops = [];
function stepWeather(dt) {
  const w = G.scene.id === 'village' ? G.weather : 'indoors';
  const want = w === 'storm' ? 220 : w === 'rain' ? 140 : w === 'drizzle' ? 60 : w === 'snow' ? 110 : 0;
  while (drops.length < want) drops.push({ x: Math.random() * V.W, y: Math.random() * V.H, s: .6 + Math.random() * .6 });
  if (drops.length > want) drops.length = want;
  const snow = w === 'snow';
  for (const d of drops) {
    if (snow) { d.y += dt * 14 * d.s; d.x += Math.sin(G.time * 1.3 + d.s * 9) * dt * 6; }
    else { d.y += dt * 210 * d.s; d.x -= dt * 40 * d.s; }
    if (d.y > V.H || d.x < 0) { d.y = -2; d.x = Math.random() * (V.W + 40); }
  }
  if (w === 'storm' && Math.random() < dt * .04 && !STILL) G.flash = .25;
  G.flash = Math.max(0, G.flash - dt);
}
function drawWeather() {
  if (!drops.length) return;
  const snow = G.weather === 'snow', pix = V.pix, W = V.W, H = V.H;
  const c = snow ? rgb(250, 250, 255) : rgb(...mixc([170, 190, 210], [120, 140, 170], G.night || 0));
  for (const d of drops) {
    const ix = d.x | 0, iy = d.y | 0;
    if (snow) { if (ix >= 0 && iy >= 0 && ix < W && iy < H) pix[iy * W + ix] = c; continue; }
    for (let k = 0; k < 3; k++) { const x = ix + k, y = iy - k * 2; if (x >= 0 && y >= 0 && x < W && y < H) pix[y * W + x] = c; }
    // splashes on whatever ground is under the drop
    if (Math.random() < .08) { const sx = Math.random() * W | 0, sy = Math.random() * H | 0, i = sy * W + sx; if (V.ground[i] && V.zb[i] === V.groundZ[i]) pix[i] = c; }
  }
  if (G.flash > 0) for (let i = 0; i < pix.length; i++) { const p = pix[i]; pix[i] = rgb((p & 255) * 1.5 + 30, (p >> 8 & 255) * 1.5 + 30, (p >> 16 & 255) * 1.6 + 40); }
}

/* ---------- ambient particles ---------- */
let smokeAcc = 0;
function stepAmbient(dt) {
  const sc = G.scene;
  smokeAcc += dt;
  if (smokeAcc < .08) return;
  const k = smokeAcc; smokeAcc = 0;
  const busy = G.data?.agents?.busy || 0, wind = .5;
  for (const s of sc.smokers) {
    let rate = s.key === 'guild' ? .6 + Math.min(busy, 6) * .9 : s.key === 'magic' ? (G.wizBusy ? 6 : 1.2) : 1.4;
    if (Math.random() < rate * k) {
      if (s.key === 'motes') { if (Math.random() < 4 * k) emit({ scene: sc.id, x: (Math.random() - .5) * 6, y: (Math.random() - .5) * 6, z: .3 + Math.random() * 2, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, vz: .12, life: 3, c: p => Math.sin(p.life * 4) > -.3 ? rgb(200, 180, 255) : rgb(120, 100, 180), glow: 1, over: true }); continue; }
      if (s.key === 'magic') emit({ scene: sc.id, x: s.x + (Math.random() - .5) * .3, y: s.y, z: s.z, vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6, vz: 1 + Math.random(), life: 1.6, c: Math.random() < .5 ? rgb(236, 210, 120) : rgb(196, 160, 255), glow: 1, over: true });
      else emit({ scene: sc.id, x: s.x, y: s.y, z: s.z, vx: wind * .5, vy: -wind * .3, vz: .7 + Math.random() * .3, life: 3.2, size: 2, c: smokeColor });
    }
  }
  for (const f of sc.fires) {
    if (f.kind === 'forge' && Math.random() < 2 * k) emit({ scene: sc.id, x: f.x + (Math.random() - .5) * .4, y: f.y + (Math.random() - .5) * .4, z: f.z, vx: 0, vy: 0, vz: 1.4, life: .6, c: rgb(255, 190, 90), glow: 1 });
    if (f.kind === 'hearth' && Math.random() < 3 * k) emit({ scene: sc.id, x: f.x + (Math.random() - .5) * .5, y: f.y + (Math.random() - .5) * .3, z: f.z + .2, vx: 0, vy: 0, vz: 1.2 + Math.random(), life: .5, c: rgb(255, 200, 100), glow: 1 });
    if (f.kind === 'cauldron' && Math.random() < 3 * k) emit({ scene: sc.id, x: f.x + (Math.random() - .5) * .6, y: f.y + (Math.random() - .5) * .6, z: f.z, vx: 0, vy: 0, vz: .6, life: .9, c: rgb(160, 240, 150), glow: 1, size: Math.random() < .3 ? 2 : 1 });
  }
  // fireflies at night outdoors
  if (sc.id === 'village' && G.night > .6 && Math.random() < 3 * k) {
    const t = sc.leaves[Math.random() * sc.leaves.length | 0];
    if (t) emit({ scene: sc.id, x: t.x + (Math.random() - .5) * 3, y: t.y + (Math.random() - .5) * 3, z: .5 + Math.random() * 1.5, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, vz: (Math.random() - .5) * .3, life: 4, c: p => Math.sin(p.life * 5) > 0 ? rgb(220, 255, 140) : rgb(120, 160, 80), glow: 1, over: true });
  }
  // falling leaves in autumn
  if (sc.id === 'village' && seasonOf() === 'autumn' && !STILL && Math.random() < 1.5 * k) {
    const t = sc.leaves[Math.random() * sc.leaves.length | 0];
    if (t) emit({ scene: sc.id, x: t.x, y: t.y, z: t.z, vx: .4, vy: -.2, vz: -.5, life: 5, c: t.pixels[3] || rgb(220, 140, 60), drag: .1 });
  }
}
function smokeColor(p) {
  const f = clamp(p.life / 3.2, 0, 1), n = G.night || 0;
  const base = mixc([226, 222, 216], [90, 92, 120], n), end = mixc(BACK.top, BACK.bottom, .5);
  const c = mixc(end, base, f);
  return rgb(c[0], c[1], c[2]);
}

/* ---------- critters ---------- */
function stepCritters(dt) {
  for (const c of G.critters) {
    c.t = (c.t || 0) + dt;
    c.hop = Math.max(0, (c.hop || 0) - dt);
    if (c.kind === 'chicken') {
      c.flee = Math.max(0, (c.flee || 0) - dt);
      if (c.flee > 0 || Math.random() < dt * .5) {
        const a = c.flee > 0 ? Math.atan2(c.y - G.player.y, c.x - G.player.x) + (Math.random() - .5) : Math.random() * 6.28;
        const nx = c.x + Math.cos(a) * .35, ny = c.y + Math.sin(a) * .35, [i, j] = navCell(G.scene.nav, nx, ny);
        if (navOk(G.scene.nav, i, j)) { c.x = nx; c.y = ny; c.yaw = a; c.hop = .15; }
      }
    } else if (c.kind === 'duck') {
      c.x += c.along * dt * .25;
      if (c.x > 30 || c.x < -14) c.along *= -1;
      c.y = RIVER_Y(c.x) + Math.sin(c.t * .4 + c.x) * .5;
      c.yaw = c.along > 0 ? 0 : Math.PI;
    }
  }
}
function drawCritter(c) {
  const C = col => () => col, add = dynamicAdd, t = c.t || 0, hop = Math.sin(clamp(c.hop || 0, 0, .4) / .4 * Math.PI) * .15;
  const fx = Math.cos(c.yaw || 0), fy = Math.sin(c.yaw || 0);
  if (c.kind === 'chicken') {
    const z = .25 + hop, peck = Math.sin(t * 3 + c.x) > .7 ? -.12 : 0;
    add([c.x, c.y, z], [c.x, c.y, z], .2, .2, C([246, 242, 232]));
    add([c.x - fx * .2, c.y - fy * .2, z + .08], [c.x - fx * .26, c.y - fy * .26, z + .16], .1, .06, C([236, 230, 216]));
    const h = [c.x + fx * .17, c.y + fy * .17, z + .2 + peck];
    add(h, h, .11, .11, C([246, 242, 232]));
    add([h[0], h[1], h[2] + .1], [h[0], h[1], h[2] + .1], .05, .05, C([220, 60, 50]));
    add([h[0] + fx * .1, h[1] + fy * .1, h[2]], [h[0] + fx * .16, h[1] + fy * .16, h[2] - .02], .035, .02, C([236, 170, 50]));
  } else if (c.kind === 'duck') {
    const z = .02 + Math.sin(t * 2) * .02;
    add([c.x, c.y, z + .1], [c.x - fx * .2, c.y - fy * .2, z + .12], .18, .14, C([140, 110, 80]));
    const h = [c.x + fx * .2, c.y + fy * .2, z + .32];
    add(h, h, .1, .1, C([60, 120, 80]));
    add([h[0] + fx * .1, h[1] + fy * .1, h[2] - .02], [h[0] + fx * .17, h[1] + fy * .17, h[2] - .03], .04, .03, C([236, 170, 50]));
  } else if (c.kind === 'cat' || c.kind === 'cat2') {
    const ginger = c.kind === 'cat' ? [222, 150, 80] : [70, 66, 72], z = .1;
    const sleep = c.kind === 'cat2' || !G.talking || G.talking.id !== 'biscuit';
    add([c.x - fx * .18, c.y - fy * .18, z + .12], [c.x + fx * .16, c.y + fy * .16, z + .14], .2, .19, C(ginger));
    const h = [c.x + fx * .3, c.y + fy * .3, z + (sleep ? .2 : .36)];
    add(h, h, .16, .16, C(ginger));
    for (const s of [-1, 1]) add([h[0] - fy * s * .09, h[1] + fx * s * .09, h[2] + .13], [h[0] - fy * s * .1, h[1] + fx * s * .1, h[2] + .2], .05, .02, C(ginger));
    const tail = Math.sin(t * 1.5) * .2;
    add([c.x - fx * .36, c.y - fy * .36, z + .12], [c.x - fx * .5 - fy * tail, c.y - fy * .5 + fx * tail, z + .38], .06, .05, C(ginger));
    if (!sleep) face(h, fx, fy, -fy, fx, .5, { blush: true }, { t, talk: G.speaking });
    else if (Math.floor(t / 1.6) % 2 === 0 && !STILL && Math.random() < .02) emit({ scene: G.scene.id, x: h[0], y: h[1], z: h[2] + .3, vx: .2, vy: -.1, vz: .5, life: 1.2, c: rgb(236, 230, 220), over: true });
  } else if (c.kind === 'raven') {
    const z = c.z + hop;
    add([c.x, c.y, z + .12], [c.x - .15, c.y, z + .18], .14, .1, C([40, 38, 50]));
    const h = [c.x + .1, c.y + .05, z + .3];
    add(h, h, .1, .1, C([40, 38, 50]));
    add([h[0] + .08, h[1] + .04, h[2]], [h[0] + .18, h[1] + .08, h[2] - .02], .04, .02, C([236, 196, 80]));
  } else if (c.kind === 'owl') {
    const z = c.z + hop;
    add([c.x, c.y, z + .18], [c.x, c.y, z + .3], .18, .16, C([140, 100, 70]));
    add([c.x, c.y, z + .46], [c.x, c.y, z + .46], .16, .16, C([160, 120, 84]));
    for (const s of [-1, 1]) { const e = project(c.x + .14 - s * .07, c.y + .14 + s * .07, z + .5); px(Math.round(e.sx) - G.camI[0] * 0, Math.round(e.sy), Math.floor(t / 3) % 5 ? rgb(255, 220, 80) : rgb(90, 64, 44)); }
  }
}

/* ---------- the loop ---------- */
let last = performance.now(), acc30 = 0;
G.fracX = 0; G.fracY = 0; G.camI = [0, 0];
function frame(now) {
  requestAnimationFrame(frame);
  if (G.paused || !G.scene) { last = now; return; }
  let dt = Math.min(.05, (now - last) / 1000);
  // idle scenes run at 30 fps to save battery; anything moving gets 60
  const moving = G.player.path || G.iris || Math.abs(G.cam.x - cameraTarget()[0]) > .3 || drag.active;
  acc30 += dt;
  if (!moving && acc30 < 1 / 31) return;
  dt = Math.min(.05, moving ? dt : acc30); acc30 = 0;
  last = now;
  update(dt);
  render();
}
function update(dt) {
  G.time += dt;
  const sc = G.scene, p = G.player;
  stepWalker(p, dt, (sc.id === 'village' ? 3.4 : 3) * speedBoost());
  for (const a of G.actors) {
    if (a.route && !a.hold) {
      if (!a.path) {
        a.wait -= dt;
        if (a.wait <= 0) { const r = a.route[Math.random() * a.route.length | 0]; walkTo(r[0], r[1], () => { a.wait = 2 + Math.random() * 5; }, a); if (!a.path) a.wait = 2; }
      }
      stepWalker(a, dt, a.speed || 1.6);
    } else if (a.hold && a.route) {
      a.moving = Math.max(0, a.moving - dt * 6);
      a.yaw = turnToward(a.yaw, Math.atan2(p.y - a.y, p.x - a.x), dt * 8);
    }
    if (a.faceYaw != null) a.yaw = turnToward(a.yaw, a.faceYaw, dt * 8);
    else if (a.stand && !a.hold && !a.route && !a.sit) a.yaw = turnToward(a.yaw, a.homeYaw, dt * 3);
  }
  stepCritters(dt);
  stepWares(dt);
  stepParticles(dt);
  stepAmbient(dt);
  stepWeather(dt);
  stepCamera(dt);
  stepIris(dt);
  GRADE.flick = STILL ? 1 : .93 + Math.sin(G.time * 7.3) * .03 + Math.sin(G.time * 13.1) * .025 + (Math.random() - .5) * .03;
  if (Math.floor(G.time) !== Math.floor(G.time - dt)) sky(new Date());
}
function render() {
  const sc = G.scene, camX = Math.floor(G.cam.x), camY = Math.floor(G.cam.y);
  G.camI = [camX, camY]; G.fracX = G.cam.x - camX; G.fracY = G.cam.y - camY;
  copyWindow(sc, V, camX, camY);
  T = V;
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  WIND = G.weather === 'storm' ? 2.2 : G.weather === 'rain' ? 1.4 : 1;
  water(windT);
  // the player, villagers, critters
  drawPlayer();
  for (const a of G.actors) drawActor(a);
  for (const c of G.critters) drawCritter(c);
  drawWares();
  if (sc.id === 'village') windmillSails(sc.props.mill.x, sc.props.mill.y, 3.1, STILL ? .3 : G.time);
  if (sc.id === 'village') drawLeaves(sc, V, windT);
  if (sc.tufts.length) drawTufts(sc, V, windT, TUFT.lit, TUFT.dark);
  G.hiddenN = playerHidden() ? Math.min(30, (G.hiddenN || 0) + 1) : Math.max(0, (G.hiddenN || 0) - 2);
  flushShadows();
  applyShadows(V.shadow);
  shadeEdges();
  flames();
  drawParticles(sc.id);
  if (G.night > .3 && sc.id === 'village') dynamicLight(V, G.player.x, G.player.y, 1, 3.6, .9);
  if (sc.id === 'tower') {
    const o = sc.orrery, a = G.time * .8;
    for (let k = 0; k < 3; k++) { const r = .3 + k * .14, an = a * (1 + k * .6) + k * 2; sphere(o.x + Math.cos(an) * r, o.y + Math.sin(an) * r, o.z + Math.sin(an) * .06, .05 + k * .015, [[180, 200, 255], [230, 120, 90], [140, 220, 160]][k], 'solid'); }
    const bk = sc.book, bob = Math.sin(G.time * 2) * .05;
    for (let k = 0; k < 3; k++) plotGlow(bk.x + (Math.random() - .5) * .5, bk.y + (Math.random() - .5) * .4, bk.z + .1 + bob + Math.random() * .3, rgb(236, 210, 130));
  }
  if (sc.id === 'tower') { const b = sc.ball, k = G.wizBusy ? .9 + Math.sin(G.time * 8) * .3 : .4; dynamicLight(V, b.x, b.y, b.z, G.wizBusy ? 5.5 : 3.5, k); }
  if (sc.backdrop === 'room') {
    // indoors stays warm: dimmer at night, but candles and fires always glow
    const amb = GRADE.amb, nt = GRADE.night;
    GRADE.amb = sc.dim || mixc([1, .98, .95], [.6, .55, .62], G.night * .85); GRADE.night = sc.dim ? 1 : .45 + G.night * .55;
    grade(V);
    GRADE.amb = amb; GRADE.night = nt;
  } else grade(V);
  drawMarker();
  drawIndicators();
  drawWeather();
  fillBackdrop(V, sc.backdrop, G.time);
  applyIris();
  IMGPIX.set(V.pix);
  ctx.putImageData(IMG, 0, 0);
  canvas.style.transform = `translate3d(${-G.fracX * K / DPR}px, ${-G.fracY * K / DPR}px, 0)`;
  drawLabel();
}
const TUFT = { lit: [], dark: [] };
function setTuftColors() {
  const gr = GRASS_BY[seasonOf()];
  TUFT.lit = [...gr, gr[3]].map(c => rgb(...c));
  TUFT.dark = [...gr, gr[3]].map(c => rgb(c[0] * .56, c[1] * .54, c[2] * .74));
}
function water(t) {
  const k = V.kinds, pix = V.pix, W = V.W, H = V.H, ox = V.sceneX, oy = V.sceneY, step = Math.floor(t * 3);
  const hi = rgb(176, 214, 220), lo = rgb(36, 74, 100);
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
    const i = iy * W + ix;
    if (k[i] !== K_WATER) continue;
    const h = hash(ix + ox - step * 2, (iy + oy) * 3);
    if (h > .985) pix[i] = hi; else if (h < .01) pix[i] = lo;
  }
}
function flames() {
  const sc = G.scene, t = G.time;
  for (const f of sc.fires) {
    const flick = STILL ? 0 : Math.floor(t * 10 + f.x * 3) % 3;
    if (f.kind === 'candle') { plotGlow(f.x, f.y, f.z, flick === 2 ? rgb(255, 250, 200) : rgb(255, 210, 110)); plotGlow(f.x, f.y, f.z + .07, rgb(255, 160, 70)); }
    else if (f.kind === 'hearth' || f.kind === 'forge') {
      for (let k = 0; k < 7; k++) {
        const a = k * 2.4 + t * 3, r = .15 + (k % 3) * .08;
        sphereGlow(f.x + Math.cos(a) * r * .5, f.y + Math.sin(a) * r * .5, f.z + .1 + (k % 4) * .1 + (flick * .03), .1 - (k % 4) * .015, k % 3 === 0 ? [255, 236, 160] : k % 3 === 1 ? [255, 160, 60] : [230, 90, 40]);
      }
    }
  }
}
function plotGlow(x, y, z, c) { const p = project(x, y, z), ix = p.sx | 0, iy = p.sy | 0; if (ix < 0 || iy < 0 || ix >= V.W || iy >= V.H) return; const i = iy * V.W + ix; if (p.d + .3 < V.zb[i]) return; V.pix[i] = c; V.emit[i] = 1; }
function sphereGlow(x, y, z, r, c) { const prevE = EMIT; EMIT = 1; sphere(x, y, z, Math.max(.04, r), c, 'glow'); EMIT = prevE; }

function drawPlayer() {
  const p = G.player;
  if (p.ghost && Math.floor(G.time * 24) % 3 === 0) return;   // see-through: drawn two frames in three
  const parts = person(p.x, p.y, p.yaw, { walk: p.walk, moving: p.moving, t: G.time, z: p.lift || 0 }, p.look);
  G.playerHead = parts.head;
  // a little lantern at night
  if (G.night > .3 && G.scene.id === 'village') {
    const h = parts.handL;
    capsule([h[0], h[1], h[2]], [h[0], h[1], h[2] - .12], .02, .02, () => PAL.iron, 'solid');
    sphereGlow(h[0], h[1], h[2] - .22, .09, [255, 214, 130]);
  }
}
function drawActor(a) {
  const sit = a.sit, act = a === G.talking ? (a.id === 'wizard' && G.wizBusy ? 'cast' : 'talk') : a.id === 'wizard' && G.wizBusy ? 'cast' : a.act || 'idle';
  if (a.look && !a.look.cat) {
    const pose = { walk: a.walk, moving: a.moving, t: G.time + a.t0, act: act === 'cast' ? 'wave' : act, talk: a === G.talking && G.speaking, z: 0 };
    if (sit && act !== 'talk') pose.act = act === 'write' ? 'write' : act === 'sleep' ? 'sleep' : 'sit';
    if (sit && act === 'talk') pose.act = 'sit';
    const parts = person(a.x, a.y, a.yaw, pose, a.look);
    if (a.id === 'wizard') wizardStaff(a, parts, act === 'cast');
    if (a.id === 'fennick' && act !== 'talk') drawLute(a, parts);
    if (act === 'hammer' && a.outdoor) {
      const hit = Math.sin((G.time + a.t0) * 7);
      const h = parts.handR;
      capsule(h, [h[0], h[1], h[2] + .35], .03, .03, () => PAL.woodDark, 'solid');
      sphere(h[0], h[1], h[2] + .38, .09, PAL.iron, 'solid');
      if (hit < -.95 && Math.random() < .5) for (let k = 0; k < 5; k++) emit({ scene: G.scene.id, x: G.scene.spots.anvil.x, y: G.scene.spots.anvil.y, z: .6, vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, vz: 1 + Math.random() * 2, g: 9, life: .35, c: rgb(255, 220, 120), glow: 1 });
    }
    if (pose.act === 'sleep' && Math.random() < .012) emit({ scene: G.scene.id, x: a.x, y: a.y, z: 1.6, vx: .25, vy: -.15, vz: .45, life: 1.6, c: rgb(236, 236, 255), over: true, size: 2 });
  }
}
// the badass part: a gnarled staff with a glowing head; while the wizard works he lifts it and runes orbit him
function wizardStaff(a, parts, casting) {
  const h = parts.handR, t = G.time;
  const base = [h[0], h[1], 0.02], top = [h[0] + (casting ? .05 : 0), h[1], h[2] + (casting ? 1.05 : .75)];
  capsule(casting ? [h[0], h[1], h[2] - .55] : base, top, .045, .035, () => [96, 64, 44], 'solid');
  const pulse = casting ? .14 + Math.sin(t * 9) * .03 : .1;
  sphereGlow(top[0], top[1], top[2] + .08, pulse, casting ? [200, 170, 255] : [170, 150, 230]);
  if (!casting) return;
  // orbiting runes and rising sparks
  for (let k = 0; k < 8; k++) {
    const ang = t * 2.2 + k * Math.PI / 4, r = 1.05 + Math.sin(t * 3 + k) * .08;
    const x = a.x + Math.cos(ang) * r, y = a.y + Math.sin(ang) * r, z = .9 + Math.sin(t * 2 + k * 1.3) * .35;
    plotGlow(x, y, z, k % 2 ? rgb(236, 210, 120) : rgb(196, 170, 255));
    plotGlow(x, y, z + .05, k % 2 ? rgb(255, 240, 180) : rgb(230, 220, 255));
  }
  if (Math.random() < .5) emit({ scene: G.scene.id, x: top[0] + (Math.random() - .5) * .3, y: top[1] + (Math.random() - .5) * .3, z: top[2], vx: (Math.random() - .5) * .8, vy: (Math.random() - .5) * .8, vz: .8 + Math.random(), life: .9, c: Math.random() < .5 ? rgb(236, 210, 120) : rgb(210, 190, 255), glow: 1, over: true });
}

/* ---------- pixel sprites: markers, indicators, labels ---------- */
const ICONS = {
  mail: ['XXXXXXX', 'XX...XX', 'X.X.X.X', 'X..X..X', 'XXXXXXX'],
  bang: ['..X..', '..X..', '..X..', '.....', '..X..'],
  gear: ['.X.X.', 'XXXXX', 'XX.XX', 'XXXXX', '.X.X.'],
  note: ['..XXX', '..X.X', '..X..', 'XXX..', 'XXX..'],
  star: ['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..'],
  bell: ['..X..', '.XXX.', '.XXX.', 'XXXXX', '..X..'],
  zz: ['XXX..', '..X..', '.X...', 'XXX..', '.....'],
  scroll: ['XXXXX', 'X...X', 'X.X.X', 'X...X', 'XXXXX'],
};
const DIGITS = ['XXX X X X X XXX', ' X XX  X  X XXX', 'XXX   XXXX  XXX', 'XXX  X XX  XXXX', 'X XX XXXX  X  X', 'XXXX  XXX  XXXX', 'XXXX  XXXX XXXX', 'XXX  X  X  X  X', 'XXXX XXXXX XXXX', 'XXXX XXXX  XXXX'];
const INK = rgb(44, 30, 30), PAPER = rgb(250, 242, 222), GOLDC = rgb(236, 190, 86), REDC = rgb(196, 64, 52);
function sprite(rows, x, y, c) {
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === 'X') px(x + i, y + j, c); });
}
function px(x, y, c) { if (x >= 0 && y >= 0 && x < V.W && y < V.H) V.pix[y * V.W + x] = c; }
function bubble(x, y, icon, count, accent) {
  // a parchment speech bubble with an ink outline, an icon and an optional number
  const digits = count != null ? String(Math.min(99, count)) : '', w = 9 + (digits ? digits.length * 4 + 1 : 0), h = 9;
  const bob = STILL ? 0 : Math.floor(G.time * 2.4) % 2;
  const x0 = Math.round(x - w / 2), y0 = Math.round(y - h - 3) - bob;
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    const edge = i === -1 || j === -1 || i === w || j === h, corner = (i === -1 || i === w) && (j === -1 || j === h);
    if (corner) continue;
    px(x0 + i, y0 + j, edge ? INK : PAPER);
  }
  for (let k = 0; k < 3; k++) { px(x0 + 3 + k, y0 + h + k, INK); if (k < 2) px(x0 + 4 + k, y0 + h + k, PAPER); }
  px(x0 + 4, y0 + h, PAPER); px(x0 + 5, y0 + h, PAPER);
  const ic = ICONS[icon];
  sprite(ic, x0 + 2 + (ic[0].length === 7 ? -1 : 0), y0 + 2, accent || INK);
  [...digits].forEach((d, k) => {
    const rows = DIGITS[+d];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (rows[j * 3 + i] === 'X') px(x0 + 9 + k * 4 + i, y0 + 2 + j, INK);
  });
}
// is something standing between the camera and the player? sample head, chest and knees against the depth buffer
function playerHidden() {
  const p = G.player, h = G.playerHead; if (!h) return false;
  let n = 0, hid = 0;
  for (const [x, y, z] of [h, [p.x, p.y, h[2] - .5], [p.x, p.y, .3]]) {
    const q = project(x, y, z), ix = q.sx | 0, iy = q.sy | 0;
    if (ix < 0 || iy < 0 || ix >= V.W || iy >= V.H) continue;
    n++; if (V.zb[iy * V.W + ix] > q.d + .5) hid++;
  }
  return n > 0 && hid >= 2;
}
const ARROW = ['...XXX...', '...XXX...', '...XXX...', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];
function drawPlayerArrow() {
  if ((G.hiddenN || 0) < 5 || G.iris) return;
  const h = G.playerHead, q = project(h[0], h[1], h[2] + .75);
  const bob = STILL ? 0 : Math.round(Math.sin(G.time * 5) * 1.5);
  const x0 = Math.round(q.sx) - 4, y0 = Math.round(q.sy) - 8 + bob;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1]]) sprite(ARROW, x0 + dx, y0 + dy, INK);
  sprite(ARROW, x0, y0, PAPER);
  for (let j = 3; j < 7; j++) px(x0 + 4, y0 + j, GOLDC);
}
function drawIndicators() {
  drawPlayerArrow();
  const sc = G.scene, d = G.data, cx = G.camI[0], cy = G.camI[1];
  const at3 = (x, y, z) => { const [a, b] = sceneProject(sc, x, y, z); return [a - cx, b - cy]; };
  if (sc.id === 'village') {
    const P = sc.props, un = d?.mail?.unread_count || 0, gossip = d?.whatsapp?.waiting || 0, busy = d?.agents?.busy || 0, today = (d?.calendar?.today || []).length;
    if (un) bubble(...at3(P.post.x, P.post.y, P.post.top + .6), 'mail', un, REDC);
    if (busy) bubble(...at3(P.guild.x, P.guild.y, P.guild.top + .6), 'gear', busy, rgb(110, 90, 70));
    if (gossip) bubble(...at3(P.tavern.x, P.tavern.y, P.tavern.top + .6), 'note', gossip, rgb(150, 66, 60));
    if (today) bubble(...at3(P.bell.x - 1.8, P.bell.y, P.bell.top + .3), 'bell', today, GOLDC);
    if (G.wizBusy) bubble(...at3(P.tower.x, P.tower.y, P.tower.top + .4), 'star', null, rgb(140, 100, 220));
    const unreadNotes = (d?.notices?.notes || []).filter(n => !n.read).length;
    if (unreadNotes) bubble(...at3(P.board.x, P.board.y, P.board.top + .4), 'scroll', unreadNotes, REDC);
  }
  for (const a of G.actors) {
    if (a === G.talking) continue;
    const [x, y] = at3(a.x, a.y, a.sit ? 1.7 : 2.05);
    if (a.id === 'pim' && d?.mail?.unread_count) bubble(x, y, 'mail', null, REDC);
    else if (a.id === 'mags' && d?.whatsapp?.waiting) bubble(x, y, 'note', null, REDC);
    else if (a.id === 'tobias' && (d?.calendar?.today || []).length) bubble(x, y, 'bell', null, GOLDC);
    else if (a.id === 'barnaby' && (d?.notices?.notes || []).some(n => !n.read)) bubble(x, y, 'bang', null, REDC);
    else if (a.waiting) bubble(x, y, 'bang', null, REDC);
    else if (a.agent?.busy && sc.id === 'guild') bubble(x, y, 'gear', null, rgb(110, 90, 70));
    else if (a.agent?.failed) bubble(x, y, 'bang', null, REDC);
  }
}
function drawMarker() {
  const m = G.marker;
  if (!m || !G.player.path) { G.marker = null; return; }
  const [sx, sy] = sceneProject(G.scene, m.x, m.y, 0), x = Math.round(sx - G.camI[0]), y = Math.round(sy - G.camI[1]);
  const r = 3 + (Math.floor((G.time - m.t) * 6) % 2);
  for (let a = 0; a < 6.283; a += .35) px(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * .5), PAPER);
  px(x, y, GOLDC);
}
let labelEl = null;
function drawLabel() {
  const l = G.label;
  if (!labelEl) { labelEl = document.createElement('div'); labelEl.className = 'tag'; overlay.appendChild(labelEl); }
  if (!l || G.time > l.until) { labelEl.style.opacity = 0; return; }
  const [sx, sy] = sceneProject(G.scene, l.x, l.y, l.z);
  const x = (sx - G.cam.x) * K / DPR, y = (sy - G.cam.y) * K / DPR;
  if (labelEl.textContent !== l.text) labelEl.textContent = l.text;
  labelEl.style.opacity = 1;
  labelEl.style.transform = `translate3d(${x}px, ${y - 20}px, 0) translate(-50%, -100%)`;
}

/* ---------- input ---------- */
const pts = new Map(), drag = { active: false, sx: 0, sy: 0, cx: 0, cy: 0, pinch: 0, z0: 0 };
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pts.size === 1) Object.assign(drag, { active: false, sx: e.clientX, sy: e.clientY, cx: G.cam.x, cy: G.cam.y, moved: false });
  if (pts.size === 2) { const [a, b] = [...pts.values()]; drag.pinch = Math.hypot(a.x - b.x, a.y - b.y); drag.z0 = G.zoom; drag.moved = true; }
});
canvas.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pts.size === 2) {
    const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), z = drag.z0 + Math.round(Math.log2(d / drag.pinch) * 2.2);
    if (z !== G.zoom && Math.abs(z) <= 3) { G.zoom = clamp(z, -2, 3); resize(); BR({ type: 'haptic', style: 'soft' }); }
    return;
  }
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!drag.active && Math.hypot(dx, dy) > 9 && !G.talking) { drag.active = true; drag.moved = true; G.cam.follow = false; }
  if (drag.active) {
    const b = G.scene.bounds;
    G.cam.x = clamp(drag.cx - dx * DPR / K, b.x0 - V.W * .3, b.x1 - V.W * .7);
    G.cam.y = clamp(drag.cy - dy * DPR / K, b.y0 - V.H * .3, b.y1 - V.H * .7);
  }
});
const up = e => {
  if (!pts.has(e.pointerId)) return;
  pts.delete(e.pointerId);
  if (pts.size === 0) {
    if (!drag.moved) tap(e.clientX, e.clientY);
    drag.active = false;
  }
};
canvas.addEventListener('pointerup', up);
canvas.addEventListener('pointercancel', e => { pts.delete(e.pointerId); drag.active = false; });
addEventListener('keydown', e => { if (e.key === 'Escape') { if (G.talking) { endTalk(); BR({ type: 'endTalk' }); } else leaveInterior(); } });

/* ---------- the bridge ---------- */
window.wud = {
  setData(d) {
    G.data = d || {};
    sky(new Date());
    // refresh live crowds without rebaking: forge-yard workers follow the busy agents
    if (G.scene?.id === 'village' && !G.talking) {
      const keep = G.actors.filter(a => !a.outdoor);
      const fresh = villagers(G.scene).filter(a => a.outdoor);
      G.actors = keep.concat(fresh);
    }
  },
  setAvatar(look) { G.baseLook = look; redress(); },
  setSpeaking(on) { G.speaking = !!on; },
  setPanel(frac) { G.panel = clamp(+frac || 0, 0, .8); },
  endTalk() { endTalk(); },
  leave() { endTalk(); leaveInterior(); },
  setPaused(p) { G.paused = !!p; },
  setWizard(busy) { G.wizBusy = !!busy; },
  setHour(h) { G.hourOverride = h == null ? null : +h; sky(new Date()); },
  setReduceMotion(on) { STILL = !!on; },
  goTo(id) { if (G.scene?.id !== 'village') return; if (INTERIORS[id]) goEnter(id); },
  zoom(step) { G.zoom = clamp(G.zoom + step, -2, 3); resize(); },
  ...WARES_API,
};

/* ---------- boot ---------- */
function boot() {
  resize();
  sky(new Date());
  setTuftColors();
  const t0 = performance.now();
  G.scenes.village = buildVillage(G.data);
  const home = G.scenes.village.doors.find(d => d.id === 'home');
  setScene(G.scenes.village, home.x + .4, home.y + .6, Math.PI * .25);
  BR({ type: 'ready', bakeMs: Math.round(performance.now() - t0) });
  WARES_API.catalog();
  document.title = 'OK';
  requestAnimationFrame(frame);
  // warm the interiors in idle time so doors open instantly
  const warm = ['post', 'tavern', 'guild', 'home', 'tower', 'bell', 'shop'];
  const next = () => { const id = warm.shift(); if (!id) return; if (!G.scenes[id]) getInterior(id); setTimeout(next, 120); };
  setTimeout(next, 900);
}
document.fonts ? document.fonts.ready.then(boot) : boot();
