'use strict';
// The six interiors. Each is a small cutaway room floating in warm dark, rebuilt when its data changes.

const SKIN = [[238, 198, 164], [220, 170, 132], [186, 132, 96], [142, 98, 72]];
const HAIR = [[64, 44, 34], [120, 74, 44], [196, 150, 84], [40, 34, 34], [170, 160, 150], [150, 70, 40]];

// who lives where; looks are palettes for person()
const CAST = {
  pim: { name: 'Pim the Postmaster', look: { skin: SKIN[0], hair: HAIR[4], shirt: [70, 96, 140], sleeve: [70, 96, 140], legs: [60, 60, 74], hat: 'cap', hatColor: [54, 74, 112], beard: [200, 196, 190], apron: [220, 210, 188], blush: true } },
  mags: { name: 'Mags the Barkeep', look: { skin: SKIN[1], hair: HAIR[5], shirt: [150, 66, 60], legs: [80, 60, 50], robe: true, hem: [120, 52, 48], apron: [236, 226, 204], hat: 'bun', blush: true } },
  gearwin: { name: 'Master Gearwin', look: { skin: SKIN[2], hair: HAIR[3], shirt: [96, 80, 66], legs: [64, 52, 44], apron: [130, 96, 64], beard: [40, 34, 34], hat: 'beret', hatColor: [150, 60, 50], belt: [60, 44, 34] } },
  tobias: { name: 'Brother Tobias', look: { skin: SKIN[0], hair: HAIR[2], shirt: [120, 96, 70], legs: [100, 80, 60], robe: true, hood: true, hat: 'hood', hatColor: [104, 82, 60], belt: [200, 180, 140], blush: true } },
  wizard: { name: 'Thistlewick the Wizard', look: { skin: SKIN[0], hair: HAIR[0], shirt: [92, 66, 140], legs: [70, 50, 110], robe: true, hem: [236, 196, 90], hat: 'wizard', hatColor: [80, 56, 128], hatBand: [236, 196, 90], beard: [220, 220, 228], shades: true } },
  biscuit: { name: 'Biscuit', cat: true },
  barnaby: { name: 'Barnaby the Crier', look: { skin: SKIN[1], hair: HAIR[1], shirt: [170, 60, 50], stripe: [236, 196, 90], legs: [60, 60, 80], hat: 'cap', hatColor: [40, 40, 60], cape: [60, 60, 100], blush: true } },
  bram: { name: 'Old Bram', look: { skin: SKIN[2], hair: HAIR[4], shirt: [140, 120, 80], legs: [90, 76, 60], hat: 'straw', hatColor: [226, 196, 120], hatBand: [160, 60, 50], beard: [210, 206, 200] } },
  clank: { name: 'Sir Clank', look: { skin: SKIN[0], hair: HAIR[2], shirt: [160, 164, 172], sleeve: [150, 154, 164], legs: [120, 124, 132], hat: 'helmet', plume: [196, 50, 50], cape: [60, 80, 140], shoes: [80, 84, 92] } },
  wren: { name: 'Wren', look: { skin: SKIN[1], hair: HAIR[5], shirt: [96, 150, 120], legs: [120, 90, 60], hat: 'kerchief', hatColor: [236, 196, 90], blush: true, scale: .8 } },
  odette: { name: 'Odette the Peddler', look: { skin: SKIN[2], hair: HAIR[3], shirt: [110, 60, 100], sleeve: [110, 60, 100], legs: [70, 50, 60], robe: true, hem: [236, 196, 90], apron: [226, 206, 170], hat: 'beret', hatColor: [60, 110, 100], blush: true } },
  fennick: { name: 'Fennick the Bard', look: { skin: SKIN[0], hair: HAIR[2], shirt: [200, 120, 50], stripe: [120, 60, 100], legs: [70, 60, 90], hat: 'cavalier', hatColor: [120, 60, 100], hatBand: [236, 196, 90], plume: [120, 200, 120], cape: [60, 110, 100], blush: true } },
  hilda: { name: 'Hilda the Herbalist', look: { skin: SKIN[3], hair: HAIR[3], shirt: [96, 120, 80], legs: [80, 70, 60], robe: true, hem: [70, 90, 60], hat: 'kerchief', hatColor: [150, 90, 160], blush: true } },
};
const PLAYER_LOOK = { skin: SKIN[0], hair: [74, 52, 40], shirt: [66, 112, 92], sleeve: [66, 112, 92], legs: [92, 74, 60], cape: [168, 60, 52], belt: [70, 50, 40], blush: true, hat: 'cavalier', hatColor: [48, 40, 52], hatBand: [236, 190, 86], plume: [213, 89, 80] };

