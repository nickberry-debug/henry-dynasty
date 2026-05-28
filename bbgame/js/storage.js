// localStorage persistence
const STORAGE_KEY = "diamond_dynasty_save_v1";

const Storage = {
  save(state) {
    try {
      const data = {
        version: 1,
        savedAt: Date.now(),
        league: state.league
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn("Save failed", e);
      return false;
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Load failed", e);
      return null;
    }
  },

  clear() { localStorage.removeItem(STORAGE_KEY); },

  exportJSON(state) {
    return JSON.stringify({ version: 1, league: state.league }, null, 2);
  },

  importJSON(text) {
    return JSON.parse(text);
  }
};
