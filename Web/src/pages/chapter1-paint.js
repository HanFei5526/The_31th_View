import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';

const SCENE_STATES = {
  TITLE: 'title',
  LANXUE: 'lanxue',
  ZHUIYUN: 'zhuiyun',
  FURONG: 'furong',
  PUZZLE: 'puzzle',
  LIGHT_DISCUSSION: 'light_discussion'
};

export default class Chapter1PaintScene {
  constructor(engine) {
    this.engine = engine;
    this.name = 'chapter1-paint';
    
    this.narrationBar = new NarrationBar(engine);
    this.notebook = new NotebookFloating(engine);
    this.state = SCENE_STATES.TITLE;

    this._container = null;
    this._sceneRoot = null;
    
    this._bgImage = '/images/chapter1-bg-placeholder.png';
    this._furongFlippedBg = '/images/chapter1-bg-placeholder.png';

    // State tracking
    this.engine.gameProgress.plaqueNoted = this.engine.gameProgress.plaqueNoted || false;
    this.engine.gameProgress.zhuiyunExplored = this.engine.gameProgress.zhuiyunExplored || false;
    
    // Runtime tracking
    this._hairpinIdentified = false;
    this._isFlipped = false;
    this._idleTimer = null;
  }

  enter(container) {
    this._container = container;
    
    // UI 层
    this._uiLayer = document.createElement('div');
    this._uiLayer.className = 'scene-ui-layer';
    this._uiLayer.style.position = 'absolute';
    this._uiLayer.style.inset = '0';
    this._uiLayer.style.pointerEvents = 'none'; // 让点击穿透到底部场景
    
    // 挂载组件
    this.narrationBar.mount(this._uiLayer);
    this.notebook.mount(this._uiLayer);
    
    // 恢复对话框和笔记本的鼠标事件
    if (this.narrationBar._container) this.narrationBar._container.style.pointerEvents = 'auto';
    if (this.notebook._container) this.notebook._container.style.pointerEvents = 'auto';

    // 场景根节点
    this._sceneRoot = document.createElement('div');
    this._sceneRoot.className = 'ch1-scene';
    
    // 构建各个子场景
    this._buildTitleCard();
    this._buildLanxueScene();
    this._buildZhuiyunScene();
    this._buildFurongScene();
    
    this._container.appendChild(this._sceneRoot);
    this._container.appendChild(this._uiLayer);
    
    this._unsubscribers = [
      this.engine.on('item-collected', () => this.engine.saveProgress()),
    ];

    // 开始演出
    this._startSequence();
  }

  exit() {
    this._clearIdleTimer();
    this.narrationBar.unmount();
    this.notebook.unmount();
    this._unsubscribers.forEach(fn => fn());
    if (this._sceneRoot) this._sceneRoot.remove();
    if (this._uiLayer) this._uiLayer.remove();
  }

  // --- 构建场景 ---

  _buildTitleCard() {
    this._titleEl = document.createElement('div');
    this._titleEl.className = 'ch1-title-card full-viewport flex-center flex-col';
    this._titleEl.style.position = 'absolute';
    this._titleEl.style.inset = '0';
    this._titleEl.style.background = 'var(--paint-bg)';
    this._titleEl.style.color = 'var(--paint-ink)';
    this._titleEl.style.fontFamily = 'var(--font-handwrite)';
    this._titleEl.style.zIndex = '50';
    this._titleEl.style.opacity = '1';
    this._titleEl.style.transition = 'opacity 1.2s ease';
    
    this._titleEl.innerHTML = `
      <h1 style="font-size: 3rem; margin-bottom: 1rem; font-weight: normal; letter-spacing: 0.2em;">第一章 · 东园</h1>
      <p style="font-size: 1.2rem; letter-spacing: 0.1em; opacity: 0.8;">兰雪堂至芙蓉榭</p>
    `;
    this._sceneRoot.appendChild(this._titleEl);
  }

