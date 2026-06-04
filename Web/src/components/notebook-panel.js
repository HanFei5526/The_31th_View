/**
 * 《卅一景》AI 笔记本面板
 *
 * 方案 B：AI 驱动的修复笔记本。
 *
 * 功能：
 *   1. 显示 AI 自动生成的批注（时间线）
 *   2. 画中世界时，允许玩家在笔记本中输入问题进行查阅
 *   3. 监听游戏事件，自动触发批注生成
 */

export class NotebookPanel {
  constructor(engine) {
    /** @type {import('../core/game-engine.js').GameEngine} */
    this.engine = engine;

    /** 入口按钮 */
    this._toggleEl = null;
    /** 面板遮罩 */
    this._overlayEl = null;
    /** 面板容器 */
    this._panelEl = null;
    /** 批注列表容器 */
    this._annotationsEl = null;
    /** 查阅输入区（仅画中世界可见） */
    this._queryAreaEl = null;
    /** 查阅结果展示 */
    this._queryResultEl = null;
    /** 输入框 */
    this._inputEl = null;

    /** 是否展开 */
    this._isOpen = false;
    /** 是否正在查阅 */
    this._isQuerying = false;
    /** 是否正在生成批注 */
    this._isAnnotating = false;

    /** 所有批注记录 */
    this._annotations = [];

    /** 批注去重：防止短时间内对同一事件重复生成 */
    this._recentEventKeys = new Set();
  }

  /* ==========================
     初始化
     ========================== */

  init() {
    this._createDOM();
    this._bindEvents();
    this._updateQueryVisibility();
  }

  /** 获取所有批注（供 AI 上下文使用） */
  getAnnotations() {
    return [...this._annotations];
  }

  /* ==========================
     DOM 构建
     ========================== */

