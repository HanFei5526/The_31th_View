export class NotebookFloating {
  constructor(engine) {
    this.engine = engine;
    this._container = null;
    this._tabs = {};
    this._panes = {};
    
    // 状态
    this._expanded = false;
    this._locked = false;
    this._currentTab = 'chat';
    
    // UI元素
    this._historyEl = null;
    this._quickThoughtsEl = null;
    this._inputEl = null;
    this._sendBtn = null;
    this._recordsListEl = null;
    this._toolSectionEl = null;
    this._toolGridEl = null;
    this._emptyGuideEl = null;
    this._confirmAreaEl = null;

    // 回调
    this._onSubmitCb = null;
    this._onQuickThoughtCb = null;
    this._onToolClickCb = null;
    
    // 事件绑定
    this._boundOnClueCollected = this._onClueCollected.bind(this);
    this._boundOnItemCollected = this._onItemCollected.bind(this);
    this._boundOnToolUsed = this._onToolUsed.bind(this);
    this._boundOnAllToolsUsed = this._onAllToolsUsed.bind(this);
  }

  mount(root) {
    this._container = document.createElement('div');
    this._container.className = 'notebook-floating';

    // 头部 Tab
    const header = document.createElement('div');
    header.className = 'notebook-header';

    this._tabs['chat'] = this._createTabBtn('对话', 'chat', true);
    this._tabs['records'] = this._createTabBtn('记录', 'records', false);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'notebook-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.collapse());

    header.appendChild(this._tabs['chat']);
    header.appendChild(this._tabs['records']);
    header.appendChild(closeBtn);

    // 内容区
    const content = document.createElement('div');
    content.className = 'notebook-content';

    this._panes['chat'] = this._createChatPane();
    this._panes['records'] = this._createRecordsPane();

    content.appendChild(this._panes['chat']);
    content.appendChild(this._panes['records']);

    // 工具区
    this._toolSectionEl = document.createElement('div');
    this._toolSectionEl.className = 'notebook-tool-section hidden';
    const toolTitle = document.createElement('div');
    toolTitle.className = 'notebook-tool-title';
    toolTitle.textContent = '工具箱';
    this._toolGridEl = document.createElement('div');
    this._toolGridEl.className = 'notebook-tool-grid';
    this._toolSectionEl.appendChild(toolTitle);
    this._toolSectionEl.appendChild(this._toolGridEl);

    this._container.appendChild(header);
    this._container.appendChild(content);
    this._container.appendChild(this._toolSectionEl);

    root.appendChild(this._container);

    // 绑定事件总线
    window.addEventListener('clue-collected', this._boundOnClueCollected);
    window.addEventListener('item-collected', this._boundOnItemCollected);
    window.addEventListener('tool-used', this._boundOnToolUsed);
    window.addEventListener('all-tools-used', this._boundOnAllToolsUsed);
  }

  unmount() {
    window.removeEventListener('clue-collected', this._boundOnClueCollected);
    window.removeEventListener('item-collected', this._boundOnItemCollected);
    window.removeEventListener('tool-used', this._boundOnToolUsed);
    window.removeEventListener('all-tools-used', this._boundOnAllToolsUsed);
    
    if (this._container) this._container.remove();
    this._container = null;
  }

  // === 阶段控制 ===

  expand() {
    if (this._container) {
      this._container.classList.add('expanded');
      this._expanded = true;
    }
  }

  collapse() {
    if (this._locked) return; // 锁定状态禁止收缩
    if (this._container) {
      this._container.classList.remove('expanded');
      this._expanded = false;
    }
  }

  hide() {
    if (this._container) this._container.classList.add('hidden');
  }

  show() {
    if (this._container) this._container.classList.remove('hidden');
  }

  lock() {
    this._locked = true;
  }

  unlock() {
    this._locked = false;
  }

  setSynthesisMode(active) {
    if (!this._container) return;
    if (active) {
      this._container.classList.add('synthesis-mode');
      // 改Tab标签名
      if (this._tabs['chat']) this._tabs['chat'].textContent = '综合研讨';
    } else {
      this._container.classList.remove('synthesis-mode');
      if (this._tabs['chat']) this._tabs['chat'].textContent = '对话';
    }
  }

  isExpanded() {
    return this._expanded;
  }

  // === Tab ===

  switchTab(tabId) {
    if (this._currentTab === tabId) return;
    this._currentTab = tabId;
    
    Object.keys(this._tabs).forEach(id => {
      if (id === tabId) {
        this._tabs[id].classList.add('active');
        this._panes[id].classList.add('active');
      } else {
        this._tabs[id].classList.remove('active');
        this._panes[id].classList.remove('active');
      }
    });
  }

  _createTabBtn(label, id, isActive) {
    const btn = document.createElement('button');
    btn.className = `notebook-tab ${isActive ? 'active' : ''}`;
    btn.textContent = label;
    btn.addEventListener('click', () => this.switchTab(id));
    return btn;
  }

  // === Chat Pane ===

  _createChatPane() {
    const pane = document.createElement('div');
    pane.className = 'notebook-pane active';

    this._historyEl = document.createElement('div');
    this._historyEl.className = 'notebook-chat-history';

    this._emptyGuideEl = document.createElement('div');
    this._emptyGuideEl.className = 'notebook-empty-guide';
    this._emptyGuideEl.innerHTML = '（笔记本扉页）<br>这是你的修复笔记本。随时翻阅查找参考信息，或记录你的发现。<br>周老师的批注散落在各页之间。';
    this._historyEl.appendChild(this._emptyGuideEl);

    this._quickThoughtsEl = document.createElement('div');
    this._quickThoughtsEl.className = 'notebook-quick-thoughts';

    this._confirmAreaEl = document.createElement('div');
    this._confirmAreaEl.className = 'notebook-confirm-area hidden';

    const inputArea = document.createElement('div');
    inputArea.className = 'notebook-input-area';
    
    this._inputEl = document.createElement('textarea');
    this._inputEl.className = 'notebook-input';
    this._inputEl.placeholder = '翻阅笔记本……';
    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._submitInput();
      }
    });

    this._sendBtn = document.createElement('button');
    this._sendBtn.className = 'notebook-send-btn';
    this._sendBtn.innerHTML = '➤';
    this._sendBtn.addEventListener('click', () => this._submitInput());

    inputArea.appendChild(this._inputEl);
    inputArea.appendChild(this._sendBtn);

    pane.appendChild(this._historyEl);
    pane.appendChild(this._confirmAreaEl);
    pane.appendChild(this._quickThoughtsEl);
    pane.appendChild(inputArea);

    return pane;
  }

  showNPCMessage(text) {
    this._appendMessage(text, 'npc');
  }

  showPlayerMessage(text) {
    this._appendMessage(text, 'player');
  }

  showSystemMessage(text) {
    this._appendMessage(text, 'system');
  }

  clearChat() {
    if (!this._historyEl) return;
    this._historyEl.innerHTML = '';
  }

  _appendMessage(text, type) {
    if (this._emptyGuideEl && this._emptyGuideEl.parentNode) {
      this._emptyGuideEl.remove();
    }
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    bubble.textContent = text;
    this._historyEl.appendChild(bubble);
    this._scrollToBottom();
  }

  _scrollToBottom() {
    if (this._historyEl) {
      this._historyEl.scrollTop = this._historyEl.scrollHeight;
    }
  }

  setLoading(bool) {
    if (bool) {
      this._inputEl.disabled = true;
      this._sendBtn.disabled = true;
      this._sendBtn.textContent = '…';
      this._container?.classList.add('is-loading');
    } else {
      this._inputEl.disabled = false;
      this._sendBtn.disabled = false;
      this._sendBtn.innerHTML = '➤';
      this._container?.classList.remove('is-loading');
      this._inputEl.focus();
    }
  }

  clearHistory() {
    if (this._historyEl) {
      this._historyEl.innerHTML = '';
      this._historyEl.appendChild(this._emptyGuideEl);
    }
    this.hideConfirmButton();
  }

  showQuickThoughts(thoughts) {
    if (!this._quickThoughtsEl) return;
    this._quickThoughtsEl.innerHTML = '';
    thoughts.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'quick-thought-btn';
      btn.textContent = t;
      btn.addEventListener('click', () => {
        btn.disabled = true;
        if (this._onQuickThoughtCb) this._onQuickThoughtCb(t);
      });
      this._quickThoughtsEl.appendChild(btn);
    });
  }

  hideQuickThoughts() {
    if (this._quickThoughtsEl) this._quickThoughtsEl.innerHTML = '';
  }

  setPlaceholder(text) {
    if (this._inputEl) this._inputEl.placeholder = text;
  }

  onSubmit(callback) {
    this._onSubmitCb = callback;
  }

  onQuickThought(callback) {
    this._onQuickThoughtCb = callback;
  }

  _submitInput() {
    const text = this._inputEl.value.trim();
    if (!text) return;
    this._inputEl.value = '';
    if (this._onSubmitCb) this._onSubmitCb(text);
  }

  // === Records Pane ===

  _createRecordsPane() {
    const pane = document.createElement('div');
    pane.className = 'notebook-pane';
    this._recordsListEl = document.createElement('div');
    this._recordsListEl.className = 'notebook-records-list';
    pane.appendChild(this._recordsListEl);
    return pane;
  }

  addClueRecord(clueText) {
    const card = document.createElement('div');
    card.className = 'clue-card';
    card.textContent = clueText;
    this._recordsListEl.appendChild(card);
  }

  addAnnotation(text) {
    const card = document.createElement('div');
    card.className = 'clue-card annotation';
    card.style.borderColor = '#8c8375';
    card.innerHTML = `<em>沈念批注：</em><br>${text}`;
    this._recordsListEl.appendChild(card);
  }

  // === Tools ===

  showToolSection(tools) {
    if (!this._toolSectionEl) return;
    this._toolGridEl.innerHTML = '';
    this._toolsLocked = false;
    tools.forEach(tool => {
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.dataset.id = tool.id;
      btn.innerHTML = `<span class="tool-icon">${tool.icon}</span><span class="tool-label">${tool.label}</span>`;
      btn.addEventListener('click', () => {
        if (this._toolsLocked) return;
        // 切换：当前激活的取消，点击新的激活
        const isActive = btn.classList.contains('active');
        Array.from(this._toolGridEl.children).forEach(c => c.classList.remove('active'));
        if (!isActive) btn.classList.add('active');
        if (this._onToolClickCb) this._onToolClickCb(isActive ? null : tool.id);
      });
      this._toolGridEl.appendChild(btn);
    });
    this._toolSectionEl.classList.remove('hidden');
  }

  hideToolSection() {
    if (this._toolSectionEl) this._toolSectionEl.classList.add('hidden');
  }

  markToolUsed(toolId) {
    if (!this._toolGridEl) return;
    const btn = this._toolGridEl.querySelector(`[data-id="${toolId}"]`);
    if (btn) btn.classList.add('used');
  }

  onToolClick(callback) {
    this._onToolClickCb = callback;
  }

  // === 研讨确认接口 ===
  showConfirmButton(cb) {
    if (!this._confirmAreaEl) return;
    this._confirmAreaEl.innerHTML = '';
    this._confirmAreaEl.classList.remove('hidden');

    const btn = document.createElement('button');
    btn.className = 'notebook-confirm-btn';
    btn.innerHTML = '<span class="notebook-confirm-icon">✓</span><span>确认这个推断</span>';
    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.classList.add('confirmed');
      cb?.();
    });

    this._confirmAreaEl.appendChild(btn);
    this._scrollToBottom();
  }

  hideConfirmButton() {
    if (!this._confirmAreaEl) return;
    this._confirmAreaEl.classList.add('hidden');
    this._confirmAreaEl.innerHTML = '';
  }

  showPassEffect(title) {
    this.hideConfirmButton();
    this.showSystemMessage(`研讨通过：「${title}」已写入修复记录。`);
  }

  setOfflineMode(bool) { /* 占位，如需 */ }

  // === 事件处理器 ===
  _onClueCollected(e) {
    if (e.detail && e.detail.text) {
      this.addClueRecord(e.detail.text);
    }
  }

  _onItemCollected(e) {
    if (e.detail && e.detail.name) {
      this.addAnnotation(`获得了物件 [${e.detail.name}]`);
    }
  }

  _onToolUsed(e) {
    if (e.detail && e.detail.toolId) {
      this.markToolUsed(e.detail.toolId);
    }
  }

  _onAllToolsUsed() {
    // 三项检查完成：锁定工具区，放大镜保持激活，其余灰掉
    this._toolsLocked = true;
    if (this._toolGridEl) {
      Array.from(this._toolGridEl.children).forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.id === 'magnifier') {
          btn.classList.add('active');
        } else {
          btn.classList.add('locked');
        }
      });
    }
  }
}
