# 《卅一景》前端实现方案

> 当前前端位于 `Web/`，技术栈为 Vite + 原生 JavaScript + CSS。本文档用于同步当前实现状态、资源约定和后续 MVP 开发顺序。

---

## 一、当前实现状态

### 已实现页面 / 场景

当前注册场景见 `Web/src/main.js`：

- `landing`：着陆页，包含全景背景、项目简介、园林空间 / 古画秘史 / 人物图鉴轮播弹窗。
- `menu`：主菜单，包含章节列表、存档入口、新游戏、继续游戏、清除存档。
- `prologue`：序章完整流程（脚本对话→工具扫描→自由探索→线索发现→辅助讨论→综合研讨→汇聚转场→进入画中）。
- `chapter1`：第一章画中世界场景（`chapter1-paint.js`）。
- `chapter2` / `chapter3` / `finale`：占位场景（`chapter-placeholder.js`），显示章节未开放信息。

### 已实现核心模块

| 文件 | 职责 |
|------|------|
| `core/game-engine.js` | 全局状态、事件总线、场景切换、世界主题、AI 上下文 |
| `core/scene-manager.js` | 场景注册与生命周期切换 |
| `core/inventory.js` | 物件匣数据管理 |
| `core/hint-system.js` | 基于计时/次数的渐进提示 |
| `core/dialogue.js` | 对话序列播放 |
| `core/save-system.js` | `localStorage` 存档，键名为 `sanyijing-save` |
| `core/ai-service.js` | DeepSeek API 调用封装（5 个对外接口） |
| `core/ai-prompts.js` | AI System Prompt 模板（5 种角色） |
| `core/discussion-gate.js` | 研讨门槛管理器（辅助讨论 + 综合研讨模式） |
| `core/gate-config.js` | 门槛配置（概念/关键词/通过条件/回复池） |
| `core/knowledge-base.js` | 知识片段解锁与格式化（轻量RAG） |
| `core/fallback-dialogues.js` | 离线对话降级文案 |

### 已实现组件

| 文件 | 职责 | 状态 |
|------|------|------|
| `components/painting-viewer.js` | 古画查看器（缩放/拖拽/工具滤镜/线索判定/渐进提示/汇聚动画） | 现役 |
| `components/narration-bar.js` | 叙事对话框（立绘在左侧/打字机/旁白态/选项分支） | 现役 |
| `components/notebook-floating.js` | 悬浮笔记本面板（AI对话/记录Tab/快捷按钮/工具区/研讨态） | 现役 |
| `components/hud-bar.js` | 右下角HUD按钮栏（📓📦） | 现役 |
| `components/inventory-popup.js` | 物件匣弹出浮层 | 现役 |
| `components/fall-transition.js` | 跌入画中转场动画 | 现役 |
| `components/transition.js` | 通用转场动画 | 现役 |
| `components/gate-panel.js` | 研讨全屏面板 | 已废弃，由 notebook-floating 研讨态替代 |
| `components/scanner-ui.js` | 扫描工具 UI | 已废弃，工具迁入 notebook-floating |
| `components/prologue-dock.js` | 序章对话坞 | 已废弃，由 narration-bar 替代 |
| `components/chat-panel.js` | 周鹤年对话面板 | 已废弃，由 notebook-floating 替代 |
| `components/notebook-panel.js` | 旧AI笔记本 | 已废弃，由 notebook-floating 替代 |
| `components/clue-explorer.js` | 线索探索器 | 已废弃，由 painting-viewer 替代 |
| `components/clue-popup.js` | 线索弹窗 | 已废弃，由 painting-viewer 替代 |

### 已实现数据文件

| 文件 | 职责 |
|------|------|
| `data/knowledge-snippets.js` | 知识片段数据源（按章节/进度解锁） |

### 已实现样式

| 文件 | 内容 | 状态 |
|------|------|------|
| `styles/index.css` | 全局样式、双世界主题变量 | 现役 |
| `styles/transitions.css` | 转场动画样式 | 现役 |
| `styles/painting-viewer.css` | 古画查看器样式 | 现役 |
| `styles/narration-bar.css` | 叙事对话框样式 | 现役 |
| `styles/notebook-floating.css` | 悬浮笔记本面板样式 | 现役 |
| `styles/hud-bar.css` | HUD按钮栏样式 | 现役 |
| `styles/inventory-popup.css` | 物件匣弹出浮层样式 | 现役 |
| `styles/gate-panel.css` | 研讨全屏面板样式 | 已废弃 |
| `styles/prologue-dock.css` | 序章对话坞样式 | 已废弃 |

---

## 二、资源目录约定

正式运行中使用的图片统一放在：

```text
Web/public/images/
```

代码中使用 Vite public 静态路径引用：

```js
const bgImage = '/images/landing-panorama.png'
```

`TestPic/` 仅作为过程图片、生成图和临时参考图目录，不作为正式代码引用目录。

---

