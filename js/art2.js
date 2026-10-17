/* =====================================================================
   Life — art, part 2: v2 locations + animated cutscenes.
   Cutscene arts receive opts.beat (current line index) and opts.beatT
   (seconds since that line started) so animation follows the text.
   ===================================================================== */
(function () {
  const { W, H, R, P, disc, ell, mk, rng, bands, text3, sparkle, twinkles, wrap, sn, sun, cloudLayer, drawClouds, birds, BIRD, person, calcada, skyline, wires, eyelids } = window.PX;
  const ART = window.ART;
  const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
  const lerp = (a, b, k) => a + (b - a) * k;

  /* ---------- small sprites ---------- */
  // front-facing man (the knife guy) at scene scale
  function frontMan(c, x, yFeet, t, o = {}) {
    const jit = Math.floor(t * 8) % 2; const top = yFeet - 31 + (o.bob || 0);
    const skin = '#f1c27d';
    R(c, '#5a4a3a', x - 4, yFeet - 11, 3, 10); R(c, '#5a4a3a', x + 1, yFeet - 11, 3, 10);
    R(c, '#1b1416', x - 5, yFeet - 2, 4, 2); R(c, '#1b1416', x + 1, yFeet - 2, 4, 2);
    R(c, '#f5f5f5', x - 6, top + 9, 12, 12); for (let i = -5; i < 6; i += 3) R(c, '#1b1416', x + i, top + 9, 1, 12);
    R(c, skin, x - 3, top + 1, 7, 8); R(c, '#e04848', x - 4, top - 1, 9, 3); R(c, '#b83030', x - 4, top + 1, 9, 1);
    P(c, '#1b1416', x - 2, top + 4); P(c, '#1b1416', x + 2, top + 4); R(c, '#1b1416', x - 2, top + 3, 2, 1); R(c, '#1b1416', x + 1, top + 3, 2, 1);
    R(c, '#5a2a22', x - 1, top + 7, 3, 1);
    R(c, '#f5f5f5', x - 8, top + 10, 2, 6); R(c, skin, x - 8, top + 16, 2, 2);
    if (o.knife) {
      R(c, '#f5f5f5', x + 6, top + 6, 2, 5); R(c, skin, x + 6, top + 3, 2, 3);
      R(c, '#5a3a22', x + 6, top, 2, 3); R(c, '#d6dbe4', x + 6, top - 6, 2, 6); P(c, '#ffffff', x + 6, top - 6 + jit);
      if (wrap(t, 1.2) < 0.25) sparkle(c, x + 7, top - 7, 1, '#ffffff');
    } else { R(c, '#f5f5f5', x + 6, top + 10, 2, 6); R(c, skin, x + 6, top + 16, 2, 2); }
  }
  // Osvaldo at scene scale (side view; face 1 = right)
  function osvaldoSmall(c, x, yFeet, t, pose = 'stand', face = 1) {
    const f = face; const run = pose === 'run'; const step = run ? Math.floor(t * 10) % 2 : 0;
    const lean = pose === 'headbutt' ? 3 * f : pose === 'run' ? f : 0;
    const top = yFeet - 32 + (run ? step : 0);
    const skin = '#c48a5e', coat = '#7a5a3a', coatS = '#5f452c';
    if (pose === 'front') {
      const b = Math.floor(t * 3) % 2;
      R(c, '#5b4636', x - 4, yFeet - 11, 3, 10); R(c, '#5b4636', x + 1, yFeet - 11, 3, 10); R(c, '#2b2422', x - 5, yFeet - 2, 4, 2); R(c, '#2b2422', x + 1, yFeet - 2, 5, 2);
      R(c, coat, x - 7, top + 9 - b, 14, 14); R(c, coatS, x - 1, top + 9 - b, 2, 14);
      R(c, skin, x - 4, top + 1 - b, 9, 8); R(c, '#6c6258', x - 4, top + 6 - b, 9, 5); R(c, '#9a3b32', x - 5, top - 2 - b, 11, 4);
      P(c, '#1b1416', x - 2, top + 4 - b); P(c, '#1b1416', x + 2, top + 4 - b); R(c, '#ffffff', x - 1, top + 7 - b, 3, 1);
      // thumbs up
      R(c, coat, x + 7, top + 6 - b, 3, 6); R(c, skin, x + 7, top + 2 - b, 3, 4); R(c, skin, x + 8, top - 1 - b, 1, 3);
      R(c, coat, x - 9, top + 10 - b, 2, 8); disc(c, '#a0569c', x - 8, top + 19 - b, 2);
      return;
    }
    // legs
    const a = run ? (step ? 3 : -3) : 1;
    R(c, '#5b4636', x - 2 - a, yFeet - 11, 3, 10 - (run && step ? 2 : 0)); R(c, '#5b4636', x - 1 + a, yFeet - 11, 3, 10 - (run && !step ? 2 : 0));
    R(c, '#2b2422', x - 3 - a, yFeet - 2 - (run && step ? 2 : 0), 5, 2); R(c, '#2b2422', x - 2 + a, yFeet - 2 - (run && !step ? 2 : 0), 5, 2);
    // coat
    const tx = x - 6 + lean;
    R(c, coat, tx, top + 9, 13, 14); R(c, coatS, tx + (f > 0 ? 0 : 11), top + 9, 2, 14); R(c, '#6b4f33', tx + 4, top + 15, 3, 3);
    // head
    const hx = tx + 2 + (f > 0 ? 2 : 0) + (pose === 'headbutt' ? 2 * f : 0), hy = top + (pose === 'headbutt' ? 3 : 0);
    R(c, skin, hx, hy + 1, 8, 8); R(c, '#6c6258', hx + (f > 0 ? 1 : -1), hy + 6, 8, 5);
    R(c, '#9a3b32', hx - 1, hy - 2, 10, 4); P(c, '#d8d0c0', hx + 4, hy - 3);
    const ex = f > 0 ? hx + 6 : hx + 1; P(c, '#1b1416', ex, hy + 4); R(c, '#2a1d1a', f > 0 ? ex - 1 : ex, hy + 3, 2, 1);
    // arms
    const sx = f > 0 ? tx + 11 : tx + 1;
    if (pose === 'slap') { R(c, coat, sx, top + 10, f * 7, 3); R(c, skin, sx + f * 7 + (f > 0 ? 0 : -3), top + 8, 3, 5); }
    else if (run) { const up = step ? -4 : 0; R(c, coat, sx, top + 8 + up, 3, 6); R(c, skin, sx, top + 6 + up, 3, 3); disc(c, '#a0569c', sx + 1, top + 3 + up, 2); P(c, '#f6efd9', sx + 2, top + 2 + up); }
    else { R(c, coat, sx - (f > 0 ? 0 : 2), top + 10, 3, 9); disc(c, '#a0569c', sx + 1, top + 20, 2); }
  }
  // someone lying on the ground, dizzy
  function lyingMan(c, x, y, t) {
    R(c, '#5a4a3a', x + 14, y - 3, 12, 3); R(c, '#1b1416', x + 26, y - 4, 2, 4);
    R(c, '#f5f5f5', x + 2, y - 5, 13, 5); for (let i = 3; i < 15; i += 3) R(c, '#1b1416', x + i, y - 5, 1, 5);
    R(c, '#f1c27d', x - 6, y - 7, 8, 7); P(c, '#1b1416', x - 3, y - 4); P(c, '#1b1416', x - 1, y - 4); R(c, '#e04848', x - 8, y - 8, 4, 6);
    for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; sparkle(c, Math.round(x - 2 + Math.cos(a) * 7), Math.round(y - 12 + Math.sin(a) * 2), 0, '#ffe14d'); P(c, '#ffe14d', Math.round(x - 2 + Math.cos(a) * 7) + 1, Math.round(y - 12 + Math.sin(a) * 2)); }
  }
  function impact(c, x, y, word, k) {
    const s = k < 0.5 ? 2 : 1; sparkle(c, x, y, 2, '#ffe14d'); sparkle(c, x + 4, y - 4, 1, '#ffffff'); sparkle(c, x - 5, y + 3, 1, '#ffffff');
    text3(c, '#2c1f45', word, x - word.length * 4 + 1, y - 17 + 1, s); text3(c, '#ffe14d', word, x - word.length * 4, y - 17, s);
  }
  function dust(c, x, y, t, n = 6, spread = 14) { for (let i = 0; i < n; i++) { const a = t * 3 + i * 1.1; c.globalAlpha = 0.7; disc(c, i % 2 ? '#ffffff' : '#e6dccb', Math.round(x + Math.cos(a) * spread), Math.round(y + Math.sin(a * 1.6) * 2), 2 + (i % 3)); c.globalAlpha = 1; } }
  function flyingKnife(c, x, y, t) { const r = Math.floor(t * 12) % 4; if (r % 2) { R(c, '#5a3a22', x, y, 2, 3); R(c, '#d6dbe4', x, y - 5, 2, 5); } else { R(c, '#5a3a22', x, y, 3, 2); R(c, '#d6dbe4', x + 3, y, 5, 2); } }
  // copy of bg where pixels identical to the plain sky are transparent (so sun/clouds can go behind)
  function makeCut(bg, skyCols, y1) {
    return mk(W, H, (x) => {
      x.drawImage(bg, 0, 0); const id = x.getImageData(0, 0, W, H);
      const sky = mk(W, H, (s) => bands(s, skyCols, 0, y1)).getContext('2d').getImageData(0, 0, W, H);
      for (let i = 0; i < W * y1 * 4; i += 4) if (id.data[i] === sky.data[i] && id.data[i + 1] === sky.data[i + 1] && id.data[i + 2] === sky.data[i + 2]) id.data[i + 3] = 0;
      x.putImageData(id, 0, 0);
    });
  }
  window.PX2 = { frontMan, osvaldoSmall, lyingMan };

  const E = () => ART.streetEnd;
  const A = () => ART.streetEnd.A, B = () => ART.streetEnd.B;

  /* ----- Kavga Et (chatted): Osvaldo bursts in, slaps, chases ----- */
  ART.osvaldoSlap = {
    draw(c, t, o = {}) {
      E().base(c, t); const beat = o.beat || 0, bt = o.beatT || 0;
      person(c, 118, 119, Object.assign({}, A(), { face: 1, pose: 2, bob: Math.floor(wrap(t * 2, 2)) }));
      if (beat === 0) {
        frontMan(c, 186, 119, t, { knife: true });
        const k = ease(bt / 1.3); osvaldoSmall(c, Math.round(lerp(-20, 166, k)), 119, t, k < 1 ? 'run' : 'stand', 1);
        if (k < 1) dust(c, Math.round(lerp(-26, 158, k)), 118, t, 3, 4);
      } else if (beat === 1) {
        const hit = bt > 0.25; osvaldoSmall(c, 168, 119, t, hit ? 'slap' : 'stand', 1);
        frontMan(c, 186 + (hit ? 3 : 0), 119, t, { knife: !hit });
        if (hit && bt < 1.4) impact(c, 186, 92, 'SLAP!', bt - 0.25);
        if (hit) { const kk = Math.min(1, (bt - 0.25) / 0.9); flyingKnife(c, Math.round(186 + kk * 60), Math.round(86 - Math.sin(kk * 3.14) * 40 + kk * 32), t); }
      } else {
        const k = Math.min(1, bt / 2.6);
        const mx = Math.round(lerp(196, 380, k)), ox = Math.round(lerp(166, 350, Math.min(1, bt / 2.9)));
        if (mx < 340) person(c, mx, 119, Object.assign({}, B(), { face: 1, pose: Math.floor(t * 8) % 2 ? 1 : 0, cap: B().cap }));
        if (ox < 340) { osvaldoSmall(c, ox, 119, t, 'run', 1); dust(c, ox - 8, 118, t, 3, 4); }
        R(c, '#5a3a22', 246, 120, 3, 2); R(c, '#d6dbe4', 249, 120, 5, 2);
        if (bt > 3.2) { const ph = wrap(bt, 1.2); if (ph < 0.6) text3(c, '#e04848', '!!', 300, 80); }
      }
    },
  };

  /* ----- Kaç (chatted): Osvaldo runs in, headbutts, "I'll handle this" ----- */
  ART.osvaldoHeadbutt = {
    draw(c, t, o = {}) {
      E().base(c, t); const beat = o.beat || 0, bt = o.beatT || 0;
      person(c, 118, 119, Object.assign({}, A(), { face: 1, pose: 2, bob: Math.floor(wrap(t * 2, 2)) }));
      if (beat === 0) {
        frontMan(c, 186, 119, t, { knife: true });
        const k = ease(bt / 1.2); osvaldoSmall(c, Math.round(lerp(340, 206, k)), 119, t, k < 1 ? 'run' : 'stand', -1);
        if (k < 1) dust(c, Math.round(lerp(346, 214, k)), 118, t, 3, 4);
      } else if (beat === 1) {
        const hit = bt > 0.3;
        if (!hit) { frontMan(c, 186, 119, t, { knife: true }); osvaldoSmall(c, 202, 119, t, 'headbutt', -1); }
        else {
          const fall = Math.min(1, (bt - 0.3) / 0.5);
          if (fall < 1) frontMan(c, 186 - Math.round(fall * 6), 119 + Math.round(fall * 2), t, { knife: false }); else lyingMan(c, 168, 120, t);
          osvaldoSmall(c, 200, 119, t, 'stand', -1);
          if (bt < 1.5) impact(c, 192, 92, 'BONK!', bt - 0.3);
          R(c, '#5a3a22', 150, 120, 3, 2); R(c, '#d6dbe4', 153, 120, 5, 2);
        }
      } else {
        lyingMan(c, 168, 120, t); R(c, '#5a3a22', 150, 120, 3, 2); R(c, '#d6dbe4', 153, 120, 5, 2);
        osvaldoSmall(c, 204, 119, t, 'front');
        if (wrap(t, 1) < 0.5) sparkle(c, 214, 84, 1, '#ffffff');
      }
    },
  };

  /* ----- Kaç (not chatted): POV escape, the street rushes past ----- */
  ART.escape = (() => {
    let strip, far, ready = false; const SW = 640;
    function init() {
      const r = rng(303);
      far = mk(SW, 100, (c) => { skyline(c, 41, 100, '#bccbe0', '#dbe5f1', 30, 66); });
      strip = mk(SW, H, (c) => {
        const cols = ['#f4a7b9', '#e5d5b8', '#b8d8f0', '#ffd98a', '#c9b4e0', '#bfe8c8', '#f2e4c4'];
        let x = 0, i = 0;
        while (x < SW) {
          const w = 40 + Math.floor(r() * 30), h = 50 + Math.floor(r() * 30), col = cols[i++ % cols.length];
          R(c, col, x, 102 - h, w, h); R(c, 'rgba(0,0,0,0.08)', x, 102 - h, w, 2);
          for (let wy = 102 - h + 6; wy < 80; wy += 12) for (let wx = x + 5; wx < x + w - 8; wx += 12) { R(c, '#7d8ea3', wx, wy, 7, 7); R(c, '#a9bfd6', wx + 1, wy + 1, 2, 2); }
          R(c, '#6b4a33', x + Math.floor(w / 2) - 4, 84, 8, 18);
          if (r() < 0.5) for (let k = 0; k < w; k++) R(c, Math.floor(k / 4) % 2 ? '#ffffff' : ['#e04848', '#4dc3ff', '#7ae582'][i % 3], x + k, 76, 1, 5);
          if (r() < 0.4) for (let k = 0; k < 5; k++) R(c, '#1e1c22', x + 6 + k * 6, 86, 1, 10);
          x += w;
        }
        R(c, '#a3a7ad', 120, 14, 4, 90); R(c, '#a3a7ad', 440, 14, 4, 90);
      });
      const side = mk(SW, 44, () => {}); const sc = side.getContext('2d');
      // calcada strip drawn once via a temp full canvas
      const tmp = mk(W, H, (c) => calcada(c, 102, 146, 21)); sc.drawImage(tmp, 0, 102, W, 44, 0, 0, W, 44); sc.drawImage(tmp, 0, 102, W, 44, W, 0, W, 44);
      strip.getContext('2d').drawImage(side, 0, 102);
      const s2 = strip.getContext('2d'); R(s2, '#9a9aa2', 0, 146, SW, 3); R(s2, '#4a4a54', 0, 149, SW, H - 149); for (let x2 = 6; x2 < SW; x2 += 28) R(s2, '#ffd23f', x2, 165, 14, 2);
      ready = true;
    }
    let pos = 0, last = null, farPos = 0;
    return {
      draw(c, t, o = {}) {
        if (!ready) init();
        const beat = o.beat || 0, bt = o.beatT || 0;
        let speed = beat < 2 ? 210 : 210 * (1 - ease(bt / 1.6));
        const dt = last === null ? 0 : Math.max(0, Math.min(0.05, t - last)); last = t;
        pos += speed * dt; farPos += speed * 0.2 * dt;
        const bob = speed > 20 ? Math.round(Math.abs(Math.sin(t * 14)) * 3) : 0;
        bands(c, ['#45aefc', '#5ebcff', '#7bcaff', '#9cd8ff', '#c1e7ff', '#e2f4ff'], 0, 100);
        sun(c, 270, 20, 10, t);
        const fx = -Math.round(wrap(farPos, SW)); c.drawImage(far, fx, bob); c.drawImage(far, fx + SW, bob);
        const sx = -Math.round(wrap(pos, SW)); c.drawImage(strip, sx, bob - 2); c.drawImage(strip, sx + SW, bob - 2);
        // the man with the knife, falling behind
        let mx = beat === 0 ? 58 + Math.sin(t * 3) * 4 : beat === 1 ? 58 - bt * 40 : -60;
        if (mx > -30) { person(c, Math.round(mx), 120 + bob, Object.assign({}, B(), { face: 1, pose: Math.floor(t * 9) % 2 ? 1 : 0 })); if (Math.floor(t * 3) % 2) text3(c, '#e04848', '!!', Math.round(mx) - 4, 82 + bob); }
        // speed lines
        if (speed > 40) for (let i = 0; i < 9; i++) { const y = 20 + ((i * 37) % 120), len = 18 + (i % 3) * 10, x = Math.round(wrap(W - (t * 600 + i * 97), W + 60)) - 30; c.globalAlpha = 0.65; R(c, '#ffffff', x, y, len, 1); c.globalAlpha = 1; }
        // out of breath
        if (beat === 2 && bt > 1.2) for (let i = 0; i < 3; i++) { const ph = wrap(t * 0.9 + i / 3, 1); c.globalAlpha = 0.8 - ph * 0.8; disc(c, '#ffffff', 160 + i * 6 - 6 + Math.round(ph * 8), Math.round(132 - ph * 20), 2 + Math.round(ph * 2)); c.globalAlpha = 1; }
      },
    };
  })();

  /* ----- Kavga Et (not chatted): he lunges, everything goes dark ----- */
  ART.stab = (() => {
    const off = document.createElement('canvas'); off.width = 100; off.height = 140; const oc = off.getContext('2d');
    return {
      draw(c, t, o = {}) {
        const beat = o.beat || 0, bt = o.beatT || 0;
        E().base(c, t);
        person(c, 118, 119, Object.assign({}, A(), { face: 1, pose: 2 }));
        if (beat === 0) { frontMan(c, 176 + Math.round(Math.min(1, bt) * -8), 119, t, { knife: true }); return; }
        const sh = beat === 1 && bt < 1.2 ? (Math.floor(t * 30) % 2 ? 2 : -2) : 0;
        c.globalAlpha = 0.45; c.fillStyle = '#1a0d1a'; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
        oc.clearRect(0, 0, 100, 140); window.ACTORS['Knife Man'](oc, t, 'angry');
        c.drawImage(off, 110 + sh, 30 + sh);
        const fl = beat === 1 ? Math.max(0, 1 - bt / 0.9) : 0;
        if (fl > 0) { c.globalAlpha = 0.7 * fl; c.fillStyle = '#ff2030'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
        c.globalAlpha = beat === 2 ? 0.55 : 0.3; c.fillStyle = '#5a0010';
        for (let i = 0; i < 18; i++) { c.fillRect(0, 0, W, i); c.fillRect(0, H - i, W, i); c.fillRect(0, 0, i, H); c.fillRect(W - i, 0, i, H); }
        c.globalAlpha = 1;
        if (beat === 2) eyelids(c, Math.max(0, 1.6 - bt * 1.1));
      },
    };
  })();

  /* ----- bright, cheerful street (Samara) ----- */
  ART.brightStreet = (() => {
    let bg, cut, clouds, petals, tw, ready = false; const SKY = ['#4fc0ff', '#68ccff', '#86d8ff', '#a8e4ff', '#cbf0ff', '#ecfaff'];
    function init() {
      const r = rng(515);
      bg = mk(W, H, (c) => {
        bands(c, SKY, 0, 104);
        skyline(c, 77, 104, '#c6dcef', '#e2eef8', 20, 40);
        const houses = [['#bff0d8', '#7fd3a8'], ['#ffe8a0', '#ffc94d'], ['#ffd0c2', '#ff9f8a'], ['#e3d4ff', '#b79cf0'], ['#c9ecff', '#7fc4f0'], ['#ffd6ea', '#ff9ec7']];
        let x = 0, i = 0;
        while (x < W) {
          const w = 50 + (i % 2) * 8, h = 58 + (i % 3) * 8, [col, acc] = houses[i % houses.length];
          R(c, col, x, 104 - h, w, h); R(c, acc, x, 104 - h, w, 3); for (let k = 0; k < w; k += 4) R(c, acc, x + k, 104 - h - 2, 2, 2);
          for (const wx of [x + 7, x + w - 19]) { R(c, '#ffffff', wx, 104 - h + 12, 12, 13); R(c, '#9fdcff', wx + 2, 104 - h + 14, 8, 9); R(c, '#ffffff', wx + 5, 104 - h + 14, 1, 9); R(c, acc, wx - 1, 104 - h + 25, 14, 3); for (let f = 0; f < 5; f++) P(c, ['#ff6b9a', '#ffd23f', '#ffffff', '#b27bff', '#ff9f43'][(f + i) % 5], wx + 1 + f * 3, 104 - h + 24); }
          R(c, acc, x + Math.floor(w / 2) - 5, 82, 10, 22); R(c, '#ffffff', x + Math.floor(w / 2) - 6, 80, 12, 2); P(c, '#ffd23f', x + Math.floor(w / 2) + 3, 93);
          x += w; i++;
        }
        // sweets shop sign
        R(c, '#ff6b9a', 116, 50, 40, 10); text3(c, '#ffffff', 'DOCES', 126, 52);
        for (let k = 0; k < 40; k++) R(c, Math.floor(k / 5) % 2 ? '#ffffff' : '#ff6b9a', 116 + k, 62, 1, 5);
        calcada(c, 104, 146, 33);
        R(c, '#9a9aa2', 0, 146, W, 3); R(c, '#c4c4cc', 0, 146, W, 1); R(c, '#55555f', 0, 149, W, H - 149);
        for (let x2 = 10; x2 < W; x2 += 28) R(c, '#ffffff', x2, 165, 14, 2);
        // blossom trees in the sidewalk
        for (const tx of [26, 214, 300]) {
          R(c, '#8a5a3b', tx - 2, 80, 4, 30); R(c, '#6b4a33', tx - 6, 110, 12, 3);
          disc(c, '#ffb3d0', tx, 66, 15); disc(c, '#ffd0e2', tx - 4, 62, 9); disc(c, '#ff8fb8', tx + 6, 72, 6);
          for (let k = 0; k < 16; k++) P(c, '#ffffff', tx - 12 + Math.floor(r() * 24), 54 + Math.floor(r() * 24));
        }
      });
      cut = makeCut(bg, SKY, 104);
      clouds = cloudLayer(61, 4, 4, 30, 26, 44, 3, 6);
      petals = []; for (let i = 0; i < 20; i++) petals.push({ x: r() * W, y: r() * H, sp: 8 + r() * 10, ph: r() * 6 });
      tw = []; for (let i = 0; i < 10; i++) tw.push({ x: 10 + Math.floor(r() * 300), y: 10 + Math.floor(r() * 90), sp: 0.4 + r() * 0.4, ph: r(), col: '#ffffff' });
      ready = true;
    }
    return {
      draw(c, t) {
        if (!ready) init();
        c.drawImage(bg, 0, 0);
        sun(c, 286, 16, 10, t); drawClouds(c, clouds, t);
        c.drawImage(cut, 0, 0);
        // bunting across the street
        for (let x = 0; x < W; x++) P(c, '#c98d5a', x, Math.round(10 + Math.sin(x / W * 3.14) * 10));
        for (let i = 0; i < 26; i++) { const x = 4 + i * 12; const y = Math.round(10 + Math.sin(x / W * 3.14) * 10) + 1; const sw = Math.round(Math.sin(t * 2 + i) * 0.7); for (let k = 0; k < 5; k++) R(c, ['#ff6b9a', '#ffd23f', '#4dc3ff', '#7ae582', '#b27bff'][i % 5], x + k / 2 + sw * (k > 2 ? 1 : 0), y + k, 6 - k, 1); }
        birds(c, [{ x: 40, y: 26, sp: 15, ph: 0 }, { x: 52, y: 32, sp: 15, ph: 1 }], t);
        twinkles(c, tw, t);
        // a balloon drifting up
        const bx = Math.round(wrap(150 + t * 6, W + 20) - 10), by = Math.round(wrap(90 - t * 9, 140) - 20);
        disc(c, '#ff5a6e', bx, by, 4); P(c, '#ffb3b3', bx - 2, by - 2); for (let k = 0; k < 8; k++) P(c, '#ffffff', bx + Math.round(Math.sin(t * 3 + k) * 0.6), by + 5 + k);
        // cat in a window
        const cw = wrap(t, 5) < 0.2; R(c, '#ff9f43', 70, 41, 6, 4); P(c, '#ff9f43', 70, 40); P(c, '#ff9f43', 75, 40); if (!cw) { P(c, '#2c1f45', 71, 42); P(c, '#2c1f45', 74, 42); }
        // petals + butterflies
        for (const p of petals) { const x = Math.round(wrap(p.x + t * p.sp, W)), y = Math.round(wrap(p.y + t * p.sp * 0.5, H)); P(c, '#ffc2dc', x + sn(t * 2 + p.ph), y); }
        for (let i = 0; i < 2; i++) { const x = Math.round(90 + i * 120 + Math.sin(t * 0.6 + i) * 30), y = Math.round(96 + Math.sin(t * 1.4 + i) * 8); const open = Math.floor(t * 8 + i) % 2; P(c, '#2c2440', x, y); if (open) { R(c, i ? '#ffd23f' : '#4dc3ff', x - 2, y - 1, 2, 2); R(c, i ? '#ffd23f' : '#4dc3ff', x + 1, y - 1, 2, 2); } else { P(c, i ? '#ffd23f' : '#4dc3ff', x - 1, y - 2); P(c, i ? '#ffd23f' : '#4dc3ff', x + 1, y - 2); } }
      },
    };
  })();

  /* ----- university garden ----- */
  ART.campus = (() => {
    let bg, cut, clouds, ready = false; const SKY = ['#4fb8ff', '#66c6ff', '#85d4ff', '#a8e2ff', '#cdefff'];
    function init() {
      const r = rng(808);
      bg = mk(W, H, (c) => {
        bands(c, SKY, 0, 96);
        // main building
        R(c, '#f2ead8', 70, 34, 180, 62); R(c, '#e3d8c0', 70, 34, 180, 3);
        for (let i = 0; i < 20; i++) R(c, '#f7f0e0', 70 + i * 4.5, 30 - i, 180 - i * 9, 1);
        R(c, '#d8cdb4', 80, 31, 160, 1); text3(c, '#8a6a3a', 'UNIVERSITY', 120, 22);
        for (let k = 0; k < 8; k++) { const x = 84 + k * 21; R(c, '#ffffff', x, 40, 6, 52); R(c, '#e3d8c0', x + 5, 40, 1, 52); R(c, '#e8dfca', x - 1, 38, 8, 2); R(c, '#e8dfca', x - 1, 91, 8, 2); }
        for (let k = 0; k < 7; k++) { const x = 92 + k * 21; R(c, '#7d8ea3', x, 48, 9, 14); R(c, '#a9bfd6', x + 1, 49, 3, 4); R(c, '#7d8ea3', x, 70, 9, 14); }
        R(c, '#6b4a33', 152, 66, 16, 26); R(c, '#8a5a3b', 153, 67, 6, 25);
        for (let k = 0; k < 4; k++) R(c, k % 2 ? '#e3d8c0' : '#efe6d2', 140 - k * 6, 92 + k, 40 + k * 12, 1);
        // side wings + trees
        R(c, '#e8dcc4', 20, 52, 50, 44); R(c, '#e8dcc4', 250, 52, 50, 44);
        for (const wx of [26, 44, 256, 274]) { R(c, '#7d8ea3', wx, 60, 8, 10); R(c, '#7d8ea3', wx, 78, 8, 10); }
        // lawn
        R(c, '#6fd36f', 0, 96, W, H - 96); for (let i = 0; i < 260; i++) P(c, r() < 0.5 ? '#5cc460' : '#8be582', Math.floor(r() * W), 96 + Math.floor(r() * 84));
        // path
        for (let y = 96; y < H; y++) { const k = (y - 96) / 84; const w = Math.round(40 + k * 120); R(c, '#e8d8b0', 160 - w / 2, y, w, 1); if (y % 6 === 0) R(c, '#d6c49a', 160 - w / 2, y, w, 1); }
        for (const tx of [14, 60, 270, 306]) { R(c, '#8a5a3b', tx - 2, 80, 4, 22); disc(c, '#2f9e4f', tx, 70, 14); disc(c, '#45b860', tx - 3, 66, 9); disc(c, '#7bd87a', tx - 5, 62, 3); }
        // benches
        for (const bx of [36, 254]) { R(c, '#a8714a', bx, 110, 30, 3); R(c, '#a8714a', bx, 104, 30, 2); R(c, '#6b4a33', bx + 2, 113, 2, 6); R(c, '#6b4a33', bx + 26, 113, 2, 6); }
        // fountain basin
        ell(c, '#b8c4d4', 210, 120, 22, 6); ell(c, '#6fc8ff', 210, 119, 19, 4); R(c, '#b8c4d4', 207, 104, 6, 15); ell(c, '#b8c4d4', 210, 104, 8, 2);
      });
      cut = makeCut(bg, SKY, 96);
      clouds = cloudLayer(91, 4, 2, 22, 26, 44, 2, 5); ready = true;
    }
    return {
      draw(c, t) {
        if (!ready) init();
        c.drawImage(bg, 0, 0); sun(c, 30, 16, 9, t); drawClouds(c, clouds, t); c.drawImage(cut, 0, 0);
        // fountain water
        for (let i = 0; i < 10; i++) { const ph = wrap(t * 1.4 + i / 10, 1); const side = i % 2 ? 1 : -1; const x = Math.round(210 + side * ph * 14), y = Math.round(100 - Math.sin(ph * 3.14) * 12 + ph * 16); P(c, '#d8f4ff', x, y); P(c, '#9fdcff', x, y + 1); }
        if (wrap(t, 1) < 0.5) { P(c, '#ffffff', 200, 119); P(c, '#ffffff', 220, 118); } else { P(c, '#ffffff', 205, 120); P(c, '#ffffff', 215, 119); }
        // students strolling
        const s1 = Math.round(wrap(t * 9, W + 40) - 20), s2 = Math.round(W + 20 - wrap(t * 7 + 120, W + 40));
        person(c, s1, 101, { skin: '#c68a5e', hair: '#1b1416', shirt: '#ff9f43', pants: '#3a4a6a', shoes: '#ffffff', face: 1, pose: 0, bob: Math.floor(t * 4) % 2 });
        R(c, '#4dc3ff', s1 - 8, 80 + (Math.floor(t * 4) % 2), 4, 8);
        person(c, s2, 103, { skin: '#f2c7a5', hair: '#ffd866', shirt: '#b27bff', pants: '#5a4a3a', shoes: '#1b1416', face: -1, pose: 0, bob: Math.floor(t * 4 + 1) % 2 });
        birds(c, [{ x: 100, y: 12, sp: 12, ph: 0 }, { x: 112, y: 6, sp: 12, ph: 1.2 }], t);
      },
    };
  })();

  /* ----- school gate (sad, a bit grey) ----- */
  ART.schoolGate = (() => {
    let bg, clouds, leaves, ready = false;
    function init() {
      const r = rng(919);
      bg = mk(W, H, (c) => {
        bands(c, ['#8fa7c2', '#a2b6cc', '#b5c5d6', '#c7d3df', '#d8e0e8'], 0, 100);
        R(c, '#e6dccb', 0, 70, W, 30); for (let x = 0; x < W; x += 12) R(c, '#d3c7b2', x, 70, 1, 30); R(c, '#cfc3ad', 0, 70, W, 2);
        // building behind the fence
        R(c, '#e8e0d0', 100, 30, 120, 40); for (let k = 0; k < 6; k++) R(c, '#8e9aaa', 108 + k * 19, 38, 10, 12);
        for (let i = 0; i < 14; i++) R(c, '#efe7d8', 100 + i * 4, 30 - i, 120 - i * 8, 1);
        // pillars + arch
        for (const px of [92, 216]) { R(c, '#b8ae9c', px, 40, 14, 72); R(c, '#cfc6b4', px, 40, 4, 72); R(c, '#a39883', px - 2, 38, 18, 4); disc(c, '#cfc6b4', px + 7, 34, 4); }
        for (let x = 106; x < 216; x++) P(c, '#3a3a44', x, Math.round(46 - Math.sin((x - 106) / 110 * 3.14) * 10));
        R(c, '#3a3a44', 120, 30, 80, 10); text3(c, '#ffe08a', 'UNIVERSITY', 121, 33);
        // closed iron gate
        for (let x = 108; x < 214; x += 5) { R(c, '#2e2e38', x, 52, 2, 60); R(c, '#2e2e38', x - 1, 51, 4, 1); P(c, '#2e2e38', x, 49); P(c, '#2e2e38', x + 1, 49); P(c, '#2e2e38', x, 50); }
        R(c, '#2e2e38', 106, 64, 110, 2); R(c, '#2e2e38', 106, 96, 110, 2); R(c, '#9a7a3a', 158, 76, 6, 8); R(c, '#2e2e38', 160, 79, 2, 3);
        // hedges
        for (let x = 0; x < 92; x += 6) disc(c, '#4f8d5a', x + 3, 104, 6); for (let x = 230; x < W; x += 6) disc(c, '#4f8d5a', x + 3, 104, 6);
        calcada(c, 112, 150, 44);
        R(c, '#8a8a92', 0, 150, W, 3); R(c, '#4a4a54', 0, 153, W, H - 153);
      });
      clouds = cloudLayer(13, 5, 2, 40, 34, 60, 1.5, 3, '#eef2f6', '#c2ccd8');
      leaves = []; for (let i = 0; i < 12; i++) leaves.push({ x: r() * W, y: r() * H, sp: 6 + r() * 6, ph: r() * 6, c: ['#e8a33a', '#d0702a', '#c9b04a'][i % 3] });
      ready = true;
    }
    return {
      draw(c, t) {
        if (!ready) init();
        c.drawImage(bg, 0, 0);
        c.save(); c.beginPath(); c.rect(0, 0, W, 30); c.clip(); drawClouds(c, clouds, t); c.restore();
        for (const l of leaves) { const x = Math.round(wrap(l.x + t * l.sp, W)), y = Math.round(wrap(l.y + t * l.sp * 0.8, H)); const f = Math.floor(t * 3 + l.ph) % 2; R(c, l.c, x, y, f ? 2 : 1, f ? 1 : 2); }
      },
    };
  })();

  /* ----- hospital room (POV from the bed) ----- */
  ART.hospital = (() => {
    let bg, ready = false; const ecg = [0, 0, 0, 0, 1, -1, -6, 5, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0];
    function init() {
      bg = mk(W, H, (c) => {
        R(c, '#d9f2ea', 0, 0, W, 124); for (let x = 0; x < W; x += 16) R(c, '#cdeadf', x, 0, 1, 124);
        R(c, '#bfe3d6', 0, 84, W, 3); R(c, '#e8f7f1', 0, 87, W, 37);
        R(c, '#c8d6dc', 0, 124, W, H - 124); for (let x = 0; x < W; x += 20) R(c, '#b8c8d0', x, 124, 1, H - 124);
        // window
        R(c, '#ffffff', 120, 14, 70, 52); bands(c, ['#6cc6ff', '#8ad4ff', '#aee2ff', '#d0f0ff'], 17, 63, 123, 64); R(c, '#ffffff', 154, 17, 2, 46);
        R(c, '#e6eef0', 116, 66, 78, 3);
        // curtain rail + privacy curtain
        R(c, '#9aa6ae', 0, 8, 100, 2);
        for (let x = 0; x < 92; x++) { const k = Math.sin(x * 0.45); R(c, k > 0.3 ? '#a8d4f0' : k < -0.3 ? '#86bde0' : '#97c8e8', x, 10, 1, 110); }
        // side table
        R(c, '#e3e8ea', 210, 92, 34, 4); R(c, '#cfd6da', 212, 96, 30, 26); R(c, '#bfc8cc', 226, 100, 1, 18);
        R(c, '#9fdcff', 220, 80, 8, 12); R(c, '#ffffff', 221, 81, 2, 9);
        for (const [fx, fy, col] of [[219, 74, '#ff6b9a'], [224, 71, '#ffd23f'], [229, 75, '#ffffff']]) { R(c, '#4fae5a', fx + 1, fy + 2, 1, 7); disc(c, col, fx + 1, fy, 2); }
        // monitor stand
        R(c, '#8a96a0', 278, 60, 3, 64); R(c, '#6a7680', 270, 122, 20, 3);
        R(c, '#2e3440', 258, 30, 46, 32); R(c, '#11161e', 261, 33, 40, 24); R(c, '#4a5260', 258, 60, 46, 2);
        // IV pole
        R(c, '#b8c0c8', 196, 14, 2, 110); R(c, '#b8c0c8', 188, 14, 18, 2); R(c, '#e8f4ff', 186, 18, 10, 16); R(c, '#cfe4f5', 186, 30, 10, 4); R(c, '#9ab0c4', 190, 34, 2, 8);
        for (let y = 46; y < 120; y++) P(c, '#d8e8f2', 191 + Math.round((y - 46) * -0.9), y);
        // bed foot (foreground)
        R(c, '#ffffff', 0, 132, W, 48); for (let x = 0; x < W; x++) P(c, '#e6eef4', x, 132 + Math.round(Math.sin(x * 0.05) * 2) + 2);
        ell(c, '#f2f6fa', 130, 136, 20, 8); ell(c, '#f2f6fa', 190, 136, 20, 8); R(c, '#9aa6ae', 0, 128, W, 3); R(c, '#c4ccd2', 0, 127, W, 1);
      });
      ready = true;
    }
    return {
      draw(c, t) {
        if (!ready) init();
        c.drawImage(bg, 0, 0);
        // tree branch swaying outside
        const s = Math.round(Math.sin(t * 0.9) * 1.5);
        c.save(); c.beginPath(); c.rect(123, 17, 64, 46); c.clip();
        disc(c, '#5cc46a', 182 + s, 24, 9); disc(c, '#7bd87a', 176 + s, 20, 5); for (let i = 0; i < 20; i++) P(c, '#6b4a33', 190 - i, 34 + Math.round(i * 0.2));
        const bx = Math.round(wrap(t * 8, 90)) + 110; c.drawImage(BIRD[Math.floor(wrap(t * 6, 2))], bx, 30);
        c.restore(); R(c, '#ffffff', 154, 17, 2, 46);
        // ECG trace
        const off = Math.floor(t * 24);
        for (let x = 0; x < 40; x++) { const v = ecg[(x + off) % ecg.length]; const age = (40 - x); if (age < 4) continue; P(c, '#5cff8a', 261 + x, 45 + v); }
        const beat = ((off) % ecg.length) < 3; text3(c, '#5cff8a', '72', 288, 35); if (beat) { R(c, '#ff5a6e', 263, 35, 2, 2); R(c, '#ff5a6e', 266, 35, 2, 2); R(c, '#ff5a6e', 263, 37, 5, 1); P(c, '#ff5a6e', 265, 38); }
        // IV drip
        const d = wrap(t * 0.9, 1); if (d < 0.8) P(c, '#bfe4ff', 190, 34 + Math.round(d * 8));
        // GET WELL balloon
        const by = Math.round(56 + Math.sin(t * 1.3) * 2);
        disc(c, '#ff9ec7', 238, by, 8); disc(c, '#ffc2dc', 235, by - 3, 3); for (let k = 0; k < 24; k++) P(c, '#ffffff', 238 + Math.round(Math.sin(k / 4 + t) * 0.8), by + 9 + k);
        R(c, '#ff6b9a', 230, by + 1, 16, 1);
        // dust in the sunlight
        for (let i = 0; i < 6; i++) { const ph = wrap(t * 0.08 + i / 6, 1); if (Math.sin(t * 3 + i) > -0.2) P(c, '#ffffff', Math.round(130 + i * 9 + Math.sin(t + i) * 3), Math.round(70 + ph * 50)); }
      },
    };
  })();

  /* ----- outside the hospital ----- */
  ART.hospitalExit = (() => {
    let bg, cut, clouds, ready = false; const SKY = ['#45aefc', '#5ebcff', '#7bcaff', '#9cd8ff', '#c1e7ff', '#e2f4ff'];
    function init() {
      bg = mk(W, H, (c) => {
        bands(c, SKY, 0, 104);
        skyline(c, 55, 104, '#bccbe0', '#dbe5f1', 30, 60);
        R(c, '#f7f9fb', 60, 18, 200, 86); R(c, '#e2e8ee', 60, 18, 200, 3); R(c, '#4dc3ff', 60, 60, 200, 3);
        for (let y = 26; y < 58; y += 12) for (let x = 68; x < 252; x += 16) { R(c, '#8fb8d8', x, y, 10, 8); R(c, '#c8e4f8', x + 1, y + 1, 3, 3); }
        R(c, '#ffffff', 140, 2, 40, 16); R(c, '#e04848', 156, 4, 8, 12); R(c, '#e04848', 152, 8, 16, 4);
        R(c, '#e04848', 118, 66, 84, 10); text3(c, '#ffffff', 'HOSPITAL', 128, 69);
        R(c, '#9fdcff', 132, 80, 56, 24); R(c, '#cfeeff', 134, 82, 12, 20); R(c, '#7a8a9a', 159, 80, 2, 24); R(c, '#b8c4d0', 126, 78, 68, 2);
        calcada(c, 104, 146, 66);
        R(c, '#9a9aa2', 0, 146, W, 3); R(c, '#4a4a54', 0, 149, W, H - 149); for (let x = 10; x < W; x += 28) R(c, '#ffd23f', x, 165, 14, 2);
        // ambulance
        R(c, '#ffffff', 220, 104, 56, 26); R(c, '#ffffff', 276, 112, 14, 18); R(c, '#9fdcff', 279, 114, 9, 7); R(c, '#e04848', 220, 118, 70, 3);
        R(c, '#e04848', 240, 108, 4, 10); R(c, '#e04848', 237, 111, 10, 4); disc(c, '#2e2e36', 232, 131, 4); disc(c, '#2e2e36', 278, 131, 4); disc(c, '#8a8a92', 232, 131, 1); disc(c, '#8a8a92', 278, 131, 1);
        for (const tx of [26, 300]) { R(c, '#8a5a3b', tx - 2, 80, 4, 26); disc(c, '#2f9e4f', tx, 70, 13); disc(c, '#45b860', tx - 3, 66, 8); }
      });
      cut = makeCut(bg, SKY, 104);
      clouds = cloudLayer(71, 4, 2, 16, 26, 40, 2, 4); ready = true;
    }
    return {
      draw(c, t) {
        if (!ready) init();
        c.drawImage(bg, 0, 0); sun(c, 296, 14, 8, t); drawClouds(c, clouds, t); birds(c, [{ x: 20, y: 10, sp: 14, ph: 0 }], t); c.drawImage(cut, 0, 0);
        // siren light idle glint + pigeons
        if (wrap(t, 2) < 0.2) P(c, '#ffffff', 262, 103);
        R(c, '#4dc3ff', 258, 101, 8, 3);
        const px = Math.round(90 + Math.sin(t * 0.4) * 14); window.PX.pigeon(c, px, 122, t, Math.cos(t * 0.4) > 0 ? 1 : -1);
      },
    };
  })();

  ART.bedroomNight = { draw: (c, t, o = {}) => ART.bedroom.draw(c, t, Object.assign({}, o, { night: true })) };
})();
