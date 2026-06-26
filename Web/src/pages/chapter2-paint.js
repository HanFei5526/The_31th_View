/**
 * 第二章 · 中园 — 画中世界
 *
 * 子场景：远香堂（探索+诗词比对+揭示+讨论） → 小飞虹（水面文字+残砚拾取）
 */

import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';
import { PoemCompare } from '../components/poem-compare.js';
import { showReveal, showPaperReveal, showRipple, dismiss } from '../components/overlay-text.js';

const SUB_SCENES = {
  INTRO: 'intro',
  YUANXIANG: 'yuanxiang',
  POEM_COMPARE: 'poem_compare',
  REVEAL: 'reveal',
  LIGHT_DISCUSSION: 'light_discussion',
  XIAOFEIHONG: 'xiaofeihong'
};

const CHECKPOINTS = {
  YUANXIANG: 'chapter2_yuanxiang_start',
  XIAOFEIHONG: 'chapter2_xiaofeihong_start',
  WORKSHOP: 'chapter2_workshop_start'
};

export default class Chapter2PaintScene {
  constructor(engine) {
    this.engine = engine;
    this.name = 'chapter2-paint';

    this.narrationBar = new NarrationBar(engine);
    this.notebook = new NotebookFloating(engine);
    this.hudBar = new HudBar(engine);
    this.inventoryPopup = new InventoryPopup(engine);
    this.poemCompare = null;

    this.state = SUB_SCENES.INTRO;

    this._bgYuanxiang = '/images/chapter2/chapter2-yuanxiangtang.png';
    this._bgXiaofeihong = '/images/chapter2/chapter2-xiaofeihong.png';

    this.engine.gameProgress.poemDiffsFound = this.engine.gameProgress.poemDiffsFound || 0;
    this.engine.gameProgress.foundOldComment = this.engine.gameProgress.foundOldComment || false;
    this.engine.gameProgress.heardVoice = this.engine.gameProgress.heardVoice || false;
    this.engine.gameProgress.hasInkstone = this.engine.gameProgress.hasInkstone || false;

    this._isNarrating = false;
    this._idleTimer = null;
    this._container = null;
    this._sceneRoot = null;
    this._uiLayer = null;
    this._exited = false;
    this._lightDiscussionSkipBtn = null;
  }

  /* ==================== 生命周期 ==================== */

  enter(container) {
    this._exited = false;
    this._container = container;
    this.engine.currentChapter = 2;
    this.engine.currentWorld = 'paint';
    this._container.classList.remove('real-world');
    this._container.classList.add('paint-world');

    this.engine.ensureCarryoverForChapter?.(2);

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

    this.notebook.onSubmit(async (text) => {
      this.notebook.showPlayerMessage(text);
      this.notebook.setLoading(true);
      try {
        const reply = await this.engine.aiService.queryNotebook(text);
        this.notebook.showNPCMessage(reply);
      } catch { this.notebook.showNPCMessage('（笔记本暂时无法回应）'); }
      this.notebook.setLoading(false);
    });
    this.notebook.onQuickThought(async (text) => {
      this.notebook.showPlayerMessage(text);
      this.notebook.setLoading(true);
      try {
        const reply = await this.engine.aiService.queryNotebook(text);
        this.notebook.showNPCMessage(reply);
      } catch { this.notebook.showNPCMessage('（笔记本暂时无法回应）'); }
      this.notebook.setLoading(false);
    });

    this._sceneRoot = document.createElement('div');
    this._sceneRoot.className = 'ch2-scene-root';
    this._sceneRoot.style.cssText = 'position:absolute;inset:0;';

    this._container.appendChild(this._sceneRoot);
    this._container.appendChild(this._uiLayer);

    if (this.engine.currentCheckpointId === CHECKPOINTS.XIAOFEIHONG) {
      this._switchToXiaofeihong();
    } else {
      this.engine.saveCheckpoint?.(CHECKPOINTS.YUANXIANG, {
        chapter: 2,
        scene: 'chapter2',
        world: 'paint'
      });
      this._enterYuanxiang();
    }
  }

