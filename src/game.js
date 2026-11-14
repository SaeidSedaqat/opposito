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
  let mode = null, curSpec = null, pz = null, board = null, hist = [], elapsed = 0, solved = false;
  let armed = null, adPaused = false;
  let dailyTimerId = null, dailyStart = 0;
  let prevGood = [];
  const fx = { bad: [], glowLines: [], broken: [], hint: null, evidence: [], focus: null, hover: [] };
  // Levels that introduce a rule open the matching How to Play section once, on a fresh start.
  const TUT_HELP = { 1: ['balance', 'three'], 11: ['links'], 16: ['bonds'] }; // each rule is taught the first time it appears: level 1 Balance + No three, 11 Opposite, 16 Same

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
  function prefetch(spec) { if (spec.fixed || cache[spec.seed]) return; genPuzzle(spec, (p) => { if (p) cache[spec.seed] = p; }); }
  function obtain(spec, cb) {
    if (spec.fixed) { cb(Object.assign({ diff: spec.diff, rating: 1, seed: spec.seed }, JSON.parse(JSON.stringify(spec.fixed)))); return; }
    if (cache[spec.seed]) { const p = cache[spec.seed]; delete cache[spec.seed]; cb(p); return; }
    genPuzzle(spec, cb);
  }

  // ---------- layout ----------
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function computeLayout(w, h) {
    const compact = w >= h * 1.15 && h < 640;
    // Real rendered height of the booster bar (icons grew in 0.1.108), plus a bottom margin so it never clips.
    const barEl = document.getElementById('gBar');
    const bar = barEl && barEl.hidden ? 8 : Math.max(84, (barEl && barEl.offsetHeight) || 0) + 16;
    let x, y, size;
    if (compact) {
      size = clamp(h - 24 - bar - 12, 160, Math.min(h - 40, w * 0.62));
      x = w - size - 20;
      y = Math.max(12, (h - size - 12 - bar) / 2);
    } else {
      // The message starts just under the pause button (its size differs by orientation), and the board under that.
      const pe = document.getElementById('gPause'), top = 16 + 10 + ((pe && pe.offsetHeight) || 60) + 6, msgH = 56;
      size = clamp(Math.min(w - 32, h - top - msgH - bar - 24), 160, 620);
      x = (w - size) / 2;
      const blockH = size + 12 + bar;
      y = top + msgH + Math.max(12, (h - top - msgH - blockH) * 0.3); // sit high: 30% of the spare room above, 70% below
    }
    return { W: w, H: h, x, y, size, compact, safe: { l: 16, t: 16, r: 16 } };
  }
  // Big screens: lay the game out as if the window were a normal-sized one (w/g x h/g), then scale
  // everything up by g -- the HUD through CSS zoom (--g), the board by multiplying its rect --
  // so a 3200x1920 window looks like a 1280x800 one, only larger. Never shrinks (g >= 1).
  function hudScale(w, h) {
    return h > w ? Math.max(1, Math.min(w / 600, h / 1000)) : Math.max(1, Math.min(w / 1280, h / 800));
  }
  function layout(w, h) {
    const g = hudScale(w, h);
    document.documentElement.style.setProperty('--g', g.toFixed(4));
    const v = computeLayout(w / g, h / g);
    OP.ui.placeHud(v);
    curL = Object.assign({}, v, { W: w, H: h, x: v.x * g, y: v.y * g, size: v.size * g, g, dpr: dprFor(w, h) });
    if (scene) scene.setLayout(curL);
    if (guideStep()) pointAtCell(guideStep().i); // keep the hand on its cell after a resize
    syncNums();
  }

  // ---------- performance ----------
  // Canvas resolution: device pixel ratio capped at 2, and the whole canvas capped at ~8.3M pixels
  // (one 4K screen), so huge or high-DPI monitors don't multiply the GPU fill cost.
  // main.js sizes the canvas with this same function.
  function dprFor(w, h) { return Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8.3e6 / Math.max(1, w * h))); }
  // Draw on demand: Phaser's loop sleeps whenever nothing on the board is changing or animating,
  // so an idle board costs no CPU or GPU at all. Anything that changes the picture calls kick().
  let idleUntil = 0;
  function kick(ms) {
    idleUntil = Math.max(idleUntil, performance.now() + (ms || 0) + 250);
    const loop = scene && scene.game && scene.game.loop;
    if (loop && !loop.running) loop.wake(true);
  }

  // ---------- hint text ----------
  function stepText(step) {
    const sk = skin(); const nameOf = (v) => (v === 0 ? sk.an : sk.bn);
    const place = 'Place ' + nameOf(step.v) + ' here';
    switch (step.kind) {
      case 'link': return place + ' — tiles with × between them are always opposite.';
      case 'bond': return place + ' — tiles with = between them are always the same.';
      case 'pair': return 'Two ' + nameOf(step.p) + ' in a row already. ' + place + ', or three would match.';
      case 'sand': return nameOf(step.p) + ' on both sides of the gap. ' + place + ' to fill it in.';
      case 'count': return 'This line already has enough ' + nameOf(step.p) + '. ' + place + ' to balance it out.';
      case 'line': return 'Look at the whole line, not just one pair. ' + place + ' — it’s the only piece that fits.';
      case 'trial': return 'Not obvious yet — ' + place.toLowerCase() + ' and see what it unlocks.';
      default: return place + '.';
    }
  }
  // Which cells show the evidence behind a step, highlighted so the reasoning is visible.
  function evidenceFor(step) {
    if (step.from && step.from.length) return step.from.slice();
    if (step.line != null) {
      const P = OP.Puzzle.ctx(pz.n, pz.links);
      if (step.kind === 'count') return P.lc[step.line].filter((ci) => board[ci] === step.p);
      return P.lc[step.line].filter((ci) => ci !== step.i);
    }
    return [];
  }

  // ---------- guided tutorial (level 1) ----------
  // The current step is worked out from the board itself, so resuming, restarting or resizing
  // always lands on the right step. Only that step's cell can be tapped.
  function guideStep() {
    if (!curSpec || !curSpec.guide || !board || solved) return null;
    return curSpec.guide.find((s) => board[s.i] !== s.v) || null;
  }
  function showGuide() {
    if (!curSpec || !curSpec.guide) { fx.focus = null; OP.ui.pointer(null); return; }
    const st = guideStep();
    fx.focus = st ? st.line : null; fx.hint = st ? st.i : null;
    if (scene) scene.applyFx();
    if (!st) { OP.ui.pointer(null); OP.ui.msg('Perfect! Every row and column is balanced.', { tone: 'good' }); return; }
    const sk = skin(), A = sk.an, B = sk.bn;
    let t;
    if (st.v === 0) t = 'Each row needs as many ' + A + ' as ' + B + '.<br>Tap here to place ' + A + '!';
    else if (board[st.i] === 0) t = 'Tap again to turn it into ' + B + '.';
    else t = (st.line < pz.n ? 'This row needs one more ' : 'Columns too! This one needs ') + B + '.<br>Double tap to get ' + B + '.';
    OP.ui.msg(t, { tone: 'tut' });
    pointAtCell(st.i);
  }
  // The tutorial's second-piece step on an empty cell is taught as a double tap (empty -> second piece).
  function needsDouble(st) { return st.v === 1 && board[st.i] < 0; }
  let guideTapAt = 0;
  function pointAtCell(i) {
    if (!curL || !pz) return;
    const g = curL.g || 1, n = pz.n, size = curL.size / g, pad = size * 0.03, cs = (size - 2 * pad) / n;
    const cx = curL.x / g + pad + (i % n + 0.5) * cs, cy = curL.y / g + pad + (((i / n) | 0) + 0.5) * cs;
    const st = guideStep(), dbl = !!(st && st.i === i && needsDouble(st));
    OP.ui.pointer(cx - 16, cy - 3, dbl); // the hand's ring is centred 16px right / 3px down of its anchor
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
    if (which === 'free') {
      const f = S().free;
      f.count = (f.count || 0) + 1; // every Play press is a fresh seed, so two free puzzles are never the same
      OP.save.soon();
      return { n: f.n, diff: f.diff, links: f.diff >= 2, bonds: f.diff >= 2, seed: 'free-' + f.count };
    }
    const t = C.today(); const s = C.dailySpec(t); s.key = t.key; return s;
  }

  // ---------- flow ----------
  // Pressing Play fades the current screen out and shows "Loading..." for at least a second while
  // the puzzle is made, then the game screen fades in. (Boot into the level-1 tutorial skips it:
  // the main loading screen has just been shown.)
  function start(which, opts) {
    mode = which;
    const spec = buildSpec(which);
    const quick = opts && opts.quick, t0 = Date.now();
    const saved = curObj()[which];
    const resume = !!(saved && saved.spec && saved.spec.seed === spec.seed);
    if (!quick) OP.ui.playLoading(true);
    const go = (p) => {
      OP.ui.playLoading(false);
      OP.ui.show('game');
      const needAd = (which === 'levels' && spec.level >= 4) || which === 'free';
      if (needAd) OP.ui.adBreak(() => begin(which, spec, p));
      else begin(which, spec, p);
    };
    const ready = (p) => { if (quick) go(p); else setTimeout(() => go(p), Math.max(0, 1000 - (Date.now() - t0))); };
    if (resume) ready(null); else obtain(spec, ready);
  }

  function begin(which, spec, made) {
    clearHint();
    curSpec = spec; armed = null; prevGood = []; solved = false;
    clearTimeout(brokenTimer); fx.bad = []; fx.glowLines = []; fx.broken = []; fx.hint = null; fx.evidence = [];
    fx.focus = null; OP.ui.pointer(null);
    const saved = curObj()[which];
    if (saved && saved.spec && saved.spec.seed === spec.seed) {
      pz = saved.pz; board = saved.board.slice(); hist = saved.hist || []; elapsed = saved.elapsed || 0;
      afterLoad(which, spec);
      return;
    }
    const use = (p) => {
      pz = p; board = Array.from(pz.givens); hist = []; elapsed = 0;
      afterLoad(which, spec);
      if (TUT_HELP[spec.tut]) OP.ui.openHelp(TUT_HELP[spec.tut], () => showGuide()); // re-show the tutorial step once the rules are dismissed
    };
    if (made) use(made); else obtain(spec, use);
  }

  function afterLoad(which, spec) {
    const labels = {
      levels: ['Level ' + spec.level, C.DIFFS[spec.diff - 1] + ' · ' + spec.n + '×' + spec.n],
      free: ['Free Play', C.DIFFS[spec.diff - 1] + ' · ' + spec.n + '×' + spec.n],
      daily: ['Daily', C.dateLabel(C.today()).replace(/^(\w{3})\w*/, '$1')], // "Nov 14, 2026": fits beside pause/timer on phones
    }[which];
    // Levels 1-2 have no boosters at all (not even Undo); the board grows into the freed space.
    const noBar = which === 'levels' && spec.level <= 2;
    const pz1 = document.getElementById('gPause'); if (pz1) pz1.hidden = which === 'levels' && spec.level === 1; // no pause in the tutorial
    OP.ui.setHud({ l1: labels[0], l2: labels[1], timer: which === 'daily', bar: !noBar, gen: false });
    if (curL) layout(curL.W, curL.H);
    if (which === 'daily') { OP.ui.setTimer(elapsed); startDailyTimer(); } else stopDailyTimer();

    prevGood = OP.Puzzle.goodLines(pz, board);
    if (scene) { if (curL) scene.setLayout(curL); else scene.redraw(); }
    updateBoosterUI();
    saveCur();

    OP.ui.msg('');
    showGuide();

    if (which === 'levels') prefetch(C.levelSpec(spec.level + 1));

    // Safety net: if a reload lands us back on a board that was already fully (and correctly)
    // filled in — e.g. the page closed during the win delay below — finish the win now.
    if (isFull(board)) checkWinOrBroken();
  }

  // ---------- rendering helpers ----------
  let badTimer = null, brokenTimer = null;
  function afterPlace() {
    if (activeHint && board[activeHint.i] === activeHint.v) clearHint(true); // the player followed the hint
    fx.broken = []; clearTimeout(brokenTimer);
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
    if (S().settings.auto && !guideStep()) { // no red marks mid-tutorial (Fire is briefly in the Ice cell)
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

  function checkWinOrBroken() {
    if (!isFull(board)) return;
    const v = OP.Puzzle.violations(pz, board);
    if (v.cells.size === 0) {
      solved = true; armed = null; // lock the board: taps during the win celebration must not change it
      if (mode === 'daily') stopDailyTimer(); // freeze the clock at the exact solve moment
      OP.audio.play('win');
      if (scene) scene.winRipple();
      setTimeout(win, 2000); // let the player enjoy the finished board before the modal covers it
    }
    else {
      // Same beat as the auto-highlight: let the last tile land before calling the board wrong.
      clearTimeout(brokenTimer);
      brokenTimer = setTimeout(() => {
        if (!isFull(board)) return;
        if (guideStep()) return; // tutorial: the cell is mid-cycle (Fire on its way to Ice), not a mistake
        const v2 = OP.Puzzle.violations(pz, board);
        if (v2.cells.size === 0) return;
        fx.broken = Array.from(v2.cells);
        if (scene) scene.applyFx();
        OP.ui.msg('Not quite right yet', { tone: 'bad', ms: 1600 });
      }, 500);
    }
  }
  function win() { if (mode === 'levels') winLevel(); else if (mode === 'free') winFree(); else if (mode === 'daily') winDaily(); }

  function winLevel() {
    const spec = curSpec, diff = spec.diff;
    const coins = C.levelReward(spec.n, diff); // same pay as Free Play: bigger and harder boards pay more
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
    const coins = C.freeReward(curSpec.n, curSpec.diff);
    S().coins += coins;
    curObj().free = null;
    OP.save.persist();
    OP.audio.play('coin');
    OP.ui.openWin({ mode: 'free', coins, label: 'Nice work!', next: () => start('free'), home: () => OP.ui.show('home') });
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
    OP.audio.play('fire'); // one tap sound for every cell change (Fire, Ice or empty)
    afterPlace();
    if (scene) scene.popAt(i);
    saveCur();
    checkWinOrBroken();
    if (curSpec && curSpec.guide) showGuide();
  }

  function tap(i) {
    if (adPaused || OP.ui.modalOpen() || !pz || solved) return;
    if (armed === 'check') { doCheck(i); return; }
    if (armed === 'reveal') { doReveal(i); return; }
    const st = guideStep();
    if (st && i !== st.i) { if (scene) scene.shakeCell(i); pointAtCell(st.i); return; }
    if (st && needsDouble(st)) {
      // One tap does nothing here: only a second tap within 450 ms places the piece, so the player
      // really learns the double tap. Both taps count as one move (one undo step).
      const now = performance.now();
      if (now - guideTapAt > 450) { guideTapAt = now; return; }
      guideTapAt = 0;
      applyPlacement(i, 1, board[i]);
      return;
    }
    if (pz.givens[i] >= 0) { if (scene) scene.shakeCell(i); return; }
    const before = board[i], after = before < 0 ? 0 : (before === 0 ? 1 : -1);
    applyPlacement(i, after, before);
  }

  // ---------- boosters ----------
  function updateBoosterUI() { OP.ui.setBoosters({ reveal: !!(pz && pz.n >= 8), armed, undo: hist.length > 0, off: mode === 'daily' }); if (!armed) setHover(null); syncNums(); }
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
    // Same hint still showing (nothing changed since): just show it again, free.
    const same = activeHint && activeHint.i === step.i && activeHint.v === step.v;
    if (!same) { B.hint--; OP.save.soon(); }
    OP.audio.play('hint');
    showHint(step);
    updateBoosterUI();
  }
  // A hint only points: it rings the cell and tints the cells/line that explain it, and its
  // sentence stays up for 15 s -- or until the player places that piece or asks for another hint.
  let activeHint = null, hintTimer = null;
  function showHint(step) {
    clearHint();
    activeHint = { i: step.i, v: step.v };
    fx.hint = step.i; fx.evidence = evidenceFor(step);
    if (scene) scene.applyFx();
    OP.ui.msg(stepText(step), { tone: 'hint' });
    hintTimer = setTimeout(() => clearHint(true), 15000);
  }
  function clearHint(withMsg) {
    clearTimeout(hintTimer); hintTimer = null;
    if (!activeHint) return;
    activeHint = null; fx.hint = null; fx.evidence = [];
    if (scene) scene.applyFx();
    if (withMsg) OP.ui.msg('');
  }
  function flashEvidence(cells, ms) {
    fx.evidence = cells; if (scene) scene.applyFx();
    setTimeout(() => { fx.evidence = []; if (scene) scene.applyFx(); }, ms || 1600);
  }
  // Check: reveals the correct piece on the single tapped cell (a frozen or already-correct
  // tile costs nothing).
  function doCheck(i) {
    if (pz.givens[i] >= 0) { OP.ui.msg('That one is frozen', { ms: 1400 }); armed = null; updateBoosterUI(); return; }
    if (board[i] === pz.sol[i]) { OP.ui.msg('That tile is already correct', { ms: 1400 }); armed = null; updateBoosterUI(); return; }
    const B = S().boosters;
    if (B.check <= 0) { armed = null; updateBoosterUI(); OP.ui.boosterAd('check', pz.n >= 8, updateBoosterUI); return; }
    const before = board[i];
    pushHist(i, before, pz.sol[i]);
    board[i] = pz.sol[i];
    B.check--; OP.save.soon();
    armed = null; updateBoosterUI();
    OP.audio.play('fire');
    afterPlace(); saveCur(); checkWinOrBroken();
  }
  // Reveal: fills in a whole row or column. Tapping a cell picks the line through it that has
  // more empty/wrong cells; tapping a line number picks that line. No charge if it is already right.
  function lineScore(L) { const P = OP.Puzzle.ctx(pz.n, pz.links); let s = 0; P.lc[L].forEach((ci) => { if (board[ci] < 0 || board[ci] !== pz.sol[ci]) s++; }); return s; }
  function lineFor(i) { const n = pz.n, r = (i / n) | 0, c = i % n; return lineScore(r) >= lineScore(n + c) ? r : n + c; }
  function doReveal(i) { revealLine(lineFor(i)); }
  function revealLine(L) {
    if (!pz || solved || armed !== 'reveal') return;
    if (lineScore(L) === 0) { OP.ui.msg('That line is already done', { ms: 1400 }); armed = null; updateBoosterUI(); return; }
    const B = S().boosters;
    if (B.reveal <= 0) { armed = null; updateBoosterUI(); OP.ui.boosterAd('reveal', false, updateBoosterUI); return; }
    const P = OP.Puzzle.ctx(pz.n, pz.links);
    P.lc[L].forEach((ci) => { if (pz.givens[ci] < 0 && board[ci] !== pz.sol[ci]) { pushHist(ci, board[ci], pz.sol[ci]); board[ci] = pz.sol[ci]; } });
    B.reveal--; OP.save.soon();
    armed = null; updateBoosterUI();
    OP.audio.play('line');
    afterPlace(); saveCur(); checkWinOrBroken();
  }
  // While Check or Reveal is armed, the cell / line under the pointer is softly highlighted.
  let hoverKey = '';
  function setHover(cells) {
    const key = cells ? cells.join(',') : '';
    if (key === hoverKey) return;
    hoverKey = key; fx.hover = cells || [];
    if (scene) scene.applyFx();
  }
  function hoverCell(i) {
    if (!pz || solved || i == null || i < 0 || !armed) return setHover(null);
    if (armed === 'check') return setHover(pz.givens[i] >= 0 ? null : [i]); // frozen tiles can't be checked
    // Reveal: only the line numbers highlight (hoverLine); hovering the board itself shows nothing.
    setHover(null);
  }
  function hoverLine(L) {
    if (!pz || armed !== 'reveal' || L == null) return setHover(null);
    setHover(OP.Puzzle.ctx(pz.n, pz.links).lc[L].slice());
  }
  // Line-number badges show only while Reveal is armed, placed around the board in HUD px.
  function syncNums() {
    if (!pz || !curL || armed !== 'reveal') { OP.ui.setLineNums(null); return; }
    const g = curL.g || 1;
    OP.ui.setLineNums({ n: pz.n, x: curL.x / g, y: curL.y / g, size: curL.size / g });
  }
  function booster(k) {
    if (!pz || solved || adPaused || OP.ui.modalOpen()) return;
    if (mode === 'levels' && curSpec && curSpec.level <= 2) return;
    if (guideStep()) { OP.ui.msg('Follow the hand first!', { ms: 1400, after: showGuide }); return; }
    if (k === 'undo') return doUndo();
    if (mode === 'daily') { OP.ui.msg('No boosters in the Daily', { ms: 1400 }); return; }
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
    clearHint(true);
    board = Array.from(pz.givens); hist = [];
    prevGood = []; fx.bad = []; fx.glowLines = []; fx.broken = []; fx.hint = null; fx.evidence = [];
    armed = null; clearTimeout(badTimer);
    if (scene) scene.updatePieces();
    updateBoosterUI(); saveCur();
    if (mode === 'daily') startDailyTimer();
    showGuide();
  }
  function pause() {
    if (!pz) return;
    if (mode === 'levels' && curSpec && curSpec.level === 1) return; // level 1 (tutorial) has no pause
    if (mode === 'daily') stopDailyTimer();
    OP.ui.openPause({
      restart: () => restartCurrent(),
      home: () => { saveCur(); OP.ui.show('home'); },
      // Shop from the pause menu: Back returns to this game with the pause menu open again.
      shop: () => { saveCur(); OP.ui.openShop(() => { OP.ui.show('game'); pause(); }); },
      onClose: () => { if (mode === 'daily' && OP.ui.current === 'game') startDailyTimer(); },
    });
  }
  function onScreen(name) {
    if (name === 'home') OP.ui.maybeLogin();
    if (name !== 'game' && mode === 'daily') stopDailyTimer();
    if (scene && scene.sys && scene.sys.game && scene.sys.game.canvas) {
      scene.sys.game.canvas.style.display = name === 'game' ? '' : 'none';
      if (name === 'game') {
        const g = document.getElementById('game'); requestAnimationFrame(() => { g.style.opacity = '1'; });
        if (scene.L && pz) scene.updatePieces(); // a skin may have been equipped in the shop
      }
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
      this.load.image('fx_spark', 'assets/art/fx/spark.webp?v=' + OP.config.VERSION);
    }
    create() {
      this.dpr = curL ? curL.dpr : dprFor(window.innerWidth, window.innerHeight);
      this.gBg = this.add.graphics().setDepth(0);
      this.gLink = this.add.graphics().setDepth(2);
      this.gFx = this.add.graphics().setDepth(3);
      this.cellC = []; this.n = 0; this.L = null;
      // Every animation or timer keeps the loop awake for as long as it runs (see kick()).
      const tAdd = this.tweens.add.bind(this.tweens), dCall = this.time.delayedCall.bind(this.time), eAdd = this.time.addEvent.bind(this.time);
      this.tweens.add = (c) => { kick(((c.duration || 0) * (c.yoyo ? 2 : 1)) + (c.delay || 0)); return tAdd(c); };
      this.time.delayedCall = (d, cb, a, s) => { kick(d); return dCall(d, cb, a, s); };
      this.time.addEvent = (c) => { kick((c.delay || 0) * ((c.repeat || 0) + 1)); return eAdd(c); };
      this.game.canvas.addEventListener('pointerdown', () => kick(), true);
      this.input.on('pointerdown', (p) => this._onTap(p));
      this.input.on('pointermove', (p) => hoverCell(this.cellAt(p)));
      this.input.on('gameout', () => hoverCell(null));
      scene = this; if (curL) scene.setLayout(curL);
      kick();
    }
    update() {
      if (performance.now() > idleUntil && this.tweens.getTweens().length === 0) this.game.loop.sleep();
    }
    cellAt(p) {
      const L = this.L; if (!L || !pz) return -1;
      const dpr = this.dpr, n = pz.n;
      const pad = L.size * 0.03, cs = (L.size - 2 * pad) / n;
      const ox = L.x * dpr, oy = L.y * dpr, P = pad * dpr, CS = cs * dpr, Sz = L.size * dpr;
      const x = p.x, y = p.y;
      if (x < ox + P || y < oy + P || x > ox + Sz - P || y > oy + Sz - P) return -1;
      const c = Math.floor((x - ox - P) / CS), r = Math.floor((y - oy - P) / CS);
      if (r < 0 || r >= n || c < 0 || c >= n) return -1;
      return r * n + c;
    }
    _onTap(p) { const i = this.cellAt(p); if (i >= 0) tap(i); }
    setLayout(L) { this.L = L; if (L.dpr) this.dpr = L.dpr; this.redraw(); kick(); }
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
      // Links are small flat dark-grey glyphs on the shared edge: "×" = the two cells are opposite, "=" = the same.
      const gl = this.gLink;
      const bar = (cx, cy, len, th, ang) => { // a flat rounded bar centred on (cx, cy)
        const ca = Math.cos(ang), sa = Math.sin(ang), hl = len / 2, ht = th / 2;
        const pts = [[-hl, -ht], [hl, -ht], [hl, ht], [-hl, ht]].map(([x, y]) => ({ x: cx + x * ca - y * sa, y: cy + x * sa + y * ca }));
        gl.fillPoints(pts, true);
        gl.fillCircle(cx - hl * ca, cy - hl * sa, ht); gl.fillCircle(cx + hl * ca, cy + hl * sa, ht);
      };
      (pz.links || []).forEach(([a, b, s]) => {
        const ra = (a / n) | 0, ca = a % n, rb = (b / n) | 0, cb = b % n;
        const ax = ox + P + (ca + 0.5) * CS, ay = oy + P + (ra + 0.5) * CS;
        const bx = ox + P + (cb + 0.5) * CS, by = oy + P + (rb + 0.5) * CS;
        const mx = (ax + bx) / 2, my = (ay + by) / 2, rad = CS * 0.12, th = Math.max(2 * dpr, rad * 0.3);
        gl.fillStyle(0x4a5163, 1); // plain dark grey glyph, no badge
        if (s) { bar(mx, my - rad * 0.36, rad * 1.1, th, 0); bar(mx, my + rad * 0.36, rad * 1.1, th, 0); }
        else { bar(mx, my, rad * 1.25, th, Math.PI / 4); bar(mx, my, rad * 1.25, th, -Math.PI / 4); }
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
          cont.pieceImg.setTexture('pc_' + nm).setVisible(true).setDisplaySize(g.CS * 0.84, g.CS * 0.84);
        }
      }
      this.applyFx();
    }
    applyFx() {
      const L = this.L; if (!L || !pz) return;
      const n = pz.n, dpr = this.dpr, pad = L.size * 0.03, cs = (L.size - 2 * pad) / n;
      const ox = L.x * dpr, oy = L.y * dpr, P = pad * dpr, CS = cs * dpr;
      const rectFor = (i) => { const r = (i / n) | 0, c = i % n; return [ox + P + c * CS + 1, oy + P + r * CS + 1, CS - 2, CS - 2]; };
      kick(); // pieces or highlights changed: draw a frame
      this.gFx.clear();
      if (fx.focus != null) {
        // Tutorial spotlight: wash out every other row and ring the focused one.
        const keep = OP.Puzzle.ctx(n, pz.links).lc[fx.focus];
        for (let i = 0; i < n * n; i++) if (keep.indexOf(i) < 0) { this.gFx.fillStyle(0xf3f5f9, 0.62); this.gFx.fillRoundedRect.apply(this.gFx, rectFor(i).concat([6 * dpr])); }
        const a = rectFor(keep[0]), b = rectFor(keep[keep.length - 1]), m = 3 * dpr;
        this.gFx.lineStyle(4 * dpr, 0xffb02e, 1);
        this.gFx.strokeRoundedRect(a[0] - m, a[1] - m, b[0] + b[2] - a[0] + 2 * m, b[1] + b[3] - a[1] + 2 * m, 10 * dpr);
      }
      (fx.evidence || []).forEach((i) => {
        const r = rectFor(i);
        this.gFx.fillStyle(0x3fa4e8, 0.16); this.gFx.fillRoundedRect.apply(this.gFx, r.concat([6 * dpr]));
        this.gFx.lineStyle(2 * dpr, 0x3fa4e8, 0.6); this.gFx.strokeRoundedRect.apply(this.gFx, r.concat([6 * dpr]));
      });
      if ((fx.hover || []).length) {
        // Check / Reveal aiming: soft tint on the cell or line under the pointer, ringed as one block.
        fx.hover.forEach((i) => { this.gFx.fillStyle(0x3fa4e8, 0.14); this.gFx.fillRoundedRect.apply(this.gFx, rectFor(i).concat([6 * dpr])); });
        const a = rectFor(Math.min.apply(null, fx.hover)), b = rectFor(Math.max.apply(null, fx.hover)), m = 2 * dpr;
        this.gFx.lineStyle(3 * dpr, 0x3fa4e8, 0.85);
        this.gFx.strokeRoundedRect(a[0] - m, a[1] - m, b[0] + b[2] - a[0] + 2 * m, b[1] + b[3] - a[1] + 2 * m, 9 * dpr);
      }
      let P2 = null;
      if ((fx.glowLines || []).length) P2 = OP.Puzzle.ctx(n, pz.links);
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
      const cont = this.cellC[i]; if (!cont || !pz || !this.L) return;
      // Spamming taps could otherwise stack shakes: each new one read cont.x mid-animation as
      // its "resting" position, so the cell drifted further off-grid with every extra tap.
      // Kill any shake already in flight and recompute the true resting x from the board
      // geometry (never from cont.x, which may currently be mid-tween) before starting a new one.
      this.tweens.killTweensOf(cont);
      const n = pz.n, r = (i / n) | 0, c = i % n, g = this.geom();
      const x0 = g.ox + g.P + c * g.CS + g.CS / 2;
      cont.x = x0;
      this.tweens.add({ targets: cont, x: [x0 - 6 * this.dpr, x0 + 6 * this.dpr, x0 - 4 * this.dpr, x0 + 4 * this.dpr, x0], duration: 260, ease: 'Sine.easeInOut' });
      OP.audio.play('wrong', 0.5);
    }
    // Win celebration (fills the 2 s before the win popup): ring, a diagonal wave through every tile,
    // sparkle bursts and twinkles across the board. Sparkle sprite: assets/art/fx/spark.webp (Bing).
    winRipple() {
      try {
        const L = this.L; if (!L || !pz) return;
        const dpr = this.dpr, n = pz.n, g = this.geom();
        const cx = g.ox + g.Sz / 2, cy = g.oy + g.Sz / 2;
        const tint = [0xff6a45, 0x3fa4e8, 0xffc23d, 0xffffff];
        const hasSpark = this.textures.exists('fx_spark');
        const spark = (x, y, size, color, depth) => {
          if (hasSpark) return this.add.image(x, y, 'fx_spark').setDisplaySize(size, size).setTint(color).setDepth(depth || 7);
          return this.add.circle(x, y, size / 5, color, 1).setDepth(depth || 7);
        };
        // 1. Expanding gold ring.
        // Drawn once at full size and scaled up (cheap), instead of rebuilding its outline every frame.
        const R = L.size * 0.8 * dpr;
        const ring = this.add.circle(cx, cy, R, 0xffffff, 0).setStrokeStyle(5 * dpr, 0xffc23d, 1).setDepth(5).setScale(0.02);
        this.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 800, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
        // 2. Diagonal wave: each tile hops and flashes a sparkle as the wave passes.
        for (let i = 0; i < n * n; i++) {
          const cont = this.cellC[i]; if (!cont) continue;
          const r = (i / n) | 0, c = i % n, delay = 120 + (r + c) * 55;
          this.tweens.add({ targets: cont, scale: 1.22, duration: 140, delay, yoyo: true, ease: 'Sine.easeOut', onComplete: () => cont.setScale(1) });
          this.time.delayedCall(delay + 60, () => {
            const x = g.ox + g.P + c * g.CS + g.CS / 2, y = g.oy + g.P + r * g.CS + g.CS / 2;
            const s = spark(x, y, g.CS * 0.9, (r + c) % 2 ? 0xffc23d : 0xffe9a8).setScale(0).setAlpha(0.95);
            const full = (g.CS * 0.9) / (hasSpark ? 128 : 1);
            this.tweens.add({ targets: s, scale: hasSpark ? full : 1, angle: 12, duration: 180, yoyo: true, ease: 'Sine.easeOut', onComplete: () => s.destroy() });
          });
        }
        // 3. Bursts: one from the centre now, three more around the board as the wave ends.
        const burst = (bx, by, count, reach) => {
          for (let k = 0; k < count; k++) {
            const ang = (k / count) * Math.PI * 2 + Math.random() * 0.4;
            const dist = reach * (0.5 + Math.random() * 0.5);
            const sz = (14 + Math.random() * 16) * dpr;
            const s = spark(bx, by, sz, tint[k % tint.length]);
            s.setAngle(Math.random() * 90);
            this.tweens.add({
              targets: s, x: bx + Math.cos(ang) * dist, y: by + Math.sin(ang) * dist + 20 * dpr,
              angle: s.angle + 180, alpha: 0, scale: s.scale * 0.3, duration: 700 + Math.random() * 400, ease: 'Cubic.easeOut',
              onComplete: () => s.destroy(),
            });
          }
        };
        burst(cx, cy, 20, L.size * 0.6 * dpr);
        const wave = 120 + (2 * n - 2) * 55;
        [[0.22, 0.25], [0.78, 0.3], [0.5, 0.8]].forEach((p, k) => {
          this.time.delayedCall(wave * 0.6 + k * 180, () => {
            burst(g.ox + g.Sz * p[0], g.oy + g.Sz * p[1], 10, L.size * 0.32 * dpr);
            OP.audio.play('clear', 0.35, 1.2 + k * 0.15);
          });
        });
        // 4. Twinkles scattered over the board until the popup arrives.
        this.time.addEvent({
          delay: 90, repeat: 14, callback: () => {
            const x = g.ox + Math.random() * g.Sz, y = g.oy + Math.random() * g.Sz;
            const sz = (10 + Math.random() * 18) * dpr;
            const s = spark(x, y, sz, [0xffc23d, 0xffe9a8, 0xffffff][(Math.random() * 3) | 0]);
            const sc = s.scale; s.setScale(0);
            this.tweens.add({ targets: s, scale: sc, angle: 90, duration: 260, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => s.destroy() });
          },
        });
      } catch (e) { /* ignore */ }
    }
  }

  OP.game = { start, pause, booster, hoverLine, revealLine, onScreen, refreshMarks, clearCache, adPause, layout, dprFor, Scene: BoardScene, devSolve, devInfo };
})();
