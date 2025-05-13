// frontend/lib/session.js
export function getClientSessionId() {
  if (typeof window === "undefined") return "ssr-fallback-session"; // ✅ SSR 시에도 안전

  const key = "clientSessionId";
  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID(); // ✅ 고유 UUID 자동 생성
    localStorage.setItem(key, id);
  }

  return id;
}

export function getOrCreateGuestToken() {
  if (typeof window === "undefined") return "ssr-fallback-guest"; // ✅ SSR 시에도 안전

  const key = "guest_token";
  let token = localStorage.getItem(key);

  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }

  return token;
}
