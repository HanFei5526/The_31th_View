/**
 * 《卅一景》游戏场景基类
 *
 * 提供全屏沉浸式游戏场景的通用 UI 框架：
 *   - 全屏背景层（带微妙视差动画）
 *   - 自适应明暗遮罩
 *   - 顶部工具栏（返回按钮 + 物品栏入口）
 *   - 底部旁白面板（打字机效果）
 *   - 可交互热点系统
 *   - 章节标题淡入淡出
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
    this._isTyping = false;
  }

  /* ==================== 生命周期 ==================== */

  exit() {
    this._clearTypewriter();
    if (this._styleEl) this._styleEl.remove();
  }

  /* ==================== 场景构建 ==================== */

  /**
   * 构建完整的游戏场景 shell
   * @param {object} config
   * @param {string} config.bgImage — 背景图路径（import 后的 URL）
   * @param {string} config.theme — 'dark' | 'light'
   * @param {string} [config.chapterTitle] — 章节名
   * @param {string} [config.chapterSubtitle] — 章节副标题
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
        <button class="gs-btn-back" id="gs-btn-back">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>返回</span>
        </button>
        <div class="gs-toolbar-right">
          <button class="gs-btn-inventory" id="gs-btn-inventory">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 19V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 3v6h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 热点图层 -->
      <div class="gs-hotspot-layer" id="gs-hotspot-layer"></div>

      <!-- 章节标题 (初始隐藏) -->
      <div class="gs-chapter-title" id="gs-chapter-title">
        <div class="gs-chapter-name">${config.chapterTitle || ''}</div>
        <div class="gs-chapter-divider"></div>
        <div class="gs-chapter-subtitle">${config.chapterSubtitle || ''}</div>
      </div>

      <!-- 底部旁白面板 -->
      <div class="gs-narration" id="gs-narration">
        <div class="gs-narration-inner">
          <div class="gs-narration-text" id="gs-narration-text"></div>
          <div class="gs-narration-indicator" id="gs-narration-indicator">▼</div>
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

    return root;
  }

  /* ==================== 章节标题动画 ==================== */

  /**
   * 显示章节标题（淡入 → 停留 → 淡出）
   * @param {number} [duration=3000] 总显示时长
   * @returns {Promise<void>}
   */
  _showChapterTitle(duration = 3000) {
    return new Promise((resolve) => {
      const el = this._root.querySelector('#gs-chapter-title');
      el.classList.add('gs-chapter-title--visible');
      setTimeout(() => {
        el.classList.remove('gs-chapter-title--visible');
        el.classList.add('gs-chapter-title--exit');
        setTimeout(() => {
          el.classList.remove('gs-chapter-title--exit');
          resolve();
        }, 800);
      }, duration);
    });
  }

  /* ==================== 旁白系统 ==================== */

  /**
   * 在底部面板显示一条旁白（打字机效果），点击后 resolve
   * @param {string} text
   * @returns {Promise<void>}
   */
  _showNarration(text) {
    return new Promise((resolve) => {
      this._narrationPanel.classList.add('gs-narration--visible');
      this._narrationIndicator.style.display = 'none';
      this._startTypewriter(text);

      const clickHandler = () => {
        if (this._isTyping) {
          this._completeTypewriter();
        } else {
          this._narrationPanel.removeEventListener('click', clickHandler);
          resolve();
        }
      };
      this._narrationPanel.addEventListener('click', clickHandler);
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

    spot.addEventListener('click', (e) => {
      e.stopPropagation();
      if (config.onClick) config.onClick();
    });

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
    this._isTyping = false;
    this._narrationIndicator.style.display = 'block';
  }

  _clearTypewriter() {
    if (this._typewriterTimer) {
      clearInterval(this._typewriterTimer);
      this._typewriterTimer = null;
    }
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

    /* 深色主题遮罩 */
    .game-scene--dark .gs-overlay {
      background:
        radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%),
        linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%);
    }

    /* 浅色主题遮罩 */
    .game-scene--light .gs-overlay {
      background:
        radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.15) 100%),
        linear-gradient(to top, rgba(255,255,255,0.3) 0%, transparent 30%);
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
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-family: var(--font-serif);
      font-size: 0.9rem;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .game-scene--dark .gs-btn-back {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.8);
      border: 1px solid rgba(255,255,255,0.15);
    }
    .game-scene--dark .gs-btn-back:hover {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }

    .game-scene--light .gs-btn-back {
      background: rgba(0,0,0,0.05);
      color: rgba(30,25,20,0.7);
      border: 1px solid rgba(0,0,0,0.1);
    }
    .game-scene--light .gs-btn-back:hover {
      background: rgba(0,0,0,0.1);
      color: rgba(30,25,20,1);
    }

    .gs-btn-inventory {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
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
       Chapter Title
       =========================== */
    .gs-chapter-title {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 15;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.8s ease;
    }

    .gs-chapter-title--visible {
      opacity: 1;
    }

    .gs-chapter-title--exit {
      opacity: 0;
      transition: opacity 0.8s ease;
    }

    .gs-chapter-name {
      font-family: var(--font-serif);
      font-weight: 300;
      letter-spacing: 0.2em;
    }

    .game-scene--dark .gs-chapter-name {
      font-size: 3.5rem;
      color: rgba(255,255,255,0.95);
      text-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .game-scene--light .gs-chapter-name {
      font-size: 3.5rem;
      color: rgba(30,25,20,0.9);
      text-shadow: 0 2px 10px rgba(255,255,255,0.6);
    }

    .gs-chapter-divider {
      width: 60px;
      height: 1px;
      margin: 1rem auto;
    }

    .game-scene--dark .gs-chapter-divider {
      background: rgba(255,255,255,0.4);
    }
    .game-scene--light .gs-chapter-divider {
      background: rgba(30,25,20,0.3);
    }

    .gs-chapter-subtitle {
      font-family: var(--font-handwrite);
      letter-spacing: 0.1em;
    }

    .game-scene--dark .gs-chapter-subtitle {
      font-size: 1.2rem;
      color: rgba(255,255,255,0.6);
    }
    .game-scene--light .gs-chapter-subtitle {
      font-size: 1.2rem;
      color: rgba(30,25,20,0.5);
    }

    /* ===========================
       Narration Panel
       =========================== */
    .gs-narration {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 10;
      transform: translateY(100%);
      transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      cursor: pointer;
      user-select: none;
    }

    .gs-narration--visible {
      transform: translateY(0);
    }

    .gs-narration-inner {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 3rem;
      position: relative;
      border-radius: 16px 16px 0 0;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .game-scene--dark .gs-narration-inner {
      background: rgba(10, 8, 6, 0.7);
      border: 1px solid rgba(255,255,255,0.08);
      border-bottom: none;
    }

    .game-scene--light .gs-narration-inner {
      background: rgba(255, 252, 245, 0.8);
      border: 1px solid rgba(0,0,0,0.08);
      border-bottom: none;
      box-shadow: 0 -4px 30px rgba(0,0,0,0.08);
    }

    .gs-narration-text {
      font-family: var(--font-serif);
      font-size: 1.1rem;
      line-height: 2;
      letter-spacing: 0.05em;
      min-height: 2em;
    }

    .game-scene--dark .gs-narration-text {
      color: rgba(255,255,255,0.9);
    }

    .game-scene--light .gs-narration-text {
      color: rgba(30,25,20,0.85);
    }

    .gs-narration-indicator {
      position: absolute;
      bottom: 0.8rem;
      right: 2rem;
      font-size: 0.8rem;
      animation: gsIndicatorPulse 1.5s ease-in-out infinite;
    }

    .game-scene--dark .gs-narration-indicator {
      color: rgba(255,255,255,0.4);
    }

    .game-scene--light .gs-narration-indicator {
      color: rgba(30,25,20,0.3);
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

    .gs-hotspot:hover .gs-hotspot-label {
      opacity: 1;
      transform: translateY(0);
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
      .gs-chapter-name {
        font-size: 2.5rem !important;
      }
      .gs-chapter-subtitle {
        font-size: 1rem !important;
      }
    }
    `;

    document.head.appendChild(style);
    this._styleEl = style;
  }
}
