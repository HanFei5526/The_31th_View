# 序章综合研讨门槛：强制AI推理通过方案

## Context

当前序章研讨门槛已降级为辅助讨论（发现线索即自动确认，AI参与可选）。用户希望恢复为"强制通过"模式以提高AI参与度。方案：三线索集齐后统一触发一次综合研讨，玩家必须通过前端关键词匹配表达出核心认知才能继续。

**核心认知目标：** "有人系统性地遮蔽了这幅画的来源信息"

---

## 目标流程

```
发现线索 → 立即 markClueRecorded + 笔记本面板可自由讨论(NotebookFloating)
三条全 recorded → 暂停汇聚 → 笔记本面板隐藏 → 弹出 GatePanel(全屏) → 综合研讨
综合门槛通过 → GatePanel卸载 → 笔记本面板恢复 → 汇聚动画 → 点击交会点 → 跌入转场
```

---

## 改动文件清单

### 1. `Web/src/core/gate-config.js`

**新增综合门槛配置 `gate_prologue_synthesis`：**

- 四个概念维度：
  - `systematic`（系统性/有组织）— 关键词：系统、有计划、统一、一起、全部、所有、连在一起、共同、整体、都是、三处、三个、一套、配合、协调
  - `conceal_origin`（遮蔽来源/出处）— 关键词：来源、出处、来历、身份、谁画、作者、归属、从哪来、来路、出自、信息、记录
  - `intentional_act`（有人刻意为之）— 关键词：有人、刻意、故意、蓄意、不是巧合、人为、计划、目的、想要、不想让、不让
  - `erase_evidence`（抹去/消除证据）— 关键词：抹去、消除、销毁、清除、擦掉、去掉、不让人看、不让人知道、遮蔽、隐藏、掩盖、毁掉、删掉
- 通过条件：`(systematic OR intentional_act) AND (conceal_origin OR erase_evidence)`，且轮数 >= 2
- 完整配置包含 opening / passResponse / hintPool / affirmPool / correctionPool / quickThoughts

**新增 `analyzePlayerInputAccumulated` 函数：**

支持跨多轮累积概念命中（区别于现有单轮判定），综合门槛专用。接受已命中历史概念集合，结合当前输入判定。

### 2. `Web/src/components/painting-viewer.js`

**修改 `_checkConvergence`：** 三线索齐时不再自动播放汇聚动画，改为回调 `onAllCluesRecorded?.()`

**新增 `triggerConvergence()` 公开方法：** 供外部在综合门槛通过后调用，启动汇聚动画

**构造参数新增 `onAllCluesRecorded` 回调**

### 3. `Web/src/core/discussion-gate.js`

**新增 `startSynthesisGate(gateId, uiCallback, options)` 方法：** 启动全屏综合门槛（区别于辅助讨论的 startGate）

**新增 `handleSynthesisInput(text)` 方法：** 恢复关键词判定逻辑：
1. 累积匹配概念
2. 判定是否通过（关键词 + 轮数）
3. 通过 → showPassResponse + showConfirmButton
4. 未通过 → AI引导回复（在线）或预写对话树（离线）
5. 兜底：连续5轮未通过 → 显示更强提示的快捷按钮

**新增辅助方法：** `_handleSynthesisPass`、`_buildSynthesisHint`、`_handleSynthesisOffline`

### 4. `Web/src/core/ai-prompts.js`

在 `buildGateZhouPrompt` 的 switch 中补充 `gate_prologue_synthesis` case：
- 引导目标：引导玩家将三条线索综合，得出"有人在重装时系统性地遮蔽了来源信息"
- 允许认知：玩家可以说"有人故意把来源信息全抹了"、"系统性遮蔽"
- 禁区：不说具体是谁做的，不说画中藏着什么秘密

### 5. `Web/src/pages/prologue.js`

**引入 GatePanel 组件**

**新增 `_startSynthesisGate()` 方法：**
1. 关闭正在进行的辅助讨论
2. 笔记本面板 `hide()` 隐藏，HUD 隐藏
3. 弹出 GatePanel（全屏，无关闭按钮）
4. 门槛通过后 → unmount GatePanel → 笔记本面板 `show()` + `expand()` 恢复 → 调用 `triggerConvergence()`

**修改 PaintingViewer 构造参数：** 添加 `onAllCluesRecorded` 回调指向 `_startSynthesisGate`

---

## UI 决策

使用 **GatePanel（全屏面板）** 而非 NotebookFloating：
- 无关闭按钮，天然适配"必须通过"的语义
- 全屏让玩家专注于综合推理
- 视觉层级清晰：日常讨论=笔记本面板（轻量），综合门槛=GatePanel（强制）

---

## 离线降级策略

1. 快捷按钮文本已预设为可直接通过的答案
2. hintPool 三条引导逐步缩小答案范围
3. 连续5轮未通过 → 刷新快捷按钮为更直白的表述
4. 离线模式通过 affirmPool/correctionPool/hintPool 轮询回复

---

## 边界情况

- 玩家在辅助讨论中发现第三条线索：先关闭笔记本对话再启动综合门槛
- GatePanel 重复创建：检查 `_gatePanel` 是否已存在
- 存档恢复：`gameProgress` 中新增 `synthesisPassed: boolean`

---

## 验证方法

1. `npm run build` 确认编译通过
2. `npm run dev` 启动开发服务器
3. 手动测试：
   - 在线模式：找到三线索 → GatePanel弹出 → 输入推断 → AI引导 → 通过 → 汇聚动画
   - 离线模式：移除 .env 中 API Key → 快捷按钮推进 → 通过
   - 边界：辅助讨论中发现第三条线索时的切换
   - 兜底：连续输入无关内容5轮 → 强提示按钮出现
