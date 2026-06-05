/**
 * 《卅一景》序章 — 残页
 *
 * 场景设定：美术学院旧楼三层，古画修复工作室，白天
 * 玩家扮演研究生沈念，在导师周鹤年指导下接手第三十一景数字化修复任务。
 *
 * 完整流程：
 *   1. 章节标题淡入淡出「序章 · 残页」
 *   2. 场景描写旁白（沈念视角）
 *   3. 节拍1 · 周鹤年对话气泡（5段）
 *   4. 节拍2 · 扫描比对谜题（三工具渐进发现）
 *   5. 节拍3 · 跌入画中转场（墨迹扩散 + 过渡文字 + 回声）
 *   6. 序章完成 → 收集修复笔记本 → 解锁第一章 → 返回菜单
 */

import GameSceneBase from './game-scene.js';
import ScannerUI from '../components/scanner-ui.js';
import FallTransition from '../components/fall-transition.js';

const prologueBg = '/images/prologue-workshop.png';
const paintingImg = '/images/scene-31-painting.png';

/* ==================== 叙事文本 ==================== */

/** 场景描写旁白（沈念视角） */
const SCENE_NARRATIONS = [
  '工作室在美术学院旧楼的三层，窗外是梧桐树。',
  '面前的操作台上，一台高精度扫描仪正在低声嗡鸣。屏幕上，一页泛黄的册页被放大到纤维可辨的程度。',
  '这是《拙政园三十一景图》体系中编号为第三十一景的一页数字化扫描件。',
];

/** 周鹤年对话序列（气泡框显示） */
const ZHOU_DIALOGUE = [
  '三十一景图你应该熟悉。本科课上讲过。',
  '现存册页体系完整，学界一般认为内容已无重大缺页问题。公开数据库里，这一页也一直被视为正常的最后一景。',
  '但这次高精度扫描发现了几个异常。不是它不像文徵明画的。恰恰相反，它太稳、太完整，像一页被处理得很干净的正式作品。',
  '真正奇怪的是边缘、背纸和装裱层。那里有些东西被压住了。',
  '你自己看。明天中午之前，我们要提交初版修复报告。如果没有足够证据，这一页会按"无异常"归档。',
];

/** 三工具发现反馈文本 */
const TOOL_FEEDBACK = {
  magnifier: '装裱接缝处有重叠痕迹，边框似乎压住了旧题签的一角。',
  fiber: '背纸与其他三十页不完全一致，显示此页曾经重装；画心本身较稳定，并非整幅新画。',
  sidelight: '装裱边下方隐约显出旧字残痕："……所见"；旁边有一条极淡的低位构图辅助线。',
};

/** 三工具全部使用后的提示 */
const ALL_TOOLS_HINT = '三种检测都完成了。在侧光模式下，残字与辅助线的交会处似乎在微微发光……';

/* ==================== 场景阶段 ==================== */

const PHASE = {
  TITLE: 0,
  NARRATION: 1,
  DIALOGUE: 2,
  SCANNER: 3,
  TRANSITION: 4,
  COMPLETE: 5,
};

/* ==================== 序章场景类 ==================== */

