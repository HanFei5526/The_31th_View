/**
 * 《卅一景》游戏场景基类
 *
 * 提供全屏沉浸式游戏场景的通用 UI 框架：
 *   - 全屏背景层（带微妙视差动画）
 *   - 自适应明暗遮罩
 *   - 顶部工具栏（返回按钮 + 物品栏入口）
 *   - 底部旁白面板（打字机效果）
 *   - 可交互热点系统
 *
 * 子类只需 override enter() 并调用基类方法来组装场景。
 *
 * 支持两种主题：
 *   theme: 'dark'  — 夜晚场景
 *   theme: 'light' — 白天场景
 */

/** 打字机效果的每字符间隔（毫秒） */
const TYPEWRITER_SPEED = 45;

export default class GameSceneBase {
  constructor(engine) {
    /** @type {import('../core/game-engine.js').GameEngine} */
    this.engine = engine;
    this._styleEl = null;
    this._root = null;
    this._narrationPanel = null;
    this._narrationText = null;
    this._narrationIndicator = null;
    this._hotspotLayer = null;
    this._typewriterTimer = null;
    this._typewriterText = '';
    this._isTyping = false;
  }

  /* ==================== 生命周期 ==================== */

  exit() {
    this._clearTypewriter();
    if (this._styleEl) this._styleEl.remove();
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }

  /* ==================== 场景构建 ==================== */

  /**
   * 构建完整的游戏场景 shell
   * @param {object} config
   * @param {string} config.bgImage — 背景图路径（import 后的 URL）
   * @param {string} config.theme — 'dark' | 'light'
   * @returns {HTMLElement} root
   */
  _buildSceneShell(config) {
    this._injectStyles(config);

    const root = document.createElement('div');
    root.className = `game-scene game-scene--${config.theme || 'dark'}`;
    this._root = root;

    const isDark = (config.theme || 'dark') === 'dark';

    root.innerHTML = `
      <!-- 全屏背景 -->
      <div class="gs-bg" style="background-image: url('${config.bgImage}')"></div>
      <div class="gs-overlay"></div>

      <!-- 顶部工具栏 -->
      <div class="gs-toolbar">
        <button class="gs-btn-back" id="gs-btn-back" aria-label="返回菜单">
          <span>返回</span>
        </button>
        <div class="gs-toolbar-right">
          <button class="gs-btn-inventory" id="gs-btn-inventory" aria-label="打开物品栏">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 19V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 3v6h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 热点图层 -->
      <div class="gs-hotspot-layer" id="gs-hotspot-layer" role="region" aria-label="可交互区域"></div>

      <!-- 底部旁白面板 -->
      <div class="gs-narration" id="gs-narration" role="region" aria-label="叙事旁白" tabindex="0">
        <div class="gs-narration-inner">
          <div class="gs-narration-text" id="gs-narration-text" role="status" aria-live="polite"></div>
          <div class="gs-narration-indicator" id="gs-narration-indicator">▼ 点击或按空格继续</div>
        </div>
      </div>
    `;

    this._narrationPanel = root.querySelector('#gs-narration');
    this._narrationText = root.querySelector('#gs-narration-text');
    this._narrationIndicator = root.querySelector('#gs-narration-indicator');
    this._hotspotLayer = root.querySelector('#gs-hotspot-layer');

    // 绑定返回按钮
    root.querySelector('#gs-btn-back').addEventListener('click', () => {
      root.classList.add('game-scene--exiting');
      setTimeout(() => this.engine.switchScene('menu'), 600);
    });

    // 绑定物品栏按钮（暂为占位）
    root.querySelector('#gs-btn-inventory').addEventListener('click', () => {
      console.log('[GameScene] 物品栏按钮点击');
    });

    // 绑定键盘导航
    this._keyHandler = (e) => this._handleKeyDown(e);
    document.addEventListener('keydown', this._keyHandler);

    return root;
  }

