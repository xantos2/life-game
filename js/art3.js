/* =====================================================================
   Life — art, part 3 (v3): the night. Computer screen scenes, the farm
   mini-game (interactive), its horror twin, the night street, the
   pinpad box, and the stranger. Cutscene arts use opts.beat / opts.beatT.
   ===================================================================== */
(function () {
  const { W, H, R, P, disc, ell, mk, rng, bands, text3, sparkle, wrap, skyline, eyelids } = window.PX;
  const ART = window.ART;
  const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
  const lerp = (a, b, k) => a + (b - a) * k;
  const mix = (h1, h2, k) => { const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const ch = (s) => Math.round(lerp((a >> s) & 255, (b >> s) & 255, k)); return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1); };
  const alpha = (c, a, fn) => { c.globalAlpha = a; fn(); c.globalAlpha = 1; };
  const tw = (c, s, x, y, col, sc = 1) => text3(c, col, s, x, y, sc);
  const tCenter = (c, s, cx, y, col, sc = 1) => text3(c, col, s, Math.round(cx - (s.length * 4 * sc - sc) / 2), y, sc);

  /* ---------- the room around the computer ---------- */
  const SX = 58, SY = 10, SW = 204, SH = 110; // screen rect on the 320x180 canvas
  function room(c, t, o = {}) {
    const day = o.day, dawn = o.dawn || 0, flash = o.flash || 0, dark = o.powerOut;
    // wall
    if (day) bands(c, ['#f3e6cf', '#eedfc4', '#e8d6b8', '#e2cdac'], 0, 150);
    else bands(c, ['#0d0a1c', '#110d23', '#16112b', '#1b1532'], 0, 150);
    // wallpaper dots
    for (let y = 8; y < 146; y += 12) for (let x = (y / 12) % 2 ? 4 : 10; x < W; x += 12) P(c, day ? '#e0cba6' : '#211a3b', x, y);
    // window (left)
    const wx = 6, wy = 18, ww = 40, wh = 52;
    R(c, day ? '#c9b48e' : '#2a2340', wx - 3, wy - 3, ww + 6, wh + 6);
    if (day) bands(c, ['#8fd3ff', '#a9ddff', '#c4e8ff', '#def2ff'], wy, wy + wh, wx, ww);
    else {
      const top = mix('#05040c', '#3a2a5a', dawn), mid = mix('#0b0920', '#c46a7a', dawn), low = mix('#120f2a', '#ffb36b', dawn);
      bands(c, [top, mid, low], wy, wy + wh, wx, ww);
      if (dawn < 0.6) for (let i = 0; i < 7; i++) if (wrap(t * 0.7 + i * 0.37, 1) > 0.2) P(c, '#d8d4ff', wx + 3 + (i * 13) % 34, wy + 4 + (i * 7) % 26);
      if (o.rain) for (let i = 0; i < 18; i++) { const k = wrap(t * 1.8 + i * 0.137, 1); P(c, '#5a6aa0', wx + (i * 11) % ww, wy + Math.round(k * wh)); P(c, '#5a6aa0', wx + (i * 11) % ww, wy + Math.round(k * wh) + 1); }
      if (dawn > 0.4) disc(c, '#ffd27a', wx + 30, wy + wh + 8 - Math.round(dawn * 18), 6);
    }
    if (flash > 0) alpha(c, flash, () => R(c, '#e8ecff', wx, wy, ww, wh));
    R(c, day ? '#c9b48e' : '#2a2340', wx + ww / 2 - 1, wy, 2, wh); R(c, day ? '#c9b48e' : '#2a2340', wx, wy + wh / 2 - 1, ww, 2);
    // curtains (sway in draft)
    const sw = Math.round(Math.sin(t * 1.3) * 1);
    R(c, day ? '#e58fa8' : '#3b2346', wx - 6, wy - 6, 7 + sw, wh + 14); R(c, day ? '#e58fa8' : '#3b2346', wx + ww - 1 - sw, wy - 6, 7 + sw, wh + 14);
    // poster on the right wall
    R(c, day ? '#9ad1c0' : '#1d2a3a', 276, 22, 34, 44); R(c, day ? '#ffffff' : '#2c3f55', 279, 25, 28, 30); tw(c, 'LIFE', 285, 58, day ? '#2c1f45' : '#3d5470');
    if (!day) { disc(c, '#3d5470', 292, 38, 6); }
    // desk
    R(c, day ? '#a7774d' : '#2a1e2a', 0, 136, W, 44); R(c, day ? '#c08a5a' : '#3a2a38', 0, 136, W, 3);
    // monitor
    R(c, '#1e1c26', SX - 7, SY - 6, SW + 14, SH + 14); R(c, '#2e2b38', SX - 6, SY - 5, SW + 12, 2); R(c, '#14131a', SX - 7, SY + SH + 6, SW + 14, 2);
    R(c, '#1e1c26', 150, SY + SH + 8, 20, 8); R(c, '#2e2b38', 136, 134, 48, 3);
    P(c, o.screenOff ? '#3a1010' : '#7ae582', SX + SW + 3, SY + SH + 3);
    // screen light on the wall + desk
    if (!day && !o.screenOff && !dark) alpha(c, 0.10 + Math.sin(t * 7) * 0.01, () => { c.fillStyle = o.glow || '#7fb6ff'; c.fillRect(SX - 30, SY - 10, SW + 60, SH + 40); });
  }
  function screen(c, fn) { c.save(); c.beginPath(); c.rect(SX, SY, SW, SH); c.clip(); c.translate(SX, SY); fn(); c.restore(); }
  function scanlines(c, a = 0.10) { alpha(c, a, () => { for (let y = 0; y < SH; y += 2) R(c, '#000000', 0, y, SW, 1); }); }
  function cursor(c, x, y) { const A = ['1', '11', '121', '1221', '12221', '122221', '1222111', '1211', '11 1']; A.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ' ') P(c, r[i] === '1' ? '#1b1416' : '#ffffff', x + i, y + j); }); }
  function windowBox(c, x, y, w, h, title, col = '#4dc3ff') {
    R(c, '#2c1f45', x - 1, y - 1, w + 2, h + 2); R(c, '#fffaf0', x, y, w, h); R(c, col, x, y, w, 8); tw(c, title, x + 3, y + 2, '#ffffff');
    R(c, '#ff5d8f', x + w - 7, y + 2, 4, 4); R(c, '#ffffff', x + w - 6, y + 3, 2, 2);
  }

  /* ---------- icons used on screens ---------- */
  function iconTomato(c, x, y, s = 1) { disc(c, '#e8463a', x, y, 3 * s); P(c, '#ff8a7a', x - s, y - s); R(c, '#3fae4a', x - s, y - 3 * s - 1, 2 * s + 1, s + 1); }
  function iconPotato(c, x, y) { ell(c, '#c69a5b', x, y, 4, 3); P(c, '#8a6436', x - 1, y - 1); P(c, '#8a6436', x + 2, y + 1); P(c, '#e0bf86', x - 2, y - 2); }
  function heart(c, x, y, col = '#ff5d8f') { R(c, col, x, y, 2, 2); R(c, col, x + 3, y, 2, 2); R(c, col, x, y + 1, 5, 2); R(c, col, x + 1, y + 3, 3, 1); P(c, col, x + 2, y + 4); }

  /* =================================================================
     THE FARM GAME — drawn in screen space (204x110)
     ================================================================= */
  const FG = { state: null };
  function newFarm() {
    const crops = [];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) crops.push({ kind: 'tomato', x: 128 + i * 16, y: 26 + r * 12, ripe: true, regrow: 0 });
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) crops.push({ kind: 'potato', x: 128 + i * 16, y: 74 + r * 14, ripe: true, regrow: 0 });
    return { px: 70, py: 70, tx: 70, ty: 70, dir: 1, face: 'down', moving: false, keys: {}, crops, pending: null, tomatoes: 0, potatoes: 0, pops: [], last: null, clicks: 0, steps: 0 };
  }
  function farmUpdate(S, t) {
    const dt = S.last == null ? 0 : Math.min(0.1, t - S.last); S.last = t;
    let vx = 0, vy = 0; const k = S.keys;
    if (k.left) vx -= 1; if (k.right) vx += 1; if (k.up) vy -= 1; if (k.down) vy += 1;
    const sp = 46;
    if (vx || vy) { const l = Math.hypot(vx, vy); S.px += vx / l * sp * dt; S.py += vy / l * sp * dt; S.tx = S.px; S.ty = S.py; S.pending = null; S.moving = true; }
    else {
      const dx = S.tx - S.px, dy = S.ty - S.py, d = Math.hypot(dx, dy);
      if (d > 1) { const st = Math.min(d, sp * dt); S.px += dx / d * st; S.py += dy / d * st; S.moving = true; vx = dx; vy = dy; } else S.moving = false;
    }
    if (S.moving) { S.steps += dt; if (Math.abs(vx) > Math.abs(vy)) { S.face = 'side'; S.dir = vx > 0 ? 1 : -1; } else S.face = vy < 0 ? 'up' : 'down'; }
    S.px = Math.max(8, Math.min(196, S.px)); S.py = Math.max(22, Math.min(104, S.py));
    if (S.pending && Math.hypot(S.pending.x - S.px, S.pending.y + 4 - S.py) < 7) { harvest(S, S.pending, t); S.pending = null; }
    if ((k.left || k.right || k.up || k.down)) for (const cr of S.crops) if (cr.ripe && Math.hypot(cr.x - S.px, cr.y + 4 - S.py) < 5) harvest(S, cr, t);
    for (const cr of S.crops) if (!cr.ripe && t > cr.regrow) cr.ripe = true;
    S.pops = S.pops.filter((p) => t - p.t < 1);
  }
  function harvest(S, cr, t) {
    if (!cr.ripe) return; cr.ripe = false; cr.regrow = t + 7;
    if (cr.kind === 'tomato') S.tomatoes++; else S.potatoes++;
    S.pops.push({ x: cr.x, y: cr.y, kind: cr.kind, t });
  }
  function villager(c, x, y, t, face, dir, moving, scared) {
    x = Math.round(x); y = Math.round(y);
    const st = moving ? Math.floor(t * 8) % 2 : 0;
    alpha(c, 0.25, () => ell(c, '#000000', x, y + 1, 4, 1));
    R(c, '#3a5bd6', x - 2, y - 4, 2, 4 - st); R(c, '#3a5bd6', x + 1, y - 4, 2, 4 - (1 - st)); // legs
    R(c, '#ff8fa3', x - 3, y - 9, 7, 6); R(c, '#e06a84', x - 3, y - 4, 7, 1); // shirt
    R(c, '#f1c9a0', x - 4, y - 16, 9, 8); // head
    R(c, '#6b3f2a', x - 4, y - 17, 9, 3); if (face !== 'down') R(c, '#6b3f2a', x - 4, y - 14, 9, face === 'up' ? 5 : 2);
    if (face === 'down') { P(c, '#2c1f45', x - 2, y - 12); P(c, '#2c1f45', x + 2, y - 12); if (!scared) { P(c, '#ff8fa3', x - 3, y - 11); P(c, '#ff8fa3', x + 3, y - 11); } else R(c, '#2c1f45', x - 1, y - 10, 3, 1); }
    if (face === 'side') { P(c, '#2c1f45', x + dir * 2, y - 12); R(c, '#6b3f2a', x - dir * 4, y - 15, 2, 4); }
    R(c, '#ffd23f', x - 5, y - 18, 11, 2); R(c, '#e8b52a', x - 3, y - 20, 7, 2); // straw hat
  }
  function drawFarm(c, t, S, hk = 0) {
    // hk: 0 cute ... 1 horrifying
    const H1 = hk > 0.5;
    // sky strip + grass
    bands(c, H1 ? ['#1a0508', '#2a070c', '#3a0a10'] : ['#8fe0ff', '#a9e8ff', '#c9f2ff'], 0, 20, 0, SW);
    if (!H1) { disc(c, '#fff6b0', 180, 6, 4); for (const cx of [30, 90]) { const x = Math.round(wrap(cx + t * 4, SW + 30) - 15); ell(c, '#ffffff', x, 8, 9, 3); ell(c, '#ffffff', x + 6, 6, 6, 3); } }
    else { disc(c, '#c01020', 180, 7, 5); alpha(c, 0.5, () => disc(c, '#ff2030', 180, 7, 8)); }
    R(c, H1 ? '#2b2a22' : '#7ad35a', 0, 18, SW, SH - 18);
    const r = rng(7);
    for (let i = 0; i < 160; i++) { const x = Math.floor(r() * SW), y = 20 + Math.floor(r() * (SH - 20)); P(c, H1 ? (i % 3 ? '#3a3828' : '#4a1a14') : (i % 3 ? '#62bf46' : '#93e06a'), x, y); }
    // path
    for (let y = 20; y < SH; y++) R(c, H1 ? '#3a2a1e' : '#e8cf96', 96 + Math.round(Math.sin(y * 0.12) * 3), y, 12, 1);
    // house
    R(c, H1 ? '#2a2420' : '#fff2d8', 8, 30, 38, 26); for (let i = 0; i < 10; i++) R(c, H1 ? '#3a1010' : '#ff6b6b', 4 + i, 30 - i, 46 - i * 2, 1);
    R(c, H1 ? '#1a0e0a' : '#a0643a', 22, 42, 10, 14);
    R(c, H1 ? '#000000' : '#8fd3ff', 11, 36, 8, 7); R(c, H1 ? '#000000' : '#8fd3ff', 35, 36, 8, 7);
    if (H1) { for (const x of [13, 37]) { if (wrap(t * 0.7 + x, 3) > 0.3) { P(c, '#ff2030', x + 1, 39); P(c, '#ff2030', x + 4, 39); } } }
    else { P(c, '#ffffff', 12, 37); P(c, '#ffffff', 36, 37); }
    // pond
    ell(c, H1 ? '#2a0606' : '#4dc3ff', 30, 88, 18, 8); ell(c, H1 ? '#3a0a0a' : '#8fe0ff', 26, 86, 8, 3);
    if (!H1) for (let i = 0; i < 2; i++) { const k = wrap(t * 0.6 + i * 0.5, 1); alpha(c, 1 - k, () => { const rr = Math.round(2 + k * 8); for (let a = 0; a < 12; a++) P(c, '#ffffff', 32 + Math.round(Math.cos(a / 12 * 6.28) * rr), 89 + Math.round(Math.sin(a / 12 * 6.28) * rr * 0.4)); }); }
    // trees
    for (const [x, y] of [[66, 30], [180, 58], [70, 100]]) {
      if (H1) { R(c, '#1a1410', x, y - 14, 2, 16); P(c, '#1a1410', x - 2, y - 10); R(c, '#1a1410', x - 4, y - 11, 3, 1); R(c, '#1a1410', x + 2, y - 8, 4, 1); P(c, '#1a1410', x + 5, y - 9); }
      else { R(c, '#8a5a3a', x, y - 6, 2, 8); const s = Math.round(Math.sin(t * 2 + x) * 0.6); disc(c, '#3fae4a', x + 1 + s, y - 10, 6); disc(c, '#5fd06a', x - 1 + s, y - 12, 3); }
    }
    // flowers / bones
    for (let i = 0; i < 12; i++) { const x = 10 + (i * 37) % 180, y = 60 + (i * 23) % 44; if (x > 90 && x < 112) continue; if (x > 120) continue;
      if (H1) { R(c, '#d8d0c0', x, y, 3, 1); P(c, '#d8d0c0', x - 1, y - 1); P(c, '#d8d0c0', x + 3, y + 1); }
      else { const col = ['#ff8fa3', '#ffd23f', '#ffffff', '#c38bff'][i % 4]; P(c, col, x, y); P(c, col, x - 1, y + 1); P(c, col, x + 1, y + 1); P(c, col, x, y + 2); P(c, '#3fae4a', x, y + 3); } }
    // fences + signs
    for (let x = 118; x < 196; x += 6) { R(c, H1 ? '#2a1e16' : '#c98a4b', x, 18, 2, 6); R(c, H1 ? '#2a1e16' : '#c98a4b', x, 62, 2, 6); }
    R(c, H1 ? '#2a1e16' : '#c98a4b', 118, 20, 78, 1); R(c, H1 ? '#2a1e16' : '#c98a4b', 118, 64, 78, 1);
    R(c, H1 ? '#2a1e16' : '#fff2d8', 120, 12, 30, 7); tw(c, H1 ? 'T0MAT0' : 'TOMATO', 122, 13, H1 ? '#a01818' : '#e8463a');
    R(c, H1 ? '#2a1e16' : '#fff2d8', 150, 56, 30, 7); tw(c, 'POTATO', 152, 57, H1 ? '#5a4a2a' : '#8a6436');
    // soil
    R(c, H1 ? '#2a1610' : '#a8743f', 122, 24, 70, 36); R(c, H1 ? '#2a1610' : '#a8743f', 122, 70, 70, 32);
    for (let y = 27; y < 60; y += 6) R(c, H1 ? '#1a0c08' : '#8a5a30', 122, y, 70, 1);
    for (let y = 74; y < 102; y += 7) R(c, H1 ? '#1a0c08' : '#8a5a30', 122, y, 70, 1);
    // crops
    for (const cr of S.crops) {
      const { x, y } = cr; const sway = Math.round(Math.sin(t * 2.4 + x * 0.3) * 0.6);
      if (cr.kind === 'tomato') {
        R(c, H1 ? '#3a2a1a' : '#c9a26a', x, y - 6, 1, 10);
        disc(c, H1 ? '#2a3a1a' : '#3fae4a', x + sway, y - 3, 3); disc(c, H1 ? '#1e2a12' : '#5fd06a', x - 1 + sway, y - 4, 1);
        if (cr.ripe) { iconTomato(c, x + 2 + sway, y + 1, 1); if (H1) { P(c, '#8a0a10', x + 2, y + 5); if (wrap(t + x, 2) < 1) P(c, '#8a0a10', x + 2, y + 6 + Math.floor(wrap(t + x, 1) * 4)); } }
      } else {
        if (cr.ripe) { disc(c, H1 ? '#2a3a1a' : '#3fae4a', x + sway, y, 4); disc(c, H1 ? '#1e2a12' : '#7ae582', x - 1 + sway, y - 1, 2); P(c, H1 ? '#4a4a2a' : '#ffffff', x + 2, y - 2); }
        else { R(c, '#6b4a2a', x - 2, y + 1, 5, 2); }
      }
    }
    // scarecrow by the tomatoes (cute... mostly)
    const scx = 194, scy = 40; R(c, '#8a5a3a', scx, scy - 4, 1, 14); R(c, '#8a5a3a', scx - 4, scy, 9, 1);
    R(c, H1 ? '#3a2a2a' : '#7a6aff', scx - 2, scy, 5, 5); disc(c, H1 ? '#5a4a3a' : '#f2d29a', scx, scy - 5, 3); R(c, '#e8b52a', scx - 3, scy - 9, 7, 2);
    const evil = H1 || (wrap(t, 9) < 0.12);
    P(c, evil ? '#ff2030' : '#2c1f45', scx - 1, scy - 5); P(c, evil ? '#ff2030' : '#2c1f45', scx + 1, scy - 5);
    if (H1) {
      // creepy figures standing in the field + lying bodies
      for (const [fx, fy, h] of [[110, 44, 20], [160, 108, 24], [56, 70, 18]]) {
        const sway = Math.round(Math.sin(t * 0.8 + fx) * 1);
        R(c, '#050305', fx + sway, fy - h, 4, h); disc(c, '#050305', fx + 2 + sway, fy - h - 2, 3); R(c, '#050305', fx - 2 + sway, fy - h + 3, 1, h - 6); R(c, '#050305', fx + 5 + sway, fy - h + 3, 1, h - 4);
        if (wrap(t * 0.5 + fx, 4) > 0.15) { P(c, '#ffffff', fx + 1 + sway, fy - h - 3); P(c, '#ffffff', fx + 3 + sway, fy - h - 3); }
      }
      for (const [bx, by, f] of [[140, 50, 1], [84, 96, -1], [166, 88, 1]]) {
        R(c, '#8a8478', bx, by, 12, 3); disc(c, '#a09888', bx + (f > 0 ? 13 : -1), by + 1, 2); R(c, '#6a645a', bx + 2, by + 3, 3, 1); R(c, '#6a645a', bx + 7, by + 3, 3, 1);
        P(c, '#2a0a0a', bx + (f > 0 ? 12 : -2), by); P(c, '#2a0a0a', bx + (f > 0 ? 14 : 0), by); // x eyes
        alpha(c, 0.6, () => R(c, '#3a0a0a', bx + 2, by + 3, 8, 1));
      }
      // crows
      for (let i = 0; i < 3; i++) { const x = Math.round(wrap(20 + i * 70 + t * 10, SW)), y = 8 + i * 3; const f = Math.floor(t * 6 + i) % 2; R(c, '#000000', x, y, 3, 1); P(c, '#000000', x - 1, y - f); P(c, '#000000', x + 3, y - f); }
    }
    // pops
    for (const p of S.pops) { const k = Math.min(1, (t - p.t)); const y = p.y - 6 - Math.round(k * 12); alpha(c, 1 - k * 0.8, () => { if (p.kind === 'tomato') iconTomato(c, p.x, y, 1); else iconPotato(c, p.x, y); tw(c, '+1', p.x + 5, y - 3, '#ffffff'); }); }
    // player
    villager(c, S.px, S.py, t, H1 ? 'down' : S.face, S.dir, !H1 && S.moving, H1);
    // target marker
    if (!H1 && S.moving && !(S.keys.left || S.keys.right || S.keys.up || S.keys.down)) { const k = wrap(t * 3, 1); alpha(c, 0.7, () => { P(c, '#ffffff', S.tx - 2, S.ty); P(c, '#ffffff', S.tx + 2, S.ty); P(c, '#ffffff', S.tx, S.ty - 1 - Math.round(k)); }); }
    // HUD
    R(c, H1 ? '#120406' : '#2c1f45', 0, 0, SW, 10); alpha(c, 0.9, () => {});
    iconTomato(c, 6, 5, 1); tw(c, String(S.tomatoes), 12, 3, '#ffffff');
    iconPotato(c, 30, 5); tw(c, String(S.potatoes), 37, 3, '#ffffff');
    tw(c, H1 ? 'HELP ME' : 'COZY FARM', H1 ? 80 : 74, 3, H1 ? '#ff2030' : '#ffd23f');
    tw(c, H1 ? 'CLICK  T0 PICK' : 'CLICK TO WALK', 146, 3, H1 ? '#5a1010' : '#a9e8ff');
  }

  ART.farmGame = (() => {
    function sync() { if (!FG.state) FG.state = newFarm(); return FG.state; }
    return {
      reset() { FG.state = newFarm(); window.FarmGame = FG; },
      draw(c, t, o = {}) {
        const S = sync(); farmUpdate(S, t);
        room(c, t, { glow: '#9fe8a0' });
        screen(c, () => { drawFarm(c, t, S, 0); scanlines(c, 0.06); });
      },
      pointer(x, y) {
        const S = sync(); const sx = x - SX, sy = y - SY;
        if (sx < 0 || sy < 10 || sx > SW || sy > SH) return false;
        S.clicks++;
        const hit = S.crops.filter((cr) => cr.ripe && Math.abs(cr.x - sx) < 6 && Math.abs(cr.y - sy) < 7).sort((a, b) => Math.hypot(a.x - sx, a.y - sy) - Math.hypot(b.x - sx, b.y - sy))[0];
        if (hit) { S.pending = hit; S.tx = hit.x; S.ty = hit.y + 4; } else { S.pending = null; S.tx = sx; S.ty = sy; }
        return true;
      },
      key(k, down) {
        const S = sync(); const m = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' }[k];
        if (!m) return false; S.keys[m] = down; return true;
      },
    };
  })();

  /* ---------- Domates topla: thunder, red eyes, horror field ---------- */
  function redEyes(c, cx, cy, k, t) {
    // a pair of huge red eyes in the dark; k = 0..1 opening
    const h = Math.max(1, Math.round(9 * k));
    for (const dx of [-34, 34]) {
      const x = cx + dx; ell(c, '#5a0008', x, cy, 20, h + 2); ell(c, '#ff1a2a', x, cy, 18, h); ell(c, '#ff8a6a', x, cy, 10, Math.max(1, h - 4));
      R(c, '#000000', x - 1, cy - h, 3, h * 2 + 1); // slit pupil
      for (let i = 0; i < 5; i++) P(c, '#8a0010', x - 16 + i * 8, cy - h - 3 + (i % 2));
    }
    alpha(c, 0.25 * k, () => { disc(c, '#ff1a2a', cx - 34, cy, 30); disc(c, '#ff1a2a', cx + 34, cy, 30); });
  }
  ART.farmHorror = (() => {
    const S0 = newFarm();
    return {
      draw(c, t, o = {}) {
        const beat = o.beat || 0, bt = o.beatT || 0;
        const S = FG.state || S0; S.keys = {}; S.moving = false;
        if (beat === 0) {
          const fl = bt < 0.15 ? 1 : bt < 0.3 ? 0 : bt < 0.42 ? 0.8 : Math.max(0, 0.5 - bt);
          room(c, t, { flash: fl, rain: true, glow: '#9fe8a0' });
          screen(c, () => { drawFarm(c, t, S, 0); scanlines(c, 0.06); });
          if (fl > 0) alpha(c, fl * 0.7, () => R(c, '#e8ecff', 0, 0, W, H));
          const sh = bt < 0.8 ? Math.round(Math.sin(t * 60) * 2) : 0; if (sh) { c.drawImage(c.canvas, sh, 0); }
          return;
        }
        if (beat === 1) {
          R(c, '#000000', 0, 0, W, H);
          const k = bt < 0.3 ? 0 : bt < 0.7 ? ease((bt - 0.3) / 0.4) : bt < 1.4 ? 1 : Math.max(0, 1 - (bt - 1.4) / 0.25);
          if (k > 0) redEyes(c, 160, 70, k, t);
          return;
        }
        // horror field (beats 2, 3)
        room(c, t, { rain: true, glow: '#ff3040' });
        alpha(c, 0.55, () => R(c, '#000000', 0, 0, W, H));
        screen(c, () => {
          drawFarm(c, t, S, 1);
          if (Math.random() < 0.06) { alpha(c, 0.5, () => { for (let i = 0; i < 30; i++) R(c, Math.random() < 0.5 ? '#ffffff' : '#000000', 0, Math.floor(Math.random() * SH), SW, 1); }); }
          if (beat >= 3) { const on = wrap(t, 0.5) < 0.38; R(c, '#000000', 40, 40, 124, 26); R(c, '#5a0008', 41, 41, 122, 24); if (on) tCenter(c, 'ARE YOU SURE?', 102, 48, '#ff2030', 2); }
          scanlines(c, 0.16);
        });
        if (wrap(t, 6.3) < 0.08) alpha(c, 0.5, () => R(c, '#e8ecff', 0, 0, W, H));
      },
    };
  })();

  /* ---------- smoke + sparks ---------- */
  function smoke(c, x, y, t, n = 8, spread = 1, col = '#8a8698') {
    for (let i = 0; i < n; i++) { const k = wrap(t * 0.35 + i / n, 1); const xx = x + Math.sin(k * 5 + i * 2) * 6 * spread + k * 10; const yy = y - k * 60; alpha(c, 0.55 * (1 - k), () => disc(c, i % 2 ? col : '#a6a2b4', Math.round(xx), Math.round(yy), 2 + Math.round(k * 6))); }
  }
  function sparks(c, x, y, t, n = 6) { for (let i = 0; i < n; i++) { const k = wrap(t * 2.2 + i * 0.37, 1); if (k > 0.6) continue; const a = i * 1.7; P(c, k < 0.3 ? '#ffffff' : '#ffd23f', Math.round(x + Math.cos(a) * k * 18), Math.round(y + Math.sin(a) * k * 10 + k * k * 20)); } }

  /* ---------- Domates - Confirm: lightning, smoke, power out ---------- */
  ART.pcBroken = {
    draw(c, t, o = {}) {
      const beat = o.beat || 0, bt = o.beatT || 0;
      const fl = beat === 0 ? (bt < 0.12 ? 1 : bt < 0.25 ? 0 : bt < 0.4 ? 1 : Math.max(0, 0.6 - bt)) : (wrap(t, 5.1) < 0.07 ? 0.9 : 0);
      const off = beat >= 1 || bt > 0.6;
      room(c, t, { flash: fl, rain: true, screenOff: off, powerOut: beat >= 2, glow: '#ffffff' });
      screen(c, () => {
        if (!off) { R(c, '#ffffff', 0, 0, SW, SH); for (let i = 0; i < 40; i++) R(c, Math.random() < 0.5 ? '#000000' : '#ff2030', 0, Math.floor(Math.random() * SH), SW, 1 + Math.floor(Math.random() * 3)); }
        else { R(c, '#07070a', 0, 0, SW, SH); alpha(c, 0.12, () => { for (let i = 0; i < 6; i++) R(c, '#ffffff', 20 + i * 6, 10 + i * 4, 30, 1); });
          // crack
          const cr = [[120, 30], [128, 42], [122, 52], [134, 66], [130, 80]]; for (let i = 1; i < cr.length; i++) { const [a, b] = cr[i - 1], [x, y] = cr[i]; for (let k = 0; k <= 10; k++) P(c, '#5a5a6a', Math.round(lerp(a, x, k / 10)), Math.round(lerp(b, y, k / 10))); } }
      });
      smoke(c, 170, SY + 2, t, 10, 1.2); smoke(c, 110, SY + 4, t + 1.3, 6, 0.8);
      if (beat <= 1) sparks(c, SX + SW + 2, SY + SH, t, 8);
      if (beat >= 2) {
        const lit = wrap(t, 5.1) < 0.07;
        alpha(c, lit ? 0.25 : 0.86, () => R(c, '#020208', 0, 0, W, H));
        if (!lit) { smoke(c, 170, SY + 2, t, 6, 1.2, '#3a3846'); }
      }
      if (fl > 0) alpha(c, fl * 0.6, () => R(c, '#e8ecff', 0, 0, W, H));
    },
  };

  /* ---------- Uyu: trying to sleep, flashes of the field ---------- */
  ART.nightmare = (() => {
    const off = mk(SW, SH, () => {}); const oc = off.getContext('2d'); const S = newFarm();
    return {
      draw(c, t, o = {}) {
        const beat = o.beat || 0, bt = o.beatT || 0;
        if (beat === 0) { ART.bedroom.draw(c, t, { night: true }); alpha(c, 0.55, () => R(c, '#000000', 0, 0, W, H)); eyelids(c, Math.max(0.05, 1.1 - bt * 0.45)); return; }
        if (beat === 1) {
          const ph = Math.floor(bt * 2.2) % 3; const strobe = wrap(bt * 2.2, 1) < 0.45;
          R(c, '#000000', 0, 0, W, H);
          if (strobe) {
            oc.clearRect(0, 0, SW, SH); drawFarm(oc, t + ph, S, 1);
            const zoom = [1.6, 2.2, 1.3][ph], cx = [150, 110, 60][ph], cy = [60, 50, 70][ph];
            c.save(); c.imageSmoothingEnabled = false; c.translate(160, 90); c.scale(zoom, zoom); c.drawImage(off, -cx, -cy); c.restore();
            alpha(c, 0.35, () => R(c, '#5a0010', 0, 0, W, H));
            if (ph === 2) redEyes(c, 160, 80, 0.8, t);
          }
          eyelids(c, strobe ? 0.75 : 0.08);
          return;
        }
        // eyes snap open: shaking, red tint, heavy breathing
        const sh = bt < 1.2 ? Math.round(Math.sin(t * 40) * 2) : 0;
        c.save(); c.translate(sh, 0); ART.bedroom.draw(c, t, { night: true }); c.restore();
        alpha(c, 0.5, () => R(c, '#000000', 0, 0, W, H)); alpha(c, 0.12 + Math.sin(t * 3) * 0.05, () => R(c, '#ff1a2a', 0, 0, W, H));
        if (bt < 0.25) alpha(c, 0.8, () => R(c, '#ffffff', 0, 0, W, H));
      },
    };
  })();

  /* ---------- Patates topla: cozy hours of potato picking ---------- */
  ART.potatoNight = (() => {
    const S = newFarm();
    return {
      reset() { const n = newFarm(); Object.assign(S, n); S.potatoes = 0; },
      draw(c, t, o = {}) {
        const beat = o.beat || 0, bt = o.beatT || 0;
        const prog = Math.min(1, (beat + Math.min(1, bt / 3)) / 3);
        // auto-play: walk between potato plants
        const pts = S.crops.filter((cr) => cr.kind === 'potato'); const tgt = pts[Math.floor(t * 0.9) % pts.length];
        S.tx = tgt.x; S.ty = tgt.y + 4; S.pending = tgt; farmUpdate(S, t * 1.6);
        S.potatoes = Math.max(S.potatoes, Math.floor(prog * 412));
        room(c, t, { dawn: ease(prog * 1.1), glow: '#ffd27a' });
        screen(c, () => {
          drawFarm(c, t, S, 0);
          const mins = Math.floor(lerp(2 * 60 + 10, 5 * 60 + 41, prog)); const hh = String(Math.floor(mins / 60)).padStart(2, '0'), mm = String(mins % 60).padStart(2, '0');
          R(c, '#2c1f45', 160, 100, 42, 9); tw(c, hh + ':' + mm + ' AM', 163, 102, '#ffd23f');
          if (beat >= 1) for (let i = 0; i < 4; i++) { const k = wrap(t * 0.8 + i * 0.25, 1); alpha(c, 1 - k, () => heart(c, 80 + i * 20, 70 - Math.round(k * 30))); }
          scanlines(c, 0.06);
        });
        // a clock on the wall spinning
        const cx = 293, cy = 82; disc(c, '#2a2340', cx, cy, 9); disc(c, '#fff2d8', cx, cy, 7);
        const a1 = t * (beat >= 1 ? 6 : 1.2), a2 = a1 / 12; for (let k = 0; k <= 5; k++) P(c, '#2c1f45', Math.round(cx + Math.sin(a1) * k), Math.round(cy - Math.cos(a1) * k)); for (let k = 0; k <= 3; k++) P(c, '#e8463a', Math.round(cx + Math.sin(a2) * k), Math.round(cy - Math.cos(a2) * k));
        if (beat >= 2) { // yawn... eyes close
          const k = Math.min(1, bt / 3.2); alpha(c, 0.4 * k, () => R(c, '#000000', 0, 0, W, H));
          if (bt < 1.4 && wrap(t, 1) < 0.6) tw(c, 'YAWN...', 140, 130, '#ffffff', 2);
          eyelids(c, Math.max(0, 1.1 - k * 1.1));
        }
      },
    };
  })();

  /* ---------- job site (İş ara / Sabah) ---------- */
  const JOBS = [
    { id: 'dog', title: 'DOG WALKER', pay: '$$$', col: '#ff8fa3' },
    { id: 'courier', title: 'COURIER', pay: '$$$ + TIPS', col: '#ffd23f' },
    { id: 'watch', title: 'NIGHT WATCHMAN', pay: '$$', col: '#7ab8ff' },
  ];
  function jobIcon(c, id, x, y, t) {
    if (id === 'dog') { ell(c, '#e89a4a', x + 6, y + 6, 6, 4); disc(c, '#e89a4a', x + 11, y + 3, 3); P(c, '#2c1f45', x + 12, y + 2); P(c, '#2c1f45', x + 14, y + 3); R(c, '#c97a2a', x + 2, y + 9, 2, 2); R(c, '#c97a2a', x + 8, y + 9, 2, 2); P(c, '#e89a4a', x, y + 3 - (Math.floor(t * 6) % 2)); }
    if (id === 'courier') { R(c, '#c98a4b', x + 1, y + 2, 10, 8); R(c, '#a06a30', x + 1, y + 5, 10, 1); R(c, '#a06a30', x + 5, y + 2, 1, 8); R(c, '#ffffff', x + 3, y + 7, 3, 1); }
    if (id === 'watch') { R(c, '#8a96b0', x, y + 2, 12, 9); for (let i = 0; i < 3; i++) R(c, '#ffd23f', x + 2 + i * 3, y + 4, 2, 2); R(c, '#2c1f45', x + 4, y + 7, 4, 4); disc(c, '#ffe9a0', x + 13, y, 2); }
  }
  function jobSite(c, t, o = {}) {
    R(c, '#eaf4ff', 0, 0, SW, SH);
    R(c, '#2c1f45', 0, 0, SW, 11); tw(c, 'SAMPA JOBS', 5, 3, '#ffd23f'); tw(c, 'VAGAS', 180, 3, '#a9e8ff');
    R(c, '#ffffff', 50, 14, 104, 7); R(c, '#c8d8ea', 50, 20, 104, 1); tw(c, 'SEARCH: ANY JOB', 54, 15, '#8a96b0');
    JOBS.forEach((j, i) => {
      const y = 25 + i * 27, x = 14; const hover = o.hover === i;
      R(c, '#2c1f45', x - 1, y - 1, 178, 24); R(c, hover ? '#fff6d6' : '#ffffff', x, y, 176, 22); R(c, j.col, x, y, 4, 22);
      R(c, '#f3eadb', x + 8, y + 4, 16, 14); jobIcon(c, j.id, x + 10, y + 5, t);
      tw(c, j.title, x + 30, y + 4, '#2c1f45'); tw(c, j.pay, x + 30, y + 13, '#3fae4a');
      R(c, '#3fae4a', x + 140, y + 7, 30, 9); tw(c, 'APPLY', x + 145, y + 9, '#ffffff');
      if (j.id === 'dog' && o.dogClosed) { alpha(c, 0.6, () => R(c, '#ffffff', x, y, 176, 22)); R(c, '#d6336c', x + 60, y + 6, 56, 11); tw(c, 'CLOSED', x + 77, y + 9, '#ffffff'); }
    });
    if (o.cursor) cursor(c, Math.round(110 + Math.sin(t * 0.7) * 50), Math.round(60 + Math.cos(t * 0.9) * 26));
  }
  const isDayJobs = () => { const ch = (window.State && State.data.choices) || []; const last = ch[ch.length - 1] || ''; return last.startsWith('Sabah =>'); };
  ART.jobBoard = {
    draw(c, t, o = {}) {
      const day = o.day != null ? o.day : isDayJobs();
      const dogClosed = window.State && Object.keys(State.data.flags).some((k) => k.startsWith('gate:') && k.endsWith('=>Köpek Yürütücü'));
      room(c, t, { day, glow: '#bfe0ff' });
      screen(c, () => { jobSite(c, t, { cursor: true, dogClosed }); scanlines(c, 0.04); });
    },
  };
  ART.pcDesktop = {
    draw(c, t) {
      room(c, t, { glow: '#9fc8ff' });
      screen(c, () => {
        bands(c, ['#3a2a6a', '#4a3a8a', '#6a4aa0', '#8a5ab0'], 0, SH, 0, SW);
        for (let i = 0; i < 12; i++) if (wrap(t * 0.5 + i * 0.3, 1) > 0.3) P(c, '#ffffff', (i * 41) % SW, (i * 17) % 70);
        disc(c, '#ffe9a0', 160, 26, 8); disc(c, '#8a5ab0', 164, 23, 7);
        const icons = [['FARM', '#7ad35a'], ['JOBS', '#4dc3ff'], ['MUSIC', '#ff8fa3'], ['TRASH', '#c8ced8']];
        icons.forEach(([n, col], i) => { const x = 10, y = 10 + i * 24; R(c, '#ffffff', x + 3, y, 14, 12); R(c, col, x + 4, y + 1, 12, 10); tw(c, n, x + 10 - n.length * 2, y + 14, '#ffffff'); });
        iconTomato(c, 20, 16, 1); jobIcon(c, 'courier', 15, 36, t);
        R(c, '#1b1430', 0, SH - 9, SW, 9); R(c, '#ff5d8f', 2, SH - 7, 14, 5); tw(c, '02:13', SW - 24, SH - 7, '#ffffff');
        cursor(c, Math.round(100 + Math.sin(t * 0.6) * 30), Math.round(54 + Math.sin(t * 0.8) * 16));
        scanlines(c, 0.05);
      });
    },
  };
  ART.morningPC = {
    draw(c, t, o = {}) {
      const beat = o.beat || 0, bt = o.beatT || 0;
      const on = beat >= 1;
      room(c, t, { day: true, screenOff: !on });
      screen(c, () => {
        if (!on) { R(c, '#101016', 0, 0, SW, SH); alpha(c, 0.15, () => { for (let i = 0; i < 6; i++) R(c, '#ffffff', 30 + i * 6, 12 + i * 4, 40, 1); }); return; }
        const boot = Math.min(1, bt / 0.8);
        jobSite(c, t, { cursor: true });
        const k = ease(Math.min(1, Math.max(0, (bt - 0.4) / 0.5)) + (beat >= 2 ? 1 : 0));
        const y = Math.round(lerp(SH, 26, k));
        windowBox(c, 42, y, 120, 54, 'JOB APPLICATION', '#3fae4a');
        tCenter(c, 'NEED SOME MONEY?', 102, y + 16, '#2c1f45'); tCenter(c, 'APPLY TODAY!', 102, y + 26, '#d6336c', 1);
        R(c, '#3fae4a', 78, y + 38, 48, 10); tCenter(c, 'BROWSE JOBS', 102, y + 41, '#ffffff');
        if (boot < 1) alpha(c, 1 - boot, () => R(c, '#ffffff', 0, 0, SW, SH));
        scanlines(c, 0.04);
      });
      if (beat >= 2) for (let i = 0; i < 3; i++) { const k = wrap(t * 0.7 + i / 3, 1); alpha(c, 1 - k, () => text3(c, '#2c1f45', '?', 40 + i * 6, 120 - Math.round(k * 20), 2)); }
    },
  };

  /* ---------- job ads (cutscenes) ---------- */
  function pom(c, x, y, t) { const b = Math.floor(t * 8) % 2; disc(c, '#f0a040', x, y - 5, 5); disc(c, '#ffc070', x - 1, y - 6, 3); disc(c, '#f0a040', x + 5, y - 9, 3); P(c, '#2c1f45', x + 6, y - 10); P(c, '#2c1f45', x + 8, y - 9); R(c, '#c97a2a', x - 3, y - 1 + b, 2, 2); R(c, '#c97a2a', x + 2, y - 1 + (1 - b), 2, 2); disc(c, '#ffc070', x - 5, y - 8 - b, 2); }
  function sausage(c, x, y, t) { const b = Math.floor(t * 10) % 2; R(c, '#8a4a22', x - 9, y - 6, 18, 5); R(c, '#a85a2a', x - 9, y - 6, 18, 1); R(c, '#8a4a22', x + 7, y - 9, 5, 5); R(c, '#8a4a22', x + 10, y - 7, 4, 3); P(c, '#1b1416', x + 13, y - 7); P(c, '#1b1416', x + 9, y - 8); R(c, '#5a2a12', x + 7, y - 9, 2, 5); for (const lx of [-8, -5, 4, 7]) R(c, '#5a2a12', x + lx, y - 1, 1, 1 + ((lx > 0) === !!b ? 1 : 0)); R(c, '#8a4a22', x - 12, y - 7 - b, 3, 1); }
  function borzoi(c, x, y, t) { const b = Math.floor(t * 6) % 2; R(c, '#f4efe6', x - 8, y - 16, 16, 6); ell(c, '#f4efe6', x - 2, y - 11, 8, 3); R(c, '#f4efe6', x + 7, y - 22, 3, 8); R(c, '#f4efe6', x + 8, y - 22, 9, 3); P(c, '#1b1416', x + 16, y - 22); P(c, '#1b1416', x + 11, y - 22); R(c, '#e0d6c4', x + 6, y - 23, 3, 2); for (const [lx, ph] of [[-7, 0], [-4, 1], [3, 0], [6, 1]]) R(c, '#e8e0d2', x + lx + ((b + ph) % 2 ? 1 : 0), y - 10, 1, 10); R(c, '#e8e0d2', x - 12, y - 15 + b, 4, 1); R(c, '#e8e0d2', x - 14, y - 13 + b, 3, 1); }
  ART.jobAd = {
    draw(c, t, o = {}) {
      const kind = o.variant || 'dog'; const beat = o.beat || 0, bt = o.beatT || 0;
      const j = JOBS.find((x) => x.id === kind);
      room(c, t, { day: isDayJobs(), glow: '#bfe0ff' });
      screen(c, () => {
        R(c, '#fffaf0', 0, 0, SW, SH); R(c, j.col, 0, 0, SW, 14); tCenter(c, j.title, SW / 2, 4, '#2c1f45', 1);
        tw(c, '< BACK', 4, 4, '#2c1f45');
        if (kind === 'dog') {
          R(c, '#bdf0a8', 0, 56, SW, 30); R(c, '#9adf86', 0, 56, SW, 2);
          const sx = (k) => Math.round(wrap(t * 22 + k, SW + 60) - 30);
          pom(c, sx(0), 80, t); sausage(c, sx(60), 80, t); borzoi(c, sx(130), 82, t);
          for (let i = 0; i < 4; i++) { const k = wrap(t * 0.6 + i / 4, 1); alpha(c, 1 - k, () => heart(c, 30 + i * 46, 50 - Math.round(k * 26))); }
          tw(c, 'POMERANIAN  SAUSAGE DOG  BORZOI', 18, 20, '#8a6aa8');
          if (beat >= 1) tCenter(c, 'FUN + GOOD MONEY!', SW / 2, 30, '#d6336c', 1);
          if (beat >= 2) { R(c, '#2c1f45', 40, 92, 124, 13); tCenter(c, 'RUA PEDRO IVO, 83', SW / 2, 96, '#ffd23f'); }
        } else if (kind === 'courier') {
          bands(c, ['#1a1440', '#2a1e5a', '#3a2a6a'], 14, 80, 0, SW);
          for (let i = 0; i < 10; i++) if (wrap(t + i * 0.3, 1) > 0.2) P(c, '#ffffff', (i * 37) % SW, 18 + (i * 11) % 30);
          disc(c, '#fff2c0', 170, 26, 6);
          c.save(); c.translate(0, -100); skyline(c, 11, 180, '#120e2a', '#ffd23f', 12, 34); c.restore();
          R(c, '#2a2a36', 0, 80, SW, 30); for (let x = 0; x < SW; x += 16) R(c, '#ffd23f', wrap(x - t * 60, SW), 94, 8, 1);
          const x = 70 + Math.round(Math.sin(t * 2) * 4), y = 86;
          disc(c, '#1b1416', x - 8, y, 4); disc(c, '#1b1416', x + 10, y, 4); disc(c, '#5a5a6a', x - 8, y, 2); disc(c, '#5a5a6a', x + 10, y, 2);
          R(c, '#e8463a', x - 8, y - 6, 20, 4); R(c, '#e8463a', x + 8, y - 12, 3, 8); R(c, '#c98a4b', x - 12, y - 16, 10, 9); R(c, '#a06a30', x - 12, y - 12, 10, 1);
          R(c, '#4dc3ff', x - 2, y - 16, 6, 10); disc(c, '#ffd23f', x + 1, y - 19, 3); R(c, '#2c1f45', x - 1, y - 20, 5, 1);
          for (let i = 0; i < 3; i++) R(c, '#ffffff', x - 24 - i * 8 - Math.floor(wrap(t * 30, 6)), y - 8 + i * 3, 5, 1);
          if (beat >= 1) for (let i = 0; i < 3; i++) { const k = wrap(t * 0.8 + i / 3, 1); alpha(c, 1 - k, () => { disc(c, '#ffd23f', 130 + i * 20, 70 - Math.round(k * 30), 3); P(c, '#c98a20', 130 + i * 20, 70 - Math.round(k * 30)); }); }
          if (beat >= 1) tCenter(c, 'DELIVERIES AT NIGHT - KEEP THE TIPS!', SW / 2, 18, '#ffd23f');
          if (beat >= 2) { R(c, '#fffaf0', 30, 96, 144, 12); tCenter(c, 'LIBERDADE, 43 - SAO PAULO', SW / 2, 99, '#2c1f45'); }
        } else {
          bands(c, ['#0e1430', '#1a2448', '#26345e'], 14, 90, 0, SW); disc(c, '#fff2c0', 30, 28, 6);
          R(c, '#c8c0b0', 60, 24, 84, 66); for (let y = 28; y < 84; y += 9) for (let x = 64; x < 140; x += 10) R(c, wrap(x + y + Math.floor(t), 7) < 2 ? '#ffd23f' : '#3a3a50', x, y, 6, 5);
          R(c, '#5a5a6a', 40, 78, 124, 12); for (let x = 42; x < 160; x += 5) R(c, '#2a2a36', x, 72, 1, 18);
          R(c, '#e8e0d0', 150, 64, 26, 26); R(c, '#4dc3ff', 154, 68, 18, 9); tw(c, 'PORTARIA', 147, 58, '#ffd23f');
          const bob = Math.floor(t * 2) % 2; disc(c, '#f1c9a0', 162, 72 + bob, 3); R(c, '#2a3a6a', 158, 75 + bob, 9, 3);
          R(c, '#2a2a36', 0, 90, SW, 20);
          if (beat >= 1) tCenter(c, 'CONDOMINIO - FRONT GATE', SW / 2, 18, '#ffd23f');
          if (beat >= 2) { R(c, '#fffaf0', 48, 96, 108, 12); tCenter(c, 'RUA OSVALDO, 54', SW / 2, 99, '#2c1f45'); }
        }
        if (bt < 0.3 && beat === 0) alpha(c, 1 - bt / 0.3, () => R(c, '#ffffff', 0, 0, SW, SH));
        scanlines(c, 0.04);
      });
    },
  };

  /* =================================================================
     NIGHT STREET — cold, windy, creepy
     ================================================================= */
  ART.nightStreet = (() => {
    let bg = null;
    function init() {
      bg = mk(W, H, (c) => {
        bands(c, ['#04030a', '#07060f', '#0b0918', '#100d22', '#151230'], 0, 112);
        for (let i = 0; i < 30; i++) P(c, '#3a3658', (i * 53) % W, (i * 29) % 70);
        skyline(c, 21, 116, '#0a0914', '#2a2418', 30, 70);
        skyline(c, 5, 122, '#121020', '#3a3020', 20, 52);
        // houses close
        R(c, '#1a1726', 0, 64, 90, 58); R(c, '#221e30', 0, 64, 90, 3); R(c, '#1d1a2a', 230, 58, 90, 64); R(c, '#25213a', 230, 58, 90, 3);
        for (const [x, y] of [[12, 76], [44, 76], [12, 98], [244, 70], [278, 70], [278, 94]]) { R(c, '#0c0a14', x, y, 16, 12); R(c, '#14111e', x + 7, y, 2, 12); }
        R(c, '#0c0a14', 60, 96, 14, 26); R(c, '#2a2418', 70, 108, 1, 1);
        // wall graffiti (faded)
        text3(c, '#2a2238', 'NAO OLHE', 250, 112, 1);
        // sidewalk dark calcada
        const r = rng(9);
        for (let y = 122; y < 152; y++) for (let x = 0; x < W; x++) { const v = Math.sin(x * 0.11 + Math.sin(y * 0.21) * 1.2 + y * 0.32); let col = v > 0.35 ? '#141218' : '#3a3742'; if (r() < 0.05) col = '#24222a'; P(c, col, x, y); }
        R(c, '#4a4652', 0, 122, W, 1);
        R(c, '#0e0e14', 0, 152, W, 28); R(c, '#2a2a34', 0, 152, W, 2); for (let x = 6; x < W; x += 34) R(c, '#3a3a20', x, 165, 16, 2);
        // lamp post
        R(c, '#2a2a34', 214, 52, 3, 72); R(c, '#2a2a34', 206, 52, 14, 3); R(c, '#3a3a46', 204, 55, 8, 3);
      });
    }
    return {
      draw(c, t, o = {}) {
        if (!bg) init();
        c.drawImage(bg, 0, 0);
        // fast moving clouds over a pale moon
        disc(c, '#cfcbe0', 150, 26, 9); disc(c, '#e6e2f2', 148, 24, 6);
        for (let i = 0; i < 5; i++) { const x = Math.round(wrap(i * 80 + t * 22, W + 120) - 60); alpha(c, 0.8, () => { ell(c, '#14112a', x, 22 + i * 7, 30, 5); ell(c, '#1c1836', x + 10, 20 + i * 7, 18, 4); }); }
        // a window that flickers on and off; a silhouette in another
        if (wrap(t, 3.7) < 2.4) { R(c, '#8a6a2a', 44, 76, 16, 12); R(c, '#5a4418', 51, 76, 2, 12); }
        if (wrap(t, 11) < 1.4) { R(c, '#3a2a12', 278, 70, 16, 12); R(c, '#0a0806', 284, 72, 4, 10); disc(c, '#0a0806', 286, 72, 2); }
        // flickering lamp light cone
        const fl = wrap(t, 2.3) < 0.08 || (wrap(t, 7.1) > 6.6 && Math.floor(t * 20) % 2) ? 0 : 1;
        if (fl) { alpha(c, 0.16, () => { for (let y = 58; y < 150; y++) { const w = Math.round((y - 58) * 0.55); R(c, '#ffd27a', 210 - w, y, w * 2, 1); } }); disc(c, '#fff2b0', 208, 57, 2); }
        else disc(c, '#5a5440', 208, 57, 2);
        // bag on the sidewalk (in the lamp light)
        if (o.variant !== 'man' && !o.noBag) {
          const bx = 200, by = 140; alpha(c, 0.4, () => ell(c, '#000000', bx + 8, by + 3, 14, 2));
          ell(c, '#25301e', bx + 8, by - 4, 13, 7); R(c, '#2e3a24', bx - 4, by - 8, 24, 6); R(c, '#1a2214', bx - 4, by - 5, 24, 1);
          for (let x = bx - 2; x < bx + 18; x += 2) P(c, '#8a8a70', x, by - 9); R(c, '#1a2214', bx + 2, by - 14, 12, 2); R(c, '#1a2214', bx + 2, by - 14, 2, 5); R(c, '#1a2214', bx + 12, by - 14, 2, 5);
          if (fl && wrap(t, 2) < 0.2) sparkle(c, bx + 16, by - 9, 1, '#ffffff');
        }
        if (o.smokingBag) { const bx = 120, by = 142; ell(c, '#1e261a', bx, by - 3, 10, 5); smoke(c, bx, by - 8, t, 8, 0.8, '#5a5868'); }
        // the stranger (small, in the shadows) when he's not talking big
        if (o.variant === 'man' && o.actor !== 'Stranger') {
          const x = 180, y = 150; R(c, '#060508', x - 6, y - 30, 12, 30); disc(c, '#060508', x, y - 34, 6); R(c, '#060508', x - 9, y - 26, 3, 16); R(c, '#060508', x + 6, y - 26, 3, 16);
          P(c, '#e8e0d0', x - 2, y - 35); P(c, '#e8e0d0', x + 2, y - 35); P(c, Math.sin(t * 3) > 0.3 ? '#ff7a2f' : '#a04a1a', x + 5, y - 31);
        }
        // wind: leaves and a newspaper tumbling past, streaks
        for (let i = 0; i < 9; i++) { const k = wrap(t * (0.35 + (i % 3) * 0.08) + i * 0.13, 1); const x = Math.round(W + 20 - k * (W + 40)), y = Math.round(118 + (i * 7) % 30 + Math.sin(t * 4 + i) * 4 - Math.sin(k * 3.14) * 18); P(c, i % 2 ? '#6a4a2a' : '#4a3a22', x, y); P(c, '#6a4a2a', x + 1, y + (Math.floor(t * 8 + i) % 2)); }
        { const k = wrap(t * 0.18, 1); const x = Math.round(W + 30 - k * (W + 60)), y = Math.round(138 - Math.abs(Math.sin(k * 12)) * 10); R(c, '#8a8678', x, y, 7, 5); R(c, '#5a5850', x + 1, y + 1, 5, 1); R(c, '#5a5850', x + 1, y + 3, 4, 1); }
        alpha(c, 0.18, () => { for (let i = 0; i < 10; i++) { const k = wrap(t * 1.4 + i * 0.1, 1); R(c, '#9aa0c0', Math.round(W - k * (W + 40)), 20 + (i * 17) % 120, 14, 1); } });
        // cold vignette
        alpha(c, 0.35, () => { for (let i = 0; i < 16; i++) { R(c, '#000000', 0, 0, i, H); R(c, '#000000', W - i, 0, i, H); R(c, '#000000', 0, 0, W, Math.round(i / 2)); } });
        // optional beat-1 zoom hint on the bag
        if (o.beat === 1 && o.variant !== 'man' && !o.noBag) { const k = wrap(t, 1.2) < 0.6; if (k) text3(c, '#ffd27a', '?', 206, 116, 2); }
      },
    };
  })();

  /* ---------- pinpad box (Çantayı aç / Şifre Dogru / şifre yanlış) ---------- */
  function boxScene(c, t, o = {}) {
    // bag interior around the box
    bands(c, ['#0a0c08', '#11160e', '#151c10', '#1a2214'], 0, H);
    ell(c, '#25301e', 160, 100, 150, 70); ell(c, '#1d2618', 160, 96, 130, 56);
    for (let x = 20; x < 300; x += 3) { P(c, '#8a8a70', x, Math.round(40 + Math.sin(x * 0.02) * 4)); P(c, '#5a5a48', x + 1, Math.round(41 + Math.sin(x * 0.02) * 4)); }
    // metal box
    const bx = 86, by = 40, bw = 148, bh = 84, lid = o.lid || 0;
    alpha(c, 0.5, () => R(c, '#000000', bx + 6, by + bh, bw, 6));
    R(c, '#5a6070', bx, by, bw, bh); bands(c, ['#8a92a4', '#7a8294', '#6a7284', '#5a6274'], by, by + bh, bx, bw);
    for (const [x, y] of [[4, 4], [bw - 6, 4], [4, bh - 6], [bw - 6, bh - 6]]) { disc(c, '#3a404c', bx + x + 1, by + y + 1, 2); P(c, '#c8ced8', bx + x, by + y); }
    R(c, '#4a5060', bx, by + 22, bw, 2);
    if (o.open) {
      // open: inside with cash
      R(c, '#1a1c22', bx + 6, by + 26, bw - 12, bh - 32);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const x = bx + 12 + i * 26, y = by + 34 + j * 20 - Math.round(Math.sin(t * 2 + i) * (o.float ? 1 : 0)); R(c, '#2a6a3a', x, y, 22, 14); R(c, '#4aa85a', x + 1, y + 1, 20, 12); R(c, '#2a6a3a', x + 4, y + 4, 14, 6); disc(c, '#cfeec0', x + 11, y + 7, 2); R(c, '#e8d8a0', x + 9, y, 4, 14); }
      // lid swung up
      const lh = Math.round(lerp(22, -40, ease(lid)));
      R(c, '#6a7284', bx, by + 22 - Math.max(0, -lh) - (lh > 0 ? 0 : 0), bw, Math.max(2, Math.abs(lh) * 0 + 4));
      R(c, '#9aa2b4', bx - 2, by - Math.round(ease(lid) * 26), bw + 4, 6);
      if (o.glow) { alpha(c, 0.25 + Math.sin(t * 4) * 0.08, () => { disc(c, '#ffe08a', bx + bw / 2, by + 50, 60); }); for (let i = 0; i < 8; i++) if (wrap(t * 1.3 + i * 0.37, 1) < 0.4) sparkle(c, bx + 10 + (i * 37) % (bw - 20), by + 20 + (i * 23) % 60, 2, '#fff6c0'); }
    } else {
      // pinpad
      const px = bx + 52, py = by + 30;
      R(c, '#1b1d24', px - 4, py - 4, 52, 48);
      const err = o.err, ok = o.ok;
      R(c, err ? '#3a0a0a' : ok ? '#0a3a14' : '#1a2a1a', px, py, 44, 9);
      const scr = err ? (wrap(t, 0.5) < 0.3 ? 'ERROR' : '') : ok ? 'OPEN' : (wrap(t, 1) < 0.5 ? '----_' : '----');
      tw(c, scr, px + 3, py + 2, err ? '#ff2030' : ok ? '#7ae582' : '#7ae582');
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
      const pressed = o.pressing ? Math.floor(t * 6) % 12 : -1;
      keys.forEach((k, i) => { const x = px + 2 + (i % 3) * 14, y = py + 12 + Math.floor(i / 3) * 7; R(c, i === pressed ? '#c8ced8' : '#3a3e4a', x, y, 12, 6); tw(c, k, x + 5, y + 1, i === pressed ? '#1b1d24' : '#e6ebf2'); });
      const ledOn = err ? true : ok ? true : wrap(t, 1.2) < 0.4;
      disc(c, ledOn ? (ok ? '#3aff6a' : '#ff2030') : '#3a1010', bx + bw - 14, by + 30, 3);
      if (ledOn && !ok) alpha(c, 0.3, () => disc(c, '#ff2030', bx + bw - 14, by + 30, 6));
      if (err) { sparks(c, px + 22, py + 4, t, 10); smoke(c, px + 22, py, t, 10, 1.4); if (Math.floor(t * 12) % 5 === 0) alpha(c, 0.3, () => R(c, '#ffffff', 0, 0, W, H)); }
    }
  }
  ART.pinBox = { draw(c, t, o = {}) { boxScene(c, t, { pressing: document.body.dataset.notice === 'rolling' }); alpha(c, 0.25, () => { for (let i = 0; i < 20; i++) { R(c, '#000000', 0, 0, i, H); R(c, '#000000', W - i, 0, i, H); } }); } };
  ART.boxOpen = {
    draw(c, t, o = {}) {
      const beat = o.beat || 0, bt = o.beatT || 0;
      if (beat === 0) { boxScene(c, t, { ok: true }); return; }
      if (beat <= 2) { boxScene(c, t, { open: true, lid: beat === 1 ? Math.min(1, bt / 0.6) : 1, glow: true, float: beat === 2 }); if (beat === 2) for (let i = 0; i < 5; i++) { const k = wrap(t * 0.6 + i / 5, 1); alpha(c, 1 - k, () => heart(c, 40 + i * 60, 150 - Math.round(k * 40), '#ffd23f')); } return; }
      // next morning: sunrise over the city
      const k = Math.min(1, bt / 3);
      bands(c, [mix('#0b0920', '#ff9a6a', k), mix('#110d23', '#ffc07a', k), mix('#16112b', '#ffe0a0', k), mix('#1b1532', '#fff0c8', k)], 0, 130);
      disc(c, '#ffd23f', 160, Math.round(lerp(150, 70, ease(k))), 16); alpha(c, 0.3, () => disc(c, '#fff2a0', 160, Math.round(lerp(150, 70, ease(k))), 26));
      skyline(c, 3, 140, mix('#0a0914', '#6a4a6a', k), '#ffd23f', 20, 60);
      R(c, mix('#0a0914', '#5a3a5a', k), 0, 140, W, 40);
      for (let i = 0; i < 3; i++) { const x = Math.round(wrap(i * 90 + t * 14, W + 20) - 10), y = 40 + i * 9; const f = Math.floor(t * 5 + i) % 2; R(c, '#2c1f45', x, y, 3, 1); P(c, '#2c1f45', x - 1, y - f); P(c, '#2c1f45', x + 3, y - f); }
    },
  };
  ART.boxBroken = {
    draw(c, t, o = {}) {
      const beat = o.beat || 0;
      if (beat === 0) { boxScene(c, t, { err: true }); return; }
      ART.nightStreet.draw(c, t, { noBag: true, smokingBag: true });
    },
  };

  /* ---------- the stranger, close (Diren / Direnme) ---------- */
  ART.strangerCard = (() => {
    const off = document.createElement('canvas'); off.width = 100; off.height = 140; const oc = off.getContext('2d');
    return {
      draw(c, t, o = {}) {
        const beat = o.beat || 0, bt = o.beatT || 0; const expr = o.variant || 'menace';
        if (beat <= 2) {
          ART.nightStreet.draw(c, t, { variant: 'man', actor: 'Stranger', noBag: true });
          alpha(c, 0.45, () => R(c, '#000000', 0, 0, W, H));
          const lean = beat === 2 ? Math.round(Math.min(1, bt) * 6) : 0;
          oc.clearRect(0, 0, 100, 140); window.ACTORS.Stranger(oc, t, beat === 0 ? expr : (expr === 'laugh' ? 'smile' : expr));
          c.save(); c.imageSmoothingEnabled = false; c.translate(160, 180); c.scale(1.15 + lean * 0.01, 1.15 + lean * 0.01); c.drawImage(off, -50, -140 + 4); c.restore();
          if (beat === 2) alpha(c, 0.12 + Math.sin(t * 6) * 0.05, () => R(c, '#ff1a2a', 0, 0, W, H));
          return;
        }
        if (beat === 3) {
          ART.nightStreet.draw(c, t, { variant: 'man', actor: 'Stranger', noBag: true }); alpha(c, 0.6, () => R(c, '#000000', 0, 0, W, H));
          const k = ease(Math.min(1, bt / 0.7)); const x = Math.round(lerp(330, 100, k)), y = 50;
          R(c, '#b98563', x + 90, y + 34, 40, 18); R(c, '#26232e', x + 124, y + 30, 40, 26); // hand + sleeve
          R(c, '#2c1f45', x - 1, y - 1, 112, 62); R(c, '#f4efe6', x, y, 110, 60); R(c, '#1b1416', x, y, 110, 12);
          text3(c, '#ffd23f', 'ENTREGAS', x + 6, y + 3, 1); text3(c, '#1b1416', 'WORK WITH ME', x + 8, y + 20, 1);
          text3(c, '#1b1416', 'LIBERDADE, 43', x + 8, y + 32, 1); text3(c, '#1b1416', 'SAO PAULO', x + 8, y + 40, 1);
          R(c, '#c01020', x + 86, y + 40, 14, 14); text3(c, '#ffffff', 'X', x + 92, y + 44, 1);
          return;
        }
        // home, sleep, morning — then the walk to the address
        const k = Math.min(1, bt / 3);
        bands(c, [mix('#0b0920', '#9fd8ff', k), mix('#110d23', '#bfe6ff', k), mix('#16112b', '#e0f2ff', k)], 0, 120);
        skyline(c, 17, 130, mix('#0a0914', '#8a96b0', k), '#ffd23f', 20, 64);
        R(c, mix('#0a0914', '#5a5a6a', k), 0, 130, W, 50);
        disc(c, '#ffd23f', 260, Math.round(lerp(140, 30, ease(k))), 10);
        text3(c, mix('#5a5678', '#2c1f45', k), 'NEXT MORNING', 112, 24, 2);
      },
    };
  })();
})();
