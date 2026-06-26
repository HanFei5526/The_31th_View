# 《卅一景》一体化服务端 Dockerfile
# 构建上下文: Web/   |   腾讯云云托管根目录: Web/

# ====== 阶段 1：构建前端 ======
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public

RUN npm run build

# ====== 阶段 2：运行服务端 ======
FROM node:20-alpine

WORKDIR /app

# 安装服务端依赖
COPY server/package*.json ./
RUN npm install --production

# 复制服务端代码
COPY server/index.js ./
COPY server/.env ./

# 从前阶段拉取前端构建产物
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 8787

CMD ["node", "index.js"]
