/**
 * 《卅一景》序章对话坞（Prologue Dock）
 *
 * 左下角常驻的横向对话框，贯穿序章始终。
 * 半透明、不铺满全屏 —— 画面其余区域可正常点击（查看古画、找线索）。
 *
 * 两种工作模式：
 *   1. 脚本模式 playLine()  —— 逐句播放预写旁白 / 周鹤年台词 + "继续"
 *   2. 研讨模式            —— 实现 discussionManager 的 uiCallback 接口
 *                            （自由输入 + 快捷想法 + 确认推断 + 通过动效）
 */

const TYPE_SPEED = 42;

export class PrologueDock {
  constructor(engine) {
    this.engine = engine;
    this._root = null;
    this._el = null;
    this._logEl = null;
    this._speakerEl = null;
    this._footerEl = null;

    this._typeTimer = null;
    this._isTyping = false;

    this._onText = null;
    this._onQuick = null;
    this._confirmCb = null;
    this._loadingEl = null;
  }

  /* ==================== 挂载 / 卸载 ==================== */

  mount(root) {
    this._root = root;
    const el = document.createElement('div');
    el.className = 'prologue-dock';
    el.innerHTML = `
      <div class="pdock-header">
        <span class="pdock-speaker" id="pdock-speaker">📓 周鹤年</span>
        <span class="pdock-offline hidden" id="pdock-offline">离线模式</span>
      </div>
      <div class="pdock-log" id="pdock-log"></div>
      <div class="pdock-footer" id="pdock-footer"></div>
      <div class="pdock-pass hidden" id="pdock-pass">
        <div class="pdock-pass-stamp">✓</div>
        <div class="pdock-pass-title" id="pdock-pass-title"></div>
      </div>
    `;
    root.appendChild(el);
    this._el = el;
    this._logEl = el.querySelector('#pdock-log');
    this._speakerEl = el.querySelector('#pdock-speaker');
    this._footerEl = el.querySelector('#pdock-footer');
    this._offlineEl = el.querySelector('#pdock-offline');
    this._passEl = el.querySelector('#pdock-pass');

    // 初始化底部包含输入框（默认禁用态）
    this._renderInputFooter(true);

    requestAnimationFrame(() => el.classList.add('visible'));
    return el;
  }

  /* ==================== 脚本模式 ==================== */

