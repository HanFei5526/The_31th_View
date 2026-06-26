/**
 * 《卅一景》游戏入口
 *
 * 初始化游戏引擎，注册所有场景，启动应用。
 */

// 设计系统样式
import './styles/index.css'
import './styles/transitions.css'
import './styles/painting-viewer.css'
import './styles/narration-bar.css'
import './styles/notebook-floating.css'
import './styles/hud-bar.css'
import './styles/inventory-popup.css'
import './styles/poem-compare.css'
import './styles/chapter3.css'
import './styles/finale.css'
import './styles/overlay-text.css'

// 游戏引擎
import gameEngine from './core/game-engine.js'

// 场景
import LandingScene from './pages/landing.js'
import MenuScene from './pages/menu.js'
import PrologueScene from './pages/prologue.js'
import Chapter1PaintScene from './pages/chapter1-paint.js'
import Chapter1WorkshopScene from './pages/chapter1-workshop.js'
import Chapter2PaintScene from './pages/chapter2-paint.js'
import Chapter2WorkshopScene from './pages/chapter2-workshop.js'
import Chapter3PaintScene from './pages/chapter3-paint.js'
import Chapter3WorkshopScene from './pages/chapter3-workshop.js'
import FinaleScene from './pages/finale.js'

// ==================== 初始化 ====================

const app = document.getElementById('app')
if (!app) {
  console.error('[Main] 找不到 #app 根元素')
  throw new Error('Missing #app element')
}

// 初始化引擎
gameEngine.init(app)

// 初始化笔记本面板的代码已移除，NotebookFloating 现在由各场景（如 prologue.js）自行挂载和管理。

// 注册场景
gameEngine.sceneManager.register('landing', LandingScene)
gameEngine.sceneManager.register('menu', MenuScene)
gameEngine.sceneManager.register('prologue', PrologueScene)
gameEngine.sceneManager.register('chapter1', Chapter1PaintScene)
gameEngine.sceneManager.register('chapter1-workshop', Chapter1WorkshopScene)
gameEngine.sceneManager.register('chapter2', Chapter2PaintScene)
gameEngine.sceneManager.register('chapter2-workshop', Chapter2WorkshopScene)
gameEngine.sceneManager.register('chapter3', Chapter3PaintScene)
gameEngine.sceneManager.register('chapter3-workshop', Chapter3WorkshopScene)
gameEngine.sceneManager.register('finale', FinaleScene)

// 启动：直接进入着陆页
gameEngine.switchScene('landing')

console.log('[Main] 《卅一景》已启动 — v2 with prologue')
