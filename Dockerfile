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

# 日本語コメント: CWD を server.js と static/public がある場所にする
WORKDIR /app/web

# 日本語コメント: standalone 出力一式を /app/web 直下に配置
# （ビルダー側の出力が apps/web 配下なら、コピー元は apps/web のままでOK）
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static     ./.next/static
COPY --from=builder /app/apps/web/public           ./public

# 日本語コメント: アプリが相対参照する資材があれば同じ階層へ
COPY --from=builder /app/apps/web/prompts  ./prompts
COPY --from=builder /app/drizzle           ./drizzle
COPY --from=builder /app/scripts           ./scripts

# （必要なら）node_modules を残す。ただし standalone は基本同梱なので通常は不要。
# COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node","server.js"]