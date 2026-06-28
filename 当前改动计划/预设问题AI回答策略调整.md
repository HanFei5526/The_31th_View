# 预设问题 AI 回答策略调整

## 背景

各章节笔记本会展示预先设计的快捷问题，供玩家点击后继续梳理线索。当前这些快捷问题与玩家自由输入走同一条 AI 接口，后端无法区分它们是否为设计好的引导问题，导致部分含有未完全揭示关键词的问题被直接回复“未找到相关记录”。

## 改动目标

1. 为 `NotebookFloating.showQuickThoughts()` 产生的快捷问题增加“预设问题”标记。
2. 前端调用 `queryNotebook()` 时把该标记传给后端。
3. 后端 prompt 对预设问题使用更柔性的回答规则：
   - 预设问题必须给出可用分析。
   - 如果涉及后续剧情或尚未明确解锁的信息，只能分析已有痕迹的含义。
   - 必须明确说明“目前笔记本中没有更明确的记录/身份指向/结论记录”。
4. 玩家自由输入仍保留原本的边界：无法依据已解锁知识回答时，仍返回“周老师批注：翻了翻，没有找到相关记录。”

## 实施范围

- `Web/src/components/notebook-floating.js`
- `Web/src/core/ai-service.js`
- 普通笔记本问答调用处：
  - `Web/src/pages/prologue.js`
  - `Web/src/pages/chapter1-paint.js`
  - `Web/src/pages/chapter1-workshop.js`
  - `Web/src/pages/chapter2-paint.js`
  - `Web/src/pages/chapter2-workshop.js`
  - `Web/src/pages/chapter3-paint.js`
  - `Web/src/pages/chapter3-workshop.js`
- `Web/server/index.js`

## 不做内容

- 不放宽玩家自由输入。
- 不改综合研讨的通过逻辑。
- 不开放终章自由问答。
