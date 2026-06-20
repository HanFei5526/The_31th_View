/**
 * 第二章 · 中园 — 工作室（阶段⑧⑨）
 * 周鹤年讲解异文方法 + 章节结束
 */

import GameSceneBase from './game-scene.js';
import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';

const prologueBg = '/images/prologue-workshop.png';
const CHAPTER2_WORKSHOP_CHECKPOINT = 'chapter2_workshop_start';

export default class Chapter2WorkshopScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
    this.name = 'chapter2-workshop';
    this.narrationBar = null;
    this.notebook = null;
    this.hudBar = null;
    this.inventoryPopup = null;
    this._endCard = null;
  }

  async enter(container) {
    this._buildSceneShell({ bgImage: prologueBg, theme: 'light' });
    container.appendChild(this._root);

    this.engine.currentChapter = 2;
    this.engine.currentWorld = 'real';
    this.engine.ensureCarryoverForChapter?.(2, { persist: false });
    this.engine._applyWorldTheme?.();
    container.classList.remove('paint-world');
    container.classList.add('real-world');

    this._hideNarration();

    const uiLayer = document.createElement('div');
    uiLayer.className = 'scene-ui-layer';
    uiLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:10;';

    this.narrationBar = new NarrationBar(this.engine);
    this.notebook = new NotebookFloating(this.engine);
    this.hudBar = new HudBar(this.engine);
    this.inventoryPopup = new InventoryPopup(this.engine);

    this.narrationBar.mount(uiLayer);
    this.notebook.mount(uiLayer);
    this.hudBar.mount(uiLayer);
    this.inventoryPopup.mount(uiLayer);

    this.hudBar.onNotebookClick(() => {
      if (this.notebook.isExpanded()) this.notebook.collapse();
      else this.notebook.expand();
    });
    this.hudBar.onInventoryClick(() => this.inventoryPopup.toggle());

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

    container.appendChild(uiLayer);
    this._uiLayer = uiLayer;

    if (this.engine.currentCheckpointId !== CHAPTER2_WORKSHOP_CHECKPOINT) {
      this.engine.saveCheckpoint?.(CHAPTER2_WORKSHOP_CHECKPOINT, {
        chapter: 2,
        scene: 'chapter2-workshop',
        world: 'real'
      });
    }

    this._startDialogue();
  }

  exit() {
    if (this.narrationBar) this.narrationBar.unmount();
    if (this.notebook) this.notebook.unmount();
    if (this.hudBar) this.hudBar.unmount();
    if (this.inventoryPopup) this.inventoryPopup.unmount();
    if (this._endCard) this._endCard.remove();
    if (this._uiLayer) this._uiLayer.remove();
    super.exit();
  }

  async _startDialogue() {
    await this._delay(1500);

    await this.narrationBar.playLine(null, '白光。灯管。空调的低鸣。你又回来了。', { portrait: '/images/shennian_1.png' });
    await this.narrationBar.playLine(null, '手指上还残留着朱砂的痕迹——或者只是你的错觉。屏幕上的扫描件安静地等在那里，像什么都没发生过。', { portrait: '/images/shennian_1.png' });

    await this.narrationBar.playLine('周鹤年', '你带了什么回来？', { portrait: '/images/zhou_henian_2.png' });

    // 展示"画非一人"四字
    const charsOverlay = this._showCharsDisplay(['画', '非', '一', '人']);
    await this.narrationBar.playLine(null, '你打开笔记本，把"画非一人"四个字指给他看。', { portrait: '/images/shennian_2.png' });
    await this._delay(1200);
    this._hideOverlay(charsOverlay);

    // 展示残砚
    const inkstoneOverlay = this._showItemDisplay('/images/inkstone-front.png');
    await this.narrationBar.playLine(null, '然后翻到残砚的照片——砚池的朱砂、砚背的词。', { portrait: '/images/shennian_2.png' });
    await this._flipItemDisplay(inkstoneOverlay, '/images/inkstone-back.png');
    await this._delay(800);
    this._hideOverlay(inkstoneOverlay);

    await this.narrationBar.playLine('周鹤年', '异文。', { portrait: '/images/zhou_henian_1.png' });
    await this.narrationBar.playLine(null, '他把笔记本拿过去，看了很久。', { portrait: '/images/zhou_henian_1.png' });
    await this.narrationBar.playLine('周鹤年', '你做的事情叫"异文判断"——把同一文本的不同版本逐字对比，找出差异。这是古籍校勘的基本功。', { portrait: '/images/zhou_henian_1.png' });
    await this.narrationBar.playLine('周鹤年', '一个字的差异是巧合。一句话的差异是线索。但一条证据链——那才是判断的依据。', { portrait: '/images/zhou_henian_1.png' });
    await this.narrationBar.playLine(null, '他合上笔记本，推回你面前。', { portrait: '/images/zhou_henian_2.png' });
    await this.narrationBar.playLine('周鹤年', '你现在有四个字，一支断簪，一方残砚。这些不是巧合。但它们也还不够——它们告诉你有人存在过，但不能告诉你她做了什么。', { portrait: '/images/zhou_henian_2.png' });
    await this.narrationBar.playLine('周鹤年', '下次进去，找物质证据。朱砂是颜料——如果她用过这方砚来画画，那么画面上应该有朱砂留下的痕迹。旧的底稿线、辅助线，那些在最终成品里被覆盖的东西。', { portrait: '/images/zhou_henian_1.png' });

    this.notebook.addClueRecord('（周老师的方法）版本比对与异文判断：逐字对照不同版本的同一文本，找出差异字。一个字是巧合，一句话是线索，一条证据链才是判断的依据。下一步：找物质证据——朱砂底稿线。');

    this.hudBar.show();
    await this.narrationBar.playLine(null, '笔记本记录更新：周老师方法——版本比对与异文判断');

    this.notebook.showQuickThoughts([
      '异文判断还能用在什么地方？',
      '朱砂底稿线长什么样？',
      '"画非一人"一定是有人故意留下的吗？'
    ]);

    await this.narrationBar.playLine(null, '窗外已经全黑了。你不知道自己在画里待了多久。', { portrait: '/images/shennian_1.png' });
    await this.narrationBar.playLine('沈念', '画非一人。如果这是真的，那个人用了五百年等一个读者——等一个不会把这四个字当作传抄错误的人。', { portrait: '/images/shennian_2.png' });
    await this.narrationBar.playLine('沈念', '我不会辜负她。', { portrait: '/images/shennian_1.png' });
    this.narrationBar.dismiss();

    await this._delay(2000);
    this._showChapterEnd();
  }

  _showChapterEnd() {
    this.engine.gameProgress.chapter2Complete = true;
    this.engine.gameProgress.chapter2_completed = true;
    this.engine.saveCheckpoint?.('chapter3_south_start', {
      chapter: 3,
      scene: 'chapter3',
      world: 'paint'
    });

    this._endCard = document.createElement('div');
    this._endCard.className = 'chapter-end-card full-viewport flex-center flex-col';
    this._endCard.innerHTML = `
      <h2 class="chapter-end-title">第二章 · 中园 · 完</h2>
      <button class="chapter-end-btn">返回菜单</button>
    `;
    this._endCard.style.opacity = '0';
    this._root.appendChild(this._endCard);

    requestAnimationFrame(() => {
      this._endCard.style.transition = 'opacity 1.2s ease';
      this._endCard.style.opacity = '1';
    });

    this._endCard.querySelector('.chapter-end-btn').addEventListener('click', () => {
      this.engine.switchScene('menu');
    });
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /* ==================== 物件展示浮层 ==================== */

  _showItemDisplay(imageSrc) {
    const overlay = document.createElement('div');
    overlay.className = 'item-display-overlay';
    overlay.innerHTML = `<img class="item-display-image" src="${imageSrc}" alt="物件" />`;
    this._root.appendChild(overlay);
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

  _showCharsDisplay(chars) {
    const overlay = document.createElement('div');
    overlay.className = 'item-display-overlay';
    overlay.innerHTML = `
      <div class="ch2-reveal-chars">
        ${chars.map(c => `<span class="ch2-reveal-char">${c}</span>`).join('')}
      </div>
    `;
    this._root.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    return overlay;
  }

  _hideOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 800);
  }
}
