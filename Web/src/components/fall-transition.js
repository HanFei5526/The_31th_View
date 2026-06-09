/**
 * 《卅一景》序章 · 跌入画中 转场
 *
 * 多阶段转场效果：
 *   1. 冷蓝褪色 (1.5s)    — 扫描界面色调褪去
 *   2. 墨迹扩散 (2s)      — 从点击位置墨滴径向扩散
 *   3. 过渡文字 (6s)      — 渗字效果显示叙事文本
 *   4. 周鹤年回声 (2.5s)  — 导师最后一句话回响
 *   5. 淡出衔接 (1s)      — 过渡到下一场景
 *
 * CSS classes used (defined in transitions.css):
 *   .fall-transition-desat, .fall-transition-ink, .fall-ink-drop,
 *   .fall-transition-text-layer, .fall-transition-line,
 *   .fall-transition-echo, .fall-transition-final
 */

/** 过渡文字 */
const TRANSITION_LINES = [
  '冷蓝色的扫描界面渐渐褪去。',
  '纸纹变成地面，墨线变成栏杆，',
  '边缘那一枚残字像水中落叶一样沉了下去。',
];

/** 周鹤年回声 */
const ECHO_TEXT = '「记住，表面完整，不等于没有缺失。」';

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
   * @param {{x: number, y: number}} origin — click origin point for ink spread
   * @returns {Promise<void>} resolves when transition is complete
   */
  async play(origin) {
    this._isPlaying = true;
    this._skipped = false;
    document.addEventListener('keydown', this._boundOnKeyDown);

    // Phase 1: Cold blue desaturation
    await this._phaseDesat();
    if (this._skipped) return this._finishPlay();

    // Phase 2: Ink spread from origin
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
   * Phase 2: Ink spread from click origin
   * @private
   */
  _phaseInkSpread(origin) {
    return new Promise(resolve => {
      this._phaseResolve = resolve;
      const container = document.createElement('div');
      container.className = 'fall-transition-ink';
      document.body.appendChild(container);
      this._elements.push(container);

      // Create ink drop at origin
      const drop = document.createElement('div');
      drop.className = 'fall-ink-drop';
      drop.style.left = `${origin.x}px`;
      drop.style.top = `${origin.y}px`;
      drop.style.width = '40px';
      drop.style.height = '40px';
      drop.style.marginLeft = '-20px';
      drop.style.marginTop = '-20px';
      container.appendChild(drop);

      requestAnimationFrame(() => {
        drop.classList.add('spreading');
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
      const lineEls = TRANSITION_LINES.map(text => {
        const el = document.createElement('div');
        el.className = 'fall-transition-line';
        el.textContent = text;
        layer.appendChild(el);
        return el;
      });

      // Stagger reveal
      lineEls.forEach((el, i) => {
        this._setTimer(() => el.classList.add('visible'), 600 + i * 1500);
      });

      // Wait for all lines to be shown, then hold briefly
      const totalTime = 600 + TRANSITION_LINES.length * 1500 + 1500;
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
      // Reuse text layer or find it
      let layer = document.querySelector('.fall-transition-text-layer');
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'fall-transition-text-layer';
        document.body.appendChild(layer);
        this._elements.push(layer);
      }

      // Clear previous text
      layer.innerHTML = '';

      const echo = document.createElement('div');
      echo.className = 'fall-transition-echo';
      echo.textContent = ECHO_TEXT;
      layer.appendChild(echo);

      this._setTimer(() => echo.classList.add('visible'), 200);

      // Hold, then fade
      this._setTimer(() => {
        echo.classList.add('fading');
        this._setTimer(resolve, 2500);
      }, 2500);
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

    this._elements.forEach(el => {
      if (el && el.parentNode) {
        el.remove();
      }
    });
    this._elements = [];

    // Also clean up any orphaned transition elements
    document.querySelectorAll('.fall-transition-desat, .fall-transition-ink, .fall-transition-text-layer, .fall-transition-final').forEach(el => el.remove());
  }
}
