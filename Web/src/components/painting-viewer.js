/**
 * 《卅一景》古画查看器组件
 *
 * 提供"工具检测 → 线索探索 → 汇聚动画"完整交互流程。
 *
 * 布局：左 3/4 古画展示区 + 右 1/4 工具侧边栏
 *
 * 交互流程：
 * 1. 挂载后显示全屏界面，三种工具（放大镜 / 纸质分析 / 侧光照射）
 * 2. 完成三项基础检查后，使用放大镜解锁画面点击探索
 * 3. 点击命中线索区 → 金色涟漪 + 回调；未命中 → 灰色涟漪
 * 4. 连续错误 ≥ 3 → 呼吸光斑提示
 * 5. 三条线索全部记录后 → 汇聚动画 → 回调
 */

// ── 线索定义 ──────────────────────────────────────────
const CLUE_DEFS = {
  clue_margin: { x: 85, y: 12, r: 8,  title: '装裱接缝残角' },
  clue_text:   { x: 14, y: 80, r: 8,  title: '"……所见"残字' },
  clue_line:   { x: 50, y: 75, r: 10, title: '底层细线' },
};

// ── 工具定义 ──────────────────────────────────────────
const TOOLS = [
  { id: 'magnifier',  icon: '🔍', label: '放大镜' },
  { id: 'fiber',      icon: '🔬', label: '纸质分析' },
  { id: 'sidelight',  icon: '💡', label: '侧光照射' },
];

const REQUIRED_TOOL_IDS = TOOLS.map((tool) => tool.id);

// ── 工具反馈文案 ─────────────────────────────────────
const TOOL_FEEDBACK = {
  magnifier: '放大镜已就位。装裱接缝处有重叠痕迹，边框似乎压住了旧题签的一角。（检测结果已同步至右侧笔记本【记录】页签，可以前往查看或在【对话】页签发起研讨）',
  fiber:     '纸质分析完成。背纸与其他三十页不完全一致，此页曾经重装；画心本身较稳定。（检测结果已同步至右侧笔记本【记录】页签，可以前往查看或在【对话】页签发起研讨）',
  sidelight: '侧光照射完成。装裱边下方隐约显出旧字残痕和一条极淡的细线。（检测结果已同步至右侧笔记本【记录】页签，可以前往查看或在【对话】页签发起研讨）',
};

// ── 工具对应的滤镜效果 ──────────────────────────────
const TOOL_FILTERS = {
  magnifier:  { transform: 'scale(1.35) translate(-12%, -8%)',  filter: 'contrast(1.1) brightness(1.05)' },
  fiber:      { transform: 'scale(1)',                          filter: 'contrast(1.3) saturate(0.3) brightness(1.1)' },
  sidelight:  { transform: 'scale(1.05)',                       filter: 'contrast(1.15) brightness(0.95)' },
};


export default class PaintingViewer {

