import bgImage from '../../../TestPic/拙政园鸟瞰_首屏.png';

/**
 * 《卅一景》 — 着陆页 / Landing Page
 *
 * 古典中国画全景背景设计：
 * - 全屏水墨全景图作为视觉核心
 * - 左侧文字区与背景之间渐变过渡
 * - 标题墨色晕染，强调字用朱砂红
 * - "园林空间""古画秘史""人物图鉴"三个按钮点击弹出水平轮播卡片
 */

/** 轮播卡片数据 */
const CARDS = {
  garden: {
    title: '园林空间',
    items: [
      { name: '兰雪堂', desc: '拙政园东园主厅，匾额笔迹中暗藏玄机。', tag: '第一章' },
      { name: '芙蓉榭', desc: '临水而建，水面倒影中可见另一番景象。', tag: '第一章' },
      { name: '远香堂', desc: '中园核心，四壁诗画，墨迹新旧交织。', tag: '第二章' },
      { name: '小飞虹', desc: '廊桥如虹，桥下流水曾载过谁的低语。', tag: '第二章' },
      { name: '卅六鸳鸯馆', desc: '西园深处，散落的画纸记录着最后的痕迹。', tag: '第三章' },
      { name: '留听阁', desc: '壁画藏于灰泥之下，等待五百年后的凝视。', tag: '第三章' },
    ],
  },
  history: {
    title: '古画秘史',
    items: [
      { name: '文徵明', desc: '明代吴门四家之一，以自己的笔保存了一个不属于常规游览路线的视角。', tag: '保存者' },
      { name: '王蘅', desc: '被遮蔽的空间观看者，她留下的不是署名，而是一组低位视角的来源痕迹。', tag: '所见' },
      { name: '拙政园', desc: '始建于明正德年间，亭台、水面与路径共同构成一套被重新看见的空间关系。', tag: '园史' },
      { name: '第三十一景', desc: '画心并未失踪，真正被压入边缘的是边注、题签、辅助线与残字。', tag: '画谜' },
      { name: '断簪', desc: '一根刻有"蘅"字的断簪，是王蘅留在画中痕迹链的一环。', tag: '信物' },
      { name: '残砚', desc: '一方残破的砚台，砚底小字虽已模糊，朱砂底线仍指向她的观看位置。', tag: '信物' },
    ],
  },
  figures: {
    title: '人物图鉴',
    items: [
      { name: '周鹤年', desc: '著名古画修复师，你的导师。在修复工作中保持着极度的严谨。', tag: '导师' },
      { name: '你', desc: '修复师的学生，跟随周鹤年学习古画修复技艺。', tag: '玩家' },
      { name: '王蘅', desc: '没有正式署名位置的空间共同创作者。她不求正名，只希望自己的所见仍有痕迹。', tag: '核心' },
      { name: '王献臣', desc: '拙政园第一任园主，园林营建与文人题咏传统由他展开。', tag: '园主' },
      { name: '徐氏', desc: '园中女性生活经验的侧影，提醒玩家别只沿着正统题名去看。', tag: '女史' },
      { name: '后人', desc: '他们未必恶意毁坏，却在重装、配边与归档中让来源说明退到画心之外。', tag: '整理者' },
    ],
  },
};

export default class LandingScene {
  constructor(gameEngine) {
    this.engine = gameEngine;
    this._styleEl = null;
    this._carousel = null;
  }

  /* ==================== 生命周期 ==================== */

  enter(container) {
    this._injectStyles();
    container.innerHTML = '';
    container.appendChild(this._buildDOM());
  }

  exit() {
    if (this._styleEl) this._styleEl.remove();
    if (this._carousel) { this._carousel.remove(); this._carousel = null; }
  }

  /* ==================== DOM 构建 ==================== */

