/**
 * 《卅一景》提示系统
 *
 * 追踪玩家在谜题上的空闲时间，当超过设定的延迟后，
 * 以周鹤年的笔记批注形式呈现渐进式提示。
 *
 * 用法:
 *   hintSystem.startTimer('puzzle-1', [
 *     { delay: 30, text: '也许应该仔细看看画面右侧……' },
 *     { delay: 60, text: '注意诗中的第三个字。' },
 *   ]);
 */

export class HintSystem {
  constructor(engine) {
    /** @type {import('./game-engine.js').GameEngine} */
    this.engine = engine;

    /**
     * 活跃谜题的计时数据
     * @type {Map<string, {hints: Array, lastInteraction: number, shownCount: number, intervalId: number}>}
     */
    this.timers = new Map();

    /** 提示笔记 DOM 元素（惰性创建） */
    this._overlayEl = null;
  }

  /**
   * 为某个谜题启动提示计时
   * @param {string} puzzleId
   * @param {Array<{delay: number, text: string}>} hints - 按 delay 升序排列
   */
  startTimer(puzzleId, hints) {
    // 若已存在则先清除
    this.stopTimer(puzzleId);

    const timerData = {
      hints: hints.sort((a, b) => a.delay - b.delay),
      lastInteraction: Date.now(),
      shownCount: 0,
      intervalId: null,
    };

    // 每秒检查一次空闲时间
    timerData.intervalId = window.setInterval(() => {
      this._checkIdle(puzzleId);
    }, 1000);

    this.timers.set(puzzleId, timerData);
  }

  /**
   * 停止并清除某个谜题的提示计时
   * @param {string} puzzleId
   */
  stopTimer(puzzleId) {
    const timer = this.timers.get(puzzleId);
    if (timer) {
      window.clearInterval(timer.intervalId);
      this.timers.delete(puzzleId);
    }
  }

  /**
   * 重置空闲计时（玩家有交互时调用）
   * @param {string} puzzleId
   */
  resetTimer(puzzleId) {
    const timer = this.timers.get(puzzleId);
    if (timer) {
      timer.lastInteraction = Date.now();
    }
  }

  /**
   * 显示提示 — 以周鹤年笔记批注的视觉样式呈现
   * @param {string} text
   */
  showHint(text) {
    this._ensureOverlay();

    const overlay = this._overlayEl;
    overlay.querySelector('.hint-content').textContent = text;
    overlay.classList.add('visible');

    // 点击关闭
    const closeHandler = () => {
      overlay.classList.remove('visible');
      overlay.removeEventListener('click', closeHandler);
    };
    overlay.addEventListener('click', closeHandler);

    // 8 秒后自动关闭
    setTimeout(() => {
      overlay.classList.remove('visible');
    }, 8000);
  }

  /* ---- 内部方法 ---- */

  /**
   * 检查某个谜题是否到达下一个提示触发时间
   * @private
   */
  _checkIdle(puzzleId) {
    const timer = this.timers.get(puzzleId);
    if (!timer) return;

    const idleSeconds = (Date.now() - timer.lastInteraction) / 1000;
    const nextHint = timer.hints[timer.shownCount];

    if (nextHint && idleSeconds >= nextHint.delay) {
      timer.shownCount++;
      timer.lastInteraction = Date.now(); // 显示提示后重置计时

      this.showHint(nextHint.text);
      this.engine.emit('hint-shown', {
        puzzleId,
        level: timer.shownCount,
        text: nextHint.text,
      });

      // 所有提示已显示完毕，停止计时
      if (timer.shownCount >= timer.hints.length) {
        this.stopTimer(puzzleId);
      }
    }
  }

  /**
   * 确保提示笔记 DOM 元素存在
   * @private
   */
  _ensureOverlay() {
    if (this._overlayEl) return;

    const el = document.createElement('div');
    el.className = 'hint-notebook';
    el.innerHTML = `
      <div class="hint-title">📓 周鹤年的笔记</div>
      <div class="hint-content"></div>
      <div class="hint-annotation">— 点击任意处关闭 —</div>
    `;
    document.body.appendChild(el);
    this._overlayEl = el;
  }

  /**
   * 清除所有计时器（场景切换时调用）
   */
  clearAll() {
    for (const [puzzleId] of this.timers) {
      this.stopTimer(puzzleId);
    }
  }
}
