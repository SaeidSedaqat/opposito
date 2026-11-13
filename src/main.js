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

  // ---------- dev mode: ?dev=1 ----------
  if (new URLSearchParams(location.search).get('dev') === '1') setupDevPanel();
  function setupDevPanel() {
    const p = document.createElement('div');
    p.id = 'devPanel';
    p.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;background:rgba(17,20,28,.92);' +
      'color:#8ef58e;font:11px/1.4 ui-monospace,Consolas,monospace;padding:8px 10px;border-radius:8px;' +
      'max-width:220px;box-shadow:0 4px 16px rgba(0,0,0,.4);';
    p.innerHTML =
      '<div style="font-weight:700;color:#fff;margin-bottom:4px;">DEV v' + OP.config.VERSION + '</div>' +
      '<div id="devInfo" style="color:#aab; margin-bottom:6px; white-space:pre;"></div>' +
      '<div style="display:flex;gap:4px;margin-bottom:4px;">' +
      '<input id="devLevel" type="number" min="1" style="width:48px;" value="' + OP.save.d.level + '">' +
      '<button id="devGo">go lvl</button></div>' +
      '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
      '<button id="devSolve">solve</button>' +
      '<button id="devCoins">+1000c</button>' +
      '<button id="devBoost">+boost</button>' +
      '<button id="devAd">skip ad</button>' +
      '<button id="devWipe">wipe</button>' +
      '</div>';
    document.body.appendChild(p);
    p.querySelectorAll('button').forEach((b) => { b.style.cssText = 'background:#2a3040;color:#fff;border:1px solid #444;border-radius:4px;padding:3px 6px;font:11px monospace;cursor:pointer;'; });
    const info = p.querySelector('#devInfo');
    setInterval(() => { const d = OP.game.devInfo(); info.textContent = 'mode:' + d.mode + ' lvl:' + d.level + ' n:' + d.n + ' diff:' + d.diff; }, 500);
    p.querySelector('#devGo').onclick = () => {
      const L = Math.max(1, parseInt(p.querySelector('#devLevel').value, 10) || 1);
      OP.save.d.level = L; OP.save.d.cur.levels = null; OP.save.persist();
      OP.ui.show('home'); OP.ui.refresh('home');
    };
    p.querySelector('#devSolve').onclick = () => OP.game.devSolve();
    p.querySelector('#devCoins').onclick = () => { OP.save.d.coins += 1000; OP.save.persist(); OP.ui.refresh(OP.ui.current); };
    p.querySelector('#devBoost').onclick = () => { const b = OP.save.d.boosters; b.hint += 20; b.check += 20; b.reveal += 20; OP.save.persist(); if (OP.game.refreshMarks) OP.game.refreshMarks(); };
    p.querySelector('#devAd').onclick = () => { OP.save.d.lastAdAt = Date.now(); OP.save.persist(); };
    p.querySelector('#devWipe').onclick = () => { OP.save.reset(); OP.game.clearCache(); OP.ui.show('home'); };
  }
})();
