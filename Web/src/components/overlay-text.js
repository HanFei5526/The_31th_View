/**
 * overlay-text.js — 画面居中显现文字 统一组件
 *
 * 三种动画预设:
 *   - ink-seep: 逐字水墨渗出 (关键揭示)
 *   - quiet-fade: 逐行沉静浮现 (章节过渡/跌入转场)
 *   - paper-reveal: 整体渐显 (旧批注/物件展示)
 *
 * 三种容器:
 *   - fullscreen: 全屏居中
 *   - center / left: 面板定位
 *   - anchor: 坐标锚定
 *
 * 特殊:
 *   - reveal: "画非一人"带背景遮罩逐字揭示
 *   - ripple: 水面涟漪文字
 */



/**
 * 逐字渗出 (ink-seep)
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {string} opts.text
 * @param {'center'|'left'|{x:number,y:number}} [opts.position='center']
 * @param {number} [opts.charDelay=250] ms/字
 * @param {number} [opts.blur=6]
 * @param {number} [opts.scale=1.15]
 * @param {number} [opts.finalOpacity=0.85]
 * @param {number} [opts.duration=800] 单字 transition ms
 * @param {'handwrite'|'xingkai'|'serif'} [opts.font='handwrite']
 * @param {boolean} [opts.emphasis=false]
 * @param {boolean} [opts.paperCard=false] 是否带纸张背景
 * @param {function} [opts.shouldExit] 退出检查函数
 * @returns {Promise<HTMLElement>}
 */
export async function showInkSeep(container, opts = {}) {
  const {
    text = '',
    position = 'center',
    charDelay = 250,
    blur = 6,
    scale = 1.15,
    finalOpacity = 0.85,
    duration = 800,
    font = 'handwrite',
    emphasis = false,
    paperCard = false,
    shouldExit = () => false,
  } = opts;

  const panel = document.createElement('div');

  // 容器定位
  if (typeof position === 'object' && position.x !== undefined) {
    panel.className = 'ot-anchor';
    panel.style.left = `${position.x}%`;
    panel.style.top = `${position.y}%`;
  } else if (position === 'left') {
    panel.className = 'ot-left';
  } else {
    panel.className = 'ot-center';
  }

  // CSS 变量注入
  panel.style.setProperty('--ot-blur', `${blur}px`);
  panel.style.setProperty('--ot-scale', scale);
  panel.style.setProperty('--ot-final-opacity', finalOpacity);
  panel.style.setProperty('--ot-char-duration', `${duration}ms`);

  // 文字容器
  const textEl = document.createElement('div');
  const textClasses = ['ot-panel-text'];
  if (paperCard) textClasses.push('ot-paper-card');
  if (font) textClasses.push(`ot-font-${font}`);
  textEl.className = textClasses.join(' ');

  // 逐字创建
  const chars = text.split('');
  chars.forEach(ch => {
    const span = document.createElement('span');
    span.className = 'ot-char' + (emphasis ? ' emphasis' : '');
    span.textContent = ch;
    textEl.appendChild(span);
  });

  panel.appendChild(textEl);
  container.appendChild(panel);
  await nextFrame();

  // 容器显现
  panel.classList.add('visible');

  // 逐字显现
  const charEls = textEl.querySelectorAll('.ot-char');
  for (let i = 0; i < charEls.length; i++) {
    if (shouldExit()) return panel;
    charEls[i].classList.add('visible');
    await delay(charDelay);
  }

  return panel;
}

/**
 * 逐行沉静浮现 (quiet-fade)
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {string[]} opts.lines
 * @param {'fullscreen'|'center'} [opts.position='fullscreen']
 * @param {number} [opts.lineDelay=1500] 行间延迟 ms
 * @param {number} [opts.duration=1200] 单行 transition ms
 * @param {number} [opts.translateY=10]
 * @param {number} [opts.blur=0] 0=无blur, 6=有blur
 * @param {number} [opts.finalOpacity=0.85]
 * @param {'serif'|'handwrite'} [opts.font='serif']
 * @param {Array<{type?:string}>} [opts.lineStyles] 每行的样式修饰
 * @param {function} [opts.shouldExit] 退出检查函数
 * @returns {Promise<{el:HTMLElement, lineEls:HTMLElement[]}>}
 */