  /**
   * 播放一句预写台词。打字完成后自动延时推进（无需点击）。
   * 播放途中点击对话框可立即跳过打字机。
   * @param {string|null} speaker 说话人（null = 旁白）
   * @param {string} text 台词内容
   * @returns {Promise<void>}
   */
  playLine(speaker, text) {
    return new Promise((resolve) => {
      this._setSpeaker(speaker);
      const isNarration = !speaker;
      const row = this._appendRow(isNarration ? 'narration' : 'npc', '');
      const body = row.querySelector('.pdock-bubble');

      // 清除多余选项，禁用输入框，但保留底部输入栏
      this.hideConfirmButton();
      const quick = this._el.querySelector('.pdock-quick');
      if (quick) quick.remove();
      this._setInputState(true);

      let advanceTimer = null;
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(advanceTimer);
        resolve();
      };

      // 打字完成后，按文本长度计算停留时间，自动推进
      const scheduleAdvance = () => {
        const dwell = Math.max(1400, text.length * 90);
        advanceTimer = setTimeout(finish, dwell);
      };

      this._typeInto(body, text, scheduleAdvance);

      // 点击：未打完则立即补全，已打完则立刻推进
      const onClick = () => {
        if (this._isTyping) {
          this._completeType(body, text);
          scheduleAdvance();
        } else {
          finish();
        }
      };
      row.addEventListener('click', onClick);
    });
  }

  /* ==================== 研讨模式（uiCallback 接口） ==================== */

  /** 绑定输入回调（由 prologue.js 在进入研讨前调用） */
  bindDiscussion(onText, onQuick) {
    this._onText = onText;
    this._onQuick = onQuick;
  }

  showOpening(title, opening) {
    this._setSpeaker('周鹤年');
    this._appendRow('npc', opening);
    this._setInputState(false);
  }

  showQuickThoughts(thoughts = []) {
    let bar = this._el.querySelector('.pdock-quick');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'pdock-quick';
      this._footerEl.before(bar);
    }
    bar.innerHTML = '';
    for (const t of thoughts) {
      const btn = document.createElement('button');
      btn.className = 'pdock-quick-btn';
      btn.textContent = t;
      btn.addEventListener('click', () => {
        btn.classList.add('used');
        if (this._onQuick) this._onQuick(t);
      });
      bar.appendChild(btn);
    }
  }

  showPlayerMessage(text) {
    this._appendRow('player', text);
  }

  showNPCMessage(text) {
    const row = this._appendRow('npc', '');
    this._typeInto(row.querySelector('.pdock-bubble'), text);
  }

  setLoading(on) {
    if (on) {
      this._loadingEl = this._appendRow('npc', '');
      this._loadingEl.querySelector('.pdock-bubble').innerHTML =
        '<span class="pdock-dots"><span>.</span><span>.</span><span>.</span></span>';
    } else if (this._loadingEl) {
      this._loadingEl.remove();
      this._loadingEl = null;
    }
  }

  showConfirmButton(cb) {
    this._confirmCb = cb;
    const btn = document.createElement('button');
    btn.className = 'pdock-confirm';
    btn.innerHTML = '<span>✓</span> 确认这就是我的推断';
    btn.addEventListener('click', () => {
      btn.disabled = true;
      if (this._confirmCb) this._confirmCb();
    });
    this._footerEl.prepend(btn);
  }

  hideConfirmButton() {
    const btn = this._el?.querySelector('.pdock-confirm');
    if (btn) btn.remove();
  }

  setOfflineMode(on) {
    if (this._offlineEl) this._offlineEl.classList.toggle('hidden', !on);
  }

  showPassEffect(title) {
    const t = this._el.querySelector('#pdock-pass-title');
    if (t) t.textContent = `${title} · 已确认`;
    this._passEl.classList.remove('hidden');
    requestAnimationFrame(() => this._passEl.classList.add('active'));
    setTimeout(() => {
      this._passEl.classList.remove('active');
      setTimeout(() => this._passEl.classList.add('hidden'), 400);
    }, 2000);
  }

  /* ==================== 内部辅助 ==================== */

  /** 渲染自由输入框到 footer */
  _renderInputFooter(disabled = false) {
    if (!this._footerEl.querySelector('.pdock-input-row')) {
      this._footerEl.innerHTML = `
        <div class="pdock-input-row">
          <input type="text" class="pdock-input" placeholder="等待周鹤年回复..." maxlength="120" autocomplete="off" ${disabled ? 'disabled' : ''} />
          <button class="pdock-send" ${disabled ? 'disabled' : ''}>发送</button>
        </div>
      `;
      const input = this._footerEl.querySelector('.pdock-input');
      const send = this._footerEl.querySelector('.pdock-send');
      const submit = () => {
        const v = input.value.trim();
        if (!v) return;
        input.value = '';
        if (this._onText) this._onText(v);
      };
      send.addEventListener('click', submit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
      });
    } else {
      this._setInputState(disabled);
    }
  }

  _setInputState(disabled) {
    const input = this._footerEl.querySelector('.pdock-input');
    const send = this._footerEl.querySelector('.pdock-send');
    if (input) {
      input.disabled = disabled;
      input.placeholder = disabled ? "等待周鹤年回复..." : "说说你的判断……";
    }
    if (send) send.disabled = disabled;
  }

  _setSpeaker(speaker) {
    if (this._speakerEl) {
      this._speakerEl.textContent = speaker ? (speaker === '周鹤年' ? '📓 周鹤年' : speaker) : '旁白';
    }
  }

  /** 追加一行消息，返回行元素 */
  _appendRow(kind, text) {
    const row = document.createElement('div');
    row.className = `pdock-row pdock-row-${kind}`;
    
    let innerHtml = '';
    if (kind === 'npc') {
      innerHtml = `<span class="pdock-msg-speaker">📓 周鹤年</span>`;
    }
    
    row.innerHTML = `<div class="pdock-bubble">${innerHtml}</div>`;
    if (text) {
      // Append text node to avoid overwriting innerHtml if there's any
      row.querySelector('.pdock-bubble').appendChild(document.createTextNode(text));
    }
    this._logEl.appendChild(row);
    this._logEl.scrollTop = this._logEl.scrollHeight;
    return row;
  }

  /* ==================== 打字机 ==================== */

  _typeInto(el, text, onDone) {
    this._clearType();
    this._isTyping = true;
    
    // Preserve speaker span
    const speakerSpan = el.querySelector('.pdock-msg-speaker');
    el.innerHTML = '';
    if (speakerSpan) el.appendChild(speakerSpan);
    
    const bubbleTextNode = document.createTextNode('');
    el.appendChild(bubbleTextNode);
    let i = 0;
    this._typeTimer = setInterval(() => {
      if (i < text.length) {
        bubbleTextNode.nodeValue += text[i++];
        this._logEl.scrollTop = this._logEl.scrollHeight;
      } else {
        this._clearType();
        this._isTyping = false;
        if (onDone) onDone();
      }
    }, TYPE_SPEED);
  }

  _completeType(el, text) {
    this._clearType();
    this._isTyping = false;
    // Keep speaker span if present
    const speakerSpan = el.querySelector('.pdock-msg-speaker');
    el.innerHTML = '';
    if (speakerSpan) el.appendChild(speakerSpan);
    el.appendChild(document.createTextNode(text));
  }

  _clearType() {
    if (this._typeTimer) {
      clearInterval(this._typeTimer);
      this._typeTimer = null;
    }
  }

  unmount() {
    this._clearType();
    if (this._el) {
      this._el.classList.remove('visible');
      const el = this._el;
      setTimeout(() => el.remove(), 400);
      this._el = null;
    }
  }

  /**
   * 设置交互态。
   * interactive=false：对话坞仍常驻可见，但半透明、可点穿（看古画/找线索时用）。
   * interactive=true：完全不透明、可输入（脚本播放 / 研讨时用）。
   * @param {boolean} interactive
   */
  setInteractive(interactive) {
    if (!this._el) return;
    this._el.style.pointerEvents = interactive ? 'auto' : 'none';
    this._el.classList.toggle('pdock-dimmed', !interactive);
  }
}
