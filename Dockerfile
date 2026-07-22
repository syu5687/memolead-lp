# Cloud Run 向け 最小イメージ
FROM node:20-slim

WORKDIR /app

# 依存だけ先にインストール(キャッシュが効く)
COPY package.json ./
RUN npm install --omit=dev

# アプリ本体
COPY . .

# Cloud Run は PORT 環境変数でポートを渡してくる
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