  /**
   * @param {object} options
   * @param {string} options.imageUrl       — 古画图片 URL
   * @param {Function} options.onToolUsed   — 工具使用回调 (toolId) => {}
   * @param {Function} options.onClueFound  — 发现线索回调 (clueId) => {}
   * @param {Function} options.onAllCluesRecorded — 三条线索全部记录回调 () => {}
   * @param {Function} options.onConvergence — 汇聚点点击回调 () => {}
   * @param {Function} options.onFeedback   — 反馈文字回调 (text) => {}
   */
  constructor(options) {
    this._el = null;           // 根容器 .painting-viewer
    this._imgEl = null;        // 古画 <img>
    this._markersLayer = null; // 标记层
    this._hintsLayer = null;   // 呼吸光斑层
    this._feedbackEl = null;   // 底部反馈条
    this._statusEl = null;     // 底部状态栏
    this._opt = {
      imageUrl: '',
      dockEl: null,         // 对话框DOM元素，将其嵌入到古画左侧下方
      onToolUsed: null,     // (toolId) => void
      onClueFound: null,    // (clueId) => void
      onAllCluesRecorded: null, // () => void
      onConvergence: null,  // () => void
      onFeedback: null,     // (text) => void
      ...options
    };

    // 状态
    this._currentTool = null;
    this._toolsUsed = { magnifier: false, fiber: false, sidelight: false };
    this._explorable = false;
    this._zoomLevel = 1.0;
    this._panX = 0;
    this._panY = 0;
    this._isDragging = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._panStartX = 0;
    this._panStartY = 0;
    this._preventNextClick = false;
    this._wrongClicks = 0;
    this._allRecorded = false;    // 当前缩放比例

    // ── 线索状态 ──
    this._clues = {};          // 运行时副本，含 found / recorded 标志
    for (const [id, def] of Object.entries(CLUE_DEFS)) {
      this._clues[id] = { ...def, found: false, recorded: false };
    }
    this._wrongClicks = 0;     // 连续错误计数
    this._allRecorded = false; // 三条线索是否全部记录
    this._convergenceShown = false;

    // ── 绑定函数引用（用于 window 事件清理） ──
    this._boundOnResize = this._onResize.bind(this);
  }

  // ══════════════════════════════════════════════
  //  公开 API
  // ══════════════════════════════════════════════

  /** 挂载到指定父容器 */
  mount(parent) {
    this._el = this._createElement('div', 'painting-viewer');

    // ── 左侧：古画主区域 ──
    const main = this._createElement('div', 'pv-main');

    // 古画卡片
    const card = this._createElement('div', 'pv-painting-card');

    // 用于包裹图片和图层的容器（解决 transform 下的坐标映射和 object-fit 空白问题）
    this._wrapperEl = this._createElement('div', 'pv-painting-wrapper');

    this._imgEl = document.createElement('img');
    this._imgEl.className = 'pv-painting-img';
    this._imgEl.src = this._opt.imageUrl;
    this._imgEl.alt = '第三十一景';
    this._imgEl.draggable = false;
    
    // 监听加载事件以进行尺寸自适应
    this._imgEl.addEventListener('load', () => this._resizeContainerToFitImage());
    if (this._imgEl.complete) {
      requestAnimationFrame(() => this._resizeContainerToFitImage());
    }
    
    this._wrapperEl.appendChild(this._imgEl);

    // 标记层（涟漪 / 线索标记 / 汇聚连线）
    this._markersLayer = this._createElement('div', 'pv-layer pv-markers-layer');
    this._wrapperEl.appendChild(this._markersLayer);

    // 提示层（呼吸光斑）
    this._hintsLayer = this._createElement('div', 'pv-layer pv-hints-layer');
    this._wrapperEl.appendChild(this._hintsLayer);

    card.appendChild(this._wrapperEl);

    // 古画点击事件 & 滚轮缩放事件
    this._wrapperEl.addEventListener('click', (e) => this._onPaintingClick(e));
    card.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    
    main.appendChild(card);
    this._cardEl = card;

    // 底部反馈条
    this._feedbackEl = this._createElement('div', 'pv-feedback');
    main.appendChild(this._feedbackEl);

    // 线索状态栏：和图片同属于古画卡片，避免脱离画布
    this._statusEl = this._createElement('div', 'pv-status');
    card.appendChild(this._statusEl);
    this._updateStatus();

    // ── 内部容器：弹窗卡片 ──
    const cardContainer = this._createElement('div', 'pv-card-container');
    cardContainer.appendChild(main);

    this._el.appendChild(cardContainer);

    // ── 挂载到父节点 ──
    parent.appendChild(this._el);

    // 绑定拖拽事件相关函数
    this._boundOnMouseMove = this._onMouseMove.bind(this);
    this._boundOnMouseUp = this._onMouseUp.bind(this);
    this._wrapperEl.addEventListener('mousedown', (e) => this._onMouseDown(e));

    // 监听窗口 resize
    window.addEventListener('resize', this._boundOnResize);
  }

