# 《卅一景》项目说明

> 本文件为 AI 编码助手（Cursor / Copilot / Windsurf 等）提供项目上下文。Claude Code 用户请参阅 `CLAUDE.md`。

## 项目概述

文人悲情 / 双世界解谜 / 园林视角探秘 —— Web 互动叙事游戏。

玩家扮演古画修复研究生沈念，在导师周鹤年指导下对文徵明《拙政园三十一景图》进行数字化修复。过程中发现古画的秘密，"跌入"画中拙政园，在现实修复工作室与画中世界之间穿梭，复原被历史遮蔽的空间视角。

王蘅为虚构人物，不做历史考证式写法。

## 核心叙事逻辑（不可违背）

第三十一景的画面保留了王蘅发现的低位视角；文徵明以自己的笔保存了她的眼睛。后人并没有重画此景，而是在重装、配边、归档过程中遮蔽了说明这个视角来源的边注、题签、辅助线和残字。玩家要找回的不是一幅失踪的画，而是被正式作品体系吸收掉的观看来源。

**三条剧情基准**（任何叙事修改须确认是否触及；触及则须用户确认）：

1. **画心即低视角成稿**：来源痕迹全归王蘅本人留下，文徵明完成画心时保留但未另写来源说明。
2. **单向"见证"框架**：王蘅的回声不指认当下的"你"，只是等了五百年的确认落了地。
3. **王蘅动机**："要被见证，不要被正名"——"不必有名，不必有形。只要有痕迹。"

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端构建 | Vite 8.x |
| 前端语言 | 原生 JavaScript (ES Modules) + 原生 CSS，无框架 |
| 后端 | Node.js + Express 4.x |
| AI 服务 | DeepSeek API (`deepseek-v4-pro`)，通过 Express 代理转发 |
| 存储 | localStorage（存档系统） |
| 字体 | Noto Serif SC / LXGW WenKai / ZCOOL XiaoWei (Google Fonts) |

未经明确要求，不引入额外框架、遥测、分析或网络请求。

## 章节结构

```
序章 · 残页 → 第一章 · 东园 → 第二章 · 中园 → 第三章 · 西园 → 终章 · 第三十一景（三结局）
```

每章分为"画中世界"(paint) 和"现实工作室复盘"(workshop) 两个子场景。

## 目录结构

```
Web/                                # 前端项目根目录
├── index.html                      # 应用入口 HTML
├── package.json                    # 前端依赖（仅 vite）
├── vite.config.js                  # Vite 配置（/api 代理到 localhost:8787）
├── server/                         # Express 后端（AI 代理）
│   ├── index.js                    # 后端入口（/api/health + /api/chat）
│   ├── package.json                # 后端依赖（express, cors, dotenv, express-rate-limit）
│   ├── .env.example                # 环境变量模板
│   └── .gitignore                  # 排除 .env / node_modules
├── public/                         # 静态资源
│   └── images/                     # 场景背景图 / 立绘（按章节子目录组织）
│       ├── common/                 # 着陆页背景、菜单背景、卷轴UI、角色立绘
│       ├── prologue/               # 序章：工作室、古画扫描件
│       ├── chapter1/               # 第一章：兰雪堂、缀云峰、芙蓉榭
│       ├── chapter2/               # 第二章：远香堂、小飞虹、残砚
│       ├── chapter3/               # 第三章：鸳鸯馆、留听阁、草图
│       └── finale/                 # 终章：真相空间、完成画面、结局
└── src/
    ├── main.js                     # 应用入口：初始化引擎、注册场景
    ├── core/                       # 核心系统
    │   ├── game-engine.js          # 游戏状态机 & 事件总线，协调所有子系统
    │   ├── scene-manager.js        # 场景注册与切换（含转场动画控制）
    │   ├── inventory.js            # 物件匣系统
    │   ├── hint-system.js          # 渐进式提示系统（超时后以批注形式呈现）
    │   ├── dialogue.js             # 对话系统（打字机逐字显示 + 分支选项）
    │   ├── save-system.js          # 存档系统（localStorage, key: sanyijing-save）
    │   ├── ai-service.js           # AI 统一调用层（chatWithZhou / queryNotebook / generateAnnotation / generateFinalNote）
    │   ├── ai-prompts.js           # AI System Prompt 模板（五种角色，动态拼接游戏状态）
    │   ├── discussion-gate.js      # 研讨门槛管理器（玩家自由输入 + 关键词匹配判定）
    │   ├── gate-config.js          # 门槛配置数据（概念/同义词/通过条件/回复池）
    │   ├── knowledge-base.js       # 知识片段解锁与格式化（轻量 RAG）
    │   └── fallback-dialogues.js   # 离线对话降级
    ├── data/
    │   └── knowledge-snippets.js   # 知识片段数据源（按章节/进度解锁）
    ├── pages/                      # 场景页面
    │   ├── game-scene.js           # 场景基类（背景层/遮罩/打字机/热点系统）
    │   ├── landing.js              # 着陆页
    │   ├── menu.js                 # 主菜单（卷轴式章节选择）
    │   ├── prologue.js             # 序章：工作室 → 古画检测（三工具三线索）→ 跌入画中
    │   ├── chapter1-paint.js       # 第一章画中：兰雪堂 → 缀云峰 → 芙蓉榭 + 倒影谜题
    │   ├── chapter1-workshop.js    # 第一章工作室复盘
    │   ├── chapter2-paint.js       # 第二章画中：远香堂 + 诗词比对谜题 → 小飞虹
    │   ├── chapter2-workshop.js    # 第二章工作室复盘
    │   ├── chapter3-paint.js       # 第三章画中：鸳鸯馆南北厅 → 留听阁封墙谜题
    │   ├── chapter3-workshop.js    # 第三章工作室复盘
    │   └── finale.js               # 终章：真相空间 → 四问 → 画面补全 → 回声 → 三结局
    ├── components/
    │   ├── painting-viewer.js      # 古画查看器（缩放/拖拽/三种工具/线索命中/呼吸光斑提示）
    │   ├── narration-bar.js        # 叙事对话条（底部居中，立绘/打字机/选项分支/旁白态）
    │   ├── notebook-floating.js    # 浮动笔记本（右侧，对话/记录Tab + 工具区 + 研讨态）
    │   ├── hud-bar.js              # HUD 按钮栏（笔记本 + 物件匣入口）
    │   ├── inventory-popup.js      # 物件匣弹出浮层
    │   ├── poem-compare.js         # 诗词比对组件（第二章：竖排分栏，逐字点击找异文）
    │   ├── overlay-text.js         # 画面文字覆盖层（水墨渗出/沉静浮现/纸面渐显等动画）
    │   ├── transition.js           # 转场动画（墨迹扩散/卷轴展开）
    │   └── fall-transition.js      # 跌入画中专用转场（五阶段动画）
    └── styles/                     # 样式文件（与组件/页面一一对应）
        ├── index.css               # 全局样式与双世界主题变量
        └── ...                     # painting-viewer / narration-bar / notebook-floating 等
```

