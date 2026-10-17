/* =====================================================================
   Life — hidden stats logic: karma / relationship tiers, conditions,
   and "max reachable so far" computed from the scene graph.
   ===================================================================== */
(function () {
  const TIERS = ['catastrophic', 'bad', 'neutral', 'good', 'very good'];

  /* ---- TUNE HERE ----------------------------------------------------
     karma: value v compared with M = max karma reachable at this scene.
       v < 0                 -> catastrophic
       v < bad * M           -> bad
       v < neutral * M       -> neutral
       v < good * M          -> good
       otherwise             -> very good
     relationship (starts at 0): compared with max (M) and min (m) reachable.
       v < 0 : v <= catastrophic * m -> catastrophic, else bad
       v = 0 or v < neutral * M      -> neutral
       v < good * M                  -> good, otherwise very good
     ------------------------------------------------------------------ */
  const TIER_CONFIG = {
    karma: { bad: 0.30, neutral: 0.60, good: 0.85 },
    relationship: { catastrophic: 0.5, neutral: 0.30, good: 0.85 },
  };

  function karmaTier(v, M) {
    const c = TIER_CONFIG.karma;
    if (v < 0) return 'catastrophic';
    if (M <= 0) return v > 0 ? 'very good' : 'neutral';
    const r = v / M;
    return r < c.bad ? 'bad' : r < c.neutral ? 'neutral' : r < c.good ? 'good' : 'very good';
  }
  function relTier(v, M, m) {
    const c = TIER_CONFIG.relationship;
    if (v < 0) return (m < 0 && v <= c.catastrophic * m) ? 'catastrophic' : 'bad';
    if (v === 0 || M <= 0) return 'neutral';
    const r = v / M;
    return r < c.neutral ? 'neutral' : r < c.good ? 'good' : 'very good';
  }

  /* ---- graph: deltas of every effect list ---- */
  function deltas(effects) {
    const d = { karma: 0, rel: {} };
    for (const e of effects || []) {
      if (e.type === 'karma') d.karma += e.delta;
      if (e.type === 'rel') d.rel[e.char] = (d.rel[e.char] || 0) + e.delta;
    }
    return d;
  }
  function edges(scene) {
    const out = [];
    if (scene.next) out.push({ to: scene.next });
    for (const ch of (scene.choices || [])) if (ch.to) out.push({ to: ch.to, eff: ch.effects });
    for (const ch of (scene.choices || [])) if (ch.failTo) out.push({ to: ch.failTo, eff: ch.effects });
    for (const b of (scene.branches || [])) out.push({ to: b.to, eff: b.effects });
    return out;
  }
  // longest / shortest path relaxation (Bellman-Ford style, capped -> safe with cycles)
  function reach(scenes, start, startVal, pick) {
    const ids = Object.keys(scenes);
    const best = {}, worst = {};
    const enterGain = (id) => pick(deltas(scenes[id] && scenes[id].onEnter));
    best[start] = startVal + enterGain(start); worst[start] = best[start];
    for (let iter = 0; iter < ids.length + 1; iter++) {
      let changed = false;
      for (const id of ids) {
        if (best[id] === undefined) continue;
        for (const e of edges(scenes[id])) {
          if (!scenes[e.to]) continue;
          const g = pick(deltas(e.eff)) + enterGain(e.to);
          const nb = best[id] + g, nw = worst[id] + g;
          if (best[e.to] === undefined || nb > best[e.to]) { best[e.to] = nb; changed = true; }
          if (worst[e.to] === undefined || nw < worst[e.to]) { worst[e.to] = nw; changed = true; }
        }
      }
      if (!changed) break;
    }
    return { best, worst };
  }

  let cache = null;
  function build() {
    const S = window.SCENES, start = window.STORY_START || 'Start'; // the menu's Start/Restart are actions, so the graph begins at the name scene
    const chars = new Set();
    for (const id in S) {
      const all = [].concat(S[id].onEnter || [], ...(S[id].choices || []).map((c) => c.effects || []), ...(S[id].branches || []).map((b) => b.effects || []));
      all.forEach((e) => e.type === 'rel' && chars.add(e.char));
    }
    const karma = reach(S, start, window.State.START_KARMA, (d) => d.karma);
    const rel = {};
    chars.forEach((c) => (rel[c] = reach(S, start, 0, (d) => d.rel[c] || 0)));
    cache = { karma, rel, chars: [...chars] };
    return cache;
  }
  const G = () => cache || build();

  function maxKarmaAt(id) { const b = G().karma.best[id]; return b === undefined ? window.State.START_KARMA : b; }
  function relRangeAt(c, id) { const r = G().rel[c]; if (!r) return { max: 0, min: 0 }; return { max: r.best[id] ?? 0, min: r.worst[id] ?? 0 }; }
  function currentScene() { return window.State.data.currentScene || window.START_SCENE; }
  function getKarmaTier(id = currentScene()) { return karmaTier(window.State.data.karma, maxKarmaAt(id)); }
  function getRelTier(c, id = currentScene()) { const r = relRangeAt(c, id); return relTier(window.State.getRel(c), r.max, r.min); }
  const idx = (t) => TIERS.indexOf(t);

  /* ---- conditions ----
     { visited:'Scene' } { chose:'From => To' } { hasItem:'pebble' } { flag:'k' } { flag:'k', eq:v }
     { karma:['good','very good'] } { karmaAtLeast:'good' } { karmaAtMost:'bad' }
     { rel:'Osvaldo', tier:['good'] } { relAtLeast:{ Osvaldo:'good' } } { relAtMost:{ Samara:'bad' } }
     { not:cond } { all:[...] } { any:[...] }                                              */
  function test(c) {
    if (!c) return true;
    const D = window.State.data;
    if (Array.isArray(c)) return c.every(test);
    if (c.not) return !test(c.not);
    if (c.all) return c.all.every(test);
    if (c.any) return c.any.some(test);
    let ok = true;
    if (c.visited !== undefined) ok = ok && D.visited.includes(c.visited);
    if (c.chose !== undefined) ok = ok && D.choices.includes(c.chose);
    if (c.hasItem !== undefined) ok = ok && window.State.hasItem(c.hasItem);
    if (c.flag !== undefined) ok = ok && ('eq' in c ? D.flags[c.flag] === c.eq : !!D.flags[c.flag]);
    if (c.karma) ok = ok && c.karma.includes(getKarmaTier());
    if (c.karmaAtLeast) ok = ok && idx(getKarmaTier()) >= idx(c.karmaAtLeast);
    if (c.karmaAtMost) ok = ok && idx(getKarmaTier()) <= idx(c.karmaAtMost);
    if (c.rel) ok = ok && (c.tier || []).includes(getRelTier(c.rel));
    if (c.relAtLeast) for (const k in c.relAtLeast) ok = ok && idx(getRelTier(k)) >= idx(c.relAtLeast[k]);
    if (c.relAtMost) for (const k in c.relAtMost) ok = ok && idx(getRelTier(k)) <= idx(c.relAtMost[k]);
    return ok;
  }

  window.Logic = { TIERS, TIER_CONFIG, karmaTier, relTier, maxKarmaAt, relRangeAt, getKarmaTier, getRelTier, test, build, graph: G };
})();
