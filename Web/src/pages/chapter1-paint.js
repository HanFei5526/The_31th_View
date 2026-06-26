/**
 * 第一章 · 东园 — 画中世界
 *
 * 三子场景：兰雪堂 → 缀云峰 → 芙蓉榭（倒影翻转谜题）
 * 背景图使用文徵明原作（DP235624/630/621）
 */

import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';

const SCENE_STATES = {
  LANXUE: 'lanxue',
  ZHUIYUN: 'zhuiyun',
  FURONG: 'furong',
  PUZZLE: 'puzzle',
  LIGHT_DISCUSSION: 'light_discussion'
};

const CHECKPOINTS = {
  LANXUE: 'chapter1_lanxue_start',
  ZHUIYUN: 'chapter1_zhuiyun_start',
  FURONG: 'chapter1_furong_start',
  WORKSHOP: 'chapter1_workshop_start'
};

export default class Chapter1PaintScene {
  constructor(engine) {
    this.engine = engine;
    this.name = 'chapter1-paint';

    this.narrationBar = new NarrationBar(engine);
    this.notebook = new NotebookFloating(engine);
    this.hudBar = new HudBar(engine);
    this.inventoryPopup = new InventoryPopup(engine);
    this.state = SCENE_STATES.LANXUE;

    // 三张独立背景图
    this._bgLanxue = '/images/chapter1/chapter1-lanxuetang.png';
    this._bgZhuiyun = '/images/chapter1/chapter1-zhuiyunfeng.png';
    this._bgFurong = '/images/chapter1/chapter1-furongxie.png';

    // 存档状态
    this.engine.gameProgress.plaqueNoted = this.engine.gameProgress.plaqueNoted || false;
    this.engine.gameProgress.zhuiyunExplored = this.engine.gameProgress.zhuiyunExplored || false;

    // 运行时状态
    this._hairpinIdentified = false;
    this._isFlipped = false;
    this._isFlipping = false;
    this._idleTimer = null;
    this._isNarrating = false;

    this._container = null;
    this._sceneRoot = null;
    this._uiLayer = null;
    this._lightDiscussionSkipBtn = null;
    this._exited = false;
  }

  /* ==================== 生命周期 ==================== */

  enter(container) {
    this._exited = false;
    this._container = container;
    this.engine.currentChapter = 1;
    this.engine.currentWorld = 'paint';
    this._container.classList.remove('real-world');
    this._container.classList.add('paint-world');

    this.engine.ensureCarryoverForChapter?.(1, { persist: false });

    // UI 层：pointer-events:none 让点击穿透到场景，但组件自身恢复 auto
    this._uiLayer = document.createElement('div');
    this._uiLayer.className = 'scene-ui-layer';
    this._uiLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:10;';

    this.narrationBar.mount(this._uiLayer);
    this.notebook.mount(this._uiLayer);
    this.hudBar.mount(this._uiLayer);
    this.inventoryPopup.mount(this._uiLayer);

    this.hudBar.onNotebookClick(() => {
      if (this.notebook.isExpanded()) {
        this.notebook.collapse();
      } else {
        this.notebook.expand();
      }
    });
    this.hudBar.onInventoryClick(() => {
      this.inventoryPopup.open();
    });

    // 绑定 Notebook 提交事件
    this.notebook.onSubmit(async (text) => {
      if (this._activeGateId) {
        await this.engine.discussionManager.handleQuickThought(text);
      } else {
        await this._askNotebook(text);
      }
    });

    this.notebook.onQuickThought(async (text) => {
      if (this._activeGateId) {
        await this.engine.discussionManager.handleQuickThought(text);
      } else {
        await this._askNotebook(text);
      }
    });

    // 场景根节点
    this._sceneRoot = document.createElement('div');
    this._sceneRoot.className = 'ch1-scene';

    // 构建各子场景
    this._buildLanxueScene();
    this._buildZhuiyunScene();
    this._buildFurongScene();

    this._container.appendChild(this._sceneRoot);
    this._container.appendChild(this._uiLayer);

    this._unsubscribers = [];

    // 开始演出
    if (this.engine.currentCheckpointId === CHECKPOINTS.ZHUIYUN) {
      this._switchToZhuiyun();
    } else if (this.engine.currentCheckpointId === CHECKPOINTS.FURONG) {
      this._switchToFurong();
    } else {
      this.engine.saveCheckpoint?.(CHECKPOINTS.LANXUE, {
        chapter: 1,
        scene: 'chapter1',
        world: 'paint'
      });
      this._startSequence();
    }
  }

  async _askNotebook(text) {
    if (!text?.trim()) return;

    this.notebook.showPlayerMessage(text);
    this.notebook.setLoading(true);

    try {
      const reply = await this.engine.aiService.queryNotebook(text);
      this.notebook.showNPCMessage(reply);
    } catch (err) {
      console.error('[Chapter1Paint] 笔记本查询失败:', err);
      this.notebook.showNPCMessage('（翻了翻，没有找到相关记录）');
    } finally {
      this.notebook.setLoading(false);
    }
  }