  _buildLanxueScene() {
    this._lanxueEl = document.createElement('div');
    this._lanxueEl.className = 'ch1-subscene';
    this._lanxueEl.style.backgroundImage = `url('${this._bgImage}')`;
    
    // 青石板路 (50%, 85%) r=10%
    const stoneSpot = this._createHotspot(50, 85, 10, () => {
      this.narrationBar.showFeedback('你踩了踩脚下的石板。有些温热，纹理清晰得像刚刻上去的。');
    });
    
    // 翠竹 (15%, 50%) r=12%
    const bambooSpot = this._createHotspot(15, 50, 12, () => {
      this.narrationBar.showFeedback('你拨开竹叶。沙沙作响，但手上没有感到风。');
    });

    // 廊柱 (70%, 55%) r=6%
    const pillarSpot = this._createHotspot(70, 55, 6, () => {
      this.narrationBar.showFeedback('你走到廊柱边，伸手碰了碰。木纹里藏着细密的墨线——这不是一根真正的柱子，它是一笔画出来的。');
    });
    
    // 匾额 (50%, 22%) r=8%
    const plaqueSpot = this._createHotspot(50, 22, 8, async () => {
      await this.narrationBar.playLine(null, '你走近敞厅，抬头看向门楣上的匾额。');
      await this.narrationBar.playLine(null, '三个字——「兰雪堂」，落款是文徵明。字迹端正，墨色沉稳。');
      await this.narrationBar.playLine(null, '你本想移开视线，但不知为什么，目光停住了。你又看了一眼。');
      await this.narrationBar.playLine('沈念', '「兰」字的草字头……下面好像多了一道横笔。很细，几乎要看不见。');
      await this.narrationBar.playLine(null, '你凑近了一些。那一笔确实在那里——笔力很稳，墨色和主体一致，不像是无意的败笔。但它又不能单独解释成一个字。');
      await this.narrationBar.playLine('沈念', '奇怪。先记下来吧。');
      
      this.engine.gameProgress.plaqueNoted = true;
      this.notebook.addClueRecord('[线索] 匾额多余笔画 — 兰雪堂匾额"兰"字草字头下多了一道极细横笔，笔力稳定，墨色一致，非败笔');
      this.narrationBar.showFeedback('📌 已记录线索：匾额多余笔画');
      
      await this.narrationBar.playLine('沈念', '这座厅后面还有路。石径延伸过去，像是有什么在更深处等着。');
      this.narrationBar.dismiss();

      // 显示前进箭头
      if (!this._lanxueArrow) {
        this._lanxueArrow = this._createNavArrow(50, 70, 10, () => this._switchToZhuiyun());
        this._lanxueEl.appendChild(this._lanxueArrow);
      }
    });

    this._lanxueEl.appendChild(stoneSpot);
    this._lanxueEl.appendChild(bambooSpot);
    this._lanxueEl.appendChild(pillarSpot);
    this._lanxueEl.appendChild(plaqueSpot);
    this._sceneRoot.appendChild(this._lanxueEl);
  }

  _buildZhuiyunScene() {
    this._zhuiyunEl = document.createElement('div');
    this._zhuiyunEl.className = 'ch1-subscene';
    this._zhuiyunEl.style.backgroundImage = `url('${this._bgImage}')`;
    
    // 石缝 (30%, 72%) r=8%
    const crackSpot = this._createHotspot(30, 72, 8, async () => {
      await this.narrationBar.playLine(null, '你绕到峰石背后，注意到底部有一处极窄的石缝。');
      await this.narrationBar.playLine(null, '站着似乎看不到什么。你蹲下来，把视线压到石缝的高度。');
      await this.narrationBar.playLine(null, '缝隙里忽然露出远处水面的一线光——站着的时候完全看不见的光。');
      await this.narrationBar.playLine('沈念', '奇怪……站着的时候明明什么都看不到。这个角度，好像藏着什么。');
      
      this.engine.gameProgress.zhuiyunExplored = true;
      this.notebook.addClueRecord('有些景，只从低处出现。');
      this.narrationBar.showFeedback('📝 笔记本自动记录');
      this.narrationBar.dismiss();
    });
    
    this._zhuiyunArrow = this._createNavArrow(75, 65, 10, async () => {
      await this.narrationBar.playLine('沈念', '前面有水声。像是快到什么水边的建筑了。');
      this.narrationBar.dismiss();
      this._switchToFurong();
    });
    
    this._zhuiyunEl.appendChild(crackSpot);
    this._zhuiyunEl.appendChild(this._zhuiyunArrow);
    this._sceneRoot.appendChild(this._zhuiyunEl);
  }

