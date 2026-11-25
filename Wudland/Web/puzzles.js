// Puzzles: the daily Scribe's Riddle (a word puzzle) and the daily Weaver's Pattern (a picture puzzle), the same for
// everyone on a given day, plus two harder kinds of errand for the villagers: weaving and the sliding mosaic.
// Daily puzzles live at the top of Today's Errands (the note button). Rewards and a puzzle streak are kept in ECON.daily.

/* ---------- the riddles (one a day, in a fixed shuffled order) ---------- */
const RIDDLES = [
  ['CANDLE', 'The longer I stand, the shorter I grow.'],
  ['SHADOW', 'I follow you all day, and vanish when the light goes out.'],
  ['ECHO', 'I answer every call in the peaks, but never speak first.'],
  ['KEY', 'I have teeth but never bite, and open what is shut tight.'],
  ['MAP', 'I hold the whole island, yet fold into your satchel.'],
  ['BREAD', 'Mags bakes me. I rise without legs.'],
  ['ANVIL', 'The smith strikes me all day and I never complain.'],
  ['BELL', 'I have a tongue but cannot taste. I call the village at noon.'],
  ['RIVER', 'I run but never walk, have a mouth but never talk.'],
  ['BREATH', 'Light as a feather, yet the strongest knight cannot hold me for long.'],
  ['COIN', 'I have a head and a tail, but no body.'],
  ['EGG', 'You must break me before you can use me.'],
  ['SECRET', 'Tell me, and I am gone.'],
  ['SILENCE', 'Say my name and you break me.'],
  ['MIRROR', 'I show your face, but have none of my own.'],
  ['CLOUD', 'I fly without wings and cry without eyes.'],
  ['FIRE', 'Feed me and I live. Give me a drink and I die.'],
  ['HOLE', 'The more you take from me, the bigger I grow.'],
  ['STEPS', 'The more you take, the more you leave behind. A certain tree drinks them.'],
  ['CHEST', 'I have a lid and a lock, and hold gold I never spend.'],
  ['HONEY', 'The bees make me and Hilda stirs me into tea.'],
  ['ACORN', 'A mighty oak is folded up inside me.'],
  ['OWL', 'I keep watch all night and ask only one question.'],
  ['SEED', 'Bury me, and I come back taller.'],
  ['MOON', 'Full, then hungry, then full again, every month.'],
  ['DREAM', 'You visit me every night, yet I live nowhere.'],
  ['RAVEN', 'The black-winged postman of Wudland.'],
  ['KETTLE', 'I have a spout and a lid, and I whistle for Hilda.'],
  ['LANTERN', 'My heart is fire, my body glass. I light your way home.'],
  ['BRIDGE', 'I carry you over the river without wetting your boots.'],
  ['WIND', 'You cannot see me, but I turn the mill.'],
  ['SNOW', 'I fall but never break, and turn the peaks white.'],
  ['RAINBOW', 'Seven colours after the rain, and gold at my end, they say.'],
  ['ICICLE', 'In winter I grow downward from the eaves.'],
  ['NEEDLE', 'I have one eye but cannot see.'],
  ['CLOCK', 'I have hands but cannot clap.'],
  ['BOOK', 'I have leaves but am no tree, and a spine but no bones.'],
  ['SHELL', 'The sea left me on the shore, and you can still hear it in me.'],
  ['NAIL', 'Struck on the head all day, I hold the village together.'],
  ['WELL', 'Drop a bucket and I give you a drink. The plaza had one, once.'],
  ['CROWN', 'Heavy is the head that wears me.'],
  ['GHOST', 'I walk the old tower but leave no footprints.'],
  ['SWORD', 'I sleep in a sheath and wake for a duel.'],
  ['APPLE', 'One a day keeps the healer away.'],
  ['PUMPKIN', 'Orange and round, I grow fat by the harvest moon.'],
  ['SCARF', 'Knitted by the fire, I wrap your neck in winter.'],
  ['CASTLE', 'Towers, walls and a moat: a home fit for a lord.'],
  ['FROG', 'I start as a tadpole and end on a lily pad, waiting for a kiss.'],
  ['THUNDER', 'I follow the lightning and rattle the shutters.'],
  ['PILLOW', 'Your head rests on me every night.'],
  ['TIME', 'Everyone spends me, and nobody can save me.'],
  ['NAME', 'It belongs to you, but others use it more than you do.'],
  ['GLOVE', 'Five fingers, and not a single bone.'],
  ['ARROW', 'Feathered but no bird, I fly from a bow.'],
  ['BARREL', 'Mags keeps the ale in my round belly.'],
  ['SPIDER', 'I weave in the rafters without a loom.'],
  ['QUILL', 'Dip me in ink and I write your letters.'],
  ['STARS', 'Lanterns nobody lit, hung over Wudland every night.'],
  ['LADDER', 'I help you up, one rung at a time, but never climb myself.'],
  ['SPONGE', 'I am full of holes, yet I hold water.'],
  ['FOOTPRINT', 'You leave me in the snow and never come back for me.'],
];

