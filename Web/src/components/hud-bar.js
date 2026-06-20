export class HudBar {
  constructor(engine) {
    this.engine = engine;
    this._container = null;
    this._notebookBtn = null;
    this._inventoryBtn = null;

    this._onNotebookCb = null;
    this._onInventoryCb = null;

    this._boundOnClueCollected = this._onClueCollected.bind(this);
  }

  mount(root) {
    this._container = document.createElement('div');
    this._container.className = 'hud-container';

    // 笔记本按钮
    this._notebookBtn = document.createElement('button');
    this._notebookBtn.className = 'hud-btn';
    this._notebookBtn.dataset.id = 'notebook';
    this._notebookBtn.dataset.tooltip = '修复笔记本';
    this._notebookBtn.innerHTML = '<span class="hud-btn-label">修复笔记本</span>';
    this._notebookBtn.addEventListener('click', () => {
      if (this._notebookBtn.classList.contains('disabled')) return;
      this._notebookBtn.classList.remove('highlight');
      if (this._onNotebookCb) this._onNotebookCb();
    });

    // 物件匣按钮
    this._inventoryBtn = document.createElement('button');
    this._inventoryBtn.className = 'hud-btn';
    this._inventoryBtn.dataset.id = 'inventory';
    this._inventoryBtn.dataset.tooltip = '物件匣';
    this._inventoryBtn.innerHTML = '<span class="hud-btn-label">物件匣</span>';
    this._inventoryBtn.addEventListener('click', () => {
      if (this._onInventoryCb) this._onInventoryCb();
    });

    this._container.appendChild(this._notebookBtn);
    this._container.appendChild(this._inventoryBtn);
    root.appendChild(this._container);

    // 全局返回菜单按钮
    this._backBtn = document.createElement('button');
    this._backBtn.className = 'hud-back-btn';
    this._backBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="margin-right: 4px;">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>返回</span>
    `;
    this._backBtn.addEventListener('click', () => {
      // 避免重复创建
      if (document.querySelector('.hud-confirm-overlay')) return;

      const overlay = document.createElement('div');
      overlay.className = 'hud-confirm-overlay';
      overlay.innerHTML = `
        <div class="hud-confirm-card">
          <div class="hud-confirm-title">返回主菜单</div>
          <div class="hud-confirm-desc">确定要返回主菜单吗？<br>当前章节的进度将会自动保存。</div>
          <div class="hud-confirm-actions">
            <button class="hud-confirm-btn hud-confirm-cancel">取消</button>
            <button class="hud-confirm-btn hud-confirm-ok">确定返回</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // 动画进入
      requestAnimationFrame(() => overlay.classList.add('visible'));

      const close = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
      };

      overlay.querySelector('.hud-confirm-cancel').addEventListener('click', close);
      overlay.querySelector('.hud-confirm-ok').addEventListener('click', () => {
        close();
        // 尝试自动保存
        if (this.engine.saveSystem && this.engine.saveSystem.save) {
          this.engine.saveSystem.save(this.engine.currentChapter, this.engine.currentWorld, this.engine.currentScene);
        }
        this.engine.switchScene('menu');
      });
    });
    root.appendChild(this._backBtn);

    window.addEventListener('clue-collected', this._boundOnClueCollected);
  }

  unmount() {
    window.removeEventListener('clue-collected', this._boundOnClueCollected);
    if (this._container) this._container.remove();
    this._container = null;
    if (this._backBtn) this._backBtn.remove();
    this._backBtn = null;
  }

  show() {
    if (this._container) this._container.classList.add('visible');
    if (this._backBtn) this._backBtn.classList.add('visible');
  }

  hide() {
    if (this._container) this._container.classList.remove('visible');
    // 强制返回键常驻显示，不移除其 visible 类
  }

  setNotebookDisabled(disabled) {
    if (!this._notebookBtn) return;
    if (disabled) {
      this._notebookBtn.classList.add('disabled');
      this._notebookBtn.classList.remove('highlight');
    } else {
      this._notebookBtn.classList.remove('disabled');
    }
  }

  highlightButton(id) {
    if (id === 'notebook' && this._notebookBtn && !this._notebookBtn.classList.contains('disabled')) {
      this._notebookBtn.classList.add('highlight');
    }
  }

  onNotebookClick(callback) {
    this._onNotebookCb = callback;
  }

  onInventoryClick(callback) {
    this._onInventoryCb = callback;
  }

  _onClueCollected() {
    this.highlightButton('notebook');
  }
}
