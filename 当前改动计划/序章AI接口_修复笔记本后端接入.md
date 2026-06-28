# 序章AI接口：修复笔记本后端接入

## 背景

序章当前已经以“修复笔记本”为 AI 入口：玩家获取线索后在笔记本中与周老师预置批注进行讨论，三线索集齐后进入综合研讨。现有实现中，AI 调用仍主要由前端 `AIService` 拼装 prompt 并直接请求 DeepSeek；后端 `Web/server/index.js` 只是裸转发 `/api/chat`。

## 目标

1. 序章 AI 调用统一走后端，不在浏览器暴露 DeepSeek API Key。
2. 后端提供修复笔记本语义接口，模型使用 `deepseek-v4-flash`。
3. 后端根据序章进度解锁知识片段，约束模型只能基于已解锁内容回答。
4. 保留现有 `NotebookFloating`、`DiscussionGateManager` 和页面流程，先做低风险接入。
5. AI 身份统一为“修复笔记本 / 周老师预置页边批注”，不是实时人格化 NPC。

## 改动范围

- `Web/server/index.js`
  - 新增 `/api/notebook/message`
  - 内置序章知识片段解锁逻辑
  - 内置序章研讨节点 prompt 策略
  - 默认模型改为 `deepseek-v4-flash`

- `Web/server/README.md`
  - 更新默认模型和新接口说明

- `Web/src/core/ai-service.js`
  - 改为请求后端 `/api/notebook/message`
  - `configure()` 通过 `/api/health` 探测后端可用性
  - 保留现有前端方法名，避免大改页面调用

## 非目标

- 不重写 UI。
- 不迁移完整研讨门槛判定，当前关键词判定仍保留在前端。
- 不实现第一章及后续章节完整 AI 接口。
- 不修改剧情基准，不提前透露王蘅、画中世界或终章真相。

## 验证

1. `npm run build` 通过。
2. `Web/server` 后端 `/api/health` 返回模型为 `deepseek-v4-flash`。
3. 后端不可用或未配置 API Key 时，前端走可理解的降级文案，主流程不断。
