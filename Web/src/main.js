/**
 * 《卅一景》游戏入口
 *
 * 初始化游戏引擎，注册所有场景，启动应用。
 */

// 设计系统样式
import './styles/index.css'
import './styles/transitions.css'

// 游戏引擎
import gameEngine from './core/game-engine.js'

// 场景
import LandingScene from './pages/landing.js'
import MenuScene from './pages/menu.js'
import PrologueScene from './pages/prologue.js'

// ==================== 初始化 ====================

const app = document.getElementById('app')
if (!app) {
  console.error('[Main] 找不到 #app 根元素')
  throw new Error('Missing #app element')
}

// 初始化引擎
gameEngine.init(app)

// 注册场景
gameEngine.sceneManager.register('landing', LandingScene)
gameEngine.sceneManager.register('menu', MenuScene)
gameEngine.sceneManager.register('prologue', PrologueScene)

// 启动：进入着陆页
gameEngine.switchScene('landing')

console.log('[Main] 《卅一景》已启动 — v2 with prologue')
