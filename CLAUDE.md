# 《卅一景》项目说明

## 项目性质

文人悲情 / 双世界解谜 / 园林视角探秘 —— 互动叙事游戏。
以文徵明《拙政园三十一景图》与苏州拙政园为叙事支点，玩家扮演古画修复研究生沈念，在"现实修复工作室"与"画中拙政园"之间穿梭，复原被历史遮蔽的空间视角。

## 核心逻辑（不可违背）

第三十一景的画面保留了王蘅发现的低位视角；文徵明以自己的笔保存了她的眼睛。后人并没有重画此景，而是在重装、配边、归档过程中遮蔽了说明这个视角来源的边注、题签、辅助线和残字。玩家要找回的不是一幅失踪的画，而是被正式作品体系吸收掉的观看来源。

## 已拍板的剧情基准

1. **画心即低视角成稿**：来源痕迹全归王蘅本人留下，文徵明完成画心时保留但未另写来源说明。
2. **单向"见证"框架**：王蘅的回声不指认当下的"你"，只是等了五百年的确认落了地。
3. **王蘅动机**："要被见证，不要被正名"——"不必有名，不必有形。只要有痕迹。"

## 目录结构

```
卅一景/
├── CLAUDE.md                           # 项目说明（本文件）
├── AGENTS.md                           # Agent 配置
├── PRODUCT.md                          # 产品文档
├── README.md                           # 项目 README
├── TestPic/                            # 过程图片 / 生成图 / 临时参考图
├── Web/                                # Vite 前端原型
│   ├── package.json                    # 前端脚本与依赖
│   ├── .env                            # 本地环境变量（DeepSeek API Key）
│   ├── implementation_plan.md          # 前端实现方案
│   ├── index.html                      # 应用入口 HTML
│   ├── server/                         # Express 后端（AI 代理，可选）
│   ├── public/                         # 正式静态资源
│   │   └── images/                     # 正式使用的背景图 / 场景图
│   └── src/                            # 前端源码
│       ├── main.js                     # 应用入口
│       ├── core/                       # 引擎 / 场景 / 背包 / 提示 / 对话 / 存档 / AI
│       │   ├── game-engine.js           # 游戏状态机 & 场景管理器
│       │   ├── scene-manager.js         # 场景切换控制
│       │   ├── inventory.js             # 物件匣系统
│       │   ├── hint-system.js           # 提示系统
│       │   ├── dialogue.js              # 对话系统
│       │   ├── save-system.js           # 存档系统 (localStorage)
│       │   ├── ai-service.js            # DeepSeek API 封装（AI 统一调用层）
│       │   ├── ai-prompts.js            # AI System Prompt 模板（五种角色）
│       │   ├── discussion-gate.js       # 研讨门槛管理器
│       │   ├── gate-config.js           # 研讨门槛配置（概念/关键词/通过条件）
│       │   ├── knowledge-base.js        # 知识片段解锁与格式化（轻量RAG）
│       │   └── fallback-dialogues.js    # 离线对话降级
│       ├── data/                        # 数据文件
│       │   └── knowledge-snippets.js    # 知识片段数据源（按章节/进度解锁）
│       ├── pages/                      # 页面场景
│       │   ├── game-scene.js            # 场景基类
│       │   ├── landing.js               # 着陆页
│       │   ├── menu.js                  # 主菜单
│       │   ├── prologue.js              # 序章场景
│       │   ├── chapter1-paint.js        # 第一章画中世界
│       │   └── chapter-placeholder.js   # 章节占位（二/三/终章）
│       ├── components/                 # 通用组件
│       │   ├── transition.js            # 转场动画组件
│       │   ├── fall-transition.js       # 跌入画中转场
│       │   ├── painting-viewer.js       # 古画查看器（缩放/拖拽/滤镜/线索/渐进提示）
│       │   ├── narration-bar.js         # 叙事对话框（立绘/打字机/旁白态）
│       │   ├── notebook-floating.js     # 悬浮笔记本面板（对话/记录/工具/研讨态）
│       │   ├── hud-bar.js              # 右下角HUD按钮栏（📓📦）
│       │   ├── inventory-popup.js       # 物件匣弹出浮层
│       │   ├── gate-panel.js            # 研讨全屏面板（已废弃，由notebook-floating研讨态替代）
│       │   ├── scanner-ui.js            # 扫描工具 UI（已废弃，工具迁入notebook-floating）
│       │   ├── clue-explorer.js         # 线索探索器（已废弃，由 painting-viewer 替代）
│       │   ├── clue-popup.js            # 线索弹窗（已废弃，由 painting-viewer 替代）
│       │   ├── prologue-dock.js         # 序章对话坞（已废弃，由 narration-bar 替代）
│       │   ├── chat-panel.js            # 周鹤年对话面板（已废弃，由 notebook-floating 替代）
│       │   └── notebook-panel.js        # 旧AI笔记本（已废弃，由 notebook-floating 替代）
│       └── styles/                     # 样式文件
│           ├── index.css                # 全局样式与双世界主题变量
│           ├── transitions.css          # 转场动画样式
│           ├── painting-viewer.css      # 古画查看器样式
│           ├── narration-bar.css        # 叙事对话框样式
│           ├── notebook-floating.css    # 悬浮笔记本面板样式
│           ├── hud-bar.css             # HUD按钮栏样式
│           ├── gate-panel.css           # 研讨全屏面板样式（已废弃）
│           └── prologue-dock.css        # 序章对话坞样式（已废弃）
├── 总分工文档/
│   ├── story_02_卅一景_剧情大纲.md      # 故事设定（人物/梗概/主线/真相/结局）
│   ├── 卅一景_chapter_design.md        # 章节细纲（叙事节拍/NPC 对话/张力设计）
│   ├── 剧情质疑与解释清单.md            # 常见质疑 / 世界观 / 证据链解释
│   ├── 谜题_场景_线索表设计.md          # 谜题机制/场景地图/物件线索表
│   ├── 前端_交互_背包设计.md            # 界面风格/转场/交互层/物件匣 UI
│   └── AI_提示词_后端数据设计.md        # AI 功能/提示词/状态变量/存档
├── 分章节实现文档/
│   ├── 序章_残页_玩法设计.md            # 序章玩法详案
│   └── 序章_残页_场景制作.md            # 序章场景制作
├── 当前改动计划/                        # 改动计划文档
│   ├── AI面板宽度与自动滚动调整.md
│   ├── 测试快进按键设计.md
│   └── 已通过/                         # 已实施完成的计划
│       ├── UI重构_叙事层与AI对话层分离.md
│       ├── 序章综合研讨门槛_强制AI推理通过.md
│       └── AI知识约束_轻量RAG方案.md
└── 备选故事/
    ├── story_01_石中记.md              # 备选方案 1
    └── story_03_四时园.md              # 备选方案 3
```

