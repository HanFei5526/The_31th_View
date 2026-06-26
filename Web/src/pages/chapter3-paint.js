/**
 * 第三章 · 西园 — 画中世界
 *
 * 子场景：鸳鸯馆南厅 → 鸳鸯馆北厅 → 留听阁（封墙谜题）→ 工作室
 */

import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';
import { showInkSeep, dismiss } from '../components/overlay-text.js';

const SCENE_STATES = {
  YUANYANG_SOUTH: 'yuanyang_south',
  YUANYANG_NORTH: 'yuanyang_north',
  LIUTINGGE: 'liutingge',
  LIGHT_DISCUSSION: 'light_discussion',
  PLAQUE_RECALL: 'plaque_recall',
  WORKSHOP: 'workshop'
};

const CHECKPOINTS = {
  SOUTH: 'chapter3_south_start',
  NORTH: 'chapter3_north_start',
  LIUTING: 'chapter3_liuting_start',
  WORKSHOP: 'chapter3_workshop_start'
};

export default class Chapter3PaintScene {
  constructor(engine) {
    this.engine = engine;
    this.name = 'chapter3-paint';

    this.narrationBar = new NarrationBar(engine);
    this.notebook = new NotebookFloating(engine);
    this.hudBar = new HudBar(engine);
    this.inventoryPopup = new InventoryPopup(engine);
    this.state = SCENE_STATES.YUANYANG_SOUTH;

    // 背景图
    this._bgSouth = '/images/chapter3/chapter3-yuanyang-south.png';
    this._bgNorth = '/images/chapter3/chapter3-yuanyang-north.png';
    this._bgLiuting = '/images/chapter3/chapter3-liutingge.png';
    this._bgLiutingRevealed = '/images/chapter3/chapter3-liutingge-revealed.png';
    this._bgSketchRevealed = '/images/chapter3/chapter3-sketch-revealed.png';
    this._bgPlaque = '/images/chapter1/chapter1-lanxuetang-plaque.png';

    // 存档状态
    const p = this.engine.gameProgress;
    p.seenScatteredSketches = p.seenScatteredSketches || false;
    p.seenBleedingText = p.seenBleedingText || false;
    p.redLinesRevealed = p.redLinesRevealed || false;
    p.sketchRevealed = p.sketchRevealed || false;
    p.understoodNotPainter = p.understoodNotPainter || false;
    p.hasRubbing = p.hasRubbing || false;
    p.hasLetter = p.hasLetter || false;
    p.ch3DiscussionDone = p.ch3DiscussionDone || false;
    p.plaqueRecognized = p.plaqueRecognized || false;

    // 运行时状态
    this._isNarrating = false;
    this._exited = false;
    this._wallClickCount = 0;
    this._resolveItemSelection = null;
    this._sketchOverlay = null;
    this._idleTimers = [];
    this._container = null;
    this._sceneRoot = null;
    this._uiLayer = null;
  }

  /* ==================== 生命周期 ==================== */

  enter(container) {
    this._exited = false;
    this._container = container;
    this.engine.currentChapter = 3;
    this.engine.currentWorld = 'paint';
    this._container.classList.remove('real-world');
    this._container.classList.add('paint-world');

    this.engine.ensureCarryoverForChapter?.(3, { persist: false });

    // UI 层
    this._uiLayer = document.createElement('div');
    this._uiLayer.className = 'scene-ui-layer';
    this._uiLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:10;';

    this.narrationBar.mount(this._uiLayer);
    this.notebook.mount(this._uiLayer);
    this.hudBar.mount(this._uiLayer);
    this.inventoryPopup.mount(this._uiLayer);

    this.hudBar.onNotebookClick(() => {
      if (this.notebook.isExpanded()) this.notebook.collapse();
      else this.notebook.expand();
    });
    this.hudBar.onInventoryClick(() => this.inventoryPopup.open());

    this.notebook.onSubmit(async (text) => await this._askNotebook(text));
    this.notebook.onQuickThought(async (text) => await this._askNotebook(text));

    // 场景根节点
    this._sceneRoot = document.createElement('div');
    this._sceneRoot.className = 'ch3-scene';

    this._buildSouthScene();
    this._buildNorthScene();
    this._buildLiutingScene();
    this._buildWorkshopScene();

    this._container.appendChild(this._sceneRoot);
    this._container.appendChild(this._uiLayer);

    this._unsubscribers = [];

    if (this.engine.currentCheckpointId === CHECKPOINTS.NORTH) {
      this._switchToNorth();
    } else if (this.engine.currentCheckpointId === CHECKPOINTS.LIUTING) {
      this._switchToLiuting();
    } else {
      this.engine.saveCheckpoint?.(CHECKPOINTS.SOUTH, {
        chapter: 3,
        scene: 'chapter3',
        world: 'paint'
      });
      this._startSequence();
    }
  }

  exit() {
    this._exited = true;
    this._clearAllIdleTimers();
    this.narrationBar.unmount();
    this.notebook.unmount();
    this.hudBar.unmount();
    this.inventoryPopup.unmount();
    this._unsubscribers?.forEach(fn => fn());
    if (this._sceneRoot) this._sceneRoot.remove();
    if (this._uiLayer) this._uiLayer.remove();
  }

