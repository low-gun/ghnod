import useGlobalLoading from "@/stores/globalLoading";

export default function GlobalLoadingBar() {
  const isLoading = useGlobalLoading((state) => state.isLoading);

  if (!isLoading) return null;

  return (
    <div style={overlayStyle}>
      <img src="/loading-spinner.png" alt="로딩 중" style={spinnerStyle} />
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(255,255,255,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const spinnerStyle = {
  width: "64px",
  height: "64px",
  animation: "rotate 1s linear infinite",
};
