/* Opposito puzzle engine: seeded generator, logic-only solver, difficulty rater.
   Runs both on the main thread (hints, checks) and inside a Web Worker (generation).
   Cell values: -1 empty, 0 = piece A (Fire), 1 = piece B (Ice).
   Tiers: 1 Easy (pairs, sandwiches, counts, links), 2 Medium (whole-line reasoning),
          3 Hard (one-step "what if" with basic rules), 4 Expert ("what if" with line reasoning). */
(function (root) {
  'use strict';

  // ---------- seeded RNG ----------
  function hashStr(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---------- line patterns ----------
  const PATS = {};
  function popcount(x) { let c = 0; while (x) { x &= x - 1; c++; } return c; }
  function patterns(n) {
    if (PATS[n]) return PATS[n];
    const out = [];
    for (let p = 0; p < (1 << n); p++) {
      if (popcount(p) !== n / 2) continue;
      let ok = true;
      for (let k = 0; k + 2 < n; k++) { const b = (p >> k) & 7; if (b === 0 || b === 7) { ok = false; break; } }
      if (ok) out.push(p);
    }
    return (PATS[n] = out);
  }

  // ---------- puzzle context ----------
  // Lines 0..n-1 are rows, n..2n-1 are columns.
  function ctx(n, links) {
    const lc = [];
    for (let r = 0; r < n; r++) { const a = []; for (let k = 0; k < n; k++) a.push(r * n + k); lc.push(a); }
    for (let c = 0; c < n; c++) { const a = []; for (let k = 0; k < n; k++) a.push(k * n + c); lc.push(a); }
    const inLine = lc.map(() => []);
    for (const [a, b] of links) {
      const ra = (a / n) | 0, rb = (b / n) | 0, ca = a % n, cb = b % n;
      if (ra === rb) inLine[ra].push([ca, cb]); else inLine[n + ca].push([ra, rb]);
    }
    return { n, h: n / 2, full: (1 << n) - 1, links: links.slice(), lc, inLine, pats: patterns(n) };
  }

  function lineKV(g, cells) {
    let K = 0, V = 0;
    for (let k = 0; k < cells.length; k++) { const v = g[cells[k]]; if (v >= 0) { K |= 1 << k; if (v) V |= 1 << k; } }
    return [K, V];
  }

  // ---------- Tier 1: basic rules ----------
  // mode 'apply': fills every deduction it finds, returns -1 contradiction / 0 nothing / 1 changed.
  // mode 'list' : returns an array of deductions (or null on contradiction) without changing g.
  function t1(g, P, mode, stats) {
    const list = mode === 'list' ? [] : null;
    let changed = 0;
    const put = (i, v, d) => {
      if (list) { d.i = i; d.v = v; d.tier = 1; list.push(d); return; }
      if (g[i] < 0) { g[i] = v; changed = 1; if (stats && d.kind === 'link') stats.link = true; }
    };
    for (const [a, b] of P.links) {
      const va = g[a], vb = g[b];
      if (va >= 0 && vb >= 0) { if (va === vb) return list ? null : -1; }
      else if (va >= 0) put(b, 1 - va, { kind: 'link', from: [a] });
      else if (vb >= 0) put(a, 1 - vb, { kind: 'link', from: [b] });
    }
    const n = P.n, h = P.h;
    for (let L = 0; L < 2 * n; L++) {
      const c = P.lc[L];
      for (let k = 0; k + 2 < n; k++) {
        const a = g[c[k]], b = g[c[k + 1]], d = g[c[k + 2]];
        if (a >= 0 && a === b && b === d) return list ? null : -1;
        if (a >= 0 && a === b && d < 0) put(c[k + 2], 1 - a, { kind: 'pair', p: a, line: L, from: [c[k], c[k + 1]] });
        if (b >= 0 && b === d && a < 0) put(c[k], 1 - b, { kind: 'pair', p: b, line: L, from: [c[k + 1], c[k + 2]] });
        if (a >= 0 && a === d && b < 0) put(c[k + 1], 1 - a, { kind: 'sand', p: a, line: L, from: [c[k], c[k + 2]] });
      }
      let ca = 0, cb = 0;
      for (let k = 0; k < n; k++) { const v = g[c[k]]; if (v === 0) ca++; else if (v === 1) cb++; }
      if (ca > h || cb > h) return list ? null : -1;
      if (ca === h && cb < h) { for (let k = 0; k < n; k++) if (g[c[k]] < 0) put(c[k], 1, { kind: 'count', p: 0, line: L }); }
      else if (cb === h && ca < h) { for (let k = 0; k < n; k++) if (g[c[k]] < 0) put(c[k], 0, { kind: 'count', p: 1, line: L }); }
    }
    return list ? list : changed;
  }

  function propagate1(g, P, stats) {
    for (;;) {
      const r = t1(g, P, 'apply', stats);
      if (r < 0) return false;
      if (!r) return true;
    }
  }

  // ---------- Tier 2: whole-line reasoning ----------
  function t2(g, P, mode, stats) {
    const list = mode === 'list' ? [] : null;
    let changed = 0;
    const n = P.n, full = P.full;
    for (let L = 0; L < 2 * n; L++) {
      const c = P.lc[L];
      const [K, V] = lineKV(g, c);
      if (K === full) continue;
      const il = P.inLine[L];
      let and = full, or = 0, cnt = 0;
      for (const p of P.pats) {
        if ((p & K) !== V) continue;
        let ok = true;
        for (let q = 0; q < il.length; q++) if ((((p >> il[q][0]) ^ (p >> il[q][1])) & 1) === 0) { ok = false; break; }
        if (!ok) continue;
        and &= p; or |= p; cnt++;
      }
      if (!cnt) return list ? null : -1;
      const f1 = and & ~K & full, f0 = ~or & ~K & full;
      if (!(f1 | f0)) continue;
      for (let k = 0; k < n; k++) {
        const bit = 1 << k;
        if (!((f1 | f0) & bit)) continue;
        const v = (f1 & bit) ? 1 : 0;
        if (list) list.push({ kind: 'line', i: c[k], v, line: L, tier: 2 });
        else if (g[c[k]] < 0) { g[c[k]] = v; changed = 1; }
      }
      if (list && list.length) return list; // one line at a time is plenty for hints
    }
    return list ? list : changed;
  }

  function propagate2(g, P, stats) {
    for (;;) {
      if (!propagate1(g, P, stats)) return false;
      const r = t2(g, P, 'apply', stats);
      if (r < 0) return false;
      if (!r) return true;
    }
  }

  // ---------- Tiers 3 & 4: one-step "what if" ----------
  // The solution is always known, so only the wrong value is tried: if it leads to a
  // contradiction, the right value is proven. lvl 1 = T1 propagation (Hard), 2 = T1+T2 (Expert).
  function trial(g, P, sol, lvl, mode) {
    let changed = 0;
    for (let i = 0; i < g.length; i++) {
      if (g[i] >= 0) continue;
      const h = Int8Array.from(g);
      h[i] = 1 - sol[i];
      const ok = lvl === 1 ? propagate1(h, P, null) : propagate2(h, P, null);
      if (!ok) {
        if (mode === 'first') return { kind: 'trial', i, v: sol[i], tier: lvl + 2 };
        g[i] = sol[i]; changed = 1;
      }
    }
    return mode === 'first' ? null : changed;
  }

  function isFull(g) { for (let i = 0; i < g.length; i++) if (g[i] < 0) return false; return true; }

  // Logic-only solve. Returns { ok, tier, g, stats }.
  function solve(P, g0, sol, maxTier) {
    const g = Int8Array.from(g0), stats = { link: false };
    let tier = 1;
    for (;;) {
      if (!propagate1(g, P, stats)) return { ok: false, tier, g, stats };
      if (isFull(g)) return { ok: true, tier, g, stats };
      if (maxTier >= 2) { const r = t2(g, P, 'apply', stats); if (r < 0) return { ok: false, tier, g, stats }; if (r) { tier = Math.max(tier, 2); continue; } }
      if (maxTier >= 3 && trial(g, P, sol, 1, 'apply')) { tier = Math.max(tier, 3); continue; }
      if (maxTier >= 4 && trial(g, P, sol, 2, 'apply')) { tier = 4; continue; }
      return { ok: false, tier, g, stats };
    }
  }

  // ---------- full solution ----------
  // Rows and columns are always kept distinct from each other: not a rule the player has to
  // reason about, just how every solution is built, so a "twin" row or column never comes up.
  function genSolution(n, rnd) {
    const pats = patterns(n), h = n / 2, full = (1 << n) - 1;
    for (let restart = 0; restart < 200; restart++) {
      const rows = [], ones = new Array(n).fill(0);
      let budget = 4000;
      const rec = (r) => {
        if (r === n) {
          const cols = new Set();
          for (let c = 0; c < n; c++) { let v = 0; for (let k = 0; k < n; k++) if ((rows[k] >> c) & 1) v |= 1 << k; if (cols.has(v)) return false; cols.add(v); }
          return true;
        }
        if (--budget < 0) return false;
        const order = shuffle(pats.slice(), rnd), left = n - 1 - r;
        for (const p of order) {
          if (rows.indexOf(p) >= 0) continue;
          if (r >= 2) {
            const a = rows[r - 1], b = rows[r - 2];
            if (a & b & p) continue;
            if (~(a | b | p) & full) continue;
          }
          let ok = true;
          for (let c = 0; c < n; c++) {
            const o = ones[c] + ((p >> c) & 1), z = r + 1 - o;
            if (o > h || z > h || o + left < h || z + left < h) { ok = false; break; }
          }
          if (!ok) continue;
          rows.push(p); for (let c = 0; c < n; c++) ones[c] += (p >> c) & 1;
          if (rec(r + 1)) return true;
          rows.pop(); for (let c = 0; c < n; c++) ones[c] -= (p >> c) & 1;
          if (budget < 0) return false;
        }
        return false;
      };
      if (rec(0)) {
        const g = new Int8Array(n * n);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g[r * n + c] = (rows[r] >> c) & 1;
        return g;
      }
    }
    throw new Error('no solution');
  }

  // Sparse, spread-out melt links between opposite neighbours.
  function pickLinks(n, sol, rnd, count) {
    const pairs = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      if (c + 1 < n && sol[i] !== sol[i + 1]) pairs.push([i, i + 1]);
      if (r + 1 < n && sol[i] !== sol[i + n]) pairs.push([i, i + n]);
    }
    shuffle(pairs, rnd);
    const used = new Set(), out = [];
    const near = (i) => { const r = (i / n) | 0, c = i % n; return [i, r > 0 ? i - n : -1, r < n - 1 ? i + n : -1, c > 0 ? i - 1 : -1, c < n - 1 ? i + 1 : -1]; };
    for (const pass of [true, false]) {
      for (const p of pairs) {
        if (out.length >= count) break;
        if (out.indexOf(p) >= 0 || used.has(p[0]) || used.has(p[1])) continue;
        if (pass && (near(p[0]).some((x) => used.has(x)) || near(p[1]).some((x) => used.has(x)))) continue;
        out.push(p); used.add(p[0]); used.add(p[1]);
      }
    }
    return out;
  }

  const LINK_DENSITY = 0.12;

  // opts: { n, diff (1..4), links, seed, require: 'link', attempts }
  function generate(opts) {
    const n = opts.n, target = opts.diff, maxAttempts = opts.attempts || [0, 30, 30, 40, 80][target];
    let best = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const rnd = mulberry32(hashStr(opts.seed + '#' + attempt));
      const sol = genSolution(n, rnd);
      const links = opts.links ? pickLinks(n, sol, rnd, Math.max(2, Math.round(n * n * LINK_DENSITY))) : [];
      const P = ctx(n, links);
      const g = Int8Array.from(sol);
      const order = shuffle([...Array(n * n).keys()], rnd);
      // Pass 1 with the cheap tier, pass 2 with the target tier.
      for (const t of target > 1 ? [1, target] : [1]) {
        for (const i of order) {
          if (g[i] < 0) continue;
          const v = g[i]; g[i] = -1;
          if (!solve(P, g, sol, t).ok) g[i] = v;
        }
      }
      // Easier boards: put a few solved cells back as givens.
      if (opts.extra) { const em = order.filter((i) => g[i] < 0); for (let k = 0; k < opts.extra && k < em.length; k++) g[em[k]] = sol[em[k]]; }
      // Drop links that join two given cells: they tell the player nothing.
      const keep = links.filter(([a, b]) => g[a] < 0 || g[b] < 0);
      const P2 = ctx(n, keep);
      const res = solve(P2, g, sol, 4);
      if (!res.ok) continue;
      let fits = true;
      if (opts.require === 'link') fits = !solve(ctx(n, []), g, sol, 4).ok;
      const out = { n, sol: Array.from(sol), givens: Array.from(g), links: keep, rating: res.tier, diff: target, seed: opts.seed, attempt };
      if (!fits) continue;
      if (res.tier === target) return out;
      if (!best || Math.abs(res.tier - target) < Math.abs(best.rating - target) ||
          (Math.abs(res.tier - target) === Math.abs(best.rating - target) && res.tier > best.rating)) best = out;
    }
    if (best) return best;
    // Requirement never met: fall back to a plain puzzle (should not happen in practice).
    return generate(Object.assign({}, opts, { require: null, seed: opts.seed + '*' }));
  }

  // ---------- player-facing helpers (main thread) ----------
  function ctxOf(pz) { return ctx(pz.n, pz.links); }

  // Next logical step from the player's board (assumed to have no wrong cells).
  // prefer: optional deduction kind to favour (tutorials).
  function nextStep(pz, board, prefer) {
    const P = ctxOf(pz), g = Int8Array.from(board.map((v) => (v == null ? -1 : v)));
    const l1 = t1(g, P, 'list');
    if (l1 && l1.length) {
      if (prefer) { const f = l1.find((d) => d.kind === prefer); if (f) return f; }
      return l1[0];
    }
    const l2 = t2(g, P, 'list');
    if (l2 && l2.length) {
      if (prefer) { const f = l2.find((d) => d.kind === prefer); if (f) return f; }
      return l2[0];
    }
    const sol = Int8Array.from(pz.sol);
    const d3 = trial(Int8Array.from(g), P, sol, 1, 'first');
    if (d3) return d3;
    const d4 = trial(Int8Array.from(g), P, sol, 2, 'first');
    if (d4) return d4;
    for (let i = 0; i < g.length; i++) if (g[i] < 0) return { kind: 'reveal', i, v: pz.sol[i], tier: 4 };
    return null;
  }

  // Cells that break a rule right now (for auto-highlight and the full-board check).
  // Returns { cells: Set, lines: Set }.
  function violations(pz, board) {
    const P = ctxOf(pz), n = P.n, g = board.map((v) => (v == null ? -1 : v));
    const cells = new Set(), lines = new Set();
    for (let L = 0; L < 2 * n; L++) {
      const c = P.lc[L];
      for (let k = 0; k + 2 < n; k++) {
        const a = g[c[k]];
        if (a >= 0 && a === g[c[k + 1]] && a === g[c[k + 2]]) { cells.add(c[k]); cells.add(c[k + 1]); cells.add(c[k + 2]); lines.add(L); }
      }
      const cnt = [0, 0];
      for (let k = 0; k < n; k++) if (g[c[k]] >= 0) cnt[g[c[k]]]++;
      // Too many of one piece: mark the player's pieces only, never the frozen givens (they are right).
      for (let p = 0; p < 2; p++) if (cnt[p] > P.h) { for (let k = 0; k < n; k++) if (g[c[k]] === p && !(pz.givens && pz.givens[c[k]] >= 0)) cells.add(c[k]); lines.add(L); }
    }
    for (const [a, b] of P.links) if (g[a] >= 0 && g[a] === g[b]) { cells.add(a); cells.add(b); }
    return { cells, lines };
  }

  // Lines that are complete and break no rule (for the soft completion glow).
  function goodLines(pz, board) {
    const P = ctxOf(pz), n = P.n, bad = violations(pz, board).lines, out = [];
    for (let L = 0; L < 2 * n; L++) {
      if (bad.has(L)) continue;
      if (P.lc[L].every((i) => board[i] != null && board[i] >= 0)) {
        const linkBad = P.links.some(([a, b]) => (P.lc[L].indexOf(a) >= 0 || P.lc[L].indexOf(b) >= 0) && board[a] >= 0 && board[a] === board[b]);
        if (!linkBad) out.push(L);
      }
    }
    return out;
  }

  const API = { hashStr, mulberry32, shuffle, patterns, ctx, solve, generate, nextStep, violations, goodLines, genSolution, pickLinks };

  // ---------- worker entry ----------
  if (typeof window === 'undefined' && typeof self !== 'undefined' && typeof importScripts === 'function') {
    self.onmessage = (e) => {
      const { id, opts } = e.data;
      try { self.postMessage({ id, puzzle: generate(opts) }); }
      catch (err) { self.postMessage({ id, error: String(err && err.message || err) }); }
    };
  } else {
    root.OP = root.OP || {};
    root.OP.Puzzle = API;
  }
})(typeof self !== 'undefined' ? self : this);
