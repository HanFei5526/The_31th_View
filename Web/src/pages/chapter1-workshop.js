import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';

export default class Chapter1WorkshopScene {
  constructor(engine) {
    this.engine = engine;
    this.name = 'chapter1-workshop';
    
    this.narrationBar = new NarrationBar(engine);
    this.notebook = new NotebookFloating(engine);
    
    this._container = null;
    this._sceneRoot = null;
    
    // 现实工作台背景
    this._bgImage = '/images/chapter1-bg-placeholder.png'; // 后续可换为工作台占位图
  }

  enter(container) {
    this._container = container;
    
    // 更新世界状态
    this.engine.currentWorld = 'real';
    this.engine._applyWorldTheme();
    
    // UI 层
    this._uiLayer = document.createElement('div');
    this._uiLayer.className = 'scene-ui-layer';
    this._uiLayer.style.position = 'absolute';
    this._uiLayer.style.inset = '0';
    this._uiLayer.style.pointerEvents = 'none';
    
    // 挂载组件
    this.narrationBar.mount(this._uiLayer);
    this.notebook.mount(this._uiLayer);
    
    if (this.narrationBar._container) this.narrationBar._container.style.pointerEvents = 'auto';
    if (this.notebook._container) this.notebook._container.style.pointerEvents = 'auto';

    // 场景根节点
    this._sceneRoot = document.createElement('div');
    this._sceneRoot.className = 'ch1-scene full-viewport';
    this._sceneRoot.style.backgroundImage = `url('${this._bgImage}')`;
    this._sceneRoot.style.backgroundSize = 'cover';
    this._sceneRoot.style.backgroundPosition = 'center';
    
    this._container.appendChild(this._sceneRoot);
    this._container.appendChild(this._uiLayer);
    
    this._startDialogue();
  }

  exit() {
    this.narrationBar.unmount();
    this.notebook.unmount();
    if (this._sceneRoot) this._sceneRoot.remove();
    if (this._uiLayer) this._uiLayer.remove();
    if (this._endCard) this._endCard.remove();
  }

  async _startDialogue() {
    // 等待褪色遮罩渐渐消失 (fade-to-sepia-overlay)
    await new Promise(r => setTimeout(r, 1500));
    
    await this.narrationBar.playLine(null, '一阵白光刺进眼睛。你眨了眨眼，熟悉的冷白色灯管重新出现在视野里。');
    await this.narrationBar.playLine(null, '你回到了工作室。屏幕上仍然是第三十一景的扫描件，光标在那里一闪一闪。你低头看修复日志——上面多出了几处标注，是你不记得写过的。');
    await this.narrationBar.playLine('周鹤年', '你刚才盯着屏幕看了很久。发现什么了？', { portrait: '/images/zhou_henian.png' });
    
    const choice = await this.narrationBar.showOptions([
      { label: '这页画底下藏着另一套说明。', value: 'A' },
      { label: '我觉得这幅画里……有人留下了东西。', value: 'B' }
    ]);
    
    this.engine.gameProgress.chapter1Choice = choice;

    await this.narrationBar.playLine('周鹤年', '继续。', { portrait: '/images/zhou_henian.png' });
    await this.narrationBar.playLine(null, '你翻开笔记本，把断簪上那个字指给他看。');
    await this.narrationBar.playLine(null, '他看着那个字，沉默了几秒。');
    await this.narrationBar.playLine('周鹤年', '蘅。你知道这个字的意思？', { portrait: '/images/zhou_henian.png' });
    await this.narrationBar.playLine(null, '你点了点头。笔记本里的批注已经解释过——杜衡，香草，古人用来比喻品性高洁的女子。');
    await this.narrationBar.playLine('周鹤年', '但一个字不能说明什么。它可能是名字，也可能只是巧合。你要找到更多相关的证据。', { portrait: '/images/zhou_henian.png' });
    await this.narrationBar.playLine(null, '他把笔记本推回你面前，手指点了点扉页上自己写的那行字。');
    await this.narrationBar.playLine('周鹤年', '你继续查的时候，多留意参考文献。题跋、匾额、边注——这些地方最容易留下不够正式、却最诚实的东西。', { portrait: '/images/zhou_henian.png' });

    this.notebook.addClueRecord('[周老师的建议] 关注题跋、匾额与边注——这些地方最容易留下不够正式、却最诚实的东西。');
    this.narrationBar.showFeedback('📝 笔记本记录更新：周老师建议——关注题跋、匾额与边注');

    await this.narrationBar.playLine(null, '窗外的梧桐树在晚风里轻轻摇动。你合上笔记本，但脑海中仍然浮着那个字。');
    await this.narrationBar.playLine('沈念', '蘅。是谁？', { portrait: '/images/shennian.png' });
    this.narrationBar.dismiss();

    this._showChapterEnd();
  }

  _showChapterEnd() {
    this.engine.gameProgress.chapter1Complete = true;
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
    
    this._container.appendChild(this._endCard);
    
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
