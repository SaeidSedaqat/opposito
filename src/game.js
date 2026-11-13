// Opposito: the Phaser board renderer plus the OP.game controller that drives it.
(function () {
  'use strict';
  const OP = window.OP;
  const C = OP.config;
  const S = () => OP.save.d;
  const skin = () => OP.skins.get(S().skin);
  function curObj() { const d = S(); if (!d.cur) d.cur = {}; return d.cur; }

  // ---------- module state ----------
  let scene = null, curL = null;
  let mode = null, curSpec = null, pz = null, board = null, hist = [], elapsed = 0;
  let armed = null, adPaused = false;
  let dailyTimerId = null, dailyStart = 0;
  let prevGood = [];
  const fx = { bad: [], glowLines: [], broken: [], hint: null, evidence: [] };
  // Levels that introduce a rule open the matching How to Play section once, on a fresh start.
  const TUT_HELP = { 1: ['three', 'balance'], 11: ['links'], 31: ['twins'] };

  function isFull(b) { for (let i = 0; i < b.length; i++) if (b[i] < 0) return false; return true; }

  // ---------- generation (worker with main-thread fallback) ----------
  let worker = null, workerOk = false;
  try { worker = new Worker('src/puzzle.js?v=' + C.VERSION); workerOk = true; } catch (e) { worker = null; }
  const genCbs = {}; let genSeq = 0;
  if (worker) {
    worker.onmessage = (e) => { const d = e.data || {}; const cb = genCbs[d.id]; delete genCbs[d.id]; if (cb) cb(d.error ? null : d.puzzle); };
    worker.onerror = () => { workerOk = false; };
  }
  function genPuzzle(spec, cb) {
    if (workerOk) {
      const id = ++genSeq; genCbs[id] = cb;
      try { worker.postMessage({ id, opts: spec }); }
      catch (e) { workerOk = false; delete genCbs[id]; genPuzzle(spec, cb); }
    } else {
      setTimeout(() => { let p = null; try { p = OP.Puzzle.generate(spec); } catch (e2) { p = null; } cb(p); }, 0);
    }
  }
  const cache = {};
  function prefetch(spec) { if (cache[spec.seed]) return; genPuzzle(spec, (p) => { if (p) cache[spec.seed] = p; }); }
  function obtain(spec, cb) {
    if (cache[spec.seed]) { const p = cache[spec.seed]; delete cache[spec.seed]; cb(p); return; }
    OP.ui.setHud({ gen: true });
    genPuzzle(spec, (p) => { OP.ui.setHud({ gen: false }); cb(p); });
  }

  // ---------- layout ----------
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function computeLayout(w, h) {
    const compact = w >= h * 1.15 && h < 640;
    const bar = 68;
    let x, y, size;
    if (compact) {
      size = clamp(h - 24 - bar - 12, 160, Math.min(h - 40, w * 0.62));
      x = w - size - 20;
      y = Math.max(12, (h - size) / 2);
    } else {
      const top = 60, msgH = 40;
      size = clamp(Math.min(w - 32, h - top - msgH - bar - 24), 160, 620);
      x = (w - size) / 2;
      const blockH = size + 12 + bar;
      y = top + msgH + Math.max(12, (h - top - msgH - blockH) / 2);
    }
    return { W: w, H: h, x, y, size, compact, safe: { l: 16, t: 16, r: 16 } };
  }
  function layout(w, h) {
    curL = computeLayout(w, h);
    OP.ui.placeHud(curL);
    if (scene) scene.setLayout(curL);
  }

  // ---------- hint text ----------
  function stepText(step) {
    const sk = skin(); const nameOf = (v) => (v === 0 ? sk.an : sk.bn);
    const place = 'Place ' + nameOf(step.v) + ' here';
    switch (step.kind) {
      case 'link': return place + ' — linked tiles (joined by the dot) are always opposite.';
      case 'pair': return 'Two ' + nameOf(step.p) + ' in a row already. ' + place + ', or three would match.';
      case 'sand': return nameOf(step.p) + ' on both sides of the gap. ' + place + ' to fill it in.';
      case 'count': return 'This line already has enough ' + nameOf(step.p) + '. ' + place + ' to balance it out.';
      case 'twin': return 'Two rows or columns would end up identical. ' + place + ' so they stay different.';
      case 'line': return 'Look at the whole line, not just one pair. ' + place + ' — it’s the only piece that fits.';
      case 'trial': return 'Not obvious yet — ' + place.toLowerCase() + ' and see what it unlocks.';
      default: return place + '.';
    }
  }
  // Which cells show the evidence behind a step, highlighted so the reasoning is visible.
  function evidenceFor(step) {
    if (step.from && step.from.length) return step.from.slice();
    if (step.line != null) {
      const P = OP.Puzzle.ctx(pz.n, pz.links, pz.unique);
      if (step.kind === 'count') return P.lc[step.line].filter((ci) => board[ci] === step.p);
      return P.lc[step.line].filter((ci) => ci !== step.i);
    }
    return [];
  }

  // ---------- save / resume ----------
  function saveCur() {
    if (!mode || !pz) return;
    curObj()[mode] = { spec: curSpec, pz, board: Array.from(board), hist: hist.slice(-300), elapsed };
    OP.save.soon();
  }

  // ---------- spec builders ----------
  function buildSpec(which) {
    if (which === 'levels') { const L = S().level; const s = C.levelSpec(L); s.level = L; return s; }
    if (which === 'free') { const f = S().free; const count = f.count || 0; return { n: f.n, diff: f.diff, links: f.links, unique: f.twin, seed: 'free-' + count }; }
    const t = C.today(); const s = C.dailySpec(t); s.key = t.key; return s;
  }

  // ---------- flow ----------
  function start(which) {
    mode = which;
    const spec = buildSpec(which);
    OP.ui.show('game');
    const needAd = (which === 'levels' && spec.level >= 4) || which === 'free';
    if (needAd) OP.ui.adBreak(() => begin(which, spec));
    else begin(which, spec);
  }

  function begin(which, spec) {
    curSpec = spec; armed = null; prevGood = [];
    fx.bad = []; fx.glowLines = []; fx.broken = []; fx.hint = null; fx.evidence = [];
    const saved = curObj()[which];
    if (saved && saved.spec && saved.spec.seed === spec.seed) {
      pz = saved.pz; board = saved.board.slice(); hist = saved.hist || []; elapsed = saved.elapsed || 0;
      afterLoad(which, spec);
      return;
    }
    obtain(spec, (p) => {
      pz = p; board = Array.from(pz.givens); hist = []; elapsed = 0;
      afterLoad(which, spec);
      if (TUT_HELP[spec.tut]) OP.ui.openHelp(TUT_HELP[spec.tut]);
    });
  }

  function afterLoad(which, spec) {
    const labels = {
      levels: ['Level ' + spec.level, C.DIFFS[spec.diff - 1] + ' · ' + spec.n + '×' + spec.n],
      free: ['Free Play', C.DIFFS[spec.diff - 1] + ' · ' + spec.n + '×' + spec.n],
      daily: ['Daily', C.dateLabel(C.today())],
    }[which];
    OP.ui.setHud({ l1: labels[0], l2: labels[1], timer: which === 'daily', bar: true, gen: false });
    if (which === 'daily') { OP.ui.setTimer(elapsed); startDailyTimer(); } else stopDailyTimer();

    prevGood = OP.Puzzle.goodLines(pz, board);
    if (scene) { if (curL) scene.setLayout(curL); else scene.redraw(); }
    updateBoosterUI();
    saveCur();

    if (spec.tut === 3) OP.ui.msg('Frozen tiles (shaded) can’t change. Fill in the rest!', { ms: 3400 });
    else OP.ui.msg('');

    if (which === 'levels') prefetch(C.levelSpec(spec.level + 1));

    // Safety net: if a reload lands us back on a board that was already fully (and correctly)
    // filled in — e.g. the page closed during the win delay below — finish the win now.
    if (isFull(board)) checkWinOrBroken();
  }

  // ---------- rendering helpers ----------
  let badTimer = null;
  function afterPlace() {
    fx.broken = [];
    const newGood = OP.Puzzle.goodLines(pz, board);
    const added = newGood.filter((L) => prevGood.indexOf(L) < 0);
    prevGood = newGood;
    if (added.length) {
      fx.glowLines = added; OP.audio.play('line');
      setTimeout(() => { fx.glowLines = []; if (scene) scene.applyFx(); }, 650);
    }
    // Clear any stale red mark right away, but don't flag a fresh one instantly — give the
    // player a beat to fix it themselves before auto-highlight calls it out.
    fx.bad = [];
    if (scene) scene.updatePieces(); // just the pieces moved/changed, not the board frame or links
    clearTimeout(badTimer);
    if (S().settings.auto) {
      badTimer = setTimeout(() => {
        fx.bad = Array.from(OP.Puzzle.violations(pz, board).cells);
        if (scene) scene.applyFx();
      }, 500);
    }
  }
  function flashBad(cells, ms) {
    fx.bad = cells; if (scene) scene.applyFx();
    setTimeout(() => { fx.bad = S().settings.auto ? Array.from(OP.Puzzle.violations(pz, board).cells) : []; if (scene) scene.applyFx(); }, ms || 1400);
  }
  function flashHint(i) {
    fx.hint = i; if (scene) scene.applyFx();
    setTimeout(() => { fx.hint = null; if (scene) scene.applyFx(); }, 1400);
  }

  function checkWinOrBroken() {
    if (!isFull(board)) return;
    const v = OP.Puzzle.violations(pz, board);
    if (v.cells.size === 0) {
      if (mode === 'daily') stopDailyTimer(); // freeze the clock at the exact solve moment
      OP.audio.play('win');
      if (scene) scene.winRipple();
      setTimeout(win, 2000); // let the player enjoy the finished board before the modal covers it
    }
    else {
      fx.broken = Array.from(v.cells);
      if (scene) { scene.applyFx(); scene.shakeBoard(); }
      OP.ui.msg('Not quite right yet', { tone: 'bad', ms: 1600 });
    }
  }
  function win() { if (mode === 'levels') winLevel(); else if (mode === 'free') winFree(); else if (mode === 'daily') winDaily(); }

  function winLevel() {
    const spec = curSpec, diff = spec.diff;
    const coins = spec.tut ? C.tutorialCoins : C.coins[diff];
    let bonus = null;
    if (Math.random() < C.drop[diff]) {
      const pool = spec.n >= 8 ? ['hint', 'check', 'reveal'] : ['hint', 'check'];
      bonus = pool[Math.floor(Math.random() * pool.length)];
      S().boosters[bonus] = (S().boosters[bonus] || 0) + 1;
    }
    S().coins += coins;
    S().level = spec.level + 1;
    curObj().levels = null;
    OP.save.persist();
    prefetch(C.levelSpec(S().level));
    OP.ui.openWin({ mode: 'levels', coins, bonus, next: () => start('levels'), home: () => OP.ui.show('home') });
  }
  function winFree() {
    S().free.count = (S().free.count || 0) + 1;
    curObj().free = null;
    OP.save.persist();
    OP.ui.openWin({ mode: 'free', label: 'Nice work!', next: () => start('free'), home: () => OP.ui.show('home') });
  }
  function winDaily() {
    const d = S().daily, t = C.today(), y = C.dayKeyOffset(t.key, -1);
    d.streak = d.last === y ? d.streak + 1 : 1;
    d.last = t.key;
    d.solved = { date: t.key, time: Math.round(elapsed) };
    d.dates.push(t.key);
    curObj().daily = null;
    OP.save.persist();
    OP.ui.openWin({ mode: 'daily', time: d.solved.time, streak: d.streak, home: () => OP.ui.show('home') });
  }

  // ---------- placement / tap ----------
  function pushHist(i, before, after) { hist.push({ i, before, after }); if (hist.length > 300) hist.shift(); }
  function applyPlacement(i, after, before) {
    pushHist(i, before == null ? board[i] : before, after);
    board[i] = after;
    OP.audio.play(after === 0 ? 'fire' : after === 1 ? 'ice' : 'clear');
    afterPlace();
    if (scene) scene.popAt(i);
    saveCur();
    checkWinOrBroken();
  }

  function tap(i) {
    if (adPaused || OP.ui.modalOpen() || !pz) return;
    if (armed === 'check') { doCheck(i); return; }
    if (armed === 'reveal') { doReveal(i); return; }
    if (pz.givens[i] >= 0) { if (scene) scene.shakeCell(i); return; }
    const before = board[i], after = before < 0 ? 0 : (before === 0 ? 1 : -1);
    applyPlacement(i, after, before);
  }

  // ---------- boosters ----------
  function updateBoosterUI() { OP.ui.setBoosters({ reveal: !!(pz && pz.n >= 8), armed, undo: hist.length > 0 }); }
  function doUndo() {
    if (!hist.length) return;
    const last = hist.pop();
    board[last.i] = last.before;
    OP.audio.play('undo');
    afterPlace(); saveCur(); checkWinOrBroken(); updateBoosterUI();
  }
  function doHint() {
    const B = S().boosters;
    const v = OP.Puzzle.violations(pz, board);
    if (v.cells.size) {
      flashBad(Array.from(v.cells), 1600);
      OP.ui.msg('That tile looks wrong', { tone: 'bad', ms: 1600 });
      if (B.hint <= 0) { OP.ui.boosterAd('hint', pz.n >= 8, updateBoosterUI); return; }
      B.hint--; OP.save.soon(); updateBoosterUI(); OP.audio.play('hint');
      return;
    }
    if (B.hint <= 0) { OP.ui.boosterAd('hint', pz.n >= 8, updateBoosterUI); return; }
    const step = OP.Puzzle.nextStep(pz, board);
    if (!step) return;
    B.hint--; OP.save.soon(); OP.audio.play('hint');
    flashEvidence(evidenceFor(step), 2200);
    applyPlacement(step.i, step.v, board[step.i]);
    OP.ui.msg(stepText(step), { ms: 2600 });
    updateBoosterUI();
  }
  function flashEvidence(cells, ms) {
    fx.evidence = cells; if (scene) scene.applyFx();
    setTimeout(() => { fx.evidence = []; if (scene) scene.applyFx(); }, ms || 1600);
  }
  function doCheck(i) {
    if (pz.givens[i] >= 0) { OP.ui.msg('That one is frozen', { ms: 1400 }); armed = null; updateBoosterUI(); return; }
    const B = S().boosters;
    if (B.check <= 0) { armed = null; updateBoosterUI(); OP.ui.boosterAd('check', pz.n >= 8, updateBoosterUI); return; }
    if (board[i] < 0) {
      const nm = pz.sol[i] === 0 ? skin().an : skin().bn;
      OP.ui.msg('This should be ' + nm, { ms: 1800 });
      flashHint(i);
    } else {
      const ok = board[i] === pz.sol[i];
      OP.ui.msg(ok ? 'Correct!' : 'That’s wrong', { tone: ok ? 'good' : 'bad', ms: 1400 });
      if (!ok) flashBad([i], 1400); else flashHint(i);
    }
    B.check--; OP.save.soon();
    armed = null; updateBoosterUI();
  }
  function doReveal(i) {
    if (pz.givens[i] >= 0) { OP.ui.msg('That one is frozen', { ms: 1400 }); armed = null; updateBoosterUI(); return; }
    if (board[i] === pz.sol[i]) { OP.ui.msg('That tile is already correct', { ms: 1400 }); armed = null; updateBoosterUI(); return; }
    const B = S().boosters;
    if (B.reveal <= 0) { armed = null; updateBoosterUI(); OP.ui.boosterAd('reveal', false, updateBoosterUI); return; }
    const before = board[i];
    pushHist(i, before, pz.sol[i]);
    board[i] = pz.sol[i];
    B.reveal--; OP.save.soon();
    armed = null; updateBoosterUI();
    OP.audio.play(pz.sol[i] === 0 ? 'fire' : 'ice');
    afterPlace(); saveCur(); checkWinOrBroken();
  }
  function booster(k) {
    if (!pz || adPaused || OP.ui.modalOpen()) return;
    if (k === 'undo') return doUndo();
    if (k === 'hint') return doHint();
    if (k === 'check') { armed = armed === 'check' ? null : 'check'; updateBoosterUI(); OP.audio.play('click'); return; }
    if (k === 'reveal') { if (pz.n < 8) return; armed = armed === 'reveal' ? null : 'reveal'; updateBoosterUI(); OP.audio.play('click'); return; }
  }

  // ---------- daily timer ----------
  function dailyTick() { elapsed = (Date.now() - dailyStart) / 1000; OP.ui.setTimer(elapsed); saveCur(); }
  function startDailyTimer() {
    if (dailyTimerId) return;
    dailyStart = Date.now() - elapsed * 1000;
    dailyTimerId = setInterval(dailyTick, 250);
  }
  function stopDailyTimer() { if (dailyTimerId) { clearInterval(dailyTimerId); dailyTimerId = null; } }

  // ---------- pause / restart / screens ----------
  function restartCurrent() {
    if (!pz) return;
    board = Array.from(pz.givens); hist = [];
    prevGood = []; fx.bad = []; fx.glowLines = []; fx.broken = []; fx.hint = null; fx.evidence = [];
    armed = null; clearTimeout(badTimer);
    if (scene) scene.updatePieces();
    updateBoosterUI(); saveCur();
    if (mode === 'daily') startDailyTimer();
  }
  function pause() {
    if (!pz) return;
    if (mode === 'daily') stopDailyTimer();
    OP.ui.openPause({
      restart: () => restartCurrent(),
      home: () => { saveCur(); OP.ui.show('home'); },
      onClose: () => { if (mode === 'daily' && OP.ui.current === 'game') startDailyTimer(); },
    });
  }
  function onScreen(name) {
    if (name === 'home') OP.ui.maybeLogin();
    if (name !== 'game' && mode === 'daily') stopDailyTimer();
    if (scene && scene.sys && scene.sys.game && scene.sys.game.canvas) {
      scene.sys.game.canvas.style.display = name === 'game' ? '' : 'none';
    }
  }
  function refreshMarks() {
    if (!pz) return;
    clearTimeout(badTimer);
    fx.bad = S().settings.auto ? Array.from(OP.Puzzle.violations(pz, board).cells) : [];
    if (scene) scene.applyFx();
  }
  function clearCache() {
    mode = null; curSpec = null; pz = null; board = null; hist = []; armed = null;
    stopDailyTimer();
    if (scene) scene.updatePieces(); // pz is null now, so this just no-ops
  }
  function adPause(on) {
    adPaused = !!on;
    if (on) { if (mode === 'daily') stopDailyTimer(); }
    else if (mode === 'daily' && OP.ui.current === 'game') startDailyTimer();
  }

  // ---------- dev/debug (only ever called from the ?dev=1 panel) ----------
  function devSolve() {
    if (!pz) return;
    board = Array.from(pz.sol);
    hist = [];
    afterPlace();
    saveCur();
    checkWinOrBroken();
  }
  function devInfo() { return { mode, level: S().level, n: pz ? pz.n : null, diff: curSpec ? curSpec.diff : null }; }

  // ---------- Phaser scene ----------
  class BoardScene extends Phaser.Scene {
    constructor() { super('Board'); }
    preload() {
      const seen = {};
      OP.skins.list.forEach((sk) => {
        [sk.pa, sk.pb].forEach((nm) => {
          if (!seen[nm]) { seen[nm] = 1; this.load.image('pc_' + nm, OP.skins.dataUri(nm, 200)); }
        });
      });
    }
    create() {
      // Capped: a full 3x device pixel ratio triples the fill-rate for no visible gain on a flat-shaded board.
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.gBg = this.add.graphics().setDepth(0);
      this.gLink = this.add.graphics().setDepth(2);
      this.gFx = this.add.graphics().setDepth(3);
      this.cellC = []; this.n = 0; this.L = null;
      this.input.on('pointerdown', (p) => this._onTap(p));
      scene = this; if (curL) scene.setLayout(curL);
    }
    _onTap(p) {
      const L = this.L; if (!L || !pz) return;
      const dpr = this.dpr, n = pz.n;
      const pad = L.size * 0.03, cs = (L.size - 2 * pad) / n;
      const ox = L.x * dpr, oy = L.y * dpr, P = pad * dpr, CS = cs * dpr, Sz = L.size * dpr;
      const x = p.x, y = p.y;
      if (x < ox + P || y < oy + P || x > ox + Sz - P || y > oy + Sz - P) return;
      const c = Math.floor((x - ox - P) / CS), r = Math.floor((y - oy - P) / CS);
      if (r < 0 || r >= n || c < 0 || c >= n) return;
      tap(r * n + c);
    }
    setLayout(L) { this.L = L; this.redraw(); }
    ensureCells(n) {
      if (this.n === n) return;
      this.cellC.forEach((c) => c.destroy());
      this.cellC = [];
      for (let i = 0; i < n * n; i++) {
        const img = this.add.image(0, 0, 'pc_fire').setVisible(false);
        const cont = this.add.container(0, 0, [img]).setDepth(1);
        cont.pieceImg = img;
        this.cellC.push(cont);
      }
      this.n = n;
    }
    geom() {
      const L = this.L, n = pz.n, dpr = this.dpr;
      const pad = L.size * 0.03, cs = (L.size - 2 * pad) / n;
      return { ox: L.x * dpr, oy: L.y * dpr, P: pad * dpr, CS: cs * dpr, Sz: L.size * dpr };
    }
    // Full rebuild: the cell frame and link dots. Only needed when the layout or the puzzle
    // itself changes, never on every tap (that's updatePieces, below).
    redraw() {
      const L = this.L;
      if (!pz || !L) return;
      const n = pz.n, dpr = this.dpr;
      this.ensureCells(n);
      const g = this.geom(), ox = g.ox, oy = g.oy, P = g.P, CS = g.CS, Sz = g.Sz;
      this.gBg.clear();
      this.gBg.fillStyle(0x1a2030, 0.08);
      this.gBg.fillRoundedRect(ox - 2 * dpr, oy + 4 * dpr, Sz + 4 * dpr, Sz + 4 * dpr, 18 * dpr);
      this.gBg.fillStyle(0xf3f5f9, 1);
      this.gBg.fillRoundedRect(ox, oy, Sz, Sz, 16 * dpr);
      for (let i = 0; i < n * n; i++) {
        const r = (i / n) | 0, c = i % n;
        const cx = ox + P + c * CS, cy = oy + P + r * CS;
        const frozen = pz.givens[i] >= 0;
        this.gBg.fillStyle(frozen ? 0xeef1f6 : 0xffffff, 1);
        this.gBg.fillRoundedRect(cx + 1, cy + 1, CS - 2, CS - 2, 6 * dpr);
        this.gBg.lineStyle(2 * dpr, frozen ? 0xc9d0db : 0xe3e7ee, 1);
        this.gBg.strokeRoundedRect(cx + 1, cy + 1, CS - 2, CS - 2, 6 * dpr);
      }
      this.gLink.clear();
      (pz.links || []).forEach(([a, b]) => {
        const ra = (a / n) | 0, ca = a % n, rb = (b / n) | 0, cb = b % n;
        const ax = ox + P + (ca + 0.5) * CS, ay = oy + P + (ra + 0.5) * CS;
        const bx = ox + P + (cb + 0.5) * CS, by = oy + P + (rb + 0.5) * CS;
        const mx = (ax + bx) / 2, my = (ay + by) / 2, rad = CS * 0.14;
        try {
          this.gLink.fillStyle(0xff6a45, 1);
          this.gLink.slice(mx, my, rad, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(270), false);
          this.gLink.fillPath();
          this.gLink.fillStyle(0x3fa4e8, 1);
          this.gLink.slice(mx, my, rad, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(90), false);
          this.gLink.fillPath();
        } catch (e) { /* ignore */ }
        this.gLink.lineStyle(2 * dpr, 0xffffff, 1);
        this.gLink.strokeCircle(mx, my, rad);
      });
      this.updatePieces();
    }
    // Light update: only the piece sprites (position + texture). Called on every tap/undo/hint
    // so we're not re-tessellating ~100+ rounded rects of static board frame each time.
    updatePieces() {
      const L = this.L;
      if (!pz || !L) return;
      this.ensureCells(pz.n);
      const n = pz.n, sk = skin(), g = this.geom();
      for (let i = 0; i < n * n; i++) {
        const r = (i / n) | 0, c = i % n;
        const cx = g.ox + g.P + c * g.CS, cy = g.oy + g.P + r * g.CS;
        const cont = this.cellC[i];
        cont.setPosition(cx + g.CS / 2, cy + g.CS / 2);
        const v = board ? board[i] : -1;
        if (v < 0) cont.pieceImg.setVisible(false);
        else {
          const nm = v === 0 ? sk.pa : sk.pb;
          cont.pieceImg.setTexture('pc_' + nm).setVisible(true).setDisplaySize(g.CS * 0.7, g.CS * 0.7);
        }
      }
      this.applyFx();
    }
    applyFx() {
      const L = this.L; if (!L || !pz) return;
      const n = pz.n, dpr = this.dpr, pad = L.size * 0.03, cs = (L.size - 2 * pad) / n;
      const ox = L.x * dpr, oy = L.y * dpr, P = pad * dpr, CS = cs * dpr;
      const rectFor = (i) => { const r = (i / n) | 0, c = i % n; return [ox + P + c * CS + 1, oy + P + r * CS + 1, CS - 2, CS - 2]; };
      this.gFx.clear();
      (fx.evidence || []).forEach((i) => {
        const r = rectFor(i);
        this.gFx.fillStyle(0x3fa4e8, 0.16); this.gFx.fillRoundedRect.apply(this.gFx, r.concat([6 * dpr]));
        this.gFx.lineStyle(2 * dpr, 0x3fa4e8, 0.6); this.gFx.strokeRoundedRect.apply(this.gFx, r.concat([6 * dpr]));
      });
      let P2 = null;
      if ((fx.glowLines || []).length) P2 = OP.Puzzle.ctx(n, pz.links, pz.unique);
      (fx.glowLines || []).forEach((L2) => { P2.lc[L2].forEach((i) => { this.gFx.lineStyle(3 * dpr, 0xffd27a, 0.95); this.gFx.strokeRoundedRect.apply(this.gFx, rectFor(i).concat([6 * dpr])); }); });
      (fx.broken || []).forEach((i) => { this.gFx.lineStyle(3 * dpr, 0xff5050, 0.85); this.gFx.strokeRoundedRect.apply(this.gFx, rectFor(i).concat([6 * dpr])); });
      (fx.bad || []).forEach((i) => { this.gFx.fillStyle(0xff5050, 0.3); this.gFx.fillRoundedRect.apply(this.gFx, rectFor(i).concat([6 * dpr])); });
      if (fx.hint != null) { this.gFx.lineStyle(3 * dpr, 0x3fa4e8, 0.9); this.gFx.strokeRoundedRect.apply(this.gFx, rectFor(fx.hint).concat([8 * dpr])); }
    }
    popAt(i) {
      const cont = this.cellC[i]; if (!cont) return;
      const target = cont.pieceImg.scaleX || 1;
      cont.pieceImg.setScale(target * 0.4);
      this.tweens.add({ targets: cont.pieceImg, scaleX: target, scaleY: target, duration: 220, ease: 'Back.easeOut' });
    }
    shakeCell(i) {
      const cont = this.cellC[i]; if (!cont) return;
      const x0 = cont.x;
      this.tweens.add({ targets: cont, x: [x0 - 6 * this.dpr, x0 + 6 * this.dpr, x0 - 4 * this.dpr, x0 + 4 * this.dpr, x0], duration: 260, ease: 'Sine.easeInOut' });
      OP.audio.play('wrong', 0.5);
    }
    shakeBoard() { try { this.cameras.main.shake(260, 0.004); } catch (e) { /* ignore */ } }
    winRipple() {
      try {
        const L = this.L; if (!L) return;
        const dpr = this.dpr, cx = (L.x + L.size / 2) * dpr, cy = (L.y + L.size / 2) * dpr;
        const ring = this.add.circle(cx, cy, 10 * dpr, 0xffffff, 0).setStrokeStyle(4 * dpr, 0xffd27a, 1).setDepth(5);
        this.tweens.add({
          targets: ring, radius: L.size * 0.75 * dpr, duration: 700, ease: 'Cubic.easeOut',
          onUpdate: () => { try { ring.setStrokeStyle(4 * this.dpr, 0xffd27a, 1 - ring.radius / (L.size * 0.75 * dpr)); } catch (e2) { /* ignore */ } },
          onComplete: () => ring.destroy(),
        });
      } catch (e) { /* ignore */ }
    }
  }

  OP.game = { start, pause, booster, onScreen, refreshMarks, clearCache, adPause, layout, Scene: BoardScene, devSolve, devInfo };
})();
