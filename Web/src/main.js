/**
 * 《卅一景》游戏入口
 *
 * 初始化游戏引擎，注册所有场景，启动应用。
 */

// 设计系统样式
import './styles/index.css'
import './styles/transitions.css'
import './styles/painting-viewer.css'
import './styles/gate-panel.css'
import './styles/narration-bar.css'
import './styles/notebook-floating.css'
import './styles/hud-bar.css'
import './styles/inventory-popup.css'

// 游戏引擎
import gameEngine from './core/game-engine.js'

// 场景
import LandingScene from './pages/landing.js'
import MenuScene from './pages/menu.js'
import PrologueScene from './pages/prologue.js'
import Chapter1PaintScene from './pages/chapter1-paint.js'
import Chapter1WorkshopScene from './pages/chapter1-workshop.js'
import { createChapterPlaceholderScene } from './pages/chapter-placeholder.js'

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
gameEngine.sceneManager.register('chapter2', createChapterPlaceholderScene({
  eyebrow: '第二章',
  title: '中园',
  subtitle: '远香堂至小飞虹',
  description: '第二章尚未开放。后续会承接题诗异文与画作来源疑问，补齐中园段落的探索流程。',
}))
gameEngine.sceneManager.register('chapter3', createChapterPlaceholderScene({
  eyebrow: '第三章',
  title: '西园',
  subtitle: '卅六鸳鸯馆至留听阁',
  description: '第三章尚未开放。这里将用于承接墙上草图、低位视角与最终证据链的推进。',
}))
gameEngine.sceneManager.register('finale', createChapterPlaceholderScene({
  eyebrow: '终章',
  title: '第三十一景',
  subtitle: '最终复原仍在筹备',
  description: '终章尚未开放。三结局与修复报告生成逻辑会在核心章节完成后接入。',
}))

// 启动：直接进入着陆页
gameEngine.switchScene('landing')

console.log('[Main] 《卅一景》已启动 — v2 with prologue')
