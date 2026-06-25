import { NarrationBar } from '../components/narration-bar.js';
import { NotebookFloating } from '../components/notebook-floating.js';
import { HudBar } from '../components/hud-bar.js';
import { InventoryPopup } from '../components/inventory-popup.js';
import { ITEM_TEMPLATES } from '../core/inventory.js';

const SCENE_STATES = {
  TRUTH_SPACE: 'truth_space',
  FOUR_QUESTIONS: 'four_questions',
  PAINTING_COMPLETE: 'painting_complete',
  ECHO: 'echo',
  THREE_ENDINGS: 'three_endings',
  ENDING_SCREEN: 'ending_screen',
};

const CHECKPOINTS = {
  TRUTH: 'finale_truth_start',
  QUESTIONS: 'finale_questions_start',
  ENDINGS: 'finale_endings_start',
  COMPLETE: 'finale_complete'
};

const PORTRAITS = {
  zhou: '/images/common/zhou_henian_1.png',
  shennian: '/images/common/shennian_1.png',
};

export default class FinaleScene {
  constructor(engine) {
    this.engine = engine;
    this.name = 'finale';

    this.narrationBar = new NarrationBar(engine);
    this.notebook = new NotebookFloating(engine);
    this.hudBar = new HudBar(engine);
    this.inventoryPopup = new InventoryPopup(engine);

    this.state = SCENE_STATES.TRUTH_SPACE;
    this._exited = false;
    this._isNarrating = false;
    this._container = null;
    this._sceneRoot = null;
    this._uiLayer = null;

    this._q1Errors = 0;
    this._q1L2Errors = 0;
    this._q2Errors = 0;
    this._q3Errors = 0;
    this._q4Errors = 0;
    this._endingsSeen = {};
  }

  enter(container) {
    this._exited = false;
    this._container = container;
    this.engine.currentChapter = 4;
    this.engine.currentWorld = 'paint';
    container.classList.remove('real-world');
    container.classList.add('paint-world');
    container.classList.add('finale-active');

    this.engine.ensureCarryoverForChapter?.(4, { persist: false });
    this._ensureFinaleItems();

    this._buildUI();
    this._buildScenes();

    container.innerHTML = '';
    container.appendChild(this._sceneRoot);
    container.appendChild(this._uiLayer);

    this._wireComponents();

    if (this.engine.currentCheckpointId === CHECKPOINTS.QUESTIONS) {
      this._startFourQuestions();
    } else if (
      this.engine.currentCheckpointId === CHECKPOINTS.ENDINGS ||
      this.engine.currentCheckpointId === CHECKPOINTS.COMPLETE
    ) {
      this._showEndingChoices();
    } else {
      this.engine.saveCheckpoint?.(CHECKPOINTS.TRUTH, {
        chapter: 4,
        scene: 'finale',
        world: 'paint'
      });
      this._startTruthSpace();
    }
  }

  exit() {
    this._exited = true;
    this._container?.classList.remove('finale-active');
    this.narrationBar.unmount?.();
    this.notebook.unmount?.();
    this.hudBar.unmount?.();
    this.inventoryPopup.unmount?.();
    if (this._sceneRoot) this._sceneRoot.remove();
    if (this._uiLayer) this._uiLayer.remove();
  }

  /* ==================== UI 构建 ==================== */

  _buildUI() {
    this._uiLayer = document.createElement('div');
    this._uiLayer.className = 'scene-ui-layer';
    this._uiLayer.style.cssText = 'position:absolute;inset:0;z-index:10;pointer-events:none;';

    this.narrationBar.mount(this._uiLayer);
    this.notebook.mount(this._uiLayer);
    this.hudBar.mount(this._uiLayer);
    this.inventoryPopup.mount(this._uiLayer);
  }

  _wireComponents() {
    this.hudBar.onNotebookClick?.(() => {
      if (this.notebook.isExpanded?.()) this.notebook.collapse();
      else this.notebook.expand();
    });
    this.hudBar.onInventoryClick?.(() => this.inventoryPopup.open());
    this.notebook.onSubmit?.(() => {
      this.notebook.showSystemMessage?.('终章无对话功能。请回顾【记录】页中的线索。');
    });
  }

  _buildScenes() {
    this._sceneRoot = document.createElement('div');
    this._sceneRoot.className = 'finale-scene';

    this._truthSpaceEl = this._buildTruthSpace();
    this._questionsEl = this._buildQuestions();
    this._paintingCompleteEl = this._buildPaintingComplete();
    this._endingsEl = this._buildEndings();
    this._endingScreenEl = this._buildEndingScreen();

    this._sceneRoot.append(
      this._truthSpaceEl,
      this._questionsEl,
      this._paintingCompleteEl,
      this._endingsEl,
      this._endingScreenEl
    );
  }

  /* ==================== 场景1 · 真相空间 ==================== */

  _buildTruthSpace() {
    const el = document.createElement('div');
    el.className = 'finale-subscene finale-truth-space';
    el.innerHTML = `
      <div class="finale-clues-summary" id="finale-clues-summary">
        <div class="finale-clues-text">
          <span>「画非一人」</span>
          <span>「此页视点卑近，似非成稿」</span>
        </div>
        <div class="finale-clues-items">
          <div class="finale-clue-item">
            <div class="finale-clue-icon">🥢</div>
            <div class="finale-clue-name">断簪</div>
          </div>
          <div class="finale-clue-item">
            <div class="finale-clue-icon">🪨</div>
            <div class="finale-clue-name">残砚</div>
          </div>
          <div class="finale-clue-item">
            <div class="finale-clue-icon">📜</div>
            <div class="finale-clue-name">草图拓片</div>
          </div>
        </div>
      </div>
      <button class="finale-start-btn" id="finale-start-btn">开始复原</button>
    `;
    return el;
  }