  async _askNotebook(text) {
    if (!text?.trim()) return;
    this.notebook.showPlayerMessage(text);
    this.notebook.setLoading(true);
    try {
      const reply = await this.engine.aiService.queryNotebook(text);
      this.notebook.showNPCMessage(reply);
    } catch (err) {
      console.error('[Chapter3Paint] 笔记本查询失败:', err);
      this.notebook.showNPCMessage('（翻了翻，没有找到相关记录）');
    } finally {
      this.notebook.setLoading(false);
    }
  }

  /* ==================== 构建场景 ==================== */

  _buildSouthScene() {
    this._southEl = document.createElement('div');
    this._southEl.className = 'ch3-subscene';
    this._southEl.style.backgroundImage = `url('${this._bgSouth}')`;

    // 氛围热点：字画
    const paintingSpot = this._createHotspot(44.5, 36.5, 10, async () => {
      if (this._isNarrating) return;
      this.narrationBar.showFloating('端正、规矩。每一笔都有出处。和前两次见到的画没什么区别。');
    }, '字画');

    // 叙事触发：隔扇（通往北厅），用 nav-arrow 突出导航功能
    this._screenArrow = this._createNavArrow(83, 54, 10, async () => {
      if (this._isNarrating) return;
      this._clearAllIdleTimers();
      this._isNarrating = true;
      await this.narrationBar.playLine(null, '你伸手推开隔扇。一股潮湿的纸墨味扑面而来。');
      this.narrationBar.dismiss();
      this._isNarrating = false;
      this._switchToNorth();
    }, '隔扇·前往北厅');
    this._screenArrow.style.display = 'none';

    this._southSpots = [paintingSpot];
    this._southSpots.forEach(spot => {
      spot.style.display = 'none';
      this._southEl.appendChild(spot);
    });
    this._southEl.appendChild(this._screenArrow);

    this._sceneRoot.appendChild(this._southEl);
  }

  _buildNorthScene() {
    this._northEl = document.createElement('div');
    this._northEl.className = 'ch3-subscene';
    this._northEl.style.backgroundImage = `url('${this._bgNorth}')`;

    // 氛围热点：画纸A
    const paperA = this._createHotspot(31.5, 82, 8, async () => {
      if (this._isNarrating) return;
      this.narrationBar.showFloating('这张画里水面占了大半。桥被压到了画面底部。');
    }, '画纸A');

    // 氛围热点：画纸B
    const paperB = this._createHotspot(58, 81.5, 8, async () => {
      if (this._isNarrating) return;
      this.narrationBar.showFloating('只画了一笔就放弃了。墨迹还是湿的——像刚才还有人在这里。');
    }, '画纸B');

    // 叙事触发：画纸C（渗字事件）
    const paperC = this._createHotspot(80, 91.5, 9, async () => {
      if (this._isNarrating) return;
      this._clearAllIdleTimers();
      await this._playBleedingTextEvent();
    }, '画纸C');

    // 出口（渗字后解锁）
    this._northExit = this._createNavArrow(14.5, 48, 8, async () => {
      if (this._isNarrating) return;
      this._switchToLiuting();
    }, '前往留听阁');
    this._northExit.style.display = 'none';

    this._northSpots = [paperA, paperB, paperC];
    this._northSpots.forEach(spot => {
      spot.style.display = 'none';
      this._northEl.appendChild(spot);
    });
    this._northEl.appendChild(this._northExit);

    this._sceneRoot.appendChild(this._northEl);
  }

  _buildLiutingScene() {
    this._liutingEl = document.createElement('div');
    this._liutingEl.className = 'ch3-subscene';
    this._liutingEl.style.backgroundImage = `url('${this._bgLiuting}')`;

    // 灰泥覆盖层（谜题完成前显示）
    this._plasterOverlay = document.createElement('div');
    this._plasterOverlay.className = 'ch3-plaster-overlay';
    this._plasterOverlay.style.backgroundImage = `url('${this._bgLiuting}')`;
    this._liutingEl.appendChild(this._plasterOverlay);

    // 红线层（残砚使用后显现）
    this._redlinesOverlay = document.createElement('div');
    this._redlinesOverlay.className = 'ch3-redlines-overlay';
    this._liutingEl.appendChild(this._redlinesOverlay);

    // 叙事触发：封墙
    const wallSpot = this._createHotspot(48.5, 56.5, 18, async () => {
      if (this._isNarrating) return;
      await this._handleWallClick();
    }, '封墙');

    // 氛围热点：窗格
    const windowSpot = this._createHotspot(15, 30, 8, async () => {
      if (this._isNarrating) return;
      this.narrationBar.showFloating('窗外竹影婆娑。留听阁——留下来，听一听。');
    }, '窗格');

    this._liutingSpots = [wallSpot, windowSpot];
    this._liutingSpots.forEach(spot => {
      spot.style.display = 'none';
      this._liutingEl.appendChild(spot);
    });

    // 蹲下观察按钮（草图显现后出现）
    this._crouchBtn = document.createElement('button');
    this._crouchBtn.className = 'ch3-crouch-btn';
    this._crouchBtn.textContent = '蹲下观察';
    this._crouchBtn.type = 'button';
    this._crouchBtn.addEventListener('click', () => this._handleCrouch());
    this._liutingEl.appendChild(this._crouchBtn);

    // 凹槽热点（题字后出现）
    this._slotSpot = this._createHotspot(75, 63, 6, async () => {
      if (this._isNarrating) return;
      await this._handleSlotClick();
    }, '凹槽');
    this._slotSpot.style.display = 'none';
    this._liutingEl.appendChild(this._slotSpot);

    this._sceneRoot.appendChild(this._liutingEl);
  }

