FROM node:16-alpine

WORKDIR /app

# 设置淘宝 npm 镜像
RUN npm config set registry https://registry.npmmirror.com

# 复制 package.json 和 tsconfig.json
COPY package*.json tsconfig.json ./

# 清理并重新安装依赖
RUN rm -rf node_modules && \
    npm install

COPY . .

EXPOSE 3000

# 使用开发模式运行
CMD ["npm", "start"]
