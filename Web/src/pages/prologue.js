/**
 * 《卅一景》序章 — 残页
 *
 * 场景设定：美术学院旧楼三层，修复工作室，白天（现实世界）
 * 玩家扮演研究生沈念，在导师周鹤年的指导下分析第三十一景扫描件。
 *
 * 叙事节拍：
 *   节拍1 · 接手任务：周鹤年 5 句对话 → 获得修复笔记本
 *   节拍2 · 发现异常：三工具扫描谜题（放大镜/纸质分析/侧光照射）
 *   节拍3 · 跌入画中：异象动画 → 墨迹扩散转场 → 进入第一章
 */

import GameSceneBase from './game-scene.js';
import { ITEM_TEMPLATES } from '../core/inventory.js';

/* ============================
   叙事数据
   ============================ */

/** 节拍1：完整对话序列（旁白 + 周鹤年台词混排，统一使用 DialogueSystem） */
const ZHOU_DIALOGUE = [
  { speaker: null, text: '工作室在美术学院旧楼的三层，窗外是梧桐树。你面前的操作台上，高精度扫描仪正在低声嗡鸣。' },
  { speaker: '周鹤年', text: '三十一景图你应该熟悉。本科课上讲过。' },
  { speaker: '周鹤年', text: '现存册页体系完整，学界一般认为内容已无重大缺页问题。公开数据库里，这一页也一直被视为正常的最后一景。' },
  { speaker: '周鹤年', text: '但这次高精度扫描发现了几个异常。不是它不像文徵明画的。恰恰相反，它太稳、太完整，像一页被处理得很干净的正式作品。' },
  { speaker: '周鹤年', text: '真正奇怪的是边缘、背纸和装裱层。那里有些东西被压住了。' },
  { speaker: '周鹤年', text: '你自己看。明天中午之前，我们要提交初版修复报告。如果没有足够证据，这一页会按"无异常"归档。' },
  { speaker: null, text: '你坐到扫描仪前，屏幕上是第三十一景的高精度扫描件。' },
];

/** 节拍2：三工具的反馈旁白 */
const TOOL_FEEDBACK = {
  magnifier: '装裱接缝处有重叠痕迹，边框似乎压住了旧题签的一角。',
  fiber: '背纸与其他三十页不完全一致，显示此页曾经重装。画心本身较稳定，并非整幅新画。',
  sidelight: '装裱边下方隐约显出旧字残痕……',
};

/** 节拍2：提示系统数据 */
const SCAN_HINTS = [
  { delay: 30, text: '试试工具栏上的扫描工具，仔细观察画面边缘。' },
  { delay: 60, text: '三种工具各有用途——放大镜看细节，纸质分析看材料，侧光照射看底层。' },
  { delay: 90, text: '确保每种工具都使用过。侧光模式下注意装裱边缘的痕迹。' },
];

/* ============================
   序章场景
   ============================ */

