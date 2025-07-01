import { useRouter } from "next/router";
import { useState } from "react";
import TermsModal from "@/components/modals/TermsModal";
import PrivacyModal from "@/components/modals/PrivacyModal";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";

import { useContext } from "react";
import { UserContext } from "@/context/UserContext"; // 추가

export default function Footer() {
  const { user, logout } = useContext(UserContext); // ✅ 추가
  const router = useRouter();
  const isMobile = useIsMobile();

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleClick = (type) => (e) => {
    e.preventDefault();
    if (!isMobile) {
      type === "terms" ? setShowTermsModal(true) : setShowPrivacyModal(true);
    } else {
      router.push(`/${type}`);
    }
  };

  const openBizInfoPopup = () => {
    if (isMobile) return; // 모바일에서는 새 창 차단 방지
    window.open(
      "http://www.ftc.go.kr/bizCommPop.do?wrkr_no=1148626813",
      "bizCommPop",
      "width=750,height=700"
    );
  };

  return (
    <footer
      style={{
        marginTop: isMobile ? "0px" : "40px", // ✅ 모바일이면 여백 제거
        padding: "40px 20px",
        backgroundColor: "#f8f8f8",
        borderTop: "1px solid #ddd",
        fontSize: "13px",
        color: "#555",
      }}
    >
      {isMobile ? (
        // ✅ 모바일 간소화
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
              href="http://www.ftc.go.kr/bizCommPop.do?wrkr_no=1148626813"
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

          {user && (
            <button
              onClick={logout}
              style={{
                marginTop: "12px",
                fontSize: "13px",
                color: "#fff",
                background: "#0070f3",
                border: "none",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              로그아웃
            </button>
          )}
        </div>
      ) : (
        // ✅ 데스크탑/태블릿
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
                <strong>주식회사 오알피연구소 (대표: 이영석)</strong>
              </div>
              <div>
                서울특별시 서초구 효령로 29길 6 (방배동, 오알피연구소 빌딩)
              </div>
              <div>사업자등록번호: 114-86-26813 / 대표번호: 02-3473-2206</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "4px",
                }}
              >
                <span>통신판매업: 2015-서울서초-0262</span>
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
