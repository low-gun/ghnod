// frontend/components/common/GlobalAgreements.js
import { useEffect, useState } from "react";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";
import { useGlobalAgreements } from "@/stores/globalAgreements";
import {
  termsContent,
  privacyContent,
  marketingContent,
} from "@/components/register/agreementContents";

export default function GlobalAgreements() {
  const isMobile = useIsMobile();
  const { visible, initial, confirm, cancel } = useGlobalAgreements();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (visible) {
      setTerms(!!initial.terms);
      setPrivacy(!!initial.privacy);
      setMarketing(!!initial.marketing);
    }
  }, [visible, initial]);

  if (!visible) return null;

  const canSubmit = terms && privacy;

  const PrimaryBtn = ({ disabled, onClick, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        border: "none",
        background: disabled ? "#b8c9e6" : "#3577f1",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "-0.3px",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 2px 10px rgba(53,119,241,0.25)",
      }}
    >
      {children}
    </button>
  );

  const GhostBtn = ({ onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        border: "1px solid #e3e9fa",
        background: "#f6f7fb",
        color: "#6b7689",
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: "-0.3px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );

  const AllAgree = () => {
    const allChecked = terms && privacy && marketing;
    return (
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
          background: "#f6f8ff",
          border: "1px solid #e3e9fa",
          borderRadius: 10,
          padding: "10px 12px",
        }}
      >
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => {
            const c = e.target.checked;
            setTerms(c);
            setPrivacy(c);
            setMarketing(c);
          }}
          style={{ width: 18, height: 18, accentColor: "#3577f1" }}
        />
        <b style={{ color: "#27354c" }}>전체 약관에 동의</b>
      </label>
    );
  };

  const Section = ({ label, checked, onChange, content }) => (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
          color: "#27354c",
          fontWeight: 600,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: "#3577f1" }}
        />
        <span>{label}</span>
      </label>
      <div
        style={{
          background: "#f8f9fc",
          border: "1px solid #eef0f6",
          borderRadius: 10,
          padding: "10px 12px",
          color: "#334259",
          fontSize: 13.6,
          lineHeight: 1.62,
          maxHeight: 140,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>
    </div>
  );

  const Body = (
    <>
      <AllAgree />
      <Section label="이용약관 (필수)" checked={terms} onChange={setTerms} content={termsContent} />
      <Section label="개인정보 수집 및 이용 (필수)" checked={privacy} onChange={setPrivacy} content={privacyContent} />
      <Section label="마케팅 정보 수신 동의 (선택)" checked={marketing} onChange={setMarketing} content={marketingContent} />
    </>
  );

  // 모바일: 바텀시트(토스트형)
  if (isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 2001,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100vw",
            maxWidth: 520,
            background: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            boxShadow: "0 -8px 28px rgba(0,0,0,0.14)",
            padding: "12px 14px",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 999,
              background: "#e3e9fa",
              margin: "0 auto 10px",
            }}
          />
          <h3
            style={{
              margin: "2px 0 10px",
              fontSize: 16.5,
              color: "#27354c",
              textAlign: "center",
              fontWeight: 800,
              letterSpacing: "-0.4px",
            }}
          >
            약관 동의
          </h3>

          <div style={{ maxHeight: "52vh", overflowY: "auto" }}>{Body}</div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 10,
            }}
          >
            <GhostBtn onClick={cancel}>취소</GhostBtn>
            <PrimaryBtn disabled={!canSubmit} onClick={() => confirm({ terms, privacy, marketing })}>
              확인
            </PrimaryBtn>
          </div>
        </div>
      </div>
    );
  }

  // 데스크탑: 가운데 모달(ConfirmModal 톤)
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        zIndex: 2001,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(760px, 92vw)",
          maxHeight: "84vh",
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 4px 20px #0001",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3 style={{ margin: "2px 0 12px", fontSize: 18, color: "#27354c", fontWeight: 800 }}>
          회원가입 약관 동의
        </h3>

        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 6 }}>{Body}</div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
          <GhostBtn onClick={cancel}>취소</GhostBtn>
          <PrimaryBtn disabled={!canSubmit} onClick={() => confirm({ terms, privacy, marketing })}>
            확인
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
