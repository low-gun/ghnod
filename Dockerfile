# 1. Node.js 베이스 이미지 선택
FROM node:18-alpine AS builder

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 전체 복사
COPY . .

# 4. 프론트엔드 설치 및 빌드
WORKDIR /app/frontend
RUN rm -rf .next/cache && npm install && npm run build

# 5. 백엔드 설치
WORKDIR /app/backend
RUN npm install --omit=dev

# 6. 빌드 결과 통합
WORKDIR /app
RUN mkdir -p release/build/.next/static release/build/.next/server \
  && cp -r frontend/.next/standalone/* release/build/ \
  && cp -r frontend/.next/static/* release/build/.next/static/ \
  && test -f frontend/.next/BUILD_ID && cp frontend/.next/BUILD_ID release/build/.next/ || echo "⛔ BUILD_ID not found" \
  && test -f frontend/.next/routes-manifest.json && cp frontend/.next/routes-manifest.json release/build/.next/ || echo "⛔ routes-manifest.json not found" \
  && test -f frontend/.next/prerender-manifest.json && cp frontend/.next/prerender-manifest.json release/build/.next/ || echo "⛔ prerender-manifest.json not found" \
  && test -f frontend/.next/required-server-files.json && cp frontend/.next/required-server-files.json release/build/.next/ || echo "⛔ required-server-files.json not found" \
  && test -f frontend/.next/server/pages-manifest.json && cp frontend/.next/server/pages-manifest.json release/build/.next/server/ || echo "⛔ pages-manifest.json not found" \
  && test -f frontend/.next/server/middleware-manifest.json && cp frontend/.next/server/middleware-manifest.json release/build/.next/server/ || echo "⛔ middleware-manifest.json not found" \
  && test -f frontend/.next/server/app-paths-manifest.json && cp frontend/.next/server/app-paths-manifest.json release/build/.next/server/ || echo "⛔ app-paths-manifest.json not found" \
  && test -f frontend/.next/server/app-route-manifest.json && cp frontend/.next/server/app-route-manifest.json release/build/.next/server/ || echo "⛔ app-route-manifest.json not found" \
  && test -d frontend/public && cp -r frontend/public release/build/public || echo "⛔ public/ not found" \
  && test -f frontend/.env.production && cp frontend/.env.production release/build/.env.production || echo "⛔ .env.production not found" \
  && cp -r backend/* release/build/ \
  && rm -rf release/build/node_modules release/build/.next/cache \
  && cd release/build && npm install --omit=dev

# 7. 실행용 이미지로 경량화
FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/release/build .

ENV NODE_ENV=production
CMD ["node", "server.js"]
