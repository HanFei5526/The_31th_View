import GameSceneBase from './game-scene.js';
import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';

const prologueBg = '/images/prologue/prologue-workshop.png';
const CHAPTER1_WORKSHOP_CHECKPOINT = 'chapter1_workshop_start';

export default class Chapter1WorkshopScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
    this.name = 'chapter1-workshop';
    
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
      bgImage: prologueBg,
      theme: 'light',
    });

    container.innerHTML = '';
    container.appendChild(root);

    // 确保是现实世界主题
    this.engine.currentChapter = 1;
    this.engine.currentWorld = 'real';
    this.engine.ensureCarryoverForChapter?.(1, { persist: false });
    this.engine._applyWorldTheme();
    
    // 强制清除可能的残留样式
    if (document.body) document.body.classList.remove('paint-world');
    if (container) {
      container.classList.remove('paint-world');
      container.classList.add('real-world');
    }

    // 隐藏基类底部旁白面板
    this._hideNarration();
    if (this._narrationPanel) this._narrationPanel.style.display = 'none';

    // 挂载组件
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

    if (this.engine.currentCheckpointId !== CHAPTER1_WORKSHOP_CHECKPOINT) {
      this.engine.saveCheckpoint?.(CHAPTER1_WORKSHOP_CHECKPOINT, {
        chapter: 1,
        scene: 'chapter1-workshop',
        world: 'real'
      });
    }

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
      console.error('[Chapter1Workshop] 笔记本查询失败:', err);
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
    if (this._endCard) this._endCard.remove();
    super.exit();
  }

  async _startDialogue() {
    // 等待褪色遮罩渐渐消失 (fade-to-sepia-overlay)
    await new Promise(r => setTimeout(r, 1500));
    
    await this.narrationBar.playLine(null, '一阵白光刺进眼睛。你眨了眨眼，熟悉的冷白色灯管重新出现在视野里。');
    await this.narrationBar.playLine(null, '你回到了工作室。屏幕上仍然是第三十一景的扫描件，光标在那里一闪一闪。你低头看修复日志——上面多出了几处标注，是你不记得写过的。');
    await this.narrationBar.playLine('周鹤年', '你刚才盯着屏幕看了很久。发现什么了？', { portrait: '/images/common/zhou_henian_2.png' });
    
    const choice = await this.narrationBar.showOptions([
      { label: '这页画底下藏着另一套说明。', value: 'A' },
      { label: '我觉得这幅画里……有人留下了东西。', value: 'B' }
    ]);
    
    this.engine.gameProgress.chapter1Choice = choice;

    await this.narrationBar.playLine('周鹤年', '继续。', { portrait: '/images/common/zhou_henian_2.png' });
    await this.narrationBar.playLine(null, '你翻开笔记本，把断簪上那个字指给他看。');
    await this.narrationBar.playLine(null, '他看着那个字，沉默了几秒。');
    await this.narrationBar.playLine('周鹤年', '蘅。你知道这个字的意思？', { portrait: '/images/common/zhou_henian_2.png' });
    await this.narrationBar.playLine(null, '你点了点头。笔记本里的批注已经解释过——杜衡，香草，古人用来比喻品性高洁的女子。');
    await this.narrationBar.playLine('周鹤年', '但一个字不能说明什么。它可能是名字，也可能只是巧合。你要找到更多相关的证据。', { portrait: '/images/common/zhou_henian_2.png' });
    await this.narrationBar.playLine(null, '他把笔记本推回你面前，手指点了点扉页上自己写的那行字。');
    await this.narrationBar.playLine('周鹤年', '你继续查的时候，多留意参考文献。题跋、匾额、边注——这些地方最容易留下不够正式、却最诚实的东西。', { portrait: '/images/common/zhou_henian_2.png' });

    if (choice === 'A') {
      this.notebook.addClueRecord('[沈念的判断] 这页画底下藏着另一套说明——画面结构可能有隐藏的辅助标注层。');
    } else {
      this.notebook.addClueRecord('[沈念的判断] 画里有人留下了东西——不是画家本人的正式创作，而是某个人的私人痕迹。');
    }
    this.notebook.addClueRecord('[周老师的建议] 关注题跋、匾额与边注——这些地方最容易留下不够正式、却最诚实的东西。');
    this.notebook.showQuickThoughts([
      '”蘅”字现在能说明到哪一步？',
      '断簪能否证明画里有人留下了私人痕迹？',
      '接下来为什么要看题跋、匾额和边注？'
    ]);

    this.hudBar.show();
    await this.narrationBar.playLine('系统提示', '【修复笔记本】记录更新：周老师建议——关注题跋、匾额与边注。可在【记录】页查看，也可在【对话】页继续讨论。');

    await this.narrationBar.playLine(null, '窗外的梧桐树在晚风里轻轻摇动。你合上笔记本，但脑海中仍然浮着那个字。');
    await this.narrationBar.playLine('沈念', '蘅。是谁？', { portrait: '/images/common/shennian_2.png' });
    this.narrationBar.dismiss();

    this._chapterTransitionTimers.push(setTimeout(() => {
      this._startChapter2Transition();
    }, 1200));
  }

  _startChapter2Transition() {
    this.engine.gameProgress.chapter1Complete = true;
    this.engine.gameProgress.chapter1_completed = true;
    this.engine.saveCheckpoint?.('chapter2_yuanxiang_start', {
      chapter: 2,
      scene: 'chapter2',
      world: 'paint'
    });

    const overlay = document.createElement('div');
    overlay.className = 'intro-transition-overlay intro-transition-overlay--chapter2';
    this._chapterTransitionOverlay = overlay;

    const lines = [
      '远香堂。拙政园的中心，四面环水。',
      '堂内挂着几首题诗，你在文献里都读到过。',
      '但有几个字，和你记得的不一样。',
      '差异很小。小到像抄错。又太巧，巧到不像抄错。'
    ];

    overlay.innerHTML = `
      <div class="prologue-transition-layout">
        <div class="intro-prologue-title">第二章 · 中园</div>
        <div class="intro-prologue-text" id="intro-chapter2-from-workshop-text"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const textContainer = overlay.querySelector('#intro-chapter2-from-workshop-text');
    const chapter2Ready = this._preloadImage('/images/chapter2/chapter2-yuanxiangtang.png');
    let finished = false;

    const finish = async (fast = false) => {
      if (finished) return;
      finished = true;
      this._clearChapterTransition({ keepOverlay: true });

      textContainer.querySelectorAll('span').forEach((line) => {
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
      });

      await chapter2Ready;
      this.engine.currentChapter = 2;
      this.engine.currentWorld = 'paint';
      this.engine._applyWorldTheme?.();
      await this.engine.switchScene('chapter2', true);

      overlay.style.transition = fast ? 'opacity 0.4s ease' : 'opacity 1s ease';
      overlay.classList.remove('active');
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        if (this._chapterTransitionOverlay === overlay) {
          this._chapterTransitionOverlay = null;
        }
      }, fast ? 450 : 1100);
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

  _preloadImage(src, timeout = 3000) {
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(done, timeout);
      img.onload = done;
      img.onerror = done;
      img.src = src;
    });
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