## 文档分工

| 文档 / 目录                     | 负责方向                                   |
| ------------------------------- | ------------------------------------------ |
| story_02 + chapter_design       | 剧情统筹（主题/世界观/真相/人物/开头结局） |
| 剧情质疑与解释清单              | 历史虚构边界 / 机制解释 / 证据链自洽       |
| 总分工文档/谜题_场景_线索表     | 谜题设计 / 场景地图 / 线索表               |
| 总分工文档/前端_交互_背包       | 前端页面 / 交互方式 / 物件匣 / AI 面板 UI  |
| 总分工文档/AI_提示词_后端数据   | AI 功能 / 提示词 / 后端数据                |
| 分章节实现文档/                 | 各章节的玩法详案和场景制作文档             |
| 当前改动计划/                   | 待实施/已通过的改动方案（实施前审批用）   |
| Web                             | 可运行前端原型 / 游戏引擎 / AI 模块        |

## 当前前端状态

- 前端目录为 `Web/`，技术栈为 Vite + 原生 JavaScript / CSS。
- 当前注册场景：`landing`、`menu`、`prologue`、`chapter1`（画中世界）、`chapter2`/`chapter3`/`finale`（占位）。
- 已有核心模块：`game-engine`、`scene-manager`、`inventory`、`hint-system`、`dialogue`、`save-system`、`ai-service`、`ai-prompts`、`discussion-gate`、`gate-config`、`knowledge-base`、`fallback-dialogues`。
- 已有组件：`painting-viewer`（古画查看器，含缩放/拖拽/滤镜/线索探索/渐进提示）、`narration-bar`（叙事对话框）、`notebook-floating`（悬浮笔记本面板，AI对话+记录+工具区+研讨态）、`hud-bar`（右下角HUD按钮）、`inventory-popup`（物件匣弹出浮层）、`fall-transition`（跌入转场）、`gate-panel`（研讨全屏面板，已废弃，由notebook-floating研讨态替代）。
- AI 接入 DeepSeek，API Key 通过 `Web/.env` 中的 `VITE_DEEPSEEK_API_KEY` 配置。
- 正式图片集中放在 `Web/public/images/`，代码中使用 `/images/文件名` 引用。
- `TestPic/` 只作为过程图片、生成图和临时参考图目录，不作为正式代码引用目录。
- 如需启动前端，先进入 `Web/`，安装依赖后运行 `npm run dev`。

