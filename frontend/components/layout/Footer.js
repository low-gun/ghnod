import { useRouter } from "next/router";
import { useState, useEffect, useContext } from "react";
import TermsModal from "@/components/modals/TermsModal";
import PrivacyModal from "@/components/modals/PrivacyModal";
import { UserContext } from "@/context/UserContext";
import { LogOut, ChevronDown, ChevronUp } from "lucide-react";

export default function Footer({ showProfile }) {
  const { user, logout } = useContext(UserContext);
  const router = useRouter();
  const [showFamily, setShowFamily] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= 950);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".family-dropdown")) {
        setShowFamily(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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
    if (isNarrow) return;
    window.open(
      "http://www.ftc.go.kr/bizCommPop.do?wrkr_no=6948800292",
      "bizCommPop",
      "width=750,height=700"
    );
  };

  return (
    <footer
      style={{
        marginTop: isNarrow ? "30px" : "40px",
        padding: isNarrow ? "20px 8px 16px 8px" : "40px 20px",
        backgroundColor: "#f8f8f8",
        borderTop: "1px solid #ddd",
        fontSize: "13px",
        color: "#555",
      }}
    >
      {isNarrow ? (
        // ✅ 모바일
        <div style={{ textAlign: "center" }}>
          <img
            src="/logo_gray.png"
            alt="ORPi 회사 로고"
            style={{ width: "100px", opacity: 0.9, marginBottom: "16px" }}
          />
          <div style={{ marginBottom: "8px" }}>
            <a href="/terms" onClick={handleClick("terms")} style={footerLinkStyle}>
              이용약관
            </a>{" "}
            |{" "}
            <a href="/privacy" onClick={handleClick("privacy")} style={footerLinkStyle}>
              개인정보처리방침
            </a>
          </div>

          {/* 드롭다운 - 약관 하단에 가운데 정렬 */}
          <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
            <div style={{ position: "relative" }} className="family-dropdown">
              <button
                onClick={() => setShowFamily((prev) => !prev)}
                className="family-button mobile"
              >
                Family Site
                {showFamily ? (
                  <ChevronUp size={16} strokeWidth={2} />
                ) : (
                  <ChevronDown size={16} strokeWidth={2} />
                )}
              </button>

              {showFamily && (
                <div style={{ ...dropdownBoxStyle, width: "160px" }} className="family-menu mobile">
                  <a
                    className="dd-item"
                    href="http://orpiglobal.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowFamily(false)}
                  >
                    ORP Mongolia
                  </a>
                </div>
              )}
            </div>
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
        // ✅ 데스크탑
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
            <div>
              <img
                src="/logo_gray.png"
                alt="ORPi 회사 로고"
                style={{ width: "120px", opacity: 0.9 }}
              />
            </div>

            <div style={{ flex: 1, lineHeight: "1.6" }}>
              <div>
                <strong>(주)오알피컨설팅 (대표: 유희재)</strong>
              </div>
              <div>서울특별시 서초구 효령로 29길 6, 5층 (방배동, 오알피연구소 빌딩)</div>
              <div>사업자등록번호: 694-88-00292 / 대표번호:02-6952-2843</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <span>통신판매업: 2018-서울서초-1944</span>
                <button onClick={openBizInfoPopup} style={smallBorderButtonStyle}>
                  사업자정보확인
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <div>
                <a href="/terms" onClick={handleClick("terms")} style={footerLinkStyle}>
                  이용약관
                </a>{" "}
                |{" "}
                <a href="/privacy" onClick={handleClick("privacy")} style={footerLinkStyle}>
                  개인정보처리방침
                </a>
              </div>

              {/* ✅ 버튼을 기준으로 드롭다운 배치 */}
              <div style={{ position: "relative" }} className="family-dropdown">
                <button
                  onClick={() => setShowFamily((prev) => !prev)}
                  className="family-button"
                >
                  Family Site
                  {showFamily ? (
                    <ChevronUp size={16} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={16} strokeWidth={2} />
                  )}
                </button>

                {showFamily && (
                  <div style={dropdownBoxStyle} className="family-menu">
                    <a
                      className="dd-item"
                      href="http://orpiglobal.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowFamily(false)}
                    >
                      ORP Mongolia
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "#aaa" }}>
            © 2025 ORPi. All rights reserved.
          </div>
        </>
      )}

      <TermsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <PrivacyModal visible={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      <style jsx>{`
        .family-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          width: 120px; /* 데스크톱 고정 */
          padding: 8px 12px;
          font-size: 13px;
          color: #111;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .family-button:hover,
        .family-button:focus {
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
        }

        .family-menu .dd-item {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          background: #fff;
          font-size: 13px;
          color: #111;
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-top: 4px;
        }
        .family-menu .dd-item:hover {
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
        }

        @media (max-width: 950px) {
          .family-button.mobile {
            font-size: 14px;
            padding: 10px 12px;
            width: 160px;
            margin: 0 auto;
          }
          .family-menu.mobile {
            width: 160px;
            margin: 0 auto;
          }
        }
      `}</style>
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

const dropdownBoxStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: "4px",
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  zIndex: 1000,
  width: "120px", // 버튼과 동일
};
