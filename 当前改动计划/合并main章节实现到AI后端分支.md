# 合并main章节实现到AI后端分支

## 背景

当前本地运行分支为 `ai-backend-zxy`，该分支只实现到第一章；GitHub 最新 `main` 已合入完整章节实现，包括第二章、第三章和终章页面。需要将 `origin/main` 合并到当前 AI 后端分支，并保留近期 AI 后端与修复笔记本改动。

## 目标

1. 在 `ai-backend-zxy` 分支上合并 `origin/main`。
2. 保留当前已完成的 AI 后端接口、知识约束、`deepseek-v4-flash`、`周老师批注：`格式和通用修复知识逻辑。
3. 处理可能出现的冲突，重点关注：
   - `Web/src/main.js`
   - `Web/src/pages/menu.js`
   - `Web/src/pages/prologue.js`
   - `Web/src/pages/chapter1-paint.js`
   - `Web/src/data/knowledge-snippets.js`
   - `Web/server/index.js`
4. 合并后构建通过，并能继续启动前后端。

## 风险

- 当前工作区已有未提交改动，直接合并会污染冲突状态。
- `main` 中可能改动了第一章和菜单逻辑，需要人工保留双方关键逻辑。

## 操作策略

1. 使用 `git stash push -u` 暂存当前本地改动，建立安全点。
2. 合并 `origin/main` 到 `ai-backend-zxy`。
3. `stash pop` 恢复 AI 改动。
4. 逐文件解决冲突。
5. 运行构建验证。

## 验证

1. `npm run build` 通过。
2. `node --check Web/server/index.js` 通过。
3. `Web/src/main.js` 注册真实 `chapter2`、`chapter3`、`finale` 场景。
