# Base (共通)
FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Dev
FROM node:22-alpine AS dev
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1 CHOKIDAR_USEPOLLING=true
WORKDIR /app
COPY package*.json ./
RUN npm ci
EXPOSE 3000
CMD ["npm","run","dev","--","-p","3000","--hostname","0.0.0.0"]

# Builder
FROM node:22-alpine AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runner (本番/ステージング)
FROM node:22-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prompts ./prompts
EXPOSE 3000
CMD ["node","server.js"]
