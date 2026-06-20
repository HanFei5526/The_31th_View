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
import { Inventory, ITEM_TEMPLATES } from './inventory.js';
import { HintSystem } from './hint-system.js';
import { DiscussionGateManager } from './discussion-gate.js';
import { GatePanel } from '../components/gate-panel.js';
import { DialogueSystem } from './dialogue.js';
import { SaveSystem } from './save-system.js';
import { AIService } from './ai-service.js';

const PROLOGUE_NOTEBOOK_ITEM = {
  id: 'notebook',
  name: '修复笔记本',
  description: '导师给你的笔记本，封面写着"修复记录——三十一景图"。扉页夹着一张便签，是周老师的字："修复古画的第一课，不是把缺的补上，是理解它为什么缺。"',
  icon: '📓',
};

const PROLOGUE_CLUE_IDS = ['clue_margin', 'clue_text', 'clue_line'];

const DEPRECATED_NOTEBOOK_RECORDS = [
  {
    type: 'annotation',
    text: '获得了物件 [修复笔记本]',
  },
];

const PROLOGUE_CARRYOVER_RECORDS = [
  {
    type: 'clue',
    text: '[线索] 装裱接缝残角 — 旧题签被刻意裁去，只留被覆盖的一角',
  },
  {
    type: 'clue',
    text: '[线索] "……所见"残字 — 装裱层下的陌生笔迹旁注',
  },
  {
    type: 'clue',
    text: '[线索] 底层细线 — 画面下方有一条不属于画面内容的极淡细线',
  },
  {
    type: 'clue',
    text: '[结论] 三处痕迹指向同一事实：有人在重新装裱时系统性地遮蔽了这幅画的来源信息',
  },
];

export class GameEngine {
  constructor() {
    /* ---- 游戏状态 ---- */

    /** 当前章节（0 = 序章，1-3 = 正式章节） */
    this.currentChapter = 0;
    /** 当前场景名称 */
    this.currentScene = null;
    /** 当前世界 'real' | 'paint' */
    this.currentWorld = 'real';
    /** 当前正式存档点 */
    this.currentCheckpointId = null;
    /** 通用进度标记，场景可自由读写 */
    this.gameProgress = {};
    /** 修复笔记本记录：跨章节累积 */
    this.notebookRecords = [];
    /** 修复笔记本对话：按章节隔离 */
    this.notebookChatsByChapter = {};

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
    /** @type {AIService} */
    this.aiService = new AIService(this);
    this.discussionManager = new DiscussionGateManager(this);

    /* ---- DOM ---- */

    /** #app 根元素 */
    this._appElement = null;

    /* ---- UI 组件 ---- */
    this.gatePanel = new GatePanel(this);

    /* ---- 状态 ---- */
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

    // 探测 AI 后端（API Key 留在服务端，前端不持有密钥）
    this.aiService.configure();

    console.log('[GameEngine] 引擎初始化完成');
  }