export default class PrologueScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
    this._phase = PHASE.TITLE;
    this._scannerUI = null;
    this._fallTransition = null;
    this._dialogueBubbleEl = null;
    this._autoFeedbackTimer = null;
  }

  /* ==================== 生命周期 ==================== */

  async enter(container) {
    const root = this._buildSceneShell({
      bgImage: prologueBg,
      theme: 'light',
    });

    container.innerHTML = '';
    container.appendChild(root);

    // 创建对话气泡容器
    this._createDialogueBubble();

    // 1. 章节阶段初始化（不再显示大字标题）
    this._phase = PHASE.TITLE;

    // 2. 场景描写旁白
    this._phase = PHASE.NARRATION;
    await this._showNarrationSequence(SCENE_NARRATIONS);
    this._hideNarration();

    // 短暂停顿，营造导师站在身后的氛围
    await this._delay(600);
    await this._showNarration('导师周鹤年站在你身后，双手背在身后，什么都没说。但你注意到他的目光，一直没有离开过这页画。');
    this._hideNarration();

    await this._delay(400);

    // 3. 周鹤年对话（气泡框）
    this._phase = PHASE.DIALOGUE;
    await this._playZhouDialogue();

    // 4. 进入扫描比对阶段
    this._phase = PHASE.SCANNER;
    await this._showNarration('（使用下方工具检查这页画……）');
    this._hideNarration();
    await this._enterScannerPhase();
  }

  exit() {
    clearTimeout(this._autoFeedbackTimer);
    // 清理扫描界面
    if (this._scannerUI) {
      this._scannerUI.destroy();
      this._scannerUI = null;
    }
    // 清理转场
    if (this._fallTransition) {
      this._fallTransition.destroy();
      this._fallTransition = null;
    }
    // 清理对话气泡
    if (this._dialogueBubbleEl) {
      this._dialogueBubbleEl.remove();
      this._dialogueBubbleEl = null;
    }
    super.exit();
  }

  /* ==================== 对话气泡系统 ==================== */

  /**
   * 创建人物对话气泡 DOM
   * @private
   */
  _createDialogueBubble() {
    const container = document.createElement('div');
    container.className = 'dialogue-bubble-container';
    container.id = 'dialogue-bubble-container';

    container.innerHTML = `
      <div class="dialogue-bubble" id="dialogue-bubble">
        <div class="dialogue-bubble-speaker" id="dialogue-bubble-speaker"></div>
        <div class="dialogue-bubble-text" id="dialogue-bubble-text"></div>
        <div class="dialogue-bubble-indicator" id="dialogue-bubble-indicator">▼ 点击继续</div>
      </div>
    `;

    this._root.appendChild(container);
    this._dialogueBubbleEl = container;
    this._bubbleSpeaker = container.querySelector('#dialogue-bubble-speaker');
    this._bubbleText = container.querySelector('#dialogue-bubble-text');
    this._bubbleIndicator = container.querySelector('#dialogue-bubble-indicator');
  }

  /**
   * 在气泡框中显示一行角色对话（打字机效果），点击后 resolve
   * @param {string} speaker — 说话人名字
   * @param {string} text — 对话内容
   * @returns {Promise<void>}
   * @private
   */
  _showBubbleDialogue(speaker, text) {
    return new Promise((resolve) => {
      // 设置说话人
      this._bubbleSpeaker.textContent = speaker;

      // 隐藏指示器
      this._bubbleIndicator.style.display = 'none';

      // 显示气泡
      this._dialogueBubbleEl.classList.add('visible');

      // 打字机效果
      this._bubbleText.textContent = '';
      let i = 0;
      const typeSpeed = 45;

      const typeTimer = setInterval(() => {
        if (i < text.length) {
          this._bubbleText.textContent += text[i];
          i++;
        } else {
          clearInterval(typeTimer);
          this._bubbleIndicator.style.display = 'block';
        }
      }, typeSpeed);

      // 点击处理
      const bubble = this._dialogueBubbleEl.querySelector('#dialogue-bubble');
      const clickHandler = () => {
        if (i < text.length) {
          // 跳过打字，直接显示完整文本
          clearInterval(typeTimer);
          this._bubbleText.textContent = text;
          i = text.length;
          this._bubbleIndicator.style.display = 'block';
        } else {
          // 推进到下一行
          bubble.removeEventListener('click', clickHandler);
          resolve();
        }
      };

      bubble.addEventListener('click', clickHandler);

      // 记录到叙事日志
      this.engine.emit('narration-logged', {
        text: `${speaker}：${text}`,
        chapter: this.engine.currentChapter,
        scene: 'prologue',
      });
    });
  }

  /**
   * 隐藏对话气泡
   * @private
   */
  _hideBubbleDialogue() {
    if (this._dialogueBubbleEl) {
      this._dialogueBubbleEl.classList.remove('visible');
    }
  }

  /**
   * 播放周鹤年对话序列
   * @private
   */
  async _playZhouDialogue() {
    for (const line of ZHOU_DIALOGUE) {
      await this._showBubbleDialogue('周鹤年', line);
    }
    this._hideBubbleDialogue();

    // 对话完成后短暂停顿
    await this._delay(300);
  }

  /* ==================== 扫描比对阶段 ==================== */

  /**
   * 进入扫描比对谜题
   * @private
   */
  async _enterScannerPhase() {
    // 隐藏旁白面板
    this._hideNarration();

    // 短暂延迟后显示扫描界面
    await this._delay(500);

    this._scannerUI = new ScannerUI({
      mainImage: paintingImg,
      onToolUsed: (toolId, allUsed) => this._onToolUsed(toolId, allUsed),
      onIntersectionClick: () => this._onIntersectionClick(),
      onFeedback: (text) => this._showNarration(text),
    });

    // 挂载到场景根元素
    this._scannerUI.mount(this._root);
  }

  /**
   * 工具使用回调（非阻塞：旁白面板在扫描界面下层，不能用 click-to-advance）
   * @param {string} toolId
   * @param {boolean} allUsed — 是否三种工具都已使用
   * @private
   */
  _onToolUsed(toolId, allUsed) {
    // 显示该工具的发现反馈（自动消失，不阻塞）
    const feedback = TOOL_FEEDBACK[toolId];
    if (feedback) {
      this._showAutoFeedback(feedback);
    }

    // 三工具全部使用后，给出提示并切换到侧光
    if (allUsed) {
      setTimeout(() => {
        this._showAutoFeedback(ALL_TOOLS_HINT, 3500);
        // 提示消失后自动切换到侧光模式，显示交会热点
        setTimeout(() => {
          this._hideNarration();
          this._scannerUI.activateSidelight();
        }, 3800);
      }, 3500);
    }
  }

  /**
   * 在旁白面板显示反馈文字，自动消失（不需要玩家点击）
   * @param {string} text
   * @param {number} [duration=3000] — 显示时长（毫秒）
   * @private
   */
  _showAutoFeedback(text, duration = 3000) {
    // 提升旁白面板 z-index 到扫描界面之上
    this._narrationPanel.style.zIndex = '20';
    this._narrationPanel.classList.add('gs-narration--visible');
    this._narrationIndicator.style.display = 'none';
    this._narrationText.textContent = text;

    this.engine.emit('narration-logged', {
      text,
      chapter: this.engine.currentChapter,
      scene: 'prologue',
    });

    // 自动隐藏
    clearTimeout(this._autoFeedbackTimer);
    this._autoFeedbackTimer = setTimeout(() => {
      this._narrationPanel.classList.remove('gs-narration--visible');
    }, duration);
  }

  /**
   * 交会热点点击 → 触发跌入画中
   * @private
   */
  async _onIntersectionClick() {
    this._phase = PHASE.TRANSITION;

    // 获取点击位置（墨迹扩散起点）
    const origin = this._scannerUI.getIntersectionOrigin();

    // 收集修复笔记本
    this.engine.collectItem({
      id: 'notebook',
      name: '修复笔记本',
      description: '导师给你的笔记本，封面写着"修复记录——三十一景图"。扉页夹着一张便签，是周老师的字："修复古画的第一课，不是把缺的补上，是理解它为什么缺。"',
      icon: '📓',
    });

    // 隐藏扫描界面旁白
    this._hideNarration();

    // 播放跌入转场
    this._fallTransition = new FallTransition();
    await this._fallTransition.play(origin);

    // 标记序章完成
    this._phase = PHASE.COMPLETE;
    this.engine.gameProgress.prologue = true;
    this.engine.gameProgress.chapter1 = true;
    this.engine.saveProgress();

    // 清理转场元素
    this._fallTransition.destroy();
    this._fallTransition = null;

    // 返回菜单（第一章解锁后可进入）
    this._root.classList.add('game-scene--exiting');
    setTimeout(() => this.engine.switchScene('menu'), 600);
  }

  /* ==================== 工具方法 ==================== */

  /**
   * 延迟
   * @param {number} ms
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
