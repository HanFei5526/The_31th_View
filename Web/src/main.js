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
import { createChapterPlaceholderScene } from './pages/chapter-placeholder.js'
import { ChatPanel } from './components/chat-panel.js'
import { NotebookPanel } from './components/notebook-panel.js'

// ==================== 初始化 ====================

const app = document.getElementById('app')
if (!app) {
  console.error('[Main] 找不到 #app 根元素')
  throw new Error('Missing #app element')
}

// 初始化引擎
gameEngine.init(app)

// 初始化 AI 组件并挂载到引擎
const chatPanel = new ChatPanel(gameEngine)
const notebookPanel = new NotebookPanel(gameEngine)
chatPanel.init()
notebookPanel.init()
gameEngine.chatPanel = chatPanel
gameEngine.notebookPanel = notebookPanel

// 注册场景
gameEngine.sceneManager.register('landing', LandingScene)
gameEngine.sceneManager.register('menu', MenuScene)
gameEngine.sceneManager.register('prologue', PrologueScene)
gameEngine.sceneManager.register('chapter1', createChapterPlaceholderScene({
  eyebrow: '第一章',
  title: '东园',
  subtitle: '兰雪堂至芙蓉榭',
  description: '第一章的空间、线索与水面倒影谜题还在搭建中。当前入口先保留为章节占位，避免序章解锁后进入空场景。',
}))
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

// 启动：进入着陆页
gameEngine.switchScene('landing')

console.log('[Main] 《卅一景》已启动 — v2 with prologue')