  /**
   * 开始游戏：尝试加载存档，否则从序章开始
   */
  startGame() {
    const save = this.saveSystem.load();

    if (save) {
      this.restoreFromSave(save);
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

  /**
   * 从存档快照恢复完整运行时状态。
   * @param {object} save
   */
  restoreFromSave(save = {}) {
    this.currentChapter = save.chapter ?? 0;
    this.currentScene = save.scene ?? null;
    this.currentWorld = save.world ?? 'real';
    this.currentCheckpointId = save.checkpointId ?? save.progress?.currentCheckpointId ?? null;
    this.gameProgress = save.progress ?? {};
    if (this.currentCheckpointId) {
      this.gameProgress.currentCheckpointId = this.currentCheckpointId;
    }
    this.notebookRecords = Array.isArray(save.notebookRecords) ? save.notebookRecords : [];
    this.notebookChatsByChapter = save.notebookChatsByChapter ?? {};

    if (save.inventory) {
      this.inventory.restore(save.inventory);
    } else {
      this.inventory.restore([]);
    }

    this._restoreDerivedInventoryFromProgress();
    this.ensureCarryoverForChapter(this.currentChapter, { persist: false });
  }

  /**
   * 兼容旧存档：有些进度只保存了标记，没有保存物件对象。
   * @private
   */
  _restoreDerivedInventoryFromProgress() {
    const progress = this.gameProgress || {};
    if (progress.hasNotebook && !this.inventory.hasItem('notebook')) {
      this.inventory.addItem(PROLOGUE_NOTEBOOK_ITEM, { silent: true });
    }
    if (progress.hasHairpin && !this.inventory.hasItem('hairpin')) {
      this.inventory.addItem(ITEM_TEMPLATES.hairpin, { silent: true });
    }
    if (progress.hasInkstone && !this.inventory.hasItem('inkstone')) {
      this.inventory.addItem(ITEM_TEMPLATES.inkstone, { silent: true });
    }
    if (progress.hasRubbing && !this.inventory.hasItem('rubbing')) {
      this.inventory.addItem(ITEM_TEMPLATES.rubbing, { silent: true });
    }
    if (progress.hasLetter && !this.inventory.hasItem('letter')) {
      this.inventory.addItem(ITEM_TEMPLATES.letter, { silent: true });
    }
  }

  /**
   * 后续章节进入时，补齐前序章节已经应当拥有的基础内容。
   * 记录页跨章累积；对话记录仍由 NotebookFloating 按章节隔离。
   * @param {number} chapter
   * @param {{persist?: boolean}} options
   * @returns {boolean} 是否发生补齐
   */
  ensureCarryoverForChapter(chapter, options = {}) {
    const shouldPersist = options.persist !== false;
    if (chapter < 1) return false;

    let changed = false;
    const progress = this.gameProgress || {};
    this.gameProgress = progress;

    if (!progress.hasNotebook) {
      progress.hasNotebook = true;
      changed = true;
    }

    if (!Array.isArray(progress.cluesFound)) {
      progress.cluesFound = [];
      changed = true;
    }
    PROLOGUE_CLUE_IDS.forEach((clueId) => {
      if (!progress.cluesFound.includes(clueId)) {
        progress.cluesFound.push(clueId);
        changed = true;
      }
    });

    if (!progress.synthesisPassed) {
      progress.synthesisPassed = true;
      changed = true;
    }

    if (!progress.prologueComplete) {
      progress.prologueComplete = true;
      changed = true;
    }
    if (!progress.prologue_completed) {
      progress.prologue_completed = true;
      changed = true;
    }

    if (!this.inventory.hasItem('notebook')) {
      this.inventory.addItem(PROLOGUE_NOTEBOOK_ITEM, { silent: true });
      changed = true;
    }

    if (this._removeNotebookRecords(DEPRECATED_NOTEBOOK_RECORDS)) {
      changed = true;
    }

    if (this._prioritizeNotebookRecords(PROLOGUE_CARRYOVER_RECORDS)) {
      changed = true;
    }

    if (changed && shouldPersist && this.currentCheckpointId) {
      this.saveCheckpoint(this.currentCheckpointId);
    }
    return changed;
  }

  _removeNotebookRecords(records) {
    if (!Array.isArray(this.notebookRecords)) this.notebookRecords = [];

    const shouldRemove = (existing) => records.some((record) => (
      existing.type === record.type && existing.text === record.text
    ));
    const nextRecords = this.notebookRecords.filter((record) => !shouldRemove(record));
    const changed = nextRecords.length !== this.notebookRecords.length;
    if (changed) {
      this.notebookRecords = nextRecords;
    }
    return changed;
  }

  _prioritizeNotebookRecords(records) {
    if (!Array.isArray(this.notebookRecords)) this.notebookRecords = [];

    const sameRecord = (a, b) => a.type === b.type && a.text === b.text;
    const prioritized = records.map((record) => (
      this.notebookRecords.find((existing) => sameRecord(existing, record)) || record
    ));
    const rest = this.notebookRecords.filter((existing) => (
      !records.some((record) => sameRecord(existing, record))
    ));
    const nextRecords = [...prioritized, ...rest];

    const changed = nextRecords.length !== this.notebookRecords.length
      || nextRecords.some((record, index) => this.notebookRecords[index] !== record);
    if (changed) {
      this.notebookRecords = nextRecords;
    }
    return changed;
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

    // 播放世界切换过渡
    await this._playWorldTransition(world);

    this.currentWorld = world;
    this._applyWorldTheme();
    this.emit('world-changed', { world });
  }

  /**
   * 世界切换视觉过渡
   * @private
   */
  _playWorldTransition(targetWorld) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'world-transition-overlay';
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 250;
        background: var(--wash-paper-gradient);
        opacity: 0; pointer-events: none;
        transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
      `;
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
            overlay.remove();
            resolve();
          }, 1200);
        }, 600);
      });
    });
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
   * 保存当前进度（带视觉反馈）
   */
  saveProgress() {
    this.saveSystem.autoSave();
    this._showSaveIndicator();
  }

  /**
   * 保存正式大场景入口 checkpoint。
   * @param {string} checkpointId
   * @param {object} overrides
   */
  saveCheckpoint(checkpointId, overrides = {}) {
    if (!checkpointId) return;
    this.currentCheckpointId = checkpointId;
    this.gameProgress = {
      ...(this.gameProgress || {}),
      currentCheckpointId: checkpointId,
    };
    this.saveSystem.save(this.saveSystem.createSnapshot({
      ...overrides,
      checkpointId,
      progress: {
        ...(overrides.progress || {}),
        currentCheckpointId: checkpointId,
      },
    }));
    this._showSaveIndicator();
  }

  /**
   * 显示保存状态指示器
   * @private
   */
  _showSaveIndicator() {
    let indicator = document.getElementById('save-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'save-indicator';
      indicator.className = 'save-indicator';
      indicator.innerHTML = `
        <span class="save-indicator-icon">◉</span>
        <span class="save-indicator-text">已保存</span>
      `;
      document.body.appendChild(indicator);
    }
    indicator.classList.add('save-indicator--visible');
    setTimeout(() => {
      indicator.classList.remove('save-indicator--visible');
    }, 2000);
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

      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      let timer1, timer2, timer3;

      const finishFast = () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        document.removeEventListener('keydown', onKey);

        el.style.display = 'none';
        el.style.opacity = '0';
        el.classList.remove('active');
        el.style.transition = '';
        el.style.filter = '';
        el.style.background = '';
        
        safeResolve();
      };

      const onKey = (e) => {
        if (e.key === ' ' || e.key?.toLowerCase() === 'z' || e.code === 'KeyZ') {
          const activeEl = document.activeElement;
          const isInput = activeEl && (
            activeEl.tagName === 'INPUT' || 
            activeEl.tagName === 'TEXTAREA' || 
            activeEl.tagName === 'SELECT' || 
            activeEl.isContentEditable
          );
          if (!isInput) {
            e.preventDefault();
            finishFast();
          }
        }
      };

      document.addEventListener('keydown', onKey);

      el.classList.add('active');
      el.style.display = 'block';
      el.style.opacity = '0';
      el.style.filter = 'blur(8px)';
      el.style.background = [
        'var(--wash-paper-gradient)',
        'var(--wash-paper-radial)'
      ].join(', ');

      // 柔缓淡入遮罩
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.6s ease, filter 0.8s ease';
        el.style.opacity = '1';
        el.style.filter = 'blur(0)';
      });

      // 当遮罩完全不透明时，解析 Promise 让底层引擎切换场景 DOM
      timer1 = setTimeout(() => {
        safeResolve();

        // 稍微停留缓冲，然后开始淡出遮罩，露出新场景
        timer2 = setTimeout(() => {
          el.style.opacity = '0';
          el.style.filter = 'blur(12px)';
          timer3 = setTimeout(() => {
            el.style.display = 'none';
            el.classList.remove('active');
            el.style.transition = '';
            el.style.filter = '';
            el.style.background = '';
            document.removeEventListener('keydown', onKey);
          }, 800); // 等待淡出结束
        }, 100);
      }, 600);
    });
  }

  /**
   * 播放返回主页专用过渡动画：更白、更轻的纸色遮罩。
   * @returns {Promise<void>}
   */
  playMenuReturnTransition() {
    return new Promise((resolve) => {
      const el = this._transitionEl;
      if (!el) {
        resolve();
        return;
      }

      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      let timer1, timer2, timer3;
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const fadeInMs = prefersReducedMotion ? 80 : 260;
      const fadeOutMs = prefersReducedMotion ? 120 : 560;

      const finishFast = () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        document.removeEventListener('keydown', onKey);

        el.style.display = 'none';
        el.style.opacity = '0';
        el.classList.remove('active');
        el.style.transition = '';
        el.style.filter = '';
        el.style.background = '';

        safeResolve();
      };

      const onKey = (e) => {
        if (e.key === ' ' || e.key?.toLowerCase() === 'z' || e.code === 'KeyZ') {
          const activeEl = document.activeElement;
          const isInput = activeEl && (
            activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT' ||
            activeEl.isContentEditable
          );
          if (!isInput) {
            e.preventDefault();
            finishFast();
          }
        }
      };

      document.addEventListener('keydown', onKey);

      el.classList.add('active');
      el.style.display = 'block';
      el.style.opacity = '0';
      el.style.filter = prefersReducedMotion ? 'none' : 'blur(4px)';
      el.style.background = [
        'var(--wash-paper-gradient)',
        'var(--wash-paper-radial)'
      ].join(', ');

      requestAnimationFrame(() => {
        el.style.transition = `opacity ${fadeInMs}ms ease, filter ${fadeInMs}ms ease`;
        el.style.opacity = '1';
        el.style.filter = 'none';
      });

      timer1 = setTimeout(() => {
        safeResolve();

        timer2 = setTimeout(() => {
          el.style.transition = `opacity ${fadeOutMs}ms ease, filter ${fadeOutMs}ms ease`;
          el.style.opacity = '0';
          el.style.filter = prefersReducedMotion ? 'none' : 'blur(6px)';
          timer3 = setTimeout(() => {
            el.style.display = 'none';
            el.classList.remove('active');
            el.style.transition = '';
            el.style.filter = '';
            el.style.background = '';
            document.removeEventListener('keydown', onKey);
          }, fadeOutMs);
        }, prefersReducedMotion ? 20 : 160);
      }, fadeInMs);
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
    el.style.background = 'var(--wash-paper-gradient)';
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
    // 同步为浅纸色过渡遮罩，避免切换时出现黑屏或浓黄闪屏
    if (this._transitionEl) {
      this._transitionEl.style.background = 'var(--wash-paper-gradient)';
    }
  }

  /**
   * 获取 AI 上下文快照（供 prompt 拼接）
   * @returns {object}
   */
  getAIContext() {
    return {
      chapter: this.currentChapter,
      world: this.currentWorld,
      items: this.inventory.getItems(),
      progress: { ...this.gameProgress },
      annotations: this.notebookPanel ? this.notebookPanel.getAnnotations() : [],
    };
  }
}

/* ---- 单例导出 ---- */
const gameEngine = new GameEngine();
export default gameEngine;
