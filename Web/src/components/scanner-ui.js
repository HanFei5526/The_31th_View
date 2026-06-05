/**
 * 《卅一景》扫描比对界面
 *
 * 序章核心谜题 UI：分屏展示画面，三种工具逐步发现异常。
 *
 * Layout:
 *   ┌──────────────┬──────────────┐
 *   │  第三十一景   │  参考页面    │
 *   │  主画面      │              │
 *   │  +叠加效果层  │              │
 *   └──────────────┴──────────────┘
 *   │  🔍 放大镜  🔬 纸质分析  💡 侧光照射  │
 *   │  扫描仪状态信息栏                      │
 *
 * CSS classes used (defined in index.css):
 *   .scanner-container, .scanner-split, .scanner-pane, .scanner-pane-label,
 *   .scanner-pane-img, .scanner-overlay, .scanner-overlay-magnify,
 *   .scanner-overlay-fiber, .scanner-overlay-sidelight,
 *   .scanner-remnant-text, .scanner-aux-line, .scanner-intersection,
 *   .scanner-toolbar, .scanner-tool-btn, .scanner-status
 */

export default class ScannerUI {
  /**
   * @param {object} options
   * @param {string} options.mainImage — URL of the 31st scene painting
   * @param {string} [options.refImage] — URL of a reference page (optional, defaults to same image with CSS filter)
   * @param {Function} options.onToolUsed — callback(toolId, allUsed) called when a tool is activated
   * @param {Function} options.onIntersectionClick — callback() when the intersection hotspot is clicked
   * @param {Function} options.onFeedback — callback(feedbackText) to display feedback narration
   */
  constructor(options) {
    this._options = options;
    this._container = null;
    this._toolsUsed = { magnifier: false, fiber: false, sidelight: false };
    this._currentTool = null;
    this._overlays = {};
    this._intersectionEl = null;
  }

  /**
   * Build and mount the scanner UI into a parent container
   * @param {HTMLElement} parent
   */
  mount(parent) {
    this._container = document.createElement('div');
    this._container.className = 'scanner-container';
    this._container.id = 'scanner-ui';

    // Build the split panes
    const split = document.createElement('div');
    split.className = 'scanner-split';

    // Main pane (left)
    const mainPane = document.createElement('div');
    mainPane.className = 'scanner-pane';
    mainPane.id = 'scanner-main-pane';
    
    const mainLabel = document.createElement('div');
    mainLabel.className = 'scanner-pane-label';
    mainLabel.textContent = '第三十一景';
    mainPane.appendChild(mainLabel);

    const mainImg = document.createElement('img');
    mainImg.className = 'scanner-pane-img';
    mainImg.src = this._options.mainImage;
    mainImg.alt = '第三十一景扫描件';
    mainImg.draggable = false;
    mainPane.appendChild(mainImg);
    this._mainImg = mainImg;

    // Create overlay layers
    this._createOverlays(mainPane);

    split.appendChild(mainPane);

    // Reference pane (right)
    const refPane = document.createElement('div');
    refPane.className = 'scanner-pane';
    refPane.id = 'scanner-ref-pane';

    const refLabel = document.createElement('div');
    refLabel.className = 'scanner-pane-label';
    refLabel.textContent = '参考 · 第十五景';
    refPane.appendChild(refLabel);

    const refImg = document.createElement('img');
    refImg.className = 'scanner-pane-img';
    refImg.src = this._options.refImage || this._options.mainImage;
    refImg.alt = '参考页面';
    refImg.draggable = false;
    // Apply subtle sepia/desaturation to differentiate from main
    refImg.style.filter = 'sepia(0.15) brightness(1.05) contrast(0.95)';
    refPane.appendChild(refImg);

    split.appendChild(refPane);
    this._container.appendChild(split);

    // Build toolbar
    this._buildToolbar();

    // Build status bar
    this._buildStatusBar();

    parent.appendChild(this._container);
  }

