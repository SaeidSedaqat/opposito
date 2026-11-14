// Opposito: DOM screens, modals, toasts and the placeholder ad overlay.
(function () {
  'use strict';
  const OP = window.OP;
  const S = () => OP.save.d;
  const C = OP.config;

  // ---------- original UI icons ----------
  const ICON = {
    gear: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.6 2h2.8l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.4 2.4-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.4 2.4-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-2.8l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.4-2.4 2-1.7a6 6 0 0 1 0-1.9l-2-1.7 1.4-2.4 2.5.9c.5-.4 1.1-.7 1.7-.9zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" transform="translate(0 1.5)"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 8h12l1 12.2c.1.9-.6 1.8-1.6 1.8H6.6c-1 0-1.7-.9-1.6-1.8z"/><path d="M9 10V7a3 3 0 0 1 6 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1.6" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.6" fill="currentColor"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M9 7H5V3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 7.2A8 8 0 1 1 4.6 15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    hint: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-4.2 12.6c.7.5 1.2 1.3 1.2 2.2V18h6v-1.2c0-.9.5-1.7 1.2-2.2A7 7 0 0 0 12 2z"/><rect x="9" y="19.3" width="6" height="2.7" rx="1.3" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.6 15.6L21 21" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M7.3 10.6l2.2 2.2 4-4.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    reveal: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 5C6.5 5 2.7 9.5 1.5 12c1.2 2.5 5 7 10.5 7s9.3-4.5 10.5-7C21.3 9.5 17.5 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3l9 8h-2.5v9.5h-5v-6h-3v6h-5V11H3z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.2v13.6c0 .8.9 1.3 1.6.8l10-6.8a1 1 0 0 0 0-1.6l-10-6.8C8.9 3.9 8 4.4 8 5.2z"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="5" y="10.5" width="14" height="10.5" rx="2.6" fill="currentColor"/></svg>',
    ad: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3.5" fill="currentColor"/><path d="M10 9v6l5-3z" fill="#fff"/></svg>',
    tick: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    help: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" opacity="0"/><path d="M9.2 9.3a2.8 2.8 0 0 1 5.5.8c0 1.6-1.3 2-2.1 2.7-.5.5-.6.9-.6 1.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/></svg>',
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#F5B83D"/><circle cx="12" cy="12" r="7.2" fill="#FFD36B"/><path d="M12 7.6l1.3 2.9 3.1.3-2.4 2 .8 3.1-2.8-1.7-2.8 1.7.8-3.1-2.4-2 3.1-.3z" fill="#F0A92E"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="5" rx="1.5" fill="currentColor"/><rect x="4.5" y="13" width="15" height="8" rx="1.5" fill="currentColor" opacity=".85"/><rect x="11" y="9" width="2" height="12" fill="#fff" opacity=".8"/><path d="M12 9C10 5 6 5 7 7.5S12 9 12 9zm0 0c2-4 6-4 5-1.5S12 9 12 9z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    music: '<svg viewBox="0 0 24 24"><path d="M9 17.5V5.5l11-2v12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="3" fill="currentColor"/><circle cx="17.5" cy="15.5" r="3" fill="currentColor"/></svg>',
    musicOff: '<svg viewBox="0 0 24 24"><path d="M9 17.5V5.5l11-2v12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="3" fill="currentColor"/><circle cx="17.5" cy="15.5" r="3" fill="currentColor"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  };
  // Button icons: generated WebP art (assets/art/ui); the SVGs above are only a fallback for keys without art.
  const ART = ['gear', 'bag', 'back', 'pause', 'undo', 'hint', 'check', 'reveal', 'home', 'play', 'lock', 'ad', 'tick', 'cross', 'help', 'coin', 'play-white', 'ad-white', 'restart-white', 'bag-white', 'sound-white', 'music-white', 'help-white', 'home-white'];
  const ic = (k) => '<i class="ico">' + (ART.indexOf(k) >= 0 ? '<img alt="" draggable="false" src="assets/art/ui/' + k + '.webp?v=' + OP.config.VERSION + '">' : ICON[k]) + '</i>';
  // Check / Reveal icons: their art over a little 3x3 grid that shows what they act on --
  // Check lights up one cell, Reveal a whole row.
  function gridIc(k) {
    const on = k === 'check' ? [4] : [3, 4, 5], col = k === 'check' ? '#3FA4E8' : '#2FBFAE';
    let cells = '';
    for (let j = 0; j < 9; j++) cells += '<rect x="' + (1 + (j % 3) * 8) + '" y="' + (1 + ((j / 3) | 0) * 8) + '" width="7" height="7" rx="1.6" fill="' + (on.indexOf(j) >= 0 ? col : '#D9DFE8') + '"/>';
    return '<i class="ico combo"><svg viewBox="0 0 25 25">' + cells + '</svg><img alt="" draggable="false" src="assets/art/ui/' + k + '.webp?v=' + OP.config.VERSION + '"></i>';
  }
  const flame = () => '<img class="flame" alt="" src="' + OP.skins.dataUri('fire', 64) + '">';

  function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function fmtTime(sec) { sec = Math.max(0, Math.floor(sec)); const m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }

  const root = document.getElementById('ui');
  const screens = {};
  let current = null;

  // ---------- screens ----------
  function show(name) {
    if (current === name) { refresh(name); screens[name].classList.add('on'); if (name === 'game' && OP.game) OP.game.onScreen(name); return; }
    const prev = current ? screens[current] : null;
    current = name;
    const el = screens[name];
    refresh(name);
    const go = () => {
      if (current !== name) return; // another screen was asked for while this one's art decoded
      if (prev) {
        prev.classList.remove('on');
        setTimeout(() => { if (current !== prev.dataset.name) prev.hidden = true; }, 220);
      }
      el.hidden = false;
      void el.offsetWidth;
      el.classList.add('on');
      if (OP.game) OP.game.onScreen(name);
    };
    if (name === 'game') go(); else whenDecoded(el, go);
  }
  // Phones (iOS especially) decode a new <img> lazily even when the file is already cached, so
  // art popped in a moment after a popup or the shop appeared. Wait for every image in el to
  // finish decoding (at most 450 ms) before showing it.
  function whenDecoded(el, cb) {
    const imgs = Array.from(el.querySelectorAll('img'));
    if (!imgs.length || !imgs[0].decode) { cb(); return; }
    let done = false;
    const fin = () => { if (!done) { done = true; cb(); } };
    Promise.all(imgs.map((i) => i.decode().catch(() => {}))).then(fin);
    setTimeout(fin, 450);
  }
  function refresh(name) { const f = renderers[name]; if (f) f(); }
  const renderers = {};

  function screen(name, html) {
    const el = h('<section class="screen" data-name="' + name + '" hidden>' + html + '</section>');
    root.appendChild(el);
    screens[name] = el;
    return el;
  }

  // ---------- "Loading..." between Home and a game (dots count 1, 2, 3, 1...) ----------
  const pload = h('<div class="pload" hidden><b>Loading<span class="dots">.</span></b></div>');
  root.appendChild(pload);
  let ploadT = null;
  function playLoading(on) {
    clearInterval(ploadT);
    if (on) {
      if (current && screens[current]) screens[current].classList.remove('on'); // fade the current screen out
      document.getElementById('game').style.opacity = '0'; // and the board (the canvas sits outside the screens)
      const dots = pload.querySelector('.dots'); let k = 1; dots.textContent = '.';
      ploadT = setInterval(() => { k = k % 3 + 1; dots.textContent = '...'.slice(0, k); }, 350);
      pload.hidden = false; void pload.offsetWidth; pload.classList.add('on');
    } else {
      pload.classList.remove('on');
      setTimeout(() => { if (!pload.classList.contains('on')) pload.hidden = true; }, 250);
    }
  }

  // ---------- Home ----------
  const home = screen('home',
    '<div class="homebody"><div class="homemid"><div class="logo big">' + logoHtml() + '</div>' +
    '<div class="menu">' +
    '<button class="btn primary big play" id="hLevels">' + ic('play-white') + '<span class="t" id="hLevelN">Level 1</span></button>' +
    '<button class="btn big green play" id="hFree">' + ic('play-white') + '<span class="t">Free Play</span></button>' +
    '<button class="btn big daily play" id="hDaily">' + ic('play-white') + '<span class="t">Daily Play</span><span class="s" id="hDailyS"></span></button>' +
    '</div></div>' +
    '<div class="footrow">' +
    '<button class="btn foot" id="hSet" aria-label="Settings">' + ic('gear') + '</button>' +
    '<button class="btn foot" id="hShop" aria-label="Shop">' + ic('bag') + '</button>' +
    '</div></div>');

  function logoHtml() {
    return '<img class="logoart" alt="Opposito" draggable="false" src="assets/art/ui/logo.webp?v=' + OP.config.VERSION + '">';
  }

  function dailyState() {
    const d = S().daily, t = C.today(), y = C.dayKeyOffset(t.key, -1);
    const streak = d.last === t.key || d.last === y ? d.streak : 0;
    const solved = d.solved && d.solved.date === t.key ? d.solved : null;
    return { streak, solved, t };
  }

  renderers.home = function () {
    home.querySelector('#hLevelN').textContent = 'Level ' + S().level;
    const ds = dailyState();
    // Nothing under Daily Play: a solved Daily is reported in a popup when the button is tapped.
    home.querySelector('#hDailyS').hidden = true;
  };
  home.querySelector('#hSet').onclick = () => openSettings();
  home.querySelector('#hShop').onclick = () => openShop();
  home.querySelector('#hLevels').onclick = () => OP.game.start('levels');
  home.querySelector('#hFree').onclick = () => openFree();
  home.querySelector('#hDaily').onclick = () => { const s = dailyState().solved; if (s) dailyDone(s); else OP.game.start('daily'); };
  function dailyDone(s) {
    modal('<div class="panel small daydone"><h2>Daily Play solved!</h2><div class="stats"><div><span>Time</span><b>' + fmtTime(s.time) + '</b></div></div>' +
      '<p>Come back tomorrow for a new puzzle.</p><button class="btn primary" data-x="close">OK</button></div>');
  }

  // ---------- Free Play (popup) ----------
  function openFree() {
    const m = modal('<div class="panel free"><h2>Free Play</h2>' +
      '<div class="lbl">Size</div><div class="pills" id="fSize"></div>' +
      '<div class="lbl">Difficulty</div><div class="pills" id="fDiff"></div>' +
      '<div class="freward">Reward' + ic('coin') + '<b id="fReward"></b></div>' +
      '<button class="btn primary big play" id="fPlay">' + ic('play-white') + '<span class="t">Play</span></button>' +
      '<button class="btn flat" data-x="close">Cancel</button></div>');
    const render = () => {
      const f = S().free;
      // Hardest difficulty each size can reliably produce: 4x4 Easy, 6x6 Medium, 8x8 Hard, 10x10 Expert.
      const top = { 4: 1, 6: 2, 8: 3, 10: 4 }[f.n] || 4;
      if (f.diff > top) f.diff = top;
      m.querySelector('#fSize').innerHTML = C.SIZES.map((n) => '<button class="pill' + (f.n === n ? ' on' : '') + '" data-n="' + n + '">' + n + '×' + n + '</button>').join('');
      m.querySelector('#fDiff').innerHTML = C.DIFFS.map((d, k) => '<button class="pill' + (f.diff === k + 1 ? ' on' : '') + '" data-d="' + (k + 1) + '"' + (k + 1 > top ? ' disabled' : '') + '>' + d + '</button>').join('');
      m.querySelector('#fReward').textContent = C.freeReward(f.n, f.diff);
    };
    render();
    m.querySelector('#fSize').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; S().free.n = +b.dataset.n; OP.save.soon(); OP.audio.play('click'); render(); };
    m.querySelector('#fDiff').onclick = (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; S().free.diff = +b.dataset.d; OP.save.soon(); OP.audio.play('click'); render(); };
    m.querySelector('#fPlay').onclick = () => m.close(() => OP.game.start('free'));
  }

  // ---------- Shop ----------
  const shop = screen('shop',
    '<div class="topbar tall"><button class="circ" id="sBack" aria-label="Back">' + ic('back') + '</button>' +
    '<h1 class="title">Shop</h1><span class="coins" id="sCoins"></span></div>' +
    '<div class="shopbody"><div class="cards" id="sCards"></div></div>');

  // Shop preview: the skin's two pieces side by side, big enough to see clearly.
  function miniBoard(sk) {
    const a = OP.skins.dataUri(sk.pa, 128), b = OP.skins.dataUri(sk.pb, 128);
    return '<div class="mini" style="background:linear-gradient(135deg,' + sk.bg[0] + ',' + sk.bg[1] + ')"><i><img alt="" src="' + a + '"></i><i><img alt="" src="' + b + '"></i></div>';
  }
  function skinState(sk) {
    const d = S();
    if (d.skin === sk.id) return { k: 'equipped', html: ic('tick') + 'Equipped' };
    if (d.owned.indexOf(sk.id) >= 0) return { k: 'equip', html: 'Equip' };
    const u = sk.unlock;
    if (u.type === 'coins') return { k: d.coins >= u.price ? 'buy' : 'poor', html: ic('coin') + u.price };
    if (u.type === 'ad') return { k: 'ad', html: ic('ad') + 'Watch ad', long: ic('ad-white') + 'Watch ad' };
    if (u.type === 'login') return { k: 'locked', html: 'Daily reward', long: ic('lock') + 'Day ' + u.day + ' reward' };
    return { k: 'locked', html: '' };
  }
  renderers.shop = function () {
    shop.querySelector('#sCoins').innerHTML = ic('coin') + '<b>' + S().coins + '</b>';
    shop.querySelector('#sCards').innerHTML = OP.skins.list.map((sk) => {
      const st = skinState(sk);
      return '<button class="card ' + st.k + '" data-id="' + sk.id + '">' + miniBoard(sk) +
        '<span class="nm">' + esc(sk.name) + '</span><span class="st ' + st.k + '">' + st.html + '</span></button>';
    }).join('');
  };
  // The shop can be opened from the pause menu: Back then returns to the game (and its pause menu).
  let shopBack = null;
  function openShop(back) { shopBack = back || null; show('shop'); }
  shop.querySelector('#sBack').onclick = () => { const b = shopBack; shopBack = null; if (b) b(); else show('home'); };
  shop.querySelector('#sCards').onclick = (e) => { const b = e.target.closest('.card'); if (b) cardTap(OP.skins.get(b.dataset.id)); };
  function cardTap(sk) {
    const st = skinState(sk);
    if (st.k === 'locked' && sk.unlock.type === 'login') loginModal(true);
    else skinAction(sk);
  }

  function skinAction(sk, after) {
    const d = S(), st = skinState(sk);
    if (st.k === 'equip') { d.skin = sk.id; OP.audio.play('click'); }
    else if (st.k === 'buy') { d.coins -= sk.unlock.price; d.owned.push(sk.id); d.skin = sk.id; OP.audio.play('coin'); toast(sk.name + ' unlocked!'); }
    else if (st.k === 'ad') {
      return rewardedAd(() => { if (d.owned.indexOf(sk.id) < 0) d.owned.push(sk.id); d.skin = sk.id; OP.save.persist(); OP.audio.play('reward'); toast(sk.name + ' unlocked!'); renderers.shop(); if (after) after(); });
    } else if (st.k === 'poor') { toast('Not enough coins yet'); OP.audio.play('wrong', 0.5); return; }
    else return;
    OP.save.persist();
    renderers.shop();
    if (after) after();
  }

  // ---------- Game HUD ----------
  const game = screen('game',
    '<button class="circ" id="gPause" aria-label="Pause">' + ic('pause') + '</button>' +
    '<div class="glabel" id="gLabel"><b id="gL1"></b><span id="gL2"></span></div>' +
    '<div class="gtimer" id="gTimer" hidden>0:00</div>' +
    '<div class="gmsg" id="gMsg"></div>' +
    '<div class="bar" id="gBar">' +
    '<button class="boost" data-b="undo" aria-label="Undo">' + ic('undo') + '</button>' +
    '<button class="boost" data-b="hint" aria-label="Hint">' + ic('hint') + '<em></em></button>' +
    '<button class="boost" data-b="check" aria-label="Check">' + gridIc('check') + '<em></em></button>' +
    '<button class="boost" data-b="reveal" aria-label="Reveal">' + gridIc('reveal') + '<em></em></button>' +
    '</div>' +
    '<div class="gen" id="gGen" hidden><i></i><span>Creating puzzle…</span></div>' +
    '<div class="gnums" id="gNums" hidden></div>' +
    '<div class="hand" id="gHand" hidden><i class="ring"></i>' +
    '<img alt="" draggable="false" src="assets/art/ui/hand.webp?v=' + OP.config.VERSION + '"></div>');

  game.querySelector('#gPause').onclick = () => OP.game.pause();
  game.querySelector('#gBar').onclick = (e) => { const b = e.target.closest('.boost'); if (b && !b.hidden) OP.game.booster(b.dataset.b); };

  const msgEl = game.querySelector('#gMsg');
  let msgTimer = null;
  function msg(text, opts) {
    opts = opts || {};
    clearTimeout(msgTimer);
    msgEl.classList.remove('show', 'bad', 'good');
    void msgEl.offsetWidth;
    msgEl.innerHTML = text ? (opts.tone === 'tut' || opts.tone === 'hint' ? '<span>' + text + '</span>' : text) : '';
    if (text) {
      msgEl.classList.add('show');
      if (opts.tone) msgEl.classList.add(opts.tone);
      if (opts.ms) msgTimer = setTimeout(() => { msgEl.classList.remove('show'); if (opts.after) opts.after(); }, opts.ms);
    }
  }

  // Position HUD pieces to match the board layout (CSS px).
  function placeHud(L) {
    const pause = game.querySelector('#gPause'), lab = game.querySelector('#gLabel'), tim = game.querySelector('#gTimer'), bar = game.querySelector('#gBar');
    const sx = L.safe;
    pause.style.left = sx.l + 12 + 'px'; pause.style.top = sx.t + 10 + 'px';
    tim.style.right = sx.r + 12 + 'px'; tim.style.left = 'auto'; tim.style.top = sx.t + 14 + 'px';
    if (L.compact) {
      // The board fills the right side here, so the timer sits beside the pause button instead.
      tim.style.left = sx.l + 12 + 75 + 12 + 'px'; tim.style.right = 'auto'; tim.style.top = sx.t + 30 + 'px';
      const colW = Math.max(120, L.x - sx.l - 24);
      lab.style.cssText = 'left:' + (sx.l + 12) + 'px;top:' + (sx.t + 94) + 'px;width:' + colW + 'px;transform:none;text-align:left;align-items:flex-start';
      msgEl.style.cssText = 'left:' + (sx.l + 12) + 'px;top:' + (sx.t + 166) + 'px;width:' + colW + 'px;transform:none;justify-content:flex-start;text-align:left;height:auto;min-height:40px';
    } else {
      lab.style.cssText = 'left:50%;top:' + (sx.t + 8) + 'px;transform:translateX(-50%);width:' + Math.max(120, L.W - 2 * 96) + 'px';
      msgEl.style.cssText = 'left:50%;top:' + (sx.t + 10 + (pause.offsetHeight || 60) + 6) + 'px;transform:translateX(-50%);width:' + Math.min(L.W - 24, 560) + 'px';
    }
    const bw = Math.min(Math.max(L.size, 280), 440, L.W - 16);
    bar.style.left = (L.x + L.size / 2 - bw / 2) + 'px';
    bar.style.top = (L.y + L.size + 12) + 'px';
    bar.style.width = bw + 'px';
    const gen = game.querySelector('#gGen');
    gen.style.left = L.x + 'px'; gen.style.top = L.y + 'px'; gen.style.width = L.size + 'px'; gen.style.height = L.size + 'px';
  }

  function setHud(o) {
    if (o.l1 != null) game.querySelector('#gL1').textContent = o.l1;
    if (o.l2 != null) game.querySelector('#gL2').textContent = o.l2;
    if (o.timer != null) game.querySelector('#gTimer').hidden = !o.timer;
    if (o.bar != null) game.querySelector('#gBar').hidden = !o.bar;
    if (o.gen != null) game.querySelector('#gGen').hidden = !o.gen;
  }
  function setTimer(sec) { game.querySelector('#gTimer').textContent = fmtTime(sec); }
  function setBoosters(state) {
    // state: { reveal: bool (show), armed: 'check'|'reveal'|null, undo: bool }
    const b = S().boosters;
    game.querySelectorAll('.boost').forEach((el) => {
      const k = el.dataset.b;
      if (k === 'reveal') el.hidden = !state.reveal;
      el.classList.toggle('armed', state.armed === k);
      if (k === 'undo') return; // Undo always looks available; with nothing to undo a tap simply does nothing
      el.classList.toggle('off', !!state.off);
      const em = el.querySelector('em');
      em.textContent = b[k] > 0 ? b[k] : '+';
      em.classList.toggle('plus', !(b[k] > 0));
    });
  }

  // Reveal's line numbers: one badge left of every row and one above every column. Hovering a
  // badge highlights its line, tapping it reveals that line. o: { n, x, y, size } in HUD px, or null.
  const nums = game.querySelector('#gNums');
  let numsKey = '';
  function setLineNums(o) {
    if (!o) { nums.hidden = true; numsKey = ''; return; }
    const key = [o.n, o.x, o.y, o.size].map((v) => Math.round(v)).join(',');
    nums.hidden = false;
    if (key === numsKey) return;
    numsKey = key;
    const pad = o.size * 0.03, cs = (o.size - 2 * pad) / o.n, b = 26;
    let html = '';
    for (let r = 0; r < o.n; r++) html += '<button class="lnum" data-l="' + r + '" style="left:' + Math.max(2, o.x - b / 2 - 2) + 'px;top:' + (o.y + pad + (r + 0.5) * cs - b / 2) + 'px">' + (r + 1) + '</button>';
    for (let c = 0; c < o.n; c++) html += '<button class="lnum" data-l="' + (o.n + c) + '" style="left:' + (o.x + pad + (c + 0.5) * cs - b / 2) + 'px;top:' + (o.y - b / 2 - 4) + 'px">' + (c + 1) + '</button>';
    nums.innerHTML = html;
  }
  nums.addEventListener('pointerover', (e) => { const b = e.target.closest('.lnum'); if (b) OP.game.hoverLine(+b.dataset.l); });
  nums.addEventListener('pointerout', (e) => { if (e.target.closest('.lnum')) OP.game.hoverLine(null); });
  nums.addEventListener('click', (e) => { const b = e.target.closest('.lnum'); if (b) OP.game.revealLine(+b.dataset.l); });

  const hand = game.querySelector('#gHand');
  // dbl: double-tap motion (tap, tap, rest 1 s, repeat) for a step that needs two taps.
  function pointer(x, y, dbl) {
    if (x == null) { hand.hidden = true; return; }
    hand.hidden = false;
    hand.style.left = x + 'px'; hand.style.top = y + 'px';
    hand.classList.remove('again', 'dbl'); void hand.offsetWidth; hand.classList.add(dbl ? 'dbl' : 'again');
  }

  // ---------- modals ----------
  const stack = [];
  // No popup ever scrolls: a panel taller than the screen is zoomed down until it fits (94% of the
  // window height). Refit when it opens, when its content changes and when the window resizes.
  function fitPanel(m) {
    const p = m && m.querySelector('.panel'); if (!p) return;
    p.style.zoom = '';
    const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;
    const hgt = p.getBoundingClientRect().height, avail = window.innerHeight * 0.94;
    if (hgt > avail) p.style.zoom = (s * avail / hgt).toFixed(4);
  }
  window.addEventListener('resize', () => requestAnimationFrame(() => stack.forEach(fitPanel)));
  function modal(html, opts) {
    opts = opts || {};
    const m = h('<div class="modal"><div class="scrim"></div>' + html + '</div>');
    root.appendChild(m);
    stack.push(m);
    void m.offsetWidth;
    fitPanel(m);
    whenDecoded(m, () => { if (!m.closing) m.classList.add('on'); }); // fade in once its art is ready
    const pnl = m.querySelector('.panel');
    if (pnl && window.MutationObserver) new MutationObserver(() => fitPanel(m)).observe(pnl, { childList: true, subtree: true, characterData: true });
    if (!opts.silent) OP.audio.play('open', 0.7);
    m.close = function (cb) {
      if (m.closing) return;
      m.closing = true;
      m.classList.remove('on');
      const i = stack.indexOf(m); if (i >= 0) stack.splice(i, 1);
      setTimeout(() => { m.remove(); if (cb) cb(); }, 200);
      if (opts.onClose) opts.onClose();
    };
    m.addEventListener('click', (e) => {
      const x = e.target.closest('[data-x="close"]');
      if (x) { OP.audio.play('close', 0.7); m.close(); }
      else if (e.target.classList.contains('scrim') && opts.dismiss !== false) { OP.audio.play('close', 0.7); m.close(); }
    });
    return m;
  }
  function modalOpen() { return stack.length > 0 || adOn; }

  // Settings and pause menu: Sound, Music (and in Settings, mistake highlighting) are buttons, not
  // switches. One tap flips the setting; the icon and label show its state, greyed out when off.
  const SET_BTN = { sound: 'Sound', music: 'Music' };
  // Icon-only orange buttons (pause menu and Settings): home footer shape, 30% smaller.
  function icb(id, art, label) { return '<button class="btn primary icb" id="' + id + '" aria-label="' + label + '">' + ic(art) + '</button>'; }
  function setBtn(k) { return '<button class="btn primary icb tgl" data-snd="' + k + '" aria-label="' + SET_BTN[k] + '">' + ic(k + '-white') + '</button>'; }
  function bindSetBtns(m) {
    const paint = () => m.querySelectorAll('[data-snd]').forEach((b) => {
      const k = b.dataset.snd, on = !!S().settings[k];
      b.classList.toggle('off', !on); // off: icon dimmed with a slash through it (CSS)
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    paint();
    m.querySelectorAll('[data-snd]').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.snd; S().settings[k] = !S().settings[k];
        OP.save.persist(); OP.audio.syncMusic(); paint();
      };
    });
  }

  function openSettings() {
    const m = modal('<div class="panel"><button class="xclose" data-x="close" aria-label="Close">' + ICON.cross + '</button><h2>Settings</h2>' +
      '<div class="icgrid">' + setBtn('sound') + setBtn('music') +
      icb('mHelp', 'help-white', 'How to play') + icb('mReset', 'restart-white', 'Reset progress') + '</div>' +
      '<div class="credit">Created by SaeidGD</div></div>');
    bindSetBtns(m);
    m.querySelector('#mHelp').onclick = () => openHelp();
    m.querySelector('#mReset').onclick = () => confirmBox('Reset progress?', 'Coins, levels, skins, boosters and streaks will be erased. This cannot be undone.', 'Reset', () => {
      OP.save.reset();
      if (OP.game) OP.game.clearCache();
      toast('Progress reset');
      m.close();
      refresh('home');
    });
  }

  function confirmBox(title, text, yes, onYes) {
    const m = modal('<div class="panel small"><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p>' +
      '<div class="row2"><button class="btn" data-x="close">Cancel</button><button class="btn warn" id="cYes">' + esc(yes) + '</button></div></div>');
    m.querySelector('#cYes').onclick = () => m.close(onYes);
  }

  function openPause(handlers) {
    const m = modal('<div class="panel small"><h2>Pause</h2><div class="icgrid">' +
      '<button class="btn primary icb wide" data-x="close" aria-label="Resume">' + ic('play-white') + '</button>' +
      icb('pRestart', 'restart-white', 'Restart') + icb('pShop', 'bag-white', 'Shop') +
      setBtn('sound') + setBtn('music') +
      icb('pHelp', 'help-white', 'How to play') + icb('pHome', 'home-white', 'Home') +
      '</div></div>', { onClose: handlers.onClose });
    bindSetBtns(m);
    m.querySelector('#pRestart').onclick = () => m.close(handlers.restart);
    m.querySelector('#pHelp').onclick = () => openHelp();
    m.querySelector('#pHome').onclick = () => m.close(handlers.home);
    m.querySelector('#pShop').onclick = () => m.close(handlers.shop);
  }

  // ---------- How to Play: the rules, each with a tiny valid/invalid example ----------
  function exPair(pieces, valid) {
    const sk = OP.skins.get(S().skin);
    const img = (v) => '<i><img alt="" src="' + OP.skins.dataUri(v === 0 ? sk.pa : sk.pb, 64) + '"></i>';
    return '<div class="ex-row ' + (valid ? 'ex-good' : 'ex-bad') + '">' + pieces.map(img).join('') +
      '</div>';
  }
  // a, b: the two pieces (0 or 1); same: = link, else 00d7. Green when the pair obeys the link.
  function exLink(a, b, same) {
    const sk = OP.skins.get(S().skin);
    const img = (v) => '<i><img alt="" src="' + OP.skins.dataUri(v === 0 ? sk.pa : sk.pb, 64) + '"></i>';
    const valid = (a === b) === !!same;
    return '<div class="ex-row ' + (valid ? 'ex-good' : 'ex-bad') + '">' + '<span class="ex-pair">' + img(a) + img(b) + '<b class="ex-link">' + (same ? '=' : '×') + '</b></span>' +
      '</div>';
  }
  function exGrid(rows, valid) {
    const sk = OP.skins.get(S().skin);
    const n = rows[0].length;
    const cells = rows.flat().map((v) => '<i><img alt="" src="' + OP.skins.dataUri(v === 0 ? sk.pa : sk.pb, 64) + '"></i>').join('');
    return '<div class="ex-row ' + (valid ? 'ex-good' : 'ex-bad') + '"><div class="ex-grid" style="--n:' + n + '">' + cells + '</div>' +
      '</div>';
  }
  function helpSection(title, text, examplesHtml) {
    return '<div class="help-rule"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="ex-group">' + examplesHtml + '</div></div>';
  }
  function helpSections() {
    const sk = OP.skins.get(S().skin);
    return {
      balance: () => helpSection('Balance', 'Every row and column has the same number of ' + sk.an + ' and ' + sk.bn + '.',
        exGrid([[0, 0, 1, 1]], true) + exGrid([[0, 0, 0, 1]], false)),
      three: () => helpSection('No three in a row', 'No more than two of the same piece back to back.',
        exPair([0, 0, 1], true) + exPair([0, 0, 0], false)),
      links: () => helpSection('Opposite ×', 'Two tiles with × between them must be opposite.',
        exLink(0, 1) + exLink(1, 0) + exLink(0, 0) + exLink(1, 1)),
      bonds: () => helpSection('Same =', 'Two tiles with = between them must be the same.',
        exLink(0, 0, true) + exLink(1, 1, true) + exLink(0, 1, true) + exLink(1, 0, true)),
    };
  }
  // only: optional array of section keys ('balance'|'three'|'links') to show just the new rule for a level.
  // only = 'all': every rule (the level-1 intro). onClose runs when the popup is dismissed.
  function openHelp(only, onClose) {
    const sections = helpSections(), all = only === 'all';
    if (all) only = null;
    const keys = only && only.length ? only : ['balance', 'three', 'links'].concat(all || S().level >= 16 ? ['bonds'] : []);
    const body = keys.map((k) => sections[k] ? sections[k]() : '').join('');
    const sub = only && only.length && only.indexOf('balance') < 0 ? 'New rule for this level:' : 'Fill every tile so all the rules below hold at once.';
    modal('<div class="panel help"><h2>How to Play</h2><p class="sub">' + sub + '</p>' +
      body + '<button class="btn primary" data-x="close">Got it</button></div>', { onClose: onClose });
  }

  // Login reward track: seven separate days, never resets.
  function loginReward(r) {
    if (r.coins) return { icon: ic('coin'), text: r.coins + ' coins' };
    if (r.hint) return { icon: ic('hint'), text: r.hint + ' hints' };
    if (r.skin) { const sk = OP.skins.get(r.skin); return { icon: '<img alt="" src="' + OP.skins.dataUri(sk.pa, 64) + '"><img alt="" src="' + OP.skins.dataUri(sk.pb, 64) + '">', two: true, text: sk.name }; }
    return { icon: '', text: '' };
  }
  function maybeLogin() {
    const L = S().login, t = C.today();
    // Rewards were reshuffled in 0.1.144: hand over any skin from a day this player already claimed.
    C.login.slice(0, L.day).forEach((r) => { if (r.skin && S().owned.indexOf(r.skin) < 0) S().owned.push(r.skin); });
    if (L.day >= 7 || L.last === t.key) return false;
    loginModal(false);
    return true;
  }
  // The 7-day track. preview=true is the read-only look from the shop (Close instead of Claim).
  function loginModal(preview) {
    const L = S().login, t = C.today();
    const m = modal('<div class="panel login"><h2>Daily reward</h2><div class="days">' +
      C.login.map((r, k) => {
        const rw = loginReward(r), cls = k < L.day ? 'got' : (k === L.day ? 'now' : '');
        return '<div class="day ' + cls + (k === 6 ? ' wide' : '') + '"><span class="dn">Day ' + (k + 1) + '</span><span class="di' + (rw.two ? ' two' : '') + '">' + rw.icon + '</span><span class="dt">' + esc(rw.text) + '</span>' + (k < L.day ? '<span class="ok">' + ic('tick') + '</span>' : '') + '</div>';
      }).join('') + '' + (preview ? '</div><button class="btn big" data-x="close">Close</button></div>' : '</div><button class="btn primary big" id="lClaim">Claim</button></div>'), { dismiss: preview, silent: !preview });
    if (preview) return;
    OP.audio.play('daily', 0.9);
    m.querySelector('#lClaim').onclick = () => {
      const d = S(), r = C.login[d.login.day];
      d.login.day++; d.login.last = t.key;
      if (r.coins) d.coins += r.coins;
      if (r.hint) d.boosters.hint += r.hint;
      if (r.skin && d.owned.indexOf(r.skin) < 0) d.owned.push(r.skin);
      OP.save.persist();
      OP.audio.play('reward');
      toast(loginReward(r).text + ' added!');
      m.close();
    };
    return true;
  }

  // Booster refill: one rewarded ad grants 3 hints, 2 checks or 1 reveal.
  function boosterAd(pre, allowReveal, done) {
    const G = C.adGives;
    const opts = [['hint', G.hint, 'hints'], ['check', G.check, 'checks']];
    if (allowReveal) opts.push(['reveal', G.reveal, 'reveal']);
    let pick = pre;
    const m = modal('<div class="panel"><h2>Out of ' + (pre === 'reveal' ? 'reveals' : pre + 's') + '</h2><p class="sub">Watch a short ad and choose a reward.</p><div class="choices">' +
      opts.map((o) => '<button class="choice' + (o[0] === pick ? ' on' : '') + '" data-k="' + o[0] + '">' + ic(o[0]) + '<b>+' + o[1] + '</b><span>' + o[2] + '</span></button>').join('') +
      '</div><button class="btn primary big" id="bWatch">' + ic('ad-white') + '<span>Watch ad</span></button><button class="btn flat" data-x="close">No thanks</button></div>');
    const paint = () => {
      m.querySelectorAll('.choice').forEach((c) => c.classList.toggle('on', c.dataset.k === pick));
      const o = opts.find((x) => x[0] === pick);
      m.querySelector('#bWatch span').textContent = 'Watch ad for +' + o[1] + ' ' + o[2];
    };
    paint();
    m.querySelector('.choices').onclick = (e) => { const c = e.target.closest('.choice'); if (c) { pick = c.dataset.k; OP.audio.play('click'); paint(); } };
    m.querySelector('#bWatch').onclick = () => m.close(() => rewardedAd(() => {
      S().boosters[pick] += G[pick];
      OP.save.persist();
      OP.audio.play('reward');
      toast('+' + G[pick] + ' ' + opts.find((x) => x[0] === pick)[2]);
      if (done) done();
    }));
  }

  // ---------- placeholder ads ----------
  let adOn = false;
  function runAd(label, cb) {
    if (adOn) return;
    adOn = true;
    OP.audio.duck(true);
    if (OP.game) OP.game.adPause(true);
    const ov = h('<div class="adov"><div class="adbox"><div class="adtag">AD</div><div class="adtxt"></div></div></div>');
    document.body.appendChild(ov);
    void ov.offsetWidth; ov.classList.add('on');
    let n = C.adSeconds;
    const txt = ov.querySelector('.adtxt');
    const step = () => {
      txt.textContent = label + ' in ' + n;
      if (n === 0) {
        S().lastAdAt = Date.now(); OP.save.persist();
        ov.classList.remove('on');
        setTimeout(() => { ov.remove(); adOn = false; OP.audio.duck(false); if (OP.game) OP.game.adPause(false); if (cb) cb(); }, 220);
        return;
      }
      n--; setTimeout(step, 1000);
    };
    step();
  }
  function rewardedAd(cb) { runAd('Rewarded ad', cb); }
  function adBreak(cb) {
    if (Date.now() - S().lastAdAt < C.adCooldown) { cb(); return; }
    runAd('Ad break', cb);
  }

  // ---------- win panel ----------
  const WIN_WORDS = ['Congratulations!', 'Well done!', 'Amazing!', 'Brilliant!', 'Awesome!', 'Great job!', 'Fantastic!', 'Superb!', 'Nailed it!'];
  function openWin(o) {
    let body = '';
    if (o.mode === 'levels') {
      body = '<div class="reward">' + ic('coin') + '<b id="wCoins">+' + o.coins + '</b></div>' +
        (o.bonus ? '<div class="bonus">' + ic(o.bonus) + 'Bonus: +1 ' + o.bonus + '</div>' : '') +
        '<button class="btn gold dbl" id="wDouble" aria-label="Double coins">' + ic('ad') + 'x2' + ic('coin') + '</button>' +
        '<div class="row2"><button class="btn" id="wHome">Home</button><button class="btn primary" id="wNext">Next' + '</button></div>';
    } else if (o.mode === 'free') {
      body = (o.coins ? '<div class="reward">' + ic('coin') + '<b id="wCoins">+' + o.coins + '</b></div><button class="btn gold dbl" id="wDouble" aria-label="Double coins">' + ic('ad') + 'x2' + ic('coin') + '</button>' : '<p class="sub">' + esc(o.label) + '</p>') +
        '<div class="row2"><button class="btn" id="wHome">Home</button><button class="btn primary" id="wNext">Next</button></div>';
    } else {
      body = '<div class="stats"><div><span>Time</span><b>' + fmtTime(o.time) + '</b></div></div>' +
        '<button class="btn primary" id="wHome">Home</button>';
    }
    const m = modal('<div class="panel win"><h2 class="solved">' + WIN_WORDS[Math.floor(Math.random() * WIN_WORDS.length)] + '</h2>' + body + '</div>', { dismiss: false, silent: true });
    winFx(m);
    const nx = m.querySelector('#wNext'), hm = m.querySelector('#wHome'), db = m.querySelector('#wDouble');
    if (nx) nx.onclick = () => m.close(o.next);
    if (hm) hm.onclick = () => m.close(o.home);
    if (db) db.onclick = () => {
      db.disabled = true;
      rewardedAd(() => {
        S().coins += o.coins; OP.save.persist();
        OP.audio.play('coin');
        m.querySelector('#wCoins').dataset.done = '1';
        m.querySelector('#wCoins').textContent = '+' + o.coins * 2;
        db.innerHTML = ic('tick') + 'x2' + ic('coin');
      });
    };
  }

  // Win popup juice: slowly turning gold rays behind the panel (assets/art/fx/rays.webp, Bing),
  // a confetti shower, twinkling sparkles round the title and a coin count-up.
  function winFx(m) {
    const panel = m.querySelector('.panel');
    const rays = h('<div class="wrays"></div>');
    m.insertBefore(rays, panel);
    // The rays are zoomed by --s like the panel, so their top is given in zoomed px.
    const place = () => { const r = panel.getBoundingClientRect(), s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1; rays.style.top = (r.top / s + 40) + 'px'; };
    place(); setTimeout(place, 220);
    [[8, 14, 0], [84, 10, 0.5], [16, 52, 1], [78, 48, 1.4]].forEach((p) => {
      panel.appendChild(h('<div class="wspark" style="left:' + p[0] + '%;top:' + p[1] + 'px;animation-delay:' + p[2] + 's"></div>'));
    });
    const wc = m.querySelector('#wCoins');
    if (wc) {
      const to = parseInt(wc.textContent.replace(/\D/g, ''), 10) || 0, t0 = performance.now() + 250;
      wc.textContent = '+0';
      const step = (now) => {
        if (!m.isConnected || wc.dataset.done) return;
        const k = Math.max(0, Math.min(1, (now - t0) / 700));
        wc.textContent = '+' + Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step); else { wc.classList.add('pop'); OP.audio.play('coin', 0.6); }
      };
      requestAnimationFrame(step);
    }
    // Confetti on a canvas over the whole popup.
    const cv = h('<canvas class="confetti"></canvas>');
    m.appendChild(cv);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5), W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const cols = ['#FF6A45', '#3FA4E8', '#FFC23D', '#7ED957', '#FF8FC8', '#FFFFFF'];
    const bits = [];
    for (let k = 0; k < 60; k++) {
      bits.push({
        x: W / 2 + (Math.random() - 0.5) * 60, y: H * 0.42, vx: (Math.random() - 0.5) * 9, vy: -6 - Math.random() * 9,
        w: 6 + Math.random() * 6, h: 9 + Math.random() * 8, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.35,
        c: cols[k % cols.length], f: Math.random() * 6.28,
      });
    }
    const start = performance.now();
    const tick = (now) => {
      if (!m.isConnected) return;
      const t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, Math.min(1, 3.2 - t));
      bits.forEach((b) => {
        b.vy += 0.32; b.vx *= 0.985; b.vy = Math.min(b.vy, 3.2 + Math.sin(b.f + t * 4));
        b.x += b.vx + Math.sin(b.f + t * 3) * 0.6; b.y += b.vy; b.a += b.va;
        if (b.y > H + 20) return; // off screen: nothing to draw
        // One setTransform per bit (rotate + flip squash) instead of save/translate/rotate/scale/restore.
        const ca = Math.cos(b.a), sa = Math.sin(b.a), sq = Math.abs(Math.cos(b.f + t * 6)) * 0.8 + 0.2;
        ctx.setTransform(ca * dpr, sa * dpr, -sa * sq * dpr, ca * sq * dpr, b.x * dpr, b.y * dpr);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (t < 3.3) requestAnimationFrame(tick); else cv.remove();
    };
    requestAnimationFrame(tick);
  }

  // ---------- toast ----------
  let toastEl = null, toastT = null;
  function toast(text) {
    if (!toastEl) { toastEl = h('<div class="toast"></div>'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = esc(text);
    toastEl.classList.remove('on'); void toastEl.offsetWidth; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 1800);
  }

  // Every button: tap sound (press scale is CSS).
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && !b.disabled && !b.closest('[data-x]') && b.dataset.x == null && !b.classList.contains('boost') && !b.classList.contains('card') && !b.classList.contains('choice')) OP.audio.play('click', 0.8);
  }, true);
  document.addEventListener('dblclick', (e) => e.preventDefault());

  OP.ui = {
    show, refresh, get current() { return current; },
    msg, placeHud, setHud, setTimer, setBoosters, pointer, setLineNums,
    modal, modalOpen, openSettings, openPause, openShop, openHelp, openWin, maybeLogin, boosterAd,
    rewardedAd, adBreak, playLoading, toast, fmtTime, dailyState, logoHtml, esc,
  };
})();
