/* =====================================================================
   Life — engine: scene flow, typing, transitions, talk layout, inventory,
   hidden stats (karma / relationships / flags), branches, debug overlay.
   URL params: ?debug=1 (stats overlay + scene jump)   ?fast=1 (fast timings for tests)
   ===================================================================== */
(function () {
  const $ = (s) => document.querySelector(s);
  const Q = new URLSearchParams(location.search);
  const DEBUG = Q.get('debug') === '1', FAST = Q.get('fast') === '1';
  const FADE = FAST ? 40 : 460, CPS = FAST ? 2000 : 42, HOLD = FAST ? 0.05 : 1.9;

  const cv = $('#cv'), ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const actorCv = $('#actor'), actx = actorCv.getContext('2d');
  const el = {
    game: $('#game'), menu: $('#menu'), logo: $('#logo'), menuBtns: $('#menu .menu-btns'), saveHint: $('#menu .savehint'),
    namecard: $('#namecard'), nameForm: $('#namecard form'), nameInput: $('#nameInput'), nameErr: $('#namecard .err'),
    cuttext: $('#cuttext'), cutname: $('#cutname'), cutchoices: $('#cutchoices'), tbc: $('#tbc'), tbcMenu: $('#tbcMenu'), tbcDots: $('#tbc .dots'),
    dialog: $('#dialog'), nametag: $('#dialog .nametag'), text: $('#dialog .text'), choices: $('#dialog .choices'),
    invBtn: $('#invBtn'), invIcon: $('#invBtn canvas'), invBadge: $('#invBtn .badge'), inv: $('#inv'), invGrid: $('#inv .inv-grid'),
    invDetail: $('#inv .inv-detail'), invClose: $('#inv .inv-close'), toast: $('#toast'),
    fade: $('#fade'), card: $('#card'), debug: $('#debug'),
  };
  const SC = window.SCENES, ITEMS = window.ITEMS, D = () => State.data;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fill = (s) => String(s).replace(/\{name\}/g, D().name || 'friend').replace(/\{lastItem\}/g, (ITEMS[D().lastItem] || {}).name || 'something');

  let current = null, scene = null, art = null, artOpts = {}, t0 = performance.now();
  let busy = false, lineIdx = 0, lines = [], typer = null, sceneToken = 0, cutFx = null;
  let actor = null, actorExpr = null, beat = 0, beatStart = performance.now(), cutAdvance = null;

  /* ---------- typing ---------- */
  function typeInto(node, text, cps = CPS) {
    node.classList.add('typed');
    node.innerHTML = '<span class="shown"></span><span class="rest"></span>';
    const shown = node.firstChild, rest = node.lastChild; const chars = Array.from(text);
    let i = 0, done = false, resolve, timer; rest.textContent = text;
    const p = new Promise((r) => (resolve = r));
    const step = () => {
      if (done) return; i += FAST ? chars.length : 1;
      shown.textContent = chars.slice(0, i).join(''); rest.textContent = chars.slice(i).join('');
      if (i >= chars.length) finish(); else timer = setTimeout(step, 1000 / cps * (/[.,!?]/.test(chars[i - 1]) ? 4 : 1));
    };
    timer = setTimeout(step, FAST ? 0 : 60);
    function finish() { if (done) return; done = true; clearTimeout(timer); shown.textContent = text; rest.textContent = ''; resolve(); }
    return { promise: p, finish, get done() { return done; } };
  }

  /* ---------- fades + intro card ---------- */
  async function fadeOut() { el.fade.classList.remove('clear'); await sleep(FADE); }
  async function fadeIn() { el.fade.classList.add('clear'); await sleep(FADE); }
  async function introCard(text) {
    el.card.textContent = ''; el.card.classList.add('on');
    const ty = typeInto(el.card, fill(text), FAST ? CPS : 34);
    let skip; const skipP = new Promise((r) => (skip = r));
    const onTap = () => { if (!ty.done) ty.finish(); else skip(); };
    el.fade.style.pointerEvents = 'auto'; el.fade.addEventListener('click', onTap);
    await Promise.race([ty.promise.then(() => sleep(FAST ? 30 : 1300)), skipP]);
    ty.finish(); el.fade.removeEventListener('click', onTap); el.fade.style.pointerEvents = '';
    el.card.classList.remove('on'); await sleep(FAST ? 20 : 300);
  }

  /* ---------- toast ---------- */
  let toastT = null;
  function toast(html) { el.toast.innerHTML = html; el.toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.toast.classList.remove('on'), 2400); }

  /* ---------- effects ---------- */
  function addItem(id, from) {
    const def = ITEMS[id]; if (!def) return;
    if (State.addItem(id, from || def.from)) {
      D().lastItem = id;
      if ((from || def.from || '').includes('room')) D().flags['took_' + id] = true;
      toast(`<canvas width="16" height="16"></canvas><span>Added to inventory: <b>${def.name}</b></span>`);
      ArtUtil.drawIcon(el.toast.querySelector('canvas'), id);
    }
  }
  function applyEffects(effects) {
    for (const e of effects || []) {
      if (e.type === 'karma') D().karma += e.delta;
      else if (e.type === 'rel') D().rel[e.char] = (D().rel[e.char] || 0) + e.delta;
      else if (e.type === 'addItem') addItem(e.item, e.from);
      else if (e.type === 'addRandomItem') { const pool = e.pool.filter((p) => !State.hasItem(p)); if (pool.length) addItem(pool[Math.floor(Math.random() * pool.length)], e.from); }
      else if (e.type === 'removeItem' || e.type === 'useItem') State.removeItem(e.item);
      else if (e.type === 'flag') D().flags[e.key] = e.value;
      // legacy v1 effect names
      else if (e.type === 'setTrinket') addItem(e.item);
      else if (e.type === 'randomTrinket') applyEffects([{ type: 'addRandomItem', pool: e.pool }]);
    }
    State.save(); refreshInvBtn(); renderDebug();
  }

  /* ---------- choices ---------- */
  async function choose(ch) {
    if (busy) return;
    if (ch.action === 'restart') { State.reset(); refreshInvBtn(); return goTo('Start', { via: 'choice' }); }
    if (ch.action === 'resume') return goTo(State.hasSave() ? D().currentScene : 'Start', { via: 'resume' });
    if (ch.action === 'menu') return goTo(window.START_SCENE, { via: 'menu' });
    applyEffects(ch.effects);
    const target = SC[ch.to];
    if (target && target.type === 'action') return choose({ action: target.action });
    if (current) D().choices.push(current + ' => ' + ch.to);
    return goTo(ch.to, { via: 'choice' });
  }
  function makeBtn(label, onClick, cls = 'pbtn', key) {
    const b = document.createElement('button'); b.className = cls; b.type = 'button';
    if (key) { const k = document.createElement('span'); k.className = 'k'; k.textContent = key; b.appendChild(k); }
    b.appendChild(document.createTextNode(label));
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
  }
  const visibleChoices = () => (scene.choices || []).filter((c) => Logic.test(c.if));

  /* ---------- scene flow ---------- */
  function resolve(id, via) {
    // follow 'branch' scenes to their target; returns final id
    for (let guard = 0; guard < 10; guard++) {
      const s = SC[id]; if (!s || s.type !== 'branch') return id;
      if (via === 'choice' || via === 'jump') record(id, via);
      const b = s.branches.find((x) => Logic.test(x.if)) || s.branches[s.branches.length - 1];
      if (via === 'choice') applyEffects(b.effects);
      id = b.to;
    }
    return id;
  }
  function record(id, via) {
    if (!D().visited.includes(id)) D().visited.push(id);
    D().visits[id] = (D().visits[id] || 0) + 1;
  }
  async function goTo(id, opts = {}) {
    if (busy) return; busy = true; document.body.dataset.ready = 'loading';
    const via = opts.via || 'choice';
    try {
      id = resolve(id, via);
      const next = SC[id];
      if (!opts.instant) await fadeOut();
      hideAll();
      if (next && next.intro && !opts.noIntro) await introCard(next.intro);
      enter(id, via, opts);
      await sleep(FAST ? 0 : 40);
      await fadeIn();
    } finally { busy = false; }
    afterEnter();
  }
  function hideAll() {
    for (const k of ['menu', 'namecard', 'cuttext', 'cutchoices', 'tbc', 'dialog']) el[k].hidden = true;
    el.cutname.hidden = true; el.dialog.classList.remove('more'); el.choices.innerHTML = ''; el.cutchoices.innerHTML = '';
    cutFx = null; cv.style.filter = ''; setActor(null); closeInventory();
    document.body.dataset.ready = '';
  }
  function enter(id, via, opts) {
    current = id; scene = SC[id] || { type: 'tbc' };
    const type = scene.type || 'dialogue';
    art = ART[type === 'tbc' ? 'tbc' : scene.art] || ART.tbc; artOpts = scene.artOpts || {}; t0 = performance.now();
    sceneToken++; beat = 0; beatStart = performance.now();
    if (type !== 'menu' && type !== 'action') {
      if (via === 'choice' || via === 'jump') record(id, via);
      if (via === 'choice' || (via === 'jump' && opts.applyEffects)) applyEffects(scene.onEnter);
      if (type !== 'tbc' && type !== 'menu') D().currentScene = id;
      State.save();
    }
    document.body.dataset.scene = id; document.body.dataset.type = type;
    el.invBtn.hidden = !(type === 'dialogue' || type === 'tbc' || type === 'cutscene');
    if (type === 'menu') showMenu();
    else if (type === 'name') showName();
    else if (type === 'cutscene') { el.cuttext.hidden = false; el.cuttext.textContent = ''; if (scene.effect === 'eyelids') cutFx = { start: performance.now() }; }
    else if (type === 'tbc') el.tbc.hidden = false;
    else { el.text.textContent = ''; el.nametag.hidden = true; if (scene.effect === 'eyelids') cutFx = { start: performance.now() }; }
    refreshInvBtn(); renderDebug();
  }
  function afterEnter() {
    const type = scene.type || 'dialogue';
    if (type === 'dialogue') runDialogue(sceneToken);
    else if (type === 'cutscene') runCutscene(sceneToken);
    else if (type === 'name') { document.body.dataset.ready = 'input'; setTimeout(() => el.nameInput.focus({ preventScroll: true }), 50); }
    else document.body.dataset.ready = 'choices';
  }

  /* ---------- menu ---------- */
  const LOGO_COLORS = ['#ff5d8f', '#ffd23f', '#7ae582', '#4dc3ff'];
  function showMenu() {
    el.menu.hidden = false; el.logo.innerHTML = '';
    Array.from('Life').forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--c', LOGO_COLORS[i]); s.style.setProperty('--i', i); el.logo.appendChild(s); });
    el.menuBtns.innerHTML = '';
    scene.choices.forEach((ch, i) => el.menuBtns.appendChild(makeBtn(ch.label, () => choose(ch), 'pbtn ' + (i === 0 ? 'pbtn-go' : 'pbtn-pink'))));
    el.saveHint.textContent = State.hasSave() ? 'Saved game: ' + D().name : '';
  }
  setInterval(() => { if (!el.menu.hidden && Math.random() < 0.5) { el.logo.classList.add('glitch'); setTimeout(() => el.logo.classList.remove('glitch'), 90); } }, 9000);

  /* ---------- name ---------- */
  function showName() { el.namecard.hidden = false; el.nameErr.textContent = ''; el.namecard.querySelector('.card-title').textContent = scene.title || 'Who are you?'; el.nameInput.value = D().name || ''; }
  el.nameInput.addEventListener('input', () => { el.nameErr.textContent = ''; });
  el.nameForm.addEventListener('submit', (e) => {
    e.preventDefault(); if (busy) return;
    const v = el.nameInput.value.replace(/\s+/g, ' ').trim().slice(0, 16);
    if (!v) { el.nameErr.textContent = 'Please enter a name.'; el.nameInput.focus(); return; }
    D().name = v; State.save(); goTo(scene.next, { via: 'choice' });
  });
  el.tbcMenu.addEventListener('click', () => goTo(window.START_SCENE, { via: 'menu' }));
  setInterval(() => { el.tbcDots.textContent = '.'.repeat(Math.floor(performance.now() / 450) % 4); }, 150);

  /* ---------- actors (big speaking characters, left side) ---------- */
  function parseActor(spec) { if (!spec) return null; const [n, e] = String(spec).split(':'); return window.ACTORS[n] ? { name: n, expr: e || undefined } : null; }
  function setActor(a) {
    const changed = (a && a.name) !== actor;
    actor = a ? a.name : null; actorExpr = a ? a.expr : null;
    el.game.classList.toggle('talk', !!a); actorCv.hidden = !a;
    if (a && changed) { actorCv.classList.remove('pop'); void actorCv.offsetWidth; actorCv.classList.add('pop'); }
  }

  /* ---------- dialogue ---------- */
  function lineObj(l) { return typeof l === 'string' ? { text: l } : l; }
  function showLine(i) {
    const L = lineObj(lines[i]);
    const speaker = L.speaker !== undefined ? L.speaker : (scene.speaker || null);
    if (speaker) { el.nametag.hidden = false; el.nametag.textContent = speaker; } else el.nametag.hidden = true;
    setActor(parseActor(L.actor || (speaker && window.ACTORS[speaker] ? speaker : null)));
    el.text.classList.toggle('narration', !speaker);
    el.dialog.classList.remove('more'); el.choices.innerHTML = '';
    document.body.dataset.line = i; document.body.dataset.ready = '';
    typer = typeInto(el.text, fill(L.text));
    typer.promise.then(() => { if (i < lines.length - 1) { el.dialog.classList.add('more'); document.body.dataset.ready = 'more'; } else showChoices(); });
  }
  function showChoices() {
    el.choices.innerHTML = '';
    const ch = visibleChoices();
    ch.forEach((c, i) => el.choices.appendChild(makeBtn(fill(c.label), () => choose(c), 'pbtn', String(i + 1))));
    if (!ch.length) el.choices.appendChild(makeBtn('Main Menu', () => goTo(window.START_SCENE, { via: 'menu' }), 'pbtn'));
    document.body.dataset.ready = 'choices';
  }
  async function runDialogue(tok) {
    lines = (scene.lines || []).filter((l) => Logic.test(lineObj(l).if));
    if (scene.delay && !FAST) await sleep(scene.delay * 1000);
    if (tok !== sceneToken) return;
    el.dialog.hidden = false; lineIdx = 0;
    if (lines.length) showLine(0); else showChoices();
  }
  function advance() {
    if (busy || !scene || !el.inv.hidden) return;
    const type = scene.type || 'dialogue';
    if (type !== 'dialogue' && type !== 'cutscene') return;
    if (typer && !typer.done) { typer.finish(); return; }
    if (type === 'dialogue' && lineIdx < lines.length - 1 && !el.dialog.hidden) { lineIdx++; showLine(lineIdx); }
    if (type === 'cutscene' && cutAdvance) cutAdvance();
  }
  el.dialog.addEventListener('click', advance); cv.addEventListener('click', advance); actorCv.addEventListener('click', advance); el.cuttext.addEventListener('click', advance);

  /* ---------- cutscene ---------- */
  async function runCutscene(tok) {
    lines = (scene.lines || []).filter((l) => Logic.test(lineObj(l).if));
    await sleep(FAST ? 0 : 700);
    for (let i = 0; i < lines.length; i++) {
      if (tok !== sceneToken) return;
      const L = lineObj(lines[i]); beat = i; beatStart = performance.now(); document.body.dataset.line = i;
      if (L.speaker) { el.cutname.hidden = false; el.cutname.textContent = L.speaker; } else el.cutname.hidden = true;
      typer = typeInto(el.cuttext, fill(L.text), FAST ? CPS : 32);
      await typer.promise;
      const hold = FAST ? HOLD : (L.hold || HOLD);
      await new Promise((r) => { const tm = setTimeout(r, hold * 1000); cutAdvance = () => { clearTimeout(tm); r(); }; });
      cutAdvance = null;
    }
    if (tok !== sceneToken) return;
    el.cutchoices.hidden = false; el.cutchoices.innerHTML = '';
    visibleChoices().forEach((ch) => el.cutchoices.appendChild(makeBtn(fill(ch.label), () => choose(ch), 'pbtn pbtn-go')));
    document.body.dataset.ready = 'choices';
  }

  /* ---------- inventory ---------- */
  let selected = null, confirmFor = null;
  function bagIcon(c) {
    c.clearRect(0, 0, 16, 16); const { R, P } = window.PX;
    R(c, '#8a5a3b', 4, 3, 8, 2); R(c, '#8a5a3b', 4, 3, 2, 4); R(c, '#8a5a3b', 10, 3, 2, 4);
    R(c, '#e8a35a', 2, 6, 12, 9); R(c, '#c98040', 2, 13, 12, 2); R(c, '#ffd28a', 3, 7, 4, 1); R(c, '#c98040', 2, 9, 12, 1); R(c, '#ffd23f', 7, 9, 2, 2); P(c, '#2c1f45', 7, 10);
  }
  bagIcon(el.invIcon.getContext('2d'));
  function refreshInvBtn() { const n = D().inventory.length; el.invBadge.textContent = n; el.invBadge.hidden = !n; if (!el.inv.hidden) renderInventory(); }
  function openInventory() { el.inv.hidden = false; selected = selected && State.hasItem(selected) ? selected : (D().inventory[0] || {}).id || null; confirmFor = null; renderInventory(); }
  function closeInventory() { el.inv.hidden = true; confirmFor = null; }
  function renderDetail(id) {
    const it = D().inventory.find((x) => x.id === id); const def = it && ITEMS[id];
    if (!def) { el.invDetail.innerHTML = '<p class="inv-empty">' + (D().inventory.length ? 'Hover or tap an item.' : 'Your bag is empty.') + '</p>'; return; }
    el.invDetail.innerHTML = `<div class="inv-head"><canvas width="16" height="16"></canvas><h3></h3></div><p class="inv-desc"></p><p class="inv-from"></p><div class="inv-actions"></div>`;
    ArtUtil.drawIcon(el.invDetail.querySelector('canvas'), id);
    el.invDetail.querySelector('h3').textContent = def.name; el.invDetail.querySelector('.inv-desc').textContent = def.desc;
    el.invDetail.querySelector('.inv-from').textContent = it.from || def.from || '';
    const act = el.invDetail.querySelector('.inv-actions');
    if (confirmFor === id) {
      const q = document.createElement('span'); q.className = 'inv-q'; q.textContent = `Throw away ${def.name}?`; act.appendChild(q);
      act.appendChild(makeBtn('Yes', () => { State.removeItem(id); State.save(); confirmFor = null; selected = (D().inventory[0] || {}).id || null; refreshInvBtn(); renderInventory(); renderDebug(); }, 'pbtn pbtn-pink small inv-yes'));
      act.appendChild(makeBtn('No', () => { confirmFor = null; renderDetail(id); }, 'pbtn small inv-no'));
    } else act.appendChild(makeBtn('Trash', () => { confirmFor = id; renderDetail(id); }, 'pbtn pbtn-pink small inv-trash'));
  }
  function renderInventory() {
    el.invGrid.innerHTML = '';
    const SLOTS = Math.max(8, Math.ceil(D().inventory.length / 4) * 4);
    for (let i = 0; i < SLOTS; i++) {
      const it = D().inventory[i]; const b = document.createElement('button'); b.type = 'button'; b.className = 'inv-slot';
      if (it) {
        const c = document.createElement('canvas'); c.width = 16; c.height = 16; ArtUtil.drawIcon(c, it.id); b.appendChild(c);
        b.dataset.item = it.id; b.title = (ITEMS[it.id] || {}).name || it.id;
        if (it.id === selected) b.classList.add('sel');
        b.addEventListener('mouseenter', () => { if (confirmFor) return; renderDetail(it.id); });
        b.addEventListener('mouseleave', () => { if (confirmFor) return; renderDetail(selected); });
        b.addEventListener('click', (e) => { e.stopPropagation(); selected = it.id; confirmFor = null; renderInventory(); });
      } else b.disabled = true;
      el.invGrid.appendChild(b);
    }
    renderDetail(selected);
  }
  el.invBtn.addEventListener('click', (e) => { e.stopPropagation(); el.inv.hidden ? openInventory() : closeInventory(); });
  el.invClose.addEventListener('click', (e) => { e.stopPropagation(); closeInventory(); });
  el.inv.addEventListener('click', (e) => { e.stopPropagation(); if (e.target === el.inv) closeInventory(); });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.target === el.nameInput || (e.target.tagName === 'SELECT')) return;
    if (e.key === 'Escape') { closeInventory(); return; }
    if ((e.key === 'i' || e.key === 'I') && !el.invBtn.hidden) { el.inv.hidden ? openInventory() : closeInventory(); return; }
    if (!el.inv.hidden) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) { const btns = el.dialog.hidden ? [] : el.choices.querySelectorAll('button'); if (btns[n - 1]) btns[n - 1].click(); }
  });

  /* ---------- debug overlay (?debug=1) ---------- */
  function renderDebug() {
    if (!DEBUG) return;
    const d = D(), id = current || '-';
    const rels = Logic.graph().chars.map((c) => { const r = Logic.relRangeAt(c, d.currentScene || id); return `${c}: ${State.getRel(c)} [${Logic.getRelTier(c)}] (range ${r.min}..${r.max})`; }).join('<br>');
    el.debug.querySelector('.dbg-stats').innerHTML =
      `<b>scene</b> ${id}<br><b>karma</b> ${d.karma} [${Logic.getKarmaTier()}] (max here ${Logic.maxKarmaAt(d.currentScene || id)})<br>${rels}` +
      `<br><b>chatted w/ Osvaldo</b> ${d.visited.includes('Sohbet et')}<br><b>items</b> ${d.inventory.map((x) => x.id).join(', ') || '-'}` +
      `<br><b>flags</b> ${Object.keys(d.flags).join(', ') || '-'}<br><b>visited</b> ${d.visited.length}`;
  }
  function setupDebug() {
    if (!DEBUG) return;
    el.debug.hidden = false;
    const sel = el.debug.querySelector('select');
    Object.keys(SC).forEach((k) => { const o = document.createElement('option'); o.value = k; o.textContent = k; sel.appendChild(o); });
    const on = (cls, fn) => el.debug.querySelector(cls).addEventListener('click', (e) => { e.stopPropagation(); fn(); renderDebug(); });
    on('.dbg-go', () => { if (!D().name) D().name = 'Tester'; goTo(sel.value, { via: 'jump', applyEffects: el.debug.querySelector('.dbg-fx').checked }); });
    on('.dbg-chat', () => { const v = D().visited; const i = v.indexOf('Sohbet et'); if (i >= 0) v.splice(i, 1); else v.push('Sohbet et'); State.save(); });
    on('.dbg-kp', () => { D().karma += 5; State.save(); });
    on('.dbg-km', () => { D().karma -= 5; State.save(); });
    on('.dbg-pebble', () => applyEffects([{ type: 'addItem', item: 'pebble' }]));
    on('.dbg-min', () => el.debug.classList.toggle('min'));
    el.debug.addEventListener('click', (e) => e.stopPropagation());
    setInterval(renderDebug, 1000);
  }

  /* ---------- render loop ---------- */
  const LID = [[0, 0], [1.0, 0], [2.0, 0.28], [2.35, 0.03], [3.6, 0.62], [3.85, 0.14], [5.3, 1.0], [6.6, 1.95]];
  const BLUR = [[0, 6], [2.0, 5], [3.6, 2.6], [5.3, 1], [6.6, 0]];
  const lerpK = (keys, t) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; const k = (t - a) / (b - a); const e = k * k * (3 - 2 * k); return va + (vb - va) * e; } return keys[keys.length - 1][1]; };
  let lastErr = '';
  function frame(now) {
    const t = Math.max(0, (now - t0) / 1000);
    ctx.clearRect(0, 0, 320, 180);
    const opts = Object.assign({}, artOpts, { actor, beat, beatT: Math.max(0, (now - beatStart) / 1000) });
    if (art) { try { art.draw(ctx, t, opts); } catch (err) { const m = String(err && err.stack || err); if (m !== lastErr) { console.error(err); lastErr = m; } } }
    if (scene && scene.letterbox) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 320, 12); ctx.fillRect(0, 168, 320, 12); }
    if (cutFx) {
      const ct = Math.max(0, (now - cutFx.start) / 1000) * (FAST ? 20 : 1);
      const o = lerpK(LID, ct); if (o < 1.9) ArtUtil.eyelids(ctx, o);
      const b = lerpK(BLUR, ct); cv.style.filter = b > 0.05 ? `blur(${(b * cv.clientWidth / 1280).toFixed(2)}px)` : '';
    }
    if (actor) { actx.clearRect(0, 0, 100, 140); try { window.ACTORS[actor](actx, t, actorExpr); } catch (err) { console.error(err); actor = null; } }
    requestAnimationFrame(frame);
  }

  /* ---------- boot ---------- */
  State.load(); Logic.build(); setupDebug();
  window.Game = { goTo, choose, state: State, logic: Logic, openInventory, closeInventory, applyEffects, get scene() { return current; }, DEBUG, FAST };
  const boot = () => { requestAnimationFrame(frame); goTo(window.START_SCENE, { instant: true, via: 'menu' }); };
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('16px PS2P'), document.fonts.load('16px Pixelify')]).then(boot, boot); else boot();
})();
