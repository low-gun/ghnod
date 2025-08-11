import { useRouter } from "next/router";
import { useState, useEffect, useContext } from "react";
import TermsModal from "@/components/modals/TermsModal";
import PrivacyModal from "@/components/modals/PrivacyModal";
import { UserContext } from "@/context/UserContext";
import { LogOut } from "lucide-react"; // 가장 위에 추가 (없으면 직접 svg 코딩해도 됨)

// ✅ 950px 이하에서 showNarrowFooter true
export default function Footer({ showProfile }) {
  const { user, logout } = useContext(UserContext);
  const router = useRouter();

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= 950);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleClick = (type) => (e) => {
    e.preventDefault();
    if (!isNarrow) {
      type === "terms" ? setShowTermsModal(true) : setShowPrivacyModal(true);
    } else {
      router.push(`/${type}`);
    }
  };

  const openBizInfoPopup = () => {
    if (isNarrow) return; // 모바일/태블릿에서는 새 창 차단 방지
    window.open(
      "http://www.ftc.go.kr/bizCommPop.do?wrkr_no=6948800292",
      "bizCommPop",
      "width=750,height=700"
    );
  };

  return (
    <footer
      style={{
        marginTop: isNarrow ? "30px" : "40px", // 950px 이하면 여백 제거
        padding: isNarrow ? "20px 8px 16px 8px" : "40px 20px", // ← 모바일일 때 패딩 줄임
        backgroundColor: "#f8f8f8",
        borderTop: "1px solid #ddd",
        fontSize: "13px",
        color: "#555",
      }}
    >
      {isNarrow ? (
        // ✅ 모바일/태블릿(950px 이하)
        <div style={{ textAlign: "center" }}>
          <img
            src="/logo_gray.png"
            alt="ORPi 회사 로고"
            style={{ width: "100px", opacity: 0.9, marginBottom: "16px" }}
          />
          <div style={{ marginBottom: "8px" }}>
            <a
              href="/terms"
              onClick={handleClick("terms")}
              style={footerLinkStyle}
            >
              이용약관
            </a>{" "}
            |{" "}
            <a
              href="/privacy"
              onClick={handleClick("privacy")}
              style={footerLinkStyle}
            >
              개인정보처리방침
            </a>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <a
              href="http://www.ftc.go.kr/bizCommPop.do?wrkr_no=6948800292"
              target="_blank"
              rel="noopener noreferrer"
              style={smallBorderButtonStyle}
            >
              사업자정보확인
            </a>
          </div>
          <div style={{ color: "#aaa", fontSize: "12px" }}>
            © 2025 ORPi. All rights reserved.
          </div>

          {/* 950px 이하에서는 항상 로그아웃 버튼 노출 */}
          {user && (
            <button
              onClick={logout}
              aria-label="로그아웃"
              style={{
                marginTop: "14px",
                background: "#f0f2f5",
                border: "none",
                borderRadius: "50%",
                padding: "9px",
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(80,90,100,0.05)",
                transition: "background 0.2s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogOut size={22} color="#535c69" />
            </button>
          )}
        </div>
      ) : (
        // ✅ 데스크탑(951px 이상)
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              textAlign: "left",
              maxWidth: "1200px",
              margin: "0 auto",
              gap: "32px",
            }}
          >
            {/* 로고 */}
            <div>
              <img
                src="/logo_gray.png"
                alt="ORPi 회사 로고"
                style={{ width: "120px", opacity: 0.9 }}
              />
            </div>

            {/* 회사 정보 */}
            <div style={{ flex: 1, lineHeight: "1.6" }}>
              <div>
                <strong>(주)오알피컨설팅 (대표: 유희재)</strong>
              </div>
              <div>
                서울특별시 서초구 효령로 29길 6, 5층 (방배동, 오알피연구소 빌딩)
              </div>
              <div>사업자등록번호: 694-88-00292 / 대표번호:02-6952-2843</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "4px",
                }}
              >
                <span>통신판매업: 2018-서울서초-1944</span>
                <button
                  onClick={openBizInfoPopup}
                  style={smallBorderButtonStyle}
                >
                  사업자정보확인
                </button>
              </div>
            </div>

            {/* 정책 링크 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "8px",
              }}
            >
              <div>
                <a
                  href="/terms"
                  onClick={handleClick("terms")}
                  style={footerLinkStyle}
                >
                  이용약관
                </a>{" "}
                |{" "}
                <a
                  href="/privacy"
                  onClick={handleClick("privacy")}
                  style={footerLinkStyle}
                >
                  개인정보처리방침
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "13px",
              color: "#aaa",
            }}
          >
            © 2025 ORPi. All rights reserved.
          </div>
        </>
      )}

      {/* 모달 */}
      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </footer>
  );
}

const footerLinkStyle = {
  color: "#888",
  textDecoration: "none",
  fontSize: "13px",
  cursor: "pointer",
  transition: "color 0.2s",
};

const smallBorderButtonStyle = {
  fontSize: "12px",
  color: "#333",
  background: "none",
  border: "1px solid #ccc",
  borderRadius: "4px",
  padding: "2px 6px",
  cursor: "pointer",
  transition: "all 0.2s",
};