// agents dress by what they are: claude in terracotta, codex in green, opencode in slate, the rest in earth tones
function agentLook(n, k) {
  const robe = { claude: [196, 104, 70], codex: [70, 130, 96], agy: [70, 104, 160], opencode: [120, 120, 130] }[n.source] || [120, 110, 100];
  return { skin: SKIN[(k * 7 + 1) % 4], hair: HAIR[(k * 5) % 6], shirt: robe, sleeve: robe, legs: [70, 60, 56], apron: [210, 196, 170],
    hat: n.source === 'claude' ? 'hood' : 'beret', hatColor: robe.map(c => c * .78), hatBand: [236, 196, 90], blush: true, shades: n.source === 'wizard' };
}
const HOST_BANNER = [[[160, 60, 52], [236, 196, 90]], [[60, 80, 140], [220, 220, 230]], [[70, 120, 70], [236, 196, 90]]];

function roomScene(id, w, d, title, S = 19, h = 3) {
  const span = (w + d) / R2 * S, W = Math.ceil(span + 60), wallPx = h * COS * S;
  const H = Math.ceil(span * SIN + wallPx + 90);
  const sc = new Scene(id, { S, W, H, OX: W / 2 + (d - w) / R2 / 2 * S * 0, OY: H / 2 + wallPx / 2, backdrop: 'room', title });
  sc.room = { w, d, h };
  sc.obst = [];
  return sc;
}
function finishRoom(sc, extraBlock) {
  finishBake(sc);
  const { w, d } = sc.room;
  sc.nav = makeNav(sc, (x, y) => {
    if (x < -w / 2 + .45 || x > w / 2 - .3 || y < -d / 2 + .45 || y > d / 2 - .3) return false;
    for (const o of sc.obst) if (o.r ? Math.hypot(x - o.cx, y - o.cy) < o.r + .2 : x > o.x0 - .2 && x < o.x1 + .2 && y > o.y0 - .2 && y < o.y1 + .2) return false;
    return !(extraBlock && extraBlock(x, y));
  });
  sc.bounds = { x0: 0, y0: 0, x1: sc.W, y1: sc.H };
  // the door mat at the front corner is the way out
  sc.exit = { x: w / 2 - .9, y: d / 2 - .9 };
  sc.spawn = { x: w / 2 - 1.4, y: d / 2 - 1.3 };
  return sc;
}
function doorMat(sc) {
  const { w, d } = sc.room;
  PICK = 90;
  rug(w / 2 - .9, d / 2 - .9, 1.1, .8, [150, 70, 56], [96, 50, 40]);
  PICK = 0;
}

