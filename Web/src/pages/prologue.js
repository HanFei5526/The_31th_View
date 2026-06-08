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
import { PrologueDock } from '../components/prologue-dock.js';

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
  { speaker: '周鹤年', text: '不用急着下结论。先把你观察到的东西记下来，我们一处一处讨论。' },
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
    this._dock = null;
    this._activeGateId = null;
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

    // 创建并挂载左下角对话坞
    this._dock = new PrologueDock(this.engine);
    this._dock.mount(root);

    // 全局绑定对话处理：根据是否处于研讨门槛，路由玩家输入
    this._dock.bindDiscussion(
      async (text) => {
        if (this._activeGateId) {
          this.engine.discussionManager.handlePlayerInput(text);
        } else {
          // 通用闲聊模式
          this._dock.showPlayerMessage(text);
          this._dock.setLoading(true);
          this._dock._setInputState(true); // 正在请求时禁用输入
          const reply = await this.engine.aiService.chatWithZhou(text);
          this._dock.setLoading(false);
          this._dock.showNPCMessage(reply);
          this._dock._setInputState(false); // 恢复输入
        }
      },
      (text) => {
        if (this._activeGateId) {
          this.engine.discussionManager.handleQuickThought(text);
        }
      }
    );

    // 1+2. 逐句播放脚本（旁白 + 周鹤年开场白）
    this._phase = PHASE.DIALOGUE;
    for (const line of PROLOGUE_SCRIPT) {
      await this._dock.playLine(line.speaker, line.text);
    }

    // 3. 弹出"查看古画"按钮
    this._phase = PHASE.PROMPT;
    this._showViewPaintingButton();
    
    // 脚本播放结束，正式开放输入框，允许玩家随时进行通用闲聊
    if (this._dock) {
      this._dock._setInputState(false);
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
    if (this._dock) {
      this._dock.unmount();
      this._dock = null;
    }
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

    // 对话坞作为正式对话窗口保持完全可交互
    if (this._dock) {
      this._dock.setInteractive(true);
      // 可选：添加一条提示，告知玩家可以一边看一边讨论
      this._dock.showNPCMessage("你可以仔细观察这幅画，有任何发现随时告诉我。");
    }

    // 设置输入框状态为允许输入
    if (this._dock) {
      this._dock._setInputState(true);
    }

    this._paintingViewer = new PaintingViewer({
      imageUrl: '/images/prologue/拙政园鸟瞰_首屏.png',
      onToolUsed: (toolId) => {
        // 工具使用的反馈通过 PaintingViewer 内部处理
      },
      onClueFound: (clueId) => {
        this._startDiscussionGate(clueId);
      },
      onConvergence: () => {
        this._onConvergenceClick();
      },
      onFeedback: (text) => {
        // 可选：将反馈记录到叙事日志
        this.engine.emit('narration-logged', {
          text,
          chapter: this.engine.currentChapter,
          scene: 'prologue',
        });
      },
    });

    this._paintingViewer.mount(this._root);
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
    }

    // === 启动辅助讨论（可选，不阻塞进度）===
    // 自动在对话坞展示线索说明，玩家可继续追问，但不影响通关
    const onGateCompleted = (data) => {
      if (data.gateId === gateId) {
        off();
        this._activeGateId = null;
        // 讨论结束后恢复闲聊模式
        if (this._dock) {
          this._dock.setInteractive(true);
          this._dock._setInputState(false);
        }
      }
    };
    const off = this.engine.on('gate-completed', onGateCompleted);

    if (this._dock) {
      this._dock.setInteractive(true);
      this._dock._setInputState(false);
    }

    this.engine.discussionManager.startGate(gateId, this._dock);
  }

  /**
   * 标记线索已记录（防重复）
   * @param {string} clueId
   * @private
   */
  _markClueRecorded(clueId) {
    if (this._recordedClues.has(clueId)) return;
    this._recordedClues.add(clueId);
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
    this.engine.gameProgress.hasNotebook = true;
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
