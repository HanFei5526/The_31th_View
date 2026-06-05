# 《卅一景》前端实现方案

> 当前前端位于 `Web/`，技术栈为 Vite + 原生 JavaScript + CSS。本文档用于同步当前实现状态、资源约定和后续 MVP 开发顺序。

---

## 一、当前实现状态

### 已实现页面 / 场景

- `landing`：着陆页，包含全景背景、项目简介、园林空间 / 古画秘史 / 人物图鉴轮播弹窗。
- `menu`：主菜单，包含章节列表、存档入口、新游戏、继续游戏、清除存档。
- `prologue`：序章基础探索，包含画卷残片、放大镜、修复笔记热点；完成后返回菜单并解锁第一章。

当前实际注册场景见 `Web/src/main.js`：

- `landing`
- `menu`
- `prologue`

第一章、第二章、第三章、终章仍是待实现目标，菜单中已有入口配置，但尚未注册对应场景类。

### 已实现核心模块

- `Web/src/core/game-engine.js`：全局状态、事件总线、场景切换、世界主题、AI 上下文。
- `Web/src/core/scene-manager.js`：场景注册与生命周期切换。
- `Web/src/core/inventory.js`：物件匣数据管理。
- `Web/src/core/hint-system.js`：基于计时的渐进提示。
- `Web/src/core/dialogue.js`：对话序列播放。
- `Web/src/core/save-system.js`：`localStorage` 存档，键名为 `sanyijing-save`。
- `Web/src/core/ai-service.js`：DeepSeek API 调用封装。
- `Web/src/core/ai-prompts.js`：AI System Prompt 模板。

### 已实现组件

- `Web/src/components/chat-panel.js`：周鹤年 AI 对话面板，仅现实世界显示。
- `Web/src/components/notebook-panel.js`：AI 笔记本面板，支持批注与画中世界查阅。
- `Web/src/components/transition.js`：转场动画组件。

### 已实现样式

- `Web/src/styles/index.css`：全局样式、双世界主题变量、AI 面板样式。
- `Web/src/styles/transitions.css`：转场动画样式。
- 各页面当前有部分页面级样式注入，后续可按稳定程度再拆分。

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

当前正式图片：

- `Web/public/images/landing-panorama.png`：着陆页全景背景。
- `Web/public/images/menu-gate.png`：主菜单背景。
- `Web/public/images/prologue-bg.png`：序章修复室背景。
- `Web/public/images/menu-test-bg.png`：菜单测试页背景。

`TestPic/` 仅作为过程图片、生成图和临时参考图目录，不再作为正式代码引用目录。

---

## 三、AI 功能状态

AI 功能已经落地，不再只是后续增强项。

### DeepSeek 接入

- 模型：`deepseek-v4-pro`
- 接口：`https://api.deepseek.com/chat/completions`
- API Key：通过 `Web/.env` 中的 `VITE_DEEPSEEK_API_KEY` 配置

### 已实现能力

- `chatWithZhou`：周鹤年现实世界多轮对话。
- `queryNotebook`：画中世界笔记本查阅。
- `generateAnnotation`：根据事件生成沈念批注。
- `generateReport`：终章报告 / 结局文本生成接口。

### 约束

- 未配置 API Key 时，AI 功能显示明确降级文案。
- 周鹤年对话仅限现实世界。
- 画中世界通过笔记本查阅，不以周鹤年身份回答。
- AI 不负责决定谜题答案、控制结局或新增历史事实。
- 固定规则提示仍作为基础兜底，确保关闭 AI 后主线仍可通关。

---

## 四、当前项目结构

```text
Web/
├── package.json
├── package-lock.json
├── vite.config.js
├── index.html
├── menu-test.html
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── images/
│       ├── landing-panorama.png
│       ├── menu-gate.png
│       ├── menu-test-bg.png
│       └── prologue-bg.png
└── src/
    ├── main.js
    ├── style.css
    ├── core/
    │   ├── ai-prompts.js
    │   ├── ai-service.js
    │   ├── dialogue.js
    │   ├── game-engine.js
    │   ├── hint-system.js
    │   ├── inventory.js
    │   ├── save-system.js
    │   └── scene-manager.js
    ├── components/
    │   ├── chat-panel.js
    │   ├── notebook-panel.js
    │   └── transition.js
    ├── pages/
    │   ├── game-scene.js
    │   ├── landing.js
    │   ├── menu.js
    │   └── prologue.js
    └── styles/
        ├── index.css
        └── transitions.css
```

---

## 五、MVP 后续实现顺序

1. 第一章 · 东园：实现兰雪堂 / 芙蓉榭节点与水面倒影翻转谜题，获得断簪。
2. 第二章 · 中园：实现远香堂诗词比对谜题，获得残砚与旧批注残片。
3. 第三章 · 西园：实现残砚显线、断簪揭灰、墙面草图显现，获得王蘅的信与草图拓片。
4. 终章 · 第三十一景：实现四问复原与三结局入口。
5. 串联章节循环：序章入画、章末回现实、继续修复进入下一章。
6. 完整走查：存档、提示、物件匣、AI 面板、关闭 AI 后的兜底流程。

---

## 六、验证方式

开发启动：

```powershell
cd Web
npm install
npm run dev
```

构建检查：

```powershell
cd Web
npm run build
```

每次前端改动后至少验证：

- 页面能启动。
- `npm run build` 通过。
- 相关图片从 `Web/public/images/` 加载。
- 新增场景已在 `Web/src/main.js` 注册。
- 关闭或缺少 API Key 时，AI 面板有可理解的降级反馈。
