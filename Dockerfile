FROM node:18-alpine

# 安装Puppeteer所需的Chrome依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn \
    dumb-init \
    udev \
    ttf-liberation \
    font-noto-emoji \
    fontconfig

# 设置Puppeteer环境变量，使用Alpine中的Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu" \
    NODE_ENV=production

# 创建非root用户以运行Chromium
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# 创建应用目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制.env.example文件并创建.env文件
COPY .env.example ./.env

# 复制应用代码
COPY . .

# 创建images目录并设置权限
RUN mkdir -p images && chown -R pptruser:pptruser /app

# 创建临时目录并设置权限
RUN mkdir -p /tmp/puppeteer_downloads && chown -R pptruser:pptruser /tmp/puppeteer_downloads

# 构建应用
RUN npm run build
# 暴露端口
EXPOSE 3000

# 切换到非root用户
USER pptruser

# 设置共享内存卷
VOLUME /dev/shm

# 设置环境变量
ENV HOST=http://localhost
ENV PORT=3000
ENV MAX_CONCURRENT_TASKS=3
ENV MAX_CONCURRENT_JOBS=1

# 使用dumb-init作为入口点以正确处理信号，并启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]