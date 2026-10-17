/* =====================================================================
   Life — big speaking characters ("actors"), drawn live on a 100x140
   canvas at the same pixel scale as the scenes. ACTORS[name](ctx, t, expr)
   Expressions: smile happy sad cry surprised angry soft serious tongue sleep gift wave
   ===================================================================== */
(function () {
  const { R, P, disc, ell, wrap, sparkle, text3 } = window.PX;
  const AW = 100, AH = 140;
  const bobOf = (t, sp = 2.6) => (Math.sin(t * sp) > 0 ? 1 : 0);

  /* ---------- shared face parts ---------- */
  function eyes(c, o, t) {
    // o: lx, rx, y (top of 5x5 eye boxes), iris, lash, skin, expr, seed
    const { lx, rx, y, iris, lash, expr } = o;
    const blink = wrap(t + (o.seed || 0), 3.9) < 0.13;
    const closedHappy = expr === 'happy' || expr === 'tongue';
    const closedSleep = expr === 'sleep';
    const crying = expr === 'cry';
    for (const x of [lx, rx]) {
      if (closedHappy) { P(c, lash, x, y + 3); P(c, lash, x + 1, y + 2); P(c, lash, x + 2, y + 1); P(c, lash, x + 3, y + 2); P(c, lash, x + 4, y + 3); continue; }
      if (closedSleep || blink) { R(c, lash, x, y + 3, 5, 1); if (closedSleep) P(c, lash, x + (x === lx ? 0 : 4), y + 2); continue; }
      if (crying) { P(c, lash, x, y + 2); R(c, lash, x + 1, y + 3, 3, 1); P(c, lash, x + 4, y + 2); continue; }
      const big = expr === 'surprised';
      const half = expr === 'angry' || expr === 'serious';
      const down = expr === 'sad' || expr === 'soft' ? 1 : 0;
      R(c, '#ffffff', x, y + 1, 5, big ? 4 : 3);
      if (big) { R(c, iris, x + 1, y + 2, 3, 2); P(c, '#1b1416', x + 2, y + 2); }
      else { R(c, iris, x + 1, y + 1 + down, 3, 3 - down); R(c, '#1b1416', x + 2, y + 2 + down, 1, 2 - down); P(c, '#ffffff', x + 1, y + 1 + down); }
      R(c, lash, x - (big ? 0 : 1), y - (big ? 1 : 0), 6 + (big ? 0 : 1), 1);
      if (half) R(c, o.skin, x, y + 1, 5, 1), R(c, lash, x, y + 1, 5, 1);
    }
    if (crying) {
      // streaming tears
      for (const [x, dir] of [[lx, -1], [rx + 4, 1]]) {
        for (let k = 0; k < 6; k++) { const yy = y + 4 + k; if (wrap(t * 6 - k, 3) < 2) P(c, '#7fd3ff', x + (k > 3 ? dir : 0), yy); }
        const d = wrap(t * 1.2 + (dir > 0 ? 0.5 : 0), 1); if (d < 0.8) P(c, '#bfeaff', x + dir, y + 10 + Math.round(d * 14));
      }
    }
  }
  function brows(c, o) {
    const { lx, rx, y, col, expr } = o; const by = y - 3 - (expr === 'surprised' ? 2 : 0);
    const sl = expr === 'angry' || expr === 'grumpy' ? 1 : (expr === 'sad' || expr === 'cry' || expr === 'soft') ? -1 : 0;
    // left brow: inner end is right side
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const dl = sl === 1 ? Math.round(k * 2) : sl === -1 ? -Math.round(k * 2) : 0;          // left brow inner (i=4) goes down if angry
      const dr = sl === 1 ? Math.round((1 - k) * 2) : sl === -1 ? -Math.round((1 - k) * 2) : 0; // right brow inner is i=0
      P(c, col, lx + i, by + dl + (sl === -1 ? 2 : 0)); P(c, col, rx + i, by + dr + (sl === -1 ? 2 : 0));
      if (o.thick) { P(c, col, lx + i, by + dl + (sl === -1 ? 2 : 0) - 1); P(c, col, rx + i, by + dr + (sl === -1 ? 2 : 0) - 1); }
    }
  }
  function mouth(c, mx, my, expr, t, dark = '#5a2230', pink = '#ff8fa3') {
    switch (expr) {
      case 'happy': case 'gift':
        R(c, dark, mx - 4, my, 8, 1); R(c, dark, mx - 3, my + 1, 6, 1); R(c, pink, mx - 2, my + 1, 4, 1); R(c, dark, mx - 2, my + 2, 4, 1); R(c, '#ffffff', mx - 3, my, 6, 1); break;
      case 'sad': case 'soft':
        if (expr === 'soft') { P(c, dark, mx - 3, my); R(c, dark, mx - 2, my + 1, 4, 1); P(c, dark, mx + 2, my); }
        else { P(c, dark, mx - 3, my + 1); R(c, dark, mx - 2, my, 4, 1); P(c, dark, mx + 2, my + 1); } break;
      case 'cry': { const w = Math.sin(t * 12) > 0 ? 1 : 0; R(c, dark, mx - 3, my, 6, 1); R(c, dark, mx - 4, my + 1, 8, 1 + w); R(c, pink, mx - 2, my + 1, 4, 1); R(c, dark, mx - 3, my + 2 + w, 6, 1); break; }
      case 'surprised': R(c, dark, mx - 1, my - 1, 3, 1); R(c, dark, mx - 2, my, 1, 2); R(c, dark, mx + 2, my, 1, 2); R(c, pink, mx - 1, my, 3, 2); R(c, dark, mx - 1, my + 2, 3, 1); break;
      case 'angry': R(c, dark, mx - 4, my, 8, 3); R(c, '#ffffff', mx - 3, my + 1, 6, 1); P(c, dark, mx, my + 1); break;
      case 'grumpy': P(c, dark, mx - 3, my + 1); R(c, dark, mx - 2, my, 5, 1); P(c, dark, mx + 3, my + 1); break;
      case 'serious': R(c, dark, mx - 2, my, 5, 1); break;
      case 'tongue': R(c, dark, mx - 3, my - 1, 7, 3); R(c, '#ff6f8f', mx - 2, my, 5, 5); R(c, '#e04870', mx, my + 1, 1, 3); R(c, '#ff9fb5', mx - 2, my + 4, 5, 1); break;
      case 'sleep': R(c, dark, mx - 1, my, 3, 1); break;
      default: P(c, dark, mx - 3, my); R(c, dark, mx - 2, my + 1, 5, 1); P(c, dark, mx + 3, my);
    }
  }
  function zzz(c, x, y, t) { for (let i = 0; i < 3; i++) { const ph = wrap(t * 0.5 + i / 3, 1); if (ph < 0.9) text3(c, '#ffffff', 'Z', Math.round(x + ph * 10 + i), Math.round(y - ph * 18)); } }
  function line(c, col, x0, y0, x1, y1, w = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (let i = 0; i <= n; i++) { const k = n ? i / n : 0; R(c, col, Math.round(x0 + (x1 - x0) * k - w / 2), Math.round(y0 + (y1 - y0) * k - w / 2), w, w); }
  }
  function shadeRight(c, col, x, y, w, h) { R(c, col, x + w - 3, y, 3, h); }

  /* ---------- SAMARA: blonde, always smiling, red dress ---------- */
  function samara(c, t, expr = 'smile') {
    const b = bobOf(t), top = 14 + b;
    const H = '#ffd866', Hs = '#e5ae3a', Hl = '#fff2ad', skin = '#ffdcc6', skinS = '#f1b89d';
    const red = '#e8303f', redS = '#b81f2e', redL = '#ff6a6a';
    // back hair
    R(c, Hs, 33, top + 10, 34, 64); disc(c, H, 50, top + 14, 17); R(c, H, 34, top + 10, 32, 62);
    for (let x = 34; x < 66; x += 4) disc(c, x % 8 ? Hs : H, x + 2, top + 72, 2);
    // neck + dress
    R(c, skin, 46, top + 28, 9, 12); R(c, skinS, 46, top + 28, 9, 2);
    for (let y = top + 38; y < AH; y++) {
      const k = y - (top + 38); const w = Math.round(k < 22 ? 30 + k * 0.3 : 36 + (k - 22) * 0.45);
      R(c, red, 50 - w / 2, y, w, 1); R(c, redS, 50 + w / 2 - 3, y, 3, 1); P(c, redL, 50 - w / 2 + 1, y);
    }
    R(c, skin, 47, top + 38, 7, 3); R(c, skin, 48, top + 41, 5, 1);
    ell(c, '#ffffff', 45, top + 40, 3, 2); ell(c, '#ffffff', 55, top + 40, 3, 2);
    R(c, redS, 36, top + 60, 29, 3); R(c, '#ffffff', 48, top + 59, 5, 4); P(c, redS, 50, top + 60);
    for (let y = top + 70; y < AH; y += 9) for (let x = 38 + ((y / 9) % 2) * 5; x < 64; x += 10) P(c, '#ff9a9a', x, y);
    // sleeves + arms
    disc(c, red, 33, top + 45, 6); disc(c, red, 67, top + 45, 6); P(c, redL, 31, top + 42); P(c, redL, 65, top + 42);
    R(c, skin, 28, top + 49, 5, 34); disc(c, skin, 30, top + 84, 3);
    if (expr === 'wave') {
      const w = Math.floor(t * 4) % 2;
      line(c, skin, 69, top + 48, 79 + w * 2, top + 24, 5); disc(c, skin, 80 + w * 2, top + 21, 4); R(c, skinS, 78 + w * 2, top + 18, 1, 3); R(c, skinS, 81 + w * 2, top + 17, 1, 3);
      if (w) { P(c, '#ffffff', 88, top + 16); P(c, '#ffffff', 89, top + 20); } else { P(c, '#ffffff', 74, top + 15); P(c, '#ffffff', 72, top + 19); }
    } else { R(c, skin, 68, top + 49, 5, 34); disc(c, skin, 70, top + 84, 3); R(c, skinS, 71, top + 49, 2, 34); }
    // face
    ell(c, skin, 50, top + 16, 13, 15); R(c, skinS, 61, top + 12, 1, 10);
    const ex = expr === 'wave' ? 'happy' : expr;
    brows(c, { lx: 40, rx: 55, y: top + 13, col: '#c98a2a', expr: ex });
    eyes(c, { lx: 40, rx: 55, y: top + 13, iris: '#3f8de0', lash: '#4a2a1a', skin, expr: ex, seed: 0.3 }, t);
    P(c, skinS, 50, top + 20); P(c, skinS, 49, top + 21);
    if (ex !== 'sad' && ex !== 'cry') { R(c, '#ffa3b0', 38, top + 21, 3, 1); R(c, '#ffa3b0', 59, top + 21, 3, 1); }
    mouth(c, 50, top + 24, ex, t);
    // front hair: cap + bangs + side locks + bow
    for (let y = top - 1; y < top + 9; y++) { const dy = y - (top + 14); const dx = Math.round(Math.sqrt(Math.max(0, 17 * 17 - dy * dy))); R(c, H, 50 - dx, y, dx * 2, 1); }
    for (let x = 37; x < 64; x++) { const len = 9 + ((x % 6) < 3 ? 2 : 0) + (x > 52 ? 1 : 0); R(c, H, x, top + 4, 1, len); }
    R(c, H, 34, top + 6, 4, 38); R(c, H, 62, top + 6, 4, 38); R(c, Hs, 34, top + 30, 2, 14); R(c, Hs, 64, top + 30, 2, 14);
    for (let i = 0; i < 9; i++) P(c, Hl, 41 + i, top + 2 + Math.round(Math.abs(i - 4) * 0.5));
    disc(c, red, 61, top + 1, 3); disc(c, red, 67, top + 1, 3); R(c, redS, 63, top, 3, 3);
  }

  /* ---------- OSVALDO (big) ---------- */
  function osvaldoBig(c, t, expr = 'grumpy') {
    const b = bobOf(t, 2.0); const shake = expr === 'cry' ? (Math.floor(t * 14) % 2) : 0;
    const top = 16 + b, X = shake;
    const skin = '#c48a5e', skinS = '#a8714a', beard = '#6c6258', beardL = '#857a6f', coat = '#7a5a3a', coatS = '#5f452c', coatL = '#8f6c48';
    // coat body
    for (let y = top + 36; y < AH; y++) { const k = y - (top + 36); const w = Math.min(66, 44 + k * 1.2); R(c, coat, 50 - w / 2 + X, y, w, 1); R(c, coatS, 50 + w / 2 - 4 + X, y, 4, 1); }
    R(c, '#4e6a5a', 44 + X, top + 36, 13, 30); R(c, '#3e5649', 44 + X, top + 36, 2, 30); // shirt
    R(c, coatS, 43 + X, top + 36, 1, 104); R(c, coatS, 57 + X, top + 36, 1, 104);
    R(c, '#6b4f33', 26 + X, top + 80, 8, 7); R(c, '#5a3f28', 64 + X, top + 92, 9, 6); // patches
    P(c, '#c9a35a', 41 + X, top + 50); P(c, '#c9a35a', 41 + X, top + 62);
    // head
    R(c, skin, 36 + X, top + 4, 28, 28); ell(c, skin, 50 + X, top + 18, 14, 16); R(c, skinS, 60 + X, top + 8, 3, 20);
    R(c, skin, 34 + X, top + 14, 3, 7); R(c, skinS, 34 + X, top + 16, 1, 3);
    const ex = expr === 'gift' ? 'smile' : expr;
    brows(c, { lx: 40 + X, rx: 55 + X, y: top + 13, col: '#2a1d1a', expr: ex === 'smile' ? 'happy' : ex, thick: true });
    eyes(c, { lx: 40 + X, rx: 55 + X, y: top + 13, iris: '#4a3524', lash: '#2a1d1a', skin, expr: ex === 'smile' ? 'happy' : ex === 'grumpy' ? 'serious' : ex, seed: 1.1 }, t);
    R(c, '#a8644a', 48 + X, top + 18, 4, 4); P(c, '#d79c70', 48 + X, top + 18); // nose
    P(c, '#8d6a4a', 39 + X, top + 21); P(c, '#8d6a4a', 59 + X, top + 9); P(c, '#8d6a4a', 57 + X, top + 22); P(c, '#8d6a4a', 42 + X, top + 7);
    // beard
    for (let y = top + 22; y < top + 40; y++) { const k = y - (top + 22); const w = Math.round(30 - Math.max(0, k - 8) * 1.6); R(c, beard, 50 - w / 2 + X, y, w, 1); }
    R(c, beardL, 40 + X, top + 25, 4, 3); R(c, beardL, 54 + X, top + 30, 3, 3); R(c, '#575048', 47 + X, top + 34, 6, 3);
    const mex = ex === 'smile' ? 'happy' : ex;
    R(c, beard, 44 + X, top + 24, 12, 4);
    mouth(c, 50 + X, top + 25, mex, t, '#3a2522', '#b05a5a');
    // beanie
    R(c, '#9a3b32', 34 + X, top - 4, 32, 10); disc(c, '#9a3b32', 50 + X, top - 2, 14);
    for (let x = 36; x < 64; x += 3) R(c, '#86332b', x + X, top - 6, 1, 10);
    R(c, '#7f2f28', 33 + X, top + 4, 34, 4); R(c, '#b64c40', 38 + X, top - 10, 14, 2); disc(c, '#d8d0c0', 50 + X, top - 15, 3);
    // arms / props
    if (expr === 'cry') {
      disc(c, skin, 38 + X, top + 18, 6); disc(c, skin, 62 + X, top + 18, 6); R(c, skinS, 34 + X, top + 20, 2, 4); R(c, skinS, 66 + X, top + 20, 2, 4);
      line(c, coat, 30 + X, top + 50, 36 + X, top + 24, 8); line(c, coat, 70 + X, top + 50, 64 + X, top + 24, 8);
      for (const tx of [44, 56]) { const d = wrap(t * 1.4 + tx, 1); P(c, '#7fd3ff', tx + X, top + 24 + Math.round(d * 16)); }
    } else {
      // right arm (viewer's right) holding the bitten onion
      line(c, coat, 72 + X, top + 44, 74 + X, top + 72, 9); disc(c, skin, 74 + X, top + 75, 5);
      const ox = 74 + X, oy = top + 66 + Math.round(Math.sin(t * 1.6));
      disc(c, '#a0569c', ox, oy, 7); disc(c, '#c27cc0', ox - 2, oy - 2, 4); P(c, '#e7c3ea', ox - 4, oy - 4); R(c, '#7d3e7c', ox - 6, oy + 1, 1, 3);
      R(c, '#f6efd9', ox + 3, oy - 6, 5, 5); P(c, '#ffffff', ox + 4, oy - 5); P(c, '#d7c9a8', ox + 3, oy - 2);
      R(c, '#7bbf4a', ox - 1, oy - 12, 2, 6); R(c, '#9bd85f', ox + 1, oy - 13, 1, 6);
      disc(c, skin, 74 + X, top + 75, 4); R(c, skinS, 71 + X, top + 75, 6, 1);
      if (expr === 'gift') {
        line(c, coat, 30, top + 46, 22, top + 66, 9); R(c, skin, 14, top + 66, 12, 5); R(c, skinS, 14, top + 70, 12, 1); P(c, skin, 13, top + 65);
        ell(c, '#9a9aa6', 20, top + 64, 3, 2); P(c, '#d6d6e0', 19, top + 63); P(c, '#6e6e7a', 22, top + 65);
        if (wrap(t, 1.6) < 0.5) sparkle(c, 24, top + 59, 1, '#ffffff');
      } else { line(c, coat, 28 + X, top + 44, 26 + X, top + 80, 9); disc(c, skin, 26 + X, top + 82, 4); }
    }
    if (expr === 'sleep') zzz(c, 68, top + 8, t);
    if (expr !== 'sleep') for (let i = 0; i < 2; i++) { const a = t * (4 + i) + i * 3; P(c, '#1b1416', Math.round(50 + Math.cos(a) * (24 + i * 4)), Math.round(top + 4 + Math.sin(a * 1.3) * 6)); }
  }

  /* ---------- TEACHER ---------- */
  function teacher(c, t, expr = 'smile') {
    const b = bobOf(t, 2.3), top = 16 + b;
    const H = '#5a3825', Hs = '#46291a', skin = '#f2c7a5', skinS = '#d9a283', card = '#4f9d69', cardS = '#3c7d52';
    disc(c, H, 50, top + 12, 16); disc(c, H, 50, top - 5, 7); disc(c, Hs, 52, top - 4, 3);
    R(c, skin, 46, top + 28, 9, 10); R(c, skinS, 46, top + 28, 9, 2);
    for (let y = top + 37; y < AH; y++) { const k = y - (top + 37); const w = Math.round(Math.min(64, 36 + k * 0.5)); R(c, card, 50 - w / 2, y, w, 1); R(c, cardS, 50 + w / 2 - 3, y, 3, 1); }
    for (let y = top + 37; y < AH; y++) { const k = y - (top + 37); const w = Math.max(4, 12 - Math.round(k * 0.1)); R(c, '#fdfbf4', 50 - w / 2, y, w, 1); }
    R(c, '#fdfbf4', 44, top + 36, 5, 3); R(c, '#fdfbf4', 52, top + 36, 5, 3); P(c, '#ffd23f', 50, top + 44);
    for (let y = top + 52; y < AH; y += 8) { P(c, '#e8e0cc', 46, y); P(c, '#e8e0cc', 54, y); }
    // arms holding a book
    line(c, card, 30, top + 42, 34, top + 70, 7); line(c, card, 70, top + 42, 66, top + 70, 7);
    R(c, '#c94a4a', 36, top + 62, 28, 16); R(c, '#a83636', 36, top + 76, 28, 2); R(c, '#fff4dc', 38, top + 63, 24, 1); R(c, '#ffe08a', 46, top + 67, 8, 6); R(c, '#c94a4a', 48, top + 69, 4, 2);
    disc(c, skin, 36, top + 70, 3); disc(c, skin, 64, top + 70, 3);
    // face
    ell(c, skin, 50, top + 16, 13, 15); R(c, skinS, 61, top + 12, 1, 10); R(c, skin, 35, top + 14, 2, 5); R(c, skin, 64, top + 14, 2, 5);
    const ex = expr;
    brows(c, { lx: 40, rx: 55, y: top + 13, col: '#3a2418', expr: ex });
    eyes(c, { lx: 40, rx: 55, y: top + 13, iris: '#5a3a24', lash: '#2a1a12', skin, expr: ex, seed: 2.2 }, t);
    // glasses
    const g = '#3a2a4a';
    R(c, g, 38, top + 11, 9, 1); R(c, g, 38, top + 18, 9, 1); R(c, g, 38, top + 11, 1, 8); R(c, g, 46, top + 11, 1, 8);
    R(c, g, 53, top + 11, 9, 1); R(c, g, 53, top + 18, 9, 1); R(c, g, 53, top + 11, 1, 8); R(c, g, 61, top + 11, 1, 8);
    R(c, g, 47, top + 13, 6, 1); R(c, g, 36, top + 13, 2, 1); R(c, g, 62, top + 13, 2, 1);
    const gl = wrap(t, 4.5); if (gl < 0.4) { const k = Math.floor(gl * 15); P(c, '#ffffff', 39 + k, top + 12); P(c, '#ffffff', 54 + k, top + 12); }
    P(c, skinS, 50, top + 20); P(c, skinS, 49, top + 21);
    if (ex === 'happy' || ex === 'smile' || ex === 'tongue') { R(c, '#ffa3b0', 38, top + 21, 3, 1); R(c, '#ffa3b0', 59, top + 21, 3, 1); }
    mouth(c, 50, top + 24, ex, t);
    if (ex === 'angry') { R(c, '#e04848', 58, top + 3, 1, 3); R(c, '#e04848', 57, top + 4, 3, 1); }
    // front hair: side-swept fringe
    for (let y = top - 3; y < top + 7; y++) { const dy = y - (top + 12); const dx = Math.round(Math.sqrt(Math.max(0, 16 * 16 - dy * dy))); R(c, H, 50 - dx, y, dx * 2, 1); }
    for (let i = 0; i < 16; i++) R(c, H, 37 + i, top + 4, 1, Math.max(1, 6 - Math.floor(i / 3)));
    R(c, H, 34, top + 4, 3, 16); R(c, H, 63, top + 4, 3, 14); R(c, Hs, 44, top + 1, 8, 1);
  }

  /* ---------- NURSE ---------- */
  function nurse(c, t, expr = 'smile') {
    const b = bobOf(t, 2.2), top = 18 + b;
    const H = '#2a2030', Hl = '#4a3a58', skin = '#e8b48c', skinS = '#c99070', uni = '#f4fbff', uniS = '#cfe3ef';
    disc(c, H, 50, top + 12, 16); R(c, H, 34, top + 12, 32, 20);
    R(c, skin, 46, top + 28, 9, 10); R(c, skinS, 46, top + 28, 9, 2);
    for (let y = top + 37; y < AH; y++) { const k = y - (top + 37); const w = Math.round(Math.min(62, 36 + k * 0.5)); R(c, uni, 50 - w / 2, y, w, 1); R(c, uniS, 50 + w / 2 - 3, y, 3, 1); }
    for (let i = 0; i < 6; i++) { P(c, uniS, 46 + i, top + 37 + i); P(c, uniS, 55 - i, top + 37 + i); }
    R(c, skin, 47, top + 37, 7, 3); R(c, skin, 48, top + 40, 5, 2);
    R(c, '#d9e8f2', 56, top + 52, 8, 7); R(c, '#4dc3ff', 58, top + 50, 1, 5); R(c, '#ff5a6e', 60, top + 50, 1, 4);
    // stethoscope
    for (let i = 0; i < 14; i++) { P(c, '#7a8090', 42 - Math.round(Math.sin(i / 13 * 3.14) * 3), top + 38 + i); P(c, '#7a8090', 58 + Math.round(Math.sin(i / 13 * 3.14) * 3), top + 38 + i); }
    R(c, '#7a8090', 44, top + 52, 13, 1); disc(c, '#9aa0ae', 50, top + 56, 3); P(c, '#e0e6f0', 49, top + 55);
    // arms + clipboard
    line(c, uni, 30, top + 42, 32, top + 74, 7); disc(c, skin, 32, top + 77, 3);
    line(c, uni, 70, top + 42, 66, top + 66, 7);
    R(c, '#a8754a', 58, top + 60, 16, 22); R(c, '#ffffff', 60, top + 63, 12, 17); R(c, '#9aa0ae', 63, top + 59, 6, 3);
    for (let y = top + 66; y < top + 78; y += 3) R(c, '#b8c4d4', 62, y, 8, 1); disc(c, skin, 64, top + 68, 3);
    // face
    ell(c, skin, 50, top + 16, 13, 15); R(c, skinS, 61, top + 12, 1, 10);
    brows(c, { lx: 40, rx: 55, y: top + 13, col: '#2a2030', expr });
    eyes(c, { lx: 40, rx: 55, y: top + 13, iris: '#3a2a2a', lash: '#1b1416', skin, expr, seed: 0.7 }, t);
    P(c, skinS, 50, top + 20); P(c, skinS, 49, top + 21);
    if (expr === 'smile') { R(c, '#f59a9a', 38, top + 21, 3, 1); R(c, '#f59a9a', 59, top + 21, 3, 1); }
    mouth(c, 50, top + 24, expr, t);
    // bob fringe + cap
    for (let y = top - 3; y < top + 7; y++) { const dy = y - (top + 12); const dx = Math.round(Math.sqrt(Math.max(0, 16 * 16 - dy * dy))); R(c, H, 50 - dx, y, dx * 2, 1); }
    for (let x = 37; x < 64; x++) R(c, H, x, top + 4, 1, 4 + ((x % 4) < 2 ? 1 : 0));
    R(c, H, 34, top + 6, 4, 26); R(c, H, 62, top + 6, 4, 26); R(c, Hl, 40, top - 1, 10, 1);
    R(c, '#ffffff', 38, top - 7, 24, 7); R(c, '#e4eef5', 38, top - 1, 24, 1); R(c, '#ff4d5e', 48, top - 6, 4, 5); R(c, '#ff4d5e', 47, top - 5, 6, 3);
  }

  /* ---------- KNIFE MAN ---------- */
  function knifeMan(c, t, expr = 'angry') {
    const b = bobOf(t, 3); const jit = Math.floor(t * 9) % 3 === 0 ? 1 : 0; const X = jit, top = 16 + b;
    const skin = '#f1c27d', skinS = '#d9a35f', hair = '#7a4a2a';
    for (let y = top + 36; y < AH; y++) { const k = y - (top + 36); const w = Math.round(Math.min(64, 42 + k * 0.7)); const x0 = Math.round(50 - w / 2) + X; R(c, '#f5f5f5', x0, y, w, 1); for (let x = x0 + 2; x < x0 + w; x += 5) R(c, '#1b1416', x, y, 2, 1); R(c, 'rgba(0,0,0,0.12)', x0 + w - 4, y, 4, 1); }
    R(c, skin, 46 + X, top + 28, 9, 9); R(c, skinS, 46 + X, top + 28, 9, 2);
    // left fist
    line(c, '#f5f5f5', 28 + X, top + 42, 30 + X, top + 66, 8); disc(c, skin, 31 + X, top + 70, 5); R(c, skinS, 28 + X, top + 70, 6, 1);
    // right arm raised with knife
    line(c, '#f5f5f5', 70 + X, top + 42, 78 + X, top + 30, 8); line(c, skin, 78 + X, top + 30, 80 + X, top + 18, 5); disc(c, skin, 80 + X, top + 16, 4);
    R(c, '#5a3a22', 79 + X, top + 7, 3, 9); R(c, '#3a2414', 78 + X, top + 13, 5, 1);
    for (let i = 0; i < 16; i++) { const w = i < 12 ? 3 : 15 - i; R(c, i % 3 ? '#c8ced8' : '#e6ebf2', 79 + X + (3 - w) / 2, top + 6 - i, w, 1); }
    if (wrap(t, 1.3) < 0.3) sparkle(c, 81 + X, top - 6, 2, '#ffffff');
    // head
    ell(c, skin, 50 + X, top + 16, 13, 15); R(c, skinS, 61 + X, top + 12, 1, 10); R(c, skin, 35 + X, top + 13, 2, 6); R(c, skin, 64 + X, top + 13, 2, 6);
    for (let i = 0; i < 18; i++) P(c, '#c49a62', 40 + X + (i * 7) % 20, top + 22 + (i * 3) % 7); // stubble
    brows(c, { lx: 40 + X, rx: 55 + X, y: top + 13, col: '#3a2414', expr: 'angry', thick: true });
    eyes(c, { lx: 40 + X, rx: 55 + X, y: top + 13, iris: '#3a5a2a', lash: '#1b1416', skin, expr: 'angry', seed: 0 }, t);
    R(c, skinS, 49 + X, top + 18, 2, 4);
    mouth(c, 50 + X, top + 24, 'angry', t, '#4a1a1a');
    R(c, '#e04848', 41 + X, top + 4, 1, 3); R(c, '#e04848', 40 + X, top + 5, 3, 1); // anger mark
    // cap
    R(c, hair, 36 + X, top + 4, 3, 8); R(c, hair, 61 + X, top + 4, 3, 8);
    R(c, '#e04848', 35 + X, top - 4, 30, 9); disc(c, '#e04848', 50 + X, top - 3, 12); R(c, '#b83030', 35 + X, top + 4, 30, 2); R(c, '#b83030', 62 + X, top + 2, 12, 3); R(c, '#ff7070', 40 + X, top - 9, 8, 2);
    if (wrap(t, 0.8) < 0.4) text3(c, '#e04848', '!', 20, 10, 2);
  }

  /* ---------- POLICE (phone call) ---------- */
  function police(c, t) {
    const b = bobOf(t, 1.8);
    // hand
    R(c, '#f2c7a5', 26, 92 + b, 48, 30); R(c, '#d9a283', 26, 118 + b, 48, 4); R(c, '#f2c7a5', 20, 96 + b, 8, 20);
    // phone
    const px = 28, py = 18 + b;
    R(c, '#1e1c26', px, py, 44, 86); R(c, '#1e1c26', px + 1, py - 1, 42, 88);
    for (let y = 0; y < 76; y++) R(c, y < 38 ? '#1f4fa8' : '#173c80', px + 3, py + 5 + y, 38, 1);
    R(c, '#3a3848', px + 17, py + 2, 10, 1);
    // badge
    const cx = px + 22, cy = py + 24;
    for (let i = 0; i < 12; i++) { const w = Math.round(10 - Math.max(0, i - 6) * 1.5); R(c, '#ffd23f', cx - w, cy - 8 + i, w * 2, 1); }
    R(c, '#e8a91c', cx - 2, cy - 4, 4, 5); P(c, '#fff3a3', cx - 6, cy - 7);
    text3(c, '#ffffff', 'POLICE', px + 10, py + 38); text3(c, '#ffe08a', '190', px + 16, py + 46);
    const sec = Math.floor(t) % 60; text3(c, '#9fc4ff', '00:' + String(sec).padStart(2, '0'), px + 12, py + 54);
    for (let i = 0; i < 7; i++) { const h = 2 + Math.round(Math.abs(Math.sin(t * 9 + i * 1.3)) * 7); R(c, '#7ae582', px + 8 + i * 4, py + 72 - h, 2, h); }
    disc(c, '#e04848', cx, py + 80, 3); R(c, '#ffffff', cx - 2, py + 80, 4, 1);
    // signal waves
    const w = Math.floor(t * 3) % 3;
    for (let k = 0; k <= w; k++) for (let a = -3; a <= 3; a++) P(c, '#ffffff', px + 50 + k * 4 + Math.round(Math.cos(a / 4) * 2), py + 10 + a + k * 0);
  }


  /* ---------- the stranger in the night street (menacing) ----------
     expr: menace (default) | laugh | smile                              */
  function stranger(c, t, expr = 'menace') {
    const laugh = expr === 'laugh', smile = expr === 'smile';
    const b = laugh ? (Math.floor(t * 8) % 2) : bobOf(t, 1.6); const X = 0, top = 18 + b;
    const skin = '#b98563', skinS = '#94654a', hood = '#26232e', hoodL = '#36323f', hoodD = '#17151c';
    // body: dark hoodie, broad shoulders
    for (let y = top + 34; y < AH; y++) { const k = y - (top + 34); const w = Math.round(Math.min(78, 50 + k * 0.9)); const x0 = Math.round(50 - w / 2); R(c, hood, x0, y, w, 1); R(c, hoodD, x0, y, 3, 1); R(c, hoodD, x0 + w - 3, y, 3, 1); }
    R(c, hoodD, 49, top + 40, 2, 60); // zipper
    for (let y = top + 42; y < AH; y += 4) P(c, '#6a6670', 50, y);
    // chain necklace
    for (let i = 0; i <= 14; i++) { const a = Math.PI * (i / 14); P(c, i % 2 ? '#e8c860' : '#b8902e', Math.round(50 - Math.cos(a) * 9), Math.round(top + 37 + Math.sin(a) * 6)); }
    // hood around head
    ell(c, hood, 50, top + 15, 19, 21); ell(c, hoodL, 46, top + 8, 10, 8);
    // face (in shadow)
    ell(c, skin, 50, top + 18, 12, 14); R(c, skinS, 38, top + 9, 24, 4);
    c.globalAlpha = 0.6; R(c, '#000000', 38, top + 4, 25, 9); c.globalAlpha = 0.3; R(c, '#000000', 38, top + 13, 25, 6); R(c, '#000000', 38, top + 4, 5, 26); R(c, '#000000', 58, top + 4, 5, 26); c.globalAlpha = 1; // hood shadow
    for (let i = 0; i < 22; i++) P(c, '#7a5440', 41 + (i * 7) % 18, top + 24 + (i * 5) % 7); // stubble
    // eyes: narrow, glinting
    const ey = top + 14;
    if (laugh) { for (const x of [41, 54]) { P(c, '#1b1416', x, ey + 2); P(c, '#1b1416', x + 1, ey + 1); P(c, '#1b1416', x + 2, ey + 1); P(c, '#1b1416', x + 3, ey + 1); P(c, '#1b1416', x + 4, ey + 2); } }
    else {
      for (const x of [41, 54]) { R(c, '#f2e27a', x, ey + 1, 5, 2); R(c, '#7a0a0a', x + 2, ey + 1, 2, 2); R(c, '#1b1416', x - 1, ey, 7, 1); c.globalAlpha = 0.25; R(c, '#f2e27a', x - 1, ey - 1, 7, 5); c.globalAlpha = 1; }
      if (wrap(t, 2.7) < 0.25) { P(c, '#ffffff', x0g(41), ey + 1); P(c, '#ffffff', 57, ey + 1); }
      // heavy brows angled down
      for (let i = 0; i < 6; i++) { P(c, '#1b1416', 40 + i, ey - 2 + Math.round(i / 3)); P(c, '#1b1416', 54 + i, ey - 1 - Math.round(i / 3) + 1); }
    }
    // scar over left eye
    R(c, '#d9a0a0', 43, ey - 4, 1, 9); P(c, '#d9a0a0', 42, ey - 3); P(c, '#d9a0a0', 44, ey + 3);
    R(c, skinS, 49, ey + 4, 2, 5); P(c, '#6a4434', 48, ey + 8); // nose
    // mouth
    const my = top + 27;
    if (laugh) { R(c, '#3a1414', 44, my - 1, 12, 5); R(c, '#f2eadc', 45, my - 1, 10, 1); P(c, '#ffd23f', 52, my - 1); R(c, '#8a2a2a', 47, my + 2, 6, 2); }
    else if (smile) { R(c, '#3a1414', 44, my, 12, 1); P(c, '#3a1414', 43, my - 1); P(c, '#3a1414', 56, my - 1); R(c, '#f2eadc', 45, my + 1, 10, 1); P(c, '#ffd23f', 52, my + 1); R(c, '#3a1414', 46, my + 2, 8, 1); }
    else { R(c, '#3a1414', 44, my + 1, 4, 1); R(c, '#3a1414', 48, my, 8, 1); P(c, '#ffd23f', 53, my + 1); }
    // cigarette (not while laughing) + smoke
    if (!laugh) {
      R(c, '#f2eadc', 55, my + 1, 7, 1); const glow = Math.sin(t * 3) > 0.3; P(c, glow ? '#ff7a2f' : '#c84a1a', 62, my + 1);
      for (let i = 0; i < 6; i++) { const k = wrap(t * 0.5 + i / 6, 1); c.globalAlpha = 0.5 * (1 - k); disc(c, '#9a96a8', Math.round(63 + Math.sin(k * 6 + i) * 3 + k * 6), Math.round(my - k * 30), 1 + Math.round(k * 2)); }
      c.globalAlpha = 1;
    }
    // laugh: "HA HA"
    if (laugh && wrap(t, 0.6) < 0.4) { text3(c, '#ffd23f', 'HA', 68, 8, 2); text3(c, '#ffd23f', 'HA', 76, 20, 2); }
    // menace: pointing finger forward
    if (!laugh && !smile) { disc(c, skin, 78, top + 62, 5); R(c, skin, 81, top + 58, 6, 3); R(c, hood, 66, top + 52, 12, 10); }
  }
  const x0g = (x) => x + 3;

  window.ACTORS = {
    Samara: samara, Osvaldo: osvaldoBig, Teacher: teacher, Nurse: nurse, 'Knife Man': knifeMan, Police: police, Stranger: stranger,
  };
  window.ACTOR_SIZE = { w: AW, h: AH };
  window.ActorParts = { samara, osvaldoBig, teacher, nurse, knifeMan, police };
})();