/* ---------- the patterns (8x8 pictures for the daily and hard weaving) ---------- */
const PATTERNS = {
  Crown: ['........', 'X..XX..X', 'XX.XX.XX', 'XXXXXXXX', 'XXXXXXXX', 'X.XXXX.X', 'XXXXXXXX', '........'],
  Toadstool: ['..XXXX..', '.XX..XX.', 'XXXXXXXX', 'X.XXXX.X', 'XXXXXXXX', '...XX...', '..XXXX..', '..XXXX..'],
  Heart: ['.XX..XX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...', '........'],
  Bell: ['...XX...', '..XXXX..', '..XXXX..', '.XXXXXX.', '.XXXXXX.', 'XXXXXXXX', '........', '...XX...'],
  Moon: ['...XXX..', '..XX....', '.XX.....', '.XX.....', '.XX.....', '.XX.....', '..XX....', '...XXX..'],
  Sword: ['.......X', '......XX', '.....XX.', 'X...XX..', '.X.XX...', '..XX....', '.XXX....', 'X..X....'],
  Potion: ['...XX...', '...XX...', '..XXXX..', '.X....X.', 'X.XXXX.X', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.'],
  'Oak Tree': ['...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', '.XXXXXX.', '...XX...', '...XX...', '..XXXX..'],
  Cottage: ['...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', '.X....X.', '.X.XX.X.', '.X.XX.X.', '.XXXXXX.'],
  Cat: ['X.....X.', 'XX...XX.', 'XXXXXXX.', 'X.XXX.X.', 'XXXXXXX.', '.XXXXX..', '..XXX..X', '.XXXXXX.'],
  Fish: ['........', '..XXX...', '.XXXXX.X', 'XX.XXXXX', 'XXXXXXXX', '.XXXXX.X', '..XXX...', '........'],
  Sailboat: ['...X....', '...XX...', '...XXX..', '...XXXX.', '...X....', 'XXXXXXXX', '.XXXXXX.', '..XXXX..'],
  Candle: ['...X....', '..XXX...', '...X....', '..XXX...', '..XXX...', '..XXX...', '..XXX...', '.XXXXX..'],
  Key: ['.XXX....', 'X...X...', 'X...X...', '.XXXXXXX', '.....X.X', '.....X.X', '........', '........'],
  Teacup: ['........', '.X.X.X..', '........', 'XXXXXXX.', 'XXXXXX.X', 'XXXXXX.X', '.XXXXXX.', 'XXXXXXXX'],
  Shield: ['XXXXXXXX', 'X..XX..X', 'X..XX..X', 'XXXXXXXX', 'X..XX..X', '.X.XX.X.', '..XXXX..', '...XX...'],
};

/* ---------- the day's state ---------- */
function daily() {
  const d = dayNo();
  ECON.daily = ECON.daily || { streak: 0, last: null, best: 0 };
  if (ECON.daily.day !== d) Object.assign(ECON.daily, { day: d, riddle: null, weave: null, hints: 0 });
  return ECON.daily;
}
function dailySolved(kind, crowns) {
  const s = daily(); s[kind] = 'done';
  const d = dayNo();
  if (s.last !== d) { s.streak = s.last === d - 1 ? s.streak + 1 : 1; s.last = d; s.best = Math.max(s.best || 0, s.streak); }
  ECON.crowns += crowns;
  BR({ type: 'sfx', name: 'coin' }); BR({ type: 'haptic', style: 'success' }); burst(G.player.x, G.player.y, 1.6, [236, 196, 90], 22);
  econChanged({ line: `${crowns} crowns · puzzle streak ${s.streak} day${s.streak === 1 ? '' : 's'}` });
}
// the same riddle and pattern for everyone on the same day; shuffled orders so neighbouring days feel unrelated
const todayRiddle = () => { const d = dayNo(), r = rngFrom(strHash('riddles')), order = RIDDLES.map((_, i) => i).sort(() => r() - .5); return RIDDLES[order[((d % RIDDLES.length) + RIDDLES.length) % RIDDLES.length]]; };
const todayPattern = () => { const names = Object.keys(PATTERNS), r = rngFrom(strHash('weave')), order = names.sort(() => r() - .5); return order[((dayNo() % order.length) + order.length) % order.length]; };

/* ---------- the Scribe's Riddle ---------- */
function game_riddle([answer, clue], done, opts = {}) {
  const { body, acts, sub } = openCard("The Scribe's Riddle", opts.sub || 'One riddle a day. Spell the answer from the tiles. Some letters are decoys.');
  body.append(el('p', 'riddle', `“${clue}”`));
  const r = rngFrom(strHash(answer + dayNo())), ABC = 'ABCDEFGHIKLMNOPRSTUWY';
  const decoys = []; while (decoys.length < (opts.decoys ?? 4)) { const c = ABC[r() * ABC.length | 0]; if (!answer.includes(c) || r() < .25) decoys.push(c); }
  const tiles = [...answer, ...decoys].map((c, i) => ({ c, i, used: false })).sort(() => r() - .5);
  const slots = el('div', 'slots'), pool = el('div', 'letters'); body.append(slots, pool);
  let typed = [], hints = 0, solved = false;
  const paint = () => {
    slots.textContent = '';
    for (let k = 0; k < answer.length; k++) {
      const t = typed[k], s = el('button', 'slot' + (t ? ' full' : '') + (t?.hint ? ' hint' : ''), t ? t.c : '');
      s.onclick = () => { if (!t || t.hint || solved) return; typed.splice(k); tiles.forEach(x => x.used = typed.includes(x)); BR({ type: 'sfx', name: 'tap' }); paint(); };
      slots.append(s);
    }
    pool.textContent = '';
    for (const t of tiles) {
      const b = el('button', 'letter', t.c); b.disabled = t.used || solved;
      b.onclick = () => { if (typed.length >= answer.length) return; t.used = true; typed.push(t); BR({ type: 'sfx', name: 'tap' }); paint(); check(); };
      pool.append(b);
    }
  };
  const check = () => {
    if (typed.length < answer.length) return;
    if (typed.map(t => t.c).join('') === answer) {
      solved = true; sub.textContent = 'The scribe smiles. Just so.'; paint(); slots.classList.add('win');
      setTimeout(() => { closeCard(); done(true, hints); }, 900);
    } else {
      sub.textContent = 'Not that. The scribe tuts and rubs it out.'; slots.classList.remove('shake'); void slots.offsetWidth; slots.classList.add('shake');
      BR({ type: 'haptic', style: 'warning' });
      setTimeout(() => { typed = typed.filter(t => t.hint); tiles.forEach(x => x.used = typed.includes(x)); paint(); }, 650);
    }
  };
  paint();
  act(acts, 'A hint', () => {
    if (solved) return;
    // the next right letter goes in for good, and costs a little of the reward
    typed = typed.filter((t, k) => t.c === answer[k] && k < typed.length && typed.slice(0, k + 1).every((u, j) => u.c === answer[j]));
    const k = typed.length; if (k >= answer.length) return;
    tiles.forEach(x => x.used = typed.includes(x));
    const t = tiles.find(x => !x.used && x.c === answer[k]); if (!t) return;
    t.used = true; t.hint = true; typed.push(t); hints++; sub.textContent = `A hint: letter ${k + 1} is ${t.c}.`; paint(); check();
  });
  act(acts, opts.quit || 'Later', () => { closeCard(); done(false, hints); });
}

/* ---------- the Weaver's Pattern (fill squares to match the counts on each row and column) ---------- */
function runsOf(line) { const out = []; let n = 0; for (const v of line) { if (v) n++; else if (n) { out.push(n); n = 0; } } if (n) out.push(n); return out.length ? out : [0]; }
function game_weave(name, rows, done, opts = {}) {
  const n = rows.length, m = rows[0].length, goal = rows.map(r => [...r].map(c => c !== '.'));
  const rowClues = goal.map(runsOf), colClues = Array.from({ length: m }, (_, j) => runsOf(goal.map(r => r[j])));
  const { body, acts, sub } = openCard(opts.title || "The Weaver's Pattern", opts.sub || 'The numbers are runs of filled squares, in order, along each row and column. Tap to fill, again to cross out.');
  const cells = Array.from({ length: n }, () => Array(m).fill(0));   // 0 empty, 1 filled, 2 crossed
  const g = el('div', 'weave'); g.style.gridTemplateColumns = `auto repeat(${m}, 1fr)`; body.append(g);
  g.append(el('i'));
  const colEls = colClues.map(c => { const e = el('div', 'clue col'); e.innerHTML = c.join('<br>'); g.append(e); return e; });
  const rowEls = [], btns = [];
  for (let i = 0; i < n; i++) {
    const e = el('div', 'clue row', rowClues[i].join(' ')); g.append(e); rowEls.push(e);
    btns.push(Array.from({ length: m }, (_, j) => {
      const b = el('button', 'wcell'); g.append(b);
      b.onclick = () => { if (solved) return; cells[i][j] = (cells[i][j] + 1) % 3; BR({ type: 'sfx', name: 'tap' }); paint(); check(); };
      return b;
    }));
  }
  let solved = false;
  const paint = () => {
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const b = btns[i][j]; b.classList.toggle('on', cells[i][j] === 1); b.classList.toggle('x', cells[i][j] === 2); }
    // a row or column whose runs already match goes quiet, so you can see what is left
    rowEls.forEach((e, i) => e.classList.toggle('ok', runsOf(cells[i].map(v => v === 1)).join() === rowClues[i].join()));
    colEls.forEach((e, j) => e.classList.toggle('ok', runsOf(cells.map(r => r[j] === 1)).join() === colClues[j].join()));
  };
  const check = () => {
    const ok = cells.every((r, i) => runsOf(r.map(v => v === 1)).join() === rowClues[i].join()) && colClues.every((c, j) => runsOf(cells.map(r => r[j] === 1)).join() === c.join());
    if (!ok) return;
    solved = true; sub.textContent = `Woven: ${name}!`; g.classList.add('win');
    for (const r of btns) for (const b of r) b.classList.remove('x');
    setTimeout(() => { closeCard(); done(true); }, 1100);
  };
  paint();
  act(acts, opts.quit || 'Later', () => { closeCard(); done(false); });
}
// a 5x5 pattern from an item's own icon, for the proper (middle) errands
function itemPattern(r) {
  const ids = Object.keys(ITEMS).filter(k => { const ic = ITEMS[k].icon; if (!ic || ic.length !== 5 || ic.some(x => x.length !== 5)) return false; const f = ic.join('').replace(/\./g, '').length; return f >= 9 && f <= 19; });
  const id = ids[r() * ids.length | 0]; return [ITEMS[id].name, ITEMS[id].icon];
}

