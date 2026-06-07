/**
 * 《卅一景》扫描比对界面
 *
 * 序章核心谜题 UI：全屏展示画面，三种工具逐步发现异常。
 */

export default class ScannerUI {
  /**
   * @param {object} options
   * @param {string} options.mainImage — URL of the 31st scene painting
   * @param {Function} options.onToolUsed — callback(toolId, allUsed) called when a tool is activated
   * @param {Function} options.onAllToolsUsed — callback() when all tools used (triggers transition to exploration)
   * @param {Function} options.onFeedback — callback(feedbackText) to display feedback narration
   */
  constructor(options) {
    this._options = options;
    this._container = null;
    this._toolsUsed = { magnifier: false, fiber: false, sidelight: false };
    this._currentTool = null;
    this._overlays = {};
  }

  mount(parent) {
    this._container = document.createElement('div');
    this._container.className = 'scanner-container full-screen';
    this._container.id = 'scanner-ui';

    // Main pane (full screen now)
    const mainPane = document.createElement('div');
    mainPane.className = 'scanner-pane scanner-pane-full';
    mainPane.id = 'scanner-main-pane';

    const mainImg = document.createElement('img');
    mainImg.className = 'scanner-pane-img';
    mainImg.src = this._options.mainImage;
    mainImg.alt = '第三十一景扫描件';
    mainImg.draggable = false;
    mainPane.appendChild(mainImg);
    this._mainImg = mainImg;

    this._createOverlays(mainPane);
    this._container.appendChild(mainPane);

    this._buildToolbar();
    this._buildStatusBar();

    parent.appendChild(this._container);
  }

  _createOverlays(pane) {
    // Magnifier overlay
    const magnify = document.createElement('div');
    magnify.className = 'scanner-overlay scanner-overlay-magnify';
    const ring = document.createElement('div');
    ring.className = 'magnify-ring';
    magnify.appendChild(ring);
    pane.appendChild(magnify);
    this._overlays.magnifier = magnify;

    // Fiber overlay
    const fiber = document.createElement('div');
    fiber.className = 'scanner-overlay scanner-overlay-fiber';
    pane.appendChild(fiber);
    this._overlays.fiber = fiber;

    // Sidelight overlay
    const sidelight = document.createElement('div');
    sidelight.className = 'scanner-overlay scanner-overlay-sidelight';
    pane.appendChild(sidelight);
    this._overlays.sidelight = sidelight;
  }

  _buildToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'scanner-toolbar bottom-toolbar';
    
    const tools = [
      { id: 'magnifier', icon: '🔍', label: '放大镜' },
      { id: 'fiber',     icon: '🔬', label: '纸质分析' },
      { id: 'sidelight', icon: '💡', label: '侧光照射' },
    ];

    tools.forEach(tool => {
      const btn = document.createElement('button');
      btn.className = 'scanner-tool-btn';
      btn.innerHTML = `<span class="scanner-tool-icon">${tool.icon}</span><span>${tool.label}</span>`;
      btn.addEventListener('click', () => this._activateTool(tool.id));
      toolbar.appendChild(btn);
      tool._btn = btn;
    });

    this._tools = tools;
    this._container.appendChild(toolbar);
  }

  _buildStatusBar() {
    const status = document.createElement('div');
    status.className = 'scanner-status';
    status.innerHTML = `
      <div class="scanner-status-indicator">
        <span class="scanner-status-dot"></span>
        <span>高精度扫描仪 · 在线</span>
      </div>
      <span id="scanner-status-progress">已使用: 0 / 3</span>
    `;
    this._container.appendChild(status);
    this._statusProgress = status.querySelector('#scanner-status-progress');
  }

  _activateTool(toolId) {
    if (this._currentTool) {
      this._overlays[this._currentTool]?.classList.remove('active');
      this._tools.find(t => t.id === this._currentTool)?._btn?.classList.remove('active');
    }

    if (this._currentTool === toolId) {
      this._currentTool = null;
      this._applyImageEffect(null);
      return;
    }

    this._currentTool = toolId;
    this._overlays[toolId]?.classList.add('active');
    const toolBtn = this._tools.find(t => t.id === toolId)?._btn;
    toolBtn?.classList.add('active');

    const firstUse = !this._toolsUsed[toolId];
    this._toolsUsed[toolId] = true;
    toolBtn?.classList.add('used');

    const usedCount = Object.values(this._toolsUsed).filter(Boolean).length;
    this._statusProgress.textContent = `已使用: ${usedCount} / 3`;

    const allUsed = usedCount === 3;

    if (firstUse && this._options.onToolUsed) {
      this._options.onToolUsed(toolId, allUsed);
    }
    
    this._applyImageEffect(toolId);

    if (allUsed && firstUse && this._options.onAllToolsUsed) {
      this._options.onAllToolsUsed();
    }
  }

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

  destroy() {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }
}