  /** 销毁组件，清理 DOM 和全局事件 */
  destroy() {
    window.removeEventListener('resize', this._boundOnResize);
    if (this._feedbackTimer) clearTimeout(this._feedbackTimer);
    
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }

  /**
   * 将指定线索标记为"已记录"（由外部研讨通过时调用）。
   * 现在研讨已降级为辅助讨论，发现即确认；
   * 但为了保持向后兼容，若研讨管理器调用此方法，静默完成即可。
   * @param {string} clueId
   */
  markClueRecorded(clueId) {
    // 已在 _autoConfirmClue 中完成，此处做兼容兜底
    if (!this._clues[clueId]?.recorded) {
      this._autoConfirmClue(clueId);
    }
  }

  /** 由外部调用：综合研讨通过后触发汇聚动画 */
  triggerConvergence() {
    if (!this._allRecorded || this._convergenceShown) return;

    this._showFeedback('已成功推理得出结论。你可以在右侧笔记本的【对话】中与 AI 继续探讨，或在【记录】中查阅已写入的结论摘要。如不需进一步讨论，点击古画中央的闪烁光点，即可继续剧情。');

    setTimeout(() => {
      this._playConvergence();
    }, 1200);
  }

  /**
   * 发现线索后自动确认（即时反馈，无需研讨）
   * @param {string} clueId
   * @private
   */
  _autoConfirmClue(clueId) {
    const clue = this._clues[clueId];
    if (!clue || clue.recorded) return;
    clue.recorded = true;

    // 在标记层添加持久标记点
    this._addMarker(clue.x, clue.y, clueId);
    this._updateStatus();

    // 即时反馈
    this._showFeedback(`发现了「${clue.title}」的相关线索。内容已经整理到了右侧笔记本的“记录”页，如果有疑问，随时可以到“对话”页发起讨论。`);

    // 判断是否触发汇聚
    this._checkConvergence();
  }

  // ══════════════════════════════════════════════
  //  公开 API — 工具控制
  // ══════════════════════════════════════════════

  /** 由外部调用：应用指定的工具滤镜 */
  applyTool(toolId) {
    this._currentTool = toolId;

    // 首次使用
    const isFirstUse = !this._toolsUsed[toolId];
    if (isFirstUse) {
      this._toolsUsed[toolId] = true;

      // 显示工具检测反馈
      if (TOOL_FEEDBACK[toolId]) {
        this._showFeedback(TOOL_FEEDBACK[toolId]);
      }

      // 回调
      this._opt.onToolUsed?.(toolId);
    }

    if (!this._explorable && this._hasUsedAllRequiredTools()) {
      this._explorable = true;
      console.log('[PaintingViewer] 三项基础检查已完成，探索已解锁');
      if (this._statusEl) this._statusEl.style.display = 'block';

      // 自动切换到放大镜
      this._currentTool = 'magnifier';
      this._applyImageEffect('magnifier');

      // 派发事件通知外部锁定工具区
      window.dispatchEvent(new CustomEvent('all-tools-used'));

      // 延迟显示，避免和工具反馈重叠
      setTimeout(() => {
        this._showFeedback('三项基础扫描已完成。请在古画上点击寻找并收集隐藏线索（收集进度可查看画幅下方的 0/3 指示灯）。集齐全部线索后，即可开启综合研讨，推理出最终结论。');
      }, 6000);
    }

    // 应用图像滤镜
    this._applyImageEffect(toolId);
  }

  /** 由外部调用：清除当前工具滤镜 */
  clearTool() {
    this._currentTool = null;
    this._panX = 0;
    this._panY = 0;
    this._zoomLevel = 1.0;
    this._applyImageEffect(null);
  }