  _buildDOM() {
    const root = document.createElement('div');
    root.className = 'landing-scene';
    root.innerHTML = `
      <!-- 全景背景 -->
      <div class="landing-bg-panorama">
        <div class="panorama-img"></div>
        <div class="panorama-vignette"></div>
      </div>

      <!-- 左侧渐变过渡遮罩 -->
      <div class="landing-gradient-mask"></div>

      <!-- 内容层 -->
      <div class="landing-content">
        <!-- 顶部导航 -->
        <nav class="landing-nav">
          <div class="landing-logo">
            <span class="logo-name">卅一景</span>
          </div>
          <div class="landing-nav-links">
            <span class="nav-link active">首页</span>
            <span class="nav-link">入画</span>
            <span class="nav-link">关于</span>
          </div>
        </nav>

        <!-- 主体 -->
        <main class="landing-main">
          <div class="landing-left">
            <div class="landing-label">
              <span class="label-line"></span>
              <span class="label-text">叙事驱动的解谜游戏</span>
            </div>

            <h1 class="landing-title">
              <span class="title-line">入画·拙政园：</span>
              <span class="title-line">穿越五百年，<em class="title-verm">成为画中人</em></span>
            </h1>

            <p class="landing-desc">
              你是一位古画修复师的学生。在修复文徵明《拙政园三十一景图》的过程中，
              你发现最后一页的画心异常完整，真正被遮蔽的却是边缘的来源痕迹。
              从修复工作室到明代园林，从断簪到残砚，一步步复原王蘅留下的低位视角。
            </p>

            <div class="landing-actions">
              <button class="btn btn--primary" id="btn-enter">
                <span>开始游戏</span>
              </button>
              <button class="btn btn--outline" data-panel="garden">
                <span>园林空间</span>
              </button>
              <button class="btn btn--outline" data-panel="history">
                <span>古画秘史</span>
              </button>
              <button class="btn btn--outline" data-panel="figures">
                <span>人物图鉴</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    `;

    // 绑定"开始游戏"按钮
    root.querySelector('#btn-enter').addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.className = 'intro-transition-overlay';
      overlay.innerHTML = '<div class="intro-transition-text"></div>';
      document.body.appendChild(overlay);
      
      const textContainer = overlay.querySelector('.intro-transition-text');

      setTimeout(() => {
        overlay.classList.add('active');
      }, 50);
      
      root.classList.add('landing-scene--exiting-slow'); 

      const lines = [
        "你是一位古画修复师的学生。",
        "在修复文徵明《拙政园三十一景图》的过程中，你发现最后一页并没有失踪。",
        "画心完整地保留着一个低位视角，来源说明却被装裱边缘压住。",
        "从修复工作室到明代园林，从断簪到残砚，一步步确认王蘅留下的所见。"
      ];
      
      textContainer.innerHTML = '';
      
      // Delay before starting fade in (wait for overlay to appear)
      setTimeout(() => {
        lines.forEach((line, index) => {
          const p = document.createElement('span');
          p.textContent = line;
          p.style.opacity = '0';
          p.style.transform = 'translateY(10px)';
          p.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
          p.style.display = 'block';
          textContainer.appendChild(p);
          
          setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
          }, index * 1200); // 1.2 seconds between lines
        });
        
        // Wait for all lines to appear + 2 seconds hold time
        const totalDuration = (lines.length - 1) * 1200 + 1200 + 2000;
        
        setTimeout(() => {
          this.engine.switchScene('menu', true); // Skip default transition
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          
          setTimeout(() => {
            overlay.remove();
          }, 3000); // Wait 3s for the slower fade out
        }, totalDuration);
        
      }, 1500);
    });

    // 绑定轮播面板按钮
    root.querySelectorAll('.btn--outline[data-panel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.panel;
        this._openCarousel(key);
      });
    });

    return root;
  }

  /* ==================== 水平轮播弹窗 ==================== */

  _openCarousel(key) {
    const data = CARDS[key];
    if (!data) return;

    if (this._carousel) this._carousel.remove();

    const currentCards = [...data.items];
    let currentIndex = 0;

    const render = () => {
      const item = currentCards[currentIndex];
      this._carousel.querySelector('.carousel-title').textContent = data.title;
      this._carousel.querySelector('.carousel-tag').textContent = item.tag;
      this._carousel.querySelector('.carousel-name').textContent = item.name;
      this._carousel.querySelector('.carousel-desc').textContent = item.desc;
      this._carousel.querySelector('.carousel-prev').style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
      this._carousel.querySelector('.carousel-next').style.visibility = currentIndex === currentCards.length - 1 ? 'hidden' : 'visible';
      this._carousel.querySelector('.carousel-dot').textContent = `${currentIndex + 1} / ${currentCards.length}`;
    };

    const el = document.createElement('div');
    el.className = 'carousel-overlay';
    el.innerHTML = `
      <div class="carousel-panel">
        <button class="carousel-close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="carousel-header">
          <span class="carousel-title"></span>
          <span class="carousel-tag"></span>
        </div>
        <div class="carousel-body">
          <button class="carousel-nav carousel-prev">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="carousel-card">
            <div class="carousel-card-bg">
              <div class="carousel-card-grain"></div>
            </div>
            <div class="carousel-card-content">
              <h3 class="carousel-name"></h3>
              <p class="carousel-desc"></p>
            </div>
          </div>
          <button class="carousel-nav carousel-next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="carousel-footer">
          <span class="carousel-dot"></span>
        </div>
      </div>
    `;

    document.body.appendChild(el);
    this._carousel = el;
    render();

    el.querySelector('.carousel-close').addEventListener('click', () => {
      el.classList.add('carousel-overlay--exit');
      setTimeout(() => { el.remove(); this._carousel = null; }, 400);
    });

    el.addEventListener('click', (e) => {
      if (e.target === el) {
        el.classList.add('carousel-overlay--exit');
        setTimeout(() => { el.remove(); this._carousel = null; }, 400);
      }
    });

    el.querySelector('.carousel-prev').addEventListener('click', () => {
      if (currentIndex > 0) { currentIndex--; render(); }
    });

    el.querySelector('.carousel-next').addEventListener('click', () => {
      if (currentIndex < currentCards.length - 1) { currentIndex++; render(); }
    });

    // 键盘导航
    const keyHandler = (e) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) { currentIndex--; render(); }
      if (e.key === 'ArrowRight' && currentIndex < currentCards.length - 1) { currentIndex++; render(); }
      if (e.key === 'Escape') {
        el.classList.add('carousel-overlay--exit');
        setTimeout(() => { el.remove(); this._carousel = null; document.removeEventListener('keydown', keyHandler); }, 400);
      }
    };
    document.addEventListener('keydown', keyHandler);
    el._keyHandler = keyHandler;
  }

  /* ==================== 样式注入 ==================== */

  _injectStyles() {
    if (document.getElementById('landing-scene-styles')) return;

    const style = document.createElement('style');
    style.id = 'landing-scene-styles';
    style.textContent = /* css */ `

    /* ===========================
       Landing Scene — Root
       =========================== */
    .landing-scene {
      width: 100vw;
      min-height: 100vh;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #e8e0d0;
    }

    .landing-scene--exiting {
      animation: landingFadeOut 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .landing-scene--exiting-slow {
      animation: landingFadeOut 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }


    @keyframes landingFadeOut {
      to { opacity: 0; transform: scale(1.05); filter: blur(8px) saturate(0.3); }
    }

    /* ===========================
       Panorama Background
       =========================== */
    .landing-bg-panorama {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .panorama-img {
      position: absolute;
      inset: 0;
      /* 使用用户指定的沉浸式背景 */
      background-image: url("${bgImage}");
      background-size: cover;
      background-position: center;
      animation: panoramaDrift 40s ease-in-out infinite alternate;
    }

    @keyframes panoramaDrift {
      0%   { transform: scale(1) translateX(0); }
      25%  { transform: scale(1.03) translateX(-5px); }
      50%  { transform: scale(1.02) translateX(3px); }
      75%  { transform: scale(1.04) translateX(-2px); }
      100% { transform: scale(1.01) translateX(4px); }
    }

    .panorama-vignette {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 70% 50%, transparent 30%, rgba(200, 185, 155, 0.3) 70%, rgba(180, 160, 130, 0.5) 100%);
      pointer-events: none;
    }

    /* 宣纸纹理 */
    .panorama-img::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(139, 119, 79, 0.03) 3px,
          rgba(139, 119, 79, 0.03) 6px
        );
      pointer-events: none;
    }

    /* ===========================
       Gradient Mask — 左侧文字区过渡
       =========================== */
    .landing-gradient-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 60%;
      height: 100%;
      z-index: 1;
      background: linear-gradient(
        90deg,
        rgba(240, 232, 216, 0.92) 0%,
        rgba(240, 232, 216, 0.82) 35%,
        rgba(240, 232, 216, 0.55) 60%,
        rgba(240, 232, 216, 0.15) 85%,
        transparent 100%
      );
      pointer-events: none;
    }

    /* ===========================
       Content Layer
       =========================== */
    .landing-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* ===========================
       Navigation
       =========================== */
    .landing-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 4rem;
    }

    .landing-logo {
      display: flex;
      align-items: center;
    }

    .logo-name {
      font-family: var(--font-serif);
      font-size: 1.3rem;
      font-weight: 700;
      color: #2c2416;
      letter-spacing: 0.2em;
    }

    .landing-nav-links {
      display: flex;
      gap: 2.5rem;
    }

    .nav-link {
      font-family: var(--font-serif);
      font-size: 0.95rem;
      color: #7a6b5a;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: color 0.3s ease;
      position: relative;
      padding-bottom: 0.25rem;
    }

    .nav-link::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 1.5px;
      background: #c84032;
      transition: all 0.3s ease;
      transform: translateX(-50%);
    }

    .nav-link:hover,
    .nav-link.active {
      color: #2c2416;
    }

    .nav-link.active::after,
    .nav-link:hover::after {
      width: 100%;
    }

    /* ===========================
       Main Content
       =========================== */
    .landing-main {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 4rem 3rem;
      max-width: 1440px;
      width: 100%;
    }

    .landing-left {
      max-width: 560px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ===========================
       Label
       =========================== */
    .landing-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-left: 0;
    }

    .label-line {
      width: 32px;
      height: 2px;
      background: linear-gradient(90deg, #c84032, transparent);
    }

    .label-text {
      font-family: var(--font-serif);
      font-size: 0.8rem;
      color: #7a6b5a;
      letter-spacing: 0.2em;
    }

    /* ===========================
       Title
       =========================== */
    .landing-title {
      font-family: var(--font-serif);
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .title-line {
      display: block;
      font-size: clamp(2rem, 3.5vw, 3.2rem);
      font-weight: 600;
      color: #2c2416;
      letter-spacing: 0.05em;
      line-height: 1.35;
      animation: titleFadeIn 1.2s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    @keyframes titleFadeIn {
      from { opacity: 0; transform: translateY(15px); filter: blur(3px); }
      to { opacity: 1; transform: translateY(0); filter: blur(0); }
    }

    .title-verm {
      font-style: normal;
      color: #c84032;
      position: relative;
    }

    .title-verm::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, rgba(200, 64, 50, 0.25), transparent);
      border-radius: 2px;
    }

    /* ===========================
       Description
       =========================== */
    .landing-desc {
      font-family: var(--font-serif);
      font-size: clamp(0.9rem, 1.1vw, 1.05rem);
      color: #7a6b5a;
      line-height: 2;
      text-indent: 2em;
      animation: descFadeIn 1.2s 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    @keyframes descFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ===========================
       Buttons
       =========================== */
    .landing-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
      animation: actionsFadeIn 1.2s 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    @keyframes actionsFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.7rem 1.6rem;
      border-radius: 100px;
      font-family: var(--font-serif);
      font-size: 0.9rem;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      border: none;
      outline: none;
      position: relative;
      overflow: hidden;
    }

    .btn--primary {
      background: linear-gradient(135deg, #4a6d7c 0%, #3a5d6c 100%);
      color: #f5f0e8;
      box-shadow: 0 4px 16px rgba(74, 109, 124, 0.25);
    }

    .btn--primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(74, 109, 124, 0.35);
    }

    .btn--outline {
      background: rgba(245, 240, 232, 0.5);
      color: #5a4d3a;
      border: 1.5px solid rgba(139, 119, 79, 0.25);
      backdrop-filter: blur(4px);
    }

    .btn--outline:hover {
      border-color: rgba(200, 64, 50, 0.4);
      color: #c84032;
      background: rgba(200, 64, 50, 0.04);
      transform: translateY(-1px);
    }

    /* ===========================
       Carousel Overlay
       =========================== */
    .carousel-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(44, 36, 22, 0.6);
      backdrop-filter: blur(12px);
      animation: overlayFadeIn 0.3s ease;
    }

    .carousel-overlay--exit {
      animation: overlayFadeOut 0.4s ease forwards;
    }

    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes overlayFadeOut {
      to { opacity: 0; backdrop-filter: blur(0); }
    }

    .carousel-panel {
      position: relative;
      width: 640px;
      max-width: calc(100vw - 3rem);
      background: #faf6f0;
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow:
        0 24px 80px rgba(44, 36, 22, 0.2),
        0 0 0 1px rgba(139, 119, 79, 0.12);
      animation: panelEnter 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes panelEnter {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .carousel-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(139, 119, 79, 0.06);
      border: none;
      color: #7a6b5a;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .carousel-close:hover {
      background: rgba(200, 64, 50, 0.08);
      color: #c84032;
    }

    .carousel-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(139, 119, 79, 0.12);
    }

    .carousel-title {
      font-family: var(--font-serif);
      font-size: 1.4rem;
      font-weight: 700;
      color: #2c2416;
      letter-spacing: 0.1em;
    }

    .carousel-tag {
      font-family: var(--font-handwrite);
      font-size: 0.75rem;
      color: #c84032;
      padding: 0.2rem 0.75rem;
      background: rgba(200, 64, 50, 0.06);
      border-radius: 100px;
      letter-spacing: 0.08em;
    }

    .carousel-body {
      display: flex;
      align-items: center;
      gap: 1rem;
      min-height: 280px;
    }

    .carousel-nav {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(139, 119, 79, 0.06);
      border: 1px solid rgba(139, 119, 79, 0.12);
      color: #5a4d3a;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .carousel-nav:hover {
      background: rgba(200, 64, 50, 0.06);
      border-color: rgba(200, 64, 50, 0.2);
      color: #c84032;
    }

    .carousel-card {
      flex: 1;
      position: relative;
      min-height: 280px;
      border-radius: 16px;
      overflow: hidden;
      background: linear-gradient(160deg, #f0ebe3 0%, #e8e0d0 50%, #d8cfb8 100%);
      border: 1px solid rgba(139, 119, 79, 0.1);
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .carousel-card-bg {
      position: absolute;
      inset: 0;
      /* 卡片内水墨山水点缀 */
      background:
        radial-gradient(ellipse 40% 50% at 80% 40%, rgba(120, 100, 70, 0.15) 0%, transparent 70%),
        radial-gradient(ellipse 25% 30% at 20% 60%, rgba(100, 85, 55, 0.1) 0%, transparent 60%),
        radial-gradient(ellipse 50% 20% at 50% 85%, rgba(160, 145, 110, 0.15) 0%, transparent 50%);
    }

    .carousel-card-grain {
      position: absolute;
      inset: 0;
      opacity: 0.04;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }

    .carousel-card-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
      height: 100%;
      min-height: 280px;
    }

    .carousel-name {
      font-family: var(--font-serif);
      font-size: 2rem;
      font-weight: 700;
      color: #2c2416;
      letter-spacing: 0.15em;
      margin: 0 0 1rem;
    }

    .carousel-desc {
      font-family: var(--font-serif);
      font-size: 1rem;
      color: #7a6b5a;
      line-height: 2;
      max-width: 400px;
      margin: 0;
    }

    .carousel-footer {
      display: flex;
      justify-content: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(139, 119, 79, 0.1);
    }

    .carousel-dot {
      font-family: var(--font-handwrite);
      font-size: 0.8rem;
      color: #9a8b7a;
      letter-spacing: 0.1em;
    }

    /* ===========================
       Responsive
       =========================== */
    @media (max-width: 1024px) {
      .landing-gradient-mask {
        width: 100%;
        background: linear-gradient(
          90deg,
          rgba(240, 232, 216, 0.88) 0%,
          rgba(240, 232, 216, 0.75) 50%,
          rgba(240, 232, 216, 0.45) 100%
        );
      }

      .landing-main {
        padding: 0 2rem 2rem;
      }

      .landing-nav {
        padding: 1rem 2rem;
      }

      .carousel-body {
        flex-direction: column;
      }

      .carousel-nav {
        width: 40px;
        height: 40px;
      }
    }

    @media (max-width: 640px) {
      .landing-nav-links {
        display: none;
      }

      .landing-main {
        padding: 0 1.5rem 2rem;
      }

      .landing-left {
        gap: 1rem;
      }

      .title-line {
        font-size: clamp(1.6rem, 6vw, 2rem);
      }

      .btn {
        padding: 0.6rem 1.2rem;
        font-size: 0.85rem;
      }

      .carousel-panel {
        padding: 1.5rem;
      }

      .carousel-name {
        font-size: 1.5rem;
      }
    }
    `;

    document.head.appendChild(style);
    this._styleEl = style;
  }
}