/* ---------- the Raven Post ---------- */
function buildPost(data) {
  const sc = roomScene('post', 8, 6, 'The Raven Post');
  const unread = Math.min(24, data?.mail?.unread_count || 0);
  sc.with(() => {
    room(sc, { w: 8, d: 6, wall: PAL.plaster, windows: [{ wall: 'y', at: .72 }] });
    pigeonholes(-4, -.6, 1.8, unread);
    counter(-2.2, -2.2, -1.6, 1.6);
    counter(-2.2, 1.6, -.2, 2.2);
    box(-2.25, -2.25, 1.05, -1.55, 1.65, 1.1, PAL.woodDark, .4);
    // letters and a parcel on the counter, a candle, a little brass bell
    for (let k = 0; k < 5; k++) quad([-2.05 + hash(k, 1) * .1, -1.6 + k * .3, 1.11], [.32, 0, 0], [0, .22, 0], (s, t, o) => { o.c = k % 2 ? PAL.cream : [236, 214, 170]; o.flat = true; o.dl = .4; }, false, [0, 0, 1]);
    crate(-1.9, .9, .45);
    candle(sc, -1.9, -.2, 1.1);
    sphere(-1.85, 1.4, 1.2, .1, PAL.gold, 'gloss');
    // mail sacks and parcels
    for (const [x, y] of [[2.6, -2.3], [3.2, -2.0], [2.8, -1.4]]) { sphere(x, y, .38, .42, [176, 150, 110], 'rough'); sphere(x, y, .82, .14, [150, 120, 90], 'rough'); }
    crate(3.2, -.4, .7); crate(3.3, .45, .55);
    sc.obst.push({ x0: 2.1, y0: -2.8, x1: 3.8, y1: .8 });
    // the raven's perch
    capsule([-3.3, 2.4, 0], [-3.3, 2.4, 1.6], .05, .05, () => PAL.woodDark, 'solid');
    capsule([-3.6, 2.4, 1.6], [-3, 2.4, 1.6], .04, .04, () => PAL.woodDark, 'solid');
    sc.obst.push({ cx: -3.3, cy: 2.4, r: .3 });
    banner(-4, 1.8, 2.8, [70, 96, 140], PAL.cream);
    bookshelf(-.4, -3, false, 1.6, 1.6);
    doorMat(sc);
    sc.obst.push({ x0: -4, y0: -3, x1: -1.5, y1: 2.3 }, { x0: -1.3, y0: -3, x1: .5, y1: -2.5 });
  });
  sc.npcs.push({ id: 'pim', ...CAST.pim, x: -3, y: -.3, yaw: 0, stand: true, talkAt: { x: -.9, y: -.3 } });
  sc.critters = [{ kind: 'raven', x: -3.3, y: 2.4, z: 1.66 }];
  return finishRoom(sc);
}

/* ---------- the Gossiping Goose ---------- */
function buildTavern(data) {
  const sc = roomScene('tavern', 10, 7, 'The Gossiping Goose', 17);
  const chats = (data?.whatsapp?.chats || []).slice(0, 6);
  sc.with(() => {
    room(sc, { w: 10, d: 7, wall: PAL.plasterWarm, floor: [140, 96, 60], windows: [{ wall: 'y', at: .2 }, { wall: 'y', at: .5 }] });
    fireplace(sc, -5, .6, true);
    // the bar along the back wall, barrels behind it
    counter(.6, -2.4, 4.6, -1.8, 1.1, [120, 76, 48]);
    box(.55, -2.45, 1.1, 4.65, -1.75, 1.16, PAL.woodDark, .4);
    for (const x of [1.4, 2.4, 3.4]) { barrel(x, -3.1, .75, [130, 86, 54]); }
    for (let k = 0; k < 4; k++) capsule([1 + k * .9, -2.1, 1.16], [1 + k * .9, -2.1, 1.34], .08, .08, () => [220, 190, 120], 'solid');
    sc.obst.push({ x0: .4, y0: -3.5, x1: 4.8, y1: -1.7 });
    // tables for the gossip, each with a candle
    const spots = [[-2.6, -1.6], [-2.4, 1.6], [.6, .6], [2.8, 1.8], [-.4, 2.6], [3.4, -.2]];
    sc.tables = [];
    for (let k = 0; k < spots.length; k++) {
      const [x, y] = spots[k];
      const round = k % 2 === 0;
      if (round) { cylinder(x, y, 0, .74, .12, solid(PAL.woodDark), -Math.PI, Math.PI); disc(x, y, .76, .55, (a, b, o) => { o.c = PAL.wood; o.dl = (a + 9) % .2 < .03 ? -.6 : 0; }); }
      else table(x, y, 1, .8, .74);
      candle(sc, x + .1, y - .1, .78);
      capsule([x - .25, y + .15, .78], [x - .25, y + .15, .98], .08, .08, () => [220, 190, 120], 'solid');
      stool(x - .8, y + .1); stool(x + .1, y + .8);
      sc.obst.push({ cx: x, cy: y, r: .65 });
      sc.tables.push({ x, y });
    }
    banner(-5, -2, 2.8, [170, 120, 50], PAL.cream);
    banner(-1.2, -3.5, 2.8, [150, 66, 60], [236, 196, 90], false);
    rug(-2.2, .2, 2.4, 1.6, [150, 66, 60], [110, 50, 44]);
    doorMat(sc);
    sc.obst.push({ x0: -5, y0: -.6, x1: -4.3, y1: 1.8 });
  });
  sc.npcs.push({ id: 'mags', ...CAST.mags, x: 2.6, y: -2.7, yaw: Math.PI / 2, stand: true, talkAt: { x: 2.6, y: -1.0 } });
  // patrons: one per recent chat, seated at a table
  chats.forEach((c, k) => {
    const tb = sc.tables[k];
    sc.npcs.push({ id: 'chat:' + c.id, name: c.name, chat: c, look: patronLook(c, k), x: tb.x - .8, y: tb.y + .1, yaw: 0, stand: true, sit: true, talkAt: { x: tb.x - .4, y: tb.y + 1.1 }, waiting: c.waiting && Date.now() - Date.parse(c.last_at) < 3 * 864e5 });
  });
  sc.critters = [{ kind: 'cat2', x: -4.1, y: 1.6 }];
  return finishRoom(sc);
}
function patronLook(c, k) {
  const shirts = [[120, 80, 140], [80, 120, 150], [170, 120, 60], [96, 140, 96], [160, 80, 80], [110, 110, 120]];
  const hats = ['cap', 'kerchief', 'beret', null, 'straw', 'bun'];
  const h = (c.name || '').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return { skin: SKIN[h % 4], hair: HAIR[(h >> 2) % 6], shirt: shirts[(h + k) % 6], legs: [70, 60, 56], hat: c.group ? 'beret' : hats[h % 6], hatColor: shirts[(h + 3) % 6], blush: true };
}