  /** 根据当前工具设置包装层的 transform / filter */
  _applyImageEffect(toolId) {
    if (!this._wrapperEl) return;
    let transform = '';
    let filter = '';

    if (toolId === 'magnifier') {
      transform = `translate(${this._panX}px, ${this._panY}px) scale(${this._zoomLevel})`;
      filter = 'contrast(1.1) brightness(1.05)';
    } else if (toolId === 'fiber') {
      filter = 'contrast(1.3) saturate(0.3) brightness(1.1)';
    } else if (toolId === 'sidelight') {
      filter = 'contrast(1.15) brightness(0.95)';
    }

    this._wrapperEl.style.transform = transform;
    this._wrapperEl.style.filter = filter;
  }

  // ══════════════════════════════════════════════
  //  内部 — 滚轮缩放
  // ══════════════════════════════════════════════

  /** 滚轮缩放古画（仅在使用放大镜时生效） */
  _onWheel(e) {
    if (this._currentTool !== 'magnifier') return;
    e.preventDefault();
    
    // 根据滚轮方向调整缩放
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this._zoomLevel = Math.max(1.0, Math.min(3.0, this._zoomLevel + delta));
    
    // 缩小到 1.0 时重置平移
    if (this._zoomLevel === 1.0) {
      this._panX = 0;
      this._panY = 0;
    }
    
    // 应用新缩放
    this._applyImageEffect('magnifier');
  }

  /** 鼠标按下：开始拖拽 */
  _onMouseDown(e) {
    if (this._currentTool !== 'magnifier') return;
    if (!this._explorable) return;
    if (this._zoomLevel <= 1.0) return; // 未放大时禁止拖动

    e.preventDefault(); // 防止默认图片拖拽行为
    this._isDragging = true;
    this._dragStartX = e.clientX;
    this._dragStartY = e.clientY;
    this._panStartX = this._panX;
    this._panStartY = this._panY;
    
    this._wrapperEl.style.cursor = 'grabbing';
    // 拖拽时取消过渡动画，保证跟手
    this._wrapperEl.style.transition = 'none';
    
    window.addEventListener('mousemove', this._boundOnMouseMove);
    window.addEventListener('mouseup', this._boundOnMouseUp);
  }

  /** 鼠标移动：处理拖拽平移 */
  _onMouseMove(e) {
    if (!this._isDragging) return;
    
    const dx = e.clientX - this._dragStartX;
    const dy = e.clientY - this._dragStartY;
    
    this._panX = this._panStartX + dx;
    this._panY = this._panStartY + dy;
    
    this._applyImageEffect('magnifier');
  }

  /** 鼠标松开：结束拖拽 */
  _onMouseUp(e) {
    if (!this._isDragging) return;
    this._isDragging = false;
    
    this._wrapperEl.style.cursor = '';
    // 恢复原来的过渡效果
    this._wrapperEl.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.6s ease';
    
    window.removeEventListener('mousemove', this._boundOnMouseMove);
    window.removeEventListener('mouseup', this._boundOnMouseUp);
    
    // 如果拖拽距离较大，阻止接下来的 click 事件触发线索检测
    const dx = e.clientX - this._dragStartX;
    const dy = e.clientY - this._dragStartY;
    if (Math.hypot(dx, dy) > 5) {
      this._preventNextClick = true;
    }
  }

  // ══════════════════════════════════════════════
  //  内部 — 反馈条
  // ══════════════════════════════════════════════

  /** 在底部反馈条显示文字，自动消隐 */
  _showFeedback(text) {
    if (!this._feedbackEl) return;
    this._feedbackEl.textContent = text;
    this._feedbackEl.classList.add('visible');

    // 同时通知外部
    this._opt.onFeedback?.(text);

    // 自动消隐
    if (this._feedbackTimer) clearTimeout(this._feedbackTimer);
    this._feedbackTimer = setTimeout(() => {
      this._feedbackEl.classList.remove('visible');
    }, 4500);
  }

  /** 显示持久反馈（不自动消失） */
  showPersistentFeedback(text) {
    if (!this._feedbackEl) return;
    if (this._feedbackTimer) clearTimeout(this._feedbackTimer);
    this._feedbackEl.textContent = text;
    this._feedbackEl.classList.add('visible');
  }