  /**
   * 键盘事件处理
   * @private
   */
  _handleKeyDown(e) {
    // Esc：返回菜单
    if (e.key === 'Escape') {
      e.preventDefault();
      this._root.classList.add('game-scene--exiting');
      setTimeout(() => this.engine.switchScene('menu'), 600);
      return;
    }

    // 空格/Z/回车：继续旁白或跳过打字机
    if (e.key === ' ' || e.key === 'Enter' || e.key?.toLowerCase() === 'z' || e.code === 'KeyZ') {
      // 如果输入框有焦点，不处理
      if (this._isTextInputActive()) return;

      // 如果有热点可见，回车触发当前聚焦的热点
      if (e.key === 'Enter' && document.activeElement?.classList?.contains('gs-hotspot')) {
        return; // 让按钮自身的 click 事件处理
      }

      if (this._narrationPanel?.classList.contains('gs-narration--visible')) {
        e.preventDefault();
        this._narrationPanel.click();
        return;
      }
    }

    // Tab：在热点之间循环聚焦
    if (e.key === 'Tab') {
      const hotspots = this._hotspotLayer?.querySelectorAll('.gs-hotspot');
      if (hotspots?.length > 0 && !document.activeElement?.classList?.contains('gs-hotspot')) {
        // 如果当前焦点不在热点上，按 Tab 跳到第一个热点
        if (!document.activeElement || document.activeElement === document.body) {
          e.preventDefault();
          hotspots[0].focus();
        }
      }
    }
  }

  /* ==================== 旁白系统 ==================== */

  /**
   * 在底部面板显示一条旁白（打字机效果），点击后 resolve
   * @param {string} text
   * @returns {Promise<void>}
   */
  _showNarration(text) {
    // 记录到叙事日志
    this.engine.emit('narration-logged', {
      text,
      chapter: this.engine.currentChapter,
      scene: this.engine.currentScene,
    });

    return new Promise((resolve) => {
      this._narrationPanel.classList.add('gs-narration--visible');
      this._narrationIndicator.style.display = 'none';
      this._startTypewriter(text);

      const advanceHandler = () => {
        if (this._isTyping) {
          this._completeTypewriter();
        } else {
          this._narrationPanel.removeEventListener('click', advanceHandler);
          resolve();
        }
      };
      this._narrationPanel.addEventListener('click', advanceHandler);
    });
  }

  /**
   * 依次显示一组旁白
   * @param {string[]} texts
   * @returns {Promise<void>}
   */
  async _showNarrationSequence(texts) {
    for (const text of texts) {
      await this._showNarration(text);
    }
  }

  /**
   * 隐藏旁白面板
   */
  _hideNarration() {
    this._clearTypewriter();
    this._narrationPanel.classList.remove('gs-narration--visible');
  }

  /* ==================== 热点系统 ==================== */

  /**
   * 添加一个可交互热点
   * @param {object} config
   * @param {string} config.id — 热点唯一 ID
   * @param {string} config.x — CSS left
   * @param {string} config.y — CSS top
   * @param {string} config.w — CSS width
   * @param {string} config.h — CSS height
   * @param {string} [config.label] — 标签文字
   * @param {Function} config.onClick — 点击回调
   */
  _addHotspot(config) {
    const spot = document.createElement('button');
    spot.className = 'gs-hotspot';
    spot.id = `hotspot-${config.id}`;
    spot.style.cssText = `left:${config.x}; top:${config.y}; width:${config.w}; height:${config.h};`;
    spot.setAttribute('tabindex', '0');
    spot.setAttribute('aria-label', config.label || '可交互区域');

    if (config.label) {
      const label = document.createElement('span');
      label.className = 'gs-hotspot-label';
      label.textContent = config.label;
      spot.appendChild(label);
    }

    // 脉动光圈
    const glow = document.createElement('div');
    glow.className = 'gs-hotspot-glow';
    spot.appendChild(glow);

    const activate = (e) => {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e.type === 'keydown') e.preventDefault();
      e.stopPropagation();
      if (config.onClick) config.onClick();
    };

    spot.addEventListener('click', activate);
    spot.addEventListener('keydown', activate);

