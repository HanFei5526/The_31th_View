import bgImage from '../../图片/7.png';
import characterImage from '../../图片/8.png';

/**
 * 《卅一景》 — 主菜单 / Main Menu
 *
 * 古典卷轴式菜单设计：
 * - 宣纸暖色背景 + subtle 纹理
 * - 中央卷轴面板展开效果
 * - 章节列表如书页排列
 * - 已解锁章节带朱砂印章标记
 * - 底部「开始游戏」主按钮
 */

/** 章节配置数据 */
const CHAPTERS = [
  {
    id: 'prologue',
    scene: 'prologue',
    name: '序章',
    subtitle: '残页',
    tagline: '一次例行的修复工作，揭开了五百年前的秘密',
    unlockKey: 'prologue',
    alwaysUnlocked: true,
  },
  {
    id: 'chapter1',
    scene: 'chapter1',
    name: '第一章',
    subtitle: '东园 · 兰雪堂至芙蓉榭',
    tagline: '水面之下，另一个世界在等待',
    unlockKey: 'chapter1',
  },
  {
    id: 'chapter2',
    scene: 'chapter2',
    name: '第二章',
    subtitle: '中园 · 远香堂至小飞虹',
    tagline: '诗句之间，隐藏着不被允许的笔迹',
    unlockKey: 'chapter2',
  },
  {
    id: 'chapter3',
    scene: 'chapter3',
    name: '第三章',
    subtitle: '西园 · 卅六鸳鸯馆至留听阁',
    tagline: '画壁深处，真相在剥落中浮现',
    unlockKey: 'chapter3',
  },
  {
    id: 'finale',
    scene: 'finale',
    name: '终章',
    subtitle: '第三十一景',
    tagline: '她的名字，终将被看见',
    unlockKey: 'finale',
  },
];

export default class MenuScene {
  constructor(gameEngine) {
    this.engine = gameEngine;
    this._styleEl = null;
  }

  /* ==================== 生命周期 ==================== */

  enter(container) {
    this._injectStyles();
    container.innerHTML = '';
    container.appendChild(this._buildDOM());
  }

  exit() {
    if (this._styleEl) this._styleEl.remove();
  }

  /* ==================== DOM 构建 ==================== */