  /** 隐藏反馈条 */
  hideFeedback() {
    if (!this._feedbackEl) return;
    if (this._feedbackTimer) clearTimeout(this._feedbackTimer);
    this._feedbackEl.classList.remove('visible');
  }

  // ══════════════════════════════════════════════
  //  内部 — 点击探索
  // ══════════════════════════════════════════════

  /** 古画区域点击事件 */
  _onPaintingClick(e) {
    // 阻止因拖拽导致的意外点击
    if (this._preventNextClick) {
      this._preventNextClick = false;
      return;
    }

    // 汇聚/研讨阶段不再响应点击
    if (this._allRecorded) return;

    // 未完成基础检查 → 显示提示
    if (!this._explorable) {
      console.log('[PaintingViewer] 点击被忽略：尚未完成三项基础检查');
      const missing = this._getMissingToolLabels();
      this._showFeedback(`请先启用右侧的检测工具，完成以下检查：${missing.join('、')}`);
      return;
    }

    // 探索阶段必须切回放大镜
    if (this._currentTool !== 'magnifier') {
      console.log('[PaintingViewer] 点击被忽略：当前不是放大镜工具');
      this._showFeedback('线索探索需要使用放大镜，请先在右侧工具箱中启用放大镜。');
      return;
    }

    // 计算点击在包装层上的百分比坐标（自动适配 scale 缩放）
    const rect = this._wrapperEl.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    // 命中检测
    let hitId = null;
    for (const [id, clue] of Object.entries(this._clues)) {
      if (clue.found) continue; // 已找到的跳过
      const dist = Math.hypot(px - clue.x, py - clue.y);
      if (dist <= clue.r) {
        hitId = id;
        break;
      }
    }

    if (hitId) {
      // ── 命中线索 ──
      this._showRipple(px, py, 'gold');
      this._clues[hitId].found = true;
      this._wrongClicks = 0; // 重置错误计数
      this._updateStatus();

      // 清除该线索的呼吸光斑（如果有）
      this._removeHintSpot(hitId);

      // 明确反馈
      const clueTitle = this._clues[hitId].title;
      this._showFeedback(`找到了线索「${clueTitle}」，已记录下来`);

      // 回调
      this._opt.onClueFound?.(hitId);
    } else {
      // ── 未命中 ──
      this._showRipple(px, py, 'grey');
      this._wrongClicks++;
      console.log(`[PaintingViewer] 未命中 (${px.toFixed(1)}%, ${py.toFixed(1)}%), 连续错误: ${this._wrongClicks}`);
      this._showFeedback('这地方看起来挺正常的，再去别的位置找找看。');
      this._checkHintTrigger();
    }
  }

  /** 在指定百分比坐标处显示涟漪动画 */
  _showRipple(px, py, type) {
    const ripple = document.createElement('div');
    ripple.className = `pv-ripple pv-ripple-${type}`;
    ripple.style.left = `${px}%`;
    ripple.style.top = `${py}%`;
    this._markersLayer.appendChild(ripple);
    // 动画结束后自动移除
    setTimeout(() => ripple.remove(), 1000);
  }

  /** 添加线索持久标记点（金色小圆 + 标题） */
  _addMarker(px, py, clueId) {
    // 防止重复添加
    if (this._markersLayer.querySelector(`[data-clue="${clueId}"]`)) return;

    const marker = document.createElement('div');
    marker.className = 'pv-marker';
    marker.dataset.clue = clueId;
    marker.style.left = `${px}%`;
    marker.style.top = `${py}%`;

    const dot = document.createElement('div');
    dot.className = 'pv-marker-dot';
    marker.appendChild(dot);

    const label = document.createElement('span');
    label.className = 'pv-marker-label';
    label.textContent = this._clues[clueId].title;
    marker.appendChild(label);

    this._markersLayer.appendChild(marker);
  }