  exit() {
    this._exited = true;
    this._clearIdleTimer();
    if (this._flipTimeout) {
      clearTimeout(this._flipTimeout);
      this._flipTimeout = null;
    }
    this.narrationBar.unmount();
    this._hideLightDiscussionSkipButton();
    this.notebook.unmount();
    this.hudBar.unmount();
    this.inventoryPopup.unmount();
    this._unsubscribers.forEach(fn => fn());
    if (this._sceneRoot) this._sceneRoot.remove();
    if (this._uiLayer) this._uiLayer.remove();
  }

  /* ==================== 构建场景 ==================== */

  _buildLanxueScene() {
    this._lanxueEl = document.createElement('div');
    this._lanxueEl.className = 'ch1-subscene';
    this._lanxueEl.style.backgroundImage = `url('${this._bgLanxue}')`;

    // 兰雪堂热点全部开放，玩家可按任意顺序探索。
    this._lanxueSpots = [];
    this._lanxueRequiredSpotIds = ['bamboo', 'stonePath', 'pillar', 'plaque'];
    this._lanxueVisitedSpots = new Set();
    this._lanxueExplorationComplete = false;

    // 氛围热点：翠竹（左侧竹林区域）— 1-7b
    const bambooSpot = this._createHotspot(16, 60, 12, async () => {
      if (this._isNarrating) return;
      this.narrationBar.showFloating('你拨开竹叶。沙沙作响，但手上没有感到风。');
      await this._markLanxueSpotVisited('bamboo', { delayBeforeCompletion: 900 });
    }, '翠竹');

    // 氛围热点：青石板路（底部路面）— 1-7a
    const stonePath = this._createHotspot(42, 93, 10, async () => {
      if (this._isNarrating) return;
      this.narrationBar.showFloating('你踩了踩脚下的石板。有些温热，纹理清晰得像刚刻上去的。');
      await this._markLanxueSpotVisited('stonePath', { delayBeforeCompletion: 900 });
    }, '青石板路');

    // 氛围热点：廊柱（建筑右侧）— 1-7c
    const pillarSpot = this._createHotspot(60.5, 63, 6, async () => {
      if (this._isNarrating) return;
      this.narrationBar.showFloating('你走到廊柱边，伸手碰了碰。木纹里藏着细密的墨线——这不是一根真正的柱子，它是一笔画出来的。');
      await this._markLanxueSpotVisited('pillar', { delayBeforeCompletion: 900 });
    }, '廊柱');

    // 叙事触发：匾额（建筑区域，必须点击才能推进）— 1-8~1-14
    const plaqueSpot = this._createHotspot(50, 38, 8, async () => {
      if (this._isNarrating) return;
      if (this.engine.gameProgress.plaqueNoted) {
        this.narrationBar.showFloating('兰雪堂匾额上，那道极细的横笔已经记在【修复笔记本】里。');
        this.notebook.collapse();
        await this._markLanxueSpotVisited('plaque', { delayBeforeCompletion: 900 });
        return;
      }
      this._isNarrating = true;
      await this.narrationBar.playLine(null, '你走近敞厅，抬头看向门楣上的匾额。');
      await this.narrationBar.playLine(null, '三个字——「兰雪堂」，落款是文徵明。字迹端正，墨色沉稳。');
      await this.narrationBar.playLine(null, '你本想移开视线，但不知为什么，目光停住了。你又看了一眼。');
      await this.narrationBar.playLine('沈念', '「兰」字的草字头……下面好像多了一道横笔。很细，几乎要看不见。', { portrait: '/images/common/shennian_3.png' });
      await this.narrationBar.playLine(null, '你凑近了一些。那一笔确实在那里——笔力很稳，墨色和主体一致，不像是无意的败笔。但它又不能单独解释成一个字。');
      await this.narrationBar.playLine('沈念', '奇怪。先记下来吧。', { portrait: '/images/common/shennian_2.png' });

      this.engine.gameProgress.plaqueNoted = true;
      this.notebook.addClueRecord('[线索] 匾额多余笔画 — 兰雪堂匾额"兰"字草字头下多了一道极细横笔，笔力稳定，墨色一致，非败笔');
      await this.narrationBar.playLine('系统提示', '已记录线索：「匾额多余笔画」。可在【记录】页查看，也可在【对话】页继续讨论。');

      await this.narrationBar.playLine('沈念', '这座厅后面还有路。石径延伸过去，像是有什么在更深处等着。', { portrait: '/images/common/shennian_1.png' });
      this.narrationBar.dismiss();
      this.notebook.collapse();
      this._isNarrating = false;
      await this._markLanxueSpotVisited('plaque');
    }, '匾额');

    this._lanxueSpots = [bambooSpot, stonePath, pillarSpot, plaqueSpot];
    this._lanxueSpots.forEach(spot => {
      spot.style.display = 'none';
      this._lanxueEl.appendChild(spot);
    });

    this._sceneRoot.appendChild(this._lanxueEl);
  }

  async _markLanxueSpotVisited(id, options = {}) {
    if (!this._lanxueVisitedSpots || this._lanxueVisitedSpots.has(id)) return;
    this._lanxueVisitedSpots.add(id);

    if (this._lanxueRequiredSpotIds.every(spotId => this._lanxueVisitedSpots.has(spotId))) {
      if (options.delayBeforeCompletion) {
        await this._delay(options.delayBeforeCompletion);
      }
      await this._completeLanxueExploration();
    }
  }