  _buildFurongScene() {
    this._furongEl = document.createElement('div');
    this._furongEl.className = 'ch1-subscene';
    this._furongEl.innerHTML = `
      <div class="furong-container">
        <div class="furong-flipper">
          <div class="furong-face furong-front" style="background-image: url('${this._bgImage}')"></div>
          <div class="furong-face furong-back" style="background-image: url('${this._furongFlippedBg}')"></div>
          <div class="furong-waterline" style="top:55%; height:20px;"></div>
          <div class="furong-hairpin">
             <div class="hairpin-gleam"></div>
             <span>📌</span>
          </div>
        </div>
      </div>
    `;

    const realRailing = this._createHotspot(50, 35, 12, () => {
      let msg = "你摸了摸栏杆。什么都没有。";
      if (!this._isFlipped) msg += "但水面的倒影里，那件东西还在。";
      this.narrationBar.showFeedback(msg);
    });

    const waterline = this._furongEl.querySelector('.furong-waterline');
    const hairpin = this._furongEl.querySelector('.furong-hairpin');
    const flipper = this._furongEl.querySelector('.furong-flipper');
    const gleam = hairpin.querySelector('.hairpin-gleam');

    waterline.addEventListener('click', async () => {
      if (this.state !== SCENE_STATES.FURONG && this.state !== SCENE_STATES.PUZZLE) return;
      
      if (!this._hairpinIdentified) {
        this._createRipple(50, 55, this._furongEl);
        this.narrationBar.showFeedback('水面微微晃动，什么也没发生。');
        return;
      }

      if (!this._isFlipped) {
        await this.narrationBar.playLine('沈念', '如果倒影才是真的那一面呢——');
        this.narrationBar.dismiss();
        
        flipper.classList.add('flipped');
        this._isFlipped = true;
        this.state = SCENE_STATES.PUZZLE;
        
        await new Promise(r => setTimeout(r, 800));
        await this.narrationBar.playLine(null, '世界颠倒了一瞬，又重新安定。倒影变成了正像，断簪就在你面前，触手可及。');
        this.narrationBar.dismiss();
        
        this._resetIdleTimer('flipper');
      } else {
        // Allow flip back
        flipper.classList.remove('flipped');
        this._isFlipped = false;
        this._resetIdleTimer('identified');
      }
    });

    hairpin.addEventListener('click', async () => {
      if (!this._hairpinIdentified) {
        // 识别
        this._createRipple(45, 72, this._furongEl);
        await this.narrationBar.playLine(null, '你把目光压低，盯着水面里那件东西。涟漪轻轻散开，它的轮廓逐渐清晰。');
        await this.narrationBar.playLine(null, '是一支簪子。簪头是半朵芙蓉的形状，断了，断口处已经发黑。它静静地挂在倒影的栏杆上。');
        await this.narrationBar.playLine('沈念', '只在倒影里存在的东西……我怎么把它拿出来？');
        this.narrationBar.dismiss();
        this._hairpinIdentified = true;
        this._resetIdleTimer('identified');
        return;
      }

      if (!this._isFlipped) {
        this.narrationBar.showFeedback('你试着伸手去够水面，但指尖一碰，倒影就散了。');
        return;
      }

      // 拾取
      this._clearIdleTimer();
      this.state = SCENE_STATES.LIGHT_DISCUSSION;
      gleam.classList.remove('visible');
      hairpin.style.display = 'none';
      
      await this.narrationBar.playLine(null, '你伸手，取下了那支断簪。银质已经发暗，簪头是半朵未开的芙蓉，做工细致。');
      await this.narrationBar.playLine(null, '你下意识翻过来看簪身背面——一个极小的字，刻在不显眼的位置。');
      await this.narrationBar.playLine('沈念', '蘅。');
      await this.narrationBar.playLine('沈念', '刻在背面，这么小……不像题名，也不像工匠的标记。那是什么？');
      
      this.engine.collectItem({
        id: 'hairpin',
        name: '断簪',
        description: '银质断簪，簪头为半朵芙蓉。簪身背面刻有一个极小的"蘅"字。不像正式题名，也不像工匠标记，用途不明。',
        icon: '📌'
      });
      this.engine.gameProgress.hasHairpin = true;
      this.engine.saveProgress();

      this.notebook.addClueRecord('[物件] 断簪 — 银质断簪，簪头半朵芙蓉，簪身背面刻有极小的"蘅"字');
      this.notebook.addClueRecord('[线索] "蘅"字刻痕 — 刻在簪身背面，不像题名或工匠标记，用途不明');
      this.narrationBar.showFeedback('📌 已记录线索：断簪"蘅"字刻痕');
      
      this.narrationBar.dismiss();
      this._startLightDiscussion();
    });

    this._furongEl.appendChild(realRailing);
    this._sceneRoot.appendChild(this._furongEl);
  }