  // ══════════════════════════════════════════════
  //  内部 — 渐进提示
  // ══════════════════════════════════════════════

  /** 错误次数达到阈值时触发提示（渐进披露，每3次错误多给一条） */
  _checkHintTrigger() {
    // 获取未找到的线索列表
    const unfound = Object.entries(this._clues).filter(([, c]) => !c.found);
    if (unfound.length === 0) return;

    // 每累计3次错误，多显示一条光斑
    const hintCount = Math.floor(this._wrongClicks / 3);
    if (hintCount <= 0) return;

    console.log(`[PaintingViewer] 连续错误≥${this._wrongClicks}，显示${Math.min(hintCount, unfound.length)}条位置提示`);

    // 根据即将显示的线索给出针对性方位提示
    const toShow = unfound.slice(0, hintCount);
    const lastRevealed = toShow[toShow.length - 1];
    const hintTextMap = {
      clue_margin: '留意画面右上方的金色光圈，那里的装裱材质纹理似乎有被故意掩盖的痕迹。',
      clue_text: '留意画面左下角的金色光圈，装裱层底下好像藏着一些没被抹干净的旧字迹。',
      clue_line: '留意画面下方中央区域的金色光圈，那里似乎有一道极细的线条，看起来不像是画作原有的。',
    };
    const fallback = '除了画中的景物，这页古画的边缘和装裱处好像还藏着别的信息，再仔细找找看吧。';
    this._showFeedback(hintTextMap[lastRevealed[0]] || fallback);
    this._showVisualHintsProgressive(hintCount);
  }

  /** 渐进显示呼吸光斑：最多显示 count 条 */
  _showVisualHintsProgressive(count) {
    this._hintsLayer.innerHTML = '';
    const unfound = Object.entries(this._clues).filter(([, c]) => !c.found);
    const toShow = unfound.slice(0, count);
    for (const [id, clue] of toShow) {
      const spot = document.createElement('div');
      spot.className = 'pv-hint-spot';
      spot.dataset.clue = id;
      spot.style.left = `${clue.x}%`;
      spot.style.top = `${clue.y}%`;
      this._hintsLayer.appendChild(spot);
    }
  }

  /** 移除指定线索的呼吸光斑 */
  _removeHintSpot(clueId) {
    const spot = this._hintsLayer.querySelector(`[data-clue="${clueId}"]`);
    if (spot) spot.remove();
  }

  // ══════════════════════════════════════════════
  //  内部 — 状态栏
  // ══════════════════════════════════════════════

  /** 更新底部状态栏：●已确认 ◐已发现待确认 ○未发现 */
  _updateStatus() {
    if (!this._statusEl) return;
    const found = Object.values(this._clues).filter(c => c.found).length;
    const recorded = Object.values(this._clues).filter(c => c.recorded).length;

    let circles = '';
    for (let i = 0; i < 3; i++) {
      if (i < recorded) circles += '●';
      else if (i < found) circles += '◐';
      else circles += '○';
    }

    if (recorded === 3) {
      this._el?.classList.add('pv-synthesis-ready');
      this._statusEl.innerHTML =
        `三处线索已全部确认 <span class="pv-circles">${circles}</span>`;
    } else {
      this._el?.classList.remove('pv-synthesis-ready');
      this._statusEl.innerHTML =
        `线索 <span class="pv-circles">${circles}</span>` +
        ` <span class="pv-status-detail">${found}/3 已发现${recorded > 0 ? ` · ${recorded}/3 已确认` : ''}</span>`;
    }
  }

  // ══════════════════════════════════════════════
  //  内部 — 汇聚动画
  // ══════════════════════════════════════════════

  /** 检查是否所有线索已记录，通知外部启动综合研讨 */
  _checkConvergence() {
    const recordedCount = Object.values(this._clues).filter(c => c.recorded).length;
    if (recordedCount < 3 || this._allRecorded) return;

    this._allRecorded = true;
    this._hintsLayer.innerHTML = '';

    // 还原缩放
    this.clearTool();

    // 等线索确认提示完全消失后（4.5s）再回调外部
    setTimeout(() => {
      this._opt.onAllCluesRecorded?.();
    }, 5500);
  }

