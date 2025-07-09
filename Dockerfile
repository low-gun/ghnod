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

# 6. 빌드 결과 통합 (release에 바로 복사)
WORKDIR /app
RUN mkdir -p release/.next/static release/.next/server release/frontend \
  && mkdir -p release/.next/server && cp -r frontend/.next/server/pages release/.next/server/pages \
  && cp -r frontend/.next/standalone/* release/ \
  && cp -r frontend/.next/static/* release/.next/static/ \
  && cp -r frontend/.next/standalone/.next/static/* release/.next/static/ \
  && test -f frontend/.next/BUILD_ID && cp frontend/.next/BUILD_ID release/.next/ || echo "⛔ BUILD_ID not found" \
  && test -f frontend/.next/routes-manifest.json && cp frontend/.next/routes-manifest.json release/.next/ || echo "⛔ routes-manifest.json not found" \
  && test -f frontend/.next/prerender-manifest.json && cp frontend/.next/prerender-manifest.json release/.next/ || echo "⛔ prerender-manifest.json not found" \
  && test -f frontend/.next/required-server-files.json && cp frontend/.next/required-server-files.json release/.next/ || echo "⛔ required-server-files.json not found" \
  && test -f frontend/.next/server/pages-manifest.json && cp frontend/.next/server/pages-manifest.json release/.next/server/ || echo "⛔ pages-manifest.json not found" \
  && test -f frontend/.next/server/middleware-manifest.json && cp frontend/.next/server/middleware-manifest.json release/.next/server/ || echo "⛔ middleware-manifest.json not found" \
  && test -f frontend/.next/server/app-paths-manifest.json && cp frontend/.next/server/app-paths-manifest.json release/.next/server/ || echo "⛔ app-paths-manifest.json not found" \
  && test -f frontend/.next/server/app-route-manifest.json && cp frontend/.next/server/app-route-manifest.json release/.next/server/ || echo "⛔ app-route-manifest.json not found" \
  && test -f frontend/.next/server/next-font-manifest.json && cp frontend/.next/server/next-font-manifest.json release/.next/server/ || echo "⛔ next-font-manifest.json not found" \
  && test -d frontend/public && cp -r frontend/public release/public || echo "⛔ public/ not found" \
  && test -f frontend/.env.production && cp frontend/.env.production release/frontend/.env.production || echo "⛔ frontend/.env.production not found" \
  && test -f backend/.env.production && cp backend/.env.production release/.env.production || echo "⛔ backend/.env.production not found" \
  && cp -r backend/* release/ \
  && rm -rf release/node_modules release/.next/cache \
  && cd release && npm install --omit=dev

# 7. 실행용 이미지로 경량화 + 구조 확인 디버깅
FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/release/ .

# ✅ 디렉토리 구조 확인용 로그
RUN echo "📁 /app:" && ls -al /app && \
    echo "\n📁 /app/.next:" && ls -al /app/.next || echo "❌ .next 없음" && \
    echo "\n📁 /app/public:" && ls -al /app/public || echo "❌ public 없음" && \
    echo "\n📄 server.js:" && cat /app/server.js || echo "❌ server.js 없음"

ENV NODE_ENV=production
CMD ["node", "server.js"]
