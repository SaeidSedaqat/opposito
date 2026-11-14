// Opposito: game constants, economy and the level / daily curves.
(function () {
  'use strict';
  const OP = (window.OP = window.OP || {});

  const DIFFS = ['Easy', 'Medium', 'Hard', 'Expert'];

  // Hand-made boards: 0 = Fire, 1 = Ice, -1 = empty.
  const I = 1, F = 0, E = -1;
  const FIXED = {
    1: { n: 4, links: [], givens: [E, F, F, I, F, I, I, F, I, F, F, I, E, I, I, F],
      sol: [I, F, F, I, F, I, I, F, I, F, F, I, F, I, I, F] },
    2: { n: 4, links: [], givens: [I, F, I, E, E, I, F, I, F, F, I, I, E, I, F, E],
      sol: [I, F, I, F, F, I, F, I, F, F, I, I, I, I, F, F] },
  };
  // Level 1 steps, in order: the one cell the player may tap, the piece it needs, and the row or column to spotlight.
  const GUIDE1 = [{ i: 12, v: F, line: 3 }, { i: 0, v: I, line: 4 }]; // lines: 0-3 rows, 4-7 columns

  // Levels 1-5 are 4x4. Level 1 is a hand-made guided tutorial (one allowed tap per step, see
  // game.js), 2 is hand-made with no help, 3 is an extra-easy generated board (extra = givens put
  // back) that shows the three-in-a-row rule, 4-5 are a touch harder, and 6 is the first 6x6.
  // 11 introduces links the same way. Rows/columns are always kept distinct by the generator
  // itself (puzzle.js), so a "twin" row or column is simply never something a level needs to
  // teach or test for.
  function levelSpec(L) {
    let s;
    if (L === 1) s = { n: 4, diff: 1, links: false, tut: 1, fixed: FIXED[1], guide: GUIDE1 };
    else if (L === 2) s = { n: 4, diff: 1, links: false, fixed: FIXED[2] };
    else if (L === 3) s = { n: 4, diff: 1, links: false, tut: 3, extra: 3 };
    else if (L <= 5) s = { n: 4, diff: 1, links: false, extra: 1 };
    else if (L <= 10) s = { n: 6, diff: 1, links: false, extra: [9, 7, 6, 5, 4][L - 6] }; // first 6x6 boards start with extra givens, easing off each level
    else if (L === 11) s = { n: 6, diff: 1, links: true, tut: 11, require: 'link' };
    else if (L <= 15) s = { n: 6, diff: 1, links: true };
    else if (L === 16) s = { n: 6, diff: 1, links: true, tut: 16, require: 'bond' }; // introduces bonds (same-piece links)
    else if (L <= 20) s = { n: 6, diff: 2, links: true };
    else if (L === 21) s = { n: 8, diff: 1, links: true };
    else if (L <= 40) { const big = L % 2 === 0; s = { n: big ? 8 : 6, diff: L <= 25 ? (big ? 1 : 2) : (L <= 35 ? 2 : (L % 3 === 0 ? 2 : 3)), links: true }; }
    else if (L === 41) s = { n: 10, diff: 1, links: true };
    else {
      const n = [6, 8, 10][(L - 42) % 3];
      let d;
      if (L < 60) d = 2;
      else if (L < 90) d = L % 2 ? 3 : 2;
      else if (L < 130) d = 3;
      else if (L < 200) d = L % 3 === 0 ? 4 : 3;
      else d = L % 2 ? 4 : 3;
      s = { n, diff: d, links: true };
    }
    if (L >= 16 && s.links) s.bonds = true;
    // Every 5th level is one step easier, except levels that introduce something new.
    if (L > 5 && L % 5 === 1 && [11, 21, 41].indexOf(L) < 0) s.diff = Math.max(1, s.diff - 1);
    s.seed = 'level-' + L + (L === 1 ? 'c' : L <= 6 ? 'b' : ''); // b: levels 1-6 redesigned in 0.1.189; c: level 1 board changed in 0.1.201
    return s;
  }

  // Daily: always 6x6 Hard or 8x8 Medium, alternating by weekday. No boosters (game.js).
  const DAILY = [
    { n: 8, diff: 2 }, // Sun
    { n: 6, diff: 3 }, // Mon
    { n: 8, diff: 2 }, // Tue
    { n: 6, diff: 3 }, // Wed
    { n: 8, diff: 2 }, // Thu
    { n: 6, diff: 3 }, // Fri
    { n: 8, diff: 2 }, // Sat
  ];
  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function today() {
    const d = new Date();
    let y = d.getFullYear(), m = d.getMonth(), day = d.getDate(), wd = d.getDay();
    if (!isFinite(y)) { y = d.getUTCFullYear(); m = d.getUTCMonth(); day = d.getUTCDate(); wd = d.getUTCDay(); }
    return { key: y + '-' + pad(m + 1) + '-' + pad(day), y, m, day, wd };
  }
  function dayKeyOffset(key, off) {
    const p = key.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + off));
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  function dailySpec(t) {
    const r = DAILY[t.wd];
    return { n: r.n, diff: r.diff, links: true, bonds: true, seed: 'daily-' + t.key };
  }
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function dateLabel(t) { return MONTHS[t.m] + ' ' + t.day + ', ' + t.y; }

  OP.config = {
    VERSION: '0.1.228',
    DIFFS,
    SIZES: [4, 6, 8, 10],
    coins: [0, 10, 20, 30, 50],      // by diff (1..4)
    // Free Play pays about half of Levels (it never runs out), more for bigger and harder boards.
    freeCoins: { 4: [2], 6: [5, 10], 8: [8, 15, 20], 10: [10, 20, 25, 35] },
    tutorialCoins: 10,
    drop: [0, 0, 0, 0.25, 0.4],      // bonus booster chance by diff (Levels only)
    adGives: { hint: 3, check: 2, reveal: 1 },
    adCooldown: 180000,
    adSeconds: 3,
    login: [
      { coins: 50 }, { skin: 'catdog' }, { coins: 75 }, { skin: 'ninjapirate' },
      { coins: 100 }, { coins: 150 }, { skin: 'swordshield' },
    ],
    freeReward(n, diff) { const r = this.freeCoins[n]; return (r && r[diff - 1]) || 0; },
    // Levels pay the Free Play rate; combos Free Play doesn't offer (6x6 Hard, 8x8 Expert) get +5 per extra step.
    levelReward(n, diff) { const r = this.freeCoins[n] || [10]; return diff <= r.length ? r[diff - 1] : r[r.length - 1] + 5 * (diff - r.length); },
    levelSpec, dailySpec, today, dayKeyOffset, dateLabel,
  };
})();
