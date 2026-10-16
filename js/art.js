/* =====================================================================
   Life — procedural pixel art. Everything is drawn on a 320x180 canvas
   and scaled up with image-rendering: pixelated.
   ART[id] = { draw(ctx, t, opts) }   (t = seconds since scene start)
   ===================================================================== */
(function () {
  const W = 320, H = 180;

  /* ---------- helpers ---------- */
  const R = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const P = (c, col, x, y) => R(c, col, x, y, 1, 1);
  function disc(c, col, cx, cy, r) {
    cx = Math.round(cx); cy = Math.round(cy);
    for (let dy = -r; dy <= r; dy++) { const dx = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy))); R(c, col, cx - dx, cy + dy, dx * 2 + 1, 1); }
  }
  function ell(c, col, cx, cy, rx, ry) {
    cx = Math.round(cx); cy = Math.round(cy);
    for (let dy = -ry; dy <= ry; dy++) { const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))); R(c, col, cx - dx, cy + dy, dx * 2 + 1, 1); }
  }
  function mk(w, h, fn) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); fn(x, cv); return cv; }
  function sprite(rows, pal) {
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    return mk(w, h, x => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const col = pal[r[i]]; if (col) P(x, col, i, j); } }));
  }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function bands(c, cols, y0, y1, x0 = 0, w = W) {
    const n = cols.length, bh = (y1 - y0) / n;
    for (let i = 0; i < n; i++) { const ya = Math.round(y0 + i * bh), yb = Math.round(y0 + (i + 1) * bh); R(c, cols[i], x0, ya, w, yb - ya); }
    for (let i = 1; i < n; i++) {
      const y = Math.round(y0 + i * bh);
      for (let x = x0; x < x0 + w; x++) {
        if (x % 2 === 0) P(c, cols[i], x, y - 1);
        if (x % 2 === 1) P(c, cols[i - 1], x, y);
      }
    }
  }
  const wrap = (v, m) => ((v % m) + m) % m;
  const sn = (t) => Math.round(Math.sin(t));

  /* ---------- tiny 3x5 pixel font for signs ---------- */
  const F3 = {
    A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',
    G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',
    M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',Q:'010101101110011',R:'110101110101101',
    S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',
    Y:'101101010010010',Z:'111001010100111','0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110',
    '4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
    '!':'010010010000010','?':'110001010000010','.':'000000000000010','-':'000000111000000',"'":'010010000000000',' ':'000000000000000',
  };
  function text3(c, col, s, x, y, scale = 1) {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const g = F3[ch] || F3[' '];
      for (let i = 0; i < 15; i++) if (g[i] === '1') R(c, col, cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale);
      cx += 4 * scale;
    }
    return cx - x;
  }

  /* ---------- shared pieces ---------- */
  function makeCloud(w, seed, col = '#ffffff', shade = '#d4ebff') {
    const r = rng(seed); const h = Math.round(w * 0.5); const base = h - 2;
    return mk(w, h, (c) => {
      const n = 3 + Math.floor(r() * 3);
      R(c, col, Math.round(w * 0.1), base - 4, Math.round(w * 0.8), 5);
      for (let i = 0; i < n; i++) {
        const cx = Math.round(w * (0.22 + 0.56 * i / (n - 1)));
        let rad = Math.round(h * (0.28 + r() * 0.3)); rad = Math.min(rad, Math.floor((base) / 2));
        disc(c, col, cx, base - rad, rad);
      }
      const id = c.getImageData(0, 0, w, h); const d = id.data;
      const sh = [parseInt(shade.slice(1, 3), 16), parseInt(shade.slice(3, 5), 16), parseInt(shade.slice(5, 7), 16)];
      for (let x = 0; x < w; x++) {
        let low = -1; for (let y = h - 1; y >= 0; y--) if (d[(y * w + x) * 4 + 3] > 0) { low = y; break; }
        for (let k = 0; k < 2 && low - k >= 0; k++) { const o = ((low - k) * w + x) * 4; if (k === 1 && x % 2) continue; d[o] = sh[0]; d[o + 1] = sh[1]; d[o + 2] = sh[2]; }
      }
      c.putImageData(id, 0, 0);
    });
  }
  function cloudLayer(seed, n, yMin, yMax, wMin, wMax, spMin, spMax, col, shade) {
    const r = rng(seed); const arr = [];
    for (let i = 0; i < n; i++) { const w = Math.round(wMin + r() * (wMax - wMin)); arr.push({ img: makeCloud(w, seed * 31 + i, col, shade), x: r() * (W + w), y: Math.round(yMin + r() * (yMax - yMin)), sp: spMin + r() * (spMax - spMin) }); }
    return arr;
  }
  function drawClouds(c, arr, t) { for (const k of arr) { const span = W + k.img.width; const x = Math.round(wrap(k.x + t * k.sp, span) - k.img.width); c.drawImage(k.img, x, k.y); } }

  function sun(c, cx, cy, r, t, glow = true) {
    if (glow) { c.globalAlpha = 0.18; disc(c, '#fff6b0', cx, cy, r + 9); c.globalAlpha = 0.3; disc(c, '#fff3a0', cx, cy, r + 5); c.globalAlpha = 1; }
    for (let a = 0; a < 16; a++) {
      const ang = a / 16 * Math.PI * 2 + t * 0.2; const len = r + 4 + (a % 2 ? 3 : 7) + Math.round(Math.sin(t * 3 + a) * 1.2);
      for (let d = r + 3; d < len; d++) P(c, a % 2 ? '#ffd23f' : '#ffe680', cx + Math.round(Math.cos(ang) * d), cy + Math.round(Math.sin(ang) * d));
    }
    disc(c, '#ffc93c', cx, cy, r); disc(c, '#ffe14d', cx - 1, cy - 1, r - 2); disc(c, '#fff08a', cx - 3, cy - 3, Math.max(1, r - 7)); disc(c, '#fffbe0', cx - 5, cy - 5, Math.max(1, r - 12));
  }

  const BIRD = [
    sprite(['#...#', '.#.#.', '..#..'], { '#': '#2c2440' }),
    sprite(['.....', '##.##', '..#..'], { '#': '#2c2440' }),
    sprite(['.....', '.....', '#####'], { '#': '#2c2440' }),
  ];
  function birds(c, list, t) {
    for (const b of list) {
      const span = W + 40; const x = Math.round(wrap(b.x + t * b.sp, span) - 20);
      const y = Math.round(b.y + Math.sin(t * 1.3 + b.ph) * 3);
      const f = Math.floor(wrap(t * 7 + b.ph * 3, 4)); c.drawImage(BIRD[f === 3 ? 1 : f], x, y);
    }
  }
  function sparkle(c, x, y, s, col = '#ffffff') {
    P(c, col, x, y); if (s > 0) { P(c, col, x - 1, y); P(c, col, x + 1, y); P(c, col, x, y - 1); P(c, col, x, y + 1); }
    if (s > 1) { P(c, col, x - 2, y); P(c, col, x + 2, y); P(c, col, x, y - 2); P(c, col, x, y + 2); }
  }
  function twinkles(c, list, t, col) {
    for (const s of list) { const ph = wrap(t * s.sp + s.ph, 1); if (ph < 0.45) sparkle(c, s.x, s.y, ph < 0.15 || ph > 0.3 ? 0 : (ph < 0.22 ? 1 : 2), col || s.col); }
  }
  const HEART = sprite(['.#.#.', '#####', '.###.', '..#..'], { '#': '#f4b6dc' });

  /* ---------- the yellow pepper plushie (Sarı Biber) ---------- */
  const PEPPER = sprite([
    '.......gG.......',
    '......GGg.......',
    '...yYYYGYYYy....',
    '..YLLYYYYYYYYy..',
    '.YLLYYYYYYYYYYy.',
    '.YLYYYYYYYYYYYy.',
    '.YYYEEYYYYEEYYy.',
    '.YYYEWYYYYEWYYy.',
    '.YPPYYYMMYYYPPy.',
    '.YYYYYYYMYYYYYy.',
    '.YYYYYYYYYYYYyy.',
    '..YYYyYYYYyYYy..',
    '..YYyyyYYyyyyy..',
    '...yy..yy...y...',
  ], { Y: '#ffd23f', y: '#e8a21c', L: '#fff3a3', G: '#3fae4a', g: '#25763a', E: '#2a1c2e', W: '#ffffff', P: '#ff8fa3', M: '#a3392f' });

  /* ---------- Sylvanian-style mole ---------- */
  function mole(c, x, yFeet, item, small) {
    const fur = '#6f5b52', dark = '#4c3c36', light = '#8c7569', nose = '#ff9fb2', paw = '#f5b9a6';
    const s = small ? 0.7 : 1;
    const h = Math.round(13 * s), rx = Math.round(5 * s) + (small ? 1 : 0);
    const top = yFeet - h;
    // body/head blob
    ell(c, fur, x, top + Math.round(h / 2), rx, Math.round(h / 2));
    R(c, light, x - rx + 2, top + 2, 2, 2);
    // clothes on lower half
    const cy = top + Math.round(h * 0.5);
    for (let y = cy; y < yFeet - 1; y++) {
      const dy = y - (top + h / 2); const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((h / 2) * (h / 2)))));
      R(c, item.color, x - dx, y, dx * 2 + 1, 1);
    }
    if (item.acc === 'overalls') { R(c, item.color, x - 3, cy - 2, 1, 2); R(c, item.color, x + 3, cy - 2, 1, 2); P(c, '#ffd23f', x - 3, cy); P(c, '#ffd23f', x + 3, cy); }
    if (item.acc === 'apron') { R(c, '#ffffff', x - 2, cy + 1, 5, Math.max(2, yFeet - cy - 3)); }
    if (item.acc === 'bib') { R(c, '#ffffff', x - 2, cy, 5, 2); }
    // eyes, snout
    const ey = top + Math.round(3 * s) + 1;
    P(c, '#1b1416', x - 2, ey); P(c, '#1b1416', x + 2, ey);
    R(c, nose, x - 1, ey + 1, 3, 2); P(c, '#ffd0db', x, ey + 1);
    // paws + feet
    R(c, paw, x - rx - 1, cy + 1, 2, 2); R(c, paw, x + rx, cy + 1, 2, 2);
    R(c, dark, x - 3, yFeet - 1, 3, 1); R(c, dark, x + 1, yFeet - 1, 3, 1);
    if (item.acc === 'cap') { R(c, item.color, x - 3, top - 1, 7, 2); R(c, item.color, x + 3, top, 3, 1); }
    if (item.acc === 'bow') { R(c, '#ff6fa8', x - 4, top, 2, 2); R(c, '#ff6fa8', x - 1, top, 2, 2); P(c, '#d94b86', x - 2, top + 1); }
  }

  /* inventory icons (16x16) */
  function drawIcon(cv, itemId) {
    const c = cv.getContext('2d'); c.clearRect(0, 0, 16, 16);
    const item = window.ITEMS && window.ITEMS[itemId]; if (!item) { // empty slot: faint sparkle
      sparkle(c, 8, 8, 2, '#b8a9cc'); return; }
    if (item.icon === 'pepper') { c.drawImage(PEPPER, 0, 1); return; }
    if (item.icon === 'mole') { mole(c, 8, 15, item, item.small); }
  }

  /* ---------- people ---------- */
  function person(c, x, yFeet, o) {
    // o: skin, hair, shirt, stripe, pants, shoes, face(1/-1), pose(0 guard,1 punch,2 recoil), bob
    const f = o.face, pose = o.pose || 0; const by = (o.bob || 0);
    const lean = pose === 1 ? f * 2 : pose === 2 ? -f * 2 : 0;
    const top = yFeet - 31 + by;
    // legs
    const sp = pose === 1 ? 3 : 2;
    R(c, o.pants, x - 1 - sp - 1, yFeet - 11, 3, 10); R(c, o.pants, x + sp - 1, yFeet - 11, 3, 10);
    R(c, o.shoes, x - 1 - sp - 2, yFeet - 2, 5, 2); R(c, o.shoes, x + sp - 1, yFeet - 2, 5, 2);
    // torso
    const tx = x - 5 + lean, ty = top + 9;
    R(c, o.shirt, tx, ty, 11, 12);
    if (o.stripe) for (let i = 1; i < 11; i += 3) R(c, o.stripe, tx + i, ty, 1, 12);
    if (o.collar) R(c, o.collar, tx + 3, ty, 5, 1);
    R(c, 'rgba(0,0,0,0.18)', tx, ty + 10, 11, 2);
    // head
    const hx = tx + 2 + (f > 0 ? 1 : 0), hy = top;
    R(c, o.skin, hx, hy + 1, 7, 8); R(c, o.hair, hx, hy, 7, 3); R(c, o.hair, f > 0 ? hx : hx + 6, hy + 2, 1, 3);
    const ex = f > 0 ? hx + 5 : hx + 1;
    P(c, '#1b1416', ex, hy + 4); R(c, '#1b1416', f > 0 ? ex - 1 : ex, hy + 3, 2, 1); // angry brow
    R(c, pose === 2 ? '#7a1f2b' : '#5a2a22', f > 0 ? hx + 4 : hx + 1, hy + 7, 2, 1);
    if (pose === 2) { P(c, '#ff7b8a', f > 0 ? hx + 2 : hx + 4, hy + 5); }
    if (o.cap) { R(c, o.cap, hx - 1, hy - 1, 8, 3); R(c, o.cap, f > 0 ? hx + 6 : hx - 3, hy + 1, 4, 1); }
    // arms
    const sx = f > 0 ? tx + 9 : tx + 1; // front shoulder
    if (pose === 1) {
      R(c, o.shirt, sx, ty + 1, f * 6, 3); R(c, o.skin, sx + f * 6 + (f > 0 ? 0 : -1), ty + 1, f * 4, 3);
      R(c, o.skin, sx + f * 10 + (f > 0 ? 0 : -2), ty, 3, 4);
    } else {
      R(c, o.shirt, sx + (f > 0 ? 0 : -2), ty + 1, 3, 5); R(c, o.skin, sx + f * 2, ty - 3, 3, 5); R(c, o.skin, sx + f * 2 - 1, ty - 4, 4, 3);
    }
    const bx = f > 0 ? tx - 1 : tx + 10; // back arm guarding
    R(c, o.shirt, bx, ty + 1, 2, 5); R(c, o.skin, bx + f * 2, ty + 2, 3, 4);
  }

  /* ---------- Osvaldo (homeless, grumpy, bitten onion) ---------- */
  function osvaldo(c, x, y, t) {
    // x,y = top-left of a ~70x30 area; he reclines on cardboard, propped on an elbow
    const breathe = Math.sin(t * 2.2) > 0.2 ? 1 : 0;
    // cardboard
    R(c, '#b98a55', x - 4, y + 24, 76, 6); R(c, '#d1a46d', x - 4, y + 24, 76, 1); R(c, '#9a6f40', x + 20, y + 25, 1, 5); R(c, '#9a6f40', x + 46, y + 25, 1, 5);
    text3(c, '#8a6236', 'FRAGIL', x + 50, y + 25, 1);
    // blanket over legs
    R(c, '#5a6a8a', x + 26, y + 16, 34, 8); R(c, '#6d7fa3', x + 26, y + 16, 34, 2); R(c, '#4a5874', x + 40, y + 18, 1, 6);
    // feet + worn shoes
    R(c, '#2b2422', x + 60, y + 17, 6, 7); R(c, '#433733', x + 61, y + 17, 4, 2); P(c, '#d9a27a', x + 64, y + 21);
    // torso (coat), propped
    R(c, '#7a5a3a', x + 8, y + 10 - breathe, 20, 14 + breathe); R(c, '#8f6c48', x + 9, y + 11 - breathe, 6, 3);
    R(c, '#5f452c', x + 18, y + 12 - breathe, 1, 12); P(c, '#c9a35a', x + 17, y + 15 - breathe); P(c, '#c9a35a', x + 17, y + 19 - breathe);
    R(c, '#6b4f33', x + 24, y + 14, 3, 3); // patch
    // elbow arm on ground
    R(c, '#6a4c30', x + 4, y + 18, 7, 6); R(c, '#c08860', x + 2, y + 21, 4, 3);
    // head
    const hx = x + 5, hy = y - 1 - breathe;
    R(c, '#c48a5e', hx, hy + 2, 10, 9); R(c, '#a8714a', hx, hy + 8, 10, 1);
    R(c, '#6c6258', hx - 1, hy + 7, 12, 5); R(c, '#857a6f', hx, hy + 8, 3, 2); R(c, '#575048', hx + 6, hy + 10, 4, 2); // beard
    R(c, '#9a3b32', hx - 1, hy - 1, 12, 4); R(c, '#b64c40', hx, hy - 1, 10, 1); R(c, '#7f2f28', hx - 1, hy + 2, 12, 1); P(c, '#d8d0c0', hx + 4, hy - 2); // beanie
    // grumpy face (looking right, at the player)
    const tw = Math.sin(t * 5) > 0.92 ? 1 : 0;
    R(c, '#2a1d1a', hx + 3, hy + 3 - tw, 3, 1); R(c, '#2a1d1a', hx + 7, hy + 3 - tw, 3, 1); P(c, '#2a1d1a', hx + 5, hy + 4); P(c, '#2a1d1a', hx + 7, hy + 4);
    P(c, '#ffffff', hx + 4, hy + 5); P(c, '#1b1416', hx + 5, hy + 5); P(c, '#ffffff', hx + 7, hy + 5); P(c, '#1b1416', hx + 8, hy + 5);
    R(c, '#a8644a', hx + 8, hy + 6, 2, 2); // nose
    R(c, '#3a2522', hx + 5, hy + 9, 4, 1); P(c, '#3a2522', hx + 4, hy + 10); P(c, '#3a2522', hx + 9, hy + 10); // frown
    P(c, '#8d6a4a', hx + 1, hy + 4); P(c, '#8d6a4a', hx + 2, hy + 7); // dirt
    // raised arm holding a bitten onion
    const ob = Math.round(Math.sin(t * 1.6) * 1.5);
    R(c, '#7a5a3a', x + 22, y + 6 + ob, 4, 7); R(c, '#7a5a3a', x + 24, y + 2 + ob, 4, 6);
    R(c, '#c48a5e', x + 25, y - 1 + ob, 4, 4);
    const ox = x + 30, oy = y - 4 + ob;
    disc(c, '#a0569c', ox, oy, 4); disc(c, '#c27cc0', ox - 1, oy - 1, 2); P(c, '#e7c3ea', ox - 2, oy - 2);
    R(c, '#7d3e7c', ox - 3, oy + 1, 1, 2);
    R(c, '#f6efd9', ox + 2, oy - 3, 3, 3); P(c, '#f6efd9', ox + 1, oy - 2); P(c, '#ffffff', ox + 3, oy - 2); // bite
    R(c, '#7bbf4a', ox - 1, oy - 7, 1, 3); R(c, '#9bd85f', ox, oy - 8, 1, 3); // sprout
    R(c, '#e9dcc4', ox - 1, oy + 4, 3, 1); // roots
    // stink lines
    for (let i = 0; i < 2; i++) {
      const ph = wrap(t * 0.6 + i * 0.5, 1); const sy = y + 6 - Math.round(ph * 16); const sx = x + 38 + i * 12;
      if (ph < 0.85) for (let k = 0; k < 5; k++) P(c, '#a9c46a', sx + sn(t * 4 + k + i) , sy + k);
    }
    // flies
    for (let i = 0; i < 3; i++) {
      const a = t * (3 + i) + i * 2; P(c, '#1b1416', Math.round(hx + 5 + Math.cos(a) * (8 + i * 2)), Math.round(hy - 2 + Math.sin(a * 1.3) * 4));
    }
  }

  /* ---------- pigeon ---------- */
  function pigeon(c, x, y, t, face = 1) {
    const peck = wrap(t, 2.2) > 1.7 ? 2 : 0;
    const body = '#8d93a8', dark = '#5f6478', neck = '#6db39a';
    R(c, body, x - 4, y - 4, 8, 4); R(c, dark, x - 5 * face - (face < 0 ? -1 : 0), y - 4, 2, 2);
    R(c, '#a7adc0', x - 2, y - 4, 4, 1);
    const hx = x + 3 * face + (face < 0 ? -2 : 0);
    R(c, neck, hx, y - 6 + peck, 2, 3); R(c, body, hx, y - 8 + peck, 3, 3);
    P(c, '#ff9b2f', hx + (face > 0 ? 2 : 0), y - 7 + peck); P(c, '#e9d36a', hx + (face > 0 ? 3 : -1), y - 7 + peck);
    R(c, '#e8706a', x - 2, y, 1, 1); R(c, '#e8706a', x + 1, y, 1, 1);
  }

  /* ---------- steam ---------- */
  function steam(c, x, y, t, n = 3) {
    for (let i = 0; i < n; i++) {
      const ph = wrap(t * 0.55 + i / n, 1); const yy = y - Math.round(ph * 22); const xx = x + i * 3 - 3 + Math.round(Math.sin(t * 2 + i + ph * 6) * 2);
      if (ph > 0.9) continue; c.globalAlpha = 0.85 - ph * 0.8;
      R(c, '#ffffff', xx, yy, ph < 0.4 ? 2 : 3, 2); c.globalAlpha = 1;
    }
  }

  /* ---------- sidewalk (Portuguese pavement waves) ---------- */
  function calcada(c, y0, y1, seed) {
    const r = rng(seed);
    for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
      const v = Math.sin(x * 0.11 + Math.sin(y * 0.21) * 1.2 + y * 0.32);
      let col = v > 0.35 ? '#2f2d33' : '#efe9dc';
      const n = r(); if (n < 0.05) col = v > 0.35 ? '#45424b' : '#d9d1c1'; else if (n < 0.08) col = v > 0.35 ? '#24222a' : '#fbf7ee';
      P(c, col, x, y);
    }
    R(c, '#cfc7b6', 0, y0, W, 1);
  }

  /* ---------- skyline ---------- */
  function skyline(c, seed, base, col, win, minH, maxH) {
    const r = rng(seed); let x = -4;
    while (x < W) {
      const w = 14 + Math.floor(r() * 22), h = minH + Math.floor(r() * (maxH - minH));
      R(c, col, x, base - h, w, h);
      for (let wy = base - h + 3; wy < base - 2; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (r() < 0.7) P(c, win, wx, wy);
      if (r() < 0.6) { R(c, '#7fa0c6', x + 3, base - h - 4, 6, 4); R(c, '#6a8bb2', x + 3, base - h - 1, 6, 1); }
      if (r() < 0.4) R(c, col, x + w - 4, base - h - 7, 1, 7);
      x += w + Math.floor(r() * 3);
    }
  }

  function wires(c, x1, y1, x2, y2, sag, col) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      const k = (x - x1) / (x2 - x1); const y = y1 + (y2 - y1) * k + sag * 4 * k * (1 - k); P(c, col, x, Math.round(y));
    }
  }

  /* =====================================================================
     SCENE ART
     ===================================================================== */
  const ART = {};
  const RAINBOW = ['#ff5a6e', '#ff9f43', '#ffe14d', '#6ee36e', '#4dc3ff', '#7a7aff', '#c77dff'];

  /* ----- MENU ----- */
  ART.menu = (() => {
    let bg, clouds, flowers, tw, bl, ready = false;
    const midY = (x) => Math.round(134 - 7 * Math.sin(x * 0.03 + 2.5) - 4 * Math.sin(x * 0.09));
    function init() {
      const r = rng(11);
      bg = mk(W, H, (c) => {
        bands(c, ['#38aefc', '#52bdff', '#6ecbff', '#8fd8ff', '#b2e5ff', '#d6f2ff', '#ffe6f2', '#ffd3e6'], 0, 150);
        for (let y = 44; y < 150; y++) for (let x = 50; x < 270; x++) {
          const d = Math.hypot(x - 160, y - 150); const b = Math.floor((d - 74) / 4); if (b >= 0 && b < 7) P(c, RAINBOW[b], x, y);
        }
        for (let x = 0; x < W; x++) { const y = Math.round(116 - 9 * Math.sin(x * 0.025 + 1) - 5 * Math.sin(x * 0.07)); R(c, '#a8eba0', x, y, 1, H - y); P(c, '#c9f7bb', x, y); }
        // far little trees
        for (let i = 0; i < 9; i++) { const x = 12 + i * 36 + Math.floor(r() * 10); const y = Math.round(116 - 9 * Math.sin(x * 0.025 + 1) - 5 * Math.sin(x * 0.07)); R(c, '#6aa85b', x, y - 4, 1, 4); disc(c, '#7cc96c', x, y - 6, 3); P(c, '#a8e690', x - 1, y - 7); }
        for (let x = 0; x < W; x++) { const y = midY(x); R(c, '#6fd36f', x, y, 1, H - y); P(c, '#a3ec92', x, y); if (x % 7 === 0) P(c, '#a3ec92', x, y - 1); }
        // trees on mid hills (x=30 has a hollow)
        for (const tx of [30, 60, 262, 294]) {
          const y = midY(tx);
          R(c, '#8a5a3b', tx - 3, y - 16, 6, 17); R(c, '#a8714a', tx - 2, y - 16, 2, 17);
          disc(c, '#2f9e4f', tx, y - 25, 12); disc(c, '#45b860', tx - 2, y - 27, 9); disc(c, '#6fd36f', tx - 4, y - 30, 4);
          for (let k = 0; k < 6; k++) P(c, '#ff7aa8', tx - 8 + Math.floor(r() * 16), y - 33 + Math.floor(r() * 14));
          if (tx === 30) ell(c, '#3a2418', tx, y - 9, 1, 2);
        }
        for (let x = 0; x < W; x++) { const y = Math.round(153 - 5 * Math.sin(x * 0.04 + 0.3)); R(c, '#45b65a', x, y, 1, H - y); P(c, '#6fd36f', x, y); if (x % 5 === 0) { P(c, '#6fd36f', x, y - 1); P(c, '#349a49', x + 1, y + 3); } }
        for (let i = 0; i < 70; i++) P(c, '#3a9f4e', Math.floor(r() * W), 158 + Math.floor(r() * 22));
      });
      clouds = cloudLayer(5, 5, 6, 60, 26, 46, 2, 5);
      flowers = []; const fc = ['#ff6b9a', '#ffd23f', '#ffffff', '#b27bff', '#ff9f43'];
      for (let i = 0; i < 46; i++) flowers.push({ x: Math.floor(r() * W), y: 158 + Math.floor(r() * 20), c: fc[i % fc.length], ph: r() * 6 });
      tw = []; for (let i = 0; i < 12; i++) tw.push({ x: 10 + Math.floor(r() * 300), y: 6 + Math.floor(r() * 70), sp: 0.3 + r() * 0.5, ph: r(), col: '#ffffff' });
      bl = [{ x: 10, y: 22, sp: 16, ph: 0 }, { x: 22, y: 30, sp: 16, ph: 1.4 }, { x: 160, y: 48, sp: 11, ph: 2.1 }, { x: 240, y: 16, sp: 21, ph: 0.6 }];
      ready = true;
    }
    function draw(c, t, opts = {}) {
      if (!ready) init();
      c.drawImage(bg, 0, 0);
      sun(c, 278, 34, 13, t);
      drawClouds(c, clouds, t);
      birds(c, bl, t);
      twinkles(c, tw, t);
      // the tree hollow: once in a while, something blinks back at you
      const e = wrap(t, 13);
      if (e > 9.0 && e < 9.9 && !(e > 9.35 && e < 9.45)) { const y = midY(30); P(c, '#fff4d6', 30, y - 9); P(c, '#b3001b', 30, y - 9 + (e > 9.6 ? 0 : 0)); P(c, '#fff4d6', 30, y - 10); }
      // flowers
      for (const f of flowers) {
        const s = Math.round(Math.sin(t * 2 + f.ph) * 0.8);
        P(c, '#2f8f3f', f.x, f.y + 1); P(c, '#2f8f3f', f.x, f.y + 2);
        P(c, f.c, f.x + s, f.y - 1); P(c, f.c, f.x - 1 + s, f.y); P(c, f.c, f.x + 1 + s, f.y); P(c, '#ffe14d', f.x + s, f.y);
      }
      // butterflies
      for (let i = 0; i < 2; i++) {
        const bx = Math.round(70 + i * 170 + Math.sin(t * 0.5 + i * 2) * 34), by = Math.round(128 + Math.sin(t * 1.3 + i) * 10);
        const open = Math.floor(t * 8 + i) % 2; const col = i ? '#ff9f43' : '#ff6fb1';
        P(c, '#2c2440', bx, by); P(c, '#2c2440', bx, by + 1);
        if (open) { R(c, col, bx - 2, by - 1, 2, 2); R(c, col, bx + 1, by - 1, 2, 2); } else { R(c, col, bx - 1, by - 2, 1, 2); R(c, col, bx + 1, by - 2, 1, 2); }
      }
      if (opts.dim) { c.fillStyle = 'rgba(44,31,69,0.28)'; c.fillRect(0, 0, W, H); }
    }
    return { draw };
  })();

  /* ----- MORNING SKY (cutscene, POV lying on the grass) ----- */
  ART.morningSky = (() => {
    let bg, clouds, leaves, grass, petals, tw, ready = false;
    function init() {
      const r = rng(23);
      bg = mk(W, H, (c) => bands(c, ['#2c8cff', '#3d9cff', '#52aeff', '#69bfff', '#82ceff', '#9edbff', '#bde8ff', '#dcf4ff', '#f3fbff'], 0, 180));
      clouds = cloudLayer(9, 6, 10, 120, 34, 70, 2.5, 6);
      leaves = [];
      const cluster = (cx, cy, n, spread) => { for (let i = 0; i < n; i++) leaves.push({ x: cx + (r() - 0.5) * spread, y: cy + (r() - 0.5) * spread * 0.6, r: 4 + Math.floor(r() * 6), c: ['#2e9a4a', '#3fae55', '#5cc46a', '#86dd7f'][Math.floor(r() * 4)], ph: r() * 6 }); };
      cluster(300, 6, 26, 70); cluster(262, -4, 14, 40); cluster(14, 2, 16, 44);
      leaves.sort((a, b) => a.r - b.r);
      grass = []; for (let x = -2; x < W + 2; x += 2) grass.push({ x, h: 6 + Math.floor(r() * 12), c: ['#2f9e4f', '#45b860', '#6fd36f'][Math.floor(r() * 3)], ph: r() * 6 });
      petals = []; for (let i = 0; i < 14; i++) petals.push({ x: r() * W, y: r() * H, sp: 6 + r() * 8, ph: r() * 6, c: i % 3 ? '#ffc2dc' : '#ffffff' });
      tw = []; for (let i = 0; i < 10; i++) tw.push({ x: 30 + Math.floor(r() * 260), y: 20 + Math.floor(r() * 110), sp: 0.35 + r() * 0.4, ph: r(), col: '#ffffff' });
      ready = true;
    }
    function draw(c, t) {
      if (!ready) init();
      c.drawImage(bg, 0, 0);
      sun(c, 92, 52, 18, t);
      // lens flare
      c.globalAlpha = 0.28; disc(c, '#fff7c2', 150, 90, 5); disc(c, '#ffd1f0', 186, 112, 8); disc(c, '#c9f0ff', 214, 129, 3); c.globalAlpha = 1;
      drawClouds(c, clouds, t);
      // bird flock (V) crossing
      const fx = wrap(t * 22, W + 120) - 60, fy = 70 + Math.sin(t * 0.7) * 6;
      const flock = [[0, 0], [-7, -4], [-7, 4], [-14, -8], [-14, 8]];
      flock.forEach(([dx, dy], i) => { const f = Math.floor(wrap(t * 7 + i, 4)); c.drawImage(BIRD[f === 3 ? 1 : f], Math.round(fx + dx), Math.round(fy + dy)); });
      birds(c, [{ x: 200, y: 30, sp: -13, ph: 1 }, { x: 40, y: 140, sp: 9, ph: 2 }], t);
      twinkles(c, tw, t);
      // petals
      for (const p of petals) { const x = Math.round(wrap(p.x + t * p.sp, W)), y = Math.round(wrap(p.y + t * p.sp * 0.6, H)); P(c, p.c, x + sn(t * 2 + p.ph), y); P(c, p.c, x + 1 + sn(t * 2 + p.ph), y); }
      // branch + leaves framing the top corners
      for (let i = 0; i < 70; i++) { P(c, '#6b4a33', 320 - i, Math.round(4 + i * 0.25)); P(c, '#6b4a33', 320 - i, Math.round(5 + i * 0.25)); }
      for (const l of leaves) { const s = Math.round(Math.sin(t * 1.4 + l.ph)); disc(c, l.c, l.x + s, l.y, l.r); }
      // grass at the bottom edge
      for (const g of grass) {
        const lean = Math.sin(t * 1.8 + g.ph + g.x * 0.05) * 2;
        for (let k = 0; k < g.h; k++) P(c, g.c, Math.round(g.x + lean * (k / g.h)), H - 1 - k);
      }
      for (let i = 0; i < 6; i++) { const x = 20 + i * 55, y = H - 10 - (i % 2) * 4; const s = sn(t * 2 + i); P(c, i % 2 ? '#ffd23f' : '#ff6b9a', x + s, y - 1); P(c, i % 2 ? '#ffd23f' : '#ff6b9a', x - 1 + s, y); P(c, i % 2 ? '#ffd23f' : '#ff6b9a', x + 1 + s, y); P(c, '#fff', x + s, y); }
    }
    return { draw };
  })();

  /* ----- BEDROOM ----- */
  ART.bedroom = (() => {
    let bg, winClouds, dust, ready = false;
    const MOLES = ['mole_father', 'mole_mother', 'mole_sister', 'mole_brother', 'mole_baby'];
    function init() {
      const r = rng(41);
      bg = mk(W, H, (c) => {
        // wall + wallpaper
        R(c, '#f7dcef', 0, 0, W, 112);
        for (let y = 6, row = 0; y < 106; y += 13, row++) for (let x = (row % 2) * 9; x < W; x += 18) c.drawImage(HEART, x, y);
        for (let x = 0; x < W; x += 4) P(c, '#f1cde6', x, 108);
        // baseboard
        R(c, '#ffffff', 0, 110, W, 4); R(c, '#e6c7dc', 0, 114, W, 1);
        // floor planks
        R(c, '#dca46c', 0, 115, W, H - 115);
        for (let y = 115, row = 0; y < H; y += 6, row++) { R(c, '#cf955c', 0, y + 5, W, 1); for (let x = (row % 2) * 23; x < W; x += 46) R(c, '#b97e49', x, y, 1, 5); }
        // rug
        ell(c, '#ff9ec7', 160, 132, 70, 11); ell(c, '#ffc2dc', 160, 132, 62, 8); for (let a = 0; a < 24; a++) P(c, '#ffffff', Math.round(160 + Math.cos(a / 24 * 6.283) * 66), Math.round(132 + Math.sin(a / 24 * 6.283) * 9.5));
        // window
        R(c, '#ffffff', 126, 18, 52, 50);
        bands(c, ['#5fc0ff', '#7fd0ff', '#a6e1ff', '#cfefff'], 21, 65, 129, 46);
        R(c, '#ffffff', 151, 21, 2, 44); R(c, '#ffffff', 129, 42, 46, 2);
        R(c, '#ffffff', 122, 66, 60, 3); R(c, '#e6c7dc', 122, 69, 60, 1);
        // little cactus on the sill
        R(c, '#e96f4c', 168, 61, 6, 5); R(c, '#4fae5a', 170, 55, 2, 6); R(c, '#4fae5a', 168, 57, 1, 3);
        // poster: a child's crayon drawing
        R(c, '#ffffff', 206, 22, 30, 24); R(c, '#bfe8ff', 207, 23, 28, 14); disc(c, '#ffd23f', 229, 28, 3);
        R(c, '#ff7aa8', 211, 32, 10, 8); for (let i = 0; i < 6; i++) R(c, '#ff4d6d', 210 + i, 31 - i, 12 - i * 2, 1);
        R(c, '#7a4a2a', 215, 36, 2, 4); R(c, '#6fd36f', 207, 40, 28, 5); R(c, '#ffe08a', 205, 21, 4, 2); R(c, '#ffe08a', 233, 21, 4, 2);
        // shelf above desk
        R(c, '#e8b07a', 16, 46, 84, 3); R(c, '#c98d5a', 16, 49, 84, 1); R(c, '#c98d5a', 20, 50, 2, 3); R(c, '#c98d5a', 94, 50, 2, 3);
        const books = ['#ff6b9a', '#4dc3ff', '#ffd23f', '#7ae582', '#b27bff', '#ff9f43'];
        let bx = 20; for (let i = 0; i < 7; i++) { const h = 9 + Math.floor(r() * 5), w = 3 + Math.floor(r() * 2); R(c, books[i % 6], bx, 46 - h, w, h); P(c, '#ffffff', bx + 1, 46 - h + 2); bx += w + 1; }
        // jar of crayons
        R(c, '#cfefff', 82, 38, 8, 8); R(c, '#ff4d6d', 83, 34, 1, 5); R(c, '#4dc3ff', 85, 33, 1, 6); R(c, '#ffd23f', 87, 35, 1, 4);
        // desk
        R(c, '#e8b07a', 12, 80, 96, 5); R(c, '#c98d5a', 12, 85, 96, 1);
        R(c, '#d9a06a', 16, 86, 4, 26); R(c, '#d9a06a', 100, 86, 4, 26);
        R(c, '#e3aa74', 62, 86, 38, 13); R(c, '#c98d5a', 62, 99, 38, 1); R(c, '#ffffff', 79, 91, 4, 2);
        // little Sylvanian-style cottage on the desk
        R(c, '#fff3d6', 70, 64, 26, 16); for (let i = 0; i < 8; i++) R(c, '#ff6b6b', 67 + i, 64 - i, 32 - i * 2, 1);
        R(c, '#e04848', 67, 64, 32, 1); R(c, '#9a6a3f', 79, 70, 5, 10); P(c, '#ffd23f', 82, 75); R(c, '#9fdcff', 73, 68, 4, 4); R(c, '#9fdcff', 88, 68, 4, 4); R(c, '#ffffff', 74, 69, 1, 1);
        R(c, '#7ae582', 70, 79, 26, 1);
        // lamp
        R(c, '#ffffff', 18, 77, 10, 3); R(c, '#ff9ec7', 22, 64, 2, 13); for (let i = 0; i < 7; i++) R(c, '#ffd23f', 16 + i / 2, 57 + i, 14 - i, 1);
        // bed
        R(c, '#ffffff', 288, 56, 18, 58); R(c, '#f0e0ee', 288, 56, 2, 58); ell(c, '#ffffff', 297, 56, 9, 5);
        R(c, '#ff9ec7', 295, 64, 2, 2); R(c, '#ff9ec7', 299, 64, 2, 2); R(c, '#ff9ec7', 294, 66, 8, 2); R(c, '#ff9ec7', 295, 68, 6, 1); R(c, '#ff9ec7', 297, 69, 2, 1);
        R(c, '#ffffff', 196, 80, 8, 34); ell(c, '#ffffff', 200, 80, 4, 3);
        R(c, '#f4f0ff', 202, 88, 88, 8);
        R(c, '#ff8fb8', 204, 84, 70, 20); R(c, '#ffb3d0', 204, 84, 70, 2); for (let y = 88; y < 102; y += 5) for (let x = 207 + ((y / 5) % 2) * 4; x < 272; x += 8) R(c, '#ffd6e6', x, y, 2, 2);
        R(c, '#e8709e', 204, 102, 70, 2);
        R(c, '#ffffff', 262, 76, 26, 12); R(c, '#e8e2f5', 262, 86, 26, 2); R(c, '#f2eefb', 264, 78, 6, 2);
        R(c, '#ffd6e6', 274, 84, 14, 12);
        R(c, '#c98d5a', 200, 114, 3, 4); R(c, '#c98d5a', 292, 114, 3, 4);
        // bunting
        const flag = ['#ff6b9a', '#ffd23f', '#4dc3ff', '#7ae582', '#b27bff'];
        for (let i = 0; i < 9; i++) { const x = 8 + i * 12, y = Math.round(6 + i * 0.6 + Math.sin(i / 8 * 3.14) * 4); for (let k = 0; k < 5; k++) R(c, flag[i % 5], x + k / 2, y + k, 6 - k, 1); }
        for (let x = 8; x < 116; x++) P(c, '#c98d5a', x, Math.round(5 + (x - 8) / 12 * 0.6 + Math.sin((x - 8) / 108 * 3.14) * 4));
        for (let i = 0; i < 9; i++) { const x = 206 + i * 12, y = Math.round(10 - i * 0.6 + Math.sin(i / 8 * 3.14) * 4); for (let k = 0; k < 5; k++) R(c, flag[(i + 2) % 5], x + k / 2, y + k, 6 - k, 1); }
        for (let x = 206; x < 314; x++) P(c, '#c98d5a', x, Math.round(9 - (x - 206) / 12 * 0.6 + Math.sin((x - 206) / 108 * 3.14) * 4));
        // floor toys: blocks + ball + duck
        const blk = [['#ff6b6b', 'A'], ['#4dc3ff', 'B'], ['#ffd23f', 'C']];
        blk.forEach(([col, ch], i) => { const x = i === 2 ? 118 : 112 + i * 9, y = i === 2 ? 108 : 116; R(c, col, x, y, 8, 8); R(c, 'rgba(0,0,0,.18)', x, y + 7, 8, 1); text3(c, '#ffffff', ch, x + 2, y + 1); });
        disc(c, '#ff5a6e', 186, 119, 5); R(c, '#ffffff', 181, 118, 11, 2); P(c, '#ffffff', 184, 115);
        R(c, '#ffd23f', 38, 116, 8, 5); disc(c, '#ffd23f', 44, 114, 3); R(c, '#ff9f43', 47, 114, 3, 1); P(c, '#2a1c2e', 45, 113);
      });
      winClouds = cloudLayer(3, 2, 26, 46, 16, 22, 2, 3);
      dust = []; for (let i = 0; i < 14; i++) dust.push({ x: r(), y: r(), sp: 0.03 + r() * 0.05, ph: r() * 6 });
      ready = true;
    }
    function draw(c, t) {
      if (!ready) init();
      c.drawImage(bg, 0, 0);
      // window: clouds + sun peeking
      c.save(); c.beginPath(); c.rect(129, 21, 46, 44); c.clip();
      sun(c, 166, 30, 6, t, false);
      for (const k of winClouds) { const x = Math.round(129 + wrap(k.x + t * k.sp, 46 + k.img.width) - k.img.width); c.drawImage(k.img, x, k.y); }
      const bt = wrap(t * 9, 70); const bfr = Math.floor(wrap(t * 6, 2)); c.drawImage(BIRD[bfr], Math.round(124 + bt), 34 + sn(t));
      c.restore();
      R(c, '#ffffff', 151, 21, 2, 44); R(c, '#ffffff', 129, 42, 46, 2);
      // curtains (sway)
      const s = Math.sin(t * 1.1);
      R(c, '#c98d5a', 116, 14, 72, 2); disc(c, '#e8b07a', 116, 15, 2); disc(c, '#e8b07a', 188, 15, 2);
      for (const side of [0, 1]) {
        for (let y = 16; y < 74; y++) {
          const k = (y - 16) / 58; const w = Math.round(9 + k * 3 + (side ? -s : s) * k * 2);
          const x = side ? 188 - w : 116;
          R(c, '#ff9ec7', x, y, w, 1); P(c, '#ffc2dc', x + (side ? w - 3 : 2), y); P(c, '#ffc2dc', x + (side ? w - 6 : 5), y);
          if (y > 71) R(c, '#e8709e', x, y, w, 1);
        }
      }
      // sunbeam + dust motes
      c.globalAlpha = 0.16; c.fillStyle = '#fff6b0'; c.beginPath(); c.moveTo(130, 68); c.lineTo(176, 68); c.lineTo(232, 128); c.lineTo(160, 128); c.closePath(); c.fill(); c.globalAlpha = 1;
      for (const d of dust) { const k = wrap(d.y + t * d.sp, 1); const x = Math.round(140 + k * 52 + d.x * 40 + Math.sin(t + d.ph) * 2), y = Math.round(70 + k * 56); if (Math.sin(t * 3 + d.ph) > -0.3) P(c, '#fffbe0', x, y); }
      // lamp glow
      c.globalAlpha = 0.18 + Math.sin(t * 3) * 0.03; disc(c, '#fff3a0', 23, 70, 10); c.globalAlpha = 1;
      // the mole family on the desk
      MOLES.forEach((id, i) => { const it = window.ITEMS[id]; const x = 30 + i * 8 + (i > 3 ? 1 : 0); mole(c, x, 80, it, it.small); });
      if (Math.sin(t * 2.5) > 0.7) sparkle(c, 64, 64, 1, '#ffffff');
      // teddy bear on the shelf (looks out of the window... mostly)
      const bx = 62, by = 34; const look = wrap(t, 14) > 11.2 && wrap(t, 14) < 11.9;
      disc(c, '#c58b5a', bx, by + 6, 5); disc(c, '#c58b5a', bx, by, 4); disc(c, '#c58b5a', bx - 3, by - 3, 1); disc(c, '#c58b5a', bx + 3, by - 3, 1);
      R(c, '#e8b993', bx - 1, by + 1, 3, 2); P(c, '#3a2522', bx, by + 1);
      const eo = look ? 0 : 1; P(c, '#1b1416', bx - 2 + eo, by - 1); P(c, '#1b1416', bx + 2 + eo, by - 1);
      R(c, '#ff6b9a', bx - 2, by + 3, 5, 1);
      // Sarı Biber on the bed, bouncing softly
      const bb = Math.sin(t * 2.4) > 0 ? 1 : 0;
      c.drawImage(PEPPER, 232, 70 + bb, 16, 14 - bb);
      R(c, 'rgba(232,112,158,0.5)', 234, 84, 12, 1);
      if (wrap(t, 3) < 0.4) sparkle(c, 250, 70, 1, '#fff8c0');
    }
    return { draw };
  })();

  /* ----- STREET (São Paulo-ish) ----- */
  ART.street = (() => {
    let bg, clouds, ready = false;
    function init() {
      const r = rng(77);
      bg = mk(W, H, (c) => {
        bands(c, ['#45aefc', '#5ebcff', '#7bcaff', '#9cd8ff', '#c1e7ff', '#e2f4ff'], 0, 100);
        skyline(c, 3, 100, '#bccbe0', '#dbe5f1', 34, 72);
        // Copan-ish wavy tower
        R(c, '#d6dbe4', 236, 26, 40, 74); for (let y = 28; y < 100; y += 3) for (let x = 236; x < 276; x++) P(c, '#aab3c2', x, y + Math.round(Math.sin(x * 0.18) * 1));
        skyline(c, 8, 100, '#a6b6cf', '#c9d6e8', 18, 40);
        // ---- front row of buildings ----
        // 1. our house (pink) + door
        R(c, '#f4a7b9', 0, 44, 48, 58); R(c, '#e88aa1', 0, 44, 48, 2); R(c, '#ffffff', 0, 42, 50, 3);
        R(c, '#ffffff', 6, 52, 14, 12); R(c, '#9fdcff', 8, 54, 10, 8); R(c, '#ffffff', 12, 54, 1, 8); R(c, '#4fae5a', 6, 64, 14, 2); R(c, '#ff6b9a', 8, 62, 2, 2); R(c, '#ffd23f', 14, 62, 2, 2);
        R(c, '#ffffff', 26, 52, 14, 12); R(c, '#9fdcff', 28, 54, 10, 8); R(c, '#ffffff', 32, 54, 1, 8);
        R(c, '#ffffff', 22, 70, 18, 32); R(c, '#2f8f5b', 24, 72, 14, 30); R(c, '#3fae6e', 25, 73, 5, 28); P(c, '#ffd23f', 35, 87); text3(c, '#ffffff', '12', 8, 76);
        // 2. beige building with pichação
        R(c, '#e5d5b8', 48, 22, 64, 80); R(c, '#d3c19f', 48, 22, 64, 2);
        for (let y = 28; y < 64; y += 12) for (let x = 54; x < 108; x += 13) { R(c, '#7d8ea3', x, y, 8, 7); R(c, '#a9bfd6', x + 1, y + 1, 3, 3); R(c, '#d0c3ab', x, y + 7, 8, 1); }
        R(c, '#b8b8b8', 95, 40, 6, 4); R(c, '#9a9a9a', 95, 43, 6, 1); // AC unit
        // pichação: tall angular black letters
        const pix = (x, y) => { R(c, '#1e1c22', x, y, 1, 14); R(c, '#1e1c22', x, y, 4, 1); R(c, '#1e1c22', x + 4, y, 1, 6); R(c, '#1e1c22', x + 2, y + 6, 3, 1); };
        for (let i = 0; i < 7; i++) { const x = 54 + i * 7, y = 70 + (i % 2); if (i % 3 === 0) pix(x, y); else { R(c, '#1e1c22', x, y, 1, 14); R(c, '#1e1c22', x + 4, y, 1, 14); R(c, '#1e1c22', x, y + 4 + (i % 2) * 3, 5, 1); } }
        for (let x = 52; x < 104; x++) if (x % 2) P(c, '#1e1c22', x, 87);
        // 3. graffiti mural wall (behind Osvaldo)
        R(c, '#f5f1e8', 112, 52, 92, 50); R(c, '#e0d8c8', 112, 52, 92, 2);
        R(c, '#35c4b5', 114, 56, 88, 44);
        for (let x = 114; x < 202; x++) { const y = Math.round(84 + Math.sin(x * 0.12) * 4); R(c, '#2a8fd6', x, y, 1, 100 - y); P(c, '#a7f0ff', x, y); }
        disc(c, '#ffd23f', 150, 70, 11); disc(c, '#ffe680', 147, 67, 6);
        R(c, '#2c1f45', 144, 66, 4, 3); R(c, '#2c1f45', 152, 66, 4, 3); R(c, '#2c1f45', 148, 67, 4, 1); // sunglasses
        R(c, '#e04848', 146, 73, 8, 1); P(c, '#e04848', 145, 72); P(c, '#e04848', 154, 72);
        for (let i = 0; i < 5; i++) disc(c, ['#ff6b9a', '#b27bff', '#ff9f43', '#7ae582', '#ffffff'][i], 176 + (i % 3) * 8, 64 + Math.floor(i / 3) * 9, 3);
        text3(c, '#ffffff', 'VIDA', 168, 86, 2); text3(c, '#2c1f45', 'VIDA', 169, 87, 2); text3(c, '#ff6b9a', 'VIDA', 168, 86, 2);
        // 4. padaria with striped awning
        R(c, '#f2e4c4', 204, 34, 56, 68); R(c, '#e0cfa8', 204, 34, 56, 2);
        R(c, '#c43c3c', 208, 40, 48, 10); text3(c, '#ffffff', 'PADARIA', 218, 42, 1);
        for (let x = 204; x < 260; x++) { const col = Math.floor((x - 204) / 5) % 2 ? '#ffffff' : '#e04848'; R(c, col, x, 56, 1, 7); P(c, col, x, 63 + ((x - 204) % 5 === 2 ? 1 : 0)); }
        R(c, '#bfe6ff', 208, 66, 30, 22); R(c, '#e3f4ff', 209, 67, 8, 4); R(c, '#7a5a3a', 208, 82, 30, 2);
        for (let i = 0; i < 4; i++) { ell(c, '#e3a04f', 213 + i * 7, 80, 3, 2); P(c, '#f6c77f', 212 + i * 7, 79); }
        R(c, '#8a5a3b', 242, 66, 14, 36); R(c, '#a8714a', 243, 67, 5, 34); P(c, '#ffd23f', 253, 84);
        // 5. grey building w/ grilles
        R(c, '#b8bcc4', 260, 30, 60, 72); R(c, '#a3a8b2', 260, 30, 60, 2);
        for (let y = 36; y < 92; y += 14) for (let x = 266; x < 316; x += 16) { R(c, '#6d7a8c', x, y, 10, 9); for (let k = 0; k < 10; k += 2) R(c, '#2e3440', x + k, y, 1, 9); }
        // sidewalk + curb + street
        calcada(c, 102, 146, 5);
        R(c, '#9a9aa2', 0, 146, W, 3); R(c, '#c4c4cc', 0, 146, W, 1); R(c, '#4a4a54', 0, 149, W, H - 149);
        for (let x = 6; x < W; x += 28) R(c, '#ffd23f', x, 165, 14, 2);
        // power pole + wires
        R(c, '#a3a7ad', 110, 14, 4, 92); R(c, '#c3c7cd', 110, 14, 1, 92); R(c, '#8a8e94', 98, 20, 28, 3);
        wires(c, -10, 30, 100, 21, 6, '#2c2a30'); wires(c, -10, 36, 124, 21, 8, '#2c2a30'); wires(c, 124, 21, 330, 26, 9, '#2c2a30'); wires(c, 100, 21, 330, 34, 12, '#2c2a30');
        for (let a = 0; a < 40; a++) P(c, '#2c2a30', Math.round(118 + Math.cos(a / 6) * 4 + a * 0.1), Math.round(26 + Math.sin(a / 6) * 3)); // tangle
        // sneakers hanging on the wire
        R(c, '#2c2a30', 172, 27, 1, 6); R(c, '#2c2a30', 176, 27, 1, 5); R(c, '#ff4d6d', 170, 33, 4, 3); R(c, '#4dc3ff', 175, 32, 4, 3); R(c, '#ffffff', 170, 35, 4, 1); R(c, '#ffffff', 175, 34, 4, 1);
        // trash bag
        ell(c, '#26242b', 122, 104, 5, 4); P(c, '#4a4752', 120, 102); R(c, '#26242b', 122, 99, 1, 2);
      });
      clouds = cloudLayer(17, 4, 4, 30, 26, 44, 2, 4);
      ready = true;
    }
    // Sky items must be behind the buildings: draw sky part first, then bg on top using a cut-out.
    let cut = null;
    function drawWrapped(c, t) {
      if (!ready) init();
      if (!cut) { cut = mk(W, H, (x) => { x.drawImage(bg, 0, 0); const id = x.getImageData(0, 0, W, H); const sky = mk(W, H, (s) => bands(s, ['#45aefc', '#5ebcff', '#7bcaff', '#9cd8ff', '#c1e7ff', '#e2f4ff'], 0, 100)).getContext('2d').getImageData(0, 0, W, H); for (let i = 0; i < id.data.length; i += 4) { if (id.data[i] === sky.data[i] && id.data[i + 1] === sky.data[i + 1] && id.data[i + 2] === sky.data[i + 2] && i < W * 100 * 4) id.data[i + 3] = 0; } x.putImageData(id, 0, 0); }); }
      c.drawImage(bg, 0, 0, W, 100, 0, 0, W, 100);
      sun(c, 34, 18, 10, t);
      drawClouds(c, clouds, t);
      birds(c, [{ x: 80, y: 8, sp: 14, ph: 0 }, { x: 96, y: 13, sp: 14, ph: 1 }, { x: 200, y: 20, sp: 10, ph: 2 }], t);
      c.drawImage(cut, 0, 0);
      dyn(c, t);
    }
    function dyn(c, t) {
      const hop = wrap(t, 5) < 0.3 ? 2 : 0;
      for (const [x, y] of [[60, 25], [70, 24 - hop]]) { R(c, '#5f6478', x - 1, y - 3, 4, 3); R(c, '#8d93a8', x + 2, y - 5, 2, 2); P(c, '#ff9b2f', x + 4, y - 4); }
      const px = Math.round(86 + Math.sin(t * 0.35) * 10); pigeon(c, px, 118, t, Math.cos(t * 0.35) > 0 ? 1 : -1);
      R(c, '#2fa06a', 268, 98, 30, 14); R(c, '#3fc07e', 268, 98, 30, 2); text3(c, '#ffffff', 'MILHO', 273, 103, 1);
      R(c, '#9aa0a8', 272, 90, 12, 8); R(c, '#c3c7cd', 272, 90, 12, 1); disc(c, '#3a3a40', 272, 114, 3); disc(c, '#3a3a40', 294, 114, 3);
      R(c, '#f2d24a', 287, 92, 3, 6); R(c, '#7ac04a', 286, 95, 1, 3); R(c, '#6d4a2f', 297, 84, 1, 14); R(c, '#ffd23f', 290, 82, 9, 3);
      steam(c, 277, 88, t, 4);
      steam(c, 312, 28, t * 0.8 + 0.3, 3);
      osvaldo(c, 142, 89, t);
      if (wrap(t, 4) < 0.5) sparkle(c, 30, 55, 1, '#ffffff');
    }
    return { draw: drawWrapped };
  })();

  /* ----- END OF THE STREET: the fight ----- */
  ART.streetEnd = (() => {
    let bg, cut, clouds, ready = false;
    const SKY = ['#45aefc', '#5ebcff', '#7bcaff', '#9cd8ff', '#c1e7ff', '#e2f4ff'];
    function init() {
      bg = mk(W, H, (c) => {
        bands(c, SKY, 0, 100);
        skyline(c, 12, 100, '#bccbe0', '#dbe5f1', 30, 66);
        skyline(c, 19, 100, '#a6b6cf', '#c9d6e8', 16, 36);
        // left: bar
        R(c, '#ffd98a', 0, 34, 92, 68); R(c, '#e8c070', 0, 34, 92, 2);
        R(c, '#2a6fd6', 8, 42, 76, 12); text3(c, '#ffffff', 'BAR DO ZE', 14, 45, 1); P(c, '#ffffff', 62, 44);
        R(c, '#3a3440', 10, 62, 30, 40); for (let x = 10; x < 40; x += 3) R(c, '#5a5460', x, 62, 1, 40);
        R(c, '#6b4a33', 48, 62, 36, 24); R(c, '#2a2430', 50, 64, 32, 20);
        for (let i = 0; i < 6; i++) { R(c, ['#3fae55', '#8a5a3b', '#d6b04a'][i % 3], 53 + i * 5, 70, 2, 6); R(c, '#ddd', 53 + i * 5, 69, 2, 1); }
        // end wall with mural
        R(c, '#f2ede2', 92, 40, 150, 62); R(c, '#ddd4c2', 92, 40, 150, 2);
        R(c, '#ff8fb8', 96, 44, 142, 56);
        for (let x = 96; x < 238; x++) { const y1 = Math.round(66 + Math.sin(x * 0.09) * 5), y2 = Math.round(80 + Math.sin(x * 0.09 + 2) * 4); R(c, '#ffd23f', x, y1, 1, 4); R(c, '#4dc3ff', x, y2, 1, 100 - y2); }
        disc(c, '#ffffff', 130, 56, 7); disc(c, '#7ae582', 200, 54, 6); disc(c, '#b27bff', 222, 60, 4);
        text3(c, '#2c1f45', 'SAMPA', 147, 49, 3); text3(c, '#ffffff', 'SAMPA', 146, 48, 3);
        // right: building + orelhão
        R(c, '#c9b4e0', 242, 26, 78, 76); R(c, '#b39ccf', 242, 26, 78, 2);
        for (let y = 32; y < 90; y += 13) for (let x = 248; x < 316; x += 14) { R(c, '#7d6a96', x, y, 9, 8); R(c, '#e6dcf2', x, y + 8, 9, 1); R(c, '#a9c9e8', x + 1, y + 1, 3, 3); }
        // sidewalk & street
        calcada(c, 102, 146, 9);
        R(c, '#9a9aa2', 0, 146, W, 3); R(c, '#c4c4cc', 0, 146, W, 1); R(c, '#4a4a54', 0, 149, W, H - 149);
        for (let x = 10; x < W; x += 28) R(c, '#ffffff', x, 162, 14, 2);
        // plastic table + chairs outside the bar
        R(c, '#ffd23f', 18, 98, 22, 3); R(c, '#e8b81c', 20, 101, 2, 10); R(c, '#e8b81c', 36, 101, 2, 10);
        R(c, '#ff9f43', 30, 92, 2, 6); R(c, '#ff9f43', 34, 93, 2, 5);
        R(c, '#ffd23f', 6, 102, 8, 2); R(c, '#ffd23f', 6, 94, 2, 8); R(c, '#e8b81c', 6, 104, 1, 8); R(c, '#e8b81c', 13, 104, 1, 8);
        R(c, '#ffd23f', 46, 102, 8, 2); R(c, '#ffd23f', 52, 94, 2, 8); R(c, '#e8b81c', 46, 104, 1, 8); R(c, '#e8b81c', 53, 104, 1, 8);
        // orelhão (public phone)
        R(c, '#8a8e94', 284, 76, 2, 40);
        for (let i = 0; i < 12; i++) { const w = Math.round(Math.sqrt(Math.max(0, 1 - ((i - 6) / 7) ** 2)) * 8); R(c, '#ff8a1c', 285 - w, 66 + i, w * 2, 1); }
        R(c, '#e06a10', 278, 77, 14, 1); R(c, '#3a3a40', 282, 70, 5, 5); R(c, '#2c2c32', 283, 71, 3, 2);
        // lamp post
        R(c, '#3e4450', 252, 30, 2, 80); R(c, '#3e4450', 246, 30, 8, 2); R(c, '#fff3b0', 244, 32, 5, 2);
      });
      cut = mk(W, H, (x) => {
        x.drawImage(bg, 0, 0); const id = x.getImageData(0, 0, W, H);
        const sky = mk(W, H, (s) => bands(s, SKY, 0, 100)).getContext('2d').getImageData(0, 0, W, H);
        for (let i = 0; i < W * 100 * 4; i += 4) if (id.data[i] === sky.data[i] && id.data[i + 1] === sky.data[i + 1] && id.data[i + 2] === sky.data[i + 2]) id.data[i + 3] = 0;
        x.putImageData(id, 0, 0);
      });
      clouds = cloudLayer(29, 4, 4, 30, 24, 44, 2, 4);
      ready = true;
    }
    const A = { skin: '#8d5524', hair: '#1b1416', shirt: '#1f8a4c', collar: '#ffffff', pants: '#2b3a5a', shoes: '#f2f2f2' };
    const B = { skin: '#f1c27d', hair: '#7a4a2a', shirt: '#f5f5f5', stripe: '#1b1416', pants: '#5a4a3a', shoes: '#1b1416', cap: '#e04848' };
    function draw(c, t) {
      if (!ready) init();
      c.drawImage(bg, 0, 0, W, 100, 0, 0, W, 100);
      sun(c, 290, 14, 9, t);
      drawClouds(c, clouds, t);
      c.drawImage(cut, 0, 0);
      // cat on the wall watching, tail swaying
      const cx = 228, cy = 40;
      R(c, '#3a3440', cx, cy - 5, 8, 5); R(c, '#3a3440', cx + 6, cy - 9, 5, 5); P(c, '#3a3440', cx + 6, cy - 10); P(c, '#3a3440', cx + 10, cy - 10); P(c, '#ffe14d', cx + 7, cy - 7); P(c, '#ffe14d', cx + 9, cy - 7);
      const tl = Math.round(Math.sin(t * 2) * 2); R(c, '#3a3440', cx - 1, cy - 4, 1, 4); R(c, '#3a3440', cx - 2 + tl, cy - 1, 2, 4);
      // the fight: a 1.6s loop of punches
      const ph = wrap(t, 1.6); const jit = Math.floor(t * 10) % 2;
      let pa = 0, pb = 0; if (ph < 0.35) { pa = 1; pb = 2; } else if (ph > 0.8 && ph < 1.15) { pa = 2; pb = 1; }
      const FY = 119;
      const ax = 146 + (pa === 1 ? 3 : 0) - (pa === 2 ? 2 : 0), bxp = 176 - (pb === 1 ? 3 : 0) + (pb === 2 ? 2 : 0);
      // dust cloud around their feet
      for (let i = 0; i < 9; i++) { const a = t * 3 + i * 0.7; const r = 4 + (i % 3); c.globalAlpha = 0.75; disc(c, i % 2 ? '#ffffff' : '#e6dccb', Math.round(161 + Math.cos(a) * 20), Math.round(FY - 2 + Math.sin(a * 1.7) * 2), r); c.globalAlpha = 1; }
      person(c, ax, FY + (pa ? 0 : jit), Object.assign({}, A, { face: 1, pose: pa, bob: pa === 0 ? -jit : 0 }));
      person(c, bxp, FY + (pb ? 0 : 1 - jit), Object.assign({}, B, { face: -1, pose: pb, bob: pb === 0 ? jit - 1 : 0 }));
      for (let i = 0; i < 4; i++) { const a = t * 3 + i * 1.6 + 3; disc(c, '#f4eee2', Math.round(161 + Math.cos(a) * 18), Math.round(FY + 1 + Math.sin(a) * 1.5), 3); }
      // impact stars
      if (pa === 1 && ph > 0.1) { sparkle(c, 166, 91, 2, '#ffe14d'); sparkle(c, 169, 88, 1, '#ffffff'); }
      if (pb === 1 && ph > 0.9) { sparkle(c, 156, 91, 2, '#ffe14d'); sparkle(c, 153, 88, 1, '#ffffff'); }
      // cartoon cursing
      const sw = Math.floor(t * 2) % 3;
      if (sw === 0) text3(c, '#e04848', '!?', 140, 71); else if (sw === 1) text3(c, '#e04848', '!!', 182, 71);
      // a pigeon fleeing
      const fp = wrap(t * 0.5, 1); const fx = Math.round(200 + fp * 140), fy = Math.round(112 - fp * 90 + Math.sin(fp * 20) * 2);
      c.drawImage(BIRD[Math.floor(wrap(t * 9, 2))], fx, fy);
    }
    return { draw };
  })();

  /* ----- TO BE CONTINUED ----- */
  ART.tbc = (() => {
    let bg, clouds, stars, ready = false;
    function init() {
      const r = rng(99);
      bg = mk(W, H, (c) => {
        bands(c, ['#2b1d52', '#3f2470', '#5c2e86', '#843c94', '#b2509a', '#dd6b9c', '#f7889a', '#ffad8f', '#ffd18f'], 0, 165);
        for (let x = 0; x < W; x++) { const y = Math.round(150 - 6 * Math.sin(x * 0.03) - 3 * Math.sin(x * 0.11)); R(c, '#3a2c5a', x, y, 1, H - y); P(c, '#5a4a80', x, y); }
        for (let x = 0; x < W; x++) { const y = Math.round(162 - 4 * Math.sin(x * 0.05 + 2)); R(c, '#2a1f45', x, y, 1, H - y); }
      });
      clouds = cloudLayer(51, 4, 30, 110, 30, 60, 2, 5, '#ffb3c8', '#e88aa8');
      stars = []; for (let i = 0; i < 40; i++) stars.push({ x: Math.floor(r() * W), y: Math.floor(r() * 80), sp: 0.2 + r() * 0.6, ph: r(), col: i % 4 ? '#ffffff' : '#ffe08a' });
      ready = true;
    }
    function draw(c, t) {
      if (!ready) init();
      c.drawImage(bg, 0, 0);
      for (const s of stars) P(c, '#d9c8ff', s.x, s.y);
      twinkles(c, stars, t);
      disc(c, '#fff3d6', 262, 34, 9); disc(c, '#5c2e86', 266, 31, 8); // crescent
      drawClouds(c, clouds, t);
      const sh = wrap(t, 6); if (sh < 0.6) { const k = sh / 0.6; for (let i = 0; i < 8; i++) P(c, i < 3 ? '#ffffff' : '#ffe08a', Math.round(40 + k * 120 - i), Math.round(12 + k * 40 - i * 0.33)); }
    }
    return { draw };
  })();

  /* ---------- eyelid effect for cutscenes ---------- */
  function eyelids(c, open) {
    const half = H / 2; const o = open * half * 1.15;
    for (let x = 0; x < W; x++) {
      const k = 1 - Math.pow((x - W / 2) / (W / 2), 2) * 0.55; const e = Math.round(o * k);
      if (half - e > 0) R(c, '#000000', x, 0, 1, half - e);
      if (half + e < H) R(c, '#000000', x, half + e, 1, H - (half + e));
      if (e > 0 && e < half) { P(c, '#1a0d0d', x, half - e); P(c, '#1a0d0d', x, half + e - 1); }
    }
  }

  /* ---------- speaker portraits (32x32, drawn live in the dialogue box) ---------- */
  const PORTRAITS = {};
  PORTRAITS.Osvaldo = (c, t) => {
    c.clearRect(0, 0, 32, 32);
    bands(c, ['#35c4b5', '#2fb3a5', '#2a8fd6'], 0, 32, 0, 32);
    const br = Math.sin(t * 2.2) > 0.2 ? 1 : 0;
    // coat / shoulders
    R(c, '#7a5a3a', 3, 25 - br, 26, 8); R(c, '#8f6c48', 5, 26 - br, 6, 2); R(c, '#5f452c', 16, 26 - br, 1, 6); R(c, '#6b4f33', 22, 28 - br, 4, 3);
    // head
    R(c, '#c48a5e', 8, 7 - br, 15, 14); R(c, '#a8714a', 8, 18 - br, 15, 2); R(c, '#b07a52', 22, 10 - br, 1, 8);
    R(c, '#c48a5e', 6, 12 - br, 2, 4); R(c, '#a8714a', 6, 14 - br, 1, 2); // ear
    // beard
    R(c, '#6c6258', 7, 16 - br, 17, 9); R(c, '#857a6f', 8, 17 - br, 4, 3); R(c, '#575048', 17, 21 - br, 6, 3); R(c, '#6c6258', 10, 25 - br, 11, 1);
    // mouth (frown) inside beard
    R(c, '#3a2522', 12, 19 - br, 7, 1); P(c, '#3a2522', 11, 20 - br); P(c, '#3a2522', 19, 20 - br);
    // nose
    R(c, '#a8644a', 15, 13 - br, 3, 3); P(c, '#d79c70', 15, 13 - br);
    // eyes + angry brows (twitch)
    const tw = Math.sin(t * 5) > 0.9 ? 1 : 0;
    R(c, '#ffffff', 10, 11 - br, 3, 2); P(c, '#1b1416', 12, 11 - br); P(c, '#1b1416', 12, 12 - br);
    R(c, '#ffffff', 18, 11 - br, 3, 2); P(c, '#1b1416', 18, 11 - br); P(c, '#1b1416', 18, 12 - br);
    R(c, '#2a1d1a', 9, 9 - br - tw, 4, 1); P(c, '#2a1d1a', 13, 10 - br); R(c, '#2a1d1a', 18, 9 - br - tw, 4, 1); P(c, '#2a1d1a', 17, 10 - br);
    P(c, '#8d6a4a', 9, 15 - br); P(c, '#8d6a4a', 20, 8 - br); P(c, '#8d6a4a', 21, 14 - br); // dirt
    // beanie
    R(c, '#9a3b32', 7, 2 - br, 17, 6); R(c, '#b64c40', 8, 2 - br, 15, 2); R(c, '#7f2f28', 7, 7 - br, 17, 2);
    for (let x = 8; x < 24; x += 3) R(c, '#86332b', x, 3 - br, 1, 4);
    disc(c, '#d8d0c0', 15, 1 - br, 2);
    // hand + bitten onion
    const ob = Math.round(Math.sin(t * 1.6) * 1);
    R(c, '#c48a5e', 24, 22 + ob, 5, 6); R(c, '#a8714a', 24, 27 + ob, 5, 1);
    disc(c, '#a0569c', 26, 18 + ob, 5); disc(c, '#c27cc0', 25, 17 + ob, 3); P(c, '#e7c3ea', 23, 15 + ob); P(c, '#7d3e7c', 22, 20 + ob); P(c, '#7d3e7c', 22, 19 + ob);
    R(c, '#f6efd9', 28, 14 + ob, 4, 4); R(c, '#f6efd9', 27, 15 + ob, 1, 2); P(c, '#ffffff', 29, 15 + ob); P(c, '#d7c9a8', 28, 17 + ob);
    R(c, '#7bbf4a', 25, 10 + ob, 1, 4); R(c, '#9bd85f', 27, 9 + ob, 1, 4);
    // flies
    for (let i = 0; i < 2; i++) { const a = t * (4 + i) + i * 3; P(c, '#1b1416', Math.round(5 + Math.cos(a) * 4 + i * 20), Math.round(4 + Math.sin(a * 1.3) * 3)); }
  };

  window.ART = ART;
  window.PORTRAITS = PORTRAITS;
  window.ArtUtil = { W, H, eyelids, drawIcon };
})();