  // --- 工具方法 ---

  _createHotspot(x, y, r, onClick) {
    const spot = document.createElement('div');
    spot.className = 'ch1-hotspot';
    spot.style.left = `${x}%`;
    spot.style.top = `${y}%`;
    spot.style.width = `${r*2}vmin`;
    spot.style.height = `${r*2}vmin`;
    spot.addEventListener('click', onClick);
    return spot;
  }

  _createNavArrow(x, y, r, onClick) {
    const arrow = document.createElement('div');
    arrow.className = 'ch1-nav-arrow';
    arrow.innerHTML = '➤';
    arrow.style.left = `${x}%`;
    arrow.style.top = `${y}%`;
    arrow.style.width = `${r*2}vmin`;
    arrow.style.height = `${r*2}vmin`;
    arrow.style.display = 'flex';
    arrow.style.alignItems = 'center';
    arrow.style.justifyContent = 'center';
    arrow.addEventListener('click', onClick);
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

  _resetIdleTimer(phase) {
    this._clearIdleTimer();
    this._idleTimer = setTimeout(() => {
      if (phase === 'initial') {
        this.narrationBar.showFeedback('💡 水面倒影里挂着一件东西，点击它看看。');
      } else if (phase === 'identified') {
        this.narrationBar.showFeedback('💡 直接够不到倒影里的东西……点击水面线，试着换个角度。');
        this._idleTimer = setTimeout(() => {
           this.narrationBar.showFeedback('💡 倒影和真实之间，也许隔着一条线。点击水面。');
        }, 20000);
      } else if (phase === 'flipper') {
        this.narrationBar.showFeedback('💡 断簪就在眼前，点击它拾取。');
      }
    }, phase === 'initial' ? 30000 : (phase === 'identified' ? 25000 : 10000));
  }

  _clearIdleTimer() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  // --- 流程控制 ---

  async _startSequence() {
    this.engine.currentChapter = 1;
    this.engine.currentWorld = 'paint';
    
    // 标题卡停留2.5秒后淡出
    await new Promise(r => setTimeout(r, 2500));
    this._titleEl.style.opacity = '0';
    await new Promise(r => setTimeout(r, 1200));
    this._titleEl.remove();

    // 进入兰雪堂
    this._lanxueEl.classList.add('active');
    this.state = SCENE_STATES.LANXUE;

    await this.narrationBar.playLine(null, '你睁开眼。四周的一切都不对——不是工作室，不是扫描仪的冷光。自己站在一个陌生的地方。');
    await this.narrationBar.playLine('沈念', '这是哪里？');
    await this.narrationBar.playLine(null, '低下头，脚下是青石板路，微微发暖。空气里有一种说不出的气味——不是花香，更像旧纸和松烟墨混在一起的味道。抬起头，两侧翠竹如墙，在没有风的空气中轻轻摇动。');
    await this.narrationBar.playLine(null, '顺着石径看过去。前方有一座敞厅，像是某种入口建筑。');
    await this.narrationBar.playLine('沈念', '等等……这个地方我见过。是拙政园东部的兰雪堂。但不对，它不是我在照片里看到的样子。它更旧，更轻——像是一笔还没有干透的线。');
    await this.narrationBar.playLine('沈念', '不会吧。我在画里？');
    this.narrationBar.dismiss();
  }

  async _switchToZhuiyun() {
    this.state = SCENE_STATES.ZHUIYUN;
    this._lanxueEl.classList.remove('active');
    await this.engine.playTransition();
    
    this._zhuiyunEl.classList.add('active');
    await this.narrationBar.playLine(null, '沿着石径往前走。转过一个弯，一块巨石挡住了去路——不，不是挡住，是立在路旁，像某种标记。');
    await this.narrationBar.playLine('沈念', '缀云峰。我认得这块湖石。但亲眼见到又不一样——石头上的纹路像是有人用极细的笔，一笔一笔勾出来的。');
    this.narrationBar.dismiss();
  }

  async _switchToFurong() {
    this.state = SCENE_STATES.FURONG;
    this._zhuiyunEl.classList.remove('active');
    await this.engine.playTransition();
    
    this._furongEl.classList.add('active');
    await this.narrationBar.playLine(null, '你循着水声走出石径。眼前豁然开朗——一座临水小榭安静地立在岸边，屋檐低垂，栏杆探入水面。');
    await this.narrationBar.playLine('沈念', '芙蓉榭。拙政园东部最靠近水面的地方。');
    await this.narrationBar.playLine(null, '你走到栏杆前，往下看。水面很静，倒影清晰得像另一个世界——每一根栏杆、每一片瓦都被原样映在水里。');
    await this.narrationBar.playLine(null, '但看了一会儿，你发现不对。倒影里的栏杆上，好像多了什么东西。');
    await this.narrationBar.playLine('沈念', '上面什么都没有。可水里……水里的栏杆上挂着一件东西。');
    this.narrationBar.dismiss();

    // 激活金簪微光提示
    const gleam = this._furongEl.querySelector('.hairpin-gleam');
    if (gleam) gleam.classList.add('visible');

    this._resetIdleTimer('initial');
  }

  async _startLightDiscussion() {
    this.notebook.expand();
    this.notebook.setLightweightMode(true);
    
    this.notebook.showSystemMessage('（轻量梳理开始，你可以随时跳过）');
    this.notebook.showNPCMessage('周老师的批注："蘅"，杜衡。是一种香草，古人也用来比喻品性高洁的女子。刻在簪身背面，不是正面——如果是工匠标记，通常会在簪头或底座。这更像是物主自己留给自己的。那么，是谁把自己的名字藏在了一支断簪上？');

    this.notebook.showQuickThoughts([
      '也许是这支簪子主人的名字',
      '为什么要藏在背面？'
    ]);
    
    this.notebook.onQuickThought((text) => {
      this.notebook.showPlayerMessage(text);
      if (text === '也许是这支簪子主人的名字') {
        this.notebook.showNPCMessage('这是最大的可能。一个字不足以证明她的身份，但这是第一条直接的线索。');
      } else {
        this.notebook.showNPCMessage('背面更隐蔽，说明她既想留下痕迹，又不想太招摇。这种矛盾本身就很值得玩味。');
      }
    });

    this.notebook.showSkipButton(async () => {
      this.notebook.hideConfirmButton();
      this.notebook.setLightweightMode(false);
      this.notebook.collapse();
      
      await this.narrationBar.playLine(null, '水面重新归于平静。你把断簪小心地收起来。');
      await this.narrationBar.playLine('沈念', '蘅。一个女子的名字？她把自己藏在一支簪子的背面——不想被别人看见，又不甘心完全消失。');
      await this.narrationBar.playLine(null, '你站在榭前，忽然觉得眼前的光线在变。周围的墨色好像在一点点褪去，像清水洗过宣纸。');
      this.narrationBar.dismiss();
      
      await this._startFadeTransition();
    });
  }

  async _startFadeTransition() {
    this.state = 'TRANSITION';
    await this.engine.sceneManager.switchWithFadeToSepia('chapter1-workshop');
  }
}
