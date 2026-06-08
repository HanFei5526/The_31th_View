/**
 * 《卅一景》线索发现弹窗组件
 * 
 * 采用纯 CSS 实现暗木匾额风格，包含打字机效果和双按钮交互。
 */

export default class CluePopup {
  /**
   * @param {object} options
   * @param {Function} options.onSave - 点击存入记事簿的回调 () => {}
   * @param {Function} options.onAsk - 点击询问周老师的回调 (text) => {}
   * @param {Function} options.onClose - 关闭弹窗的回调 () => {}
   */
  constructor(options) {
    this.options = options;
    this.container = null;
    this.hasActionTaken = false;
    this.clueData = null;
  }

  /**
   * 显示线索弹窗
   * @param {object} clue - { id, title, desc, askText }
   */
  show(clue) {
    this.clueData = clue;
    this.hasActionTaken = false;
    
    this.container = document.createElement('div');
    this.container.className = 'clue-popup-overlay';
    
    this.popup = document.createElement('div');
    this.popup.className = 'clue-popup-plaque';
    
    // Header
    const header = document.createElement('div');
    header.className = 'clue-popup-header';
    header.innerHTML = `
      <span class="clue-popup-dot">●</span> 发现线索
    `;
    
    // Divider
    const divider1 = document.createElement('div');
    divider1.className = 'clue-popup-divider';

    // Title
    const title = document.createElement('h3');
    title.className = 'clue-popup-title';
    title.textContent = clue.title;

    // Description Container
    const descContainer = document.createElement('div');
    descContainer.className = 'clue-popup-desc';
    this.descEl = descContainer;

    // Divider
    const divider2 = document.createElement('div');
    divider2.className = 'clue-popup-divider';

    // Action Buttons
    const actions = document.createElement('div');
    actions.className = 'clue-popup-actions';
    
    this.btnSave = document.createElement('button');
    this.btnSave.className = 'clue-popup-btn';
    this.btnSave.innerHTML = '📓 存入记事簿';
    this.btnSave.onclick = () => this._handleSave();

    this.btnAsk = document.createElement('button');
    this.btnAsk.className = 'clue-popup-btn';
    this.btnAsk.innerHTML = '💬 询问周老师';
    this.btnAsk.onclick = () => this._handleAsk();

    actions.appendChild(this.btnSave);
    actions.appendChild(this.btnAsk);

    // Close Button (hidden initially)
    this.btnClose = document.createElement('button');
    this.btnClose.className = 'clue-popup-close-btn';
    this.btnClose.innerHTML = '✕';
    this.btnClose.style.display = 'none';
    this.btnClose.onclick = () => this.hide();

    // Assembly
    this.popup.appendChild(this.btnClose);
    this.popup.appendChild(header);
    this.popup.appendChild(divider1);
    this.popup.appendChild(title);
    this.popup.appendChild(descContainer);
    this.popup.appendChild(divider2);
    this.popup.appendChild(actions);
    
    this.container.appendChild(this.popup);
    document.body.appendChild(this.container);

    // Typewriter effect
    this._typewriter(clue.desc);
  }

  _typewriter(text) {
    let i = 0;
    this.descEl.textContent = '';
    
    const clickToSkip = () => {
      clearInterval(this.typeTimer);
      this.descEl.textContent = text;
      this.popup.removeEventListener('click', clickToSkip);
      this._revealActions();
    };
    this.popup.addEventListener('click', clickToSkip);

    this.typeTimer = setInterval(() => {
      if (i < text.length) {
        this.descEl.textContent += text[i];
        i++;
      } else {
        clearInterval(this.typeTimer);
        this.popup.removeEventListener('click', clickToSkip);
        this._revealActions();
      }
    }, 45);
  }

  _revealActions() {
    this.btnSave.classList.add('visible');
    this.btnAsk.classList.add('visible');
  }

  _handleSave() {
    this.btnSave.innerHTML = '✓ 已记录';
    this.btnSave.classList.add('disabled');
    this.btnSave.disabled = true;
    this._markActionTaken();
    if (this.options.onSave) {
      this.options.onSave(this.clueData);
    }
  }

  _handleAsk() {
    this.btnAsk.innerHTML = '✓ 已询问';
    this.btnAsk.classList.add('disabled');
    this.btnAsk.disabled = true;
    this._markActionTaken();
    
    // 隐藏自身，不销毁，等对话结束可以恢复
    this.container.style.display = 'none';
    
    if (this.options.onAsk) {
      this.options.onAsk(this.clueData.askText, () => {
        // 对话关闭后恢复显示
        this.container.style.display = 'flex';
      });
    }
  }

  _markActionTaken() {
    if (!this.hasActionTaken) {
      this.hasActionTaken = true;
      this.btnClose.style.display = 'block'; // 允许关闭
    }
  }

  hide() {
    if (!this.hasActionTaken) return;
    this.popup.style.transform = 'scale(0.9)';
    this.popup.style.opacity = '0';
    this.container.style.opacity = '0';
    setTimeout(() => {
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
      if (this.options.onClose) {
        this.options.onClose();
      }
    }, 300);
  }
}