    this._hotspotLayer.appendChild(spot);
    return spot;
  }

  /**
   * 移除指定热点
   * @param {string} id
   */
  _removeHotspot(id) {
    const el = this._hotspotLayer.querySelector(`#hotspot-${id}`);
    if (el) el.remove();
  }

  /**
   * 清空所有热点
   */
  _clearHotspots() {
    this._hotspotLayer.innerHTML = '';
  }

  /* ==================== 打字机效果 ==================== */

  _startTypewriter(text) {
    this._clearTypewriter();
    this._isTyping = true;
    this._typewriterText = text;
    this._narrationText.textContent = '';
    let i = 0;

    this._typewriterTimer = setInterval(() => {
      if (i < text.length) {
        this._narrationText.textContent += text[i];
        i++;
      } else {
        this._completeTypewriter();
      }
    }, TYPEWRITER_SPEED);
  }

  _completeTypewriter() {
    this._clearTypewriter();
    this._narrationText.textContent = this._typewriterText;
    this._isTyping = false;
    this._narrationIndicator.style.display = 'block';
  }

  _clearTypewriter() {
    if (this._typewriterTimer) {
      clearInterval(this._typewriterTimer);
      this._typewriterTimer = null;
    }
  }

  _isTextInputActive() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  /* ==================== 样式注入 ==================== */

  _injectStyles(config) {
    if (document.getElementById('game-scene-styles')) return;

    const style = document.createElement('style');
    style.id = 'game-scene-styles';
    style.textContent = `

    /* ===========================
       Scene Root
       =========================== */
    .game-scene {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      opacity: 1;
      transition: opacity 0.6s ease;
    }

    .game-scene--exiting {
      opacity: 0;
    }

    /* ===========================
       Full-screen Background
       =========================== */
    .gs-bg {
      position: absolute;
      inset: -2%;
      background-size: cover;
      background-position: center;
      z-index: 0;
      animation: gsBgBreath 30s ease-in-out infinite alternate;
    }

    @keyframes gsBgBreath {
      from { transform: scale(1); }
      to { transform: scale(1.03); }
    }

    /* 自适应遮罩 */
    .gs-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }

    /* Dark theme vignette */
    .game-scene--dark .gs-overlay {
      background: radial-gradient(circle at center, transparent 30%, rgba(10, 8, 5, 0.8) 100%),
                  linear-gradient(to top, rgba(5, 3, 2, 0.95) 0%, transparent 30%);
    }

    /* Light theme adjusted for mystery: dark bottom gradient instead of white haze */
    .game-scene--light .gs-overlay {
      background: radial-gradient(circle at center, transparent 40%, rgba(20, 15, 10, 0.6) 100%),
                  linear-gradient(to top, rgba(10, 8, 5, 0.95) 0%, transparent 30%);
    }

    /* ===========================
       Toolbar
       =========================== */
    .gs-toolbar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      z-index: 10;
    }

    .gs-btn-back {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0.6rem 2.2rem;
      font-family: var(--font-serif);
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.25em; 
      cursor: pointer;
      transition: all 0.2s ease-out;
      border-radius: 0;
      color: #e0c296; 
      background: #713824;
      border: 2px solid #4a2417;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.2), 4px 4px 0px rgba(44, 36, 22, 0.85); 
    }

    .gs-btn-back:hover {
      transform: translate(2px, 2px);
      background: #5c2d1b;
      box-shadow: inset 0 0 15px rgba(0,0,0,0.3), 2px 2px 0px rgba(44, 36, 22, 0.85);
    }

    .gs-btn-inventory {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .game-scene--dark .gs-btn-inventory {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.8);
      border: 1px solid rgba(255,255,255,0.15);
    }
    .game-scene--dark .gs-btn-inventory:hover {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }

    .game-scene--light .gs-btn-inventory {
      background: rgba(0,0,0,0.05);
      color: rgba(30,25,20,0.6);
      border: 1px solid rgba(0,0,0,0.1);
    }
    .game-scene--light .gs-btn-inventory:hover {
      background: rgba(0,0,0,0.1);
      color: rgba(30,25,20,1);
    }

    /* ===========================
       Narration Panel
       =========================== */
    .gs-narration {
      position: absolute;
      bottom: 2rem;
      left: 0;
      right: 0;
      z-index: 40;
      transform: translateY(150%);
      transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
      cursor: pointer;
      user-select: none;
      padding: 0 2rem;
    }

    .gs-narration--visible {
      transform: translateY(0);
    }

    .gs-narration-inner {
      max-width: 850px;
      margin: 0 auto;
      padding: 2rem 3rem;
      position: relative;
      /* 木刻底板质感 */
      background: #2b2018;
      background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px);
      border-radius: 2px;
      border: 3px solid #1a120e;
      box-shadow:
        inset 0 0 0 2px #5c432b,
        inset 0 0 20px rgba(0,0,0,0.6),
        0 15px 40px rgba(0,0,0,0.5);
    }

    .gs-narration-text {
      font-family: var(--font-serif);
      font-size: 1.15rem;
      line-height: 2.2;
      color: #d9c8aa;
      letter-spacing: 0.08em;
      min-height: 2em;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    }

    .gs-narration-indicator {
      position: absolute;
      bottom: 1rem;
      right: 2.5rem;
      font-size: 0.8rem;
      color: #9b2e20;
      letter-spacing: 0.1em;
      animation: gsIndicatorPulse 1.5s ease-in-out infinite;
    }

    @keyframes gsIndicatorPulse {
      0%, 100% { opacity: 0.3; transform: translateY(0); }
      50% { opacity: 1; transform: translateY(3px); }
    }

    /* ===========================
       Hotspot System
       =========================== */
    .gs-hotspot-layer {
      position: absolute;
      inset: 0;
      z-index: 5;
      pointer-events: none;
    }

    .gs-hotspot {
      position: absolute;
      pointer-events: all;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.3s ease;
      padding: 0;
    }

    .gs-hotspot-glow {
      position: absolute;
      inset: -4px;
      border-radius: 10px;
      animation: gsHotspotPulse 2.5s ease-in-out infinite;
      pointer-events: none;
    }

    .game-scene--dark .gs-hotspot-glow {
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 0 15px rgba(255,255,255,0.1);
    }

    .game-scene--dark .gs-hotspot:hover .gs-hotspot-glow {
      border-color: rgba(255,255,255,0.5);
      box-shadow: 0 0 25px rgba(255,255,255,0.2);
    }

    .game-scene--light .gs-hotspot-glow {
      border: 1px solid rgba(180,140,60,0.3);
      box-shadow: 0 0 15px rgba(180,140,60,0.15);
    }

    .game-scene--light .gs-hotspot:hover .gs-hotspot-glow {
      border-color: rgba(180,140,60,0.6);
      box-shadow: 0 0 25px rgba(180,140,60,0.3);
    }

    @keyframes gsHotspotPulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.03); }
    }

    .gs-hotspot-label {
      font-family: var(--font-handwrite);
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.3s ease;
      white-space: nowrap;
      pointer-events: none;
      position: absolute;
      bottom: calc(100% + 8px);
    }

    .game-scene--dark .gs-hotspot-label {
      background: rgba(0,0,0,0.7);
      color: rgba(255,255,255,0.9);
    }

    .game-scene--light .gs-hotspot-label {
      background: rgba(255,255,255,0.9);
      color: rgba(30,25,20,0.8);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .gs-hotspot:hover .gs-hotspot-label,
    .gs-hotspot:focus-visible .gs-hotspot-label {
      opacity: 1;
      transform: translateY(0);
    }

    .gs-hotspot:focus-visible {
      outline: 2px solid rgba(200, 180, 140, 0.6);
      outline-offset: 4px;
    }

    .gs-btn-back:focus-visible,
    .gs-btn-inventory:focus-visible {
      outline: 2px solid rgba(200, 180, 140, 0.6);
      outline-offset: 2px;
    }

    /* ===========================
       Reduced Motion
       =========================== */
    @media (prefers-reduced-motion: reduce) {
      .gs-bg { animation: none; }
      .gs-narration { transition: none; }
      .gs-hotspot-glow { animation: none; }
      .gs-narration-indicator { animation: none; }
      .game-scene { transition: none; }
    }

    /* ===========================
       Responsive
       =========================== */
    @media (max-width: 768px) {
      .gs-toolbar {
        padding: 1rem;
      }
      .gs-narration-inner {
        padding: 1.5rem 1.5rem;
      }
    }
    `;

    document.head.appendChild(style);
    this._styleEl = style;
  }
}
