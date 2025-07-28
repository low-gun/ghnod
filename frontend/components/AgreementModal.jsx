import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  termsContent,
  privacyContent,
  marketingContent,
} from "@/components/register/agreementContents";

export default function AgreementModal({
  openKey,
  openModal,
  setOpenModal,
  setTermsAgree,
  setPrivacyAgree,
  setMarketingAgree,
}) {
  // ★★★ 여기에서 값 확인 가능 ★★★
  console.log('[AgreementModal] 렌더', { openModal, openKey, isOpen: openModal === openKey });

  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => {
    if (openModal) {
      setScrolledToBottom(true);
    }
  }, [openModal]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollHeight <= el.clientHeight) {
      setScrolledToBottom(true); // 스크롤 없는 경우 자동 활성화
    } else {
      setScrolledToBottom(false); // 스크롤 가능한 경우 초기화
    }
  }, [openModal]);

  const handleAgree = () => {
    if (openKey === "terms" && setTermsAgree) setTermsAgree(true);
    if (openKey === "privacy" && setPrivacyAgree) setPrivacyAgree(true);
    if (openKey === "marketing" && setMarketingAgree) setMarketingAgree(true);

    setOpenModal(null);
    setScrolledToBottom(false); // 다음 열릴 때 초기화
  };

  const getContent = () => {
    if (openKey === "terms") return termsContent;
    if (openKey === "privacy") return privacyContent;
    if (openKey === "marketing") return marketingContent;
    return null;
  };

  return (
    <Dialog.Root open={openModal === openKey}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            position: "fixed",
            inset: 0,
            zIndex: 100,
          }}
        />
        <Dialog.Content
          style={{
            background: "white",
            borderRadius: "8px",
            padding: "24px",
            width: "90%",
            maxWidth: "480px",
            maxHeight: "80vh",
            overflow: "hidden",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 101,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Dialog.Title style={{ fontSize: "18px", fontWeight: "bold" }}>
                {openKey === "terms"
                  ? "이용약관 동의"
                  : openKey === "privacy"
                    ? "개인정보 수집 및 이용 동의"
                    : "마케팅 정보 수신 동의"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  onClick={() => setOpenModal(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                  }}
                  aria-label="닫기"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description
              style={{
                fontSize: "14px",
                color: "#666",
                marginTop: "8px",
              }}
            >
              아래 내용을 확인하신 후 동의해 주세요.
            </Dialog.Description>
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              lineHeight: "1.5",
              color: "#333",
              border: "1px solid #ddd",
              padding: "12px",
              borderRadius: "4px",
              background: "#fafafa",
            }}
          >
            {getContent()}
          </div>

          <div style={{ textAlign: "right" }}>
            <button
              type="button"
              onClick={handleAgree}
              disabled={!scrolledToBottom}
              style={{
                backgroundColor: scrolledToBottom ? "#0070f3" : "#ccc",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: scrolledToBottom ? "pointer" : "not-allowed",
              }}
            >
              동의함
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