## 架构概要

**引擎-场景-组件** 三层架构：

- **GameEngine** 是中央协调器，持有所有子系统（SceneManager / Inventory / HintSystem / DialogueSystem / SaveSystem / AIService / DiscussionGateManager），通过事件总线 (`on`/`emit`) 通信。
- **SceneManager** 管理场景生命周期，场景类实现 `enter()`/`exit()` 接口。支持多种转场：墨迹扩散（跌入画中）、卷轴展开（章节间）、褪色（画中退场）。
- 每个场景页面内部通过 `SCENE_STATES` 状态机管理多段叙事子场景。
- 场景容器自动切换 `real-world` / `paint-world` CSS 类，驱动双世界视觉主题。

**AI 系统架构**：前端 → Express 代理 (`/api/chat`) → DeepSeek API。前端不持有 API Key。后端不可用时降级为离线模式（预写回复池）。

**知识约束**（轻量 RAG）：`knowledge-snippets.js` 定义按章节/进度解锁的知识片段 → `knowledge-base.js` 按当前进度过滤并注入到 AI prompt → AI 只能基于已注入内容回答。

**研讨门槛**：不做选择题，玩家自由输入文字表达理解 → 前端通过关键词匹配判定推理合理性 → 通过后结论摘要记入笔记本。

## 关键物件

| 物件 | 获得时机 | 特征 |
|------|----------|------|
| 修复笔记本 | 序章开始 | 贯穿全程，记录发现 |
| 断簪 | 第一章芙蓉榭 | 银质，半朵芙蓉，刻"蘅"字 |
| 残砚 | 第二章远香堂 | 端砚，残留朱砂 |
| 草图拓片 | 第三章留听阁 | 封墙后的草图 |
| 王蘅的信 | 终章 | 最终揭示 |

## 启动方式

```bash
# 前端开发服务器（localhost:5173）
cd Web && npm install && npm run dev

# AI 后端代理（localhost:8787）
cd Web/server && npm install && npm start
# 需在 Web/server/.env 中配置 DEEPSEEK_API_KEY
```

## 开发约定

- **API Key 安全**：真实 Key 只放 `Web/server/.env`（已 gitignore），前端不持有。
- **图片管理**：正式图放 `Web/public/images/`，代码中用 `/images/路径` 引用。
- **AI 面板身份**：统一为"修复笔记本"（非人格化），可含"周老师批注"引导。周鹤年当面对话仅出现在叙事对话框（NarrationBar）。
- **改动审批**：所有改动须先在 `当前改动计划/` 目录下创建计划文档，审批通过后再动代码。
- **叙事修改**：涉及叙事文案时，须回看 `总分工文档/story_02_卅一景_剧情大纲.md` 与 `总分工文档/卅一景_chapter_design.md`。
- **AI Prompt 修改**：须回看 `总分工文档/AI_提示词_后端数据设计.md`，确保与提示系统约束一致。
