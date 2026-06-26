# 《卅一景》一体化服务端 Dockerfile
# 放在项目根目录，云托管构建上下文 = 项目根

# ====== 阶段 1：构建前端 ======
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY Web/package*.json ./
RUN npm install

COPY Web/index.html Web/vite.config.js ./
COPY Web/src ./src
COPY Web/public ./public

RUN npm run build

# ====== 阶段 2：运行服务端 ======
FROM node:20-alpine

WORKDIR /app

# 安装服务端依赖
COPY Web/server/package*.json ./
RUN npm install --production

# 复制服务端代码
COPY Web/server/index.js ./
COPY Web/server/.env ./

# 从前阶段拉取前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./dist

EXPOSE 8787

CMD ["node", "index.js"]
