import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  termsContent,
  privacyContent,
  marketingContent,
} from "@/components/register/agreementContents";

export default function AgreementsPage() {
  const router = useRouter();

  // 동의 상태 관리
  const [allChecked, setAllChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  // 공통: 안전한 JSON 파서
  const parseJSON = (str) => {
    try {
      return JSON.parse(str || "{}");
    } catch {
      return {};
    }
  };

  // 최초 진입 시 localStorage 값 복원 + 로깅
  useEffect(() => {
    const savedRaw = localStorage.getItem("registerStep2Form");
    const saved = parseJSON(savedRaw);
    console.log("[AGREEMENTS] mount", { savedParsed: saved });

    if (typeof saved.termsAgree === "boolean") setTermsChecked(saved.termsAgree);
    if (typeof saved.privacyAgree === "boolean")
      setPrivacyChecked(saved.privacyAgree);
    if (typeof saved.marketingAgree === "boolean")
      setMarketingChecked(saved.marketingAgree);
  }, []);

  // 전체 동의 체크박스 로직
  useEffect(() => {
    setAllChecked(!!(termsChecked && privacyChecked && marketingChecked));
  }, [termsChecked, privacyChecked, marketingChecked]);

  const handleAllChecked = (checked) => {
    setAllChecked(checked);
    setTermsChecked(checked);
    setPrivacyChecked(checked);
    setMarketingChecked(checked);
  };

  // 동의 후 뒤로가기(사용 안해도 보존)
  const handleAgree = () => {
    if (window.history.length > 1) router.back();
    else router.push("/register");
  };

  return (
    <div className="agreements-root">
      <div className="agreements-header">
        <h1>회원가입 약관 동의</h1>
        <p>회원 가입을 위해 약관을 읽고 동의해주세요.</p>
      </div>

      {/* 전체 동의 체크 */}
      <div className="agree-checkbox-wrap">
        <label>
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => handleAllChecked(e.target.checked)}
            className="agree-all-checkbox"
          />
          <span className="agree-all-text">전체 약관에 동의</span>
        </label>
      </div>

      <div className="agreements-list">
        <section>
          <label className="agree-label">
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              className="agree-item-checkbox"
            />
            <b>
              이용약관 <span className="required">(필수)</span>
            </b>
          </label>
          <div className="agreements-content">{termsContent}</div>
        </section>
        <hr />
        <section>
          <label className="agree-label">
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
              className="agree-item-checkbox"
            />
            <b>
              개인정보 수집 및 이용 <span className="required">(필수)</span>
            </b>
          </label>
          <div className="agreements-content">{privacyContent}</div>
        </section>
        <hr />
        <section>
          <label className="agree-label">
            <input
              type="checkbox"
              checked={marketingChecked}
              onChange={(e) => setMarketingChecked(e.target.checked)}
              className="agree-item-checkbox"
            />
            <b>
              마케팅 정보 수신 동의 <span className="optional">(선택)</span>
            </b>
          </label>
          <div className="agreements-content">{marketingContent}</div>
        </section>
      </div>

      <div className="agree-btns">
        {/* 이전 버튼: 약관 상태만 병합 저장 + 로그 */}
       {/* 이전 버튼: 값 건드리지 않고 단순 이동 */}
<button
  type="button"
  className="prev-btn"
  onClick={() => {
    console.log("[AGREEMENTS][PREV] just go back to step2 (no changes)");
    router.push("/register?step=2");
  }}
>
  이전
</button>

          {/* 다음 버튼: 동의 상태만 반영 후 이동 */}
          <button
  type="button"
  className="next-btn"
  onClick={() => {
    const beforeRaw = localStorage.getItem("registerStep2Form");
    const before = parseJSON(beforeRaw);

    console.log("[AGREEMENTS][NEXT] click", {
      termsChecked,
      privacyChecked,
      marketingChecked,
      beforeParsed: before,
    });

    const merged = {
      ...before,
      termsAgree: termsChecked,
      privacyAgree: privacyChecked,
      marketingAgree: marketingChecked,
      // ✅ 인증 관련 값 유지
      isVerified: before.isVerified,
      verificationCode: before.verificationCode,
      hasRequestedCode: before.hasRequestedCode,
      timeLeft: before.timeLeft,
    };
    localStorage.setItem("registerStep2Form", JSON.stringify(merged));

    const afterRaw = localStorage.getItem("registerStep2Form");
    console.log("[AGREEMENTS][NEXT] after set LS", {
      afterParsed: parseJSON(afterRaw),
    });

    router.push("/register?step=2");
  }}
  disabled={!(termsChecked && privacyChecked)}
>
  다음
</button>

      </div>

      <style jsx>{`
        .agreements-root {
          max-width: 520px;
          margin: 0 auto;
          background: #fff;
          min-height: 100vh;
          padding: 0 0 74px 0;
          font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Segoe UI',
            sans-serif;
          box-sizing: border-box;
        }
        .agreements-header {
          padding: 34px 20px 18px 20px;
          text-align: center;
        }
        .agreements-header h1 {
          font-size: 22px;
          font-weight: 800;
          color: #27354c;
          margin-bottom: 7px;
        }
        .agreements-header p {
          color: #657391;
          font-size: 15px;
          margin-bottom: 0;
        }
        .agree-checkbox-wrap {
          background: #f3f5fb;
          border-radius: 11px;
          margin: 0 17px 22px 17px;
          padding: 13px 0 12px 14px;
          display: flex;
          align-items: center;
          box-shadow: 0 1px 6px 0 rgba(80, 100, 150, 0.06);
        }
        .agree-checkbox-wrap label {
          display: flex;
          align-items: center;
          font-size: 16px;
          color: #212b44;
          font-weight: 500;
          gap: 10px;
        }
        .agree-all-checkbox {
          accent-color: #3577f1;
          width: 20px;
          height: 20px;
          margin-right: 8px;
        }
        .agree-all-text {
          font-size: 16px;
          font-weight: 500;
          line-height: 1.25;
          display: flex;
          align-items: center;
        }
        .agreements-list {
          padding: 0 17px;
        }
        section {
          margin-bottom: 28px;
        }
        .agree-label {
          display: flex;
          align-items: center;
          font-size: 15px;
          margin-bottom: 8px;
          font-weight: 500;
          gap: 7px;
          color: #27354c;
        }
        .agree-item-checkbox {
          accent-color: #3577f1;
          width: 17px;
          height: 17px;
          margin-right: 6px;
        }
        h2 {
          font-size: 16.5px;
          font-weight: 700;
          color: #27354c;
          margin: 16px 0 9px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .required {
          color: #f5413a;
          font-size: 13px;
        }
        .optional {
          color: #3577f1;
          font-size: 13px;
        }
        .agreements-content {
          background: #f8f9fc;
          border-radius: 10px;
          padding: 15px 14px;
          font-size: 14px;
          color: #334259;
          line-height: 1.65;
          max-height: 230px;
          overflow-y: auto;
          white-space: pre-wrap;
          margin-bottom: 6px;
          box-shadow: 0 1.5px 6px 0 rgba(80, 100, 150, 0.05);
        }
        hr {
          border: none;
          border-top: 1.2px solid #eef0f6;
          margin: 0 0 6px 0;
        }
        /* 하단 버튼 2개 (이전/다음) */
        .agree-btns {
          position: fixed;
          left: 0;
          bottom: 0;
          width: 100vw;
          max-width: 520px;
          margin: 0 auto;
          display: flex;
          z-index: 30;
          background: #fff;
          box-shadow: 0 -2px 16px 0 rgba(80, 100, 180, 0.07);
          padding: 0;
        }
        .prev-btn,
        .next-btn {
          flex: 1 1 0%;
          height: 56px;
          border: none;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -1px;
          cursor: pointer;
          border-radius: 0;
          margin: 0;
          transition: background 0.16s, color 0.13s;
        }
        .prev-btn {
          background: #f6f7fb;
          color: #8a99b3;
          border-right: 1px solid #ecedf3;
        }
        .prev-btn:active {
          background: #eef0f6;
          color: #95a3b8;
        }
        .next-btn {
          background: linear-gradient(90deg, #3577f1 70%, #295fff 100%);
          color: #fff;
        }
        .next-btn:active {
          background: linear-gradient(90deg, #295fff 70%, #3577f1 100%);
        }
        .next-btn:disabled {
          background: #b8c9e6;
          color: #fff;
          cursor: not-allowed;
          opacity: 0.67;
        }
        @media (max-width: 540px) {
          .agreements-root,
          .agree-btns {
            max-width: 100vw;
          }
          .agreements-header {
            padding: 27px 7vw 13px 7vw;
          }
          .agree-checkbox-wrap {
            margin: 0 4vw 15px 4vw;
            padding-left: 8px;
          }
          .agreements-list {
            padding: 0 4vw;
          }
          .agree-all-text {
            font-size: 15.5px;
          }
          .agree-label {
            font-size: 13.7px;
          }
          .agree-item-checkbox {
            width: 15px;
            height: 15px;
            margin-right: 5px;
          }
          .prev-btn,
          .next-btn {
            height: 48px;
            font-size: 15.2px;
          }
          .agreements-content {
            font-size: 13.3px;
            padding: 12px 8px;
            max-height: 160px;
          }
        }
      `}</style>
    </div>
  );
}
