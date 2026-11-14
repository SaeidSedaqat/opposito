// Opposito: one shared set of UI sounds (Web Audio) plus relaxing looped music. All CC0.
(function () {
  'use strict';
  const OP = window.OP;
  const NAMES = ['click', 'fire', 'ice', 'clear', 'line', 'wrong', 'win', 'coin', 'hint', 'undo', 'open', 'close', 'reward', 'daily'];
  let ctx = null, master = null;
  const buf = {};
  let music = null, ducked = false, unlocked = false;
  const last = {};

  function settings() { return OP.save.d.settings; }

  function initCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
    const bin = window.OP_BIN || {};
    NAMES.forEach((n) => {
      const ab = bin[n];
      if (!ab) return;
      try {
        const p = ctx.decodeAudioData(ab.slice(0), (b) => { buf[n] = b; }, () => {});
        if (p && p.catch) p.catch(() => {});
      } catch (e) { /* ignore */ }
    });
  }

  function unlock() {
    if (unlocked) return;
    if (document.getElementById('loading')) return; // ignore taps on the loading screen itself
    unlocked = true;
    initCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    syncMusic();
  }
  ['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));

  function play(name, vol, rate) {
    if (!settings().sound || !ctx || !buf[name]) return;
    const now = performance.now();
    if (last[name] && now - last[name] < 35) return;
    last[name] = now;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const s = ctx.createBufferSource(); s.buffer = buf[name];
    if (rate) s.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = vol == null ? 1 : vol;
    s.connect(g); g.connect(master); s.start();
  }

  function syncMusic() {
    if (!unlocked) return;
    const want = settings().music && !ducked && !document.hidden;
    if (want) {
      if (!music) {
        music = new Audio('assets/audio/music.mp3?v=' + OP.config.VERSION);
        music.loop = true; music.volume = 0.42; music.preload = 'auto';
      }
      if (music.paused) { const p = music.play(); if (p && p.catch) p.catch(() => {}); }
    } else if (music && !music.paused) music.pause();
  }
  document.addEventListener('visibilitychange', () => {
    if (ctx) { if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {}); }
    syncMusic();
  });

  OP.audio = {
    play,
    syncMusic,
    duck(on) { ducked = !!on; syncMusic(); },
  };
})();