/* ---------- the Artificers' Guild ---------- */
function buildGuild(data) {
  const sc = roomScene('guild', 10, 8, "Artificers' Guild", 16);
  const nodes = (data?.agents?.nodes || []).filter(n => !n.parent).slice(0, 9);
  sc.with(() => {
    room(sc, { w: 10, d: 8, stone: true, floor: [128, 110, 96], windows: [{ wall: 'x', at: .3, arch: true }, { wall: 'x', at: .7, arch: true }] });
    // a banner per machine on the back wall
    // up to three machines, each with its own banner and row of benches
    const hosts = [...new Set(nodes.map(n => n.host || 'home'))].slice(0, 3);
    if (!hosts.length) hosts.push('home');
    while (hosts.length < 3) hosts.push('_empty' + hosts.length);
    hosts.forEach((h, k) => banner(-3 + k * 3, -4, 2.9, HOST_BANNER[k][0], HOST_BANNER[k][1], false));
    sc.hostCols = hosts.map((h, k) => ({ host: h, x: -3 + k * 3 }));
    // the guildmaster's lectern by the door
    box(3.3, 2.0, 0, 3.9, 2.6, 1.0, PAL.woodDark, .5);
    quad([3.2, 1.9, 1.0], [.8, 0, .25], [0, .8, 0], (s, t, o) => { o.c = PAL.cream; o.flat = true; o.dl = .3; if (s % .2 < .03 && t > .1 && t < .7) o.c = [120, 100, 90]; }, false, [-.25, 0, .8]);
    sc.obst.push({ x0: 3.2, y0: 1.9, x1: 4, y1: 2.7 });
    bookshelf(-5, 2.2, true, 2.4, 1.8);
    sc.obst.push({ x0: -5, y0: 1.3, x1: -4.5, y1: 3.1 });
    // desks: three per machine, front to back
    sc.desks = [];
    const byHost = Object.fromEntries(hosts.map(h => [h, []]));
    for (const n of nodes) (byHost[n.host || 'home'] || byHost[hosts[0]]).push(n);
    hosts.forEach((h, k) => {
      for (let r = 0; r < 3; r++) {
        const x = -3 + k * 3 + .2, y = -2.2 + r * 2;
        table(x, y, 1.3, .8, .74, PAL.woodLight);
        const n = byHost[h][r];
        if (n) {
          candle(sc, x + .45, y - .2, .82);
          for (let j = 0; j < 3; j++) quad([x - .4 + j * .25, y - .2, .83], [.22, 0, 0], [0, .3, 0], (s, t, o) => { o.c = PAL.cream; o.flat = true; o.dl = .4; if (t % .07 < .02) o.c = [140, 120, 110]; }, false, [0, 0, 1]);
        }
        sc.obst.push({ x0: x - .7, y0: y - .45, x1: x + .7, y1: y + .45 });
        sc.desks.push({ host: h, x, y, node: n || null });
      }
    });
    doorMat(sc);
  });
  sc.npcs.push({ id: 'gearwin', ...CAST.gearwin, x: 3.6, y: 1.4, yaw: Math.PI * .75, stand: true, talkAt: { x: 3.0, y: 3.2 } });
  sc.desks.forEach((d, k) => {
    if (!d.node) return;
    const n = d.node;
    sc.npcs.push({ id: 'agent:' + n.id, name: agentName(n), agent: n, look: agentLook(n, k), x: d.x, y: d.y - .72, yaw: Math.PI / 2, stand: true, sit: true,
      act: n.busy ? 'write' : n.failed ? 'idle' : 'sleep', talkAt: { x: d.x + .2, y: d.y + .95 } });
    sc.with(() => stool(d.x, d.y - .72));
  });
  return finishRoom(sc);
}
// each agent's villager is named after the agent itself (its task title is what it talks about)
const AGENT_NAMES = { claude: 'Claude', codex: 'Codex', opencode: 'opencode', agy: 'Antigravity', bonsai: 'Bonsai', joebro: 'JoeBro', gemini: 'Gemini', cursor: 'Cursor', aider: 'Aider', cli: 'Terminal' };
function agentName(n) {
  const src = String(n.source || '').toLowerCase();
  const base = AGENT_NAMES[src] || (src ? src.charAt(0).toUpperCase() + src.slice(1) : 'Agent');
  return n.parent ? `${base}'s apprentice` : base;
}