  /** 播放汇聚动画：三个金色光点向中心汇聚 → 交会点脉冲 → 可点击 */
  _playConvergence() {
    if (this._convergenceShown) return;
    this._convergenceShown = true;

    // 交会点坐标（三个线索的几何中心）
    const cx = 50, cy = 56;

    // ── 三个光点向中心飞去 ──
    const clueEntries = Object.values(this._clues);
    clueEntries.forEach((clue) => {
      const dot = document.createElement('div');
      dot.className = 'pv-convergence-dot';
      dot.style.left = `${clue.x}%`;
      dot.style.top = `${clue.y}%`;
      // 触发 reflow 后设置终点，让 CSS transition 驱动动画
      requestAnimationFrame(() => {
        dot.style.left = `${cx}%`;
        dot.style.top = `${cy}%`;
        dot.style.opacity = '0';
      });
      this._markersLayer.appendChild(dot);
    });

    // ── 交会点 + 脉冲（光点到达后出现）──
    setTimeout(() => {
      const point = document.createElement('div');
      point.className = 'pv-convergence-point';
      point.style.left = `${cx}%`;
      point.style.top = `${cy}%`;

      const pulse = document.createElement('div');
      pulse.className = 'pv-convergence-pulse';
      point.appendChild(pulse);

      const label = document.createElement('div');
      label.className = 'pv-convergence-label';
      label.textContent = '点击查看';
      point.appendChild(label);

      // 交会点点击 → 触发最终回调
      point.addEventListener('click', (event) => {
        event.stopPropagation();
        point.classList.add('pv-explode');
        setTimeout(() => {
          this._opt.onConvergence?.();
        }, 450);
      });

      this._markersLayer.appendChild(point);
    }, 1500); // 等光点飞到中心后出现
  }

  // ══════════════════════════════════════════════
  //  内部 — 工具方法
  // ══════════════════════════════════════════════

  _onResize() {
    this._resizeContainerToFitImage();
  }

  /**
   * 动态计算并适配古画与外卡片容器的尺寸，使其黑边几乎为零（画布仅比图片大 16px 边距）
   * @private
   */
  _resizeContainerToFitImage() {
    if (!this._imgEl || !this._el) return;
    const imgW = this._imgEl.naturalWidth;
    const imgH = this._imgEl.naturalHeight;
    if (!imgW || !imgH) return;

    // 理想最大显示高度与宽度，预留底部对话框空间
    const maxH = Math.min(window.innerHeight * 0.70, 680); 
    const maxW = window.innerWidth * 0.82;

    // 计算缩放比例
    let targetH = maxH;
    let targetW = targetH * (imgW / imgH);

    if (targetW > maxW) {
      targetW = maxW;
      targetH = targetW * (imgH / imgW);
    }

    // 容器比图片只大一点点（四周加 padding: 0.5rem = 8px，一共 16px）
    const borderPadding = 16;
    const containerW = targetW + borderPadding;
    const containerH = targetH + borderPadding;

    const container = this._el.querySelector('.pv-card-container');
    if (container) {
      container.style.width = `${containerW}px`;
      container.style.height = `${containerH}px`;
    }

    if (this._cardEl) {
      this._cardEl.style.width = `${targetW}px`;
      this._cardEl.style.height = `${targetH}px`;
    }
  }

  /** 创建带 className 的元素 */
  _createElement(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  _hasUsedAllRequiredTools() {
    return REQUIRED_TOOL_IDS.every((id) => this._toolsUsed[id]);
  }

  _getMissingToolLabels() {
    return TOOLS
      .filter((tool) => !this._toolsUsed[tool.id])
      .map((tool) => tool.label);
  }
}
