// Opposito: boot. The loading screen's inline script runs this file last.
(function () {
  'use strict';
  const OP = window.OP;
  const DPR = window.devicePixelRatio || 1;

  function size() { return { w: Math.max(1, window.innerWidth), h: Math.max(1, window.innerHeight) }; }
  const sz = size();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    transparent: true,
    scale: { mode: Phaser.Scale.NONE, width: Math.round(sz.w * DPR), height: Math.round(sz.h * DPR), zoom: 1 / DPR },
    input: { activePointers: 2 },
    scene: [OP.game.Scene],
  });

  let resizeT = null;
  function doResize() {
    const s = size();
    try { game.scale.resize(Math.round(s.w * DPR), Math.round(s.h * DPR)); } catch (e) { /* ignore */ }
    OP.game.layout(s.w, s.h);
  }
  function onResizeSoon() { clearTimeout(resizeT); resizeT = setTimeout(doResize, 60); }
  window.addEventListener('resize', onResizeSoon);
  window.addEventListener('orientationchange', onResizeSoon);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) onResizeSoon(); });

  OP.game.layout(sz.w, sz.h);
  OP.ui.show('home'); // this alone triggers OP.game.onScreen('home'), which shows the login reward if due
})();
