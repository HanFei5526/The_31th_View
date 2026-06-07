/**
 * 《卅一景》序章小后端
 *
 * 作用：把 DeepSeek API Key 留在服务端，前端只跟本地后端通信。
 * 避免在浏览器里暴露 API Key。
 *
 * 单一端点：
 *   POST /api/chat  — 转发 messages 到 DeepSeek，返回回复文本
 *   GET  /api/health — 健康检查
 *
 * 启动：
 *   cd Web/server
 *   npm install
 *   cp .env.example .env   # 填入 DEEPSEEK_API_KEY
 *   npm start
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 8787;
const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';

/* ---- CORS 白名单 ----
 * 只允许 CORS_ORIGIN 里列出的来源（逗号分隔）。
 * 不配置时默认本地开发端口（Vite 默认 5173）。
 */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // 无 origin（同源请求、curl、健康检查探针）放行
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS 拒绝: ${origin} 不在白名单内`));
  },
}));
app.use(express.json({ limit: '256kb' }));

// 信任反向代理的 X-Forwarded-For，让限流按真实客户端 IP 计数
app.set('trust proxy', 1);

/* ---- 限流：每 IP 每分钟最多 N 次 /api/chat ---- */
const chatLimiter = rateLimit({
  windowMs: Number(process.env.RATE_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});

if (!API_KEY) {
  console.warn('[server] 警告：未配置 DEEPSEEK_API_KEY，/api/chat 将返回 503');
}

/* ---- 健康检查 ---- */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, configured: Boolean(API_KEY), model: MODEL });
});

/* ---- 对话转发 ---- */
app.post('/api/chat', chatLimiter, async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({ error: 'API Key 未配置' });
  }

  const { messages, temperature, max_tokens } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages 不能为空' });
  }

  try {
    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 300,
        stream: false,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[server] 上游错误:', upstream.status, errText);
      return res.status(502).json({ error: '上游 API 调用失败', status: upstream.status });
    }

    const data = await upstream.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    res.json({ content });
  } catch (err) {
    console.error('[server] 请求异常:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] 序章后端已启动 → http://localhost:${PORT}`);
  console.log(`[server] 模型: ${MODEL} | API Key: ${API_KEY ? '已配置' : '未配置'}`);
});