/* ---------- the Bell Tower ---------- */
function buildBell(data) {
  const sc = roomScene('bell', 8, 6, 'The Bell Tower');
  sc.with(() => {
    room(sc, { w: 8, d: 6, stone: true, floor: [150, 140, 128], windows: [{ wall: 'x', at: .3, arch: true, h: 1.5 }, { wall: 'y', at: .6, arch: true, h: 1.5 }] });
    rug(.2, 0, 5.4, 1.4, [130, 50, 60], [200, 160, 90]);
    // the great book of days on a lectern
    box(-2.9, -.4, 0, -2.3, .4, 1.0, PAL.woodDark, .5);
    quad([-3.1, -.6, 1.0], [.9, 0, .2], [0, 1.2, 0], (s, t, o) => { o.c = Math.abs(t - .6) < .04 ? [120, 90, 60] : PAL.cream; o.flat = true; o.dl = .3; if (t % .1 < .02 && s > .15 && s < .75 && Math.abs(t - .6) > .08) o.c = [130, 110, 100]; }, false, [-.2, 0, .9]);
    candle(sc, -2.4, -.8, 0); candle(sc, -2.4, .8, 0);
    capsule([-2.4, -.8, 0], [-2.4, -.8, 1.1], .05, .05, () => PAL.gold, 'solid'); candle(sc, -2.4, -.8, 1.1);
    capsule([-2.4, .8, 0], [-2.4, .8, 1.1], .05, .05, () => PAL.gold, 'solid'); candle(sc, -2.4, .8, 1.1);
    // the bell rope dropping through the ceiling
    capsule([2.4, -2.3, .9], [2.4, -2.3, 3.4], .045, .045, () => [200, 170, 110], 'rough');
    sphere(2.4, -2.3, .85, .1, [180, 60, 60], 'solid');
    for (const y of [-2, 2]) { box(-1.2, y - .25, 0, 1.6, y + .25, .45, PAL.woodDark, .4); sc.obst.push({ x0: -1.3, y0: y - .35, x1: 1.7, y1: y + .35 }); }
    banner(-4, -1.6, 2.8, [130, 50, 60], PAL.gold);
    banner(-4, 1.6, 2.8, [130, 50, 60], PAL.gold);
    doorMat(sc);
    sc.obst.push({ x0: -3.2, y0: -1, x1: -2.2, y1: 1 });
  });
  sc.npcs.push({ id: 'tobias', ...CAST.tobias, x: -3.5, y: 0, yaw: 0, stand: true, talkAt: { x: -1.5, y: 0 } });
  return finishRoom(sc);
}

