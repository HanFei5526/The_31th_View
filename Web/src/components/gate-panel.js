/**
 * 《卅一景》研讨门槛面板
 *
 * 交互范式：自由对话 + 快捷想法 + 推断确认
 * - 玩家自由打字输入
 * - 提供"我想到……"快捷按钮降低输入门槛
 * - 理解度达标后显示"确认这个推断"按钮
 * - 无关闭按钮，必须通过才能关闭
 */

export class GatePanel {
  constructor(engine) {
    this.engine = engine;
    this._wrapperEl = null;
    this._messagesEl = null;
    this._inputAreaEl = null;
    this._quickThoughtsEl = null;
    this._confirmBtnEl = null;
    this._isOffline = false;

    this._onTextInput = null;
    this._onQuickThought = null;

    this._createDOM();
  }

  _createDOM() {
    this._wrapperEl = document.createElement('div');
    this._wrapperEl.className = 'gate-panel-wrapper hidden';

    const container = document.createElement('div');
    container.className = 'gate-panel-container';

    // 头部
    const header = document.createElement('div');
    header.className = 'gate-panel-header';
    this._titleEl = document.createElement('h3');
    header.appendChild(this._titleEl);

    // 消息区域
    this._messagesEl = document.createElement('div');
    this._messagesEl.className = 'gate-panel-messages';

    // 确认按钮区域（理解度达标时显示）
    this._confirmAreaEl = document.createElement('div');
    this._confirmAreaEl.className = 'gate-panel-confirm-area hidden';

    // 快捷想法区域
    this._quickThoughtsEl = document.createElement('div');
    this._quickThoughtsEl.className = 'gate-panel-quick-thoughts';

    // 输入区域
    this._inputAreaEl = document.createElement('div');
    this._inputAreaEl.className = 'gate-panel-input-area';

    this._input = document.createElement('input');
    this._input.type = 'text';
    this._input.placeholder = '写下你的推断……';
    this._input.autocomplete = 'off';

    this._sendBtn = document.createElement('button');
    this._sendBtn.className = 'gate-send-btn';
    this._sendBtn.textContent = '发送';

    this._inputAreaEl.appendChild(this._input);
    this._inputAreaEl.appendChild(this._sendBtn);

    // 离线提示
    this._offlineHintEl = document.createElement('div');
    this._offlineHintEl.className = 'gate-offline-hint hidden';
    this._offlineHintEl.textContent = '（离线模式：点击上方"我想到……"按钮，或自由输入你的想法）';
    this._inputAreaEl.appendChild(this._offlineHintEl);

    container.appendChild(header);
    container.appendChild(this._messagesEl);
    container.appendChild(this._confirmAreaEl);
    container.appendChild(this._quickThoughtsEl);
    container.appendChild(this._inputAreaEl);
    this._wrapperEl.appendChild(container);

    document.getElementById('app').appendChild(this._wrapperEl);

    this._bindEvents();
  }

  _bindEvents() {
    const handleSend = () => {
      const text = this._input.value.trim();
      if (text && this._onTextInput) {
        this._input.value = '';
        this.showPlayerMessage(text);
        this._onTextInput(text);
      }
    };

    this._sendBtn.addEventListener('click', handleSend);
    this._input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  // ==== 公共接口 ====

  /**
   * 挂载面板
   * @param {string} title 门槛标题
   * @param {Function} onTextInput 玩家发送文本回调
   * @param {Function} onQuickThought 快捷想法回调
   */
  mount(title, onTextInput, onQuickThought) {
    this._titleEl.textContent = `📖 研讨：${title}`;
    this._onTextInput = onTextInput;
    this._onQuickThought = onQuickThought;

    this._messagesEl.innerHTML = '';
    this._wrapperEl.classList.remove('hidden');
    this._confirmAreaEl.classList.add('hidden');
    this._confirmAreaEl.innerHTML = '';
    this._quickThoughtsEl.innerHTML = '';

    this._input.disabled = false;
    this._sendBtn.disabled = false;
    this._sendBtn.textContent = '发送';

    // 聚焦输入框
    setTimeout(() => this._input.focus(), 300);
  }

  unmount() {
    this._wrapperEl.classList.add('hidden');
    this._messagesEl.innerHTML = '';
    this._confirmAreaEl.innerHTML = '';
    this._confirmAreaEl.classList.add('hidden');
    this._quickThoughtsEl.innerHTML = '';
    this._onTextInput = null;
    this._onQuickThought = null;
  }

  /**
   * 设置离线模式
   */
  setOfflineMode(isOffline) {
    this._isOffline = isOffline;
    if (isOffline) {
      this._offlineHintEl.classList.remove('hidden');
      this._input.placeholder = '写下你的想法，或点击上方按钮……';
    } else {
      this._offlineHintEl.classList.add('hidden');
      this._input.placeholder = '写下你的推断……';
    }
  }

  // ==== 消息展示 ====

  showOpening(title, text) {
    this._appendSystemMessage(`你发现了「${title}」。把你的推断写下来，和周老师讨论。`);
    if (text) this.showNPCMessage(text);
  }

  showNPCMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'gate-message-wrapper gate-message-npc';

    const avatar = document.createElement('span');
    avatar.className = 'gate-message-avatar';
    avatar.textContent = '周';

    const bubble = document.createElement('div');
    bubble.className = 'gate-message-bubble';

    // 支持多行文本（用 \n\n 分隔的段落）
    const paragraphs = text.split('\n\n');
    paragraphs.forEach((para, i) => {
      const p = document.createElement('p');
      p.textContent = para;
      bubble.appendChild(p);
      if (i < paragraphs.length - 1) {
        bubble.appendChild(document.createElement('br'));
      }
    });

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    this._messagesEl.appendChild(wrapper);
    this._scrollToBottom();
  }

  showPlayerMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'gate-message-wrapper gate-message-player';

    const bubble = document.createElement('div');
    bubble.className = 'gate-message-bubble';
    bubble.textContent = text;

    const avatar = document.createElement('span');
    avatar.className = 'gate-message-avatar gate-message-avatar-player';
    avatar.textContent = '我';

    wrapper.appendChild(bubble);
    wrapper.appendChild(avatar);
    this._messagesEl.appendChild(wrapper);
    this._scrollToBottom();
  }

  showSystemMessage(text) {
    this._appendSystemMessage(text);
  }

  _appendSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'gate-message-system';
    el.textContent = text;
    this._messagesEl.appendChild(el);
    this._scrollToBottom();
  }

  // ==== 快捷想法按钮 ====

  showQuickThoughts(thoughts) {
    if (!thoughts || thoughts.length === 0) return;

    this._quickThoughtsEl.innerHTML = '';

    const label = document.createElement('span');
    label.className = 'gate-quick-label';
    label.textContent = '我想到……';
    this._quickThoughtsEl.appendChild(label);

    thoughts.forEach((thought) => {
      const btn = document.createElement('button');
      btn.className = 'gate-quick-btn';
      btn.textContent = thought;
      btn.addEventListener('click', () => {
        this._input.value = thought;
        // 视觉上给一点反馈
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 200);
        // 自动聚焦到输入框，让玩家可以再编辑
        this._input.focus();
      });
      this._quickThoughtsEl.appendChild(btn);
    });
  }

  // ==== 确认推断按钮 ====

  showConfirmButton(onConfirm) {
    this._confirmAreaEl.innerHTML = '';
    this._confirmAreaEl.classList.remove('hidden');

    const btn = document.createElement('button');
    btn.className = 'gate-confirm-insight-btn';
    btn.innerHTML = '<span class="gate-confirm-icon">✓</span> 确认这个推断';
    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.classList.add('confirmed');
      if (onConfirm) onConfirm();
    });

    this._confirmAreaEl.appendChild(btn);
    this._scrollToBottom();
  }

  hideConfirmButton() {
    this._confirmAreaEl.classList.add('hidden');
    this._confirmAreaEl.innerHTML = '';
  }

  // ==== 通过动效 ====

  showPassEffect(gateTitle) {
    const overlay = document.createElement('div');
    overlay.className = 'gate-pass-overlay';
    overlay.innerHTML = `
      <div class="gate-pass-content">
        <div class="gate-pass-stamp">✓</div>
        <div class="gate-pass-title">研讨通过</div>
        <div class="gate-pass-subtitle">「${gateTitle}」已解读</div>
      </div>
    `;
    this._wrapperEl.appendChild(overlay);

    // 动画：墨迹扩散效果
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  // ==== 加载状态 ====

  setLoading(isLoading) {
    if (isLoading) {
      this._input.disabled = true;
      this._sendBtn.disabled = true;
      this._sendBtn.innerHTML = '<span class="gate-loading-dots">⋯</span>';
    } else {
      this._input.disabled = false;
      this._sendBtn.disabled = false;
      this._sendBtn.textContent = '发送';
      this._input.focus();
    }
  }

  // ==== 内部方法 ====

  _scrollToBottom() {
    this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
  }
}
