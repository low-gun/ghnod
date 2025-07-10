# 1. Node.js 베이스 이미지 선택
FROM node:18-alpine AS builder

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 전체 복사
COPY . .
# ✅ rsync 설치
RUN apk add --no-cache rsync
# 4. 프론트엔드 설치 및 빌드
WORKDIR /app/frontend
RUN rm -rf .next/cache && npm install && npm run build

# 5. 백엔드 설치
WORKDIR /app/backend
RUN npm install --omit=dev

# 6. 빌드 결과 통합 (release에 바로 복사)
WORKDIR /app
RUN mkdir -p release/frontend \
  && mkdir -p release/.next \
  && cp -r frontend/.next/* release/.next \
  && cp frontend/.next/BUILD_ID release/.next/BUILD_ID \
  && cp -r frontend/.next/standalone/* release/ \
  && cp frontend/.next/BUILD_ID release/BUILD_ID \
  && test -d frontend/public && cp -r frontend/public release/public || echo "⛔ public/ not found" \
  && test -f frontend/.env.production && cp frontend/.env.production release/frontend/.env.production || echo "⛔ frontend/.env.production not found" \
  && test -f backend/.env.production && cp backend/.env.production release/.env.production || echo "⛔ backend/.env.production not found" \
  && rsync -av --exclude=package.json --exclude=package-lock.json backend/ release/ \
  && rm -rf release/node_modules release/.next/cache \
  && cd release \
  && npm install --omit=dev --verbose \
  && echo "\n✅ zustand 확인:" && ls -al node_modules/zustand || echo "❌ zustand 없음" \
  && echo "\n✅ release/package.json 내 zustand 포함 여부:" && cat package.json | grep zustand || echo "❌ package.json에 zustand 없음"


# 7. 실행용 이미지로 경량화 + 구조 확인 디버깅
FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/release/ .
RUN echo "🧾 BUILD_ID:" && cat /app/.next/BUILD_ID || echo "❌ BUILD_ID 없음"
# ✅ 디렉토리 구조 확인용 로그
RUN echo "📁 /app:" && ls -al /app && \
    echo "\n📁 /app/.next:" && ls -al /app/.next || echo "❌ .next 없음" && \
    echo "\n📁 /app/public:" && ls -al /app/public || echo "❌ public 없음" && \
    echo "\n📄 server.js:" && cat /app/server.js || echo "❌ server.js 없음"

ENV NODE_ENV=production
CMD ["node", "server.js"]
