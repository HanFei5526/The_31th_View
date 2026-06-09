export class InventoryPopup {
  constructor(engine) {
    this.engine = engine;
    this._overlay = null;
    this._listEl = null;
  }

  mount(root) {
    this._overlay = document.createElement('div');
    this._overlay.className = 'inventory-overlay';

    const popup = document.createElement('div');
    popup.className = 'inventory-popup';

    const header = document.createElement('div');
    header.className = 'inventory-header';
    const title = document.createElement('h3');
    title.className = 'inventory-title';
    title.textContent = '物件匣';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'inventory-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(title);
    header.appendChild(closeBtn);

    this._listEl = document.createElement('div');
    this._listEl.className = 'inventory-list';

    popup.appendChild(header);
    popup.appendChild(this._listEl);
    this._overlay.appendChild(popup);

    // 点击背景关闭
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) {
        this.close();
      }
    });

    root.appendChild(this._overlay);
  }

  unmount() {
    if (this._overlay) this._overlay.remove();
    this._overlay = null;
  }

  open() {
    if (!this._overlay) return;
    this.refresh(this.engine.inventory.getItems());
    this._overlay.classList.add('visible');
  }

  close() {
    if (!this._overlay) return;
    this._overlay.classList.remove('visible');
  }

  refresh(items) {
    if (!this._listEl) return;
    this._listEl.innerHTML = '';

    if (!items || items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'inventory-empty';
      empty.textContent = '空空如也';
      this._listEl.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'inventory-item';
      
      const icon = document.createElement('div');
      icon.className = 'inventory-item-icon';
      icon.textContent = item.icon || '📦';
      
      const info = document.createElement('div');
      info.className = 'inventory-item-info';
      
      const name = document.createElement('h4');
      name.className = 'inventory-item-name';
      name.textContent = item.name;
      
      const desc = document.createElement('p');
      desc.className = 'inventory-item-desc';
      desc.textContent = item.description;

      info.appendChild(name);
      info.appendChild(desc);
      el.appendChild(icon);
      el.appendChild(info);
      this._listEl.appendChild(el);
    });
  }
}
