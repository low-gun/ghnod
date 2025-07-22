import { useUserContext } from "@/context/UserContext";
// useEffect 등 필요 없음

export default function HomePage() {
  const { user } = useUserContext();

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <img
        src="/main.webp"
        alt="진단 워크숍 메인 이미지"
        loading="lazy" // 레이지로딩 적용
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
