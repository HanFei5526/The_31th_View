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
    this._notebookBtn.innerHTML = '📓';
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
    this._inventoryBtn.innerHTML = '📦';
    this._inventoryBtn.addEventListener('click', () => {
      if (this._onInventoryCb) this._onInventoryCb();
    });

    this._container.appendChild(this._notebookBtn);
    this._container.appendChild(this._inventoryBtn);
    root.appendChild(this._container);

    window.addEventListener('clue-collected', this._boundOnClueCollected);
  }

  unmount() {
    window.removeEventListener('clue-collected', this._boundOnClueCollected);
    if (this._container) this._container.remove();
    this._container = null;
  }

  show() {
    if (this._container) this._container.classList.add('visible');
  }

  hide() {
    if (this._container) this._container.classList.remove('visible');
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
