import { ChevronLeft } from "lucide-react";
export default function AuthCardLayout({
  title,
  icon,
  children,
  onBack,         // 뒤로가기 함수(예: () => router.back())
  className = "",
}) {
  return (
    <div className={`auth-root`}>
      <div className={`auth-card ${className}`}>
        <div className="auth-title-bar">
          <button
            type="button"
            className="auth-back-btn"
            onClick={onBack}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="auth-title-wrap">
            {icon}
            <h2 className="auth-title">{title}</h2>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