  /** @private */
  _createDOM() {
    // ---- 入口按钮 ----
    const toggle = document.createElement('button');
    toggle.className = 'notebook-toggle';
    toggle.id = 'notebook-toggle-btn';
    toggle.innerHTML = `<span class="notebook-toggle-icon">📓</span>`;
    toggle.title = '修复笔记本';
    toggle.style.display = 'none'; // 默认隐藏，进入游戏场景后显示
    toggle.addEventListener('click', () => this._toggle());
    document.body.appendChild(toggle);
    this._toggleEl = toggle;

    // ---- 遮罩 ----
    const overlay = document.createElement('div');
    overlay.className = 'notebook-overlay';
    overlay.addEventListener('click', () => this._close());
    document.body.appendChild(overlay);
    this._overlayEl = overlay;

    // ---- 面板 ----
    const panel = document.createElement('div');
    panel.className = 'notebook-ai-panel';
    panel.id = 'notebook-ai-panel';
    panel.innerHTML = `
      <div class="notebook-header">
        <div class="notebook-header-title">📓 修复笔记本</div>
        <button class="notebook-close-btn" id="notebook-close-btn">✕</button>
      </div>
      <div class="notebook-annotations" id="notebook-annotations">
        <div class="notebook-empty">笔记本还是空白的……随着修复的推进，你的思考会记录在这里。</div>
      </div>
      <div class="notebook-query-area" id="notebook-query-area">
        <div class="notebook-query-divider">
          <span>📖 在笔记本中查找</span>
        </div>
        <div class="notebook-query-input-row">
          <input
            type="text"
            class="notebook-query-input"
            id="notebook-query-input"
            placeholder="想查找什么？"
            maxlength="150"
            autocomplete="off"
          />
          <button class="notebook-query-btn" id="notebook-query-btn">翻阅</button>
        </div>
        <div class="notebook-query-result" id="notebook-query-result"></div>
      </div>
    `;
    document.body.appendChild(panel);
    this._panelEl = panel;
    this._annotationsEl = panel.querySelector('#notebook-annotations');
    this._queryAreaEl = panel.querySelector('#notebook-query-area');
    this._queryResultEl = panel.querySelector('#notebook-query-result');
    this._inputEl = panel.querySelector('#notebook-query-input');

    // 关闭按钮
    panel.querySelector('#notebook-close-btn').addEventListener('click', () => this._close());

    // 翻阅按钮
    panel.querySelector('#notebook-query-btn').addEventListener('click', () => this._query());

    // 回车查阅
    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._query();
      }
    });
  }

  /* ==========================
     事件绑定
     ========================== */

  /** @private */
  _bindEvents() {
    const chapterNames = ['序章', '第一章', '第二章', '第三章', '终章'];

    // 世界切换时更新查阅区可见性
    this.engine.on('world-changed', () => this._updateQueryVisibility());

    // 场景切换时更新按钮可见性
    this.engine.on('scene-enter', (data) => {
      const inGame = data?.scene !== 'landing' && data?.scene !== 'menu';
      this._toggleEl.style.display = inGame ? 'flex' : 'none';
      if (!inGame) this._close();
      this._updateQueryVisibility();
    });

    // 物件收集 → 触发批注
    this.engine.on('item-collected', (item) => {
      const ch = chapterNames[this.engine.currentChapter] || '';
      this._tryGenerateAnnotation(
        'item-collected',
        `在${ch}中获得了物件「${item.name}」：${item.description}`,
        `item-${item.id}`
      );
    });

    // 提示显示 → 触发批注
    this.engine.on('hint-shown', (data) => {
      this._tryGenerateAnnotation(
        'hint-received',
        `收到了一条提示（第${data.level}级）：${data.text}`,
        `hint-${data.puzzleId}-${data.level}`
      );
    });

    // 与周鹤年对话结束 → 触发批注
    this.engine.on('zhou-chat-complete', (data) => {
      // 只在有实质内容时触发（避免无意义对话也生成批注）
      if (data.zhouReply && data.zhouReply.length > 10) {
        const key = `zhou-${Date.now()}`;
        this._tryGenerateAnnotation(
          'zhou-dialogue',
          `和周鹤年讨论后，他说：「${data.zhouReply}」这让我产生了一些新的想法。`,
          key
        );
      }
    });

    // AI 批注生成完成 → 添加到列表
    this.engine.on('ai-annotation-generated', (data) => {
      this._addAnnotation(data.text, data.chapter, data.eventType);
    });
  }

  /* ==========================
     交互逻辑
     ========================== */

  /** @private */
  _toggle() {
    this._isOpen ? this._close() : this._open();
  }

  /** @private */
  _open() {
    this._isOpen = true;
    this._panelEl.classList.add('open');
    this._overlayEl.classList.add('visible');
    this._updateQueryVisibility();
  }

  /** @private */
  _close() {
    this._isOpen = false;
    this._panelEl.classList.remove('open');
    this._overlayEl.classList.remove('visible');
    this._queryResultEl.innerHTML = '';
  }

  /** @private */
  _updateQueryVisibility() {
    if (!this._queryAreaEl) return;
    // 查阅功能仅画中世界可用
    const show = this.engine.currentWorld === 'paint';
    this._queryAreaEl.style.display = show ? 'block' : 'none';
  }

  /** @private */
  async _query() {
    const text = this._inputEl.value.trim();
    if (!text || this._isQuerying) return;

    this._inputEl.value = '';
    this._isQuerying = true;

    // 显示加载
    this._queryResultEl.innerHTML = `<div class="notebook-result-card loading"><span class="chat-loading-dots"><span>.</span><span>.</span><span>.</span></span> 正在翻阅……</div>`;

    try {
      const result = await this.engine.aiService.queryNotebook(text);
      this._queryResultEl.innerHTML = `<div class="notebook-result-card"><span class="notebook-result-icon">📖</span>${this._escapeHtml(result)}</div>`;
    } catch (err) {
      this._queryResultEl.innerHTML = `<div class="notebook-result-card">（页面有些模糊，暂时无法辨认……）</div>`;
      console.error('[NotebookPanel] 查阅失败:', err);
    } finally {
      this._isQuerying = false;
    }
  }

  /* ==========================
     批注系统
     ========================== */

  /**
   * 尝试生成批注（带去重）
   * @private
   * @param {string} eventType
   * @param {string} eventDetail
   * @param {string} dedupeKey - 去重键
   */
  async _tryGenerateAnnotation(eventType, eventDetail, dedupeKey) {
    // 去重
    if (this._recentEventKeys.has(dedupeKey)) return;
    this._recentEventKeys.add(dedupeKey);

    // 防止并发
    if (this._isAnnotating) return;

    // 检查 AI 是否可用
    if (!this.engine.aiService.isAvailable) {
      // 降级：使用简单的固定文案
      this._addAnnotation(this._fallbackAnnotation(eventType), this.engine.currentChapter, eventType);
      return;
    }

    this._isAnnotating = true;
    try {
      await this.engine.aiService.generateAnnotation(eventType, eventDetail);
      // 批注会通过 ai-annotation-generated 事件回调添加
    } catch (err) {
      console.error('[NotebookPanel] 批注生成失败:', err);
    } finally {
      this._isAnnotating = false;
    }
  }

  /**
   * 向笔记本添加一条批注
   * @private
   */
  _addAnnotation(text, chapter, eventType) {
    const chapterNames = ['序章', '第一章', '第二章', '第三章', '终章'];
    const annotation = {
      text,
      chapter,
      eventType,
      timestamp: Date.now(),
    };
    this._annotations.push(annotation);

    // 移除空白提示
    const emptyEl = this._annotationsEl.querySelector('.notebook-empty');
    if (emptyEl) emptyEl.remove();

    // 添加 DOM
    const el = document.createElement('div');
    el.className = 'notebook-annotation-item';
    el.innerHTML = `
      <div class="notebook-annotation-meta">${chapterNames[chapter] || ''}</div>
      <div class="notebook-annotation-text">${this._escapeHtml(text)}</div>
    `;

    // 入场动画
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    this._annotationsEl.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    // 如果笔记本已打开，滚动到最新
    if (this._isOpen) {
      this._annotationsEl.scrollTop = this._annotationsEl.scrollHeight;
    }

    // 按钮闪烁提示新批注
    if (!this._isOpen) {
      this._toggleEl.classList.add('has-new');
      setTimeout(() => this._toggleEl.classList.remove('has-new'), 3000);
    }
  }

  /**
   * 无 AI 时的降级批注
   * @private
   */
  _fallbackAnnotation(eventType) {
    const fallbacks = {
      'item-collected': '新发现了一件物件，也许后面会用到。',
      'hint-received': '周老师的提示让我想到了一些新的方向。',
      'zhou-dialogue': '和周老师的对话给了我一些启发。',
    };
    return fallbacks[eventType] || '需要继续观察。';
  }

  /** @private */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