/* ---------- the sliding mosaic ---------- */
function game_slide(n, done) {
  const { body, acts, sub } = openCard('The Sliding Mosaic', 'Slide the tiles back into order, 1 to the last, with the gap at the end.');
  const N = n * n, t = [...Array(N).keys()].map(i => (i + 1) % N);   // 0 is the gap
  let gap = N - 1;
  // shuffle by real moves so it is always solvable
  let prev = -1;
  for (let k = 0; k < n * n * 18; k++) {
    const opts = [gap - n, gap + n, gap % n ? gap - 1 : -1, (gap + 1) % n ? gap + 1 : -1].filter(j => j >= 0 && j < N && j !== prev);
    const j = opts[Math.random() * opts.length | 0]; t[gap] = t[j]; t[j] = 0; prev = gap; gap = j;
  }
  const g = el('div', 'board slide'); g.style.gridTemplateColumns = `repeat(${n}, 1fr)`; body.append(g);
  let moves = 0, solved = false;
  const btns = t.map((_, i) => { const b = el('button', 'lamp tilenum'); b.onclick = () => press(i); g.append(b); return b; });
  const paint = () => btns.forEach((b, i) => { b.textContent = t[i] || ''; b.classList.toggle('gap', !t[i]); b.classList.toggle('on', !!t[i] && t[i] === i + 1); });
  const press = i => {
    if (solved) return;
    const r = i / n | 0, c = i % n, gr = gap / n | 0, gc = gap % n;
    if (r !== gr && c !== gc) return;
    // a whole line slides along when you tap further down it
    const step = r === gr ? (c < gc ? -1 : 1) : (r < gr ? -n : n);
    while (gap !== i) { const j = gap + step; t[gap] = t[j]; t[j] = 0; gap = j; }
    moves++; BR({ type: 'sfx', name: 'tap' }); paint();
    if (t.every((v, k) => v === (k + 1) % N)) { solved = true; sub.textContent = `Set right in ${moves} moves!`; setTimeout(() => { closeCard(); done(true); }, 800); }
  };
  paint();
  act(acts, 'Give up', () => { closeCard(); done(false); });
}

