/**
 * 《卅一景》序章 — 残页
 *
 * 场景设定：美术学院旧楼三层，古画修复工作室，白天
 * 玩家扮演研究生沈念，在导师周鹤年指导下接手第三十一景数字化修复任务。
 *
 * 完整流程：
 *   1. 场景描写旁白（沈念视角）
 *   2. 导师出场旁白 → 周鹤年对话气泡（5段）
 *   3. 弹出"查看古画"按钮
 *   4. 点击后进入古画查看器（3/4 画面 + 右侧工具栏）
 *   5. 使用工具 → 点击古画找线索 → 线索弹窗
 *   6. 找齐3条线索 → 汇聚动画 → 跌入画中转场
 *   7. 序章完成 → 解锁第一章 → 进入画中世界
 */

import GameSceneBase from './game-scene.js';
import PaintingViewer from '../components/painting-viewer.js';
import FallTransition from '../components/fall-transition.js';
import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';

const prologueBg = '/images/prologue/prologue-workshop.png';
const paintingImg = '/images/prologue/scan-painting.png';

/* ==================== 叙事文本 ==================== */

/**
 * 序章脚本流：旁白 + 周鹤年开场白，全部通过左下角对话坞逐句播放。
 * speaker 为 null 表示旁白，否则显示说话人名。
 */
const PROLOGUE_SCRIPT = [
  { speaker: null, text: '工作室在美术学院旧楼的三层，窗外是梧桐树。你面前的操作台上，高精度扫描仪正在低声嗡鸣。' },
  { speaker: null, text: '屏幕上，一页泛黄的册页被放大到纤维可辨的程度。这是《拙政园三十一景图》体系中编号为第三十一景的一页数字化扫描件。' },
  { speaker: null, text: '导师周鹤年站在你身后，双手背在身后，什么都没说。但你注意到他的目光，一直没有离开过这页画。' },
  { speaker: null, text: '操作台旁边摞着几本旧笔记，封面上的字迹是周老师的，年份标注是九十年代。书脊磨得很旧。' },
  { speaker: '周鹤年', portrait: '/images/common/zhou_henian_2.png', text: '三十一景图你应该熟悉。本科课上讲过。' },
  { speaker: '周鹤年', portrait: '/images/common/zhou_henian_2.png', text: '这套册页一直保存得不错，三十一页都在，学界也没人觉得内容上有什么缺漏。数据库里，这一页就是正常的最后一景。' },
  { speaker: '周鹤年', portrait: '/images/common/zhou_henian_2.png', text: '但这次高精度扫描出来，边缘和装裱层底下有几个地方不太对。表面看着没问题，放大到纤维层才发现的。' },
  { speaker: null, text: '太完整反而是异常——这个判断你在修复课上听过。五百年的册页没有任何修补痕迹，说明有人刻意处理过表面。' },
  { speaker: '周鹤年', portrait: '/images/common/zhou_henian_2.png', text: '不是画面本身有问题。是有些东西被压在了下面。' },
  { speaker: '周鹤年', portrait: '/images/common/zhou_henian_2.png', text: '你自己看。' },
  { speaker: null, text: '他顿了一下，目光从屏幕上移开。' },
  { speaker: '周鹤年', portrait: '/images/common/zhou_henian_2.png', text: '明天中午之前，我们要提交初版修复报告。如果没有足够证据，这一页会按"无异常"归档。' },
  { speaker: '周鹤年', portrait: '/images/common/zhou_henian_2.png', text: '不用急着下结论。先把你观察到的东西记下来。' },
  { speaker: null, text: '你坐到扫描仪前。屏幕上是第三十一景的高精度扫描件。' }
];

