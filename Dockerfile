# custom-brain — NestJS + Family Brain
# 빌드 후 production 실행. Ollama·Qdrant는 호스트 또는 별도 컨테이너 연결 필요.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
RUN pnpm install --frozen-lockfile --prod

USER node
CMD ["node", "dist/main.js"]