  exit() {
    this._exited = true;
    this._clearIdleTimer();
    if (this.poemCompare) this.poemCompare.unmount();
    this.narrationBar.unmount();
    this.notebook.unmount();
    this.hudBar.unmount();
    this.inventoryPopup.unmount();
    if (this._sceneRoot) this._sceneRoot.remove();
    if (this._uiLayer) this._uiLayer.remove();
  }



  /* ==================== 远香堂场景 ==================== */

  async _enterYuanxiang() {
    this.state = SUB_SCENES.YUANXIANG;
    this._sceneRoot.innerHTML = '';
    const scene = document.createElement('div');
    scene.className = 'ch2-subscene ch2-yuanxiang active';
    scene.style.backgroundImage = `url('${this._bgYuanxiang}')`;
    this._sceneRoot.appendChild(scene);
    this._yuanxiangEl = scene;

    await this._delay(600);
    if (this._exited) return;

    this._isNarrating = true;
    await this.narrationBar.playLine(null, '穿过月洞门，视野骤然开阔。一片水面横在眼前，荷叶如盖，远处一座敞厅临水而立。');
    await this.narrationBar.playLine('沈念', '远香堂。拙政园的核心建筑。我在文献里读过无数次这个名字。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine(null, '你还没走近，就闻到一股异香。不是荷花香——是墨香，浓烈而新鲜，像有人刚刚在这里磨过墨。');
    await this.narrationBar.playLine(null, '走进敞厅，四壁空旷，只有左侧墙壁挂着数幅竖轴——是有题诗的画作，一首一幅，墨迹端正。');
    await this.narrationBar.playLine('沈念', '画案上有刚研过的墨迹……但周围空无一人。是谁刚才在这里？', { portrait: '/images/common/shennian_2.png' });
    this._isNarrating = false;

    this.hudBar.show();
    await this.narrationBar.playLine('系统提示', '右下角可打开【修复笔记本】：【记录】页可查看已获得的线索，【对话】页可写下疑问与周老师批注讨论。准备好后，点击场景中的景物即可开始探索。');
    this.narrationBar.dismiss();
    this.notebook.collapse();

    this.notebook.showQuickThoughts([
      '墙上挂的题诗画作有什么值得注意的？',
      '画案上的墨迹还没干，有人刚来过这里？',
      '远处的红色廊桥通向哪里？'
    ]);

    this._addYuanxiangHotspots(scene);
    this._resetIdleTimer('yuanxiang');
  }

  _addYuanxiangHotspots(scene) {
    this._createHotspot(scene, 60, 51, 10, () => this._onClickLotus(), '荷塘水面');
    this._createHotspot(scene, 66, 82, 10, () => this._onClickDesk(), '画案');
    this._createHotspot(scene, 13, 51, 12, () => this._onClickPoemWall(), '题诗墙');
  }

  async _onClickLotus() {
    if (this._isNarrating) return;
    this.narrationBar.showFloating('水面映着天光，荷叶如盖。远处一座红色廊桥横跨水面，倒影弯弯。');
  }

  async _onClickDesk() {
    if (this._isNarrating) return;
    this.narrationBar.showFloating('画案上有研过的墨迹，还没干透。砚台旁边散落几滴朱砂——像是匆忙离开时洒落的。');
  }

  async _onClickPoemWall() {
    if (this._isNarrating) return;
    this._isNarrating = true;
    this._clearIdleTimer();

    await this.narrationBar.playLine(null, '你走近左侧墙壁。竖轴上每一幅都是园中某处景致的小画，旁边配有一首题诗。');
    await this.narrationBar.playLine('沈念', '这些诗……我见过。文徵明为拙政园三十一景各写的题诗，存世版本一直在各种诗集里流传。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine(null, '你从袖中取出随身携带的参考抄本，展开来与墙上的题诗对照。乍一看并无不同——但你是做文物修复的人，逐字对比是基本功。');
    await this.narrationBar.playLine('沈念', '等等。这里有一个字……和传世版本不一样。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine('系统提示', '已进入诗词比对。左栏是画上题诗，右栏是参考版本——逐字对比，点击你认为不同的字。需要梳理时，可打开【修复笔记本】的【对话】页提问。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;

    this.notebook.showQuickThoughts([
      '版本比对的方法是什么？',
      '如果有字不同，说明什么？',
      '为什么要逐字对比而不是凭记忆？'
    ]);

    this._enterPoemCompare();
  }

  /* ==================== 诗词比对 ==================== */

  _enterPoemCompare() {
    this.state = SUB_SCENES.POEM_COMPARE;
    this.poemCompare = new PoemCompare(this.engine);

    this.poemCompare.onDiffFound((char, count) => {
      const hints = [
        `这个字……画上写的是"画"，传世版本是"锁"。`,
        `又一处不同。"非"和"自"——差了一个字。`,
        `第三处。"一"和"旧"。`,
        `第四处。"人"和"园"。四个字了。`
      ];
      this.narrationBar.showFloating(hints[count - 1] || '');
      this.engine.gameProgress.poemDiffsFound = count;
    });

    this.poemCompare.onWrongClick((total) => {
      if (total >= 5) {
        this.narrationBar.showFloating('别凭记忆——逐字对，一个一个来。');
      } else {
        this.narrationBar.showFloating('这个字两边一样。');
      }
    });

    this.poemCompare.onNoDiffReject(() => {
      this.narrationBar.showFloating('还不能确认无差异，再逐字对照一遍。');
    });

    this.poemCompare.onDecoyConfirm(() => {
      this.narrationBar.showFloating('这一首……每个字都对得上。看来不是每首诗都有差异。');
    });

    this.poemCompare.onComplete((diffs) => {
      this._enterReveal(diffs);
    });

    this.engine.on('poem-idle-hint', ({ text }) => {
      this.narrationBar.showFloating(text);
    });

    this.poemCompare.mount(this._yuanxiangEl);
  }

  /* ==================== "画非一人"揭示 + 旧批注 ==================== */

  async _enterReveal(diffs) {
    this.state = SUB_SCENES.REVEAL;
    if (this.poemCompare) { this.poemCompare.unmount(); this.poemCompare = null; }

    this._isNarrating = true;

    const revealEl = await showReveal(this._yuanxiangEl, {
      chars: diffs,
      charInterval: 500,
    });
    await this._delay(1200);

    await this.narrationBar.playLine(null, '四个字悬在眼前，像是从墨迹中浮了出来。');
    await this.narrationBar.playLine(null, '画。非。一。人。');
    await this.narrationBar.playLine('沈念', '画非一人……这套画，不是一个人画的？', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine('沈念', '四个字，分散在五首诗里。如果只看到一处，会以为是抄错。但四处合在一起……', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine('沈念', '断簪上的"蘅"……会是同一个人吗？留下名字，又在诗里藏了一句话？', { portrait: '/images/common/shennian_1.png' });

    this.notebook.addClueRecord('[线索] 题诗异文 — 五首题诗中四处差异字组合为"画非一人"，似乎暗示这套画作并非一人完成');
    await this.narrationBar.playLine('系统提示', '已记录线索：题诗异文「画非一人」。可在【记录】页查看，也可在【对话】页继续讨论。');

    await dismiss(revealEl, { duration: 1000, mode: 'fade-out' });

    await this._showOldComment();
    this._isNarrating = false;
  }

  async _showOldComment() {
    const commentEl = await showPaperReveal(this._yuanxiangEl, {
      html: '<p>"此页视点卑近，似非成稿。画心尚佳，惟边旁杂线、残字、旧签皆碍全册体例，宜配边压覆……"</p>',
      position: 'center',
      duration: 2500,
      scale: 0.95,
      paperCard: true,
    });

    await this.narrationBar.playLine(null, '你的目光被墙角一片几乎脱落的纸片吸引。是一则旧批注，字迹比题诗小得多，墨色也更淡。');
    await this.narrationBar.playLine(null, '"此页视点卑近，似非成稿。画心尚佳，惟边旁杂线、残字、旧签皆碍全册体例，宜配边压覆……"');
    await this.narrationBar.playLine('沈念', '"视点卑近，似非成稿"——写批注的人觉得这幅画的视角太低，不像正式作品。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine('沈念', '"宜配边压覆"……他要用装裱的边框把旁边那些杂线、残字、旧签盖住。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine('沈念', '这个人在整理这套画册。在他看来，那些东西"碍全册体例"——不够规范，所以要遮起来。', { portrait: '/images/common/shennian_1.png' });

    this.notebook.addClueRecord('[线索] 旧批注残片 — "此页视点卑近，似非成稿……宜配边压覆"。不是恶意的销毁，而是规范化的遮蔽');
    this.engine.gameProgress.foundOldComment = true;

    await this.narrationBar.playLine('系统提示', '已记录线索：「旧批注残片」。可在【记录】页查看，也可在【对话】页继续讨论。');
    this.narrationBar.dismiss();

    await dismiss(commentEl, { duration: 1000 });

    this._enterLightDiscussion();
  }

  /* ==================== 轻量讨论 ==================== */

  _enterLightDiscussion() {
    this.state = SUB_SCENES.LIGHT_DISCUSSION;
    this.notebook.setLightweightMode(true);
    this.notebook.expand();

    this.notebook.showNPCMessage('（周老师的批注）"画非一人"——你是第一个这么读的人。大多数研究者把这些差异当作传抄讹误，但你把它们并在一起读出了一个句子。这个方法叫"异文串读"。现在的问题是：这句话是谁留下的？它在对谁说？');
    this.notebook.showQuickThoughts([
      '四个差异字是有人故意留下的吗？',
      '"视点卑近"和低处视角有关系吗？',
      '留下"蘅"字的人，和这四个字有关吗？'
    ]);

    this._lightDiscussionSkipBtn = document.createElement('button');
    this._lightDiscussionSkipBtn.className = 'ch2-discussion-skip-btn';
    this._lightDiscussionSkipBtn.textContent = '跳过讨论';
    this._lightDiscussionSkipBtn.addEventListener('click', () => this._endLightDiscussion());
    this._uiLayer.appendChild(this._lightDiscussionSkipBtn);
  }

  async _endLightDiscussion() {
    this.notebook.setLightweightMode(false);
    this.notebook.collapse();
    if (this._lightDiscussionSkipBtn) {
      this._lightDiscussionSkipBtn.remove();
      this._lightDiscussionSkipBtn = null;
    }

    this._isNarrating = true;
    await this.narrationBar.playLine(null, '你合上参考抄本，把它小心地收起来。四个字仍然浮在脑海里，像一个尚未回答的问题。');
    await this.narrationBar.playLine('沈念', '画非一人。如果真是这样——另一个人是谁？是"蘅"吗？', { portrait: '/images/common/shennian_1.png' });
    await this.narrationBar.playLine(null, '你向厅外走去。远处那座红色廊桥在水面上投下弯曲的倒影，像一道没有写完的句子。');
    this.narrationBar.dismiss();
    this._isNarrating = false;

    this.engine.saveCheckpoint?.(CHECKPOINTS.XIAOFEIHONG, {
      chapter: 2,
      scene: 'chapter2',
      world: 'paint'
    });
    await this._switchToXiaofeihong();
  }

  /* ==================== 小飞虹场景 ==================== */

  async _switchToXiaofeihong() {
    this.state = SUB_SCENES.XIAOFEIHONG;
    this.hudBar.show();

    const newScene = document.createElement('div');
    newScene.className = 'ch2-subscene ch2-xiaofeihong';
    newScene.style.backgroundImage = `url('${this._bgXiaofeihong}')`;
    this._sceneRoot.appendChild(newScene);

    await this._delay(50);
    newScene.classList.add('active');
    await this._delay(600);
    if (this._yuanxiangEl) { this._yuanxiangEl.remove(); this._yuanxiangEl = null; }
    this._xiaofeihongEl = newScene;

    await this._delay(400);
    if (this._exited) return;

    this._isNarrating = true;
    await this.narrationBar.playLine(null, '一座红色廊桥横跨水面。桥身不高，弯如虹弧，倒影与桥身合在一起，恰好画出一个完整的圆。');
    await this.narrationBar.playLine('沈念', '小飞虹。我记得这个名字——"飞虹"不是说彩虹，是说桥身弯曲的弧度像一道飞起来的虹。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine(null, '你走到桥中央。四周很静，只有水面偶尔泛起的涟漪。');
    this._isNarrating = false;

    await this.narrationBar.playLine('系统提示', '小飞虹周围可以继续探索。【修复笔记本】的【记录】页已有之前的发现，【对话】页可继续讨论。点击场景中的光点查看可交互的位置。');
    this.narrationBar.dismiss();
    this.notebook.collapse();

    this.notebook.showQuickThoughts([
      '桥两侧水面好像有什么不对劲？',
      '桥脚底下那个暗色的东西是什么？',
      '"画非一人"这四个字说明什么？'
    ]);

    this._addXiaofeihongHotspots(newScene);
    this._resetIdleTimer('xiaofeihong');
  }

  _addXiaofeihongHotspots(scene) {
    this._createHotspot(scene, 62, 51, 16, () => this._onClickWater(), '水面');
    this._inkstoneSpot = this._createHotspot(scene, 30, 65, 8, () => this._onClickInkstone(), '桥脚石台');
  }

  async _onClickWater() {
    if (this._isNarrating) return;
    if (this.engine.gameProgress.heardVoice) return;
    this._isNarrating = true;
    this._clearIdleTimer();

    await this.narrationBar.playLine(null, '你俯身看向桥下的水面。忽然，水中泛起一圈暗色涟漪——没有风，但水面在动，像是有什么从水底浮上来。');
    await this.narrationBar.playLine(null, '涟漪扩散开去，在水面上留下痕迹。那些痕迹是墨迹。一个字，又一个字，从涟漪间隙中逐渐浮现。');

    const rippleEl = await showRipple(this._xiaofeihongEl, {
      html: '<p>……知我者，唯有此园。</p>',
      paperCard: true,
    });

    await this.narrationBar.playLine(null, '「……知我者，唯有此园。」');
    await this.narrationBar.playLine(null, '字迹停留了片刻，然后像墨滴溶入水中一样，缓缓消散了。');

    await dismiss(rippleEl, { mode: 'dissolve' });

    await this.narrationBar.playLine('沈念', '"知我者，唯有此园"……谁会对一座园林说这样的话？这个人把什么寄托在了这里？', { portrait: '/images/common/shennian_1.png' });

    this.engine.gameProgress.heardVoice = true;
    this.notebook.addClueRecord('[线索] 水面回声 — 小飞虹桥下墨涟漪浮现文字"知我者，唯有此园"。像是某个人留在水里的声音');

    await this.narrationBar.playLine('系统提示', '已记录线索：「水面回声」。可在【记录】页查看，也可在【对话】页继续讨论。');
    this.narrationBar.dismiss();
    this.notebook.collapse();
    this._isNarrating = false;
  }

  async _onClickInkstone() {
    if (this._isNarrating) return;
    this._isNarrating = true;
    this._clearIdleTimer();

    await this.narrationBar.playLine(null, '你注意到桥脚的石台边缘，有一个小小的暗色物件。被苔藓半遮着，不蹲下来几乎看不见。');
    await this.narrationBar.playLine(null, '蹲下身，你小心地把它取出来。是一方小砚——端砚，比掌心还小。砚池里残留着干涸的朱砂，暗红色，像很久以前的血迹。');

    const overlay = this._showItemDisplay('/images/chapter2/inkstone-front.png');

    await this.narrationBar.playLine('沈念', '朱砂……画底稿线、做标记用的。这方砚太小了，像是随身携带的私人工具。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine(null, '你翻过砚台，背面刻着一首小词，字迹纤细：');

    await this._flipItemDisplay(overlay, '/images/chapter2/inkstone-back.png');

    await this.narrationBar.playLine(null, '"园深不知处，花落有谁怜。画里青山在，无人识旧年。"');
    await this.narrationBar.playLine('沈念', '"画里青山在，无人识旧年"……写这首词的人，似乎在担心什么。担心自己留下的东西不会被人认出来？', { portrait: '/images/common/shennian_1.png' });

    this._showItemLabel(overlay, '获得物件：残砚');

    this.engine.collectItem({
      id: 'inkstone',
      name: '残砚',
      description: '小型端砚，砚池残留朱砂。砚背刻有小词："园深不知处，花落有谁怜。画里青山在，无人识旧年。"像是随身携带的私人用砚——用来调色、打草稿、做标记。',
      icon: '🪨'
    });
    this.engine.gameProgress.hasInkstone = true;

    this.notebook.addClueRecord('[物件] 残砚 — 小型端砚，砚池残留朱砂。砚背刻有小词："园深不知处，花落有谁怜。画里青山在，无人识旧年。"不是正式作画工具，更像一个人的私人用砚');

    await this.narrationBar.playLine('系统提示', '已记录线索：「残砚·砚背小词」。可在【记录】页查看，也可在【对话】页继续讨论。');

    this._hideItemDisplay(overlay);

    this.notebook.showQuickThoughts([
      '砚池里的朱砂是用来做什么的？',
      '砚背的词透露了什么？',
      '断簪、异文、残砚指向同一个人吗？'
    ]);

    if (this._inkstoneSpot) { this._inkstoneSpot.remove(); this._inkstoneSpot = null; }

    await this.narrationBar.playLine(null, '你把残砚收起来。手指上沾了一点朱砂的粉末，暗红色的，像五百年前的温度还没有完全散尽。');
    await this.narrationBar.playLine('沈念', '断簪上有她的名字。题诗里藏着"画非一人"。这方砚是私人的作画工具，砚背的词又带着深重的寄托……如果这些都指向同一个人，她可能也参与了这套画。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine(null, '你站起身。周围的光线忽然变得不对——色彩在一层一层剥落，像有人正在把这幅画从你脚下抽走。');
    this.narrationBar.dismiss();
    this._isNarrating = false;

    this._startFadeTransition();
  }

  /* ==================== 物件展示浮层 ==================== */

  _showItemDisplay(imageSrc) {
    const overlay = document.createElement('div');
    overlay.className = 'item-display-overlay';
    overlay.innerHTML = `<img class="item-display-image" src="${imageSrc}" alt="物件" />`;
    this._sceneRoot.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    return overlay;
  }

  _flipItemDisplay(overlay, newSrc) {
    return new Promise((resolve) => {
      const img = overlay.querySelector('.item-display-image');
      img.classList.add('flipping');
      setTimeout(() => {
        img.src = newSrc;
        img.classList.remove('flipping');
        setTimeout(resolve, 500);
      }, 500);
    });
  }

  _showItemLabel(overlay, text) {
    const label = document.createElement('div');
    label.className = 'item-display-label';
    label.textContent = text;
    overlay.appendChild(label);
    requestAnimationFrame(() => label.classList.add('visible'));
  }

  _hideItemDisplay(overlay) {
    if (!overlay) return;
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 800);
  }

  /* ==================== 转场与工具方法 ==================== */

  _startFadeTransition() {
    this.engine.saveCheckpoint?.(CHECKPOINTS.WORKSHOP, {
      chapter: 2,
      scene: 'chapter2-workshop',
      world: 'real'
    });
    this.engine.sceneManager.switchWithFadeToSepia('chapter2-workshop');
  }

  _createHotspot(parent, x, y, r, onClick, label) {
    const spot = document.createElement('div');
    spot.className = 'ch2-hotspot';
    spot.setAttribute('role', 'button');
    spot.setAttribute('tabindex', '0');
    spot.setAttribute('aria-label', label);
    spot.style.cssText = `left:${x}%;top:${y}%;width:${r * 2}%;height:${r * 2}%;transform:translate(-50%,-50%);`;
    spot.innerHTML = '<div class="ch2-hotspot-glow"></div>';
    spot.addEventListener('click', onClick);
    spot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    });
    parent.appendChild(spot);
    return spot;
  }

  _resetIdleTimer(phase) {
    this._clearIdleTimer();
    if (phase === 'yuanxiang') {
      this._idleTimer = setTimeout(() => {
        this.narrationBar.showFloating('题诗墙上的竖轴似乎值得仔细看看。');
      }, 25000);
    } else if (phase === 'xiaofeihong') {
      this._idleTimer = setTimeout(() => {
        this.narrationBar.showFloating('桥两侧的水面很静，静得不太自然。');
        this._idleTimer = setTimeout(() => {
          if (this._inkstoneSpot) this._inkstoneSpot.classList.add('ch2-hotspot-strong');
          this.narrationBar.showFloating('桥脚的石台边好像有什么东西。');
        }, 20000);
      }, 20000);
    }
  }

  _clearIdleTimer() {
    if (this._idleTimer) { clearTimeout(this._idleTimer); this._idleTimer = null; }
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}
