# 《卅一景》一体化服务端 Dockerfile

# ====== 阶段 1：构建前端 ======
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# npm 淘宝镜像，避免国内构建超时
RUN npm config set registry https://registry.npmmirror.com

COPY Web/package.json Web/package-lock.json ./
RUN npm ci

COPY Web/index.html Web/vite.config.js ./
COPY Web/src ./src
COPY Web/public ./public

RUN npm run build

# ====== 阶段 2：运行服务端 ======
FROM node:20-alpine

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

COPY Web/server/package.json Web/server/package-lock.json ./
RUN npm ci --production

COPY Web/server/index.js ./

COPY --from=frontend-builder /app/frontend/dist ./dist

EXPOSE 8787

CMD ["node", "index.js"]
