# 1. Node.js 베이스 이미지 선택
FROM node:18-alpine AS builder

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 전체 복사 (루트 기준)
COPY . .

# 4. 프론트엔드 설치 및 빌드
WORKDIR /app/frontend
RUN npm install && npm run build

# 5. 백엔드 설치
WORKDIR /app/backend
RUN npm install --omit=dev

# 6. 빌드 결과 통합
WORKDIR /app
RUN mkdir -p release/build/.next/static \
  && cp -r frontend/.next/standalone/* release/build/ \
  && cp -r frontend/.next/static/* release/build/.next/static/ \
  && cp frontend/.next/BUILD_ID release/build/.next/BUILD_ID \
  && cp frontend/.next/routes-manifest.json release/build/.next/ \
  && cp frontend/.next/prerender-manifest.json release/build/.next/ \
  && cp -r frontend/public release/build/public \
  && cp frontend/.env.production release/build/.env.production \
  && cp -r backend/* release/build/ \
  && rm -rf release/build/node_modules \
  && cd release/build && npm install --omit=dev

# 7. 실행용 이미지로 경량화
FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/release/build .

ENV NODE_ENV=production
CMD ["node", "server.js"]
