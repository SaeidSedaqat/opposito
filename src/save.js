// Opposito: everything persists in localStorage under one key.
(function () {
  'use strict';
  const OP = window.OP;
  const KEY = 'opposito.save.v1';

  function defaults() {
    return {
      coins: 0,
      level: 1,
      skin: 'fireice',
      owned: ['fireice'],
      boosters: { hint: 3, check: 2, reveal: 1 },
      settings: { sound: true, music: true, auto: true },
      free: { n: 6, diff: 1, count: 0 },
      daily: { streak: 0, last: null, solved: null, dates: [] }, // solved: { date, time }
      login: { day: 0, last: null },
      lastAdAt: 0,
      cur: null, // { levels|free|daily: { key, pz, board, hist, elapsed, level } }
    };
  }

  function merge(base, data) {
    if (!data || typeof data !== 'object') return base;
    for (const k in base) {
      if (!(k in data)) continue;
      const b = base[k], d = data[k];
      if (b && typeof b === 'object' && !Array.isArray(b) && d && typeof d === 'object' && !Array.isArray(d)) base[k] = merge(b, d);
      else if (b === null || typeof d === typeof b || (Array.isArray(b) && Array.isArray(d))) base[k] = d;
    }
    return base;
  }

  let data = defaults();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) data = merge(defaults(), JSON.parse(raw));
  } catch (e) { /* storage unavailable: play without saving */ }
  if (!data.lastAdAt) data.lastAdAt = Date.now(); // no ad break in the first minutes of a fresh install

  let timer = null;
  function write() {
    clearTimeout(timer); timer = null;
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* quota or private mode */ }
  }

  OP.save = {
    get d() { return data; },
    persist() { write(); },
    soon() { if (!timer) timer = setTimeout(write, 120); },
    reset() {
      const keepSettings = data.settings;
      data = defaults();
      data.settings = keepSettings;
      data.lastAdAt = Date.now();
      write();
    },
  };
  window.addEventListener('pagehide', write);
  document.addEventListener('visibilitychange', () => { if (document.hidden) write(); });
})();