  _buildWorkshopScene() {
    // 工作室作为独立场景，不在画中世界构建
  }

  /* ==================== 流程控制 ==================== */

  async _startSequence() {
    this.engine.currentChapter = 3;
    this.engine.currentWorld = 'paint';

    await this._waitForImage(this._bgSouth);
    if (this._exited) return;
    this._southEl.classList.add('active');
    this.state = SCENE_STATES.YUANYANG_SOUTH;

    await this._nextFrame();
    await this._nextFrame();
    await this._waitForIntroOverlayGone();
    await this._delay(300);
    if (this._exited) return;

    // 南厅入场叙事
    this._isNarrating = true;
    await this.narrationBar.playLine(null, '你顺着声音走。研墨声和翻纸声从前方传来，忽近忽远，像有人在某间屋子里反复忙碌。');
    await this.narrationBar.playLine(null, '推开一扇门，声音停了。你站在一间宽敞的厅堂里。四壁挂着字画，桌椅端正——一切都很齐整，像被人刻意维护过。');
    await this.narrationBar.playLine('沈念', '鸳鸯馆。南厅。看起来和其他地方没什么不同……但刚才的声音是从哪里来的？', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine('沈念', '隔扇后面——北厅那边，好像还有动静。', { portrait: '/images/common/shennian_2.png' });
    this.narrationBar.dismiss();

    // 探索态
    this.notebook.showQuickThoughts([
      '鸳鸯馆是什么地方？',
      '刚才的研墨声是从哪里传来的？',
      '南厅和北厅有什么区别？'
    ]);
    this.hudBar.show();
    await this.narrationBar.playLine('系统提示', '鸳鸯馆南厅内可以探索。【记录】页可查看已有线索，【对话】页可继续讨论。点击场景中的光点查看可交互的位置。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;

    this._showSpots(this._southSpots);
    this._screenArrow.style.display = '';

    // 渐进提示：15s未点击隔扇
    this._startIdleTimer('southScreen', 15000, () => {
      this.narrationBar.showFloating('隔扇后面——北厅那边，好像还有动静。点击右侧光点前往。');
    });
  }

  async _switchToNorth() {
    this.engine.saveCheckpoint?.(CHECKPOINTS.NORTH, {
      chapter: 3,
      scene: 'chapter3',
      world: 'paint'
    });
    this.state = SCENE_STATES.YUANYANG_NORTH;
    this.hudBar.show();

    this._northEl.style.zIndex = '2';
    this._northEl.classList.add('active');
    await this._delay(600);
    this._southEl.classList.remove('active');
    this._northEl.style.zIndex = '';

    this._isNarrating = true;
    await this.narrationBar.playLine(null, '北厅和南厅完全是两个世界。');
    await this.narrationBar.playLine(null, '地上散落着画纸——到处都是。有的画了一半被撕碎，有的被水浸透皱在角落，有的只落了一笔就被揉成一团。');
    await this.narrationBar.playLine(null, '你蹲下来捡起一张。画的是拙政园，能认出远香堂的轮廓。但比例不对——水面画得太重，桥线弯得太急，亭阁被压得很低，像是从一个不寻常的角度去看的。');
    await this.narrationBar.playLine('沈念', '这不是文徵明的画。笔力太弱，线条太犹豫。', { portrait: '/images/common/shennian_1.png' });
    await this.narrationBar.playLine('沈念', '断簪上的"蘅"，题诗里藏着的"画非一人"……如果那些痕迹指向的人确实参与过这套画——她画出来的，就是这样的东西？', { portrait: '/images/common/shennian_2.png' });
    this.narrationBar.dismiss();

    this.engine.gameProgress.seenScatteredSketches = true;

    // 探索态
    this.notebook.showQuickThoughts([
      '这些画纸上的视角为什么和正常的不一样？',
      '画的比例为什么不对？',
      '"画非一人"和这些草图有关系吗？'
    ]);
    await this.narrationBar.playLine('系统提示', '北厅散落着大量画纸，可以仔细看看。【记录】页可查看已有线索，【对话】页可继续讨论。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;

    this._showSpots(this._northSpots);

    // 渐进提示：30s未点击画纸C
    this._startIdleTimer('northPaperC', 30000, () => {
      this.narrationBar.showFloating('脚边那张画纸上有墨迹在动。');
    });
  }

  async _playBleedingTextEvent() {
    this._isNarrating = true;
    this._hideSpots(this._northSpots);

    await this.narrationBar.playLine(null, '你拿起脚边那张纸。纸面上忽然渗出墨字，一行一行，像有人正在你手里的纸上书写：');
    const seep1 = await this._showSeepPanel(this._northEl, '又不对。水太重了。桥也太弯。先生看见了，定要笑我。', 'center', false);
    await this._delay(800);
    await this.narrationBar.playLine(null, '字迹忽然停住了。纸面安静了很久。');
    await this._dismissSeepPanel(seep1);
    await this.narrationBar.playLine(null, '突然，你的脚边另一张画纸上，缓缓渗出四个字：');
    const seep2 = await this._showSeepPanel(this._northEl, '看得到吗', 'center', true);
    await this._delay(600);
    await this.narrationBar.playLine(null, '四个字没有问号。像不敢用太大的力气去问。');
    await this._dismissSeepPanel(seep2);
    await this.narrationBar.playLine('沈念', '……谁在问？是问我吗？', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine('系统提示', '留听阁的方向传来微弱的声响。');

    this.engine.gameProgress.seenBleedingText = true;
    this.notebook.addClueRecord('[线索] 渗字"看得到吗" — 画纸上自行渗出的墨字，四个字没有问号，像不敢用太大的力气去问');
    await this.narrationBar.playLine('系统提示', '已记录线索：「渗字"看得到吗"」。可在【记录】页查看，也可在【对话】页继续讨论。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;

    // 解锁出口
    this._northExit.style.display = '';

    this.notebook.showQuickThoughts([
      '纸上渗出的字是谁写的？',
      '"看得到吗"——这是在问谁？',
      '这些草图和断簪上的"蘅"有关系吗？'
    ]);

    // 渐进提示：20s未点击出口
    this._startIdleTimer('northExit', 20000, () => {
      this.narrationBar.showFloating('留听阁的方向，似乎有什么在等着。');
    });
  }

  async _switchToLiuting() {
    this.engine.saveCheckpoint?.(CHECKPOINTS.LIUTING, {
      chapter: 3,
      scene: 'chapter3',
      world: 'paint'
    });
    this.state = SCENE_STATES.LIUTINGGE;
    this._clearAllIdleTimers();
    this.hudBar.show();

    this._liutingEl.style.zIndex = '2';
    this._liutingEl.classList.add('active');
    await this._delay(600);
    this._northEl.classList.remove('active');
    this._liutingEl.style.zIndex = '';

    this._isNarrating = true;
    await this.narrationBar.playLine(null, '你循着声响走出北厅。穿过一段短廊，又推开一扇半掩的门。');
    await this.narrationBar.playLine(null, '屋里很暗。窗格透进来的光只够照亮地面的一小片。但你一眼就看见了——对面那面墙，和四周不一样。');
    await this.narrationBar.playLine(null, '它的颜色比旁边深了一层，灰泥表面也不平整，像是比其余三面墙多涂了一道。');
    await this.narrationBar.playLine('沈念', '这面墙……被重新抹过？为什么只有这一面？', { portrait: '/images/common/shennian_2.png' });
    this.narrationBar.dismiss();

    this.notebook.showQuickThoughts([
      '这面墙为什么被重新抹过？',
      '封墙下面可能藏着什么？',
      '残砚和断簪在这里能派上什么用场？'
    ]);
    await this.narrationBar.playLine('系统提示', '留听阁内可以继续探索。【修复笔记本】的【记录】页已有之前的发现，【对话】页可继续讨论。点击场景中的光点查看可交互的位置。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;

    this._showSpots(this._liutingSpots);

    // 渐进提示
    this._startIdleTimer('wallFirst', 30000, () => {
      this.narrationBar.showFloating('那面颜色不同的墙值得仔细看看。');
    });
  }

  async _handleWallClick() {
    this._clearAllIdleTimers();
    this._wallClickCount++;

    if (this._wallClickCount === 1) {
      // 首次点击：观察
      this._isNarrating = true;
      await this.narrationBar.playLine(null, '你走近，伸手按了按墙面。灰泥微微粉化，指尖摸到了凹凸——不是粗糙，是线。一条弧线，从左上方向右下方弯过去，然后断了。');
      await this.narrationBar.playLine('沈念', '有方向，有弧度……不像随手划的。灰泥底下有东西。有人把什么封在了里面。', { portrait: '/images/common/shennian_1.png' });
      await this.narrationBar.playLine('沈念', '只摸到一条线不够。我得再仔细感受一下这面墙。', { portrait: '/images/common/shennian_1.png' });
      this.notebook.addClueRecord('[线索] 封墙下的隐藏线条 — 灰泥表面下有弧线刻痕，非随手划痕，疑似被封住的图案');
      await this.narrationBar.playLine('系统提示', '已记录线索：「封墙下的隐藏线条」。可在【记录】页查看，也可在【对话】页继续讨论。');
      this.narrationBar.dismiss();
      this.notebook.collapse();
      this._isNarrating = false;

      this._startIdleTimer('wallSecond', 20000, () => {
        this.narrationBar.showFloating('那条线后面也许还有更多。再摸摸看？');
      });
    } else {
      // 再次点击：弹出物件选择浮层
      await this._showItemSelectOverlay();
    }
  }

  async _showItemSelectOverlay() {
    const playPromise = this.narrationBar.playLine('系统提示', '选择要使用的物件：');

    const controls = document.createElement('div');
    controls.className = 'ch3-item-select-controls';
    controls.innerHTML = `
      <div class="ch3-item-select-options">
        <button class="ch3-item-btn" data-item="inkstone">残砚</button>
        <button class="ch3-item-btn" data-item="hairpin">断簪</button>
      </div>
    `;
    this._liutingEl.appendChild(controls);
    await this._nextFrame();
    controls.classList.add('active');

    let resolveSelection;
    const selectPromise = new Promise(resolve => {
      resolveSelection = resolve;
      this._resolveItemSelection = resolve;
    });

    const handleButtonClick = (e) => {
      const btn = e.target.closest('[data-item]');
      if (btn) {
        e.stopPropagation();
        this._cancelItemSelection(btn.dataset.item);
      }
    };
    controls.addEventListener('click', handleButtonClick);

    const choice = await Promise.race([
      selectPromise,
      playPromise.then(() => 'cancel')
    ]);

    this._resolveItemSelection = null;
    controls.removeEventListener('click', handleButtonClick);
    controls.classList.remove('active');
    if (choice !== 'external-cancel') {
      this.narrationBar.dismiss();
    }
    await this._delay(400);
    controls.remove();

    if (choice === 'cancel' || choice === 'external-cancel') {
      this._isNarrating = false;
      return;
    }

    this._isNarrating = true;
    if (!this.engine.gameProgress.redLinesRevealed) {
      // 第一步：需要残砚
      if (choice === 'inkstone') {
        await this._useInkstone();
      } else {
        this.narrationBar.showFloating('簪尖划过灰泥，没有反应。也许需要先让旧线显现出来。');
        this._isNarrating = false;
        this._wallClickCount = 1; // 允许再次触发浮层
      }
    } else {
      // 第二步：需要断簪
      if (choice === 'hairpin') {
        await this._useHairpin();
      } else {
        this.narrationBar.showFloating('朱砂已经显现了红线，现在需要沿线剥离灰泥。');
        this._isNarrating = false;
        this._wallClickCount = 1;
      }
    }
  }

  _cancelItemSelection(reason = 'cancel') {
    if (!this._resolveItemSelection) return false;
    const resolve = this._resolveItemSelection;
    this._resolveItemSelection = null;
    resolve(reason);
    return true;
  }

  async _useInkstone() {
    await this.narrationBar.playLine(null, '你打开残砚，将砚中残余的朱砂靠近墙面。');
    await this.narrationBar.playLine(null, '朱砂还没碰到灰泥，墙面就有了反应——淡红色的线条从灰泥下浮现出来，一条，两条，越来越多。同源的朱砂在画中世界里产生了呼应。');
    this.narrationBar.dismiss();

    // 红线显现动画
    this._redlinesOverlay.classList.add('visible');
    this.engine.gameProgress.redLinesRevealed = true;

    await this.narrationBar.playLine('系统提示', '红线已显现。再次点击封墙，尝试用物件沿线剥离灰泥。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;

    this._startIdleTimer('afterInkstone', 30000, () => {
      this.narrationBar.showFloating('红线已经出现了。沿着线剥离灰泥，用曾经划出这些线的东西。');
    });
  }

  async _useHairpin() {
    await this.narrationBar.playLine(null, '你取出断簪，沿着一条红线轻轻划过。');
    await this.narrationBar.playLine(null, '灰泥沿旧刻痕簌簌剥落。簪尖的磨痕与墙上的旧线严丝合缝——她曾用这根簪，在未干的灰泥上划出这些定位线。');
    this.narrationBar.dismiss();

    await this._waitForImage(this._bgLiutingRevealed);

    // 1. 在动画开始前，将底层背景悄悄替换为 Revealed 背景图。
    // 因为上方有不透明的 _plasterOverlay 挡着，所以用户看不到这一瞬间的变化。
    this._liutingEl.style.backgroundImage = `url('${this._bgLiutingRevealed}')`;

    // 2. 同时让红线开始平滑淡出（移除 visible，过渡由 CSS transition 控制）
    this._redlinesOverlay.classList.remove('visible');

    // 3. 播放灰泥剥落（淡出）动画
    this._plasterOverlay.classList.add('cracking');
    await this._delay(1200);

    // 4. 动画结束后，彻底隐藏覆盖层
    this._plasterOverlay.style.display = 'none';
    this._redlinesOverlay.style.display = 'none';

    // 隐藏封墙热点
    this._hideSpots(this._liutingSpots);

    await this._playSketchRevealedSequence();
  }

  async _playSketchRevealedSequence() {
    this._isNarrating = true;

    await this.narrationBar.playLine(null, '灰泥一片片落下。墙面露出一幅画——不，与其说是画，不如说是草图。');
    await this.narrationBar.playLine(null, '它很拙。远香堂画得太低，小飞虹弯得太急，竹影几乎压到画面边缘。线条有几处犹豫的地方，像画的人反复擦掉，又重新落笔。');
    await this.narrationBar.playLine('沈念', '这笔触……和北厅地上那些散落的草图太像了。同样的犹豫，同样的比例失调。但这一张没有被撕碎，没有被放弃——它被留在了墙上。', { portrait: '/images/common/shennian_1.png' });

    this.engine.gameProgress.sketchRevealed = true;

    await this.narrationBar.playLine('系统提示', '试试后退一步，蹲下来看。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;

    // 显示蹲下按钮
    this._crouchBtn.classList.add('visible');

    this._startIdleTimer('crouch', 15000, () => {
      this.narrationBar.showFloating('退后一步，换个角度看看？');
    });
  }

  async _handleCrouch() {
    if (this._isNarrating) return;
    this._clearAllIdleTimers();
    this._crouchBtn.classList.remove('visible');
    this._isNarrating = true;

    // 蹲下观察时再进入草图近景，避免剥墙瞬间把答案全部抛出。
    await this._showSketchCloseup();

    await this.narrationBar.playLine(null, '你后退两步，蹲下来。视线降到墙上标出的那条低位线的高度。');
    await this.narrationBar.playLine(null, '忽然，所有"不对"都对了。');
    await this.narrationBar.playLine(null, '你想起刚才捡起的那张画——水面太重，桥线太弯，亭阁压得太低。那张画和眼前这幅草图的视角几乎一样。从这个高度看过去，远香堂的倒影、小飞虹的弧线、梧竹幽居的竹影，真的会同时出现在一个画面里。');
    await this.narrationBar.playLine('沈念', '她画得不好。但她看得很准。', { portrait: '/images/common/shennian_1.png' });
    this.narrationBar.dismiss();

    this.engine.gameProgress.understoodNotPainter = true;

    // 墙角题字（草图左侧出现）
    await this.narrationBar.playLine(null, '视线回到正常高度。你注意到草图最下方的墙角处，有一行小字，笔迹和草图一样拙：');
    const seepInscription = await this._showSeepPanel(this._liutingEl, '吾笔拙，不能写形。\n然此处水桥竹影，三景同入一眼。\n知我者，当知我所见。', 'center', true);
    await this._delay(1000);
    this.narrationBar.dismiss();

    // 获取草图拓片
    await this.narrationBar.playLine('沈念', '我应该把这张草图记录下来。做一份拓片。', { portrait: '/images/common/shennian_1.png' });
    await this._dismissSeepPanel(seepInscription);
    this.engine.collectItem({
      id: 'rubbing',
      name: '草图拓片',
      description: '留听阁墙面低位视角草图的拓片，证实王蘅的空间观看能力',
      icon: ''
    });
    this.engine.gameProgress.hasRubbing = true;
    this.notebook.addClueRecord('[物件] 草图拓片 — 留听阁墙面低位视角草图，证实王蘅的空间观看能力');
    await this.narrationBar.playLine('系统提示', '已获得物件「草图拓片」。可在【记录】页查看，也可在【对话】页继续讨论。');
    this.narrationBar.dismiss();
    this.notebook.collapse();

    this.notebook.showQuickThoughts([
      '这幅草图为什么留在墙上而不是撕掉？',
      '题字说"三景同入一眼"，是什么意思？',
      '这个低位视角和第三十一景有什么关系？'
    ]);

    this._isNarrating = false;

    // 显示凹槽热点
    await this.narrationBar.playLine('系统提示', '草图右下角似乎有一处凹陷，点击查看。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._slotSpot.style.display = '';

    this._startIdleTimer('slot', 20000, () => {
      this.narrationBar.showFloating('草图右下角似乎有什么。');
    });
  }

  async _showSketchCloseup() {
    if (this._sketchOverlay) {
      this._sketchOverlay.classList.add('visible');
      return;
    }

    await this._waitForImage(this._bgSketchRevealed);

    this._sketchOverlay = document.createElement('div');
    this._sketchOverlay.className = 'ch3-sketch-panel';
    this._sketchOverlay.innerHTML = `<img src="${this._bgSketchRevealed}" alt="墙面草图近景" class="ch3-sketch-img" />`;
    this._liutingEl.appendChild(this._sketchOverlay);

    await this._nextFrame();
    this._sketchOverlay.classList.add('visible');
    await this._delay(650);
  }

  async _handleSlotClick() {
    this._clearAllIdleTimers();
    this._slotSpot.style.display = 'none';
    this._isNarrating = true;

    await this.narrationBar.playLine(null, '拓片做完，你再看了一遍草图。右下角有一处不自然的凹陷——不是画的一部分，像是被人刻意挖出来的小暗格。');
    await this.narrationBar.playLine(null, '你用指甲扣开。里面塞着一个油纸小包，纸已经脆了，但没有碎。展开来，是一封信。没有抬头，没有落款。墨字清晰。');
    this.narrationBar.dismiss();

    // 信件阅读浮层（隐藏草图）
    if (this._sketchOverlay) this._sketchOverlay.classList.remove('visible');
    await this._showLetterOverlay();
    if (this._sketchOverlay) this._sketchOverlay.classList.add('visible');

    await this.narrationBar.playLine('沈念', '"不必有名，不必有形。只要有痕迹。"', { portrait: '/images/common/shennian_1.png' });

    this.engine.collectItem({
      id: 'letter',
      name: '王蘅的信',
      description: '"不必有名，不必有形。只要有痕迹。"',
      icon: ''
    });
    this.engine.gameProgress.hasLetter = true;
    this.notebook.addClueRecord('[物件] 王蘅的信 — "不必有名，不必有形。只要有痕迹。"');
    await this.narrationBar.playLine('系统提示', '已获得物件「王蘅的信」。可在【记录】页查看，也可在【对话】页继续讨论。');
    this.narrationBar.dismiss();

    this.notebook.showQuickThoughts([
      '这封信是写给谁的？',
      '"不必有名，不必有形"——她为什么这么说？',
      '草图、信件、断簪……它们之间的关系是什么？'
    ]);

    this._isNarrating = false;

    // 进入轻量讨论
    await this._delay(1000);
    this._startLightDiscussion();
  }

  _showLetterOverlay() {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'ch3-letter-overlay';
      overlay.innerHTML = `
        <div class="ch3-letter-content">
          <p>"先生知我所见，世间唯先生一人。"</p>
          <p>"吾不善画，亦不敢言造园。然某窗宜低，某径宜折，某处临水，可见三景相照。此皆吾心中之园。"</p>
          <p>"吾知此不可署名，亦不可入记。女子言园，已近妄语；拙笔言景，更为笑谈。"</p>
          <p>"但先生曾言：画在，人便在。"</p>
          <p>"吾无他求，唯请先生——将我放在园子里。不必有名，不必有形。只要有痕迹。只要将来有人走过此园时，或许会觉得，有什么东西在这里停留过。"</p>
          <p>"如此，便够了。"</p>
        </div>
        <button class="ch3-letter-close" aria-label="关闭">×</button>
      `;
      this._liutingEl.appendChild(overlay);
      this._nextFrame().then(() => overlay.classList.add('active'));

      const close = overlay.querySelector('.ch3-letter-close');
      const handleClose = () => {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.remove(); resolve(); }, 600);
      };
      close.addEventListener('click', handleClose);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) handleClose();
      });
    });
  }

  /* ==================== 讨论 + 蒙太奇 + 工作室 ==================== */

  async _startLightDiscussion() {
    this.state = SCENE_STATES.LIGHT_DISCUSSION;
    this.notebook.setLightweightMode?.(true);
    this.notebook.switchTab?.('chat');
    this.notebook.expand();

    this.notebook.showSystemMessage?.('（周老师的批注浮现了）');
    this.notebook.showNPCMessage('（周老师的批注）底层痕迹还原：同源材料在画中世界的呼应，本质上是修复学中"材料溯源"的游戏化表达。朱砂认朱砂，刻痕认刻痕——物与物之间的记忆，有时比文字更可靠。');

    await this.narrationBar.playLine('系统提示', '【修复笔记本】记录更新：周老师的批注。可在【对话】页继续讨论，或跳过继续。');
    this.narrationBar.dismiss();

    // 跳过按钮
    this._showDiscussionSkipButton(() => this._finishDiscussion());
  }

  _showDiscussionSkipButton(onSkip) {
    this._hideDiscussionSkipButton();
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
    this._discussionSkipBtn = btn;
    this._uiLayer.appendChild(btn);
  }

  _hideDiscussionSkipButton() {
    if (this._discussionSkipBtn) {
      this._discussionSkipBtn.remove();
      this._discussionSkipBtn = null;
    }
  }

  async _finishDiscussion() {
    this._hideDiscussionSkipButton();
    this.notebook.setLightweightMode?.(false);
    this.notebook.collapse?.();
    this.engine.gameProgress.ch3DiscussionDone = true;

    await this._delay(500);
    await this._playPlaqueRecall();
  }

  async _playPlaqueRecall() {
    this.state = SCENE_STATES.PLAQUE_RECALL;
    this._isNarrating = true;

    await this.narrationBar.playLine('沈念', '等等。匾额上那一笔——', { portrait: '/images/common/shennian_2.png' });

    // 草图淡出
    if (this._sketchOverlay) {
      this._sketchOverlay.classList.remove('visible');
      await this._delay(800);
      this._sketchOverlay.remove();
      this._sketchOverlay = null;
    }

    // 匾额作为半透明组件淡入（复用草图面板样式）
    const plaque = document.createElement('div');
    plaque.className = 'ch3-sketch-panel ch3-plaque-panel';
    plaque.innerHTML = `<img src="${this._bgPlaque}" alt="兰雪堂匾额" class="ch3-plaque-img" />`;
    this._liutingEl.appendChild(plaque);
    await this._nextFrame();
    plaque.classList.add('visible');

    await this._delay(800);

    await this.narrationBar.playLine('沈念', '墙上的题字，断簪背面的「蘅」，还有匾额上那道多余的笔画。现在我几乎可以确定：它们出自同一只手，同一种心思。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine('沈念', '她不是要署名，也不是要我破解什么。只是在一块连她名字都放不下的匾额上，悄悄留了一道「我也在这里看过」。', { portrait: '/images/common/shennian_1.png' });
    await this.narrationBar.playLine('沈念', '它从来不是一个待解的字。它是一个人留给五百年后的记号。', { portrait: '/images/common/shennian_1.png' });
    this.narrationBar.dismiss();

    this.engine.gameProgress.plaqueRecognized = true;
    this.notebook.addClueRecord('[线索] 匾额追认 — 匾额上那一笔与墙面题字、断簪"蘅"字出自同一只手');

    // 匾额淡出
    plaque.classList.remove('visible');
    await this._delay(1200);
    plaque.remove();

    this._isNarrating = false;
    await this._startFadeTransition();
  }

  async _startFadeTransition() {
    // 使用和前几章一样的褪色转场，切换到独立工作室场景
    this.engine.saveCheckpoint?.(CHECKPOINTS.WORKSHOP, {
      chapter: 3,
      scene: 'chapter3-workshop',
      world: 'real'
    });
    await this.engine.sceneManager.switchWithFadeToSepia('chapter3-workshop');
  }

  /* ==================== 工具方法 ==================== */

  _createHotspot(x, y, r, onClick, ariaLabel = '可交互元素') {
    const spot = document.createElement('div');
    spot.className = 'ch3-hotspot';
    spot.style.left = `${x}%`;
    spot.style.top = `${y}%`;
    const hitSize = `clamp(48px, ${r * 1.2}vmin, 96px)`;
    spot.style.width = hitSize;
    spot.style.height = hitSize;
    spot.tabIndex = 0;
    spot.setAttribute('role', 'button');
    spot.setAttribute('aria-label', ariaLabel);
    spot.addEventListener('click', async () => {
      if (this._cancelItemSelection('external-cancel')) {
        this.narrationBar.dismiss();
      }
      await onClick();
    });
    spot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this._cancelItemSelection('external-cancel')) {
          this.narrationBar.dismiss();
        }
        onClick();
      }
    });
    return spot;
  }

  _createNavArrow(x, y, r, onClick, ariaLabel = '前进') {
    const arrow = document.createElement('div');
    arrow.className = 'ch3-nav-arrow';
    arrow.style.left = `${x}%`;
    arrow.style.top = `${y}%`;
    arrow.style.width = `${r * 2}vmin`;
    arrow.style.height = `${r * 2}vmin`;
    arrow.tabIndex = 0;
    arrow.setAttribute('role', 'button');
    arrow.setAttribute('aria-label', ariaLabel);
    arrow.addEventListener('click', async () => {
      if (this._cancelItemSelection('external-cancel')) {
        this.narrationBar.dismiss();
      }
      await onClick();
    });
    arrow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this._cancelItemSelection('external-cancel')) {
          this.narrationBar.dismiss();
        }
        onClick();
      }
    });
    return arrow;
  }

  _showSpots(spots) {
    if (!spots) return;
    spots.forEach(spot => { spot.style.display = ''; });
  }

  _hideSpots(spots) {
    if (!spots) return;
    spots.forEach(spot => { spot.style.display = 'none'; });
  }

  /**
   * 渗字UI组件面板
   * @param {HTMLElement} container - 父容器
   * @param {string} text - 显示文字
   * @param {'center'|'left'} position - 'center' 居中 / 'left' 草图左侧
   * @param {boolean} emphasis - 强调样式
   * @returns {Promise<HTMLElement>} 返回面板元素（调用方决定何时移除）
   */
  async _showSeepPanel(container, text, position = 'center', emphasis = false) {
    return showInkSeep(container, {
      text,
      position,
      charDelay: 250,
      blur: 4,
      scale: 1.04,
      finalOpacity: 1,
      duration: 600,
      font: 'xingkai',
      emphasis,
      paperCard: true,
      shouldExit: () => this._exited,
    });
  }

  async _dismissSeepPanel(panel) {
    if (!panel) return;
    await dismiss(panel, { duration: 1000 });
  }

  _startIdleTimer(id, delay, callback) {
    const timer = setTimeout(() => {
      if (!this._exited) callback();
    }, delay);
    this._idleTimers.push({ id, timer });
  }

  _clearAllIdleTimers() {
    this._idleTimers.forEach(({ timer }) => clearTimeout(timer));
    this._idleTimers = [];
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
      const done = () => { if (settled) return; settled = true; clearTimeout(timer); resolve(); };
      const check = () => {
        if (settled) return;
        if (this._exited || !document.querySelector('.intro-transition-overlay')) { done(); return; }
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
}
