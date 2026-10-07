// LocalStorage Save & Checkpoint System
const SAVE_KEY = 'quycau_savegame';

export class SaveSystem {
  static save(data) {
    try {
      const existing = SaveSystem.load() || {};
      const merged = { ...existing, ...data, timestamp: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(merged));
      return true;
    } catch (e) {
      console.warn('Failed to save game:', e);
      return false;
    }
  }

  static saveCheckpoint(checkpointId, areaId, chapterIndex) {
    SaveSystem.save({
      currentCheckpoint: checkpointId,
      currentArea: areaId,
      currentChapter: chapterIndex
    });
  }

  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to load save:', e);
      return null;
    }
  }

  static hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static clear() {
    localStorage.removeItem(SAVE_KEY);
  }
}
