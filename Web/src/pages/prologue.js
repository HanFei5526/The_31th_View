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
 *   7. 序章完成 → 收集修复笔记本 → 解锁第一章 → 返回菜单
 */

import GameSceneBase from './game-scene.js';
import PaintingViewer from '../components/painting-viewer.js';
import FallTransition from '../components/fall-transition.js';
import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';

const prologueBg = '/images/prologue-workshop.png';
const paintingImg = '/images/scene-31-painting.png';

/* ==================== 叙事文本 ==================== */

/**
 * 序章脚本流：旁白 + 周鹤年开场白，全部通过左下角对话坞逐句播放。
 * speaker 为 null 表示旁白，否则显示说话人名。
 */
const PROLOGUE_SCRIPT = [
  { speaker: null, text: '工作室在美术学院旧楼的三层，窗外是梧桐树。你面前的操作台上，高精度扫描仪正在低声嗡鸣。' },
  { speaker: null, text: '屏幕上，一页泛黄的册页被放大到纤维可辨的程度。这是《拙政园三十一景图》体系中编号为第三十一景的一页数字化扫描件。' },
  { speaker: null, text: '导师周鹤年站在你身后，双手背在身后，什么都没说。但你注意到他的目光，一直没有离开过这页画。' },
  { speaker: '周鹤年', text: '三十一景图你应该熟悉。本科课上讲过。' },
  { speaker: '周鹤年', text: '这套册页一直保存得不错，三十一页都在，学界也没人觉得内容上有什么缺漏。数据库里，这一页就是正常的最后一景。' },
  { speaker: '周鹤年', text: '但这次高精度扫描出来，边缘和装裱层底下有几个地方不太对。表面看着没问题，放大到纤维层才发现的。' },
  { speaker: '周鹤年', text: '不是画面本身有问题。是有些东西被压在了下面。' },
  { speaker: '周鹤年', text: '你自己看。明天中午之前，我们要提交初版修复报告。如果没有足够证据，这一页会按"无异常"归档。' },
  { speaker: '周鹤年', text: '不用急着下结论。先把你观察到的东西记下来，我们一处一处讨论。' }
];

/** 三处线索的完整定义 */
const CLUE_DATA = {
  clue_margin: {
    id: 'clue_margin',
    title: '装裱接缝残角',
    desc: '装裱边缘压住了一小片旧题签的残角。题签纸质与画心不同，边缘有被刀裁切过的痕迹——有人在重新装裱时，把原来的题签裁掉了大部分，只留下了被新边覆盖的这一角。',
    askText: '我在装裱接缝处发现了一小片被裁掉的旧题签残角，这说明什么？',
    recordText: '[线索] 装裱接缝残角 — 旧题签被刻意裁去，只留被覆盖的一角',
  },
  clue_text: {
    id: 'clue_text',
    title: '"……所见"残字',
    desc: '侧光下，装裱边的下方隐约浮现两个残字："……所见"。笔迹纤细，不像是文徵明的书风。倒更像是某种旁注——有人曾在这里标注过什么，后来被装裱层压在了下面。',
    askText: '装裱层下有两个残字"所见"，笔迹不像文徵明，这是谁写的？',
    recordText: '[线索] "……所见"残字 — 装裱层下的陌生笔迹旁注',
  },
  clue_line: {
    id: 'clue_line',
    title: '低位构图辅助线',
    desc: '一条极淡的墨线横贯画面下方，不是画面内容的一部分。这是一条构图辅助线——画家在正式落笔前用来确定视角高度的参考。它的位置异常地低，说明作画者的视线几乎与地面平齐。这不是站着画的。',
    askText: '画面下方有一条低位构图辅助线，视线几乎与地面平齐，这意味着什么？',
    recordText: '[线索] 低位构图辅助线 — 视线异常低，作画者非站立姿态',
  },
};

/* ==================== 场景阶段 ==================== */

const PHASE = {
  TITLE: 0,
  NARRATION: 1,
  DIALOGUE: 2,
  PROMPT: 3,       // 等待玩家点击"查看古画"
  PAINTING: 4,     // 古画查看器界面
  CONVERGENCE: 5,
  TRANSITION: 6,
  COMPLETE: 7,
};

/* ==================== 序章场景类 ==================== */

