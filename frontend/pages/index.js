import { useUserContext } from "@/context/UserContext";
import { useEffect } from "react";

export default function HomePage() {
  const { user } = useUserContext();

  // 절대 상태 조작/복구하지 마라. 무한루프 원인.
  // useEffect(() => {}, []);

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
