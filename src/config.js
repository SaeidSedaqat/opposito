// Opposito: game constants, economy and the level / daily curves.
(function () {
  'use strict';
  const OP = (window.OP = window.OP || {});

  const DIFFS = ['Easy', 'Medium', 'Hard', 'Expert'];

  // Levels 1-3: 4x4 tutorials. Level 1 introduces both starting rules at once; 3 adds frozen tiles.
  // 11 and 31 introduce links and twin-rows the same way.
  function levelSpec(L) {
    let s;
    if (L === 1) s = { n: 4, diff: 1, links: false, unique: false, tut: 1 };
    else if (L === 2) s = { n: 4, diff: 1, links: false, unique: false };
    else if (L === 3) s = { n: 4, diff: 1, links: false, unique: false, tut: 3 };
    else if (L <= 10) s = { n: 6, diff: 1, links: false, unique: false };
    else if (L === 11) s = { n: 6, diff: 1, links: true, unique: false, tut: 11, require: 'link' };
    else if (L <= 15) s = { n: 6, diff: 1, links: true, unique: false };
    else if (L <= 20) s = { n: 6, diff: 2, links: true, unique: false };
    else if (L === 21) s = { n: 8, diff: 1, links: true, unique: false };
    else if (L <= 30) { const big = L % 2 === 0; s = { n: big ? 8 : 6, diff: big && L <= 25 ? 1 : 2, links: true, unique: false }; }
    else if (L === 31) s = { n: 6, diff: 2, links: true, unique: true, tut: 31, require: 'twin' };
    else if (L <= 40) { const big = L % 2 === 0; s = { n: big ? 8 : 6, diff: L <= 35 ? 2 : (L % 3 === 0 ? 2 : 3), links: true, unique: true }; }
    else if (L === 41) s = { n: 10, diff: 1, links: true, unique: true };
    else {
      const n = [6, 8, 10][(L - 42) % 3];
      let d;
      if (L < 60) d = 2;
      else if (L < 90) d = L % 2 ? 3 : 2;
      else if (L < 130) d = 3;
      else if (L < 200) d = L % 3 === 0 ? 4 : 3;
      else d = L % 2 ? 4 : 3;
      s = { n, diff: d, links: true, unique: true };
    }
    // Every 5th level is one step easier, except levels that introduce something new.
    if (L > 5 && L % 5 === 1 && [11, 21, 31, 41].indexOf(L) < 0) s.diff = Math.max(1, s.diff - 1);
    s.seed = 'level-' + L;
    return s;
  }

  // Daily: weekday rotation, easier early in the week, never Expert, never 10x10.
  const DAILY = [
    { n: 8, diff: 3 }, // Sun
    { n: 6, diff: 1 }, // Mon
    { n: 6, diff: 2 }, // Tue
    { n: 8, diff: 1 }, // Wed
    { n: 8, diff: 2 }, // Thu
    { n: 6, diff: 3 }, // Fri
    { n: 8, diff: 3 }, // Sat
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
    return { n: r.n, diff: r.diff, links: true, unique: true, seed: 'daily-' + t.key };
  }
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function dateLabel(t) { return MONTHS[t.m] + ' ' + t.day + ', ' + t.y; }

  OP.config = {
    VERSION: '0.1.44',
    DIFFS,
    SIZES: [4, 6, 8, 10],
    coins: [0, 10, 20, 30, 50],      // by diff (1..4)
    tutorialCoins: 10,
    drop: [0, 0, 0, 0.25, 0.4],      // bonus booster chance by diff (Levels only)
    adGives: { hint: 3, check: 2, reveal: 1 },
    adCooldown: 180000,
    adSeconds: 3,
    login: [
      { coins: 50 }, { skin: 'catdog' }, { hint: 3 }, { hint: 3 },
      { coins: 100 }, { skin: 'ninjapirate' }, { hint: 5 },
    ],
    levelSpec, dailySpec, today, dayKeyOffset, dateLabel,
  };
})();
