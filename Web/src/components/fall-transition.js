/**
 * 《卅一景》序章 · 跌入画中 转场
 *
 * 多阶段转场效果：
 *   1. 冷蓝褪色 (1.5s)    — 扫描界面色调褪去，触发画面与工作室背景模糊缩放异变
 *   2. 浅纸色淡入 (2s)    — 放大古画底层与半透明纸色遮罩平滑淡入
 *   3. 过渡文字 (8s)      — 渗字效果显示叙事文本，引号内声音统一样式
 *   4. 周鹤年回声 (7.3s)  — 异步显现导师回声和旁白台词（统一字号）
 *   5. 淡出衔接 (1s)      — 过渡到下一场景
 */

/** 过渡文字 (场景5 · 跌入异象) */
const TRANSITION_LINES = [
  '冷蓝色的扫描界面渐渐褪去。',
  '纸纹变成地面，墨线变成栏杆，',
  '边缘那一枚残字像水中落叶一样沉了下去。',
  '「怎么回事……」'
];

/** 周鹤年回声 (场景6 · 墨迹扩散转场) */
const ECHO_LINES = [
  '你听见周鹤年的声音在很远的地方响了一下——',
  '「记住，表面完整，不等于没有缺失。」',
  '然后，所有声音都消失了。'
];

const PAINTING_BACKDROP_SRC = '/images/prologue/scan-painting.png';

export default class FallTransition {
  constructor() {
    this._elements = [];
    this._timers = [];
    this._isPlaying = false;
    this._skipped = false;
    this._phaseResolve = null;
    this._boundOnKeyDown = this._onKeyDown.bind(this);
  }

  /**
   * Play the full fall-into-painting transition sequence
   * @param {{x: number, y: number}} origin — click origin point for transition
   * @returns {Promise<void>} resolves when transition is complete
   */
  async play(origin) {
    this._isPlaying = true;
    this._skipped = false;
    document.addEventListener('keydown', this._boundOnKeyDown);

    // 激活页面古画与工作室背景异变效果
    document.body.classList.add('fall-active');

    // Phase 1: Cold blue desaturation & scene zoom
    await this._phaseDesat();
    if (this._skipped) return this._finishPlay();

    // Phase 2: Enlarged painting backdrop & light paper background fade-in
    await this._phaseInkSpread(origin);
    if (this._skipped) return this._finishPlay();

    // Phase 3: Transition text
    await this._phaseText();
    if (this._skipped) return this._finishPlay();

    // Phase 4: Zhou Henian echo
    await this._phaseEcho();
    if (this._skipped) return this._finishPlay();

    // Phase 5: Hold on ink, ready for scene switch
    await this._phaseFinal();
    this._finishPlay();
  }

  /**
   * Phase 1: Desaturation overlay
   * @private
   */
  _phaseDesat() {
    return new Promise(resolve => {
      this._phaseResolve = resolve;
      const el = document.createElement('div');
      el.className = 'fall-transition-desat';
      document.body.appendChild(el);
      this._elements.push(el);

      requestAnimationFrame(() => {
        el.classList.add('active');
        this._setTimer(resolve, 1500);
      });
    });
  }

  /**
   * Phase 2: Enlarged painting backdrop & light paper background fade-in
   * @private
   */
  _phaseInkSpread(origin) {
    return new Promise(resolve => {
      this._phaseResolve = resolve;

      const backdrop = document.createElement('div');
      backdrop.className = 'fall-transition-painting-backdrop';
      backdrop.style.backgroundImage = `url("${PAINTING_BACKDROP_SRC}")`;
      document.body.appendChild(backdrop);
      this._elements.push(backdrop);

      const container = document.createElement('div');
      container.className = 'fall-transition-ink';
      document.body.appendChild(container);
      this._elements.push(container);

      requestAnimationFrame(() => {
        backdrop.classList.add('active');
        container.classList.add('active');
        // 2.0秒后淡入过渡完成，进入文字显现阶段
        this._setTimer(resolve, 2000);
      });
    });
  }

