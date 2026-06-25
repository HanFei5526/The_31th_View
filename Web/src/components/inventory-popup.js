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
      
      // 根据 item.id 使用不同的简约线条 SVG 图标
      if (item.id === 'notebook') {
        icon.innerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" stroke="#d4a853" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="18" y="10" width="28" height="44" rx="2" />
            <line x1="24" y1="10" x2="24" y2="54" />
            <circle cx="24" cy="18" r="1" fill="#d4a853" />
            <circle cx="24" cy="32" r="1" fill="#d4a853" />
            <circle cx="24" cy="46" r="1" fill="#d4a853" />
            <line x1="30" y1="20" x2="40" y2="20" opacity="0.6" stroke-width="1.2" />
            <line x1="30" y1="28" x2="40" y2="28" opacity="0.6" stroke-width="1.2" />
            <line x1="30" y1="36" x2="36" y2="36" opacity="0.6" stroke-width="1.2" />
          </svg>
        `;
      } else if (item.id === 'hairpin') {
        icon.innerHTML = `
          <span class="css-hairpin css-hairpin--inventory" aria-hidden="true">
            <span class="css-hairpin__shaft"></span>
            <span class="css-hairpin__coil css-hairpin__coil--main"></span>
            <span class="css-hairpin__coil css-hairpin__coil--upper"></span>
            <span class="css-hairpin__coil css-hairpin__coil--lower"></span>
          </span>
        `;
      } else if (item.id === 'inkstone') {
        icon.innerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" stroke="#d4a853" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="32" cy="32" rx="20" ry="14" />
            <ellipse cx="26" cy="30" rx="7" ry="5" stroke-width="1.4" />
            <path d="M36 28 L42 26" stroke-width="1.2" opacity="0.5" />
            <path d="M36 32 L40 31" stroke-width="1" opacity="0.4" />
          </svg>
        `;
      } else if (item.id === 'rubbing') {
        icon.innerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" stroke="#d4a853" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="14" y="12" width="36" height="40" rx="1" />
            <rect x="18" y="16" width="28" height="32" rx="1" stroke-width="1.2" opacity="0.5" />
            <path d="M22 24 Q26 20, 30 24 Q34 28, 38 24" stroke-width="1.3" opacity="0.6" />
            <path d="M24 32 Q28 36, 34 32 Q38 28, 42 33" stroke-width="1.3" opacity="0.6" />
            <path d="M26 40 Q30 38, 34 40" stroke-width="1" opacity="0.4" />
          </svg>
        `;
      } else if (item.id === 'letter') {
        icon.innerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" stroke="#d4a853" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 10 L46 10 L46 54 L18 54 Z" />
            <path d="M18 10 Q22 14, 18 18" stroke-width="1.2" opacity="0.4" />
            <line x1="26" y1="20" x2="26" y2="46" stroke-width="1.2" opacity="0.5" />
            <line x1="30" y1="18" x2="30" y2="44" stroke-width="1.2" opacity="0.5" />
            <line x1="34" y1="20" x2="34" y2="40" stroke-width="1.2" opacity="0.5" />
            <line x1="38" y1="22" x2="38" y2="36" stroke-width="1" opacity="0.4" />
          </svg>
        `;
      } else {
        icon.innerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" stroke="#d4a853" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="14" y="18" width="36" height="28" rx="2" />
            <line x1="32" y1="18" x2="32" y2="46" />
            <line x1="14" y1="32" x2="50" y2="32" />
            <circle cx="32" cy="32" r="3" fill="#1c1917" />
          </svg>
        `;
      }
      
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
