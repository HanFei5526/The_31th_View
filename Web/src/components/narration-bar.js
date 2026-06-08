export class NarrationBar {
  constructor(engine) {
    this.engine = engine;
    this._container = null;
    this._barEl = null;
    this._speakerEl = null;
    this._textEl = null;
    this._portraitContainer = null;
    this._portraitImg = null;
    this._feedbackEl = null;

    this._typeSpeed = 42;
    this._isTyping = false;
    this._resolvePlay = null;
    this._typingTimer = null;
    this._fullText = '';
    this._feedbackTimer = null;

    this._boundOnClick = this._onClick.bind(this);
  }

  mount(root) {
    this._container = document.createElement('div');
    this._container.className = 'narration-container';

    // 立绘容器（fixed定位，独立于对话框）
    this._portraitContainer = document.createElement('div');
    this._portraitContainer.className = 'narration-portrait-container';
    this._portraitImg = document.createElement('img');
    this._portraitImg.className = 'narration-portrait';
    this._portraitContainer.appendChild(this._portraitImg);
    root.appendChild(this._portraitContainer);

    // 对话框条
    this._barEl = document.createElement('div');
    this._barEl.className = 'narration-bar';
    this._barEl.addEventListener('click', this._boundOnClick);

    this._speakerEl = document.createElement('div');
    this._speakerEl.className = 'narration-speaker';
    this._barEl.appendChild(this._speakerEl);

    this._textEl = document.createElement('div');
    this._textEl.className = 'narration-text';
    this._barEl.appendChild(this._textEl);

    this._container.appendChild(this._barEl);

    // 短反馈条
    this._feedbackEl = document.createElement('div');
    this._feedbackEl.className = 'narration-feedback';
    this._container.appendChild(this._feedbackEl);

    root.appendChild(this._container);
  }

  unmount() {
    if (this._typingTimer) clearTimeout(this._typingTimer);
    if (this._feedbackTimer) clearTimeout(this._feedbackTimer);
    if (this._barEl) this._barEl.removeEventListener('click', this._boundOnClick);
    if (this._portraitContainer) this._portraitContainer.remove();
    if (this._container) this._container.remove();
    this._container = null;
  }

  playLine(speaker, text, options = {}) {
    return new Promise((resolve) => {
      this._resolvePlay = resolve;
      this._fullText = text;
      this._isTyping = true;
      this._textEl.textContent = '';

      if (speaker) {
        this._barEl.className = 'narration-bar state-character';
        this._speakerEl.style.display = 'block';
        this._speakerEl.textContent = speaker;
      } else {
        this._barEl.className = 'narration-bar state-narration';
        this._speakerEl.style.display = 'none';
      }

      if (options.portrait) {
        this.setPortrait(options.portrait);
      } else {
        this.setPortrait(null);
      }

      this._typeChar(0);
    });
  }

  setPortrait(src) {
    if (src) {
      this._portraitImg.src = src;
      this._portraitContainer.classList.add('visible');
    } else {
      this._portraitContainer.classList.remove('visible');
    }
  }

  showFeedback(text) {
    if (!this._feedbackEl) return;
    this._feedbackEl.textContent = text;
    this._feedbackEl.classList.add('visible');

    if (this._feedbackTimer) clearTimeout(this._feedbackTimer);
    this._feedbackTimer = setTimeout(() => {
      this._feedbackEl.classList.remove('visible');
    }, 3000);
  }

  dismiss() {
    if (this._typingTimer) clearTimeout(this._typingTimer);
    this._isTyping = false;
    this._textEl.textContent = '';
    this._speakerEl.style.display = 'none';
    this.setPortrait(null);
  }

  _typeChar(index) {
    if (index < this._fullText.length) {
      this._textEl.textContent += this._fullText.charAt(index);
      this._typingTimer = setTimeout(() => this._typeChar(index + 1), this._typeSpeed);
    } else {
      this._isTyping = false;
    }
  }

  _onClick() {
    if (this._isTyping) {
      if (this._typingTimer) clearTimeout(this._typingTimer);
      this._textEl.textContent = this._fullText;
      this._isTyping = false;
    } else {
      if (this._resolvePlay) {
        const resolve = this._resolvePlay;
        this._resolvePlay = null;
        resolve();
      }
    }
  }
}
