/* Life — persistent game state (localStorage), versioned. */
(function () {
  const KEY = 'life.save.v2';
  const OLD_KEYS = ['life.save.v1'];
  const VERSION = 2;
  const START_KARMA = 10;
  const fresh = () => ({
    version: VERSION, name: '',
    inventory: [],          // [{ id, from }]
    karma: START_KARMA,     // hidden
    rel: {},                // hidden, per character, default 0
    flags: {},              // free-form flags
    visited: [],            // scene ids ever entered
    visits: {},             // scene id -> count
    choices: [],            // ["from => to", ...]
    currentScene: null, updated: 0,
  });

  // v1 -> v2: keep name + position, turn the single trinket into an inventory item.
  function migrate(old) {
    const d = fresh();
    if (!old || typeof old !== 'object') return d;
    if (old.version === VERSION) return Object.assign(d, old);
    d.name = typeof old.name === 'string' ? old.name : '';
    d.currentScene = typeof old.currentScene === 'string' ? old.currentScene : null;
    d.visited = Array.isArray(old.visited) ? old.visited.slice() : [];
    d.flags = old.flags && typeof old.flags === 'object' ? old.flags : {};
    if (old.trinket) d.inventory.push({ id: old.trinket, from: 'Found in: your room' });
    d.migratedFrom = old.version || 1;
    return d;
  }

  const State = {
    data: fresh(), KEY, VERSION, START_KARMA,
    load() {
      let raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) {}
      try {
        if (raw) this.data = migrate(JSON.parse(raw));
        else {
          for (const k of OLD_KEYS) {
            let o = null; try { o = localStorage.getItem(k); } catch (e) {}
            if (o) { this.data = migrate(JSON.parse(o)); this.save(); try { localStorage.removeItem(k); } catch (e) {} break; }
          }
        }
      } catch (e) { this.data = fresh(); }
      return this.data;
    },
    save() { this.data.updated = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} },
    reset() { this.data = fresh(); try { localStorage.removeItem(KEY); OLD_KEYS.forEach((k) => localStorage.removeItem(k)); } catch (e) {} },
    hasSave() { return !!(this.data.name && this.data.currentScene); },
    hasItem(id) { return this.data.inventory.some((it) => it.id === id); },
    addItem(id, from) { if (this.hasItem(id)) return false; this.data.inventory.push({ id, from: from || null }); return true; },
    removeItem(id) { const i = this.data.inventory.findIndex((it) => it.id === id); if (i >= 0) this.data.inventory.splice(i, 1); return i >= 0; },
    getRel(c) { return this.data.rel[c] || 0; },
    fresh, migrate,
  };
  window.State = State;
})();
