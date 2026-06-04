/**
 * 《卅一景》存档系统
 * 
 * 使用 localStorage 持久化游戏进度，包括章节、场景、物品和进度标记。
 * 存档键名：sanyijing-save
 */

const SAVE_KEY = 'sanyijing-save';

export class SaveSystem {
  constructor(engine) {
    /** @type {import('./game-engine.js').GameEngine} */
    this.engine = engine;
  }

  /**
   * 保存游戏状态
   * @param {object} data - 要保存的数据，通常包括 chapter, scene, inventory, progress 等
   */
  save(data) {
    try {
      const saveData = {
        ...data,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      this.engine.emit('game-saved', saveData);
    } catch (err) {
      console.error('[SaveSystem] 存档失败:', err);
    }
  }

  /**
   * 读取存档
   * @returns {object|null} 存档数据，若无存档则返回 null
   */
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      this.engine.emit('game-loaded', data);
      return data;
    } catch (err) {
      console.error('[SaveSystem] 读档失败:', err);
      return null;
    }
  }

  /**
   * 清除存档
   */
  clear() {
    localStorage.removeItem(SAVE_KEY);
    this.engine.emit('save-cleared');
  }

  /**
   * 是否存在存档
   * @returns {boolean}
   */
  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * 自动保存 — 从引擎当前状态生成存档快照
   */
  autoSave() {
    const state = {
      chapter: this.engine.currentChapter,
      scene: this.engine.currentScene,
      world: this.engine.currentWorld,
      inventory: this.engine.inventory.getItems(),
      progress: { ...this.engine.gameProgress },
    };
    this.save(state);
  }
}
