/**
 * 诗词比对组件 — 第二章核心谜题
 * 左右分栏竖排，逐字点击找差异
 */

const POEMS = [
  {
    title: '远香堂',
    left:  '水面初平画暮烟，独坐虚堂忆往年',
    right: '水面初平锁暮烟，独坐虚堂忆往年',
    diffIndex: 4,
    diffChar: '画'
  },
  {
    title: '小飞虹',
    left:  '虹桥横跨翠犹深，桥下清波非古今',
    right: '虹桥横跨翠犹深，桥下清波自古今',
    diffIndex: 11,
    diffChar: '非'
  },
  {
    title: '倚虹亭',
    left:  '亭临碧水风来远，一片荷香入坐间',
    right: '亭临碧水风来远，一片荷香入坐间',
    diffIndex: -1,
    diffChar: null
  },
  {
    title: '梧竹幽居',
    left:  '竹影参差碧几重，幽居相对一林风',
    right: '竹影参差碧几重，幽居相对旧林风',
    diffIndex: 11,
    diffChar: '一'
  },
  {
    title: '听雨轩',
    left:  '芭蕉叶上夜生春，独倚轩窗忆故人',
    right: '芭蕉叶上夜生春，独倚轩窗忆故园',
    diffIndex: 13,
    diffChar: '人'
  }
];

export class PoemCompare {
  constructor(engine) {
    this.engine = engine;
    this._container = null;
    this._root = null;
    this._currentPoem = 0;
    this._foundDiffs = [];
    this._wrongClicks = 0;
    this._idleTimer = null;
    this._idleLevel = 0;
    this._resolved = false;

    this._onComplete = null;
    this._onDiffFound = null;
    this._onWrongClick = null;
    this._onDecoyConfirm = null;
    this._onNoDiffReject = null;
  }

  onComplete(cb) { this._onComplete = cb; }
  onDiffFound(cb) { this._onDiffFound = cb; }
  onWrongClick(cb) { this._onWrongClick = cb; }
  onDecoyConfirm(cb) { this._onDecoyConfirm = cb; }
  onNoDiffReject(cb) { this._onNoDiffReject = cb; }

  mount(container) {
    this._container = container;
    this._root = document.createElement('div');
    this._root.className = 'poem-compare';
    this._root.setAttribute('role', 'region');
    this._root.setAttribute('aria-label', '诗词比对');

    // 独立挂载立绘，避免被后续 innerHTML 覆写而重复触发动画
    this._portrait = document.createElement('img');
    this._portrait.src = '/images/common/shennian_1.png';
    this._portrait.className = 'poem-compare-portrait';
    this._portrait.alt = '沈念';
    this._root.appendChild(this._portrait);

    // 诗词内容的包装器，使用 display: contents 继承 flex 布局
    this._contentContainer = document.createElement('div');
    this._contentContainer.style.display = 'contents';
    this._root.appendChild(this._contentContainer);

    this._container.appendChild(this._root);
    this._renderCurrentPoem();
  }

  unmount() {
    this._clearIdleTimer();
    if (this._root) this._root.remove();
    this._root = null;
  }

  getCurrentPoem() { return this._currentPoem; }
  getFoundDiffs() { return [...this._foundDiffs]; }

  _renderCurrentPoem() {
    if (!this._contentContainer) return;
    const poem = POEMS[this._currentPoem];

    this._contentContainer.innerHTML = `
      <div class="poem-compare-header">
        <span class="poem-compare-title">《${poem.title}》</span>
        <span class="poem-compare-counter">第 ${this._currentPoem + 1}/5 首</span>
      </div>
      <div class="poem-compare-columns">
        <div class="poem-compare-col">
          <div class="poem-compare-col-label">画上题诗</div>
          <div class="poem-compare-scroll-container">
            <div class="poem-compare-chars" data-side="left"></div>
          </div>
        </div>
        <div class="poem-compare-divider"></div>
        <div class="poem-compare-col">
          <div class="poem-compare-col-label">参考版本</div>
          <div class="poem-compare-paper-container">
            <div class="poem-compare-chars" data-side="right"></div>
          </div>
        </div>
      </div>
      <div class="poem-compare-progress">
        ${this._renderProgressSlots()}
      </div>
      <button class="poem-compare-confirm-btn">确认无差异</button>
    `;

    this._renderChars(poem);
    this._bindEvents(poem);
    this._resetIdleTimer();
  }

