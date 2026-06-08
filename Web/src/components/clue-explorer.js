/**
 * 《卅一景》线索探索组件
 *
 * 负责序章的自由探索阶段（缩放、拖拽、点击寻线、渐进提示）。
 */

export default class ClueExplorer {
  /**
   * @param {object} options
   * @param {string} options.imageUrl - 高清图片URL
   * @param {Function} options.onClueHit - 点击命中线索时的回调 (clueId) => {}
   * @param {Function} options.onConvergence - 找到所有线索并点击交会点时的回调 () => {}
   */
  constructor(options) {
    this.options = options;
    this.container = null;
    this.imgEl = null;
    this.hintsLayer = null;
    this.markersLayer = null;
    
    // 状态
    this.scale = 1.0;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.wrongClickCount = 0;
    
    // 线索定义
    this.clues = {
      clue_margin: { x: 85, y: 12, r: 8, found: false },
      clue_text: { x: 14, y: 80, r: 8, found: false },
      clue_line: { x: 50, y: 75, r: 10, found: false }
    };
    
    this.allFound = false;
    this.convergenceActive = false;
  }

  mount(parent) {
    this.container = document.createElement('div');
    this.container.className = 'clue-explorer-container';
    
    this.imgWrapper = document.createElement('div');
    this.imgWrapper.className = 'clue-explorer-wrapper';

    this.imgEl = document.createElement('img');
    this.imgEl.src = this.options.imageUrl;
    this.imgEl.className = 'clue-explorer-img';
    this.imgEl.draggable = false;

    this.hintsLayer = document.createElement('div');
    this.hintsLayer.className = 'clue-explorer-layer hints-layer';
    
    this.markersLayer = document.createElement('div');
    this.markersLayer.className = 'clue-explorer-layer markers-layer';

    this.imgWrapper.appendChild(this.imgEl);
    this.imgWrapper.appendChild(this.hintsLayer);
    this.imgWrapper.appendChild(this.markersLayer);
    this.container.appendChild(this.imgWrapper);
    
    // 状态栏
    this.statusBar = document.createElement('div');
    this.statusBar.className = 'clue-explorer-status';
    this.container.appendChild(this.statusBar);

    this.hintNarration = document.createElement('div');
    this.hintNarration.className = 'clue-explorer-narration';
    this.container.appendChild(this.hintNarration);

    this._updateStatus();
    this._bindEvents();
    
    parent.appendChild(this.container);
  }

  _bindEvents() {
    this.container.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
    this.container.addEventListener('mousedown', this._onMouseDown.bind(this));
    window.addEventListener('mousemove', this._onMouseMove.bind(this));
    window.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.container.addEventListener('dblclick', this._onDoubleClick.bind(this));
  }

  _onWheel(e) {
    if (this.allFound) return;
    e.preventDefault();
    const zoomStep = 0.25;
    const oldScale = this.scale;
    
    if (e.deltaY < 0) {
      this.scale = Math.min(this.scale + zoomStep, 3.5);
    } else {
      this.scale = Math.max(this.scale - zoomStep, 1.0);
    }
    
    if (this.scale !== oldScale) {
      this._applyTransform();
    }
  }

  _onMouseDown(e) {
    if (this.allFound) return;
    if (e.button !== 0) return;
    this.isDragging = true;
    this.startX = e.clientX - this.translateX;
    this.startY = e.clientY - this.translateY;
    this.container.classList.add('dragging');
  }

  _onMouseMove(e) {
    if (!this.isDragging) return;
    if (this.scale <= 1.0) return;
    
    this.translateX = e.clientX - this.startX;
    this.translateY = e.clientY - this.startY;
    
    this._constrainPan();
    this._applyTransform();
  }

