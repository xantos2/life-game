/* Life — persistent game state (localStorage). */
(function () {
  const KEY = 'life.save.v1';
  const fresh = () => ({ name: '', trinket: null, flags: {}, currentScene: null, visited: [], updated: 0 });
  const State = {
    data: fresh(),
    load() {
      try { const raw = localStorage.getItem(KEY); if (raw) this.data = Object.assign(fresh(), JSON.parse(raw)); }
      catch (e) { this.data = fresh(); }
      return this.data;
    },
    save() {
      this.data.updated = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* private mode etc. */ }
    },
    reset() { this.data = fresh(); try { localStorage.removeItem(KEY); } catch (e) {} },
    hasSave() { return !!(this.data.name && this.data.currentScene); },
    setFlag(k, v) { this.data.flags[k] = v; this.save(); },
    getFlag(k) { return this.data.flags[k]; },
    KEY,
  };
  window.State = State;
})();
