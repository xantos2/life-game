/* =====================================================================
   Life — engine: scene flow, typing effect, transitions, render loop.
   ===================================================================== */
(function () {
  const $ = (s) => document.querySelector(s);
  const cv = $('#cv'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const el = {
    game: $('#game'), menu: $('#menu'), logo: $('#logo'), menuBtns: $('#menu .menu-btns'), saveHint: $('#menu .savehint'),
    namecard: $('#namecard'), nameForm: $('#namecard form'), nameInput: $('#nameInput'), nameErr: $('#namecard .err'),
    cuttext: $('#cuttext'), cutchoices: $('#cutchoices'), tbc: $('#tbc'), tbcMenu: $('#tbcMenu'), tbcDots: $('#tbc .dots'),
    dialog: $('#dialog'), portrait: $('#dialog .portrait'), nametag: $('#dialog .nametag'), text: $('#dialog .text'), choices: $('#dialog .choices'),
    hud: $('#hud'), slotIcon: $('#slotIcon'), slotLabel: $('#hud .slot-label'), fade: $('#fade'), card: $('#card'),
  };
  const SC = window.SCENES, ITEMS = window.ITEMS;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fill = (s) => String(s).replace(/\{name\}/g, State.data.name || 'friend');

  let current = null;     // current scene id
  let scene = null;       // current scene object
  let art = null, artOpts = {}, t0 = performance.now();
  let busy = false;
  let lineIdx = 0, typer = null, sceneToken = 0;
  let cutFx = null;
  let portraitFn = null; const pctx = document.querySelector('#dialog .portrait').getContext('2d');

  /* ---------- typing ---------- */
  function typeInto(node, text, cps = 42) {
    node.classList.add('typed');
    node.innerHTML = '<span class="shown"></span><span class="rest"></span>';
    const shown = node.firstChild, rest = node.lastChild;
    const chars = Array.from(text); let i = 0; let done = false; let resolve;
    rest.textContent = text;
    const p = new Promise((r) => (resolve = r));
    const step = () => {
      if (done) return;
      i++; shown.textContent = chars.slice(0, i).join(''); rest.textContent = chars.slice(i).join('');
      if (i >= chars.length) finish(); else timer = setTimeout(step, 1000 / cps * (/[.,!?]/.test(chars[i - 1]) ? 4 : 1));
    };
    let timer = setTimeout(step, 60);
    function finish() { if (done) return; done = true; clearTimeout(timer); shown.textContent = text; rest.textContent = ''; resolve(); }
    return { promise: p, finish, get done() { return done; } };
  }

  /* ---------- fades ---------- */
  async function fadeOut() { el.fade.classList.remove('clear'); await sleep(460); }
  async function fadeIn() { el.fade.classList.add('clear'); await sleep(460); }

  async function introCard(text) {
    el.card.textContent = ''; el.card.classList.add('on');
    const ty = typeInto(el.card, fill(text), 34);
    let skip; const skipP = new Promise((r) => (skip = r));
    const onTap = () => { if (!ty.done) ty.finish(); else skip(); };
    el.fade.style.pointerEvents = 'auto'; el.fade.addEventListener('click', onTap);
    await Promise.race([ty.promise.then(() => sleep(1300)), skipP.then(() => {})]);
    if (!ty.done) ty.finish();
    await Promise.race([sleep(200), skipP]);
    el.fade.removeEventListener('click', onTap); el.fade.style.pointerEvents = '';
    el.card.classList.remove('on'); await sleep(300);
  }

  /* ---------- HUD ---------- */
  function updateHud(show) {
    const id = State.data.trinket;
    if (!show || !id) { el.hud.hidden = true; return; }
    el.hud.hidden = false;
    el.hud.classList.toggle('empty', !id);
    ArtUtil.drawIcon(el.slotIcon, id);
    el.slotLabel.textContent = id && ITEMS[id] ? ITEMS[id].name : 'No trinket';
  }

  function hideAll() {
    for (const k of ['menu', 'namecard', 'cuttext', 'cutchoices', 'tbc', 'dialog']) el[k].hidden = true;
    el.dialog.classList.remove('more'); el.choices.innerHTML = ''; el.cutchoices.innerHTML = '';
    cutFx = null; cv.style.filter = ''; portraitFn = null; el.portrait.hidden = true;
  }

  /* ---------- effects ---------- */
  function applyEffects(effects) {
    for (const e of effects || []) {
      if (e.type === 'setTrinket') State.data.trinket = e.item;
      else if (e.type === 'clearTrinket') State.data.trinket = null;
      else if (e.type === 'randomTrinket') State.data.trinket = e.pool[Math.floor(Math.random() * e.pool.length)];
      else if (e.type === 'flag') State.data.flags[e.key] = e.value;
    }
    State.save();
  }

  async function choose(ch) {
    if (busy) return;
    if (ch.action === 'restart') { State.reset(); return goTo('Start'); }
    if (ch.action === 'resume') { return goTo(State.hasSave() ? State.data.currentScene : 'Start'); }
    if (ch.action === 'menu') return goTo(window.START_SCENE);
    applyEffects(ch.effects);
    const target = SC[ch.to];
    if (target && target.type === 'action') return choose({ action: target.action });
    return goTo(ch.to);
  }

  function makeBtn(label, onClick, cls = 'pbtn', key) {
    const b = document.createElement('button'); b.className = cls; b.type = 'button';
    if (key) { const k = document.createElement('span'); k.className = 'k'; k.textContent = key; b.appendChild(k); }
    b.appendChild(document.createTextNode(label));
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
  }

  /* ---------- scene flow ---------- */
  async function goTo(id, opts = {}) {
    if (busy) return; busy = true;
    try {
      const next = SC[id];
      if (!opts.instant) await fadeOut();
      hideAll();
      if (next && next.intro && !opts.noIntro) await introCard(next.intro);
      enter(id);
      await sleep(40);
      await fadeIn();
    } finally { busy = false; }
    afterEnter();
  }

  function enter(id) {
    current = id; scene = SC[id] || { type: 'tbc' };
    const type = scene.type || 'dialogue';
    const artId = type === 'tbc' ? 'tbc' : scene.art;
    art = ART[artId] || ART.tbc; artOpts = scene.artOpts || {}; t0 = performance.now();
    sceneToken++;
    if (type !== 'tbc' && type !== 'menu' && type !== 'action') {
      State.data.currentScene = id;
      if (!State.data.visited.includes(id)) State.data.visited.push(id);
      State.save();
    }
    document.body.dataset.scene = id; document.body.dataset.type = type;
    updateHud(type === 'dialogue' || type === 'tbc');
    if (type === 'menu') showMenu();
    else if (type === 'name') showName();
    else if (type === 'cutscene') { el.cuttext.hidden = false; el.cuttext.textContent = ''; if (scene.effect === 'eyelids') cutFx = { start: performance.now() }; }
    else if (type === 'tbc') showTbc();
    else { el.dialog.hidden = false; el.text.textContent = ''; el.nametag.hidden = true; }
  }

  function afterEnter() {
    const type = scene.type || 'dialogue';
    if (type === 'dialogue') runDialogue(sceneToken);
    else if (type === 'cutscene') runCutscene(sceneToken);
    else if (type === 'name') setTimeout(() => el.nameInput.focus({ preventScroll: true }), 50);
  }

  /* menu */
  const LOGO_COLORS = ['#ff5d8f', '#ffd23f', '#7ae582', '#4dc3ff'];
  function showMenu() {
    el.menu.hidden = false;
    el.logo.innerHTML = '';
    Array.from('Life').forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--c', LOGO_COLORS[i]); s.style.setProperty('--i', i); el.logo.appendChild(s); });
    el.menuBtns.innerHTML = '';
    scene.choices.forEach((ch, i) => el.menuBtns.appendChild(makeBtn(ch.label, () => choose(ch), 'pbtn ' + (i === 0 ? 'pbtn-go' : 'pbtn-pink'))));
    el.saveHint.textContent = State.hasSave() ? 'Saved game: ' + State.data.name : '';
  }
  // rare, tiny logo glitch (a hint of what's coming)
  setInterval(() => { if (!el.menu.hidden && Math.random() < 0.5) { el.logo.classList.add('glitch'); setTimeout(() => el.logo.classList.remove('glitch'), 90); } }, 9000);

  /* name */
  function showName() {
    el.namecard.hidden = false; el.nameErr.textContent = '';
    el.namecard.querySelector('.card-title').textContent = scene.title || 'Who are you?';
    el.nameInput.value = State.data.name || '';
  }
  el.nameInput.addEventListener('input', () => { el.nameErr.textContent = ''; });
  el.nameForm.addEventListener('submit', (e) => {
    e.preventDefault(); if (busy) return;
    const v = el.nameInput.value.replace(/\s+/g, ' ').trim().slice(0, 16);
    if (!v) { el.nameErr.textContent = 'Please enter a name.'; el.nameInput.focus(); return; }
    State.data.name = v; State.save();
    goTo(scene.next);
  });

  /* tbc */
  function showTbc() { el.tbc.hidden = false; }
  el.tbcMenu.addEventListener('click', () => goTo(window.START_SCENE));
  setInterval(() => { const n = (Math.floor(performance.now() / 450) % 4); el.tbcDots.textContent = '.'.repeat(n); }, 150);

  /* dialogue */
  function lineObj(l) { return typeof l === 'string' ? { text: l, speaker: scene.speaker || null } : { text: l.text, speaker: l.speaker !== undefined ? l.speaker : (scene.speaker || null) }; }
  function showLine(i) {
    const L = lineObj(scene.lines[i]);
    if (L.speaker) { el.nametag.hidden = false; el.nametag.textContent = L.speaker; } else el.nametag.hidden = true;
    portraitFn = (L.speaker && window.PORTRAITS[L.speaker]) || null; el.portrait.hidden = !portraitFn;
    el.text.classList.toggle('narration', !L.speaker);
    el.dialog.classList.remove('more');
    typer = typeInto(el.text, fill(L.text));
    typer.promise.then(() => {
      if (i < scene.lines.length - 1) el.dialog.classList.add('more'); else showChoices();
    });
  }
  function showChoices() {
    el.choices.innerHTML = '';
    (scene.choices || []).forEach((ch, i) => el.choices.appendChild(makeBtn(fill(ch.label), () => choose(ch), 'pbtn', String(i + 1))));
    if (!(scene.choices || []).length) el.choices.appendChild(makeBtn('Main Menu', () => goTo(window.START_SCENE), 'pbtn'));
  }
  function runDialogue(tok) { if (tok !== sceneToken) return; lineIdx = 0; showLine(0); }
  function advance() {
    if (busy || !scene) return;
    const type = scene.type || 'dialogue';
    if (type !== 'dialogue' && type !== 'cutscene') return;
    if (typer && !typer.done) { typer.finish(); return; }
    if (type === 'dialogue' && lineIdx < scene.lines.length - 1) { lineIdx++; showLine(lineIdx); }
    if (type === 'cutscene' && cutAdvance) cutAdvance();
  }
  el.dialog.addEventListener('click', advance);
  cv.addEventListener('click', advance);
  el.cuttext.addEventListener('click', advance);

  /* cutscene */
  let cutAdvance = null;
  async function runCutscene(tok) {
    await sleep(700);
    for (let i = 0; i < scene.lines.length; i++) {
      if (tok !== sceneToken) return;
      typer = typeInto(el.cuttext, fill(scene.lines[i]), 26);
      await typer.promise;
      if (i === scene.lines.length - 1) break;
      await new Promise((r) => { const tm = setTimeout(r, 1900); cutAdvance = () => { clearTimeout(tm); r(); }; });
      cutAdvance = null;
    }
    if (tok !== sceneToken) return;
    await sleep(400);
    el.cutchoices.hidden = false; el.cutchoices.innerHTML = '';
    scene.choices.forEach((ch) => el.cutchoices.appendChild(makeBtn(fill(ch.label), () => choose(ch), 'pbtn pbtn-go')));
  }

  /* keyboard */
  document.addEventListener('keydown', (e) => {
    if (e.target === el.nameInput) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) { const btns = el.dialog.hidden ? [] : el.choices.querySelectorAll('button'); if (btns[n - 1]) btns[n - 1].click(); }
  });

  /* ---------- render loop ---------- */
  const LID = [[0, 0], [1.0, 0], [2.0, 0.28], [2.35, 0.03], [3.6, 0.62], [3.85, 0.14], [5.3, 1.0], [6.6, 1.95]];
  const BLUR = [[0, 6], [2.0, 5], [3.6, 2.6], [5.3, 1], [6.6, 0]];
  const lerpK = (keys, t) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; const k = (t - a) / (b - a); const e = k * k * (3 - 2 * k); return va + (vb - va) * e; } return keys[keys.length - 1][1]; };
  function frame(now) {
    const t = Math.max(0, (now - t0) / 1000);
    ctx.clearRect(0, 0, 320, 180);
    if (art) { try { art.draw(ctx, t, artOpts); } catch (err) { console.error(err); art = null; } }
    if (portraitFn && !el.dialog.hidden) portraitFn(pctx, t);
    if (cutFx) {
      const ct = Math.max(0, (now - cutFx.start) / 1000);
      const o = lerpK(LID, ct); if (o < 1.9) ArtUtil.eyelids(ctx, o);
      const b = lerpK(BLUR, ct); cv.style.filter = b > 0.05 ? `blur(${(b * cv.clientWidth / 1280).toFixed(2)}px)` : '';
    }
    requestAnimationFrame(frame);
  }

  /* ---------- boot ---------- */
  State.load();
  window.Game = { goTo, state: State, get scene() { return current; } };
  const boot = () => { requestAnimationFrame(frame); goTo(window.START_SCENE, { instant: true }); };
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('16px PS2P'), document.fonts.load('16px Pixelify')]).then(boot, boot); else boot();
})();
