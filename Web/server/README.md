# 序章 AI 后端

把 DeepSeek API Key 留在服务端的小代理。前端只跟它通信，浏览器不接触密钥。

## 启动

```bash
cd Web/server
npm install
cp .env.example .env     # 然后编辑 .env，填入 DEEPSEEK_API_KEY
npm start                # 启动在 http://localhost:8787
```

开发时用 `npm run dev`（文件改动自动重启）。

## 配置项（.env）

| 变量 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | ✅ | — | 你的 DeepSeek API Key |
| `DEEPSEEK_API_URL` | | `https://api.deepseek.com/chat/completions` | 上游接口地址 |
| `DEEPSEEK_MODEL` | | `deepseek-v4-pro` | 模型名 |
| `PORT` | | `8787` | 后端监听端口 |
| `CORS_ORIGIN` | | `http://localhost:5173,http://127.0.0.1:5173` | 允许的前端来源，逗号分隔。部署到公网时改成你的域名 |
| `RATE_WINDOW_MS` | | `60000` | 限流时间窗（毫秒） |
| `RATE_MAX` | | `20` | 每个 IP 在时间窗内最多请求 `/api/chat` 的次数 |

## 安全说明

- **CORS 白名单**：只有 `CORS_ORIGIN` 里列出的来源能跨域调用。不在名单内的浏览器请求会被拒绝。无 origin 的请求（curl、健康探针、同源）放行。
- **限流**：每个 IP 默认每分钟最多 20 次 `/api/chat`，超出返回 429。按真实客户端 IP 计数（已开启 `trust proxy`，反向代理后部署也能拿到真实 IP）。
- 这两层是防止你的 API Key 被人当免费接口刷。部署公网前务必把 `CORS_ORIGIN` 收紧到你自己的域名。

## 接口

### `GET /api/health`
健康检查。返回 `{ ok, configured, model }`。`configured` 表示是否已填 API Key。

### `POST /api/chat`
转发对话到 DeepSeek。

请求体：
```json
{
  "messages": [{ "role": "system", "content": "..." }, { "role": "user", "content": "..." }],
  "temperature": 0.7,
  "max_tokens": 300
}
```

响应：`{ "content": "周鹤年的回复……" }`

## 前端如何连上

前端 `AIService` 默认请求 `http://localhost:8787`。
如需改地址（例如部署到远程），在 `Web/.env` 设置：

```
VITE_AI_BACKEND_URL=https://your-host:port
```

不配置就走本地默认值。后端没启动或没填 Key 时，游戏自动降级到离线预写对话，序章仍可完整通关。