  async _startTruthSpace() {
    this.state = SCENE_STATES.TRUTH_SPACE;
    this._switchSubscene(this._truthSpaceEl);
    await this._delay(600);
    if (this._exited) return;

    this.hudBar.show?.();

    await this._delay(800);
    if (this._exited) return;

    this._isNarrating = true;

    await this.narrationBar.playLine('沈念', '"只要有痕迹。"……这句话从昨晚起就一直压在脑子里，怎么也放不下。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '写进报告，还是不写？我到现在也没有答案。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine(null, '扫描件还停在昨天的位置。第三十一景的表层画面安静地等在屏幕上，和五百年来一样完整，一样沉默。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '你盯着它看了很久。忽然墨迹开始流动——像水，像呼吸。这一次，你没有闭眼。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '脚下不是青石板，不是泥路，不是任何一处你曾走过的地方。四周是一片宣纸般的空白——没有天空，没有地面，只有极淡的纸纹。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '面前浮现出拙政园的俯瞰线图。芙蓉榭、远香堂、小飞虹、梧竹幽居，像几个尚未落墨的点。');
    if (this._exited) return;

    const cluesSummary = this._truthSpaceEl.querySelector('#finale-clues-summary');
    if (cluesSummary) cluesSummary.classList.add('visible');

    await this.narrationBar.playLine(null, '右侧悬着三样东西：断簪、残砚、草图拓片。左侧悬着两行字：「画非一人」「此页视点卑近，似非成稿」。');
    if (this._exited) return;

    if (cluesSummary) cluesSummary.classList.remove('visible');

    await this.narrationBar.playLine('沈念', '所有找到的痕迹……都在这里了。该把它们放回原来的位置了。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;

    await this._delay(600);
    if (this._exited) return;

    await this.narrationBar.playLine('周鹤年', '到这里，你已经不能只做技术判断了。', { portrait: PORTRAITS.zhou });
    if (this._exited) return;
    await this.narrationBar.playLine('周鹤年', '你手里的东西，足够让人相信有另一个观看者。但未必足够让所有人承认她。', { portrait: PORTRAITS.zhou });
    if (this._exited) return;
    await this.narrationBar.playLine(null, '你想起他说过的话——"修复报告不是小说。你写下的每一个字，都要负责。但你不写，也是一种判断。"');
    if (this._exited) return;
    await this.narrationBar.playLine('周鹤年', '其实，三十年前我第一次见到那个"蘅"字，也没有写进报告。我告诉自己是谨慎。现在回头看，谨慎和回避长得太像了。', { portrait: PORTRAITS.zhou });
    if (this._exited) return;
    await this.narrationBar.playLine('周鹤年', '那时我也只是跟在老师身后的学生，以为少写一句不会改变什么。', { portrait: PORTRAITS.zhou });
    if (this._exited) return;
    await this.narrationBar.playLine('周鹤年', '所以，我没有资格替你选。', { portrait: PORTRAITS.zhou });
    if (this._exited) return;

    this._isNarrating = false;
    this.narrationBar.dismiss?.();

    this.notebook.expand?.();
    this.notebook.switchTab?.('records');
    this.notebook.hideQuickThoughts?.();
    this.notebook.showSystemMessage?.('终章只开放【记录】回顾。请根据已经获得的线索完成复原。');

    await this._delay(500);
    if (this._exited) return;
    this.narrationBar.showFloating?.('所有线索已汇聚。当你准备好了，点击「开始复原」。');

    const btn = this._truthSpaceEl.querySelector('#finale-start-btn');
    btn.classList.add('visible');
    btn.addEventListener('click', () => {
      btn.classList.remove('visible');
      this.notebook.collapse?.();
      this.notebook.hideQuickThoughts?.();
      this.engine.saveCheckpoint?.(CHECKPOINTS.QUESTIONS, {
        chapter: 4,
        scene: 'finale',
        world: 'paint'
      });
      this._startFourQuestions();
    }, { once: true });
  }

  /* ==================== 场景2 · 四问复原 ==================== */

  _buildQuestions() {
    const el = document.createElement('div');
    el.className = 'finale-subscene finale-questions';
    el.innerHTML = `
      <div class="finale-highlight-layer">
        <div class="finale-highlight-spot" data-spot="furongxie" style="left:8%;top:48%"></div>
        <div class="finale-highlight-spot" data-spot="wuzhuyouju" style="left:26%;top:50%"></div>
        <div class="finale-highlight-spot" data-spot="lanxuetang" style="left:49%;top:29%"></div>
        <div class="finale-highlight-spot" data-spot="yuanxiang" style="left:48%;top:54%"></div>
        <div class="finale-highlight-spot" data-spot="xiaofeihong" style="left:42%;top:68%"></div>
        <div class="finale-highlight-spot" data-spot="zhuiyunfeng" style="left:73%;top:25%"></div>
        <div class="finale-highlight-spot" data-spot="yuanyangguan" style="left:83%;top:55%"></div>
      </div>
      <div class="finale-location-labels">
        <button class="finale-location-label" data-loc="furongxie" style="left:8%;top:48%">芙蓉榭</button>
        <button class="finale-location-label" data-loc="wuzhuyouju" style="left:26%;top:50%">梧竹幽居</button>
        <button class="finale-location-label" data-loc="lanxuetang" style="left:49%;top:29%">兰雪堂</button>
        <button class="finale-location-label" data-loc="yuanxiang" style="left:48%;top:54%">远香堂</button>
        <button class="finale-location-label" data-loc="xiaofeihong" style="left:42%;top:68%">小飞虹</button>
        <button class="finale-location-label" data-loc="zhuiyunfeng" style="left:73%;top:25%">缀云峰</button>
        <button class="finale-location-label" data-loc="yuanyangguan" style="left:83%;top:55%">卅六鸳鸯馆</button>
      </div>
      <div class="finale-canvas-container" id="finale-canvas-container" aria-hidden="true">
        <div class="finale-canvas-layer finale-canvas-layer--1" id="canvas-layer-reflection"></div>
        <div class="finale-canvas-layer finale-canvas-layer--2" id="canvas-layer-bridge"></div>
        <div class="finale-canvas-layer finale-canvas-layer--3" id="canvas-layer-bamboo"></div>
        <div class="finale-canvas-layer finale-canvas-layer--4" id="canvas-layer-full"></div>
      </div>
      <div class="finale-question-panel" id="finale-qpanel"></div>
    `;
    return el;
  }

  async _startFourQuestions() {
    if (this.engine.currentCheckpointId !== CHECKPOINTS.QUESTIONS) {
      this.engine.saveCheckpoint?.(CHECKPOINTS.QUESTIONS, {
        chapter: 4,
        scene: 'finale',
        world: 'paint'
      });
    }
    this.state = SCENE_STATES.FOUR_QUESTIONS;
    this._resetQuestionView();
    this._switchSubscene(this._questionsEl);
    await this._delay(800);
    if (this._exited) return;
    await this._runQ1Layer1();
  }

  _highlightSpot(spotId) {
    const spot = this._questionsEl.querySelector(`.finale-highlight-spot[data-spot="${spotId}"]`);
    if (spot) spot.classList.add('lit');
  }

  _enableLocationLabels(enable) {
    const container = this._questionsEl.querySelector('.finale-location-labels');
    const labels = this._questionsEl.querySelectorAll('.finale-location-label');
    if (enable) {
      container?.classList.add('visible');
      labels.forEach(l => l.classList.add('interactive'));
    } else {
      container?.classList.remove('visible');
      labels.forEach(l => l.classList.remove('interactive'));
    }
  }

  /* --- Q1 Layer 1 --- */
  async _runQ1Layer1() {
    if (this._exited) return;
    this._isNarrating = true;
    await this.narrationBar.playLine(null, '第一问：第三十一景保存的是谁的视角？');
    if (this._exited) return;
    this._isNarrating = false;

    const choice = await this.narrationBar.showOptions([
      { label: 'A. 王献臣——他是拙政园的主人', value: 'A' },
      { label: 'B. 王蘅——画中痕迹指向的那个人', value: 'B' },
      { label: 'C. 文徵明——他是这套画的作者', value: 'C' },
      { label: 'D. 后世经手此画的人——他曾重新装裱这页画', value: 'D' },
    ]);
    if (this._exited) return;

    if (choice === 'B') {
      this._isNarrating = true;
      await this.narrationBar.playLine(null, '画面微微亮了一层——俯瞰线图中，芙蓉榭的位置浮现出淡淡的墨迹。');
      if (this._exited) return;
      this._isNarrating = false;
      await this._runQ1Layer2();
    } else {
      this._q1Errors++;
      const feedback = {
        A: '他拥有这座园。但拥有一座园，不等于发现了怎么看它。',
        C: '他画了这幅画。但视角是他自己发现的吗？',
        D: '装裱师是后来者。这个视角比装裱早了几百年。',
      };
      this.narrationBar.showFeedback?.(feedback[choice] || '再想想。');
      if (this._q1Errors >= 3) {
        await this._delay(1500);
      } else {
        await this._delay(1200);
      }
      await this._runQ1Layer1();
    }
  }

  /* --- Q1 Layer 2 --- */
  async _runQ1Layer2() {
    if (this._exited) return;
    this._isNarrating = true;
    await this.narrationBar.playLine(null, '她对第三十一景的贡献是什么？');
    if (this._exited) return;
    this._isNarrating = false;

    const choice = await this.narrationBar.showOptions([
      { label: 'A. 她是被遮蔽的观看者——她发现了这个视角，文徵明用自己的笔保存了它', value: 'A' },
      { label: 'B. 她是未署名的执笔者——第三十一景由她亲手绘制', value: 'B' },
      { label: 'C. 她是画作的构思者——构图与立意都源于她的设计', value: 'C' },
    ]);
    if (this._exited) return;

    if (choice === 'A') {
      this._isNarrating = true;
      await this.narrationBar.playLine('沈念', '对。她提供的不是笔，不是构图方案，而是一个从未被采纳过的观看位置。他用自己的手保存了她的眼睛。', { portrait: PORTRAITS.shennian });
      if (this._exited) return;
      this._isNarrating = false;
      this._highlightSpot('furongxie');
      await this._delay(1000);
      await this._runQ2();
    } else {
      this._q1L2Errors++;
      const feedback = {
        B: '回想留听阁墙上那幅草图——线条犹豫，比例失准。她的手不足以画出第三十一景的笔墨。',
        C: '构图和立意仍是文徵明的判断。她提供的比"设计"更基础——是一个位置，一种看法。',
      };
      this.narrationBar.showFeedback?.(feedback[choice] || '再想想。');
      if (this._q1L2Errors >= 3) {
        await this._delay(1500);
        this.narrationBar.showFeedback?.('她的价值不在画技，也不在构思——在于"看见"。');
        await this._delay(1500);
      } else {
        await this._delay(1200);
      }
      await this._runQ1Layer2();
    }
  }

  /* --- Q2: 从哪里看 --- */
  async _runQ2() {
    if (this._exited) return;
    this._isNarrating = true;
    await this.narrationBar.playLine(null, '第二问：她从园中哪个位置看出去，才能让三处景物同时入画？请点击画面中的位置名牌。');
    if (this._exited) return;
    this._isNarrating = false;
    this.narrationBar.dismiss?.();

    const feedbacks = {
      yuanxiang: '站在远香堂只能看见正前方的荷塘。三景不会同时出现。',
      xiaofeihong: '桥上看得远，但视线太高。回想草图标注的那条线——它很低。',
      wuzhuyouju: '竹林遮蔽了远处。要看到三景，得在开阔处。',
      zhuiyunfeng: '从高处俯瞰是文人画常见的观法。但这幅画的特殊之处恰恰是：视角很低。',
    };

    this._enableLocationLabels(true);

    await new Promise((resolve) => {
      const labels = this._questionsEl.querySelectorAll('.finale-location-label');
      const handler = async (e) => {
        if (this._exited) { resolve(); return; }
        const loc = e.currentTarget.dataset.loc;

        if (loc === 'furongxie') {
          labels.forEach(l => l.removeEventListener('click', handler));
          labels.forEach(l => l.classList.remove('interactive'));
          e.currentTarget.classList.add('correct');
          this._isNarrating = true;
          await this._delay(600);
          await this.narrationBar.playLine(null, '从芙蓉榭的位置向远处延伸出一束淡墨视线。远香堂、小飞虹、梧竹幽居三处的轮廓渐渐清晰。');
          if (this._exited) { resolve(); return; }
          this._isNarrating = false;
          this._highlightSpot('xiaofeihong');
          await this._showLowViewCanvas();
          resolve();
        } else {
          this._q2Errors++;
          e.currentTarget.classList.add('wrong');
          this.narrationBar.showFeedback?.(feedbacks[loc] || '不是那里。');
          await this._delay(800);
          e.currentTarget.classList.remove('wrong');
          if (this._q2Errors >= 3) {
            const correctLabel = this._questionsEl.querySelector('.finale-location-label[data-loc="furongxie"]');
            correctLabel?.classList.add('hint-pulse');
          }
        }
      };
      labels.forEach(l => l.addEventListener('click', handler));
    });

    if (this._exited) return;
    await this._delay(1000);
    await this._runQ3();
  }

  /* --- Q3: 看见了什么（多选） --- */
  async _runQ3() {
    if (this._exited) return;
    this._isNarrating = true;
    await this.narrationBar.playLine(null, '第三问：从那个位置看，能看见什么？（多选，选完后点击确认）');
    if (this._exited) return;
    this._isNarrating = false;
    this.narrationBar.dismiss?.();

    const panel = this._questionsEl.querySelector('#finale-qpanel');
    panel.innerHTML = '';

    const options = [
      { id: 'reflection', label: '远香堂的倒影', correct: true },
      { id: 'bridge', label: '小飞虹的弧线', correct: true },
      { id: 'bamboo', label: '梧竹幽居的竹影', correct: true },
      { id: 'lanxue', label: '兰雪堂正门', correct: false },
      { id: 'yuanyang', label: '卅六鸳鸯馆匾额', correct: false },
    ];

    const container = document.createElement('div');
    container.className = 'finale-multiselect';

    const selected = new Set();

    options.forEach(opt => {
      const label = document.createElement('label');
      label.className = 'finale-multiselect-option';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = opt.id;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selected.add(opt.id);
          label.classList.add('selected');
        } else {
          selected.delete(opt.id);
          label.classList.remove('selected');
        }
      });

      const span = document.createElement('span');
      span.textContent = opt.label;

      label.append(checkbox, span);
      container.appendChild(label);
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'finale-multiselect-confirm';
    confirmBtn.textContent = '确认';

    confirmBtn.addEventListener('click', async () => {
      if (this._exited) return;
      const correctIds = new Set(options.filter(o => o.correct).map(o => o.id));
      const isCorrect = selected.size === correctIds.size && [...selected].every(id => correctIds.has(id));

      if (isCorrect) {
        this._isNarrating = true;
        panel.innerHTML = '';
        this._revealCanvasLayers(['reflection', 'bridge', 'bamboo']);
        await this.narrationBar.playLine(null, '三处景物同时着色——倒影、弧线、竹影在画面中浮现，相互照应。第三十一景几乎完成了。');
        if (this._exited) return;
        this._isNarrating = false;
        this._highlightSpot('yuanxiang');
        await this._delay(1000);
        await this._runQ4();
      } else {
        this._q3Errors++;
        if (this._q3Errors >= 3) {
          this.narrationBar.showFeedback?.('只有三景。"水桥竹影，三景同入一眼。"');
        } else {
          this.narrationBar.showFeedback?.('回想草图上画了什么——"水桥竹影，三景同入一眼"。');
        }
      }
    });

    container.appendChild(confirmBtn);
    panel.appendChild(container);
  }

  /* --- Q4: 为什么没人知道 --- */
  async _runQ4() {
    if (this._exited) return;
    this._isNarrating = true;
    await this.narrationBar.playLine(null, '第四问：第三十一景一直存在，为什么五百年来没人发现视角来自她？');
    if (this._exited) return;
    this._isNarrating = false;

    const panel = this._questionsEl.querySelector('#finale-qpanel');
    panel.innerHTML = '';

    const choice = await this.narrationBar.showOptions([
      { label: 'A. 文徵明故意隐瞒了她的贡献', value: 'A' },
      { label: 'B. 画面本身没有变，但说明来源的边注、题签和辅助线被后人装裱时压覆遮蔽了', value: 'B' },
      { label: 'C. 画心被后人重画过，原本的视角信息被替换了', value: 'C' },
      { label: 'D. 她的痕迹太少，从来没有被任何人注意到过', value: 'D' },
    ]);
    if (this._exited) return;

    if (choice === 'B') {
      this._isNarrating = true;
      this._completeCanvasReveal();
      await this.narrationBar.playLine(null, '最后一笔落下。');
      if (this._exited) return;
      this._isNarrating = false;
      this._highlightSpot('wuzhuyouju');
      await this._delay(1800);
      await this._showPaintingComplete();
    } else {
      this._q4Errors++;
      const feedback = {
        A: '他没有"故意隐瞒"——是当时的体例里根本写不下这件事。他已经做了他能做的。',
        C: '画心从未被重画。第三十一景的画面一直在那里，问题出在画面之外。',
        D: '不是没人注意到——旧批注写了"视点卑近"。他注意到了，只是用"配边压覆"把它处理掉了。',
      };
      this.narrationBar.showFeedback?.(feedback[choice] || '再想想。');
      await this._delay(1200);
      await this._runQ4();
    }
  }

  /* ==================== 场景3 · 第三十一景完成 ==================== */

  _buildPaintingComplete() {
    const el = document.createElement('div');
    el.className = 'finale-subscene finale-painting-complete';
    el.innerHTML = `
      <div class="finale-echo-text" id="finale-echo-text"></div>
      <button class="finale-choose-btn" id="finale-choose-btn">做出选择</button>
    `;
    return el;
  }

  async _showPaintingComplete() {
    this.state = SCENE_STATES.PAINTING_COMPLETE;

    this._switchSubscene(this._paintingCompleteEl);
    await this._delay(1500);
    if (this._exited) return;

    this._isNarrating = true;

    await this.narrationBar.playLine(null, '一幅完整的画在你面前展开：从芙蓉榭栏杆下望出去，远香堂的倒影、小飞虹的弧线、梧竹幽居的竹影，全都在同一个画面里。');
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '这个角度……和留听阁墙上那幅拙劣的草图一模一样。水面太重，桥线太弯，亭阁压得太低——当时觉得哪里都不对的画面，原来是从这里看过去的。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '但眼前这幅画不拙。笔墨成熟、稳定，每一笔都是文徵明的手。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '这就是第三十一景。他没有用她的画法，而是站在她标出的那个位置上，用自己的笔重新画了一遍她看见的东西。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '他为什么要这样做？……也许他知道，以她的笔力，这个视角永远不会被收入任何正式图册。如果他不画，这个角度就消失了。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '可他也没有办法写下"这是另一个人的眼睛"。在那套图册的体例里，根本没有一行能容纳这件事。他大概想过，又放下了笔。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '所以它就这样留了下来——笔墨精良，体例完整，像前三十景一样被归入文徵明名下。后来的人看见这一页的视角很低、很怪，但画心如此完美，谁会怀疑它背后还有别的来历？', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '那些本可以说明来历的边注、辅助线、残字，在一次又一次的重装和归档中被"整理"掉了。它们在规范面前不够体面。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '芙蓉榭倒影里的断簪、远香堂下的残砚、留听阁墙上的草图、兰雪堂匾额上那道多余的笔画……它们散在园子各处，谁也不挨着谁。可现在我明白了——它们出自同一只手、同一种心思，在五百年里一遍遍极轻地说着同一句话：我也在这里看过。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;

    this._isNarrating = false;
    this.narrationBar.dismiss?.();

    await this._showEcho();
  }

  /* ==================== 回声 ==================== */

  async _showEcho() {
    this.state = SCENE_STATES.ECHO;
    await this._delay(2000);
    if (this._exited) return;

    this._isNarrating = true;
    await this.narrationBar.playLine(null, '画完成的瞬间，你听到她的声音。不是从水底传来，也不是从墙后传来。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '像是很久很久以前，有人对着空无一人的园子，轻轻问出的一句话，隔了五百年，终于落了地：');
    if (this._exited) return;
    this.narrationBar.dismiss?.();

    const echoContainer = this._paintingCompleteEl.querySelector('#finale-echo-text');
    const echoText = '"有人，终于看到了。"';
    echoContainer.innerHTML = '';
    [...echoText].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'finale-echo-char';
      span.textContent = char;
      span.style.animationDelay = `${i * 500}ms`;
      echoContainer.appendChild(span);
    });

    await this._delay(echoText.length * 500 + 2500);
    if (this._exited) return;

    await this.narrationBar.playLine(null, '没有惊喜，没有悲伤。只是一句等了很久的确认。她不会知道是你，但因为有人来过，她当年那一问，不再悬空。');
    if (this._exited) return;
    this._isNarrating = false;
    this.narrationBar.dismiss?.();

    await this._delay(3000);
    if (this._exited) return;

    this.narrationBar.showFloating?.('三条路代表三种立场。没有绝对对错，只有你如何承担自己的解释。');

    const btn = this._paintingCompleteEl.querySelector('#finale-choose-btn');
    btn.classList.add('visible');
    btn.addEventListener('click', () => {
      btn.classList.remove('visible');
      this._showEndingChoices();
    }, { once: true });
  }

  /* ==================== 场景4 · 结局选择 ==================== */

  _buildEndings() {
    const el = document.createElement('div');
    el.className = 'finale-subscene finale-endings';
    el.innerHTML = `
      <div class="finale-endings-backdrop"></div>
      <div class="finale-endings-intro">三条路代表三种立场。没有绝对对错，只有你如何承担自己的解释。</div>
      <div class="finale-ending-choices" id="finale-ending-choices">
        <button class="finale-ending-card-btn" data-ending="archive">
          <span class="finale-ending-card-btn-text">"我会在修复报告里记下这个可能性。"</span>
          <span class="finale-ending-card-btn-sub">── 历史正义 ──</span>
        </button>
        <button class="finale-ending-card-btn" data-ending="secret">
          <span class="finale-ending-card-btn-text">"有些痕迹，被看见就够了。"</span>
          <span class="finale-ending-card-btn-sub">── 私人守护 ──</span>
        </button>
        <button class="finale-ending-card-btn" data-ending="continue">
          <span class="finale-ending-card-btn-text">"我想画一幅新的画。"</span>
          <span class="finale-ending-card-btn-sub">── 当代续写 ──</span>
        </button>
      </div>
    `;
    return el;
  }

  async _showEndingChoices() {
    if (this.engine.currentCheckpointId !== CHECKPOINTS.COMPLETE) {
      this.engine.saveCheckpoint?.(CHECKPOINTS.ENDINGS, {
        chapter: 4,
        scene: 'finale',
        world: 'paint'
      });
    }
    this.state = SCENE_STATES.THREE_ENDINGS;
    this._switchSubscene(this._endingsEl);
    await this._delay(600);
    if (this._exited) return;

    const intro = this._endingsEl.querySelector('.finale-endings-intro');
    intro.classList.add('visible');

    const choices = this._endingsEl.querySelector('#finale-ending-choices');
    choices.classList.add('visible');

    const btns = choices.querySelectorAll('.finale-ending-card-btn');
    for (let i = 0; i < btns.length; i++) {
      await this._delay(300);
      btns[i].classList.add('visible');
      if (this._endingsSeen[btns[i].dataset.ending]) {
        if (!btns[i].querySelector('.finale-seen-mark')) {
          const mark = document.createElement('span');
          mark.className = 'finale-seen-mark';
          mark.textContent = '已阅';
          btns[i].appendChild(mark);
        }
      }
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => this._handleEndingClick(btn.dataset.ending));
    });
  }

  async _handleEndingClick(endingId) {
    if (this._exited || this._handlingEnding) return;
    this._handlingEnding = true;

    try {
      const hesitations = {
        archive: '她说过"不必有名，不必有形"。你确定要替她做一个她没有要求的决定吗？',
        secret: '如果你不说，也许永远不会有人知道她存在过。历史会继续沉默。你能接受吗？',
        continue: '你可以不替历史下结论，也不替她守住沉默。你只回应她的观看。但这幅新画，终究会带上你的解释。',
      };

      this._isNarrating = true;
      await this.narrationBar.playLine(null, hesitations[endingId]);
      if (this._exited) return;
      this._isNarrating = false;

      const confirm = await this.narrationBar.showOptions([
        { label: '确认选择', value: 'yes' },
        { label: '返回', value: 'no' },
      ]);
      if (this._exited) return;

      if (confirm === 'yes') {
        this.narrationBar.dismiss?.();
        this._endingsSeen[endingId] = true;
        this.engine.gameProgress = this.engine.gameProgress || {};
        this.engine.gameProgress[`endingSeen_${endingId}`] = true;
        this.engine.gameProgress.finaleComplete = true;
        this.engine.gameProgress.endingChoice = endingId;
        this.engine.saveCheckpoint?.(CHECKPOINTS.COMPLETE, {
          chapter: 4,
          scene: 'finale',
          world: 'paint'
        });
        await this._playEnding(endingId);
      } else {
        this.narrationBar.dismiss?.();
      }
    } finally {
      this._handlingEnding = false;
    }
  }

  /* ==================== 场景5 · 结局播放 ==================== */

  _buildEndingScreen() {
    const el = document.createElement('div');
    el.className = 'finale-subscene finale-ending-screen';
    el.innerHTML = `
      <div class="finale-ending-screen-bg" id="finale-ending-bg"></div>
      <div class="finale-ending-screen-content" id="finale-ending-content"></div>
    `;
    return el;
  }

  async _playEnding(endingId) {
    this.state = SCENE_STATES.ENDING_SCREEN;
    this._switchSubscene(this._endingScreenEl);
    await this._delay(800);
    if (this._exited) return;

    this._isNarrating = true;

    if (endingId === 'archive') await this._playEndingArchive();
    else if (endingId === 'secret') await this._playEndingSecret();
    else if (endingId === 'continue') await this._playEndingContinue();

    if (this._exited) return;
    this._isNarrating = false;
    this.narrationBar.dismiss?.();

    await this._delay(2000);
    if (this._exited) return;
    await this._showEndingCard(endingId);
  }

  async _playEndingArchive() {
    const bg = this._endingScreenEl.querySelector('#finale-ending-bg');
    bg.style.backgroundImage = `url('/images/prologue/prologue-workshop.png')`;
    await this._delay(400);
    bg.classList.add('visible');

    await this.narrationBar.playLine(null, '你回到工作室。修复报告窗口仍然打开，光标停在"附注"一栏。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '你写下：');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '"第三十一景表层图像整体稳定，然页边装裱层下可见旧题签残痕与低位辅助线。结合画中视点、题诗异文及相关残迹，不排除该景保存了一位未被记录的观看提供者之视角。此判断仍需进一步考证。"');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '报告被收入档案。没有学术震动，没有新闻报道。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '但从此，档案中第一次出现了"未被记录的观看提供者"这一可能性。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '画中园林安静下来。风过荷塘，水面上浮起几片蘅芜叶子，转了一个圈，又沉了下去。');
    if (this._exited) return;
  }

  async _playEndingSecret() {
    const bg = this._endingScreenEl.querySelector('#finale-ending-bg');
    bg.style.backgroundImage = `url('/images/prologue/prologue-workshop.png')`;
    await this._delay(400);
    bg.classList.add('visible');

    await this.narrationBar.playLine(null, '你回到工作室。你在报告中写道：');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '"残页已修复，表层图像稳定。页边残痕暂不具备独立判断条件，留待后续观察。"');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '周鹤年看完报告，什么都没说。你知道他知道，他也知道你知道。你们都心照不宣。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '你告诉自己，这是保留她原本的隐匿方式。不是让所有人知道，而是让某个人真正看见。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '画中园林恢复平静。你关上电脑前，屏幕上一闪而过一行极淡的墨字：');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '"有人来过。就够了。"');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '第二天，档案系统更新。第三十一景的状态栏里，仍然只有三个字：');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '无异常。');
    if (this._exited) return;
  }

  async _playEndingContinue() {
    const bg = this._endingScreenEl.querySelector('#finale-ending-bg');
    bg.style.backgroundImage = `url('/images/finale/finale-ending3-garden.png')`;
    await this._delay(400);
    bg.classList.add('visible');

    await this.narrationBar.playLine(null, '你没有把她写成定论。也没有让她完全回到沉默。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '你铺开一张新纸，拿起笔。');
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '我不是文徵明，画不出他的功力。甚至不确定自己能画好一棵树。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '第三十一景已经保存了她看见的东西。我想画的不是那个——而是她。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine('沈念', '那个蹲在芙蓉榭栏杆下的人。她侧着头，袖口沾了朱砂，面前铺着一张比例失准的草图。水面映着远香堂的轮廓，她正在看。', { portrait: PORTRAITS.shennian });
    if (this._exited) return;
    await this.narrationBar.playLine(null, '你用笨拙的笔触画下了那个场景：不是三景同入一眼的壮阔构图，而是一个人蹲在栏杆下观看的背影。她很小，园林很大。但整座园在那一刻都属于她的目光。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '画完后，你在右下角写下一行小字：');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '"记王蘅观园。"');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '这不是学术证据，也不能替她正名。但她说过"不必有形"——可你偏偏画出了她的形。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '你站在现实中的拙政园里，手里拿着刚画完的画。远处芙蓉榭栏杆下，似乎有一个影子一闪而过。也许是光影，也许不是。');
    if (this._exited) return;
    await this.narrationBar.playLine(null, '你没有追过去。你只是把画卷起来，放进包里。');
    if (this._exited) return;
  }

  async _showEndingCard(endingId) {
    const endings = {
      archive: {
        label: '结局一',
        title: '存档',
        final: '"有人看到了。"',
        card: '她等了五百年。你在档案里为她留了一行字。\n也许没有人会读到。但从此，沉默不再是唯一的记录。',
      },
      secret: {
        label: '结局二',
        title: '守密',
        final: '"有人来过。够了。"',
        card: '你看见了她。她不会知道。\n但"有人来过"这件事本身，已经改变了五百年的沉默。',
      },
      continue: {
        label: '结局三',
        title: '续笔',
        final: '"三十一景之后，还有第三十二景。"',
        card: '第三十一景画了她看见的园。第三十二景画了看见园的她。\n五百年前她不敢有形。五百年后你还给了她一个轮廓。',
      },
    };

    const data = endings[endingId];
    const content = this._endingScreenEl.querySelector('#finale-ending-content');
    content.innerHTML = `
      <span class="finale-ending-screen-label">${data.label}</span>
      <h2 class="finale-ending-screen-title">${data.title}</h2>
      <div class="finale-ending-screen-body">${data.card.replace(/\n/g, '<br>')}</div>
      <div class="finale-ending-screen-final">${data.final}</div>
      <div class="finale-credits" id="finale-credits">
        <p>"王蘅为虚构人物。"</p>
        <p>"文徵明为拙政园画过三十一景，流传下来的只有他整理过的八景。其余散佚了，没人确切知道原因。我们就在想：连画都能消失，那当年和他一起待在这座园子里的人呢？"</p>
        <p>"三十一景是不是全由他一人完成的？没有人能确切知道了。但一座园那么大，画了那么久，有没有谁陪他走过、帮他看过角度、说过'这里好看'——谁也说不准。只是如果有，那个人大概没机会把名字留在画旁边。也许因为身份，也许因为体例，也许只是因为那个时代根本没有一栏留给这样的人。"</p>
        <p>"我们没办法替真实的历史补上那些名字。但我们可以虚构一个故事，去想象那种处境：一个人的观看被保存了，名字却在规范面前慢慢变成了沉默的一部分。"</p>
        <p>"如果玩完这个游戏，你偶尔会想起那些没留下名字的人，下次走进园林时多看看四周、低头看一眼水面——那就够了。"</p>
        <p>"谨以此作，向那些曾改变事物被看见的方式、却没有留下名字的人致意。"</p>
        <div class="finale-credits-sign">《卅一景》项目组全体：夏虫、翰飛、一只鱼、Vespera.l，敬上。</div>
      </div>
      <div class="finale-final-note" id="finale-final-note">
        <button class="finale-final-note-btn" id="finale-final-note-btn">写下结案笔记</button>
        <div class="finale-final-note-status" id="finale-final-note-status" aria-live="polite"></div>
        <article class="finale-final-note-paper hidden" id="finale-final-note-paper">
          <h3>修复记录终页</h3>
          <div class="finale-final-note-text" id="finale-final-note-text"></div>
        </article>
      </div>
      <div class="finale-end-buttons" id="finale-end-buttons">
        <button class="finale-end-btn" id="finale-btn-rechoose">回到选择前</button>
        <button class="finale-end-btn" id="finale-btn-menu">返回菜单</button>
      </div>
    `;

    await this._delay(300);
    content.classList.add('visible');

    await this._delay(3000);
    if (this._exited) return;
    const credits = content.querySelector('#finale-credits');
    credits.classList.add('visible');

    await this._delay(2000);
    if (this._exited) return;
    const buttons = content.querySelector('#finale-end-buttons');
    buttons.classList.add('visible');

    content.querySelector('#finale-btn-rechoose').addEventListener('click', () => {
      content.classList.remove('visible');
      credits.classList.remove('visible');
      buttons.classList.remove('visible');
      const bg = this._endingScreenEl.querySelector('#finale-ending-bg');
      bg.classList.remove('visible');
      bg.style.backgroundImage = '';
      this._showEndingChoices();
    });

    content.querySelector('#finale-btn-menu').addEventListener('click', () => {
      this.engine.switchScene('menu');
    });

    content.querySelector('#finale-final-note-btn')?.addEventListener('click', () => {
      this._generateFinalNote(endingId, content);
    });
  }

  async _generateFinalNote(endingId, content) {
    const btn = content.querySelector('#finale-final-note-btn');
    const status = content.querySelector('#finale-final-note-status');
    const paper = content.querySelector('#finale-final-note-paper');
    const textEl = content.querySelector('#finale-final-note-text');
    if (!btn || !status || !paper || !textEl) return;

    btn.disabled = true;
    btn.textContent = '正在书写……';
    status.textContent = '笔记本末页正在浮现新的字迹……';
    paper.classList.add('hidden');
    textEl.textContent = '';

    try {
      const note = await this.engine.aiService.generateFinalNote(endingId);
      if (this._exited) return;
      status.textContent = '';
      textEl.textContent = note || '（笔记本末页暂时没有新的字迹浮现。）';
      paper.classList.remove('hidden');
      btn.textContent = '重新书写结案笔记';
    } catch (err) {
      console.error('[Finale] 结案笔记生成失败:', err);
      if (this._exited) return;
      status.textContent = '';
      textEl.textContent = '（笔记本末页暂时没有新的字迹浮现。）';
      paper.classList.remove('hidden');
      btn.textContent = '重新书写结案笔记';
    } finally {
      btn.disabled = false;
    }
  }

  /* ==================== 工具方法 ==================== */

  _switchSubscene(targetEl) {
    const all = this._sceneRoot.querySelectorAll('.finale-subscene');
    all.forEach(el => {
      if (el !== targetEl) el.classList.remove('active');
    });
    targetEl.classList.add('active');
  }

  _resetQuestionView() {
    this._questionsEl.classList.remove('low-view-active');
    this._questionsEl.querySelector('.finale-location-labels')?.classList.remove('visible', 'fade-out');
    this._questionsEl.querySelectorAll('.finale-location-label').forEach(label => {
      label.classList.remove('interactive', 'correct', 'wrong', 'hint-pulse');
    });
    this._questionsEl.querySelectorAll('.finale-highlight-spot').forEach(spot => {
      spot.classList.remove('lit');
    });
    this._questionsEl.querySelector('#finale-canvas-container')?.classList.remove('visible', 'full');
    this._questionsEl.querySelectorAll('.finale-canvas-layer').forEach(layer => {
      layer.classList.remove('revealed', 'full');
    });
  }

  async _showLowViewCanvas() {
    const labels = this._questionsEl.querySelector('.finale-location-labels');
    const canvas = this._questionsEl.querySelector('#finale-canvas-container');

    labels?.classList.add('fade-out');
    this._questionsEl.classList.add('low-view-active');

    await this._delay(500);
    if (this._exited) return;

    canvas?.classList.add('visible');
    await this._delay(900);
  }

  _revealCanvasLayers(layerNames) {
    layerNames.forEach(name => {
      this._questionsEl.querySelector(`#canvas-layer-${name}`)?.classList.add('revealed');
    });
  }

  _completeCanvasReveal() {
    const canvas = this._questionsEl.querySelector('#finale-canvas-container');
    const fullLayer = this._questionsEl.querySelector('#canvas-layer-full');
    canvas?.classList.add('full');
    fullLayer?.classList.add('revealed', 'full');
  }

  _ensureFinaleItems() {
    const inv = this.engine.inventory;
    const progress = this.engine.gameProgress || {};

    if (!inv.hasItem('hairpin')) {
      inv.addItem(ITEM_TEMPLATES.hairpin, { silent: true });
      progress.hasHairpin = true;
    }
    if (!inv.hasItem('inkstone')) {
      inv.addItem(ITEM_TEMPLATES.inkstone, { silent: true });
      progress.hasInkstone = true;
    }
    if (!inv.hasItem('letter')) {
      inv.addItem(ITEM_TEMPLATES.letter, { silent: true });
      progress.hasLetter = true;
    }
    if (!inv.hasItem('rubbing')) {
      inv.addItem(ITEM_TEMPLATES.rubbing, { silent: true });
      progress.hasRubbing = true;
    }

    if (!progress.chapter1Complete) progress.chapter1Complete = true;
    if (!progress.chapter2Complete) progress.chapter2Complete = true;
    if (!progress.chapter3Complete) progress.chapter3Complete = true;

    this.engine.gameProgress = progress;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