## 已完成改动（见 `当前改动计划/已通过/`）

1. **UI重构**（已完成）：叙事对话框 NarrationBar（底部55%宽居中，古色风格，含立绘）+ 悬浮笔记本面板 NotebookFloating（右侧360px可收缩，含对话/记录Tab+工具区+研讨态）+ HUD按钮栏 HudBar（📓📦），替代旧 PrologueDock。游戏画面100%全屏。
2. **综合门槛**（已完成）：三线索集齐后玩家主动点击按钮触发，在笔记本面板内进行综合研讨（Tab改名"综合研讨"），前端关键词累积匹配通过后结论摘要记入笔记本。
3. **知识约束**（已完成）：轻量RAG（`knowledge-snippets.js` + `knowledge-base.js`），按进度解锁知识片段注入prompt，AI只能基于已注入内容回答。

## 待实施改动（见 `当前改动计划/`）

1. **AI面板宽度与自动滚动调整**
2. **测试快进按键设计**

## 章节结构

序章 · 残页 → 第一章 · 东园 → 第二章 · 中园 → 第三章 · 西园 → 终章 · 第三十一景（三结局）

## 协作约定

- 王蘅为虚构人物，不做历史考证式写法
- 所有叙事修改须确认是否触及三基准；触及则须剧情统筹确认
- 谜题/前端/后端文档各自独立维护，叙事节拍中以锚点指向谜题文档
- 前端实现应优先遵循 `总分工文档/前端_交互_背包设计.md` 与 `Web/implementation_plan.md`
- 修改前端时避免破坏已拍板剧情基准，涉及叙事文案的改动需回看 `总分工文档/story_02_卅一景_剧情大纲.md` 与 `总分工文档/卅一景_chapter_design.md`
- AI Prompt 修改须回看 `总分工文档/AI_提示词_后端数据设计.md`，确保与提示系统约束一致
- AI 面板统一为"修复笔记本"身份（非人格化），可包含"周老师批注"做引导；周鹤年当面对话仅出现在叙事对话框中；综合研讨中AI以"预置批注浮现"形式介入（非实时对话）
- 正式图片统一放入 `Web/public/images/`；过程图、临时图保留在 `TestPic/`
- `.env` 文件中的 API Key 不得提交到代码仓库
- 所有改动在实施前须先在 `当前改动计划/` 目录下创建计划文档，审批通过后再动代码
