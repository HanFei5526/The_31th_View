/**
 * 第二章 · 中园 — 工作室（阶段⑧⑨）
 * 周鹤年讲解异文方法 + 章节结束
 */

import GameSceneBase from './game-scene.js';
import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';

const prologueBg = '/images/prologue/prologue-workshop.png';
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
    this._chapterTransitionTimers = [];
    this._chapterTransitionKeyHandler = null;
    this._chapterTransitionOverlay = null;
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
    this._clearChapterTransition();
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

    await this.narrationBar.playLine(null, '白光。灯管。空调的低鸣。你又回来了。');
    await this.narrationBar.playLine(null, '手指上还残留着朱砂的痕迹——或者只是你的错觉。屏幕上的扫描件安静地等在那里，像什么都没发生过。');

    await this.narrationBar.playLine('周鹤年', '你带了什么回来？', { portrait: '/images/common/zhou_henian_2.png' });

    // 展示"画非一人"四字
    const charsOverlay = this._showCharsDisplay(['画', '非', '一', '人']);
    await this.narrationBar.playLine(null, '你打开笔记本，把"画非一人"四个字指给他看。');
    await this._delay(1200);
    this._hideOverlay(charsOverlay);

    // 展示残砚
    const inkstoneOverlay = this._showItemDisplay('/images/chapter2/inkstone-front.png');
    await this.narrationBar.playLine(null, '然后翻到残砚的照片——砚池的朱砂、砚背的词。');
    await this._flipItemDisplay(inkstoneOverlay, '/images/chapter2/inkstone-back.png');
    await this._delay(800);
    this._hideOverlay(inkstoneOverlay);

    await this.narrationBar.playLine('周鹤年', '异文。', { portrait: '/images/common/zhou_henian_1.png' });
    await this.narrationBar.playLine(null, '他把笔记本拿过去，看了很久。');
    await this.narrationBar.playLine('周鹤年', '你做的事情叫"异文判断"——把同一文本的不同版本逐字对比，找出差异。这是古籍校勘的基本功。', { portrait: '/images/common/zhou_henian_1.png' });
    await this.narrationBar.playLine('周鹤年', '一个字的差异是巧合。一句话的差异是线索。但一条证据链——那才是判断的依据。', { portrait: '/images/common/zhou_henian_1.png' });
    await this.narrationBar.playLine(null, '他合上笔记本，推回你面前。');
    await this.narrationBar.playLine('周鹤年', '你现在有四个字，一支断簪，一方残砚。这些不是巧合。但它们也还不够——它们告诉你有人存在过，但不能告诉你她做了什么。', { portrait: '/images/common/zhou_henian_2.png' });
    await this.narrationBar.playLine('周鹤年', '下次进去，找物质证据。朱砂是颜料——如果她用过这方砚来画画，那么画面上应该有朱砂留下的痕迹。旧的底稿线、辅助线，那些在最终成品里被覆盖的东西。', { portrait: '/images/common/zhou_henian_1.png' });

    this.notebook.addClueRecord('（周老师的方法）版本比对与异文判断：逐字对照不同版本的同一文本，找出差异字。一个字是巧合，一句话是线索，一条证据链才是判断的依据。下一步：找物质证据——朱砂底稿线。');

    this.hudBar.show();
    await this.narrationBar.playLine(null, '【修复笔记本】记录更新：周老师方法——版本比对与异文判断');

    this.notebook.showQuickThoughts([
      '异文判断还能用在什么地方？',
      '朱砂底稿线长什么样？',
      '"画非一人"一定是有人故意留下的吗？'
    ]);

    await this.narrationBar.playLine(null, '窗外已经全黑了。你不知道自己在画里待了多久。');
    await this.narrationBar.playLine('沈念', '画非一人。如果这是真的，那个人用了五百年等一个读者——等一个不会把这四个字当作传抄错误的人。', { portrait: '/images/common/shennian_2.png' });
    await this.narrationBar.playLine('沈念', '我不会辜负她。', { portrait: '/images/common/shennian_1.png' });
    this.narrationBar.dismiss();

    await this._delay(2000);
    this._startChapter3Transition();
  }

  _startChapter3Transition() {
    this.engine.gameProgress.chapter2Complete = true;
    this.engine.gameProgress.chapter2_completed = true;
    this.engine.saveCheckpoint?.('chapter3_south_start', {
      chapter: 3,
      scene: 'chapter3',
      world: 'paint'
    });

    const overlay = document.createElement('div');
    overlay.className = 'intro-transition-overlay intro-transition-overlay--chapter3';
    this._chapterTransitionOverlay = overlay;

    const lines = [
      '西园的光线不一样了。',
      '天色暗了，像黄昏，又像一场雨要来之前。',
      '空气变得潮湿。竹叶上凝着水珠。',
      '有人在画画。或者，曾经有人在这里画画。'
    ];

    overlay.innerHTML = `
      <div class="ch3-transition-bg"></div>
      <div class="prologue-transition-layout">
        <div class="intro-title-group">
          <div class="intro-prologue-title">第三章 · 西园</div>
        </div>
        <div class="intro-prologue-text" id="intro-chapter3-from-workshop-text"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const textContainer = overlay.querySelector('#intro-chapter3-from-workshop-text');
    const sceneReady = this._preloadImage('/images/chapter3/chapter3-yuanyang-south.png');
    let finished = false;

    const finish = async (fast = false) => {
      if (finished) return;
      finished = true;
      this._clearChapterTransition({ keepOverlay: true });

      textContainer.querySelectorAll('span').forEach((line) => {
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
      });

      await sceneReady;
      this.engine.currentChapter = 3;
      this.engine.currentWorld = 'paint';
      this.engine._applyWorldTheme?.();
      this._chapterTransitionOverlay = null;
      await this.engine.switchScene('chapter3', true);

      overlay.style.transition = fast ? 'opacity 0.4s ease' : 'opacity 1s ease';
      overlay.classList.remove('active');
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), fast ? 450 : 1100);
    };

    this._chapterTransitionKeyHandler = (e) => {
      if (!this._isFastForwardKey(e) || this._isTextInputActive()) return;
      e.preventDefault();
      finish(true);
    };
    document.addEventListener('keydown', this._chapterTransitionKeyHandler);

    this._chapterTransitionTimers.push(setTimeout(() => {
      overlay.classList.add('active');
      const title = overlay.querySelector('.intro-prologue-title');
      if (title) {
        title.style.opacity = '1';
        title.style.transform = 'translateY(0)';
      }
    }, 50));

    this._chapterTransitionTimers.push(setTimeout(() => {
      lines.forEach((line, index) => {
        const p = document.createElement('span');
        p.textContent = line;
        p.style.opacity = '0';
        p.style.transform = 'translateY(15px)';
        p.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
        p.style.display = 'block';
        textContainer.appendChild(p);

        this._chapterTransitionTimers.push(setTimeout(() => {
          p.style.opacity = '1';
          p.style.transform = 'translateY(0)';
        }, index * 1200));
      });

      const totalDuration = (lines.length - 1) * 1200 + 1200 + 3000;
      this._chapterTransitionTimers.push(setTimeout(finish, totalDuration));
    }, 1500));
  }

  _clearChapterTransition(options = {}) {
    this._chapterTransitionTimers.forEach((timer) => clearTimeout(timer));
    this._chapterTransitionTimers = [];

    if (this._chapterTransitionKeyHandler) {
      document.removeEventListener('keydown', this._chapterTransitionKeyHandler);
      this._chapterTransitionKeyHandler = null;
    }

    if (!options.keepOverlay && this._chapterTransitionOverlay) {
      this._chapterTransitionOverlay.remove();
      this._chapterTransitionOverlay = null;
    }
  }

  _preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    });
  }

  _isFastForwardKey(e) {
    return e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'KeyZ' || e.key?.toLowerCase() === 'z';
  }

  _isTextInputActive() {
    const activeEl = document.activeElement;
    return activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.tagName === 'SELECT' ||
      activeEl.isContentEditable
    );
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