export async function showQuietFade(container, opts = {}) {
  const {
    lines = [],
    position = 'fullscreen',
    lineDelay = 1500,
    duration = 1200,
    translateY = 10,
    blur = 0,
    finalOpacity = 0.85,
    font = 'serif',
    lineStyles = [],
    shouldExit = () => false,
  } = opts;

  const layer = document.createElement('div');
  layer.className = position === 'fullscreen' ? 'ot-fullscreen' : 'ot-center';

  // CSS 变量
  layer.style.setProperty('--ot-blur', `${blur}px`);
  layer.style.setProperty('--ot-ty', `${translateY}px`);
  layer.style.setProperty('--ot-final-opacity', finalOpacity);
  layer.style.setProperty('--ot-line-duration', `${duration}ms`);

  // 创建行元素
  const lineEls = lines.map((text, idx) => {
    const el = document.createElement('div');
    const classes = ['ot-line', `ot-font-${font}`];
    const style = lineStyles[idx];
    if (style?.type === 'inner-voice') classes.push('ot-inner-voice');
    if (style?.type === 'narration') classes.push('ot-narration');
    if (style?.type === 'zhou') classes.push('ot-zhou');
    if (text.startsWith('「')) classes.push('ot-quote-aligned');
    el.className = classes.join(' ');
    el.textContent = text;
    layer.appendChild(el);
    return el;
  });

  container.appendChild(layer);

  // 逐行延迟显现
  for (let i = 0; i < lineEls.length; i++) {
    if (shouldExit()) break;
    await delay(i === 0 ? 600 : lineDelay);
    lineEls[i].classList.add('visible');
  }

  return { el: layer, lineEls };
}

/**
 * 整体渐显 (paper-reveal)
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {string} [opts.html] 自定义 HTML 内容
 * @param {string} [opts.text] 纯文本内容
 * @param {'center'|'left'} [opts.position='center']
 * @param {number} [opts.duration=2500] 容器 transition ms
 * @param {number} [opts.scale=0.95]
 * @param {boolean} [opts.paperCard=true]
 * @returns {Promise<HTMLElement>}
 */
export async function showPaperReveal(container, opts = {}) {
  const {
    html = '',
    text = '',
    position = 'center',
    duration = 2500,
    scale = 0.95,
    paperCard = true,
  } = opts;

  const panel = document.createElement('div');
  panel.className = position === 'left' ? 'ot-left' : 'ot-center';
  panel.style.setProperty('--ot-container-duration', `${duration}ms`);
  panel.style.setProperty('--ot-container-scale', scale);

  const content = document.createElement('div');
  if (paperCard) content.classList.add('ot-paper-card');
  if (html) {
    content.innerHTML = html;
  } else {
    content.textContent = text;
  }

  panel.appendChild(content);
  container.appendChild(panel);
  await nextFrame();
  panel.classList.add('visible');

  return panel;
}

/**
 * "画非一人"揭示 (带背景遮罩 + CSS animation 逐字)
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {string[]} opts.chars 要揭示的字符数组
 * @param {number} [opts.charInterval=500] 字间延迟 ms (CSS animation-delay)
 * @returns {Promise<HTMLElement>}
 */
export async function showReveal(container, opts = {}) {
  const { chars = [], charInterval = 500 } = opts;

  const overlay = document.createElement('div');
  overlay.className = 'ot-fullscreen-backdrop';
  overlay.innerHTML = `
    <div class="ot-reveal-chars">
      ${chars.map((c, i) => `<span class="ot-char-anim ot-font-xingkai" style="font-size:2.4rem;animation-delay:${i * charInterval}ms">${c}</span>`).join('')}
    </div>
  `;
  container.appendChild(overlay);
  await delay(200);
  overlay.classList.add('active');

  return overlay;
}

/**
 * 水面涟漪文字 (ripple)
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {string} opts.html 内容 HTML
 * @param {boolean} [opts.paperCard=true]
 * @returns {Promise<HTMLElement>}
 */
export async function showRipple(container, opts = {}) {
  const { html = '', paperCard = true } = opts;

  const el = document.createElement('div');
  el.className = 'ot-ripple';
  if (paperCard) el.classList.add('ot-paper-card');
  el.innerHTML = html;
  container.appendChild(el);
  await delay(100);
  el.classList.add('visible');

  return el;
}

/**
 * 消失/移除 overlay 元素
 * @param {HTMLElement} el
 * @param {object} [opts]
 * @param {number} [opts.duration=1000] 淡出时长 ms
 * @param {'fade'|'fade-out'|'dissolve'} [opts.mode='fade']
 * @returns {Promise<void>}
 */
export async function dismiss(el, opts = {}) {
  if (!el) return;
  const { duration = 1000, mode = 'fade' } = opts;

  if (mode === 'dissolve') {
    el.classList.add('dissolve');
    await delay(3500);
    el.remove();
    return;
  }

  if (mode === 'fade-out') {
    el.classList.add('fade-out');
    await delay(duration);
    el.remove();
    return;
  }

  // 默认: 移除 visible + opacity 过渡
  el.classList.remove('visible', 'active');
  el.style.transition = `opacity ${duration}ms ease`;
  el.style.opacity = '0';
  await delay(duration);
  el.remove();
}

/**
 * 逐行淡出（用于跌入转场）
 * @param {HTMLElement[]} lineEls
 * @param {number} [stagger=200] 行间隔 ms
 */
export async function fadeOutLines(lineEls, stagger = 200) {
  for (let i = 0; i < lineEls.length; i++) {
    lineEls[i].classList.add('fading');
    await delay(stagger);
  }
  await delay(800);
}

// --- 工具函数 ---

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
