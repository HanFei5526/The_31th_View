import GameSceneBase from './game-scene.js';
import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';

const prologueBg = '/images/prologue-workshop.png';

export default class Chapter1WorkshopScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
    this.name = 'chapter1-workshop';
    
    this.narrationBar = null;
    this.notebook = null;
    this.hudBar = null;
    this.inventoryPopup = null;
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
    this.engine.ensureCarryoverForChapter?.(1);
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
    
    await this.narrationBar.playLine(null, '一阵白光刺进眼睛。你眨了眨眼，熟悉的冷白色灯管重新出现在视野里。', { portrait: '/images/shennian_1.png' });
    await this.narrationBar.playLine(null, '你回到了工作室。屏幕上仍然是第三十一景的扫描件，光标在那里一闪一闪。你低头看修复日志——上面多出了几处标注，是你不记得写过的。', { portrait: '/images/shennian_1.png' });
    await this.narrationBar.playLine('周鹤年', '你刚才盯着屏幕看了很久。发现什么了？', { portrait: '/images/zhou_henian_2.png' });
    
    const choice = await this.narrationBar.showOptions([
      { label: '这页画底下藏着另一套说明。', value: 'A' },
      { label: '我觉得这幅画里……有人留下了东西。', value: 'B' }
    ]);
    
    this.engine.gameProgress.chapter1Choice = choice;

    await this.narrationBar.playLine('周鹤年', '继续。', { portrait: '/images/zhou_henian_2.png' });
    await this.narrationBar.playLine(null, '你翻开笔记本，把断簪上那个字指给他看。', { portrait: '/images/shennian_1.png' });
    await this.narrationBar.playLine(null, '他看着那个字，沉默了几秒。', { portrait: '/images/zhou_henian_2.png' });
    await this.narrationBar.playLine('周鹤年', '蘅。你知道这个字的意思？', { portrait: '/images/zhou_henian_2.png' });
    await this.narrationBar.playLine(null, '你点了点头。笔记本里的批注已经解释过——杜衡，香草，古人用来比喻品性高洁的女子。', { portrait: '/images/shennian_1.png' });
    await this.narrationBar.playLine('周鹤年', '但一个字不能说明什么。它可能是名字，也可能只是巧合。你要找到更多相关的证据。', { portrait: '/images/zhou_henian_2.png' });
    await this.narrationBar.playLine(null, '他把笔记本推回你面前，手指点了点扉页上自己写的那行字。', { portrait: '/images/zhou_henian_2.png' });
    await this.narrationBar.playLine('周鹤年', '你继续查的时候，多留意参考文献。题跋、匾额、边注——这些地方最容易留下不够正式、却最诚实的东西。', { portrait: '/images/zhou_henian_2.png' });

    if (choice === 'A') {
      this.notebook.addClueRecord('[沈念的判断] 这页画底下藏着另一套说明——画面结构可能有隐藏的辅助标注层。');
    } else {
      this.notebook.addClueRecord('[沈念的判断] 画里有人留下了东西——不是画家本人的正式创作，而是某个人的私人痕迹。');
    }
    this.notebook.addClueRecord('[周老师的建议] 关注题跋、匾额与边注——这些地方最容易留下不够正式、却最诚实的东西。');
    this.notebook.showQuickThoughts([
      '”蘅”字现在能说明到哪一步？',
      '断簪为什么要把字刻在背面？',
      '接下来为什么要看题跋、匾额和边注？'
    ]);

    this.hudBar.show();
    await this.narrationBar.playLine('系统提示', '笔记本记录更新：周老师建议——关注题跋、匾额与边注。你可以在修复笔记本的「记录」页查看刚更新的判断和线索；如果想继续梳理，也可以回到「对话」页，用新的快捷问题或自己的话继续讨论。');

    await this.narrationBar.playLine(null, '窗外的梧桐树在晚风里轻轻摇动。你合上笔记本，但脑海中仍然浮着那个字。', { portrait: '/images/shennian_1.png' });
    await this.narrationBar.playLine('沈念', '蘅。是谁？', { portrait: '/images/shennian_2.png' });
    this.narrationBar.dismiss();

    // 画面短暂停留 2s 后显示章节结束卡
    setTimeout(() => this._showChapterEnd(), 2000);
  }

  _showChapterEnd() {
    this.engine.gameProgress.chapter1Complete = true;
    this.engine.gameProgress.chapter1_completed = true;
    this.engine.saveProgress();

    this._endCard = document.createElement('div');
    this._endCard.className = 'chapter-end-card full-viewport flex-center flex-col';
    this._endCard.style.position = 'absolute';
    this._endCard.style.inset = '0';
    this._endCard.style.background = 'rgba(245, 240, 232, 0.9)';
    this._endCard.style.zIndex = '100';
    this._endCard.style.opacity = '0';
    this._endCard.style.transition = 'opacity 1s ease';
    
    this._endCard.innerHTML = `
      <h2 style="font-size: 2.5rem; margin-bottom: 2rem; color: var(--real-accent); letter-spacing: 0.1em;">第一章 · 东园 · 完</h2>
      <button class="choice-btn" style="max-width: 200px; text-align: center;">返回菜单</button>
    `;
    
    this._root.appendChild(this._endCard);
    
    const btn = this._endCard.querySelector('button');
    btn.addEventListener('click', () => {
      this.engine.switchScene('menu');
    });

    // 渐显动画
    setTimeout(() => {
      this._endCard.style.opacity = '1';
    }, 100);
  }
}
