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
| `DEEPSEEK_MODEL` | | `deepseek-v4-flash` | 模型名 |
| `PORT` | | `8787` | 后端监听端口 |
| `CORS_ORIGIN` | | `http://localhost:5173,http://127.0.0.1:5173` | 允许的前端来源，逗号分隔。部署到公网时改成你的域名 |
| `RATE_WINDOW_MS` | | `60000` | 限流时间窗（毫秒） |
| `RATE_MAX` | | `20` | 每个 IP 在时间窗内最多请求 AI 接口的次数 |

## 安全说明

- **CORS 白名单**：只有 `CORS_ORIGIN` 里列出的来源能跨域调用。不在名单内的浏览器请求会被拒绝。无 origin 的请求（curl、健康探针、同源）放行。
- **限流**：每个 IP 默认每分钟最多 20 次 AI 请求，超出返回 429。按真实客户端 IP 计数（已开启 `trust proxy`，反向代理后部署也能拿到真实 IP）。
- 这两层是防止你的 API Key 被人当免费接口刷。部署公网前务必把 `CORS_ORIGIN` 收紧到你自己的域名。

## 接口

### `GET /api/health`
健康检查。返回 `{ ok, configured, model }`。`configured` 表示是否已填 API Key。

### `POST /api/notebook/message`
修复笔记本语义接口。后端会根据当前章节和进度解锁剧情知识片段，同时允许回答通用修复知识问题；所有回复统一表现为周老师预先写在笔记本里的批注。

请求体：
```json
{
  "mode": "query",
  "message": "装裱接缝说明什么？",
  "chapter": 0,
  "world": "real",
  "progress": {
    "hasNotebook": true,
    "cluesFound": ["clue_margin"]
  },
  "context": {
    "chapter": 0,
    "world": "real",
    "items": [],
    "progress": {}
  }
}
```

研讨模式可额外传入：
```json
{
  "mode": "discussion",
  "gateId": "gate_prologue_margin",
  "history": [{ "role": "user", "content": "边缘像是被遮住了" }],
  "systemHint": "玩家方向部分正确，请继续引导。"
}
```

响应：
```json
{
  "content": "周老师批注：这一处值得留意。先看画心与装裱交界处，再判断被处理的是画面，还是画外信息。",
  "knowledgeIds": ["prologue_album_mounting", "clue_margin_label"],
  "model": "deepseek-v4-flash"
}
```

## 回复格式约束

所有 AI 回复必须以 `周老师批注：` 开头。笔记本不是实时导师，只能呈现周老师过去预先写下的批注、摘录和资料。

允许回答的范围：

- 通用修复知识：放大镜、侧光、纸质分析等工具用途；装裱、画心、题签、边注、题跋、册页等基础概念；古画修复中的观察顺序与证据判断方法。
- 当前已解锁剧情知识：由后端根据章节、线索和进度注入。
- 第一章当前场景观察：兰雪堂阶段可回答场景观察方向；芙蓉榭阶段可回答栏杆、倒影和水面分界线的观察引导，但不提前说明倒影物件身份。

不能回答的范围：

- 未发现线索
- 后续章节
- 王蘅身份
- 最终真相
- 任何无法在通用修复知识或当前已解锁剧情知识中找到依据的问题

不能回答时固定回复：

```text
周老师批注：翻了翻，没有找到相关记录。
```

禁止输出：

- `（周老师的批注）`
- `笔记本页面上出现`
- `字迹浮现`
- `字迹是周老师的风格`
- `我看到你刚才说`

## 已接入章节

- 序章：基础资料、装裱接缝、残字、底层细线、综合研讨后来源遮蔽知识。
- 第一章：兰雪堂匾额异常、缀云峰低处观察、芙蓉榭倒影与断簪、“蘅”字含义、章末现实工作室方法提示。

后端会规范化空回复：如果模型只返回 `周老师批注：` 或空内容，接口会改为 `周老师批注：翻了翻，没有找到相关记录。`。

### `POST /api/chat`
兼容接口：直接转发对话到 DeepSeek。新功能应优先使用 `/api/notebook/message`。

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

前端 `AIService` 默认请求同源 `/api/health` 和 `/api/chat`。开发环境下，`Web/vite.config.js` 会把 `/api` 代理到 `http://localhost:8787`。

因此本地联调需要同时启动两个服务：

```bash
# 终端 1
cd Web/server
npm start

# 终端 2
cd Web
npm run dev
```

如需改成远程代理地址，在 `Web/.env` 设置：

```
VITE_AI_BACKEND_URL=https://your-host:port
```

不配置就走同源 `/api`。前端只会暴露代理地址，不会接触真实 DeepSeek API Key。后端没启动或没填 Key 时，游戏自动降级到离线预写对话，主流程仍可推进。
