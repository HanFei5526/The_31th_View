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
    this._textChars = [];
    this._feedbackTimer = null;
    this._isFloating = false;
    this._optionsEl = null;
    this._resolveOptions = null;
    this._portraitLocked = false;

    this._boundOnClick = this._onClick.bind(this);
    this._boundOnKeyDown = this._onKeyDown.bind(this);
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
    document.addEventListener('keydown', this._boundOnKeyDown);

    this._speakerEl = document.createElement('div');
    this._speakerEl.className = 'narration-speaker';
    this._speakerEl.style.display = 'none'; // 初始隐藏，防止加载时闪烁空白框
    this._barEl.appendChild(this._speakerEl);

    this._textEl = document.createElement('div');
    this._textEl.className = 'narration-text';
    this._barEl.appendChild(this._textEl);

    this._continueEl = document.createElement('span');
    this._continueEl.className = 'narration-continue';
    this._continueEl.setAttribute('aria-hidden', 'true');
    this._continueEl.textContent = '▼';
    this._barEl.appendChild(this._continueEl);

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
    if (this._floatingTimer) clearTimeout(this._floatingTimer);
    if (this._barEl) this._barEl.removeEventListener('click', this._boundOnClick);
    document.removeEventListener('keydown', this._boundOnKeyDown);
    if (this._portraitContainer) this._portraitContainer.remove();
    if (this._optionsEl) this._optionsEl.remove();
    if (this._container) this._container.remove();
    this._container = null;
    this._optionsEl = null;
  }

  playLine(speaker, text, options = {}) {
    if (this._typingTimer) clearTimeout(this._typingTimer);
    if (this._floatingTimer) clearTimeout(this._floatingTimer);
    this._typingTimer = null;
    this._floatingTimer = null;
    this._isFloating = false;

    if (this._resolvePlay) {
      const oldResolve = this._resolvePlay;
      this._resolvePlay = null;
      oldResolve();
    }

    return new Promise((resolve) => {
      this._resolvePlay = resolve;
      this._fullText = text;
      this._textChars = Array.from(text);
      this._isTyping = true;
      this._textEl.textContent = '';

      if (this._container) {
        this._container.classList.add('visible'); // 播放时使对话框可见
      }

      if (speaker) {
        this._barEl.className = 'narration-bar state-character';
        this._speakerEl.style.display = 'block';
        this._speakerEl.textContent = speaker;
      } else {
        this._barEl.className = 'narration-bar state-narration';
        this._speakerEl.style.display = 'none';
      }

      if ('portrait' in options) {
        this.setPortrait(options.portrait);
      }

      this._emitNotebookGuidanceIfNeeded(speaker, text);
      this._typeChar(0);
    });
  }

  setPortrait(src) {
    if (!src && this._portraitLocked) return;
    if (src) {
      this._portraitImg.src = src;
      this._portraitImg.onerror = () => {
        this._portraitContainer.classList.remove('visible');
      };
      this._portraitImg.onload = () => {
        this._portraitContainer.classList.add('visible');
      };
      if (src.includes('shennian_3')) {
        this._portraitContainer.classList.add('portrait-reach');
      } else {
        this._portraitContainer.classList.remove('portrait-reach');
      }
    } else {
      this._portraitContainer.classList.remove('visible');
      this._portraitContainer.classList.remove('portrait-reach');
    }
  }

  lockPortrait() {
    this._portraitLocked = true;
  }

  unlockPortrait() {
    this._portraitLocked = false;
  }

  showOptions(options) {
    return new Promise((resolve) => {
      this._resolveOptions = resolve;

      if (this._optionsEl) {
        this._optionsEl.remove();
      }

      this._optionsEl = document.createElement('div');
      this._optionsEl.className = 'narration-options';

      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'narration-option-btn';
        btn.textContent = opt.label;
        btn.onclick = (e) => {
          e.stopPropagation(); // 防止触发底下的点击事件
          this._handleOptionClick(opt.value);
        };
        this._optionsEl.appendChild(btn);
      });

      // 将选项插入到对话框上方
      this._container.insertBefore(this._optionsEl, this._barEl);
      this._hideContinue();

      // 如果正在打字，直接显示全本
      if (this._isTyping) {
        if (this._typingTimer) clearTimeout(this._typingTimer);
        this._textEl.textContent = this._fullText;
        this._isTyping = false;
      }
    });
  }

  _handleOptionClick(value) {
    if (this._optionsEl) {
      this._optionsEl.remove();
      this._optionsEl = null;
    }
    const resolve = this._resolveOptions;
    this._resolveOptions = null;
    if (resolve) resolve(value);
  }

  showFeedback(text) {
    if (!this._feedbackEl) return;
    this._feedbackEl.textContent = text;
    this._feedbackEl.classList.add('visible');

    if (this._feedbackTimer) clearTimeout(this._feedbackTimer);
    this._feedbackTimer = setTimeout(() => {
      this._feedbackEl.classList.remove('visible');
    }, 4000);
  }

  showFloating(text) {
    if (!this._barEl) return;
    if (this._floatingTimer) clearTimeout(this._floatingTimer);
    if (this._typingTimer) clearTimeout(this._typingTimer);
    this._isTyping = false;
    this._isFloating = true;
    this._showContinue();

    if (this._container) {
      this._container.classList.add('visible'); // 浮现时显示对话框
    }

    this._barEl.className = 'narration-bar state-narration';
    this._speakerEl.style.display = 'none';
    this._textEl.textContent = text;
    this._emitNotebookGuidanceIfNeeded(null, text);

    this._floatingTimer = setTimeout(() => {
      this._textEl.textContent = '';
      this._floatingTimer = null;
      this._isFloating = false;
      this._hideContinue();
      if (this._container) {
        this._container.classList.remove('visible'); // 自动淡出隐藏
      }
    }, 4000);
  }

  dismiss() {
    if (this._typingTimer) clearTimeout(this._typingTimer);
    if (this._floatingTimer) clearTimeout(this._floatingTimer);
    this._floatingTimer = null;
    this._isTyping = false;
    this._isFloating = false;
    this._hideContinue();
    this._textEl.textContent = '';
    this._speakerEl.style.display = 'none';
    this.setPortrait(null);
    if (this._container) {
      this._container.classList.remove('visible'); // 关闭对话时隐藏
    }
    if (this._optionsEl) {
      this._optionsEl.remove();
      this._optionsEl = null;
    }
    if (this._resolveOptions) {
      this._resolveOptions(null);
      this._resolveOptions = null;
    }
  }

  _typeChar(index) {
    if (index < this._textChars.length) {
      this._textEl.textContent += this._textChars[index];
      this._typingTimer = setTimeout(() => this._typeChar(index + 1), this._typeSpeed);
    } else {
      this._isTyping = false;
      this._showContinue();
    }
  }

  _onClick() {
    // 如果有选项正在显示，禁止点击通过
    if (this._resolveOptions) return;

    if (this._isFloating) {
      this.dismiss();
      return;
    }

    if (this._isTyping) {
      if (this._typingTimer) clearTimeout(this._typingTimer);
      this._textEl.textContent = this._fullText;
      this._isTyping = false;
      this._showContinue();
    } else {
      if (this._resolvePlay) {
        this._hideContinue();
        const resolve = this._resolvePlay;
        this._resolvePlay = null;
        resolve();
      }
    }
  }

  _onKeyDown(e) {
    if (!this._isFastForwardKey(e) || this._isTextInputActive()) return;
    if (!this._resolvePlay && !this._isTyping && !this._isFloating) return;
    e.preventDefault();
    this._onClick();
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

  _showContinue() {
    if (this._continueEl) this._continueEl.classList.add('visible');
  }

  _hideContinue() {
    if (this._continueEl) this._continueEl.classList.remove('visible');
  }

  _emitNotebookGuidanceIfNeeded(speaker, text) {
    if (!text) return;

    const isNotebookGuidance = [
      '修复笔记本',
      '笔记本',
      '记录页',
      '对话页',
      '查看线索',
      '继续讨论',
      '快捷问题',
      '已写入',
      '已收录',
      '线索'
    ].some(keyword => text.includes(keyword));

    if (isNotebookGuidance) {
      this.engine?.emit?.('notebook-guidance-shown', { text });
    }
  }
}