  /**
   * Phase 3: Transition text lines
   * @private
   */
  _phaseText() {
    return new Promise(resolve => {
      this._phaseResolve = resolve;
      const layer = document.createElement('div');
      layer.className = 'fall-transition-text-layer';
      document.body.appendChild(layer);
      this._elements.push(layer);

      // Create text lines
      const lineEls = TRANSITION_LINES.map((text, idx) => {
        const el = document.createElement('div');
        el.className = 'fall-transition-line';
        // 第 4 句是沈念内心独白，使用“引号内声音”样式
        if (idx === 3) {
          el.classList.add('inner-voice');
        }
        // 检测开引号，注入视觉避让类
        if (text.startsWith('「')) {
          el.classList.add('quote-aligned');
        }
        el.textContent = text;
        layer.appendChild(el);
        return el;
      });

      // Stagger reveal
      lineEls.forEach((el, i) => {
        this._setTimer(() => el.classList.add('visible'), 600 + i * 1500);
      });

      // Wait for all lines to be shown, then hold briefly
      const totalTime = 600 + TRANSITION_LINES.length * 1500 + 2500; // 最后一句话延长停留 1 秒，增强可读性
      this._setTimer(() => {
        // Fade out text
        lineEls.forEach((el, i) => {
          this._setTimer(() => el.classList.add('fading'), i * 200);
        });
        this._setTimer(resolve, 800);
      }, totalTime);
    });
  }

  /**
   * Phase 4: Zhou Henian echo
   * @private
   */
  _phaseEcho() {
    return new Promise(resolve => {
      this._phaseResolve = resolve;
      let layer = document.querySelector('.fall-transition-text-layer');
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'fall-transition-text-layer';
        document.body.appendChild(layer);
        this._elements.push(layer);
      }

      // Clear previous text
      layer.innerHTML = '';

      // 创建回声的 3 行台词
      const echoData = [
        { text: ECHO_LINES[0], type: 'narration', delay: 200 },
        { text: ECHO_LINES[1], type: 'zhou', delay: 1500 },
        { text: ECHO_LINES[2], type: 'narration', delay: 3800 }
      ];

      const els = echoData.map(data => {
        const el = document.createElement('div');
        el.className = `fall-transition-echo-line fall-transition-echo-line--${data.type}`;
        // 检测开引号，注入视觉避让类
        if (data.text.startsWith('「')) {
          el.classList.add('quote-aligned');
        }
        el.textContent = data.text;
        layer.appendChild(el);
        return { el, delay: data.delay };
      });

      // 依次延迟淡入
      els.forEach(item => {
        this._setTimer(() => item.el.classList.add('visible'), item.delay);
      });

      // 停留并整体淡出
      const fadeOutDelay = 7000; // 延长停留 1.2 秒，使最后一句旁白在余音淡出时有充足阅读时间
      this._setTimer(() => {
        els.forEach(item => item.el.classList.add('fading'));
        this._setTimer(resolve, 1500); // 留足 1.5s 淡出动画时间
      }, fadeOutDelay);
    });
  }

  /**
   * Phase 5: Final hold
   * @private
   */
  _phaseFinal() {
    return new Promise(resolve => {
      this._phaseResolve = resolve;
      this._setTimer(resolve, 500);
    });
  }

  _setTimer(callback, delay) {
    const timer = setTimeout(() => {
      this._timers = this._timers.filter(id => id !== timer);
      callback();
    }, delay);
    this._timers.push(timer);
    return timer;
  }

  _clearTimers() {
    this._timers.forEach((timer) => clearTimeout(timer));
    this._timers = [];
  }

  _finishPlay() {
    this._isPlaying = false;
    this._phaseResolve = null;
    document.removeEventListener('keydown', this._boundOnKeyDown);
  }

  _onKeyDown(e) {
    if (!this._isPlaying || !this._isFastForwardKey(e) || this._isTextInputActive()) return;
    e.preventDefault();
    this._skipped = true;
    this._clearTimers();
    const resolve = this._phaseResolve;
    this._phaseResolve = null;
    this.destroy();
    resolve?.();
  }

  _isFastForwardKey(e) {
    return e.key === ' ' || e.key?.toLowerCase() === 'z' || e.code === 'KeyZ';
  }

  _isTextInputActive() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  /**
   * Clean up all transition elements
   */
  destroy() {
    this._clearTimers();
    document.removeEventListener('keydown', this._boundOnKeyDown);
    this._isPlaying = false;
    this._phaseResolve = null;

    // 清除页面古画与工作室背景异变效果类
    if (this._skipped) {
      // 如果是被玩家按键跳过，延迟 300ms 异步清除，防止在新场景 solidOverlay 渲染生效前产生画面复位闪跳
      setTimeout(() => {
        document.body.classList.remove('fall-active');
      }, 300);
    } else {
      document.body.classList.remove('fall-active');
    }

    this._elements.forEach(el => {
      if (el && el.parentNode) {
        el.remove();
      }
    });
    this._elements = [];

    // Also clean up any orphaned transition elements
    document.querySelectorAll('.fall-transition-desat, .fall-transition-painting-backdrop, .fall-transition-ink, .fall-transition-text-layer, .fall-transition-final').forEach(el => el.remove());
  }
}
