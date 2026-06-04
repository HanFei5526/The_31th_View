# 《卅一景》前端游戏实现方案

> 基于游戏设计文档，构建一个以叙事驱动的解谜冒险游戏前端，涵盖着陆页、主菜单页和全部5个游戏场景。

## 概述

《卅一景》是一款以明代拙政园为背景的叙事解谜游戏。玩家扮演古画修复师的学生，在"现实工作室"与"画中世界"之间穿梭，通过解谜逐步揭开一位被历史遗忘的女画者——王蘅——的痕迹。

---

## User Review Required

> [!IMPORTANT]
> **技术选型确认**：计划使用 **Vite + 原生 JavaScript + CSS**，不使用 React/Vue 等框架。游戏逻辑通过自定义状态机和场景管理器实现。是否同意？

> [!IMPORTANT]
> **美术资产使用**：项目中已有水墨风格美术资产（`美术资产/` 目录）。计划将这些图片用于游戏背景和场景切换。部分场景如需额外图片，将使用 AI 生成工具创建。

> [!WARNING]
> **MVP 范围**：根据设计文档附录E的优先级，本次实现聚焦🔴必须实现项 + 主页/着陆页。🟡可简化项以纯文本方式呈现，🟢后置项暂不实现。

---

## Open Questions

~~已确认：全中文界面，MVP 不加音效。~~

---

## 设计系统

### 双色调体系

游戏核心视觉围绕两个世界切换：

| 世界 | 色调 | 字体风格 | 氛围 |
|------|------|---------|------|
| **现实世界**（修复工作室） | 冷蓝灰 `#1a1f2e` → `#2d3748` | 衬线体（Noto Serif SC / 思源宋体） | 数字扫描仪、冷光、精密 |
| **画中世界**（明代拙政园） | 暖旧黄 `#f5e6c8` → `#d4a574` | 手写衬线体（LXGW WenKai / 霞鹜文楷） | 水墨淡彩、宣纸质感、朦胧 |

### 转场动画

- **跌入画中**：冷蓝色 → 暖黄色渐变，伴随墨迹扩散粒子效果
- **返回现实**：画面褪色如墨迹洇水，色彩逐渐冷却
- **章节切换**：卷轴展开/收合动画

### 核心 CSS 变量

```css
:root {
  /* 现实世界 */
  --real-bg: #1a1f2e;
  --real-surface: #2d3748;
  --real-text: #e2e8f0;
  --real-accent: #63b3ed;
  --real-glow: rgba(99, 179, 237, 0.3);
  
  /* 画中世界 */
  --paint-bg: #f5e6c8;
  --paint-surface: #ede0c8;
  --paint-text: #3d2b1f;
  --paint-accent: #8b4513;
  --paint-ink: #2c1810;
  --paint-vermillion: #c84032;
  
  /* 过渡 */
  --transition-slow: 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-medium: 0.6s ease;
}
```

---

## 项目结构