  _showLanxueHotspots() {
    if (!this._lanxueSpots) return;
    this._lanxueSpots.forEach(spot => {
      spot.style.display = '';
    });
  }

  async _completeLanxueExploration() {
    if (this._lanxueExplorationComplete) return;
    this._lanxueExplorationComplete = true;

    this._hideLanxueHotspots();
    this.narrationBar.dismiss();
    this._showLanxueArrow();

    this._isNarrating = true;
    await this.narrationBar.playLine('系统提示', '兰雪堂周围几处可疑细节已经看过了。可在【记录】页查看，也可在【对话】页继续讨论。也可以直接点击画面中央的光点，沿石径前往下一处场景。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;
  }

  _hideLanxueHotspots() {
    if (!this._lanxueSpots) return;
    this._lanxueSpots.forEach(spot => {
      spot.style.display = 'none';
    });
  }

  _showLanxueArrow() {
    if (this._lanxueArrow) return;
    this._lanxueArrow = this._createNavArrow(50, 70, 10, () => {
      if (this._isNarrating) return;
      this._switchToZhuiyun();
    }, '前往缀云峰');
    this._lanxueEl.appendChild(this._lanxueArrow);
  }

  _buildZhuiyunScene() {
    this._zhuiyunEl = document.createElement('div');
    this._zhuiyunEl.className = 'ch1-subscene';
    this._zhuiyunEl.style.backgroundImage = `url('${this._bgZhuiyun}')`;

    // 可选互动：石缝（峰石左下方）— 2-3~2-7
    const crackSpot = this._createHotspot(41, 75, 8, async () => {
      if (this._isNarrating) return;
      if (this.engine.gameProgress.zhuiyunExplored) {
        this._isNarrating = true;
        await this.narrationBar.playLine(null, '你再次蹲低，看向峰石背后的缝隙。那一线光仍在那里，只有把视线压到足够低时才会出现。');
        await this.narrationBar.playLine('系统提示', '已记录线索：「有些景，只从低处出现」。可在【记录】页查看，也可在【对话】页继续讨论。');
        this.narrationBar.dismiss();
        this.notebook.collapse();
        this._isNarrating = false;
        return;
      }
      this._isNarrating = true;
      await this.narrationBar.playLine(null, '你绕到峰石背后，注意到底部有一处极窄的石缝。');
      await this.narrationBar.playLine(null, '站着似乎看不到什么。你蹲下来，把视线压到石缝的高度。');
      await this.narrationBar.playLine(null, '缝隙里忽然露出远处水面的一线光——站着的时候完全看不见的光。');
      await this.narrationBar.playLine('沈念', '奇怪……站着的时候明明什么都看不到。这个角度，好像藏着什么。', { portrait: '/images/common/shennian_3.png' });

      this.engine.gameProgress.zhuiyunExplored = true;
      this.notebook.addClueRecord('有些景，只从低处出现。');
      await this.narrationBar.playLine('系统提示', '已记录线索：「有些景，只从低处出现」。可在【记录】页查看，也可在【对话】页继续讨论。');
      this.narrationBar.dismiss();
      this.notebook.collapse();
      this._isNarrating = false;

    }, '石缝');

    // 前进箭头 — 2-8（石缝为可选互动，不阻塞主线）
    this._zhuiyunArrow = this._createNavArrow(77.5, 65, 10, async () => {
      if (this._isNarrating) return;
      this._isNarrating = true;
      await this.narrationBar.playLine('沈念', '前面有水声。像是快到什么水边的建筑了。', { portrait: '/images/common/shennian_1.png' });
      this.narrationBar.dismiss();
      this._isNarrating = false;
      this._switchToFurong();
    }, '前往芙蓉榭');

    this._zhuiyunEl.appendChild(crackSpot);
    this._zhuiyunEl.appendChild(this._zhuiyunArrow);

    this._sceneRoot.appendChild(this._zhuiyunEl);
  }

  _buildFurongScene() {
    // 芙蓉榭容器（用于整体翻转）
    this._furongWrap = document.createElement('div');
    this._furongWrap.className = 'furong-wrap';

    // 背景层
    this._furongBg = document.createElement('div');
    this._furongBg.className = 'furong-bg';
    this._furongBg.style.backgroundImage = `url('${this._bgFurong}')`;
    this._furongWrap.appendChild(this._furongBg);

    // 芙蓉榭谜题交互追踪：允许玩家自由点击，用次数递进提示。
    this._furongRailingClicks = 0;
    this._furongWaterlineClicks = 0;
    this._furongReflectionClicks = 0;

    // 水面线
    this._waterline = document.createElement('div');
    this._waterline.className = 'furong-waterline';
    this._waterline.innerHTML = `
      <svg class="furong-waterline-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g class="furong-waterline-aura">
          <path class="furong-waterline-aura-path" d="M0.0 57.2 L3.0 57.6 L6.0 58.0 L9.0 58.2 L13.0 58.8 L15.8 57.8" />
          <path class="furong-waterline-aura-path" d="M13.5 58.5 L17.2 57.8" />
          <path class="furong-waterline-aura-path" d="M19.2 57.8 L21.0 57.8 L24.0 57.8 L27.0 56.8 L31.3 55.5" />
          <path class="furong-waterline-aura-path" d="M31.3 55.5 L34.0 54.8 L37.0 54.2" />
          <path class="furong-waterline-aura-path" d="M29.5 64.0 L52.0 65.0" />
          <path class="furong-waterline-aura-path" d="M76.1 66.0 C78.8 65.6 81.6 65.6 84.4 65.3" />
          <path class="furong-waterline-aura-path" d="M96.0 61.5 L100.0 57.0" />
        </g>
        <g class="furong-waterline-glow">
          <path class="furong-waterline-glow-path" d="M0.0 57.2 L3.0 57.6 L6.0 58.0 L9.0 58.2 L13.0 58.8 L15.8 57.8" />
          <path class="furong-waterline-glow-path" d="M13.5 58.5 L17.2 57.8" />
          <path class="furong-waterline-glow-path" d="M19.2 57.8 L21.0 57.8 L24.0 57.8 L27.0 56.8 L31.3 55.5" />
          <path class="furong-waterline-glow-path" d="M31.3 55.5 L34.0 54.8 L37.0 54.2" />
          <path class="furong-waterline-glow-path" d="M29.5 64.0 L52.0 65.0" />
          <path class="furong-waterline-glow-path" d="M76.1 66.0 C78.8 65.6 81.6 65.6 84.4 65.3" />
          <path class="furong-waterline-glow-path" d="M96.0 61.5 L100.0 57.0" />
        </g>
        <g class="furong-waterline-visible">
          <path class="furong-waterline-path" d="M0.0 57.2 L3.0 57.6 L6.0 58.0 L9.0 58.2 L13.0 58.8 L15.8 57.8" />
          <path class="furong-waterline-path" d="M13.5 58.5 L17.2 57.8" />
          <path class="furong-waterline-path" d="M19.2 57.8 L21.0 57.8 L24.0 57.8 L27.0 56.8 L31.3 55.5" />
          <path class="furong-waterline-path" d="M31.3 55.5 L34.0 54.8 L37.0 54.2" />
          <path class="furong-waterline-path" d="M29.5 64.0 L52.0 65.0" />
          <path class="furong-waterline-path" d="M76.1 66.0 C78.8 65.6 81.6 65.6 84.4 65.3" />
          <path class="furong-waterline-path" d="M96.0 61.5 L100.0 57.0" />
        </g>
        <g class="furong-waterline-hits">
          <path class="furong-waterline-hit" d="M0.0 57.2 L3.0 57.6 L6.0 58.0 L9.0 58.2 L13.0 58.8 L15.8 57.8" />
          <path class="furong-waterline-hit" d="M13.5 58.5 L17.2 57.8" />
          <path class="furong-waterline-hit" d="M19.2 57.8 L21.0 57.8 L24.0 57.8 L27.0 56.8 L31.3 55.5" />
          <path class="furong-waterline-hit" d="M31.3 55.5 L34.0 54.8 L37.0 54.2" />
          <path class="furong-waterline-hit" d="M29.5 64.0 L52.0 65.0" />
          <path class="furong-waterline-hit" d="M76.1 66.0 C78.8 65.6 81.6 65.6 84.4 65.3" />
          <path class="furong-waterline-hit" d="M96.0 61.5 L100.0 57.0" />
        </g>
      </svg>
    `;
    this._waterline.tabIndex = 0;
    this._waterline.setAttribute('role', 'button');
    this._waterline.setAttribute('aria-label', '水面分界线');
    const onWaterlineInteract = async () => {
      if (this._isNarrating || this._isFlipping) return;
      if (this.state !== SCENE_STATES.FURONG && this.state !== SCENE_STATES.PUZZLE) return;

      if (!this._hairpinIdentified) {
        this._furongWaterlineClicks += 1;
        this._createRipple(50, 66, this._furongWrap);
        this.narrationBar.showFloating('水面微微晃动，什么也没发生。');
        return;
      }

      if (!this._isFlipped) {
        // 翻转前叙事
        this._isNarrating = true;
        await this.narrationBar.playLine('沈念', '如果倒影才是真的那一面呢——', { portrait: '/images/common/shennian_2.png' });
        this.narrationBar.dismiss();
        this._isNarrating = false;

        // 开始翻转动画
        this._isFlipping = true;
        this._furongWrap.classList.add('flipping-effect');
        this._furongWrap.classList.add('flipped');
        this._isFlipped = true;
        this.state = SCENE_STATES.PUZZLE;
        if (this._realRailing) this._realRailing.style.display = 'none';
        if (this._hairpinReflection) this._hairpinReflection.style.display = 'none';
        if (this._waterline) {
          this._waterline.style.display = 'none';
          this._waterline.style.pointerEvents = 'none';
        }

        this._flipTimeout = setTimeout(async () => {
          this._isFlipping = false;
          this._flipTimeout = null;
          this._furongWrap.classList.remove('flipping-effect');
          if (!this._isFlipped) return;

          // 翻转完成后叙事
          this._isNarrating = true;
          await this.narrationBar.playLine(null, '世界颠倒了一瞬，又重新安定。倒影变成了正像，断簪就在你面前，触手可及。');
          this.narrationBar.dismiss();
          this._isNarrating = false;

          if (this._hairpinReal) this._hairpinReal.style.display = 'block';
          this.narrationBar.showFloating('断簪停在近前，金光轻轻一闪。');
          this._resetIdleTimer('flipper');
        }, 2400);
      } else {
        // 翻回
        if (this._flipTimeout) {
          clearTimeout(this._flipTimeout);
          this._flipTimeout = null;
        }
        this._isFlipping = false;
        
        // 移除并在下一帧重新添加动画类，以便再次触发动画
        this._furongWrap.classList.remove('flipping-effect');
        void this._furongWrap.offsetWidth; // 触发重绘
        this._furongWrap.classList.add('flipping-effect');
        
        this._furongWrap.classList.remove('flipped');
        this._isFlipped = false;

        // 如果用户再次翻回，需要保证2.4s后移除动画类
        setTimeout(() => {
          this._furongWrap.classList.remove('flipping-effect');
        }, 2400);

        if (this._hairpinReflection) this._hairpinReflection.style.display = 'block';
        if (this._hairpinReal) this._hairpinReal.style.display = 'none';
        if (this._realRailing) this._realRailing.style.display = '';

        this._resetIdleTimer('identified');
      }
    };
    this._waterline.addEventListener('click', onWaterlineInteract);
    this._waterline.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onWaterlineInteract();
      }
    });
    this._furongWrap.appendChild(this._waterline);

    // 真实栏杆（第一个可点击元素）— 3-6
    this._realRailing = this._createHotspot(44.8, 56.5, 12, () => {
      if (this._isNarrating) return;
      this._furongRailingClicks += 1;
      let msg = '你摸了摸栏杆。什么都没有。';
      if (!this._isFlipped) {
        msg += '但水面的倒影里，那件东西还在。';
        if (this._furongRailingClicks >= 3 && !this._hairpinIdentified) {
          msg += ' 也许该试试看水面倒影。';
        }
      }
      this.narrationBar.showFloating(msg);
    }, '栏杆');
    this._furongWrap.appendChild(this._realRailing);

    // 倒影中断簪（翻转前可见）— 3-7~3-9
    this._hairpinReflection = document.createElement('div');
    this._hairpinReflection.className = 'furong-hairpin';
    this._hairpinReflection.style.left = '45%';
    this._hairpinReflection.style.top = '72%';
    this._hairpinReflection.tabIndex = 0;
    this._hairpinReflection.setAttribute('role', 'button');
    this._hairpinReflection.setAttribute('aria-label', '水面倒影中的物件');
    this._hairpinReflection.innerHTML = `
      <div class="hairpin-gleam visible"></div>
      <span class="hairpin-icon" aria-hidden="true">
        <span class="css-hairpin css-hairpin--scene" aria-hidden="true">
          <span class="css-hairpin__shaft"></span>
          <span class="css-hairpin__coil css-hairpin__coil--main"></span>
          <span class="css-hairpin__coil css-hairpin__coil--upper"></span>
          <span class="css-hairpin__coil css-hairpin__coil--lower"></span>
        </span>
      </span>
    `;
    const onHairpinReflectionInteract = async () => {
      if (this._isNarrating) return;
      this._furongReflectionClicks += 1;
      if (!this._hairpinIdentified) {
        this._isNarrating = true;
        this._createRipple(45, 72, this._furongWrap);
        await this.narrationBar.playLine(null, '你把目光压低，盯着水面里那件东西。涟漪轻轻散开，它的轮廓逐渐清晰。');
        await this.narrationBar.playLine(null, '是一支簪子。簪头是半朵芙蓉的形状，断了，断口处已经发黑。它静静地挂在倒影的栏杆上。');
        await this.narrationBar.playLine('沈念', '只在倒影里存在的东西……我怎么把它拿出来？', { portrait: '/images/common/shennian_2.png' });
        this.narrationBar.dismiss();
        this._isNarrating = false;
        this._hairpinIdentified = true;
        this.narrationBar.showFloating('水面那条明暗交界线微微亮了一下。');
        this._resetIdleTimer('identified');
        return;
      }

      if (!this._isFlipped) {
        this.narrationBar.showFloating('你试着伸手去够水面，但指尖一碰，倒影就散了。');
        return;
      }
    };
    this._hairpinReflection.addEventListener('click', onHairpinReflectionInteract);
    this._hairpinReflection.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onHairpinReflectionInteract();
      }
    });
    this._furongWrap.appendChild(this._hairpinReflection);

    // 翻转后断簪（翻转后可见）
    this._hairpinReal = document.createElement('div');
    this._hairpinReal.className = 'furong-hairpin';
    this._hairpinReal.style.left = '45%';
    // 容器会 scaleY(-1)，这里用 72% 才会在玩家看到的 28% 位置出现。
    this._hairpinReal.style.top = '72%';
    this._hairpinReal.style.display = 'none';
    this._hairpinReal.tabIndex = 0;
    this._hairpinReal.setAttribute('role', 'button');
    this._hairpinReal.setAttribute('aria-label', '断簪');
    this._hairpinReal.innerHTML = `
      <div class="hairpin-gleam visible"></div>
      <span class="hairpin-icon" aria-hidden="true">
        <span class="css-hairpin css-hairpin--scene" aria-hidden="true">
          <span class="css-hairpin__shaft"></span>
          <span class="css-hairpin__coil css-hairpin__coil--main"></span>
          <span class="css-hairpin__coil css-hairpin__coil--upper"></span>
          <span class="css-hairpin__coil css-hairpin__coil--lower"></span>
        </span>
      </span>
    `;
    const onHairpinRealInteract = async () => {
      if (this._isNarrating) return;
      if (!this._isFlipped) return;

      this._isNarrating = true;
      this._clearIdleTimer();
      this.state = SCENE_STATES.LIGHT_DISCUSSION;

      // 隐藏断簪
      this._hairpinReal.style.display = 'none';

      await this.narrationBar.playLine(null, '你伸手，取下了那支断簪。银质已经发暗，簪头是半朵未开的芙蓉，做工细致。');
      await this.narrationBar.playLine(null, '你下意识翻过来看簪身背面——一个极小的字，刻在不显眼的位置。');
      await this.narrationBar.playLine('沈念', '蘅。', { portrait: '/images/common/shennian_3.png' });
      await this.narrationBar.playLine('沈念', '刻在背面，这么小……不像题名，也不像工匠的标记。那是什么？', { portrait: '/images/common/shennian_2.png' });

      this.engine.collectItem({
        id: 'hairpin',
        name: '断簪',
        description: '银质断簪，簪头为半朵芙蓉。簪身背面刻有一个极小的"蘅"字。不像正式题名，也不像工匠标记，用途不明。',
        icon: ''
      });
      this.engine.gameProgress.hasHairpin = true;

      this.notebook.addClueRecord('[物件] 断簪 — 银质断簪，簪头半朵芙蓉，簪身背面刻有极小的"蘅"字');
      this.notebook.addClueRecord('[线索] "蘅"字刻痕 — 刻在簪身背面，不像题名或工匠标记，用途不明');
      this.notebook.expand();
      this.notebook.setLightweightMode(true);
      await this.narrationBar.playLine('系统提示', '已获得物件「断簪」。可在【记录】页查看，也可在【梳理】页轻量讨论。');

      this._isNarrating = false;
      this._startLightDiscussion();
    };
    this._hairpinReal.addEventListener('click', onHairpinRealInteract);
    this._hairpinReal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onHairpinRealInteract();
      }
    });
    this._furongWrap.appendChild(this._hairpinReal);

    // 外层子场景容器
    this._furongEl = document.createElement('div');
    this._furongEl.className = 'ch1-subscene';
    this._furongEl.appendChild(this._furongWrap);
    this._sceneRoot.appendChild(this._furongEl);
  }

  /* ==================== 工具方法 ==================== */

  _createHotspot(x, y, r, onClick, ariaLabel = '可交互元素') {
    const spot = document.createElement('div');
    spot.className = 'ch1-hotspot';
    spot.style.left = `${x}%`;
    spot.style.top = `${y}%`;
    const hitSize = `clamp(48px, ${r * 1.2}vmin, 96px)`;
    spot.style.width = hitSize;
    spot.style.height = hitSize;
    spot.tabIndex = 0;
    spot.setAttribute('role', 'button');
    spot.setAttribute('aria-label', ariaLabel);
    spot.addEventListener('click', onClick);
    spot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    });
    return spot;
  }

  _createNavArrow(x, y, r, onClick, ariaLabel = '前进') {
    const arrow = document.createElement('div');
    arrow.className = 'ch1-nav-arrow';
    arrow.innerHTML = '<span class="nav-arrow-icon" aria-hidden="true"></span>';
    arrow.style.left = `${x}%`;
    arrow.style.top = `${y}%`;
    arrow.style.width = `${r * 2}vmin`;
    arrow.style.height = `${r * 2}vmin`;
    arrow.tabIndex = 0;
    arrow.setAttribute('role', 'button');
    arrow.setAttribute('aria-label', ariaLabel);
    arrow.addEventListener('click', onClick);
    arrow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    });
    return arrow;
  }

  _createRipple(x, y, container) {
    const ripple = document.createElement('div');
    ripple.className = 'ch1-ripple';
    ripple.style.left = `${x}%`;
    ripple.style.top = `${y}%`;
    container.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  _showLightDiscussionSkipButton(onSkip) {
    this._hideLightDiscussionSkipButton();
    if (!this._uiLayer) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ch1-discussion-skip-btn';
    btn.textContent = '跳过讨论';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.disabled = true;
      onSkip?.();
    });

    this._lightDiscussionSkipBtn = btn;
    this._uiLayer.appendChild(btn);
  }

  _hideLightDiscussionSkipButton() {
    if (this._lightDiscussionSkipBtn) {
      this._lightDiscussionSkipBtn.remove();
      this._lightDiscussionSkipBtn = null;
    }
  }

  /* ==================== 流程控制 ==================== */

  async _startSequence() {
    this.engine.currentChapter = 1;
    this.engine.currentWorld = 'paint';
    // 图片加载完成后立即激活子场景，避免遮罩淡出时露出黄色底色
    await this._waitForImage(this._bgLanxue);
    if (this._exited) return;
    this._lanxueEl.classList.add('active');
    this.state = SCENE_STATES.LANXUE;

    await this._nextFrame();
    await this._nextFrame();
    await this._waitForIntroOverlayGone();
    await this._delay(250);
    if (this._exited) return;
    this._isNarrating = true;

    await this.narrationBar.playLine(null, '你睁开眼。四周的一切都不对——不是工作室，不是扫描仪的冷光。自己站在一个陌生的地方。');
    await this.narrationBar.playLine('沈念', '这是哪里？', { portrait: '/images/common/shennian_3.png' });
    await this.narrationBar.playLine(null, '低下头，脚下是青石板路，微微发暖。空气里有一种说不出的气味——不是花香，更像旧纸和松烟墨混在一起的味道。抬起头，两侧翠竹如墙，在没有风的空气中轻轻摇动。');
    await this.narrationBar.playLine(null, '顺着石径看过去。前方有一座敞厅，像是某种入口建筑。');
    await this.narrationBar.playLine('沈念', '等等……这个地方我见过。是拙政园东部的兰雪堂。但不对，它不是我在照片里看到的样子。它更旧，更轻——像是一笔还没有干透的线。', { portrait: '/images/common/shennian_3.png' });
    await this.narrationBar.playLine('沈念', '不会吧。我在画里？', { portrait: '/images/common/shennian_3.png' });
    this.narrationBar.dismiss();

    // 旁白结束后引导玩家使用笔记本与场景探索。
    this.notebook.showQuickThoughts([
      '这里是兰雪堂，我该留意什么？',
      '第三十一景和前面三十幅，感觉上有什么不同？',
      '为什么我看到的兰雪堂和照片里不一样？'
    ]);
    this.hudBar.show();
    await this.narrationBar.playLine('系统提示', '右下角可打开【修复笔记本】：【记录】页可查看已获得的线索，【对话】页可写下疑问与周老师批注讨论。准备好后，点击场景中的景物即可开始探索。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;
    this._showLanxueHotspots();
  }

  async _waitForSceneReady() {
    await this._waitForImage(this._bgLanxue);
    await this._nextFrame();
    await this._nextFrame();
    await this._waitForIntroOverlayGone();
    await this._delay(250);
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

  _waitForIntroOverlayGone() {
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const check = () => {
        if (settled) return;
        if (this._exited || !document.querySelector('.intro-transition-overlay')) {
          done();
          return;
        }
        requestAnimationFrame(check);
      };
      const timer = setTimeout(done, 4500);
      requestAnimationFrame(check);
    });
  }

  _nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async _switchToZhuiyun() {
    this.engine.saveCheckpoint?.(CHECKPOINTS.ZHUIYUN, {
      chapter: 1,
      scene: 'chapter1',
      world: 'paint'
    });
    this.state = SCENE_STATES.ZHUIYUN;
    this._isNarrating = true;
    this.hudBar.show();

    // 平滑转场：交叉淡入淡出 (新场景在上方淡入，完全盖住旧场景后再移除旧的，避免漏出黄色底色)
    this._zhuiyunEl.style.zIndex = '2';
    this._zhuiyunEl.classList.add('active');
    
    await new Promise(r => setTimeout(r, 600)); // 等待新场景淡入
    
    this._lanxueEl.classList.remove('active');
    this._zhuiyunEl.style.zIndex = '';

    await this.narrationBar.playLine(null, '沿着石径往前走。转过一个弯，一块巨石挡住了去路——不，不是挡住，是立在路旁，像某种标记。');
    await this.narrationBar.playLine('沈念', '缀云峰。我认得这块湖石。但亲眼见到又不一样——石头上的纹路像是有人用极细的笔，一笔一笔勾出来的。', { portrait: '/images/common/shennian_3.png' });
    this.narrationBar.dismiss();
    this._isNarrating = false;

    // 提示玩家可探索或直接前进
    this.notebook.showQuickThoughts([
      '这块石头的纹路为什么画得这么细？',
      '峰石背后低处那点微光是什么？',
      '这座峰石周围还藏着什么？'
    ]);
    this.narrationBar.showFloating('峰石背后的低处有一点微光；前方石径仍通向水声。可在【记录】页查看，也可在【对话】页继续讨论。点击场景中的光点继续探索。');
    this.notebook.collapse();
  }

  async _switchToFurong() {
    this.engine.saveCheckpoint?.(CHECKPOINTS.FURONG, {
      chapter: 1,
      scene: 'chapter1',
      world: 'paint'
    });
    this.state = SCENE_STATES.FURONG;
    this._isNarrating = true;
    this.hudBar.show();

    // 平滑转场：交叉淡入淡出
    this._furongEl.style.zIndex = '2';
    this._furongEl.classList.add('active');
    
    await new Promise(r => setTimeout(r, 600)); // 等待新场景淡入
    
    this._zhuiyunEl.classList.remove('active');
    this._furongEl.style.zIndex = '';

    await this.narrationBar.playLine(null, '你循着水声走出石径。眼前豁然开朗——一座临水小榭安静地立在岸边，屋檐低垂，栏杆探入水面。');
    await this.narrationBar.playLine('沈念', '芙蓉榭。拙政园东部最靠近水面的地方。', { portrait: '/images/common/shennian_1.png' });
    await this.narrationBar.playLine(null, '你走到栏杆前，往下看。水面很静，倒影清晰得像另一个世界——每一根栏杆、每一片瓦都被原样映在水里。');
    await this.narrationBar.playLine(null, '但看了一会儿，你发现不对。倒影里的栏杆上，好像多了什么东西。');
    await this.narrationBar.playLine('沈念', '上面什么都没有。可水里……水里的栏杆上挂着一件东西。', { portrait: '/images/common/shennian_3.png' });
    this.narrationBar.dismiss();
    this._isNarrating = false;

    this.notebook.showQuickThoughts([
      '栏杆上没有东西，倒影里为什么多了一件？',
      '水面上有一条光线在闪，我该点它看看吗？',
      '倒影里挂着的那件东西，有办法看得更清楚吗？'
    ]);

    // 旁白已经暗示了倒影中有东西，给出不剧透顺序的谜题提示。
    this._isNarrating = true;
    await this.narrationBar.playLine('系统提示', '已进入倒影谜题。场景中的栏杆、水面与倒影都可以尝试点击；不同的顺序和次数会触发不同反馈。需要梳理时，可打开【修复笔记本】的【对话】页提问。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;
    this._resetIdleTimer('initial');
  }

  async _startLightDiscussion() {
    this.notebook.expand();
    this.notebook.setLightweightMode(true);

    this.notebook.showSystemMessage('（轻量梳理开始，你可以随时跳过）');
    this.notebook.showNPCMessage('（周老师的批注）"蘅"，杜衡。是一种香草，古人也用来比喻品性高洁的女子。刻在簪身背面，不是正面——如果是工匠标记，通常会在簪头或底座。这更像是物主自己留给自己的。那么，是谁把自己的名字藏在了一支断簪上？');

    this.notebook.showQuickThoughts([
      '「蘅」字可能指什么？',
      '为什么刻在断簪背面？',
      '一个字能说明是谁留下的吗？'
    ]);

    const answeredThoughts = new Set();
    const responses = {
      '「蘅」字可能指什么？': '“蘅”可指杜衡，是一种香草，古人也常借它比喻品性高洁的女子。这里只能先记下字义，不能直接推出身份。',
      '为什么刻在断簪背面？': '背面更隐蔽，不像公开署名，更像私人的记号。这个位置值得记下，但还不能单独定论。',
      '一个字能说明是谁留下的吗？': '不能。一个字只能说明有人留下过痕迹，至于是谁、为什么留下，还需要更多线索互相印证。'
    };
    this.notebook.onQuickThought((text) => {
      if (answeredThoughts.has(text)) return;
      answeredThoughts.add(text);
      this.notebook.showPlayerMessage(text);
      this.notebook.showNPCMessage(responses[text] || '这个问题可以先记下，等更多线索出现后再一起判断。');
      if (answeredThoughts.size >= 3) {
        setTimeout(() => {
          if (!this._discussionEnded) endDiscussion();
        }, 2500);
      }
    });

    const endDiscussion = async () => {
      if (this._discussionEnded) return;
      this._discussionEnded = true;
      this._hideLightDiscussionSkipButton();
      this.notebook.hideConfirmButton();
      this.notebook.setLightweightMode(false);
      this.notebook.collapse();
      this.narrationBar.dismiss();

      await this.narrationBar.playLine(null, '水面重新归于平静。你把断簪小心地收起来。');
      await this.narrationBar.playLine('沈念', '蘅。按周老师的批注，这个字有女子名的意味。', { portrait: '/images/common/shennian_1.png' });
      await this.narrationBar.playLine('沈念', '它偏偏刻在簪身背面，又小得几乎要错过。像是刻字的人想留下一点痕迹，却仍把它收在不显眼处。', { portrait: '/images/common/shennian_2.png' });
      await this.narrationBar.playLine(null, '你站在榭前，忽然觉得眼前的光线在变。周围的墨色好像在一点点褪去，像清水洗过宣纸。');
      this.narrationBar.dismiss();

      await this._startFadeTransition();
    };

    this._discussionEnded = false;

    // 跳过按钮放在叙事框上方，不占用笔记本内容区。
    this.notebook.hideConfirmButton();
    this._showLightDiscussionSkipButton(() => endDiscussion());

    // 监听面板收起也触发转场
    this._collapseHandler = () => {
      if (this.state === SCENE_STATES.LIGHT_DISCUSSION && !this._discussionEnded) {
        endDiscussion();
      }
    };
    this.notebook.onCollapse(this._collapseHandler);
  }

  async _startFadeTransition() {
    this.state = 'TRANSITION';
    this.engine.saveCheckpoint?.(CHECKPOINTS.WORKSHOP, {
      chapter: 1,
      scene: 'chapter1-workshop',
      world: 'real'
    });
    await this.engine.sceneManager.switchWithFadeToSepia('chapter1-workshop');
  }

  /* ==================== 辅助方法 ==================== */

  _resetIdleTimer(phase) {
    this._clearIdleTimer();
    this._idleTimer = setTimeout(() => {
      if (phase === 'initial') {
        this.narrationBar.showFloating('水面倒影里好像有什么。');
      } else if (phase === 'identified') {
        this.narrationBar.showFloating('直接够不到。也许换个角度看这片水面。');
        this._idleTimer = setTimeout(() => {
          this.narrationBar.showFloating('倒影和真实之间……那条线。');
        }, 20000);
      } else if (phase === 'flipper') {
        this.narrationBar.showFloating('它在等你伸手。');
      }
    }, phase === 'initial' ? 30000 : (phase === 'identified' ? 25000 : 10000));
  }

  _clearIdleTimer() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }
}
