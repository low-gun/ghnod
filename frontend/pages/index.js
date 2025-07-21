import { useUserContext } from "@/context/UserContext";
import { useEffect } from "react";
import api from "@/lib/api";

export default function HomePage() {
  const { user, login, accessToken } = useUserContext();

  useEffect(() => {
    // accessToken이 없더라도, 쿠키 기반 /user API 호출 시도 (최초 1회)
    if (!user) {
      api.get("/user")
        .then(res => {
          if (res.data.success && res.data.user && res.data.accessToken) {
            // accessToken, user 동시 세팅
            login(res.data.user, res.data.accessToken);
          } else if (res.data.success && res.data.user) {
            // accessToken만 쿠키에 있고 user만 리턴되면
            login(res.data.user, null);
          }
        })
        .catch(() => {
          // 실패 시 아무것도 하지 않음(게스트)
        });
    }
  }, [user, login]);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <img
        src="/main.webp"
        alt="진단 워크숍 메인 이미지"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          margin: 0,
          padding: 0,
        }}
      />
    </div>
  );
  
}
