import GameSceneBase from './game-scene.js';
import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';

const workshopBg = '/images/prologue/prologue-workshop.png';
const CHAPTER3_WORKSHOP_CHECKPOINT = 'chapter3_workshop_start';

export default class Chapter3WorkshopScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
    this.name = 'chapter3-workshop';

    this.narrationBar = null;
    this.notebook = null;
    this.hudBar = null;
    this.inventoryPopup = null;
    this._chapterTransitionTimers = [];
    this._chapterTransitionKeyHandler = null;
    this._chapterTransitionOverlay = null;
  }

  async enter(container) {
    const root = this._buildSceneShell({
      bgImage: workshopBg,
      theme: 'light',
    });

    container.innerHTML = '';
    container.appendChild(root);

    this.engine.currentChapter = 3;
    this.engine.currentWorld = 'real';
    this.engine.ensureCarryoverForChapter?.(3, { persist: false });
    this.engine._applyWorldTheme?.();

    if (document.body) document.body.classList.remove('paint-world');
    if (container) {
      container.classList.remove('paint-world');
      container.classList.add('real-world');
    }

    this._hideNarration();
    if (this._narrationPanel) this._narrationPanel.style.display = 'none';

    this.narrationBar = new NarrationBar(this.engine);
    this.narrationBar.mount(root);

    this.notebook = new NotebookFloating(this.engine);
    this.notebook.mount(root);

    this.hudBar = new HudBar(this.engine);
    this.hudBar.mount(root);

    this.inventoryPopup = new InventoryPopup(this.engine);
    this.inventoryPopup.mount(root);

    if (this.narrationBar._container) this.narrationBar._container.style.pointerEvents = 'auto';
    if (this.notebook._container) this.notebook._container.style.pointerEvents = 'auto';

    this.hudBar.onNotebookClick(() => {
      if (this.notebook.isExpanded()) this.notebook.collapse();
      else this.notebook.expand();
    });
    this.hudBar.onInventoryClick(() => this.inventoryPopup.open());

    this.notebook.onSubmit(async (text) => await this._askNotebook(text));
    this.notebook.onQuickThought(async (text) => await this._askNotebook(text));

    if (this.engine.currentCheckpointId !== CHAPTER3_WORKSHOP_CHECKPOINT) {
      this.engine.saveCheckpoint?.(CHAPTER3_WORKSHOP_CHECKPOINT, {
        chapter: 3,
        scene: 'chapter3-workshop',
        world: 'real'
      });
    }

    this.hudBar.show();
    this._startDialogue();
  }

  async _askNotebook(text) {
    if (!text?.trim()) return;
    this.notebook.showPlayerMessage(text);
    this.notebook.setLoading(true);
    try {
      const reply = await this.engine.aiService.queryNotebook(text);
      this.notebook.showNPCMessage(reply);
    } catch (err) {
      console.error('[Chapter3Workshop] 笔记本查询失败:', err);
      this.notebook.showNPCMessage('（翻了翻，没有找到相关记录）');
    } finally {
      this.notebook.setLoading(false);
    }
  }

  exit() {
    this._clearChapterTransition();
    if (this.narrationBar) this.narrationBar.unmount();
    if (this.notebook) this.notebook.unmount();
    if (this.hudBar) this.hudBar.unmount();
    if (this.inventoryPopup) this.inventoryPopup.unmount();
    super.exit();
  }

  async _startDialogue() {
    await new Promise(r => setTimeout(r, 1500));

    await this.narrationBar.playLine(null, '工作台上的灯还亮着。你不知道自己离开了多久——几分钟？几小时？只感觉手中似乎还留着灰泥粉末的触感。');
    await this.narrationBar.playLine(null, '周鹤年坐在对面，没有抬头。过了一会儿，他开口了。');
    await this.narrationBar.playLine('周鹤年', '我年轻时，也见过一个"蘅"字。', { portrait: '/images/common/zhou_henian_2.png' });
    await this.narrationBar.playLine('周鹤年', '在旧扫描图的边缘，很淡，像题签残笔。我没有写进报告。', { portrait: '/images/common/zhou_henian_2.png' });
    await this.narrationBar.playLine('沈念', '为什么？', { portrait: '/images/common/shennian_3.png' });
    await this.narrationBar.playLine('周鹤年', '因为一个字不能证明一个人。一条线也不能证明一个视角。', { portrait: '/images/common/zhou_henian_2.png' });
    await this.narrationBar.playLine('周鹤年', '修复报告不是小说。你写下的每一个字，都要负责。', { portrait: '/images/common/zhou_henian_2.png' });
    await this.narrationBar.playLine('周鹤年', '但你不写，也是一种判断。', { portrait: '/images/common/zhou_henian_2.png' });
    this.narrationBar.dismiss();

    await new Promise(r => setTimeout(r, 2000));

    await this.narrationBar.playLine(null, '那天晚上，你又把那封信读了一遍。');
    await this.narrationBar.playLine(null, '"不必有名，不必有形。只要有痕迹。"');
    await this.narrationBar.playLine('沈念', '我忽然明白了。这句话不是她不想被记住。是她太清楚——在那个年代，一个寄居的女子，连"要求被记住"的资格都没有。', { portrait: '/images/common/shennian_3.png' });
    await this.narrationBar.playLine('沈念', '她不是不想要，是不敢要。于是把愿望压到最低：只求别被彻底抹去。', { portrait: '/images/common/shennian_3.png' });
    await this.narrationBar.playLine('沈念', '我也想起自己受过的训练：只写可证之事，不写无据之人。我一直以为那是严谨。', { portrait: '/images/common/shennian_3.png' });
    await this.narrationBar.playLine('沈念', '可此刻我第一次意识到——所谓谨慎，有时是在保护真相，有时，也是在保护沉默。', { portrait: '/images/common/shennian_3.png' });
    this.narrationBar.dismiss();

    this._chapterTransitionTimers.push(setTimeout(() => {
      this._startFinaleTransition();
    }, 2000));
  }

  _startFinaleTransition() {
    this.engine.gameProgress.chapter3Complete = true;
    this.engine.gameProgress.chapter3_completed = true;
    this.engine.saveCheckpoint?.('finale_truth_start', {
      chapter: 4,
      scene: 'finale',
      world: 'paint'
    });

    const overlay = document.createElement('div');
    overlay.className = 'intro-transition-overlay intro-transition-overlay--finale';
    this._chapterTransitionOverlay = overlay;

    const lines = [
      '这一次进入画中，没有出现在任何一处景点。',
      '只有一片空白，像翻到一页还没有落墨的纸。',
      '断簪，残砚，一幅从墙上拓下来的草图。',
      '第三十一景还差最后一笔。这一笔该怎么落，由你决定。'
    ];

    overlay.innerHTML = `
      <div class="finale-transition-bg"></div>
      <div class="prologue-transition-layout">
        <div class="intro-title-group">
          <div class="intro-prologue-title">终章 · 第三十一景</div>
        </div>
        <div class="intro-prologue-text" id="intro-finale-from-workshop-text"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const textContainer = overlay.querySelector('#intro-finale-from-workshop-text');
    const sceneReady = this._preloadImage('/images/finale/finale-truth-space.png');
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
      this.engine.currentChapter = 4;
      this.engine.currentWorld = 'paint';
      this.engine._applyWorldTheme?.();
      this._chapterTransitionOverlay = null;
      await this.engine.switchScene('finale', true);

      overlay.style.transition = fast ? 'opacity 0.4s ease' : 'opacity 1.2s ease';
      overlay.classList.remove('active');
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), fast ? 450 : 1300);
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
}