/** 三处线索的完整定义 */
const CLUE_DATA = {
  clue_margin: {
    id: 'clue_margin',
    title: '装裱接缝残角',
    desc: '装裱边缘压住了一小片旧标签。它和画本身的纸不一样，边缘还有刀裁过的痕迹。原来的标签大部分被裁掉了，只剩这一角被新边框压住。',
    askText: '旧标签被裁掉只留了残角，这说明什么？',
    recordText: '[线索] 装裱接缝残角 — 旧标签被裁去，只剩被新边框压住的一角',
  },
  clue_text: {
    id: 'clue_text',
    title: '"……所见"残字',
    desc: '侧光下，装裱边的下方隐约浮现两个残字："……所见"。笔迹很细，不像正式题字，更像边上曾经写过的小字，后来被装裱层压住了。',
    askText: '装裱层下的"所见"残字为什么会被压住？',
    recordText: '[线索] "……所见"残字 — 装裱层下被压住的边上小字',
  },
  clue_line: {
    id: 'clue_line',
    title: '底层细线',
    desc: '一条极淡的线横贯画面下方，比裂纹更直，也不像普通折痕。它不像画面内容，却一直留在那里，正式记录里也没有提到。',
    askText: '画面下方这条极淡的线可能是什么？',
    recordText: '[线索] 底层细线 — 画面下方有一条不属于画面内容的极淡细线',
  },
};

/* ==================== 场景阶段 ==================== */

const PHASE = {
  NARRATION: 1,
  DIALOGUE: 2,
  PROMPT: 3,       // 等待玩家点击"查看古画"
  PAINTING: 4,     // 古画查看器界面
  CONVERGENCE: 5,
  TRANSITION: 6,
  COMPLETE: 7,
};

const CHECKPOINTS = {
  START: 'prologue_start',
  SCAN: 'prologue_scan_start',
  SYNTHESIS: 'prologue_synthesis_start',
  CHAPTER1: 'chapter1_lanxue_start'
};

/* ==================== 序章场景类 ==================== */