```
e:\Vibe_Coding\卅一景\
├── index.html                  # 入口 HTML
├── package.json
├── vite.config.js
├── public/
│   └── assets/                 # 静态资产（从美术资产复制/优化）
│       ├── images/
│       └── fonts/
├── src/
│   ├── main.js                 # 应用入口
│   ├── styles/
│   │   ├── index.css           # 全局样式 & 设计系统
│   │   ├── landing.css         # 着陆页样式
│   │   ├── menu.css            # 主菜单样式
│   │   ├── game.css            # 游戏场景通用样式
│   │   ├── real-world.css      # 现实世界样式
│   │   ├── paint-world.css     # 画中世界样式
│   │   └── transitions.css     # 转场动画样式
│   ├── core/
│   │   ├── game-engine.js      # 游戏状态机 & 场景管理器
│   │   ├── scene-manager.js    # 场景切换控制
│   │   ├── inventory.js        # 物件匣系统
│   │   ├── hint-system.js      # 提示系统
│   │   ├── dialogue.js         # 对话系统
│   │   ├── save-system.js      # 存档系统 (localStorage)
│   │   └── audio.js            # 音频管理（预留）
│   ├── components/
│   │   ├── dialogue-box.js     # 对话框组件
│   │   ├── inventory-panel.js  # 物件匣面板
│   │   ├── hint-notebook.js    # 笔记本/提示组件
│   │   ├── toolbar.js          # 工具栏组件
│   │   ├── transition.js       # 转场动画组件
│   │   └── choices.js          # 选项选择组件
│   ├── pages/
│   │   ├── landing.js          # 着陆页
│   │   └── menu.js             # 主菜单
│   └── scenes/
│       ├── prologue/           # 序章·残页
│       │   ├── prologue.js     # 序章主逻辑
│       │   └── scan-puzzle.js  # 扫描比对谜题
│       ├── chapter1/           # 第一章·东园
│       │   ├── chapter1.js     # 第一章主逻辑
│       │   ├── lanxue-hall.js  # 兰雪堂场景
│       │   └── reflection.js   # 水面倒影谜题
│       ├── chapter2/           # 第二章·中园
│       │   ├── chapter2.js     # 第二章主逻辑
│       │   └── poem-compare.js # 诗词比对谜题
│       ├── chapter3/           # 第三章·西园
│       │   ├── chapter3.js     # 第三章主逻辑
│       │   └── mural.js        # 壁画显现谜题
│       └── finale/             # 终章·第三十一景
│           ├── finale.js       # 终章主逻辑
│           ├── questions.js    # 四问复原视角
│           └── endings.js      # 三结局
```

---

## Proposed Changes

### 1. 基础设施

#### [NEW] [package.json](file:///e:/Vibe_Coding/卅一景/package.json)
- Vite 项目配置
- 开发依赖：vite

#### [NEW] [vite.config.js](file:///e:/Vibe_Coding/卅一景/vite.config.js)
- Vite 基本配置，指定 src 入口

#### [NEW] [index.html](file:///e:/Vibe_Coding/卅一景/index.html)
- 单页应用入口
- 加载 Google Fonts（LXGW WenKai + Noto Sans SC）
- SEO meta 标签
- 根容器 `#app`

---

### 2. 设计系统 & 样式

#### [NEW] [index.css](file:///e:/Vibe_Coding/卅一景/src/styles/index.css)
- CSS 变量（双世界色彩体系）
- 全局 reset 和基础排版
- 通用工具类

#### [NEW] [landing.css](file:///e:/Vibe_Coding/卅一景/src/styles/landing.css)
- 着陆页全屏水墨动画背景
- 标题动画（墨迹晕染效果）
- 滚动引导

#### [NEW] [menu.css](file:///e:/Vibe_Coding/卅一景/src/styles/menu.css)
- 主菜单古卷轴风格布局
- 章节选择列表（带进度标记）
- 按钮悬浮微动画

#### [NEW] [game.css](file:///e:/Vibe_Coding/卅一景/src/styles/game.css)
- 游戏场景通用布局
- 对话框样式
- 物件匣样式
- 工具栏样式

#### [NEW] [real-world.css](file:///e:/Vibe_Coding/卅一景/src/styles/real-world.css)
- 冷色调数字界面风格
- 扫描仪 UI 模拟
- 现代 HUD 元素

#### [NEW] [paint-world.css](file:///e:/Vibe_Coding/卅一景/src/styles/paint-world.css)
- 宣纸纹理背景
- 水墨淡彩滤镜
- 手写风格 UI 元素

#### [NEW] [transitions.css](file:///e:/Vibe_Coding/卅一景/src/styles/transitions.css)
- 墨迹扩散转场 keyframe
- 世界切换渐变
- 卷轴展开/收合动画

---

### 3. 核心引擎

#### [NEW] [game-engine.js](file:///e:/Vibe_Coding/卅一景/src/core/game-engine.js)
- **GameEngine** 类：全局状态管理
  - 当前章节 / 场景 / 世界（现实/画中）
  - 已收集物件列表
  - 已解锁提示等级
  - 游戏进度标记
