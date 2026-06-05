/**
 * 《卅一景》场景管理器
 *
 * 职责:
 * - 注册场景类 (register)
 * - 管理场景切换生命周期：exit → 过渡动画 → enter
 * - 维护场景渲染容器 (scene-viewport)
 * - 提供多种转场风格切换（默认淡入淡出、墨迹扩散、卷轴展开）
 *
 * 每个场景类应实现:
 *   constructor(engine)
 *   enter(container)  — 渲染内容到 container
 *   exit()            — 清理（可选）
 *   update()          — 帧更新（可选）
 */

import { TransitionManager } from '../components/transition.js';

export class SceneManager {
  constructor(engine) {
    /** @type {import('./game-engine.js').GameEngine} */
    this.engine = engine;

    /** 转场动画管理器 */
    this.transition = new TransitionManager();

    /** 已注册的场景类 @type {Map<string, Function>} */
    this._registry = new Map();

    /** 当前场景实例 @type {object|null} */
    this._currentScene = null;

    /** 当前场景名 @type {string|null} */
    this._currentName = null;

    /** 场景渲染容器 @type {HTMLElement|null} */
    this._container = null;
  }

  /**
   * 初始化场景容器（由 GameEngine.init 调用）
   * @param {HTMLElement} appElement - #app 根元素
   */
  init(appElement) {
    this._container = document.createElement('div');
    this._container.id = 'scene-viewport';
    this._container.className = 'scene-container';
    appElement.appendChild(this._container);
  }

  /**
   * 注册一个场景
   * @param {string} name - 场景名称（唯一标识符）
   * @param {Function} SceneClass - 场景类构造函数
   */
  register(name, SceneClass) {
    if (this._registry.has(name)) {
      console.warn(`[SceneManager] 场景 "${name}" 已注册，将被覆盖`);
    }
    this._registry.set(name, SceneClass);
  }

  /**
   * 切换到指定场景
   * @param {string} name - 目标场景名称
   * @returns {Promise<void>}
   */
  async switchTo(name, skipTransition = false) {
    const SceneClass = this._registry.get(name);
    if (!SceneClass) {
      console.error(`[SceneManager] 未找到场景: "${name}"`);
      return;
    }

    // 1. 播放过渡动画
    if (!skipTransition) {
      await this.engine.playTransition();
    }

    // 2. 退出当前场景
    if (this._currentScene) {
      if (typeof this._currentScene.exit === 'function') {
        this._currentScene.exit();
      }
      this.engine.emit('scene-exit', { scene: this._currentName });
    }

    // 3. 清空容器
    this._container.innerHTML = '';

    // 4. 更新容器的世界主题 CSS 类
    this._container.classList.remove('real-world', 'paint-world');
    this._container.classList.add(
      this.engine.currentWorld === 'paint' ? 'paint-world' : 'real-world'
    );

    // 5. 创建并进入新场景
    const scene = new SceneClass(this.engine);
    this._currentScene = scene;
    this._currentName = name;

    if (typeof scene.enter === 'function') {
      scene.enter(this._container);
    }

    // 6. 更新引擎状态
    this.engine.currentScene = name;
    this.engine.emit('scene-enter', { scene: name });
  }

  /**
   * 获取当前场景实例
   * @returns {object|null}
   */
  getCurrentScene() {
    return this._currentScene;
  }

  /**
   * 获取当前场景名称
   * @returns {string|null}
   */
  getCurrentName() {
    return this._currentName;
  }

  /* ==================== 专用转场切换 ==================== */

  /**
   * 墨迹扩散转场 — 序章跌入画中专用
   * @param {string} targetScene — 目标场景名
   * @returns {Promise<void>}
   */
  async switchWithInkSpread(targetScene) {
    await this.transition.inkSpread(2000);
    this._doSwitch(targetScene);
    await this.transition.clearInk(1500);
  }

  /**
   * 卷轴展开转场 — 章节间切换专用
   * @param {string} targetScene — 目标场景名
   * @param {object} chapterInfo — { number, name, subtitle }
   * @returns {Promise<void>}
   */
  async switchWithScroll(targetScene, chapterInfo) {
    const scrollDone = this.transition.scrollTransition(chapterInfo, 3500);
    // 在卷轴合拢的 1s 后执行场景切换
    await new Promise(r => setTimeout(r, 1200));
    this._doSwitch(targetScene);
    await scrollDone;
  }

  /**
   * 内部：执行场景切换（无转场动画）
   * @param {string} name
   */
  _doSwitch(name) {
    const SceneClass = this._registry.get(name);
    if (!SceneClass) {
      console.error(`[SceneManager] 未找到场景: "${name}"`);
      return;
    }

    if (this._currentScene) {
      if (typeof this._currentScene.exit === 'function') {
        this._currentScene.exit();
      }
      this.engine.emit('scene-exit', { scene: this._currentName });
    }

    this._container.innerHTML = '';
    this._container.classList.remove('real-world', 'paint-world');
    this._container.classList.add(
      this.engine.currentWorld === 'paint' ? 'paint-world' : 'real-world'
    );

    const scene = new SceneClass(this.engine);
    this._currentScene = scene;
    this._currentName = name;

    if (typeof scene.enter === 'function') {
      scene.enter(this._container);
    }

    this.engine.currentScene = name;
    this.engine.emit('scene-enter', { scene: name });
  }
}