  _renderChars(poem) {
    const leftContainer = this._contentContainer.querySelector('[data-side="left"]');
    const rightContainer = this._contentContainer.querySelector('[data-side="right"]');

    const leftChars = poem.left.replace('，', '');
    const rightChars = poem.right.replace('，', '');

    leftChars.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'poem-char poem-char-clickable';
      span.textContent = char;
      span.dataset.index = i;
      leftContainer.appendChild(span);
    });

    rightChars.split('').forEach((char) => {
      const span = document.createElement('span');
      span.className = 'poem-char poem-char-ref';
      span.textContent = char;
      rightContainer.appendChild(span);
    });
  }

  _bindEvents(poem) {
    const leftChars = this._contentContainer.querySelectorAll('.poem-char-clickable');
    leftChars.forEach(span => {
      span.addEventListener('click', () => this._handleCharClick(span, poem));
    });

    const btn = this._contentContainer.querySelector('.poem-compare-confirm-btn');
    if (btn) {
      btn.addEventListener('click', () => this._handleNoDiffConfirm(poem, btn));
    }
  }

  _handleCharClick(span, poem) {
    const idx = parseInt(span.dataset.index);

    if (idx === poem.diffIndex) {
      span.classList.add('poem-char-found');
      this._foundDiffs.push(poem.diffChar);
      this._clearIdleTimer();
      if (this._onDiffFound) this._onDiffFound(poem.diffChar, this._foundDiffs.length);
      this._updateProgressSlots();
      setTimeout(() => this._advancePoem(), 1200);
    } else {
      span.classList.add('poem-char-wrong');
      setTimeout(() => span.classList.remove('poem-char-wrong'), 300);
      this._wrongClicks++;
      if (this._onWrongClick) this._onWrongClick(this._wrongClicks);
    }
  }

  _handleNoDiffConfirm(poem, btn) {
    const isDecoy = poem.diffIndex === -1;
    if (isDecoy) {
      this._clearIdleTimer();
      if (this._onDecoyConfirm) this._onDecoyConfirm();
      setTimeout(() => this._advancePoem(), 800);
      return;
    }

    btn.classList.remove('poem-compare-confirm-btn-wrong');
    void btn.offsetWidth;
    btn.classList.add('poem-compare-confirm-btn-wrong');
    this._wrongClicks++;
    if (this._onNoDiffReject) this._onNoDiffReject(this._wrongClicks);
  }

  _advancePoem() {
    this._currentPoem++;
    this._wrongClicks = 0;
    this._idleLevel = 0;
    if (this._currentPoem >= POEMS.length) {
      this._resolved = true;
      if (this._onComplete) this._onComplete(this._foundDiffs);
    } else {
      this._renderCurrentPoem();
    }
  }

  _renderProgressSlots() {
    return Array.from({ length: 4 }, (_, i) => {
      const filled = i < this._foundDiffs.length;
      const char = filled ? this._foundDiffs[i] : '';
      return `<span class="poem-progress-slot ${filled ? 'filled' : ''}">${char}</span>`;
    }).join('');
  }

  _updateProgressSlots() {
    const slots = this._root.querySelectorAll('.poem-progress-slot');
    this._foundDiffs.forEach((ch, i) => {
      if (slots[i]) {
        slots[i].textContent = ch;
        slots[i].classList.add('filled');
      }
    });
  }

  _resetIdleTimer() {
    this._clearIdleTimer();
    this._idleLevel = 0;
    const poem = POEMS[this._currentPoem];
    const isDecoy = poem.diffIndex === -1;
    const t1 = isDecoy ? 15000 : 20000;
    const t2 = isDecoy ? 30000 : 40000;
    const t3 = isDecoy ? null : 60000;

    this._idleTimer = setTimeout(() => {
      this._showIdleHint(1, isDecoy);
      this._idleTimer = setTimeout(() => {
        this._showIdleHint(2, isDecoy);
        if (t3) {
          this._idleTimer = setTimeout(() => {
            this._showIdleHint(3, isDecoy);
          }, t3 - t2);
        }
      }, t2 - t1);
    }, t1);
  }

  _showIdleHint(level, isDecoy) {
    if (isDecoy) {
      if (level === 1) {
        this.engine.emit('poem-idle-hint', { text: '这一首……好像没有不同。' });
      } else {
        const btn = this._root.querySelector('.poem-compare-confirm-btn');
        if (btn) btn.classList.add('pulse-hint');
      }
    } else {
      const poem = POEMS[this._currentPoem];
      if (level === 1) {
        this.engine.emit('poem-idle-hint', { text: '逐字对比，不要凭记忆。' });
      } else if (level === 2) {
        this._highlightLine(poem);
      } else {
        this._highlightChar(poem);
      }
    }
  }

  _highlightLine(poem) {
    const chars = this._root.querySelectorAll('[data-side="left"] .poem-char-clickable');
    const lineStart = poem.diffIndex > 6 ? 7 : 0;
    const lineEnd = poem.diffIndex > 6 ? 13 : 6;
    chars.forEach((ch, i) => {
      if (i >= lineStart && i <= lineEnd) ch.classList.add('poem-char-line-hint');
    });
  }

  _highlightChar(poem) {
    const chars = this._root.querySelectorAll('[data-side="left"] .poem-char-clickable');
    if (chars[poem.diffIndex]) chars[poem.diffIndex].classList.add('poem-char-direct-hint');
  }

  _clearIdleTimer() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }
}