export default class PrologueScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
    this._phase = PHASE.NARRATION;
    this._paintingViewer = null;
    this._fallTransition = null;
    this._introTransition = null;
    this._narrationBar = null;
    this._notebook = null;
    this._hud = null;
    this._inventoryPopup = null;
    this._activeGateId = null;
    this._synthesisGateStarted = false;
    this._synthesisGateOff = null;
    this._synthesisBtnShown = false;
    this._recordedClues = new Set(); // 防重复标记
    this._transitionStarted = false;
  }

  /* ==================== 生命周期 ==================== */

  async enter(container) {
    const root = this._buildSceneShell({
      bgImage: prologueBg,
      theme: 'light',
    });

    container.innerHTML = '';
    container.appendChild(root);

    // 确保无论何时进入工作室，都是“现实世界”主题
    this.engine.currentChapter = 0;
    this.engine.currentWorld = 'real';
    this.engine._applyWorldTheme();

    // 隐藏基类底部旁白面板 —— 序章全程改用左下角对话坞
    this._hideNarration();
    if (this._narrationPanel) this._narrationPanel.style.display = 'none';

    // 创建并挂载新组件
    this._narrationBar = new NarrationBar(this.engine);
    this._narrationBar.mount(root);

    this._notebook = new NotebookFloating(this.engine);
    this._notebook.mount(root);
    this._notebook.hide();

    this._hud = new HudBar(this.engine);
    this._hud.mount(root);
    this._hud.hide();

    this._inventoryPopup = new InventoryPopup(this.engine);
    this._inventoryPopup.mount(root);

    // 绑定 HUD 事件
    this._hud.onNotebookClick(() => {
      if (this._notebook.isExpanded()) {
        this._notebook.collapse();
      } else {
        this._notebook.expand();
      }
    });
    this._hud.onInventoryClick(() => {
      this._inventoryPopup.open();
    });

    // 绑定 Notebook 提交事件
    this._notebook.onSubmit(async (text) => {
      if (this._activeGateId) {
        // 研讨模式：discussion-gate 内部会显示玩家消息
        await this.engine.discussionManager.handleQuickThought(text);
      } else {
        // 普通查阅：_askNotebook 内部会显示玩家消息
        await this._askNotebook(text);
      }
    });

    this._notebook.onQuickThought(async (text) => {
      if (this._activeGateId) {
        await this.engine.discussionManager.handleQuickThought(text);
      } else {
        await this._askNotebook(text);
      }
    });

    if (this.engine.currentCheckpointId === CHECKPOINTS.SCAN) {
      this._grantNotebookAccess({ saveCheckpoint: false });
      this._enterPaintingPhase();
      return;
    }

    if (this.engine.currentCheckpointId === CHECKPOINTS.SYNTHESIS) {
      this._grantNotebookAccess({ saveCheckpoint: false });
      this._enterPaintingPhase();

      // 先清空再逐个标记，避免 _markClueRecorded 因 Set 已含该 ID 而跳过 paintingViewer 同步
      this._recordedClues = new Set();
      Object.keys(CLUE_DATA).forEach((clueId) => this._markClueRecorded(clueId));

      this._notebook.hideToolSection();
      this._notebook.hideQuickThoughts();
      this._notebook.setPlaceholder('在此输入针对该线索的判断或讨论……');

      this._showSynthesisEntryButton();
      return;
    }

    if (!this.engine.gameProgress.prologue) {
      this.engine.saveCheckpoint?.(CHECKPOINTS.START, {
        chapter: 0,
        scene: 'prologue',
        world: 'real'
      });
      await this._waitForWorkshopVisible();

      this._phase = PHASE.DIALOGUE;

      // 1. 播放全部序章旁白与周鹤年对话
      for (const line of PROLOGUE_SCRIPT) {
        await this._narrationBar.playLine(line.speaker, line.text, { portrait: line.portrait });
      }

      // 2. 全部对话和旁白结束后（阶段③→④过渡），玩家获得修复笔记本
      this._grantNotebookAccess();

      // 在对话框内播放获得提示（不使用 await，使其与按钮同时出现）
      this._narrationBar.playLine('系统提示', '已获得【修复笔记本】与【物件匣】。你可在屏幕右下角点击打开它们查看详细记录或进行讨论。\n准备就绪后，点击屏幕中央的【查看古画】即可开始数字化扫描检查。');

      // 3. 弹出"查看古画"按钮
      this._phase = PHASE.PROMPT;
      this._showViewPaintingButton();
    } else {
      // 如果已经完成序章，进入自由探索
      this._notebook.show();
      this._hud.show();
      this._notebook.unlock();
      this._narrationBar.showFloating('工作室：你可以在这里整理线索，或者进入画中。');
    }
  }

  exit() {
    if (this._paintingViewer) {
      this._paintingViewer.destroy();
      this._paintingViewer = null;
    }
    if (this._fallTransition) {
      this._fallTransition.destroy();
      this._fallTransition = null;
    }
    if (this._introTransition) {
      this._introTransition.destroy();
      this._introTransition = null;
    }
    if (this._narrationBar) {
      this._narrationBar.unmount();
      this._narrationBar = null;
    }
    if (this._notebook) {
      this._notebook.unmount();
      this._notebook = null;
    }
    if (this._hud) {
      this._hud.unmount();
      this._hud = null;
    }
    if (this._inventoryPopup) {
      this._inventoryPopup.unmount();
      this._inventoryPopup = null;
    }
    if (this._synthesisBtn) {
      this._synthesisBtn.remove();
      this._synthesisBtn = null;
    }
    if (this._synthesisGateOff) {
      this._synthesisGateOff();
      this._synthesisGateOff = null;
    }
    // 清理"查看古画"按钮
    const promptBtn = document.getElementById('view-painting-prompt');
    if (promptBtn) promptBtn.remove();
    super.exit();
  }

  async _waitForWorkshopVisible() {
    await this._waitForImage(prologueBg);
    await this._nextFrame();
    await this._nextFrame();
    // 等待菜单过渡动画 overlay 完全淡出并从 DOM 移除（CSS transition 3s + remove）
    await this._waitForOverlayGone();
    // 背景图就位后再留一小段缓冲
    await this._delay(300);
  }

  /**
   * 等待菜单过渡动画 overlay 从 DOM 移除
   * menu.js 在 overlay fadeOut 3s 结束后调用 remove()，此处轮询检测
   * @private
   */
  _waitForOverlayGone() {
    return new Promise((resolve) => {
      const overlay = document.querySelector('.intro-transition-overlay');
      if (!overlay) { resolve(); return; }

      // Z 键快进：立即移除 overlay 并继续
      const onKey = (e) => {
        if (!(e.key === ' ' || e.key?.toLowerCase() === 'z' || e.code === 'KeyZ')) return;
        if (this._isTextInputActive()) return;
        e.preventDefault();
        cleanup();
        overlay.remove();
        resolve();
      };

      const check = () => {
        if (!document.querySelector('.intro-transition-overlay')) {
          cleanup();
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };

      const cleanup = () => {
        document.removeEventListener('keydown', onKey);
      };

      document.addEventListener('keydown', onKey);
      requestAnimationFrame(check);
    });
  }

  _waitForImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
      if (img.complete) resolve();
    });
  }

  _nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _grantNotebookAccess(options = {}) {
    const shouldSaveCheckpoint = options.saveCheckpoint !== false;
    this.engine.gameProgress.hasNotebook = true;

    if (!this.engine.inventory?.hasItem?.('notebook')) {
      this.engine.collectItem({
        id: 'notebook',
        name: '修复笔记本',
        description: '导师给你的笔记本，封面写着"修复记录——三十一景图"。扉页夹着一张便签，是周老师的字："修复古画的第一课，不是把缺的补上，是理解它为什么缺。"',
        icon: '📓',
      });
    }

    this._notebook.show();
    this._hud.show();
    this._hud.setNotebookDisabled(false);
    this._notebook.unlock();
    this._notebook.setPlaceholder('在此输入你想询问或记录的内容……');
    this._notebook.showQuickThoughts([
      '修复笔记本里有什么？',
      '拙政园三十一景是什么？',
      '文徵明与这套册页有什么关联？',
    ]);
    if (shouldSaveCheckpoint) {
      this.engine.saveCheckpoint?.(CHECKPOINTS.SCAN, {
        chapter: 0,
        scene: 'prologue',
        world: 'real'
      });
    }
  }

  /* ==================== "查看古画" 入口 ==================== */

  /**
   * 在工作室场景中央显示"查看古画"按钮
   * @private
   */
  _showViewPaintingButton() {
    const btn = document.createElement('button');
    btn.className = 'view-painting-btn';
    btn.id = 'view-painting-prompt';
    btn.innerHTML = `
      <span class="view-painting-label">查看古画</span>
    `;
    btn.addEventListener('click', () => {
      btn.classList.add('clicked');
      setTimeout(() => {
        btn.remove();
        this._enterPaintingPhase();
      }, 400);
    });
    this._root.appendChild(btn);

    // 入场动画
    requestAnimationFrame(() => btn.classList.add('visible'));
  }

  /* ==================== 古画查看阶段 ==================== */

  /**
   * 进入古画查看器
   * @private
   */
  _enterPaintingPhase() {
    this._phase = PHASE.PAINTING;

    // 显示沈念立绘（思考态），并向左偏移避免挡住古画
    this._narrationBar.setPortrait('/images/common/shennian_1.png');
    this._narrationBar.lockPortrait();


    // 进入扫描/探索阶段，锁定展开
    this._notebook.expand();
    this._notebook.lock(); 
    this._hud.setNotebookDisabled(true); // 📓按钮灰色禁用

    // 保持对话框样式，播放顺畅的引导提示（提示玩家将三个工具全部使用一遍）
    this._narrationBar.playLine('系统提示', '已进入古画数字化检测阶段。你可点击右下角【工具箱】选择工具对古画进行检测，并可在【修复笔记本】中与 AI 讨论这些工具的作用。请确保将三个工具全部使用一遍，之后即可在画面中寻找异常线索。');

    // 配置初始 Placeholder 和快捷问题
    this._notebook.setPlaceholder('在此输入针对检测工具的疑问……');
    this._notebook.showQuickThoughts([
      '放大镜能看到什么？',
      '纸质分析有什么用？',
      '侧光照射用来检查什么？'
    ]);

    this._paintingViewer = new PaintingViewer({
      imageUrl: paintingImg,
      onToolUsed: (toolId) => {
        // 将工具检测结果记入笔记本记录Tab
        const recordMap = {
          magnifier: '[检查] 放大镜 — 装裱接缝处有重叠痕迹，边框压住了旧题签的一角',
          fiber: '[检查] 纸质分析 — 背纸与其他三十页不一致，此页曾重装；画心本身较稳定',
          sidelight: '[检查] 侧光照射 — 装裱边下隐现旧字残痕"……所见"及一条极淡细线',
        };
        if (recordMap[toolId]) {
          this._notebook.addClueRecord(recordMap[toolId]);
        }
        // 派发事件供外部使用
        window.dispatchEvent(new CustomEvent('tool-used', { detail: { toolId } }));
      },
      onClueFound: (clueId) => {
        this._startDiscussionGate(clueId);
      },
      onAllCluesRecorded: () => {
        // 备用：如果未通过 _startDiscussionGate 路径触发
        if (!this._synthesisGateStarted && !this._synthesisBtnShown) {
          this._showSynthesisEntryButton();
        }
      },
      onConvergence: () => {
        this._onConvergenceClick();
      },
      onFeedback: (text) => {
        this._narrationBar.playLine('系统提示', text);
      },
    });

    this._paintingViewer.mount(this._root);

    // 显示工具
    const TOOLS = [
      { id: 'magnifier', icon: '🔍', label: '放大镜' },
      { id: 'fiber', icon: '🔬', label: '纸质分析' },
      { id: 'sidelight', icon: '💡', label: '侧光照射' }
    ];
    this._notebook.showToolSection(TOOLS);
    this._notebook.onToolClick((toolId) => {
      if (toolId) {
        this._paintingViewer.applyTool(toolId);
      } else {
        this._paintingViewer.clearTool();
      }
    });
  }

  /* ==================== 线索研讨（走对话坞） ==================== */

  /**
   * 发现线索后即时确认（玩家不需要推理，降低门槛）
   * 研讨降级为辅助讨论：自动确认后，仍可和周鹤年交流加深理解
   * @param {string} clueId
   * @private
   */
  _startDiscussionGate(clueId) {
    let gateId = '';
    if (clueId === 'clue_margin') {
      gateId = 'gate_prologue_margin';
    } else if (clueId === 'clue_text') {
      gateId = 'gate_prologue_text';
    } else if (clueId === 'clue_line') {
      gateId = 'gate_prologue_line';
    } else {
      return;
    }

    // === 发现即确认：不等待玩家推理，直接标记线索 ===
    // 研讨降级为辅助讨论，关键信息已在命中时反馈给玩家
    this._markClueRecorded(clueId);

    // 分发收集线索事件（供笔记本记录）
    const clueData = CLUE_DATA[clueId];
    if (clueData) {
      window.dispatchEvent(new CustomEvent('clue-collected', {
        detail: { text: clueData.recordText },
      }));
      // 更新快捷问题
      this._notebook.setPlaceholder('在此输入针对该线索的判断或讨论……');
      this._notebook.showQuickThoughts([clueData.askText]);
    }

    // 同一线索已在处理中或已完成时，只保留记录，不重复启动辅助讨论。
    if (this._activeGateId === gateId || this.engine.discussionManager.isGateCompleted(gateId)) {
      if (this._recordedClues.size >= 3) {
        this._showSynthesisEntryButton();
      }
      return;
    }
    this._activeGateId = gateId;

    // 如果三条线索都找齐了，仍然启动辅助讨论，但在画面下方显示进入研讨按钮
    if (this._recordedClues.size >= 3) {
      // 启动第三条线索的辅助讨论
      const onGateCompleted = (data) => {
        if (data.gateId === gateId) {
          off();
          this._activeGateId = null;
        }
      };
      const off = this.engine.on('gate-completed', onGateCompleted);
      this.engine.discussionManager.startGate(gateId, this._createNotebookGateAdapter());

      // 延迟在画面下方显示"进入综合研讨"按钮（等线索提示完全消失后）
      setTimeout(() => {
        this._showSynthesisEntryButton();
      }, 6500);
      return;
    }

    // === 启动辅助讨论（可选，不阻塞进度）===
    // 自动在对话坞展示线索说明，玩家可继续追问，但不影响通关
    const onGateCompleted = (data) => {
      if (data.gateId === gateId) {
        off();
        this._activeGateId = null;
      }
    };
    const off = this.engine.on('gate-completed', onGateCompleted);

    // 辅助讨论不隐藏笔记本（笔记本保持锁定展开）
    this.engine.discussionManager.startGate(gateId, this._createNotebookGateAdapter());
  }

  /**
   * 在对话框中提示进入综合研讨
   * @private
   */
  async _showSynthesisEntryButton() {
    if (this._synthesisBtnShown) return;
    this._synthesisBtnShown = true;

    // 创建“开启推理研讨”按钮并挂载
    this._synthesisBtn = document.createElement('button');
    this._synthesisBtn.className = 'hud-btn prologue-synthesis-btn';
    this._synthesisBtn.innerHTML = '<span class="hud-btn-label">开启推理研讨</span>';
    this._synthesisBtn.addEventListener('click', () => {
      if (this._synthesisBtn) {
        this._synthesisBtn.remove();
        this._synthesisBtn = null;
      }
      this._startSynthesisGate();
    });
    this._root.appendChild(this._synthesisBtn);

    // 清空任何正在显示的短反馈
    this._narrationBar.dismiss();

    // 播放较平滑的引导文本
    await this._narrationBar.playLine('系统提示', '三处异常痕迹已找齐。可在【记录】页查看，也可在【对话】页继续讨论。准备就绪后，点击【开启推理研讨】即可继续。');
  }

  /**
   * 启动三线索综合研讨门槛
   * @private
   */
  _startSynthesisGate() {
    const gateId = 'gate_prologue_synthesis';
    if (this._synthesisGateStarted) return;
    if (this._recordedClues.size < 3) return;

    this._synthesisGateStarted = true;
    this.engine.saveCheckpoint?.(CHECKPOINTS.SYNTHESIS, {
      chapter: 0,
      scene: 'prologue',
      world: 'real'
    });

    if (this._activeGateId && this._activeGateId !== gateId) {
      this.engine.discussionManager.closeDiscussion(this._activeGateId);
    }
    this._activeGateId = gateId;

    // 隐藏工具区，进入研讨态
    this._notebook.hideToolSection();
    this._notebook.hideQuickThoughts();
    this._notebook.show();
    this._notebook.expand();
    this._notebook.lock();
    this._notebook.setSynthesisMode(true);
    this._notebook.switchTab('chat');

    // 清理之前的单条讨论消息，干净开始研讨
    this._notebook.clearChat();

    // 播放新的综合研讨系统提示
    this._narrationBar.playLine('系统提示', '已进入综合研讨。你可以在右侧的【综合研讨】页与 AI 对话，推导痕迹背后的真相；随时可在【记录】页查阅已收集的线索。得出结论后，点击【确认这个推断】即可继续。');

    this._notebook.setPlaceholder('在此输入你对这三处痕迹之间关系的判断……');

    // 持久提示：告知玩家当前处于研讨阶段
    this._paintingViewer?.showPersistentFeedback('开始综合研讨：去右侧【修复笔记本】里分析这三处痕迹的联系吧');

    this._synthesisGateOff = this.engine.on('gate-completed', (data) => {
      if (data.gateId !== gateId) return;

      this._synthesisGateOff?.();
      this._synthesisGateOff = null;
      this._activeGateId = null;

      this.engine.gameProgress.synthesisPassed = true;

      // 将研讨结论摘要记入笔记本记录Tab，供后续章节查阅
      this._notebook.addClueRecord('[结论] 三处痕迹共同指向：画本身还在，画面之外的来源说明被后来的整理和装裱压住了');

      this._notebook.setSynthesisMode(false);
      this._notebook.unlock();
      this._notebook.setPlaceholder('在此输入针对线索整理的疑问或判断……');
      this._notebook.hideQuickThoughts();
      this._notebook.collapse();

      // 隐藏研讨持久提示
      this._paintingViewer?.hideFeedback();
      this._paintingViewer?.triggerConvergence();
    });

    this.engine.discussionManager.startSynthesisGate(gateId, this._createNotebookGateAdapter({
      openingPrefix: '周老师批注',
      systemPrefix: '研讨记录',
    }));
  }

  /**
   * 把 NotebookFloating 适配成研讨 UI 回调接口
   * @returns {Object}
   * @private
   */
  _createNotebookGateAdapter(options = {}) {
    const openingPrefix = options.openingPrefix || '周老师批注';
    const systemPrefix = options.systemPrefix || '线索';
    const formatNotebookReply = (text) => {
      if (!text) return text;
      if (text.startsWith('（')) return text;
      if (text.startsWith(`${openingPrefix}：`)) return text;
      return `${openingPrefix}：${text}`;
    };

    return {
      showOpening: (title, text) => {
        this._notebook.showSystemMessage(`${systemPrefix}：${title}`);
        if (text) this._notebook.showNPCMessage(formatNotebookReply(text));
      },
      showQuickThoughts: (thoughts) => this._notebook.showQuickThoughts(thoughts),
      showNPCMessage: (text) => this._notebook.showNPCMessage(formatNotebookReply(text)),
      showPlayerMessage: (text) => this._notebook.showPlayerMessage(text),
      showSystemMessage: (text) => this._notebook.showSystemMessage(text),
      setLoading: (value) => this._notebook.setLoading(value),
      showConfirmButton: (cb) => this._notebook.showConfirmButton(cb),
      hideConfirmButton: () => this._notebook.hideConfirmButton(),
      showPassEffect: (title) => this._notebook.showPassEffect(title),
      setOfflineMode: () => {},
    };
  }

  /**
   * 统一处理修复笔记本查询，确保快捷按钮和手动输入行为一致
   * @param {string} text
   * @private
   */
  async _askNotebook(text) {
    if (!text?.trim()) return;

    this._notebook.showPlayerMessage(text);
    this._notebook.setLoading(true);

    try {
      const reply = await this.engine.aiService.queryNotebook(text);
      this._notebook.showNPCMessage(reply);
    } catch (err) {
      console.error('[PrologueScene] 笔记本查询失败:', err);
      this._notebook.showNPCMessage('（翻了翻，没有找到相关记录）');
    } finally {
      this._notebook.setLoading(false);
    }
  }

  /**
   * 标记线索已记录（防重复）
   * @param {string} clueId
   * @private
   */
  _markClueRecorded(clueId) {
    if (!this._recordedClues.has(clueId)) {
      this._recordedClues.add(clueId);
    }
    this.engine.gameProgress.cluesFound = Array.from(this._recordedClues);
    if (this._paintingViewer) {
      this._paintingViewer.markClueRecorded(clueId);
    }
  }

  /* ==================== 汇聚 → 跌入转场 ==================== */

  /**
   * 交会点点击 → 跌入画中
   * @private
   */
  async _onConvergenceClick() {
    if (this._transitionStarted) return;
    this._transitionStarted = true;
    this._phase = PHASE.TRANSITION;

    // 解除立绘锁定，后续对话可正常切换立绘
    this._narrationBar.unlockPortrait();


    const origin = { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };

    // 记录状态变量
    this.engine.gameProgress.foundMarginTrace = true;

    await this._narrationBar.playLine(null, '你的手指在交会处停了一下。');
    await this._narrationBar.playLine('沈念', '「所见」……什么意思？', { portrait: '/images/common/shennian_2.png' });
    await this._narrationBar.playLine(null, '屏幕上的墨迹好像动了一下。');
    await this._narrationBar.playLine('沈念', '……是动了吗？不对，扫描件不会动。', { portrait: '/images/common/shennian_2.png' });
    await this._narrationBar.playLine(null, '你下意识想把手移开，但画面已经变了。');
    this._narrationBar.dismiss();

    // 播放跌入转场
    this._fallTransition = new FallTransition();
    await this._fallTransition.play(origin);

    // 标记序章完成
    this._phase = PHASE.COMPLETE;
    this.engine.gameProgress.prologue = true;
    this.engine.gameProgress.prologueComplete = true;
    this.engine.gameProgress.prologue_completed = true;
    this.engine.gameProgress.chapter1 = true;
    this.engine.saveCheckpoint?.(CHECKPOINTS.CHAPTER1, {
      chapter: 1,
      scene: 'chapter1',
      world: 'paint'
    });

    // 跌入画中：切换世界主题，进入第一章画中世界
    this.engine.currentWorld = 'paint';
    this.engine._applyWorldTheme();
    this.engine.emit('world-changed', { world: 'paint' });

    this._root.classList.add('game-scene--exiting');
    
    // 脱离 _fallTransition 防止在 exit() 中被立刻销毁
    const transition = this._fallTransition;
    this._fallTransition = null;

    // 创建一个纯色遮罩，用来在旧转场销毁和新场景加载之间平滑过渡
    const solidOverlay = document.createElement('div');
    solidOverlay.style.position = 'fixed';
    solidOverlay.style.inset = '0';
    solidOverlay.style.background = 'var(--wash-paper-gradient)';
    solidOverlay.style.zIndex = '9999';
    document.body.appendChild(solidOverlay);

    // 等待一帧让遮罩生效
    await new Promise(r => requestAnimationFrame(r));

    // 现在安全地销毁原有的跌入转场元素
    if (transition) transition.destroy();

    await this._playChapter1IntroTransition(async () => {
      if (solidOverlay.parentNode) solidOverlay.remove();
      await this.engine.switchScene('chapter1', true);
      await this._nextFrame();
    });
  }

  /* ==================== 工具方法 ==================== */

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _playChapter1IntroTransition(onReveal) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'intro-transition-overlay intro-transition-overlay--chapter1';

      const lines = [
        '兰雪堂，拙政园东部的入口。',
        '在画册里它只是几笔墨线和一块匾额。',
        '但此刻你站在它面前，石板微温，竹叶在无风中摇动。',
        '这座园，比它画出来的样子要深。'
      ];

      overlay.innerHTML = `
        <div class="prologue-transition-layout">
          <div class="intro-prologue-title">第一章 · 东园</div>
          <div class="intro-prologue-text"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      const textContainer = overlay.querySelector('.intro-prologue-text');
      const timers = [];
      let finished = false;

      const clearTimers = () => timers.forEach((timer) => clearTimeout(timer));
      const removeKeyHandler = () => document.removeEventListener('keydown', onKey);

      const finish = async (fast = false) => {
        if (finished) return;
        finished = true;
        clearTimers();
        removeKeyHandler();

        textContainer.querySelectorAll('span').forEach((line) => {
          line.style.opacity = '1';
          line.style.transform = 'translateY(0)';
        });

        await this._preloadImage('/images/chapter1/chapter1-lanxuetang.png');
        await onReveal?.();

        overlay.style.transition = fast ? 'opacity 0.4s ease' : 'opacity 1s ease';
        overlay.classList.remove('active');
        overlay.classList.add('fade-out');

        setTimeout(() => {
          overlay.remove();
          resolve();
        }, fast ? 450 : 1100);
      };

      const onKey = (e) => {
        if (!this._isFastForwardKey(e) || this._isTextInputActive()) return;
        e.preventDefault();
        finish(true);
      };
      document.addEventListener('keydown', onKey);

      timers.push(setTimeout(() => {
        overlay.classList.add('active');
        const title = overlay.querySelector('.intro-prologue-title');
        if (title) {
          title.style.opacity = '1';
          title.style.transform = 'translateY(0)';
        }
      }, 50));

      timers.push(setTimeout(() => {
        lines.forEach((line, index) => {
          const p = document.createElement('span');
          p.textContent = line;
          p.style.opacity = '0';
          p.style.transform = 'translateY(15px)';
          p.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
          p.style.display = 'block';
          textContainer.appendChild(p);

          timers.push(setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
          }, index * 1200));
        });

        const totalDuration = (lines.length - 1) * 1200 + 1200 + 3000;
        timers.push(setTimeout(() => finish(false), totalDuration));
      }, 1500));
    });
  }

  _isFastForwardKey(e) {
    return e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'KeyZ' || e.key?.toLowerCase() === 'z';
  }

  _preloadImage(src, timeout = 3000) {
    return new Promise((resolve) => {
      const img = new Image();
      const timer = setTimeout(resolve, timeout);
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
      img.src = src;
    });
  }
}
