/**
 * 《卅一景》对话系统
 *
 * 支持:
 * - 打字机效果逐字显示（40ms 间隔）
 * - 点击跳过当前行 / 推进到下一行
 * - 角色对话 & 旁白两种样式
 * - 分支选项（choices）
 *
 * 对话序列格式:
 *   [
 *     { speaker: null, text: '旁白文字' },
 *     { speaker: '周鹤年', text: '角色台词' },
 *     { speaker: 'narrator', text: '叙述者旁白' },
 *     { speaker: '周鹤年', text: '你怎么看？', choices: [
 *       { text: '选项A', value: 'a' },
 *       { text: '选项B', value: 'b', hesitation: '（犹豫的提示文字）' },
 *     ]},
 *   ]
 */

export class DialogueSystem {
  constructor(engine) {
    /** @type {import('./game-engine.js').GameEngine} */
    this.engine = engine;

    /** 对话遮罩层 DOM */
    this._overlayEl = null;
    /** 对话框 DOM */
    this._boxEl = null;
    /** 说话人名 DOM */
    this._speakerEl = null;
    /** 对话文本 DOM */
    this._contentEl = null;
    /** 点击继续提示 DOM */
    this._indicatorEl = null;

    /**
     * 当前行是否处于「等待点击推进」状态
     * （文字已显示完毕，尚未点击进入下一行）
     */
    this._waitingForClick = false;

    /** 点击推进的 resolve 函数 */
    this._advanceResolve = null;
  }

  /**
   * 播放一整段对话序列
   * @param {Array<{speaker?: string|null, text: string, choices?: Array}>} sequence
   * @returns {Promise<*>} 最后一个含 choices 的条目的选择值，或 undefined
   */
  async playSequence(sequence) {
    this._ensureDOM();
    this._show();

    let lastChoiceValue;

    for (const entry of sequence) {
      if (entry.choices && entry.choices.length > 0) {
        // 先显示带选项的对话文本
        await this._showLine(entry.speaker, entry.text);
        // 再显示选项按钮
        lastChoiceValue = await this._showChoices(entry.choices);
      } else {
        await this._showLine(entry.speaker, entry.text);
      }
    }

    this._hide();
    return lastChoiceValue;
  }

  /* ---- 内部方法 ---- */

  /**
   * 显示一行对话（打字机效果），返回 Promise，点击后 resolve
   * @private
   */
  _showLine(speaker, text) {
    return new Promise((resolve) => {
      // 设置说话人
      if (speaker && speaker !== 'narrator') {
        this._speakerEl.textContent = speaker;
        this._speakerEl.style.display = 'block';
        this._boxEl.classList.remove('dialogue-narration');
      } else {
        this._speakerEl.style.display = 'none';
        this._boxEl.classList.add('dialogue-narration');
      }

      // 整段直接显示 + CSS 淡入
      this._waitingForClick = false;
      this._indicatorEl.style.display = 'none';
      this._contentEl.textContent = text;
      this._contentEl.classList.remove('dialogue-text-visible');
      // 强制 reflow 触发动画
      void this._contentEl.offsetWidth;
      this._contentEl.classList.add('dialogue-text-visible');

      // 动画结束后等待点击
      const onAnimEnd = () => {
        this._contentEl.removeEventListener('animationend', onAnimEnd);
        this._waitingForClick = true;
        this._indicatorEl.style.display = 'block';
      };
      this._contentEl.addEventListener('animationend', onAnimEnd);

      // 点击处理
      const clickHandler = () => {
        if (!this._waitingForClick) return; // 淡入未完成时点击无效
        this._boxEl.removeEventListener('click', clickHandler);
        resolve();
      };

      this._boxEl.addEventListener('click', clickHandler);
    });
  }

  /**
   * 显示选项按钮，返回 Promise，选择后 resolve 对应 value
   * @private
   */
  _showChoices(choices) {
    return new Promise((resolve) => {
      // 隐藏继续提示
      this._indicatorEl.style.display = 'none';

      // 创建选项容器
      const container = document.createElement('div');
      container.className = 'choices-container';

      choices.forEach((choice) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `
          <span class="choice-text">${choice.text}</span>
          ${choice.hesitation ? `<span class="choice-hesitation">${choice.hesitation}</span>` : ''}
        `;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          container.remove();
          this.engine.emit('choice-made', { text: choice.text, value: choice.value });
          resolve(choice.value);
        });
        container.appendChild(btn);
      });

      // 将选项追加到对话框下方
      this._overlayEl.appendChild(container);
    });
  }

  /**
   * 显示对话遮罩
   * @private
   */
  _show() {
    this._overlayEl.style.display = 'block';
    this._boxEl.style.display = 'block';
  }

  /**
   * 隐藏对话遮罩
   * @private
   */
  _hide() {
    this._clearTypewriter();
    this._overlayEl.style.display = 'none';
    this._boxEl.style.display = 'none';
  }

  /**
   * 惰性创建对话系统 DOM 结构
   * @private
   */
  _ensureDOM() {
    if (this._overlayEl) return;

    // 注入淡入动画 CSS（仅一次）
    if (!document.getElementById('dialogue-system-styles')) {
      const style = document.createElement('style');
      style.id = 'dialogue-system-styles';
      style.textContent = `
        @keyframes dialogueTextFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dialogue-text-visible {
          animation: dialogueTextFadeIn 0.35s ease forwards;
        }
      `;
      document.head.appendChild(style);
    }

    // 对话遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'dialogue-overlay';

    // 对话框
    const box = document.createElement('div');
    box.className = 'dialogue-box';

    // 说话人名
    const speaker = document.createElement('div');
    speaker.className = 'dialogue-speaker';

    // 对话内容（固定高度容器，防止高度抖动）
    const contentWrap = document.createElement('div');
    contentWrap.className = 'dialogue-content-wrap';

    const content = document.createElement('div');
    content.className = 'dialogue-content';
    contentWrap.appendChild(content);

    // 点击继续提示
    const indicator = document.createElement('div');
    indicator.className = 'dialogue-indicator';
    indicator.textContent = '▼';

    box.appendChild(speaker);
    box.appendChild(contentWrap);
    box.appendChild(indicator);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    this._overlayEl = overlay;
    this._boxEl = box;
    this._speakerEl = speaker;
    this._contentEl = content;
    this._indicatorEl = indicator;
  }
}
