/**
 * 《卅一景》周鹤年对话面板
 *
 * 方案 A：现实世界中的 AI 对话浮层。
 * 仅在 currentWorld === 'real' 时显示入口按钮。
 */

export class ChatPanel {
  constructor(engine) {
    /** @type {import('../core/game-engine.js').GameEngine} */
    this.engine = engine;

    /** 入口按钮 */
    this._toggleEl = null;
    /** 面板容器 */
    this._panelEl = null;
    /** 消息列表容器 */
    this._messagesEl = null;
    /** 输入框 */
    this._inputEl = null;
    /** 是否展开 */
    this._isOpen = false;
    /** 是否正在等待 AI 回复 */
    this._isLoading = false;
  }

  /* ==========================
     初始化
     ========================== */

  init() {
    this._createDOM();
    this._bindEvents();
    this._updateVisibility();
  }

  /* ==========================
     DOM 构建
     ========================== */

  /** @private */
  _createDOM() {
    // ---- 入口按钮 ----
    const toggle = document.createElement('button');
    toggle.className = 'chat-toggle';
    toggle.id = 'chat-toggle-btn';
    toggle.setAttribute('aria-label', '打开周鹤年对话');
    toggle.innerHTML = `<span class="chat-toggle-icon">💬</span><span class="chat-toggle-label">问周老师</span>`;
    toggle.addEventListener('click', () => this._toggle());
    document.body.appendChild(toggle);
    this._toggleEl = toggle;

    // ---- 面板 ----
    const panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.id = 'chat-panel';
    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-title">📓 周鹤年</div>
        <button class="chat-close-btn" id="chat-close-btn" aria-label="关闭周鹤年对话">✕</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-welcome">
          <p>你可以把画中的发现告诉周老师，</p>
          <p>向他请教修复方面的问题。</p>
        </div>
      </div>
      <div class="chat-input-area">
        <input
          type="text"
          class="chat-input"
          id="chat-input"
          placeholder="向周老师请教……"
          maxlength="200"
          autocomplete="off"
        />
        <button class="chat-send-btn" id="chat-send-btn" aria-label="发送消息">
          <span>↑</span>
        </button>
      </div>
    `;
    document.body.appendChild(panel);
    this._panelEl = panel;
    this._messagesEl = panel.querySelector('#chat-messages');
    this._inputEl = panel.querySelector('#chat-input');

    // 关闭按钮
    panel.querySelector('#chat-close-btn').addEventListener('click', () => this._close());

    // 发送按钮
    panel.querySelector('#chat-send-btn').addEventListener('click', () => this._send());

    // 回车发送
    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._send();
      }
    });
  }

  /* ==========================
     事件绑定
     ========================== */

  /** @private */
  _bindEvents() {
    // 世界切换时更新可见性
    this.engine.on('world-changed', () => this._updateVisibility());

    // 场景切换时关闭面板并清空历史
    this.engine.on('scene-enter', () => {
      this._close();
      this._updateVisibility();
      this.engine.aiService.clearZhouHistory();
      // 清空消息列表但保留欢迎语
      if (this._messagesEl) {
        this._messagesEl.innerHTML = `
          <div class="chat-welcome">
            <p>你可以把画中的发现告诉周老师，</p>
            <p>向他请教修复方面的问题。</p>
          </div>
        `;
      }
    });
  }

  /* ==========================
     交互逻辑
     ========================== */

  /** @private */
  _toggle() {
    this._isOpen ? this._close() : this._open();
  }

  /** @private */
  _open() {
    this._isOpen = true;
    this._panelEl.classList.add('open');
    this._toggleEl.classList.add('active');
    // 聚焦输入框
    setTimeout(() => this._inputEl.focus(), 300);
  }

  /** @private */
  _close() {
    this._isOpen = false;
    this._panelEl.classList.remove('open');
    this._toggleEl.classList.remove('active');
  }

  /** @private */
  _updateVisibility() {
    const visible = this.engine.currentWorld === 'real'
      && this.engine.currentScene !== 'landing'
      && this.engine.currentScene !== 'menu';

    this._toggleEl.style.display = visible ? 'flex' : 'none';

    // 如果切到画中世界，自动关闭面板
    if (!visible) this._close();
  }

  /** @private */
  async _send() {
    const text = this._inputEl.value.trim();
    if (!text || this._isLoading) return;

    this._inputEl.value = '';

    // 添加玩家消息
    this._appendMessage('user', text);

    // 显示加载状态
    this._isLoading = true;
    const loadingEl = this._appendMessage('loading', '');

    try {
      const reply = await this.engine.aiService.chatWithZhou(text);

      // 移除加载状态，添加 AI 回复
      loadingEl.remove();
      this._appendMessage('zhou', reply);

      // 触发批注：和周鹤年对话后产生新思考
      this._triggerPostChatAnnotation(text, reply);
    } catch (err) {
      loadingEl.remove();
      this._appendMessage('zhou', '（周老师沉默了一会儿，似乎在思考……）');
      console.error('[ChatPanel] AI 调用失败:', err);
    } finally {
      this._isLoading = false;
    }
  }

  /**
   * 和周鹤年对话后，有概率触发沈念的笔记本批注
   * @private
   */
  _triggerPostChatAnnotation(userMsg, zhouReply) {
    // 每次对话都有可能产生新思考，通过事件通知 NotebookPanel
    this.engine.emit('zhou-chat-complete', {
      userMessage: userMsg,
      zhouReply: zhouReply,
    });
  }

  /**
   * 向消息列表追加一条消息
   * @private
   * @param {'user'|'zhou'|'loading'} type
   * @param {string} text
   * @returns {HTMLElement} 消息元素
   */
  _appendMessage(type, text) {
    const msg = document.createElement('div');
    msg.className = `chat-msg chat-msg-${type}`;

    if (type === 'user') {
      msg.innerHTML = `<div class="chat-msg-bubble chat-msg-user-bubble">${this._escapeHtml(text)}</div>`;
    } else if (type === 'zhou') {
      msg.innerHTML = `<div class="chat-msg-bubble chat-msg-zhou-bubble"><span class="chat-msg-speaker">📓 周鹤年</span>${this._escapeHtml(text)}</div>`;
    } else if (type === 'loading') {
      msg.innerHTML = `<div class="chat-msg-bubble chat-msg-zhou-bubble"><span class="chat-msg-speaker">📓 周鹤年</span><span class="chat-loading-dots"><span>.</span><span>.</span><span>.</span></span></div>`;
    }

    this._messagesEl.appendChild(msg);
    this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
    return msg;
  }

  /** @private */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
