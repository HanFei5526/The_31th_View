# AI调用安全改造：前端改走后端代理

## Context

当前项目同时存在两套 AI 接入思路：

- `Web/server/index.js` 已实现本地 Express 代理，设计目标是把 `DEEPSEEK_API_KEY` 留在服务端。
- `Web/src/core/ai-service.js` 实际仍直接读取 `VITE_DEEPSEEK_API_KEY`，并在浏览器里请求 `https://api.deepseek.com/chat/completions`。

这会造成两个问题：

1. `VITE_` 环境变量会被 Vite 注入前端包，真实 API Key 在浏览器运行时可见。
2. 已写好的后端代理没有被前端使用，文档与代码行为不一致。

## 修改目标

将 AI 调用统一改为：

```text
前端 ai-service.js
  -> 本地后端 POST /api/chat
  -> DeepSeek 官方 API
```

前端不再持有真实 DeepSeek API Key。

## 涉及文件

计划修改：

| 类型 | 文件 | 目的 |
| --- | --- | --- |
| 修改 | `Web/src/core/ai-service.js` | 移除前端 Key 和直连逻辑，改为请求本地后端代理 |
| 可选修改 | `Web/server/README.md` | 补充前后端联调启动说明 |
| 可选修改 | `总分工文档/AI_提示词_后端数据设计.md` | 同步“API Key 存放”说明 |
| 可选修改 | `Web/implementation_plan.md` | 同步 AI 功能状态，避免计划文档继续误导 |

不修改：

- `Web/.env` 中的真实密钥内容。
- `Web/server/.env` 中的真实密钥内容。
- AI prompt、剧情文案、章节流程。

## 主要改法

### 1. 前端调用后端代理

`AIService._callAPI(messages, options)` 改为：

- 请求相对路径 `/api/chat`，或通过可配置的 `VITE_AI_PROXY_URL` 指向代理地址。
- 请求体保留现有 `messages / temperature / max_tokens`。
- 从后端响应 `{ content }` 中取文本。

### 2. 配置检测逻辑改造

`AIService.configure()` 不再检测 `VITE_DEEPSEEK_API_KEY`。

改为：

- 访问 `/api/health` 检查后端是否可用。
- 如果后端不可用或未配置 Key，则进入离线降级模式。
- 保留当前用户可理解的降级文案。

### 3. 保持调用方接口稳定

以下对外方法不改签名：

- `chatWithZhou`
- `discussWithZhou`
- `queryNotebook`
- `generateAnnotation`
- `generateReport`

这样不影响各章节页面和笔记本组件。

### 4. 后端保持现有职责

`Web/server/index.js` 已有：

- `/api/health`
- `/api/chat`
- CORS 白名单
- 速率限制
- 服务端读取 `DEEPSEEK_API_KEY`

本次优先复用，不做大重构。

## 完成标准

1. 前端源码中不再出现：
   - `import.meta.env.VITE_DEEPSEEK_API_KEY`
   - 浏览器侧 `Authorization: Bearer ${DEEPSEEK_API_KEY}`
   - 前端直连 `https://api.deepseek.com/chat/completions`
2. AI 调用仍由 `AIService` 统一封装，各章节无需改调用方式。
3. 未启动后端、后端未配置 Key、网络失败时，都有明确降级反馈。
4. `Web/.env` 仍被忽略，不提交密钥。
5. 相关文档不再声称前端直接配置真实 DeepSeek Key。

## 验证方法

1. `node --check` 检查修改后的 JS 语法。
2. 搜索确认前端不再使用 `VITE_DEEPSEEK_API_KEY` 和 DeepSeek 直连 URL。
3. 启动后端后访问 `/api/health`，确认健康检查返回。
4. 启动前端后进行一次笔记本查询：
   - 后端可用时：请求经 `/api/chat` 转发。
   - 后端不可用时：显示清晰降级文案。

## 风险与边界

- 本地开发需要同时启动 Vite 前端和 Express 后端；如果没有配置 Vite 代理，前端请求 `/api/chat` 可能打到 Vite 端口而不是后端端口。
- 若采用 `VITE_AI_PROXY_URL=http://localhost:8787/api/chat`，前端仍会暴露“代理地址”，但不会暴露真实 DeepSeek Key，这是可接受的。
- 本次不改 AI 知识库、不改剧情、不改章节流程。

## 审批点

审批通过后再开始修改源码。

