# Base (共通)
FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Dev
FROM node:22-alpine AS dev
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1 CHOKIDAR_USEPOLLING=true
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/auth-shared/package.json ./packages/auth-shared/package.json
COPY packages/db/package.json ./packages/db/package.json
RUN npm ci
EXPOSE 3000
CMD ["npm","run","dev","--workspace=@team3/web","--","-p","3000","--hostname","0.0.0.0"]

# Builder
FROM node:22-alpine AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/auth-shared/package.json ./packages/auth-shared/package.json
COPY packages/db/package.json ./packages/db/package.json
RUN npm ci
COPY . .
RUN npm run build

# Runner (本番/ステージング)
FROM node:22-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

# 日本語コメント: runner のワークディレクトリは standalone ルート
WORKDIR /app/web

# 日本語コメント: standalone 出力をコピー（apps/web/server.js などが含まれる）
COPY --from=builder /app/apps/web/.next/standalone ./

# 日本語コメント: 静的ファイルや public 資材を server.js と同じ階層配下へ配置
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public       ./apps/web/public

# 日本語コメント: アプリが参照する追加リソース
COPY --from=builder /app/apps/web/prompts ./apps/web/prompts
COPY --from=builder /app/drizzle          ./drizzle
COPY --from=builder /app/scripts          ./scripts

EXPOSE 3000
CMD ["node","apps/web/server.js"]