/* ---------- the Wizard's Tower ---------- */
// candle-dark and cluttered: lit by the crystal ball, the cauldron, a rune circle and a ring of candles
function buildTower(data) {
  const sc = roomScene('tower', 7.5, 7.5, "The Wizard's Tower", 18);
  sc.dim = [.42, .38, .56];
  sc.with(() => {
    room(sc, { w: 7.5, d: 7.5, stone: true, floor: [84, 72, 96], windows: [{ wall: 'x', at: .52, arch: true, h: 1.4 }] });
    // the rune circle: gold ring, violet glyphs that glow faintly in the dark
    quad([-2, -2, .02], [4, 0, 0], [0, 4, 0], (s, t, o) => {
      const r = Math.hypot(s - 2, t - 2); if (r > 1.9) return false;
      const ang = Math.atan2(t - 2, s - 2);
      o.flat = true; o.dl = .2;
      if (r > 1.75) { o.c = [236, 196, 90]; return; }
      if (r > 1.45 && r < 1.62 && Math.floor((ang + 4) * 5) % 3 === 0) { o.c = [190, 160, 255]; o.emit = 1; return; }
      if (Math.abs(r - 1.3) < .05) { o.c = [150, 120, 220]; o.emit = 1; return; }
      o.c = [52, 42, 86];
      if (hash(s * 12 | 0, t * 12 | 0) > .965) o.c = [236, 220, 160];
    }, false, [0, 0, 1]);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + .3; candle(sc, Math.cos(a) * 2.15, Math.sin(a) * 2.15, 0); }
    // shelves of books and potions along both back walls
    bookshelf(-3.75, -2.5, true, 2.6, 1.6);
    bookshelf(-3.75, 2.2, true, 2.2, 1.4);
    bookshelf(-1.8, -3.75, false, 2.6, 1.6);
    sc.obst.push({ x0: -3.75, y0: -3.3, x1: -3.2, y1: -1.6 }, { x0: -3.75, y0: 1.4, x1: -3.2, y1: 3 }, { x0: -2.7, y0: -3.75, x1: -.9, y1: -3.2 });
    box(.4, -3.75, 0, 2.2, -3.25, 1.9, PAL.woodDark, .4);
    for (const z of [.7, 1.3, 1.9]) box(.35, -3.75, z, 2.25, -3.2, z + .06, PAL.wood, .4);
    const potion = [[170, 60, 60], [80, 140, 210], [230, 190, 80], [120, 210, 140], [190, 120, 230], [240, 120, 170]];
    for (let k = 0; k < 9; k++) {
      const x = .65 + (k % 3) * .55, z = .76 + Math.floor(k / 3) * .6, glow = k % 4 === 1;
      if (glow) EMIT = 1;
      capsule([x, -3.45, z], [x, -3.45, z + .16 + hash(k, 3) * .1], .09, .06, () => potion[k % 6], glow ? 'glow' : 'gloss');
      EMIT = 0;
      if (glow) addLight(sc, x, -3.3, z, 1.6, .5, .2);
    }
    sc.obst.push({ x0: .3, y0: -3.75, x1: 2.3, y1: -3.1 });
    // hanging herbs from the beam
    for (let k = 0; k < 6; k++) {
      const x = -3.2 + k * .5, z = 2.9 - hash(k, 1) * .3;
      capsule([x, -3.6, 3], [x, -3.6, z], .015, .015, () => [140, 120, 90], 'solid');
      for (let j = 0; j < 4; j++) sphere(x + (hash(k, j) - .5) * .12, -3.55, z - .08 - j * .07, .07, k % 2 ? [96, 130, 70] : [150, 110, 70], 'rough');
    }
    // the crystal ball on a draped table, with a skull and a guttering candle
    table(-.6, -.8, 1.1, 1, .8, [90, 64, 100]);
    quad([-1.17, -.82, .2], [0, 1.04, 0], [0, 0, .66], (s, t, o) => { o.c = [110, 60, 120]; o.flat = true; o.dl = Math.sin(s * 9) * .4; }, false, [1, 0, 0]);
    EMIT = 1; sphere(-.6, -.8, 1.15, .3, [170, 140, 240], 'glow'); EMIT = 0;
    disc(-.6, -.8, .89, .18, (a, b, o) => { o.c = PAL.gold; });
    addLight(sc, -.6, -.8, 1.1, 4, .9, .2);
    sc.ball = { x: -.6, y: -.8, z: 1.15 };
    sphere(-.15, -1.1, .98, .14, [236, 226, 200], 'solid');
    candle(sc, -.95, -.35, .88);
    sc.obst.push({ x0: -1.25, y0: -1.4, x1: .05, y1: -.2 });
    // a lectern with the open spellbook floating above it
    box(2.35, .1, 0, 2.85, .6, 1.0, PAL.woodDark, .5);
    quad([2.2, -.05, 1.05], [.85, 0, .22], [0, .8, 0], (s, t, o) => { o.c = Math.abs(t - .4) < .03 ? [140, 100, 60] : [250, 236, 196]; o.flat = true; o.dl = .4; if (t % .1 < .02 && s > .1 && s < .75 && Math.abs(t - .4) > .07) o.c = [150, 120, 220]; }, false, [-.22, 0, .85]);
    addLight(sc, 2.6, .35, 1.2, 2.2, .6, .15);
    sc.book = { x: 2.6, y: .35, z: 1.3 };
    sc.obst.push({ x0: 2.2, y0: 0, x1: 3, y1: .7 });
    // a brass orrery on a little stand
    cylinder(-2.4, 1.5, 0, .7, .1, solid(PAL.woodDark), -Math.PI, Math.PI);
    sphere(-2.4, 1.5, 1.0, .16, PAL.gold, 'gloss');
    for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; plot(-2.4 + Math.cos(a) * .45, 1.5 + Math.sin(a) * .45, 1.0 + Math.sin(a) * .12, rgb(214, 170, 80)); }
    sc.orrery = { x: -2.4, y: 1.5, z: 1.0 };
    sc.obst.push({ cx: -2.4, cy: 1.5, r: .5 });
    // a telescope peering out of the window
    for (const [dx, dy] of [[-.2, -.15], [.2, -.15], [0, .2]]) capsule([-3.0 + dx, .3 + dy, 0], [-3.0, .3, 1.1], .03, .03, () => PAL.woodDark, 'solid');
    capsule([-2.7, .3, 1.05], [-3.5, .25, 1.55], .09, .06, () => [180, 140, 70], 'gloss');
    sc.obst.push({ cx: -3, cy: .3, r: .35 });
    // the cauldron
    sphere(2.1, -2.1, .45, .55, [50, 46, 52], 'gloss');
    EMIT = 1; disc(2.1, -2.1, .9, .42, (a, b, o) => { o.c = [120, 220, 120]; o.flat = true; o.dl = hash(a * 20 | 0, b * 20 | 0) * .8; }); EMIT = 0;
    addLight(sc, 2.1, -2.1, .9, 3, .7, .3);
    sc.fires.push({ x: 2.1, y: -2.1, z: .95, kind: 'cauldron' });
    sc.obst.push({ cx: 2.1, cy: -2.1, r: .75 });
    // books piled on the floor
    for (const [x, y, n] of [[2.9, 2.6, 4], [-3.1, -.9, 3], [1.5, 2.9, 2]]) {
      for (let k = 0; k < n; k++) box(x - .28 + hash(k, x) * .08, y - .2, k * .14, x + .28, y + .2, k * .14 + .13, potion[(k + n) % 6], .3);
      sc.obst.push({ cx: x, cy: y, r: .4 });
    }
    doorMat(sc);
  });
  sc.npcs.push({ id: 'wizard', ...CAST.wizard, x: -.6, y: -2, yaw: Math.PI / 2, stand: true, act: 'staff', talkAt: { x: .6, y: .6 } });
  sc.critters = [{ kind: 'owl', x: -3.5, y: -2.4, z: 2.68 }];
  sc.smokers.push({ x: 0, y: 0, z: .2, rate: 1, key: 'motes' });
  return finishRoom(sc);
}

