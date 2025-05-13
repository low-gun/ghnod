# 📦 프로젝트 구조 및 Axios 통신 구조 정리

이 문서는 현재 프로젝트의 전체 디렉토리 구조, SSR/CSR 흐름, API 통신 방식, axios 전환 완료 사항 및 개발 가이드를 포함합니다.

---

## 🗂️ 전체 디렉토리 구조 요약

```
frontend/
├── components/               # 공통 및 페이지별 컴포넌트
│   ├── layout/              # 레이아웃, Header, Sidebar, Footer 등
│   ├── admin/               # 관리자 페이지 관련 컴포넌트
│   ├── mypage/              # 마이페이지 관련 컴포넌트
│   └── schedules/           # 일정 달력 및 모달 컴포넌트
│
├── context/                 # UserContext (user, accessToken 등 전역 상태)
├── lib/                     # axios 인스턴스 (api.js), 포맷 함수 등
├── pages/                   # Next.js page routes
│   ├── admin/               # 관리자 페이지
│   ├── education/           # 교육 일정/상세
│   ├── mypage/              # 마이페이지 (cart 포함)
│   ├── api/                 # Next.js API route 프록시 or 백엔드 연동
│   └── ...
```

---

## 🔁 SSR vs CSR 구분

| 위치                               | 방식                       | 예시                               |
| ---------------------------------- | -------------------------- | ---------------------------------- |
| `pages/admin/*.js`                 | SSR (`getServerSideProps`) | 사용자, 일정, 결제 내역 불러오기   |
| `pages/education/calendar.js`      | SSR                        | 전체 교육 일정 표시                |
| `pages/education/calendar/[id].js` | SSR + CSR                  | 상세정보 SSR + 장바구니 클라이언트 |
| `components/**`                    | CSR                        | API 호출은 모두 `api.js` 사용      |

---

## ⚙️ Axios 전환 요약

### ✅ 전환 완료된 주요 파일 목록

- `UserContext.js`
- `Header.js`, `AdminSidebar.js`
- `UserTable.js`, `UserDetail.js`
- `ScheduleModal.jsx`, `EventList.jsx`
- `admin/index.js`, `admin/schedules.js`, `admin/payments.js`, `admin/users.js`
- `mypage/cart.js`
- `education/calendar.js`, `education/calendar/[id].js`

### ❌ 더 이상 사용되지 않음

- 모든 `fetch(...)` 제거 완료 (SSR, CSR 모두 포함)

---

## 🚀 API 요청 가이드

### 📌 1. 클라이언트 요청: `api.js` 사용

```js
import api from "@/lib/api";

const res = await api.get("/user/profile");
const data = res.data;
```

axios 인스턴스는 다음 옵션을 포함합니다:

- `baseURL: "/api"`
- `withCredentials: true` → refreshToken 자동 쿠키 전송
- `interceptors.response` → 401 시 accessToken 자동 재발급 후 재요청

### 📌 2. SSR 요청: `axios` 직접 사용

```js
import axios from "axios";

const cookie = context.req.headers.cookie || "";
const res = await axios.get("http://localhost:3000/api/admin/users", {
  headers: { Cookie: cookie },
});
const data = res.data;
```

- SSR에서는 `api` 인스턴스 대신 `axios` 직접 사용
- 쿠키 전달 필요 시 `headers.Cookie` 지정

---

## 🧭 개발자 온보딩 가이드

### ✅ axios 기반 통신 규칙

- 모든 클라이언트 요청은 반드시 `api` 인스턴스를 사용
- SSR 요청은 `axios.get/post(...)` + `Cookie` 수동 전달
- API 응답은 `.data`로 바로 접근 가능

### ✅ API 응답 처리 예시

```js
try {
  const res = await api.get("/user/me");
  const data = res.data;
  if (data.success) {
    // 성공 처리
  }
} catch (err) {
  console.error("요청 실패", err);
}
```

### ✅ 에러 핸들링 기준

- `401 Unauthorized` → interceptors에서 자동 재발급 시도
- 그 외 에러 → 컴포넌트 내에서 직접 처리

---

✅ 위 구조를 기준으로 유지보수 및 신규 개발을 진행하시면 됩니다.

필요 시 이 문서를 `README.md` 또는 `docs/api-guide.md`로 복사하여 저장해도 좋습니다.