export default class PrologueScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
    this._usedTools = new Set();    // 已使用的工具 ID
    this._activeTool = null;        // 当前激活的工具
    this._scanInterface = null;     // 扫描界面 DOM
    this._scanToolbar = null;       // 扫描工具栏 DOM
    this._overlayLayers = {};       // 各工具效果层
    this._isFalling = false;        // 是否正在跌入画中
  }

  /* ==================== 生命周期 ==================== */

  async enter(container) {
    const root = this._buildSceneShell({
      bgImage: '/images/prologue-bg.png',
      theme: 'light',
      chapterTitle: '序章',
      chapterSubtitle: '残页',
    });
    container.innerHTML = '';
    container.appendChild(root);

    this._injectPrologueStyles();

    // ── 节拍1：接手任务 ──
    await this._showChapterTitle(2500);
    await this._beat1_TaskBriefing();

    // ── 节拍2：发现异常 ──
    await this._beat2_ScanPuzzle();
  }

  exit() {
    this.engine.hintSystem.clearAll();
    super.exit();
    // 清理序章专用样式
    const style = document.getElementById('prologue-styles');
    if (style) style.remove();
  }

  /* ==================================================
     节拍1 · 接手任务
     ================================================== */

  async _beat1_TaskBriefing() {
    // 完整对话序列（旁白 + 周鹤年台词）统一通过 DialogueSystem 渲染
    await this.engine.showDialogue(ZHOU_DIALOGUE);

    // 收集修复笔记本
    this.engine.collectItem({ ...ITEM_TEMPLATES.notebook });
  }

  /* ==================================================
     节拍2 · 发现异常（三工具扫描谜题）
     ================================================== */

  async _beat2_ScanPuzzle() {
    // 构建扫描界面
    this._buildScanInterface();

    // 启动提示系统
    this.engine.hintSystem.startTimer('prologue-scan', SCAN_HINTS);
  }

  /** 构建扫描界面 DOM */
  _buildScanInterface() {
    const iface = document.createElement('div');
    iface.className = 'scan-interface';
    iface.innerHTML = `
      <div class="scan-status">
        <span class="scan-status-icon">📡</span>
        <span class="scan-status-text">高精度扫描模式</span>
      </div>

      <div class="scan-viewport">
        <div class="scan-painting"></div>
        <div class="scan-frame-border"></div>

        <!-- 工具效果层 -->
        <div class="scan-overlay scan-overlay-magnifier" data-layer="magnifier"></div>
        <div class="scan-overlay scan-overlay-fiber" data-layer="fiber"></div>
        <div class="scan-overlay scan-overlay-sidelight" data-layer="sidelight">
          <div class="ink-trace ink-trace-suojian">……所见</div>
          <div class="ink-trace ink-trace-line"></div>
        </div>
      </div>

      <div class="scan-toolbar">
        <button class="scan-tool" data-tool="magnifier">
          <span class="scan-tool-icon">🔍</span>
          <span class="scan-tool-label">放大镜</span>
          <span class="scan-tool-check">✓</span>
        </button>
        <button class="scan-tool" data-tool="fiber">
          <span class="scan-tool-icon">🔬</span>
          <span class="scan-tool-label">纸质分析</span>
          <span class="scan-tool-check">✓</span>
        </button>
        <button class="scan-tool" data-tool="sidelight">
          <span class="scan-tool-icon">💡</span>
          <span class="scan-tool-label">侧光照射</span>
          <span class="scan-tool-check">✓</span>
        </button>
      </div>
    `;

    // 存储引用
    this._scanInterface = iface;
    this._scanToolbar = iface.querySelector('.scan-toolbar');
    this._overlayLayers = {
      magnifier: iface.querySelector('.scan-overlay-magnifier'),
      fiber: iface.querySelector('.scan-overlay-fiber'),
      sidelight: iface.querySelector('.scan-overlay-sidelight'),
    };

    // 绑定工具按钮
    iface.querySelectorAll('.scan-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._isFalling) return;
        this._onToolClick(btn.dataset.tool);
      });
    });

    // 插入到场景
    this._root.insertBefore(iface, this._root.querySelector('.gs-narration'));
  }

  /** 工具点击处理 */
  async _onToolClick(toolId) {
    // 重置提示计时
    this.engine.hintSystem.resetTimer('prologue-scan');

    // 如果已经在使用同一个工具，不重复触发
    if (this._activeTool === toolId) return;

    // 切换工具激活态
    this._activeTool = toolId;

    // 更新按钮样式
    this._scanToolbar.querySelectorAll('.scan-tool').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolId);
    });

    // 隐藏所有效果层，显示当前工具的效果层
    Object.entries(this._overlayLayers).forEach(([id, layer]) => {
      layer.classList.toggle('visible', id === toolId);
    });

    // 更新状态栏
    const statusText = this._scanInterface.querySelector('.scan-status-text');
    const labels = { magnifier: '放大镜观察', fiber: '纸质分析', sidelight: '侧光照射' };
    statusText.textContent = labels[toolId] || '高精度扫描模式';

    // 标记已使用 + 显示打勾
    if (!this._usedTools.has(toolId)) {
      this._usedTools.add(toolId);
      const btn = this._scanToolbar.querySelector(`[data-tool="${toolId}"]`);
      btn.classList.add('used');
    }

    // 显示工具反馈（走统一的 DialogueSystem 对话框）
    await this.engine.showDialogue([
      { speaker: null, text: TOOL_FEEDBACK[toolId] },
    ]);

    // 侧光模式特殊处理：如果三个工具都用过了，显示热点
    if (toolId === 'sidelight' && this._usedTools.size === 3) {
      this._revealInkTraces();
    }

    // 如果三工具全部使用但当前不在侧光模式，提示切回
    if (this._usedTools.size === 3 && toolId !== 'sidelight') {
      await this.engine.showDialogue([
        { speaker: null, text: '侧光下似乎还有东西没看清……' },
      ]);
    }
  }


  /** 显示底层墨迹 + 可点击热点 */
  _revealInkTraces() {
    const sidelightLayer = this._overlayLayers.sidelight;
    sidelightLayer.classList.add('revealed');

    // 添加交会处热点
    this._addHotspot({
      id: 'ink-intersection',
      x: '62%',
      y: '45%',
      w: '80px',
      h: '80px',
      label: '残字与辅助线交会处',
      onClick: () => this._beat3_FallInto(),
    });
  }

  /* ==================================================
     节拍3 · 跌入画中
     ================================================== */

  async _beat3_FallInto() {
    if (this._isFalling) return;
    this._isFalling = true;

    // 停止提示系统
    this.engine.hintSystem.clearAll();

    // 移除热点
    this._clearHotspots();

    // 发现旁白
    await this._showNarration('底层不只是修复痕迹……这里有字。"所见"——旁边还有一条极淡的低位构图辅助线。');
    this._hideNarration();

    // 周鹤年最后一句（远处传来）
    await this.engine.showDialogue([
      { speaker: '周鹤年', text: '记住，表面完整，不等于没有缺失。' },
    ]);

    // ── 跌入异象动画 ──
    await this._playInkAnomaly();

    // 更新游戏状态
    this.engine.switchWorld('paint');
    this.engine.gameProgress.prologue = true;
    this.engine.gameProgress.chapter1 = true;
    this.engine.currentChapter = 1;
    this.engine.saveProgress();

    // 墨迹扩散转场 → 切换到第一章
    await this.engine.sceneManager.switchWithInkSpread('chapter1');
  }

  /** 跌入异象动画：墨迹流动 → 画面异变 → 视角吸入 */
  async _playInkAnomaly() {
    const viewport = this._scanInterface?.querySelector('.scan-viewport');
    if (!viewport) return;

    // 阶段 1：墨迹开始流动（1.2s）
    viewport.classList.add('anomaly-phase1');
    const suojian = this._overlayLayers.sidelight?.querySelector('.ink-trace-suojian');
    if (suojian) suojian.classList.add('anomaly-glow');
    await this._delay(1200);

    // 阶段 2：画面色调异变（1.2s）
    viewport.classList.add('anomaly-phase2');
    // 隐藏扫描 UI 元素
    if (this._scanToolbar) this._scanToolbar.classList.add('fading-out');
    const status = this._scanInterface?.querySelector('.scan-status');
    if (status) status.classList.add('fading-out');
    await this._delay(1200);

    // 阶段 3：视角吸入（0.8s）
    viewport.classList.add('anomaly-phase3');
    await this._delay(800);
  }

  /* ==================== 工具方法 ==================== */

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ==================== 序章专用样式 ==================== */

  _injectPrologueStyles() {
    if (document.getElementById('prologue-styles')) return;

    const style = document.createElement('style');
    style.id = 'prologue-styles';
    style.textContent = `

    /* ===========================
       Scan Interface
       =========================== */
    .scan-interface {
      position: absolute;
      inset: 0;
      z-index: 3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem 8rem;
      pointer-events: none;
    }

    .scan-interface > * {
      pointer-events: auto;
    }

    /* ── Status Bar ── */
    .scan-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.2rem;
      border-radius: 20px;
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(10px);
      margin-bottom: 1.5rem;
      font-family: var(--font-serif);
      font-size: 0.85rem;
      color: rgba(30, 25, 20, 0.6);
      letter-spacing: 0.05em;
      transition: opacity 0.8s ease;
    }

    .scan-status.fading-out {
      opacity: 0;
      pointer-events: none;
    }

    /* ── Scan Viewport ── */
    .scan-viewport {
      position: relative;
      width: min(75vw, 800px);
      height: min(50vh, 500px);
      border-radius: 12px;
      overflow: hidden;
      box-shadow:
        0 4px 30px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(0, 0, 0, 0.06);
      transition: transform 1s ease, filter 1.2s ease, opacity 0.8s ease;
    }

    .scan-painting {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        hsl(38, 30%, 88%) 0%,
        hsl(35, 25%, 82%) 30%,
        hsl(32, 20%, 78%) 60%,
        hsl(30, 22%, 84%) 100%
      );
      /* 宣纸纹理模拟 */
      background-image:
        radial-gradient(ellipse at 30% 40%, rgba(120, 90, 50, 0.08) 0%, transparent 60%),
        radial-gradient(ellipse at 70% 60%, rgba(80, 60, 30, 0.06) 0%, transparent 50%),
        linear-gradient(135deg, hsl(38, 30%, 88%), hsl(30, 22%, 84%));
    }

    .scan-frame-border {
      position: absolute;
      inset: 8px;
      border: 1px solid rgba(120, 90, 50, 0.15);
      border-radius: 4px;
      pointer-events: none;
    }

    /* ── Tool Overlays ── */
    .scan-overlay {
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 0.6s ease;
      pointer-events: none;
    }

    .scan-overlay.visible {
      opacity: 1;
    }

    /* 放大镜效果 */
    .scan-overlay-magnifier {
      background:
        radial-gradient(circle 120px at 35% 30%,
          rgba(255, 255, 255, 0.15) 0%,
          transparent 100%);
      border: none;
    }

    .scan-overlay-magnifier.visible::after {
      content: '';
      position: absolute;
      top: 18%;
      left: 23%;
      width: 160px;
      height: 160px;
      border: 2px solid rgba(120, 90, 50, 0.3);
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(120, 90, 50, 0.1);
      animation: magnifierPulse 3s ease-in-out infinite;
    }

    @keyframes magnifierPulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.05); opacity: 1; }
    }

    /* 纸质分析效果 */
    .scan-overlay-fiber {
      background:
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 2px,
          rgba(180, 150, 100, 0.04) 2px,
          rgba(180, 150, 100, 0.04) 4px
        ),
        repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 3px,
          rgba(120, 90, 50, 0.03) 3px,
          rgba(120, 90, 50, 0.03) 6px
        );
      mix-blend-mode: multiply;
    }

    .scan-overlay-fiber.visible::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(200, 180, 140, 0.08);
      animation: fiberScan 4s ease-in-out infinite;
    }

    @keyframes fiberScan {
      0% { clip-path: inset(0 100% 0 0); }
      50% { clip-path: inset(0 0 0 0); }
      100% { clip-path: inset(0 0 0 100%); }
    }

    /* 侧光照射效果 */
    .scan-overlay-sidelight {
      background: linear-gradient(
        135deg,
        rgba(255, 240, 200, 0.2) 0%,
        transparent 40%,
        transparent 60%,
        rgba(255, 230, 180, 0.1) 100%
      );
    }

    .scan-overlay-sidelight.visible {
      filter: none;
    }

    /* ── 底层墨迹（"所见"残字 + 辅助线） ── */
    .ink-trace {
      position: absolute;
      opacity: 0;
      transition: opacity 2s ease;
    }

    .scan-overlay-sidelight.revealed .ink-trace {
      opacity: 1;
    }

    .ink-trace-suojian {
      right: 18%;
      bottom: 28%;
      font-family: var(--font-handwrite, 'LXGW WenKai', serif);
      font-size: 1.4rem;
      color: rgba(60, 40, 20, 0.55);
      letter-spacing: 0.15em;
      filter: blur(0.5px);
      animation: inkShimmer 3s ease-in-out infinite;
      text-shadow: 0 0 8px rgba(60, 40, 20, 0.2);
    }

    .ink-trace-line {
      position: absolute;
      left: 10%;
      right: 10%;
      bottom: 32%;
      height: 0;
      border-bottom: 1px dashed rgba(100, 70, 30, 0.3);
      animation: inkShimmer 3s ease-in-out infinite 0.5s;
    }

    @keyframes inkShimmer {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    /* ── 异象动画 ── */
    .ink-trace-suojian.anomaly-glow {
      opacity: 1 !important;
      color: rgba(60, 40, 20, 0.9);
      filter: blur(0);
      text-shadow: 0 0 20px rgba(120, 80, 20, 0.6);
      transition: all 1s ease;
    }

    .scan-viewport.anomaly-phase1 {
      box-shadow:
        0 4px 30px rgba(0, 0, 0, 0.1),
        0 0 40px rgba(120, 80, 20, 0.2);
    }

    .scan-viewport.anomaly-phase2 {
      filter: sepia(0.4) brightness(1.1) hue-rotate(-10deg);
    }

    .scan-viewport.anomaly-phase3 {
      transform: scale(1.8);
      opacity: 0;
      filter: sepia(0.6) brightness(1.3) blur(4px);
    }

    /* ── Scan Toolbar ── */
    .scan-toolbar {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      transition: opacity 0.8s ease;
    }

    .scan-toolbar.fading-out {
      opacity: 0;
      pointer-events: none;
    }

    .scan-tool {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.7rem 1.4rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 24px;
      background: rgba(255, 252, 245, 0.8);
      backdrop-filter: blur(10px);
      font-family: var(--font-serif);
      font-size: 0.9rem;
      color: rgba(30, 25, 20, 0.7);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .scan-tool:hover {
      background: rgba(255, 250, 235, 0.95);
      border-color: rgba(180, 140, 60, 0.3);
      color: rgba(30, 25, 20, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .scan-tool.active {
      background: rgba(180, 140, 60, 0.12);
      border-color: rgba(180, 140, 60, 0.4);
      color: rgba(30, 25, 20, 1);
      box-shadow: 0 0 0 3px rgba(180, 140, 60, 0.1);
    }

    .scan-tool-icon {
      font-size: 1.1rem;
    }

    .scan-tool-check {
      display: none;
      color: rgba(80, 160, 80, 0.8);
      font-size: 0.8rem;
      font-weight: bold;
    }

    .scan-tool.used .scan-tool-check {
      display: inline;
    }

    /* ===========================
       Responsive
       =========================== */
    @media (max-width: 768px) {
      .scan-viewport {
        width: 90vw;
        height: 40vh;
      }
      .scan-toolbar {
        flex-wrap: wrap;
        justify-content: center;
      }
      .scan-tool {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
      }
      .ink-trace-suojian {
        font-size: 1.1rem;
      }
    }
    `;

    document.head.appendChild(style);
  }
}
