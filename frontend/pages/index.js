export default function HomePage() {
  return (
    <main
      style={{
        marginTop: 0, // ✅ 추가
        margin: 0,
        padding: 0,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        minHeight: "auto",
        flex: "unset",
      }}
    >
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
    </main>
  );
}