- 事件系统：`on()` / `emit()` 发布-订阅模式
- 提供 `switchWorld()`, `advanceScene()`, `collectItem()` 等方法

#### [NEW] [scene-manager.js](file:///e:/Vibe_Coding/卅一景/src/core/scene-manager.js)
- 场景注册与切换
- 场景生命周期：`enter()` → `update()` → `exit()`
- 转场动画触发

#### [NEW] [inventory.js](file:///e:/Vibe_Coding/卅一景/src/core/inventory.js)
- 物件匣数据管理
- 物件：修复笔记本、断簪、残砚、王蘅的信
- `addItem()`, `hasItem()`, `useItem()` 方法

#### [NEW] [hint-system.js](file:///e:/Vibe_Coding/卅一景/src/core/hint-system.js)
- 三级提示系统
- 定时触发（30s / 60s / 90s 无操作）
- 提示以"周鹤年批注"样式弹出

#### [NEW] [dialogue.js](file:///e:/Vibe_Coding/卅一景/src/core/dialogue.js)
- 对话序列播放
- 打字机效果
- 分支选择支持
- 旁白 vs 角色对话样式区分

#### [NEW] [save-system.js](file:///e:/Vibe_Coding/卅一景/src/core/save-system.js)
- localStorage 存档
- 自动存档（每章节切换时）
- 读档 / 新游戏

---

### 4. UI 组件

#### [NEW] [dialogue-box.js](file:///e:/Vibe_Coding/卅一景/src/components/dialogue-box.js)
- 对话框 DOM 渲染
- 角色名 + 头像（周鹤年 / 旁白）
- 点击继续 / 自动播放
- 画中世界用竖排书法风格，现实世界用现代横排

#### [NEW] [inventory-panel.js](file:///e:/Vibe_Coding/卅一景/src/components/inventory-panel.js)
- 物件匣侧滑面板
- 物件卡片（图片 + 描述文字）
- 使用物件拖拽交互

#### [NEW] [hint-notebook.js](file:///e:/Vibe_Coding/卅一景/src/components/hint-notebook.js)
- 笔记本翻页效果
- 显示已获取的线索和提示
- 周鹤年批注手写风格

#### [NEW] [toolbar.js](file:///e:/Vibe_Coding/卅一景/src/components/toolbar.js)
- 场景内工具栏
- 序章：放大镜/纸质分析/侧光照射
- 通用：物件匣按钮、笔记本按钮

#### [NEW] [transition.js](file:///e:/Vibe_Coding/卅一景/src/components/transition.js)
- 转场动画 DOM 控制
- 墨迹扩散 canvas 粒子
- 世界切换色彩渐变

#### [NEW] [choices.js](file:///e:/Vibe_Coding/卅一景/src/components/choices.js)
- 选项卡 UI
- 悬浮犹豫提示
- 终章三结局选择界面

---

### 5. 页面

#### [NEW] [landing.js](file:///e:/Vibe_Coding/卅一景/src/pages/landing.js)
着陆页设计：
- **全屏水墨动画背景**：使用美术资产中的全景图，配合 CSS 滤镜做水墨化处理
- **标题"卅一景"**：墨迹从无到有，一笔一划地显现（CSS animation）
- **副标题**：「一幅五百年前的画 · 一个被遗忘的视角」淡入
- **"进入"按钮**：水墨风格按钮，悬浮时墨迹扩散效果
- **底部**：极简版游戏简介（滚动触发淡入）
- **视差滚动**：多层水墨山水背景

#### [NEW] [menu.js](file:///e:/Vibe_Coding/卅一景/src/pages/menu.js)
主菜单设计：
- **背景**：工作室场景（现实世界色调）
- **章节列表**：卷轴展开式，已完成章节显示小印章
- **按钮**：继续游戏 / 新游戏 / 设置
- **底部**：物件匣预览

