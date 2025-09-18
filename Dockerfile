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
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./apps/web
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
# プロンプトテンプレートはアプリ配下に配置
COPY --from=builder /app/apps/web/prompts ./apps/web/prompts
# Drizzle のマイグレーション実行に必要なファイル郡（SQL と実行スクリプト）を同梱
COPY --from=builder /app/drizzle ./apps/web/drizzle
COPY --from=builder /app/scripts ./apps/web/scripts
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["sh","-c","node ./scripts/migrate.mjs && node server.js"]