  /**
   * Create overlay layers for tool effects
   * @private
   */
  _createOverlays(pane) {
    // Magnifier overlay
    const magnify = document.createElement('div');
    magnify.className = 'scanner-overlay scanner-overlay-magnify';
    magnify.id = 'scanner-overlay-magnify';
    const ring = document.createElement('div');
    ring.className = 'magnify-ring';
    magnify.appendChild(ring);
    const magnifyLabel = document.createElement('div');
    magnifyLabel.className = 'magnify-label';
    magnifyLabel.textContent = '装裱接缝 · 重叠痕迹';
    magnify.appendChild(magnifyLabel);
    pane.appendChild(magnify);
    this._overlays.magnifier = magnify;

    // Fiber overlay
    const fiber = document.createElement('div');
    fiber.className = 'scanner-overlay scanner-overlay-fiber';
    fiber.id = 'scanner-overlay-fiber';
    const badge = document.createElement('div');
    badge.className = 'fiber-badge';
    badge.innerHTML = '纸张纤维分析<br/>背纸年代: 不一致<br/>画心: 稳定';
    fiber.appendChild(badge);
    pane.appendChild(fiber);
    this._overlays.fiber = fiber;

    // Sidelight overlay
    const sidelight = document.createElement('div');
    sidelight.className = 'scanner-overlay scanner-overlay-sidelight';
    sidelight.id = 'scanner-overlay-sidelight';
    pane.appendChild(sidelight);
    this._overlays.sidelight = sidelight;

    // Remnant text (shown during sidelight)
    const remnant = document.createElement('div');
    remnant.className = 'scanner-remnant-text';
    remnant.id = 'scanner-remnant-text';
    remnant.textContent = '……所见';
    pane.appendChild(remnant);
    this._remnantText = remnant;

    // Auxiliary line (shown during sidelight)
    const auxLine = document.createElement('div');
    auxLine.className = 'scanner-aux-line';
    auxLine.id = 'scanner-aux-line';
    pane.appendChild(auxLine);
    this._auxLine = auxLine;

    // Intersection hotspot (hidden until all tools used)
    const intersection = document.createElement('button');
    intersection.className = 'scanner-intersection';
    intersection.id = 'scanner-intersection';
    intersection.setAttribute('aria-label', '残字与辅助线交会处');
    intersection.setAttribute('tabindex', '0');
    intersection.innerHTML = `
      <div class="scanner-intersection-glow"></div>
      <div class="scanner-intersection-inner"></div>
    `;
    intersection.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._options.onIntersectionClick) {
        this._options.onIntersectionClick();
      }
    });
    pane.appendChild(intersection);
    this._intersectionEl = intersection;
  }

  /**
   * Build the tool selection toolbar
   * @private
   */
  _buildToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'scanner-toolbar';
    toolbar.id = 'scanner-toolbar';

    const tools = [
      { id: 'magnifier', icon: '🔍', label: '放大镜' },
      { id: 'fiber',     icon: '🔬', label: '纸质分析' },
      { id: 'sidelight', icon: '💡', label: '侧光照射' },
    ];

    tools.forEach(tool => {
      const btn = document.createElement('button');
      btn.className = 'scanner-tool-btn';
      btn.id = `scanner-tool-${tool.id}`;
      btn.setAttribute('aria-label', tool.label);
      btn.innerHTML = `<span class="scanner-tool-icon">${tool.icon}</span><span>${tool.label}</span>`;
      btn.addEventListener('click', () => this._activateTool(tool.id));
      toolbar.appendChild(btn);
      // Store reference
      tool._btn = btn;
    });

    this._tools = tools;
    this._container.appendChild(toolbar);
  }

  /**
   * Build status bar
   * @private
   */
  _buildStatusBar() {
    const status = document.createElement('div');
    status.className = 'scanner-status';
    status.id = 'scanner-status';
    status.innerHTML = `
      <div class="scanner-status-indicator">
        <span class="scanner-status-dot"></span>
        <span>高精度扫描仪 · 在线</span>
      </div>
      <span id="scanner-status-progress">已使用工具: 0 / 3</span>
    `;
    this._container.appendChild(status);
    this._statusProgress = status.querySelector('#scanner-status-progress');
  }

  /**
   * Activate a tool and show its effect
   * @param {string} toolId — 'magnifier' | 'fiber' | 'sidelight'
   * @private
   */
  _activateTool(toolId) {
    // Deactivate current tool visual
    if (this._currentTool) {
      this._overlays[this._currentTool]?.classList.remove('active');
      this._tools.find(t => t.id === this._currentTool)?._btn?.classList.remove('active');
    }

    // If clicking the same tool again, just deactivate
    if (this._currentTool === toolId) {
      this._currentTool = null;
      // Hide sidelight extras
      this._remnantText.classList.remove('visible');
      this._auxLine.classList.remove('visible');
      return;
    }

    // Activate new tool
    this._currentTool = toolId;
    this._overlays[toolId]?.classList.add('active');
    const toolBtn = this._tools.find(t => t.id === toolId)?._btn;
    toolBtn?.classList.add('active');

    // Mark as used (first time only triggers feedback)
    const firstUse = !this._toolsUsed[toolId];
    this._toolsUsed[toolId] = true;
    toolBtn?.classList.add('used');

    // Show/hide sidelight-specific elements
    if (toolId === 'sidelight') {
      this._remnantText.classList.add('visible');
      this._auxLine.classList.add('visible');
    } else {
      this._remnantText.classList.remove('visible');
      this._auxLine.classList.remove('visible');
    }

    // Update progress
    const usedCount = Object.values(this._toolsUsed).filter(Boolean).length;
    this._statusProgress.textContent = `已使用工具: ${usedCount} / 3`;

    // Check if all tools used
    const allUsed = usedCount === 3;
    
    // Show intersection hotspot when all tools used and in sidelight mode
    if (allUsed && toolId === 'sidelight') {
      // Small delay for dramatic effect
      setTimeout(() => {
        this._intersectionEl.classList.add('visible');
      }, 800);
    } else if (allUsed && this._currentTool !== 'sidelight') {
      this._intersectionEl.classList.remove('visible');
    }

    // Trigger feedback callback on first use
    if (firstUse && this._options.onToolUsed) {
      this._options.onToolUsed(toolId, allUsed);
    }

    // Apply image effects based on tool
    this._applyImageEffect(toolId);
  }

  /**
   * Apply visual effect to the main image based on tool
   * @private
   */
  _applyImageEffect(toolId) {
    switch (toolId) {
      case 'magnifier':
        this._mainImg.style.transform = 'scale(1.4) translate(-15%, -10%)';
        this._mainImg.style.filter = 'contrast(1.1) brightness(1.05)';
        break;
      case 'fiber':
        this._mainImg.style.transform = 'scale(1)';
        this._mainImg.style.filter = 'contrast(1.3) saturate(0.3) brightness(1.1)';
        break;
      case 'sidelight':
        this._mainImg.style.transform = 'scale(1.05)';
        this._mainImg.style.filter = 'contrast(1.15) brightness(0.95)';
        break;
      default:
        this._mainImg.style.transform = '';
        this._mainImg.style.filter = '';
    }
  }

  /**
   * Check if all tools have been used
   * @returns {boolean}
   */
  allToolsUsed() {
    return Object.values(this._toolsUsed).every(Boolean);
  }

  /**
   * Get the click origin point of the intersection (for transition effect)
   * @returns {{x: number, y: number}}
   */
  getIntersectionOrigin() {
    if (!this._intersectionEl) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const rect = this._intersectionEl.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  /**
   * Switch to sidelight tool programmatically (used after all tools are used).
   * Does NOT toggle off if already active — ensures intersection hotspot is shown.
   */
  activateSidelight() {
    // If already in sidelight, don't toggle off — just ensure intersection is visible
    if (this._currentTool === 'sidelight') {
      if (this.allToolsUsed()) {
        setTimeout(() => {
          this._intersectionEl.classList.add('visible');
        }, 800);
      }
      return;
    }
    this._activateTool('sidelight');
  }

  /**
   * Destroy the scanner UI and clean up
   */
  destroy() {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }
}
