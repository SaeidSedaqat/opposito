// Opposito: one shared set of UI sounds (Web Audio) plus relaxing looped music. All CC0.
(function () {
  'use strict';
  const OP = window.OP;
  const NAMES = ['click', 'fire', 'clear', 'line', 'wrong', 'win', 'coin', 'hint', 'undo', 'open', 'close', 'reward', 'daily'];
  let ctx = null, master = null;
  const buf = {};
  let ducked = false, unlocked = false;
  const last = {};
  // Per-sound level trims, applied to every play of that sound.
  const BASE = { click: 0.55 };

  function settings() { return OP.save.d.settings; }

  function initCtx() {
    if (ctx) return;
    // Safari 16.4+: "ambient" game audio mixes with other apps and never claims the lock-screen player.
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* ignore */ }
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
    const g = ctx.createGain(); g.gain.value = (vol == null ? 1 : vol) * (BASE[name] || 1);
    s.connect(g); g.connect(master); s.start();
  }

  // Music runs through Web Audio (a looping buffer), not an <audio> element: iOS shows a lock-screen
  // "Now Playing" player for any <audio> element, and the game should never appear there.
  let mBuf = null, mLoading = false, mSrc = null, mGain = null, mT0 = 0, mOff = 0;
  function loadMusic() {
    if (mBuf || mLoading || !ctx) return;
    mLoading = true;
    fetch('assets/audio/music.mp3?v=' + OP.config.VERSION).then((r) => r.arrayBuffer())
      .then((ab) => new Promise((res, rej) => { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); }))
      .then((b) => { mBuf = b; mLoading = false; syncMusic(); })
      .catch(() => { mLoading = false; setTimeout(loadMusic, 3000); }); // retry quietly on a bad connection
  }
  function syncMusic() {
    if (!unlocked || !ctx) return;
    const want = settings().music && !ducked && !document.hidden;
    if (want) {
      if (!mBuf) { loadMusic(); return; }
      if (mSrc) return;
      if (!mGain) { mGain = ctx.createGain(); mGain.gain.value = 0.26; mGain.connect(ctx.destination); }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      mSrc = ctx.createBufferSource(); mSrc.buffer = mBuf; mSrc.loop = true; mSrc.connect(mGain);
      mSrc.start(0, mOff % mBuf.duration); mT0 = ctx.currentTime;
    } else if (mSrc) {
      mOff = (mOff + ctx.currentTime - mT0) % mBuf.duration; // resume from the same spot later
      try { mSrc.stop(); } catch (e) { /* ignore */ }
      mSrc.disconnect(); mSrc = null;
    }
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
