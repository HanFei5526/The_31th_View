/**
 * 《卅一景》游戏引擎
 *
 * 中央控制器，持有并协调所有子系统：
 *   - SceneManager  — 场景注册与切换
 *   - Inventory     — 物品收集与管理
 *   - HintSystem    — 渐进式提示
 *   - DialogueSystem — 对话与选项
 *   - SaveSystem    — 存档持久化
 *
 * 同时提供事件总线（on / emit）供各子系统和场景间通信。
 *
 * 使用方式:
 *   import gameEngine from './core/game-engine.js';
 *   gameEngine.init(document.getElementById('app'));
 *   gameEngine.startGame();
 */

import { SceneManager } from './scene-manager.js';
import { Inventory } from './inventory.js';
import { HintSystem } from './hint-system.js';
import { DialogueSystem } from './dialogue.js';
import { SaveSystem } from './save-system.js';

export class GameEngine {
  constructor() {
    /* ---- 游戏状态 ---- */

    /** 当前章节（0 = 序章，1-3 = 正式章节） */
    this.currentChapter = 0;
    /** 当前场景名称 */
    this.currentScene = null;
    /** 当前世界 'real' | 'paint' */
    this.currentWorld = 'real';
    /** 通用进度标记，场景可自由读写 */
    this.gameProgress = {};

    /* ---- 事件系统 ---- */

    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();

    /* ---- 子系统（传入 this 作为引擎引用） ---- */

    /** @type {SceneManager} */
    this.sceneManager = new SceneManager(this);
    /** @type {Inventory} */
    this.inventory = new Inventory(this);
    /** @type {HintSystem} */
    this.hintSystem = new HintSystem(this);
    /** @type {DialogueSystem} */
    this.dialogueSystem = new DialogueSystem(this);
    /** @type {SaveSystem} */
    this.saveSystem = new SaveSystem(this);

    /* ---- DOM ---- */

    /** #app 根元素 */
    this._appElement = null;
    /** 过渡动画遮罩 */
    this._transitionEl = null;
  }

  /* ==========================
     初始化
     ========================== */

  /**
   * 初始化引擎，绑定 DOM 容器并准备各子系统
   * @param {HTMLElement} appElement - 通常是 #app
   */
  init(appElement) {
    this._appElement = appElement;

    // 初始化场景容器
    this.sceneManager.init(appElement);

    // 创建过渡动画遮罩
    this._createTransitionOverlay();

    // 设置初始世界主题
    this._applyWorldTheme();

    console.log('[GameEngine] 引擎初始化完成');
  }

  /**
   * 开始游戏：尝试加载存档，否则从序章开始
   */
  startGame() {
    const save = this.saveSystem.load();

    if (save) {
      // 恢复存档状态
      this.currentChapter = save.chapter ?? 0;
      this.currentScene = save.scene ?? null;
      this.currentWorld = save.world ?? 'real';
      this.gameProgress = save.progress ?? {};
      if (save.inventory) {
        this.inventory.restore(save.inventory);
      }
      console.log(`[GameEngine] 从存档恢复: 章节${this.currentChapter}, 场景${this.currentScene}`);
      // 切换到存档场景
      if (this.currentScene) {
        this.switchScene(this.currentScene);
      }
    } else {
      console.log('[GameEngine] 无存档，从头开始');
      this.emit('game-start');
    }
  }

  /* ==========================
     事件系统
     ========================== */

  /**
   * 监听事件
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} 取消监听的函数
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    // 返回取消监听函数
    return () => {
      this._listeners.get(event)?.delete(callback);
    };
  }

  /**
   * 发出事件
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    const callbacks = this._listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[GameEngine] 事件处理出错 (${event}):`, err);
        }
      }
    }
  }

  /* ==========================
     场景切换
     ========================== */

  /**
   * 切换场景（委托给 SceneManager）
   * @param {string} sceneName
   */
  switchScene(sceneName, skipTransition = false) {
    // 切换前清除当前谜题提示
    this.hintSystem.clearAll();
    return this.sceneManager.switchTo(sceneName, skipTransition);
  }

  /* ==========================
     世界切换 (real ↔ paint)
     ========================== */

  /**
   * 切换世界（现实 ↔ 画中）
   * @param {'real'|'paint'} world
   */
  async switchWorld(world) {
    if (world === this.currentWorld) return;

    this.currentWorld = world;
    this._applyWorldTheme();
    this.emit('world-changed', { world });
  }

  /* ==========================
     便捷 API
     ========================== */

  /**
   * 收集物品
   * @param {object} item
   */
  collectItem(item) {
    this.inventory.addItem(item);
  }

  /**
   * 播放对话序列
   * @param {Array} sequence
   * @returns {Promise}
   */
  showDialogue(sequence) {
    return this.dialogueSystem.playSequence(sequence);
  }

  /**
   * 保存当前进度
   */
  saveProgress() {
    this.saveSystem.autoSave();
  }

  /* ==========================
     过渡动画
     ========================== */

  /**
   * 播放场景切换过渡动画 — 柔和墨韵淡入淡出
   * @returns {Promise<void>}
   */
  playTransition() {
    return new Promise((resolve) => {
      const el = this._transitionEl;
      if (!el) {
        resolve();
        return;
      }

      el.classList.add('active');
      el.style.display = 'block';
      el.style.opacity = '0';
      el.style.filter = 'blur(8px)';
      el.style.background = 'radial-gradient(ellipse at center, #c8b898 0%, #e8e0d0 100%)';

      // 柔缓淡入（带模糊→清晰）
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.7s ease, filter 0.9s ease';
        el.style.opacity = '1';
        el.style.filter = 'blur(0)';
      });

      // 保持，然后淡出
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.filter = 'blur(12px)';
        setTimeout(() => {
          el.style.display = 'none';
          el.classList.remove('active');
          el.style.transition = '';
          el.style.filter = '';
          el.style.background = '';
          resolve();
        }, 700);
      }, 500);
    });
  }

  /* ==========================
     内部方法
     ========================== */

  /**
   * 创建过渡动画遮罩层
   * @private
   */
  _createTransitionOverlay() {
    const el = document.createElement('div');
    el.className = 'transition-overlay';
    el.style.display = 'none';
    // 根据当前世界设置过渡颜色
    el.style.background = 'var(--real-bg-deep)';
    this._appElement.appendChild(el);
    this._transitionEl = el;
  }

  /**
   * 将世界主题 CSS 类应用到 #app
   * @private
   */
  _applyWorldTheme() {
    if (!this._appElement) return;
    this._appElement.classList.remove('real-world', 'paint-world');
    this._appElement.classList.add(
      this.currentWorld === 'paint' ? 'paint-world' : 'real-world'
    );
    // 同步过渡遮罩背景色
    if (this._transitionEl) {
      this._transitionEl.style.background =
        this.currentWorld === 'paint'
          ? 'var(--paint-bg-deep)'
          : 'var(--real-bg-deep)';
    }
  }
}

/* ---- 单例导出 ---- */
const gameEngine = new GameEngine();
export default gameEngine;
