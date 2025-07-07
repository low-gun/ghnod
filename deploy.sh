#!/bin/bash

echo "🧹 Step 1: .next 및 release 초기화"
rm -rf frontend/.next
rm -rf release

echo "⚙️ Step 2: frontend 빌드 시작"
npm run build --prefix frontend

echo "📦 Step 3: release 디렉토리로 빌드 결과 복사"
mkdir -p release
cp -r frontend/.next/standalone/* release/
cp -r frontend/.next/static release/.next/
cp -r frontend/public release/public
cp -r backend/* release/
cp backend/server.js release/server.js
cp frontend/.env.production release/.env.production

echo "✅ 완료! 이제 git add / commit / push 하면 배포됨"