/* ---------- the daily section of Today's Errands ---------- */
function dailySection(body) {
  const s = daily();
  const box = el('div', 'daily');
  box.append(el('b', '', 'Daily puzzles'), el('span', 'sub', s.streak && s.last >= dayNo() - 1 ? `Puzzle streak: ${s.streak} day${s.streak === 1 ? '' : 's'} · best ${s.best}` : 'New every morning, the same for everyone.'));
  const row = el('div', 'row');
  const rb = el('button', 'pb' + (s.riddle ? '' : ' gold'), s.riddle ? "Riddle ✓" : "The Scribe's Riddle");
  rb.onclick = () => {
    BR({ type: 'haptic', style: 'light' });
    if (s.riddle) return;
    game_riddle(todayRiddle(), (ok, hints) => { if (ok) dailySolved('riddle', Math.max(20, 80 - hints * 20)); });
  };
  const wb = el('button', 'pb' + (s.weave ? '' : ' gold'), s.weave ? 'Pattern ✓' : "The Weaver's Pattern");
  wb.onclick = () => {
    BR({ type: 'haptic', style: 'light' });
    if (s.weave) return;
    const name = todayPattern(); game_weave(name, PATTERNS[name], ok => { if (ok) dailySolved('weave', 120); });
  };
  row.append(rb, wb); box.append(row);
  body.append(box);
}