---

### 6. 游戏场景

#### [NEW] 序章·残页 (`src/scenes/prologue/`)
- **场景**：修复工作室
- **核心交互**：扫描界面，三个工具按钮（放大镜🔍 / 纸质分析🔬 / 侧光照射💡）
- **谜题**：使用所有工具后，在侧光模式下点击底层墨迹
- **转场**：触发"跌入画中"——墨迹扩散动画，冷蓝→暖黄

#### [NEW] 第一章·东园 (`src/scenes/chapter1/`)
- **兰雪堂**：匾额异常叙事（自动记入笔记本）
- **芙蓉榭·水面倒影谜题**：
  - 上半屏真实亭子 / 下半屏水面倒影
  - 倒影中有断簪，真实中没有
  - 点击倒影 → 提示"倒过来" → 翻转按钮出现 → 画面翻转 → 拾取断簪
- **收集物件**：断簪（刻"蘅"字）

#### [NEW] 第二章·中园 (`src/scenes/chapter2/`)
- **远香堂·诗词比对谜题**：
  - 左右分栏 UI：画中诗 vs 流传版本
  - 5首诗逐字对比，点击标记差异字
  - 答案：画·非·一·人
- **小飞虹**：声音线索（文字+简单动画）
- **收集物件**：残砚

#### [NEW] 第三章·西园 (`src/scenes/chapter3/`)
- **卅六鸳鸯馆**：散落画纸叙事（文字描述）
- **渗字事件**：「看得到吗」三字渐现动画
- **留听阁·壁画显现谜题**：
  - 步骤1：打开物件匣 → 使用残砚 → 靠近墙面 → 朱砂底线显现
  - 步骤2：使用断簪 → 沿轮廓划过 → 灰泥剥落 → 壁画显现
- **收集物件**：王蘅的信

#### [NEW] 终章·第三十一景 (`src/scenes/finale/`)
- **四问复原视角**：
  1. 「谁在看？」— 四选一
  2. 「从哪里看？」— 点击地图位置
  3. 「看见了什么？」— 多选景点
  4. 「为什么不在三十景里？」— 二选一
- **画面逐步填充**：每答对一题，空白画面增加一部分景色
- **三结局**：存档 / 守密 / 续笔 — 各有独立结局文案和画面

---

## 关键交互细节

### 对话系统
- **打字机效果**：每字 50-80ms 间隔显示
- **旁白**：居中，无框，使用 `paint-text` 色 + 透明度动画
- **周鹤年对话**：左对齐，带角色标签，使用现代字体
- **王蘅痕迹**：墨迹渗透效果，文字像从纸背面透出来

### 谜题交互反馈
- **正确操作**：微光闪烁 + 墨迹扩展
- **错误操作**：画面轻微抖动 + 反馈文字（"这个好像不对……"）
- **提示触发**：笔记本边缘闪烁，展开显示周鹤年批注

### 物件使用
- 物件匣图标固定在画面右下角
- 点击打开侧滑面板
- 拖拽物件到场景中使用（或点击物件后点击使用目标）

---

## Verification Plan

### 自动化测试
- 在浏览器中运行 `npm run dev`，手动走完所有场景流程
- 验证每个谜题的交互逻辑
- 测试世界切换转场动画流畅度
- 测试 localStorage 存档/读档功能

### 手动验证
- 着陆页视觉效果和动画
- 每章谜题可解性
- 三个结局均可触发
- 响应式适配（桌面/平板）
- 整体叙事流畅度

---

## 实现顺序

1. **Phase 1**：基础设施（Vite + 设计系统 + 核心引擎）
2. **Phase 2**：着陆页 + 主菜单
3. **Phase 3**：序章场景
4. **Phase 4**：第一章（倒影谜题）
5. **Phase 5**：第二章（诗词比对）
6. **Phase 6**：第三章（壁画显现）
7. **Phase 7**：终章（四问 + 三结局）
8. **Phase 8**：打磨 & 串联测试
