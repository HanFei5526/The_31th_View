# API 配置文档同步：前端不暴露 Key

## 状态

已完成。

## 修改目标

- 将项目文档中的旧配置口径从 `Web/.env` / `VITE_DEEPSEEK_API_KEY` 改为 `Web/server/.env` / `DEEPSEEK_API_KEY`。
- 明确前端只请求本地/同源 AI 代理，不持有真实 DeepSeek API Key。
- 避免后续测试或协作时误把真实 key 放回前端环境变量。

## 涉及文件

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`

## 主要改法

- 更新目录结构中 `.env` 的说明。
- 更新快速开始中的 AI 配置步骤。
- 更新当前前端状态中的 AI 接入说明。
- 不修改任何 `.env` 文件，不修改运行代码。

## 完成标准

- 全仓库不再把 `VITE_DEEPSEEK_API_KEY` 描述为当前配置方式。
- 文档明确说明真实 API Key 只放在 `Web/server/.env`。
- 搜索验证通过。