  _onMouseUp(e) {
    if (this.allFound) return;
    if (e.button !== 0) return;
    if (this.isDragging) {
      this.isDragging = false;
      this.container.classList.remove('dragging');
      
      // 判断是否是点击而非拖拽
      const dx = e.clientX - this.startX - this.translateX;
      const dy = e.clientY - this.startY - this.translateY;
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        this._onClick(e);
      }
    }
  }

  _onDoubleClick(e) {
    if (this.allFound) return;
    if (this.scale === 1.0) {
      this.scale = 2.0;
    } else {
      this.scale = 1.0;
      this.translateX = 0;
      this.translateY = 0;
    }
    this.imgWrapper.style.transition = 'transform 0.3s ease-out';
    this._applyTransform();
    setTimeout(() => {
      this.imgWrapper.style.transition = '';
    }, 300);
  }

  _onClick(e) {
    const rect = this.imgEl.getBoundingClientRect();
    // 计算相对于图片原始尺寸的百分比
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    
    let hitClue = null;
    for (const [id, clue] of Object.entries(this.clues)) {
      if (clue.found) continue;
      const dist = Math.sqrt(Math.pow(px - clue.x, 2) + Math.pow(py - clue.y, 2));
      if (dist <= clue.r) {
        hitClue = id;
        break;
      }
    }

    if (hitClue) {
      this._showRipple(px, py, 'gold');
      this.clues[hitClue].found = true;
      this._updateStatus();
      this.options.onClueHit(hitClue);
    } else {
      this._showRipple(px, py, 'grey');
      this.wrongClickCount++;
      this._checkHints();
    }
  }

  markClueRecorded(clueId) {
    const clue = this.clues[clueId];
    if (clue) {
      this._addMarker(clue.x, clue.y, clueId);
      this._checkConvergence();
    }
  }

  _showRipple(px, py, type) {
    const ripple = document.createElement('div');
    ripple.className = `clue-ripple ripple-${type}`;
    ripple.style.left = `${px}%`;
    ripple.style.top = `${py}%`;
    this.markersLayer.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);
  }

  _addMarker(px, py, clueId) {
    const marker = document.createElement('div');
    marker.className = 'clue-marker';
    marker.style.left = `${px}%`;
    marker.style.top = `${py}%`;
    marker.dataset.id = clueId;
    this.markersLayer.appendChild(marker);
  }

  _checkHints() {
    if (this.wrongClickCount === 3) {
      this._showNarration('周鹤年："不要先看画面本身。先看它的身体——边缘、接缝、装裱层。"');
    } else if (this.wrongClickCount === 6) {
      this._showNarration('周鹤年："表层画面很完整，真正不完整的是说明来源的那些部分。试试画面的角落和边缘。"');
    } else if (this.wrongClickCount === 9) {
      this._showVisualHints();
    }
  }

  _showNarration(text) {
    this.hintNarration.textContent = text;
    this.hintNarration.classList.add('visible');
    setTimeout(() => {
      this.hintNarration.classList.remove('visible');
    }, 5000);
  }

  _showVisualHints() {
    this.hintsLayer.innerHTML = '';
    for (const clue of Object.values(this.clues)) {
      if (!clue.found) {
        const hint = document.createElement('div');
        hint.className = 'clue-visual-hint';
        hint.style.left = `${clue.x}%`;
        hint.style.top = `${clue.y}%`;
        this.hintsLayer.appendChild(hint);
      }
    }
  }

  _updateStatus() {
    const foundCount = Object.values(this.clues).filter(c => c.found).length;
    let circles = '';
    for (let i = 0; i < 3; i++) {
      circles += i < foundCount ? '●' : '○';
    }
    this.statusBar.innerHTML = `🔍 线索: <span class="circles">${circles}</span> (${foundCount}/3) <span class="tips">滚轮缩放 · 拖拽移动</span>`;
  }

  _checkConvergence() {
    const foundCount = Object.values(this.clues).filter(c => c.found).length;
    if (foundCount === 3 && !this.allFound) {
      this.allFound = true;
      this.hintsLayer.innerHTML = '';
      
      // 还原缩放
      this.scale = 1.0;
      this.translateX = 0;
      this.translateY = 0;
      this.imgWrapper.style.transition = 'transform 0.8s ease-in-out';
      this._applyTransform();

      // 触发汇聚
      setTimeout(() => {
        this._showConvergence();
      }, 1000);
    }
  }

  _showConvergence() {
    this.convergenceActive = true;
    
    // 创建汇聚点 (50, 75 稍微偏下一点, 比如 50, 60)
    const cx = 50, cy = 60;

    // 绘制连线
    Object.values(this.clues).forEach((clue, idx) => {
      setTimeout(() => {
        const line = document.createElement('div');
        line.className = 'clue-convergence-line';
        
        // 计算长度和角度
        const dx = cx - clue.x;
        const dy = cy - clue.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        line.style.left = `${clue.x}%`;
        line.style.top = `${clue.y}%`;
        line.style.width = `${length}%`;
        line.style.transform = `rotate(${angle}deg)`;
        this.markersLayer.appendChild(line);
      }, idx * 300);
    });

    // 创建汇聚点
    setTimeout(() => {
      const point = document.createElement('div');
      point.className = 'clue-convergence-point';
      point.style.left = `${cx}%`;
      point.style.top = `${cy}%`;
      point.innerHTML = `<div class="pulse"></div><div class="text">点击查看</div>`;
      
      point.addEventListener('click', () => {
        point.classList.add('explode');
        setTimeout(() => {
          if (this.options.onConvergence) {
            this.options.onConvergence();
          }
        }, 400);
      });
      
      this.markersLayer.appendChild(point);
    }, 1000);
  }

  _constrainPan() {
    // 限制拖拽不超出边界的简易计算
    const maxTx = (this.scale - 1) * window.innerWidth / 2;
    const maxTy = (this.scale - 1) * window.innerHeight / 2;
    this.translateX = Math.max(-maxTx, Math.min(maxTx, this.translateX));
    this.translateY = Math.max(-maxTy, Math.min(maxTy, this.translateY));
  }

  _applyTransform() {
    this.imgWrapper.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  destroy() {
    if (this.container) {
      this.container.remove();
    }
  }
}