export default class PrologueScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
    this._phase = PHASE.TITLE;
    this._paintingViewer = null;
    this._fallTransition = null;
    this._narrationBar = null;
    this._notebook = null;
    this._hud = null;
    this._inventoryPopup = null;
    this._activeGateId = null;
    this._synthesisGateStarted = false;
    this._synthesisGateOff = null;
    this._synthesisBtnShown = false;
    this._recordedClues = new Set(); // 防重复标记
  }

  /* ==================== 生命周期 ==================== */

  async enter(container) {
    const root = this._buildSceneShell({
      bgImage: prologueBg,
      theme: 'light',
    });

    container.innerHTML = '';
    container.appendChild(root);

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
        // 普通查阅：手动显示玩家消息
        this._notebook.showPlayerMessage(text);
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

    // 1+2. 逐句播放脚本（旁白 + 周鹤年开场白）
    this._phase = PHASE.DIALOGUE;
    for (const line of PROLOGUE_SCRIPT) {
      await this._narrationBar.playLine(line.speaker, line.text, { portrait: line.portrait });
    }

    // 3. 弹出"查看古画"按钮
    this._phase = PHASE.PROMPT;

    // 对话结束后，玩家获得笔记本
    this.engine.gameProgress.hasNotebook = true;
    this._hud.show();
    this._notebook.show();
    // PROMPT阶段面板不锁定，可手动收缩
    this._notebook.unlock();
    this._notebook.setPlaceholder('翻阅笔记本……');
    this._notebook.showQuickThoughts([
      '拙政园三十一景是什么？',
      '修复笔记本里有什么？',
    ]);
    this._narrationBar.showFeedback('获得物件：修复笔记本');

    this._showViewPaintingButton();
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
    if (this._synthesisGateOff) {
      this._synthesisGateOff();
      this._synthesisGateOff = null;
    }
    this.engine.gatePanel?.unmount();
    // 清理"查看古画"按钮
    const promptBtn = document.getElementById('view-painting-prompt');
    if (promptBtn) promptBtn.remove();
    super.exit();
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
      <span class="view-painting-icon">🖼️</span>
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

    // 进入扫描/探索阶段，锁定展开
    this._notebook.expand();
    this._notebook.lock(); 
    this._hud.setNotebookDisabled(true); // 📓按钮灰色禁用

    // 配置初始 Placeholder 和快捷问题
    this._notebook.setPlaceholder('这个工具能看出什么？');
    this._notebook.showQuickThoughts([
      '放大镜能看到什么？',
      '纸质分析有什么用？',
      '侧光照射用来检查什么？'
    ]);

    this._paintingViewer = new PaintingViewer({
      imageUrl: '/images/prologue/拙政园鸟瞰_首屏.png',
      onToolUsed: (toolId) => {
        // 将工具检测结果记入笔记本记录Tab
        const recordMap = {
          magnifier: '[检查] 放大镜 — 装裱接缝处有重叠痕迹，边框压住了旧题签的一角',
          fiber: '[检查] 纸质分析 — 背纸与其他三十页不一致，此页曾重装；画心本身较稳定',
          sidelight: '[检查] 侧光照射 — 装裱边下隐现旧字残痕"……所见"及一条低位辅助线',
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
        // painting-viewer 自带 feedback 条，不重复在 narrationBar 显示
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

    // 同一线索已在处理中，忽略重复触发
    if (this._activeGateId === gateId) return;
    if (this.engine.discussionManager.isGateCompleted(gateId)) return;
    this._activeGateId = gateId;

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
      this._notebook.setPlaceholder('这条线索意味着什么？');
      this._notebook.showQuickThoughts([clueData.askText]);
    }

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
      }, 8000);
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
   * 在画面下方显示"进入综合研讨"按钮
   * @private
   */
  _showSynthesisEntryButton() {
    if (this._synthesisBtnShown) return;
    this._synthesisBtnShown = true;

    const btn = document.createElement('button');
    btn.className = 'synthesis-entry-btn';
    btn.textContent = '进入综合研讨：分析三处痕迹的关系';
    btn.addEventListener('click', () => {
      btn.remove();
      this._startSynthesisGate();
    });
    this._root.appendChild(btn);
    requestAnimationFrame(() => btn.classList.add('visible'));
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

    this._notebook.setPlaceholder('这三处痕迹之间有什么联系？写下你的判断……');

    // 持久提示：告知玩家当前处于研讨阶段
    this._paintingViewer?.showPersistentFeedback('综合研讨 — 在笔记本中分析三处痕迹之间的关系');

    this._synthesisGateOff = this.engine.on('gate-completed', (data) => {
      if (data.gateId !== gateId) return;

      this._synthesisGateOff?.();
      this._synthesisGateOff = null;
      this._activeGateId = null;

      this.engine.gameProgress.synthesisPassed = true;
      this.engine.saveProgress();

      // 将研讨结论摘要记入笔记本记录Tab，供后续章节查阅
      this._notebook.addClueRecord('[结论] 三处痕迹指向同一事实：有人在重新装裱时系统性地遮蔽了这幅画的来源信息');

      this._notebook.setSynthesisMode(false);
      this._notebook.unlock();
      this._notebook.setPlaceholder('继续整理这三处痕迹……');
      this._notebook.showQuickThoughts([
        '这意味着来源信息被遮蔽了吗？',
        '下一步应该看交会点'
      ]);

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
    const systemPrefix = options.systemPrefix || '研讨';
    const formatNotebookReply = (text) => {
      if (!text) return text;
      const zhouMatch = text.match(/^周鹤年：「([\s\S]*)」$/);
      if (zhouMatch) return `${openingPrefix}：${zhouMatch[1]}`;
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
    if (this._recordedClues.has(clueId)) return;
    this._recordedClues.add(clueId);
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
    this._phase = PHASE.TRANSITION;

    const origin = { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };

    // 收集修复笔记本
    this.engine.collectItem({
      id: 'notebook',
      name: '修复笔记本',
      description: '导师给你的笔记本，封面写着"修复记录——三十一景图"。扉页夹着一张便签，是周老师的字："修复古画的第一课，不是把缺的补上，是理解它为什么缺。"',
      icon: '📓',
    });

    // 记录状态变量
    this.engine.gameProgress.foundMarginTrace = true;

    // 播放跌入转场
    this._fallTransition = new FallTransition();
    await this._fallTransition.play(origin);

    // 标记序章完成
    this._phase = PHASE.COMPLETE;
    this.engine.gameProgress.prologue = true;
    this.engine.gameProgress.chapter1 = true;
    this.engine.saveProgress();

    // 清理转场
    this._fallTransition.destroy();
    this._fallTransition = null;

    // 跌入画中：切换世界主题，进入第一章画中世界
    this.engine.currentWorld = 'paint';
    this.engine._applyWorldTheme();
    this.engine.emit('world-changed', { world: 'paint' });

    this._root.classList.add('game-scene--exiting');
    setTimeout(() => this.engine.switchScene('chapter1'), 600);
  }

  /* ==================== 工具方法 ==================== */

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