  _buildDOM() {
    const root = document.createElement('div');
    root.className = 'menu-scene';

    const hasSave = this._hasSaveData();
    const progress = this._getProgress();
    const completedCount = CHAPTERS.filter(ch =>
      ch.alwaysUnlocked || progress[ch.unlockKey]
    ).length;

    root.innerHTML = `
      <!-- 背景装饰 -->
      <div class="menu-bg">
        <div class="menu-mask"></div>
        <div class="menu-bg-mountain"></div>
        <div class="menu-bg-mist"></div>
      </div>

      <!-- 返回按钮 -->
      <button class="menu-back" id="btn-back">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>返回</span>
      </button>

      <!-- 主面板 -->
      <div class="menu-panel">
        <!-- 内容区 -->
        <div class="menu-content">
          <!-- 标题区 -->
          <header class="menu-header">
            <div class="menu-header-ink"></div>
            <h1 class="menu-title">卅一景</h1>
            <p class="menu-subtitle">选择你要进入的章节</p>
            <div class="menu-progress">
              <div class="progress-track">
                <div class="progress-fill" style="width: ${(completedCount / CHAPTERS.length) * 100}%"></div>
              </div>
              <span class="progress-text">${completedCount} / ${CHAPTERS.length}</span>
            </div>
          </header>

          <!-- 章节列表 -->
          <nav class="chapter-list" aria-label="章节列表">
            ${CHAPTERS.map((ch, i) => {
              const unlocked = ch.alwaysUnlocked || progress[ch.unlockKey];
              const completed = progress[ch.unlockKey + '_completed'];
              return `
              <div class="chapter-item ${unlocked ? 'chapter-item--unlocked' : 'chapter-item--locked'}"
                   data-scene="${ch.scene}"
                   ${!unlocked ? 'data-locked="true"' : ''}
                   style="--delay: ${i * 0.1}s">
                <div class="chapter-info">
                  <div class="chapter-header">
                    <span class="chapter-name">${ch.name}</span>
                    <span class="chapter-sep">·</span>
                    <span class="chapter-subtitle">${ch.subtitle}</span>
                  </div>
                  <p class="chapter-tagline">${ch.tagline}</p>
                </div>
                <div class="chapter-side">
                  <div class="chapter-marker">
                    ${(() => {
                      const num = String(i + 1).padStart(2, '0');
                      if (completed) return '<div class="seal seal--done">已阅</div>';
                      if (unlocked) return '<div class="chapter-num">' + num + '</div>';
                      return '<div class="chapter-num chapter-num--dim">' + num + '</div>';
                    })()}
                  </div>
                  <div class="chapter-status-icon">
                    ${!unlocked ? `
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                        <path d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                      </svg>
                    ` : `
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="chapter-arrow">
                        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    `}
                  </div>
                </div>
                <div class="chapter-ink-hover"></div>
              </div>`;
            }).join('')}
          </nav>

        </div>
      </div>

      <!-- 底部全局操作 -->
      <footer class="menu-footer-global">
        <button class="action-btn ${hasSave ? 'action-btn--secondary' : 'action-btn--primary'}" id="btn-new">
          ${hasSave ? '重新开始' : '新的旅程'}
        </button>
        <button class="action-btn ${hasSave ? 'action-btn--primary' : 'action-btn--secondary'}" id="btn-continue" ${hasSave ? '' : 'disabled'}>
          继续游戏
        </button>
        <button class="action-btn action-btn--ghost" id="btn-clear" style="${hasSave ? '' : 'display:none;'}">
          清除存档
        </button>
      </footer>
    `;

    // === 绑定事件 ===

    // 返回
    root.querySelector('#btn-back').addEventListener('click', () => {
      root.classList.add('menu-scene--exiting');
      setTimeout(() => this.engine.switchScene('landing'), 800);
    });

    // 新游戏
    root.querySelector('#btn-new').addEventListener('click', () => {
      this._startNewGame(root);
    });

    // 继续
    const continueBtn = root.querySelector('#btn-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this._continueGame(root);
      });
    }

    // 清除存档
    const clearBtn = root.querySelector('#btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有存档吗？此操作不可恢复。')) {
          this.engine.saveSystem?.clear?.();
          this.engine.gameProgress = {};
          this.engine.inventory.items = [];
          // 重新渲染
          this.engine.switchScene('menu');
        }
      });
    }

    // 章节点击
    root.querySelectorAll('.chapter-item--unlocked').forEach((item) => {
      item.addEventListener('click', () => {
        const scene = item.dataset.scene;
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
          root.classList.add('menu-scene--exiting');
          setTimeout(() => this.engine.switchScene(scene), 800);
        }, 200);
      });
    });

    // 锁定章节提示
    root.querySelectorAll('.chapter-item--locked').forEach((item) => {
      item.addEventListener('click', () => {
        item.classList.add('shake');
        setTimeout(() => item.classList.remove('shake'), 400);
      });
    });

    return root;
  }

  /* ==================== 操作方法 ==================== */

  _startNewGame(root) {
    if (this.engine.saveSystem?.clear) {
      this.engine.saveSystem.clear();
    }
    this.engine.gameProgress = {};
    this.engine.inventory.items = [];
    this.engine.currentChapter = 0;
    this.engine.currentWorld = 'real';
    root.classList.add('menu-scene--exiting');
    setTimeout(() => {
      this.engine.switchScene('prologue');
    }, 800);
  }

  _continueGame(root) {
    const save = this.engine.saveSystem?.load?.();
    if (save) {
      this.engine.currentChapter = save.chapter ?? 0;
      this.engine.currentWorld = save.world ?? 'real';
      this.engine.gameProgress = save.progress ?? {};
      if (save.inventory) {
        this.engine.inventory.restore(save.inventory);
      }
    }
    const lastScene = save?.scene || 'prologue';
    root.classList.add('menu-scene--exiting');
    setTimeout(() => {
      this.engine.switchScene(lastScene);
    }, 800);
  }

  /* ==================== 辅助方法 ==================== */

  _hasSaveData() {
    if (this.engine.saveSystem?.hasSave) {
      return this.engine.saveSystem.hasSave();
    }
    try {
      return !!localStorage.getItem('sanyijing-save');
    } catch { return false; }
  }

  _getProgress() {
    if (this.engine.gameProgress) {
      return this.engine.gameProgress;
    }
    return { prologue: true };
  }

  /* ==================== 样式注入 ==================== */

  _injectStyles() {
    if (document.getElementById('menu-scene-styles')) return;

    const style = document.createElement('style');
    style.id = 'menu-scene-styles';
    style.textContent = /* css */ `

    /* ===========================
       Menu Scene — Root
       =========================== */
    .menu-scene {
      width: 100vw;
      min-height: 100vh;
      background-color: #e0d8cc;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: flex-end; /* 卡片移到右侧 */
      padding: 2rem 8% 2rem 2rem; /* 右侧留白 */
      animation: menuEnter 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .menu-scene--exiting {
      animation: menuExit 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes menuEnter {
      from { opacity: 0; transform: scale(0.95); filter: blur(10px); }
      to { opacity: 1; transform: scale(1); filter: blur(0); }
    }
    @keyframes menuExit {
      to { opacity: 0; transform: translateY(-20px) scale(0.98); filter: blur(4px); }
    }

    /* 背景图片与滤镜 */
    .menu-scene::before {
      content: '';
      position: absolute;
      inset: -5%;
      background-image: url("${bgImage}");
      /* 往后退一点，露出地面（将位置对齐到底部） */
      background-size: cover;
      background-position: center bottom; 
      filter: brightness(1.05) contrast(0.95); /* 保持原始颜色 */
      pointer-events: none;
      z-index: 0;
      animation: menuBgDrift 40s ease-in-out infinite alternate;
    }

    @keyframes menuBgDrift {
      from { transform: scale(1) translateX(0); }
      to { transform: scale(1.02) translateX(-10px); }
    }



    /* ===========================
       Background Decorations
       =========================== */
    .menu-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    /* 透明黑色蒙版 */
    .menu-mask {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 0;
    }

    .menu-bg-mountain {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 35%;
      background:
        radial-gradient(ellipse 100% 80% at 20% 100%, rgba(180, 165, 130, 0.15) 0%, transparent 60%),
        radial-gradient(ellipse 80% 60% at 70% 100%, rgba(160, 145, 110, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse 60% 40% at 50% 100%, rgba(140, 125, 95, 0.08) 0%, transparent 40%);
    }

    .menu-bg-mist {
      position: absolute;
      bottom: 20%;
      left: -10%;
      right: -10%;
      height: 20%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(200, 190, 170, 0.08) 30%,
        rgba(200, 190, 170, 0.12) 50%,
        rgba(200, 190, 170, 0.08) 70%,
        transparent 100%
      );
      filter: blur(40px);
    }

    /* 人物立绘 */
    .menu-character {
      position: absolute;
      left: 2%;
      bottom: 0%;
      height: 95vh;
      z-index: 5;
      pointer-events: none;
      filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2));
    }

    .menu-character img {
      height: 100%;
      width: auto;
      object-fit: contain;
      object-position: left bottom;
    }

    @keyframes charFloat {
      from { transform: translateY(0); }
      to { transform: translateY(-15px); }
    }

    /* ===========================
       Back Button
       =========================== */
    .menu-back {
      position: absolute;
      top: 1.5rem;
      left: 2rem;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 100px;
      color: #5a4d3a;
      font-family: var(--font-serif);
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(12px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .menu-back:hover {
      color: #2c2416;
      background: rgba(255, 255, 255, 0.9);
      border-color: #fff;
      transform: translateX(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* ===========================
       Main Panel (Scroll)
       =========================== */
    .menu-panel {
      position: relative;
      z-index: 10;
      width: 420px; /* narrowed to fit the red box */
      max-width: calc(100vw - 2rem);
      max-height: calc(100vh - 4rem);
      display: flex;
      flex-direction: column;
      animation: panelSlideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    @keyframes panelSlideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ===========================
       Scroll Decorations
       =========================== */
    .scroll-top,
    .scroll-bottom {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 0 1rem;
    }

    .scroll-rod {
      flex: 1;
      height: 6px;
      background: linear-gradient(
        90deg,
        #8a7a68 0%,
        #a09080 20%,
        #b8a898 50%,
        #a09080 80%,
        #8a7a68 100%
      );
      border-radius: 3px;
      box-shadow:
        inset 0 1px 2px rgba(255, 255, 255, 0.2),
        0 1px 3px rgba(44, 36, 22, 0.15);
    }

    .scroll-knob {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #c4b4a0, #9a8a78);
      box-shadow:
        0 2px 6px rgba(44, 36, 22, 0.2),
        inset 0 1px 2px rgba(255, 255, 255, 0.3);
      border: 1px solid rgba(120, 105, 85, 0.3);
    }

    /* ===========================
       Content Area
       =========================== */
    .menu-content {
      background: transparent;
      padding: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
    }

    .menu-content::-webkit-scrollbar {
      width: 4px;
    }
    .menu-content::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 2px;
    }

    /* ===========================
       Header
       =========================== */
    .menu-header {
      text-align: left;
      position: relative;
      padding: 1rem 1.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }

    .menu-header-ink {
      display: none;
    }

    .menu-title {
      font-family: var(--font-serif);
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      font-weight: 300;
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 0.15em;
      margin: 0 0 0.5rem;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .menu-subtitle {
      font-family: var(--font-handwrite);
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.15em;
      margin: 0 0 1.5rem;
    }

    .menu-progress {
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: flex-start;
    }

    .progress-track {
      width: 140px;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 1px;
      transition: width 0.6s ease;
    }

    .progress-text {
      font-family: var(--font-handwrite);
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.1em;
    }

    /* ===========================
       Chapter List
       =========================== */
    .chapter-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      background: rgba(20, 18, 15, 0.4);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    }

    .chapter-item {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: stretch;
      padding: 0;
      border-radius: 0;
      border: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.3s ease;
      cursor: pointer;
      overflow: hidden;
    }

    .chapter-item:last-child {
      border-bottom: none;
    }

    /* Transparent Glass texture - replace noise */
    .chapter-item::before {
      display: none;
    }

    /* 解锁状态 - 悬浮层级效果 */
    .chapter-item--unlocked {
      background: transparent;
    }

    .chapter-item--unlocked:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    /* 锁定状态 */
    .chapter-item--locked {
      cursor: not-allowed;
      opacity: 0.5;
      background: transparent;
    }

    .chapter-item--locked:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    /* 发光 hover */
    .chapter-ink-hover {
      display: none;
    }

    /* 抖动动画（锁定点击） */
    .chapter-item.shake {
      animation: shake 0.4s ease;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-4px); }
      40% { transform: translateX(4px); }
      60% { transform: translateX(-2px); }
      80% { transform: translateX(2px); }
    }

    /* ===========================
       Chapter Side & Marker
       =========================== */
    .chapter-side {
      width: 70px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      background: transparent;
    }

    .chapter-marker {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chapter-num {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-handwrite);
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      letter-spacing: 0.05em;
    }

    .chapter-num--dim {
      color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.05);
    }

    /* 朱砂印章 */
    .seal {
      width: 38px;
      height: 38px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-handwrite);
      font-size: 0.7rem;
      color: #ff5e4d;
      background: rgba(255, 94, 77, 0.1);
      border: 1px solid rgba(255, 94, 77, 0.3);
      letter-spacing: 0.1em;
      transform: rotate(-3deg);
    }

    /* ===========================
       Chapter Info
       =========================== */
    .chapter-info {
      flex: 1;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 1.5rem 2rem;
    }

    .chapter-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35em;
      margin-bottom: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .chapter-name {
      font-family: var(--font-serif);
      font-size: 1.15rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 0.05em;
    }

    .chapter-sep {
      display: none;
    }

    .chapter-subtitle {
      font-family: var(--font-handwrite);
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.05em;
    }

    .chapter-tagline {
      font-family: var(--font-handwrite);
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.4);
      line-height: 1.6;
      margin: 0;
      letter-spacing: 0.03em;
    }

    .chapter-item--unlocked:hover .chapter-tagline {
      color: rgba(255, 255, 255, 0.7);
    }

    /* ===========================
       Chapter Lock / Arrow
       =========================== */
    .chapter-status-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chapter-lock-icon,
    .chapter-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chapter-lock-icon {
      color: rgba(255, 255, 255, 0.2);
    }

    .chapter-arrow {
      color: rgba(255, 255, 255, 0.6);
      transition: all 0.3s ease;
    }

    .chapter-item--unlocked:hover .chapter-arrow {
      color: #fff;
      transform: translateX(4px);
    }

    /* ===========================
       Global Footer Buttons
       =========================== */
    .menu-footer-global {
      position: absolute;
      bottom: 2.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      z-index: 20;
      width: max-content;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 180px;
      padding: 0.8rem 2rem;
      font-family: var(--font-serif);
      font-size: 1.1rem;
      font-weight: 500;
      letter-spacing: 0.1em;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .action-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .action-btn--primary {
      background: rgba(255, 255, 255, 0.9);
      color: #1a1a1a;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .action-btn--primary:hover:not(:disabled) {
      background: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }

    .action-btn--secondary {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .action-btn--secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .action-btn--ghost {
      background: transparent;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.9rem;
      padding: 0.5rem;
    }
    .action-btn--ghost:hover {
      color: #ff5e4d;
      background: rgba(255, 255, 255, 0.05);
    }

    /* ===========================
       Responsive
       =========================== */
    @media (max-width: 860px) {
      .menu-panel {
        width: 600px;
      }
      .chapter-list {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 640px) {
      .menu-scene {
        padding: 1rem;
      }

      .menu-content {
        padding: 1.5rem 1.25rem;
      }

      .menu-back {
        top: 1rem;
        left: 1rem;
      }

      .menu-title {
        font-size: 1.75rem;
      }

      .chapter-item {
        padding: 1.2rem;
      }

      .menu-footer {
        flex-wrap: wrap;
      }
    }
    `;

    document.head.appendChild(style);
    this._styleEl = style;
  }
}