## 三、AI 功能状态

### DeepSeek 接入

- 模型：`deepseek-chat`
- 接口：`https://api.deepseek.com/chat/completions`
- API Key：通过 `Web/.env` 中的 `VITE_DEEPSEEK_API_KEY` 配置
- 前端直连：MVP / 路演阶段前端直调 API

### 已实现能力

| 接口 | 用途 | 对话模式 |
|------|------|---------|
| `chatWithZhou` | 周鹤年现实世界多轮对话 | 多轮 |
| `discussWithZhou` | 研讨门槛中周鹤年引导对话 | 多轮（含 systemHint） |
| `queryNotebook` | 笔记本查阅（画中世界） | 单轮 |
| `generateAnnotation` | 事件驱动生成沈念批注 | 单轮 |
| `generateReport` | 终章结局文本生成 | 单轮 |

### 知识约束（轻量RAG）

- `data/knowledge-snippets.js` 定义知识片段，按章节/进度解锁
- `core/knowledge-base.js` 负责解锁判断与格式化注入 AI prompt
- AI 只能基于已解锁的知识片段回答

### 降级策略

- 未配置 API Key 时：显示明确降级文案
- API 调用失败时：显示叙事化降级文案
- 研讨门槛离线时：使用预写回复池（affirmPool/hintPool/correctionPool）轮询

---

## 四、当前项目结构

```text
Web/
├── package.json
├── vite.config.js
├── index.html
├── .env                          ← API Key（不提交）
├── server/                       ← Express 后端（可选代理）
├── public/
│   └── images/
└── src/
    ├── main.js
    ├── core/
    │   ├── game-engine.js
    │   ├── scene-manager.js
    │   ├── inventory.js
    │   ├── hint-system.js
    │   ├── dialogue.js
    │   ├── save-system.js
    │   ├── ai-service.js
    │   ├── ai-prompts.js
    │   ├── discussion-gate.js
    │   ├── gate-config.js
    │   ├── knowledge-base.js
    │   └── fallback-dialogues.js
    ├── data/
    │   └── knowledge-snippets.js
    ├── components/
    │   ├── painting-viewer.js
    │   ├── narration-bar.js
    │   ├── notebook-floating.js
    │   ├── hud-bar.js
    │   ├── inventory-popup.js
    │   ├── fall-transition.js
    │   ├── transition.js
    │   ├── gate-panel.js          ← deprecated
    │   ├── scanner-ui.js          ← deprecated
    │   ├── prologue-dock.js       ← deprecated
    │   ├── chat-panel.js          ← deprecated
    │   ├── notebook-panel.js      ← deprecated
    │   ├── clue-explorer.js       ← deprecated
    │   └── clue-popup.js          ← deprecated
    ├── pages/
    │   ├── game-scene.js
    │   ├── landing.js
    │   ├── menu.js
    │   ├── prologue.js
    │   ├── chapter1-paint.js
    │   └── chapter-placeholder.js
    └── styles/
        ├── index.css
        ├── transitions.css
        ├── painting-viewer.css
        ├── narration-bar.css
        ├── notebook-floating.css
        ├── hud-bar.css
        ├── inventory-popup.css
        ├── gate-panel.css         ← deprecated
        └── prologue-dock.css      ← deprecated
```

---

## 五、已完成改动

详见 `当前改动计划/已通过/` 目录：

1. **UI 重构**（已完成）：叙事对话框 NarrationBar（底部55%宽居中，古色风格，立绘在对话框左侧）+ 悬浮笔记本面板 NotebookFloating（右侧360px可收缩）+ HUD按钮栏 HudBar（📓📦），替代旧 PrologueDock
2. **综合门槛**（已完成）：三线索集齐后在笔记本面板内进行综合研讨，前端关键词累积匹配通过
3. **知识约束**（已完成）：轻量 RAG，按进度解锁知识片段注入 AI prompt

---

## 六、MVP 后续实现顺序

1. ~~UI 重构~~ ✓
2. ~~综合研讨门槛~~ ✓
3. ~~知识约束系统~~ ✓
4. 第一章 · 东园：兰雪堂 / 缀云峰 / 芙蓉榭水面倒影谜题（水面线翻转）
5. 第二章 · 中园：远香堂诗词比对谜题
6. 第三章 · 西园：残砚显线、断簪揭灰、墙面草图显现
7. 终章 · 第三十一景：四问复原与三结局
8. 完整走查：存档、提示、物件匣、AI 面板、关闭 AI 后的兜底流程

---

## 七、验证方式

开发启动：

```bash
cd Web
npm install
npm run dev
```

构建检查：

```bash
cd Web
npm run build
```

每次前端改动后至少验证：

- 页面能启动
- `npm run build` 通过
- 相关图片从 `Web/public/images/` 加载
- 新增场景已在 `Web/src/main.js` 注册
- 关闭或缺少 API Key 时，AI 面板有可理解的降级反馈