/* ---------- the player's cottage ---------- */
function buildHome(data) {
  const sc = roomScene('home', 8, 6, cottageName());
  sc.with(() => {
    room(sc, { w: 8, d: 6, wall: PAL.plasterRose, floor: [168, 120, 76], windows: [{ wall: 'y', at: .35 }, { wall: 'x', at: .7 }] });
    fireplace(sc, -4, -.8, true);
    bed(2.6, -1.8, [96, 130, 170]);
    sc.obst.push({ x0: 1.9, y0: -3, x1: 3.3, y1: -.7 });
    if (ECON.placed.includes('f_rug') && ECON.inv.f_rug > 0) rug(-1.6, .2, 2.6, 2, [50, 70, 140], [236, 196, 90]);
    else rug(-1.6, .2, 2.6, 2, [170, 110, 80], [120, 70, 56]);
    // a writing desk with today's scroll on it
    table(-.2, -2.4, 1.4, .8, .8, PAL.woodLight);
    PICK = 91;
    quad([-.6, -2.6, .89], [.7, 0, 0], [0, .45, 0], (s, t, o) => { o.c = PAL.cream; o.flat = true; o.dl = .4; if (s % .7 < .06) o.c = [200, 160, 100]; else if (t % .08 < .02 && s > .1 && s < .6) o.c = [140, 120, 110]; }, false, [0, 0, 1]);
    PICK = 0;
    candle(sc, .3, -2.6, .88);
    sc.obst.push({ x0: -1, y0: -2.9, x1: .6, y1: -2 });
    // the mirror (dress up) on the back wall
    PICK = 92;
    quad([1.1, -2.97, .9], [.8, 0, 0], [0, 0, 1.5], (s, t, o) => { if (s < .08 || s > .72 || t < .08 || t > 1.42) { o.c = PAL.gold; o.flat = true; return; } o.c = [190, 206, 220]; o.flat = true; o.dl = (s + t * .5) % .6 < .12 ? 1.2 : .3; }, false, [0, 1, 0]);
    PICK = 0;
    bookshelf(-4, 1.6, true, 2.2, 1.6);
    sc.obst.push({ x0: -4, y0: .8, x1: -3.5, y1: 2.4 });
    for (const [x, y] of [[3.3, 1.9]]) { barrel(x, y, .7); sc.obst.push({ cx: x, cy: y, r: .4 }); }
    if (!(ECON.placed.includes('f_throne') && ECON.inv.f_throne > 0)) pumpkin(-3.1, 2.5, .8);
    placeFurniture(sc);
    doorMat(sc);
    sc.obst.push({ x0: -4, y0: -1.8, x1: -3.4, y1: .2 });
  });
  sc.npcs.push({ id: 'biscuit', ...CAST.biscuit, x: -2.9, y: -.6, yaw: Math.PI * .25, stand: true, talkAt: { x: -1.9, y: -.2 } });
  return finishRoom(sc);
}

const INTERIORS = { post: buildPost, tavern: buildTavern, guild: buildGuild, bell: buildBell, tower: buildTower, home: buildHome, shop: (d) => buildShop(d) };

// the cottage is named for whoever lives in it (set in Settings), else just "The Cottage"
function cottageName() {
  const n = ((window.WUD_BOOT || {}).lord || '').trim();
  return n ? `${n}'s Cottage` : 'The Cottage';
}
