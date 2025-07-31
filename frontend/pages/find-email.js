import { useState } from "react";
import { ChevronLeft, MailSearch } from "lucide-react";
import { useRouter } from "next/router";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function FindEmailPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [foundEmail, setFoundEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showAlert("이름과 휴대폰번호를 모두 입력하세요.");
      return;
    }
    setLoading(true);
    setFoundEmail(null);
    try {
      // const res = await api.post("/auth/find-email", { name, phone });
      // setFoundEmail(res.data.email);
      setTimeout(() => {
        if (name === "테스트" && phone === "01012345678") {
          setFoundEmail("testuser@email.com");
        } else {
          setFoundEmail("");
        }
        setLoading(false);
      }, 700);
    } catch (err) {
      setFoundEmail("");
      setLoading(false);
      showAlert("조회 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="find-email-bg">
      <div className="find-email-panel">
        <button className="back-btn" onClick={() => router.back()}>
          <ChevronLeft size={24} /> <span>로그인으로</span>
        </button>
        <div className="find-email-title-wrap">
          <MailSearch size={36} color="#3577f1" style={{ marginBottom: 4 }} />
          <h2 className="find-email-title">이메일(아이디) 찾기</h2>
          <div className="find-email-desc">
            이름과 휴대폰번호로
            <br />
            가입된 이메일을 확인할 수 있습니다.
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="find-email-form"
        >
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="find-email-input"
            autoFocus
            required
          />
          <input
            type="tel"
            placeholder="휴대폰번호(- 없이 숫자만)"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            className="find-email-input"
            required
            maxLength={20}
          />
          <button type="submit" className="find-email-btn" disabled={loading}>
            {loading ? <span className="loader"></span> : "이메일 찾기"}
          </button>
        </form>
        {/* 결과 카드 */}
        {foundEmail !== null && (
          <div className="find-email-result">
            {foundEmail ? (
              <>
                <div className="result-icon success">
                  <MailSearch size={29} />
                </div>
                <div className="result-title">가입 이메일</div>
                <div className="result-email">{foundEmail}</div>
                <button
                  className="go-login-btn"
                  onClick={() => router.push("/login")}
                >
                  로그인 바로가기
                </button>
              </>
            ) : (
              <div className="result-none">
                <span>일치하는 회원 정보가 없습니다.</span>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        .find-email-bg {
          min-height: 100vh;
          background: linear-gradient(112deg, #3577f1 32%, #fff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family:
            "Pretendard", "Apple SD Gothic Neo", "Segoe UI", "sans-serif";
        }
        .find-email-panel {
          width: 100%;
          max-width: 370px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 26px;
          box-shadow: 0 8px 40px 0 rgba(48, 100, 220, 0.13);
          padding: 48px 30px 36px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          animation: fadeup 0.4s cubic-bezier(0.22, 0.68, 0.64, 1.12);
        }
        .back-btn {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 4px;
          color: #3577f1;
          font-weight: bold;
          position: absolute;
          left: 20px;
          top: 18px;
          font-size: 15px;
          cursor: pointer;
          padding: 3px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .back-btn:hover {
          background: #eef5ff;
        }
        .find-email-title-wrap {
          text-align: center;
          margin-bottom: 30px;
        }
        .find-email-title {
          font-size: 23px;
          font-weight: 800;
          color: #28374a;
          letter-spacing: -1px;
          margin: 0 0 6px 0;
        }
        .find-email-desc {
          color: #5c6c8c;
          font-size: 15.2px;
          font-weight: 400;
          margin-bottom: 0;
          letter-spacing: -0.3px;
        }
        .find-email-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .find-email-input {
          border: 1.5px solid #e3e9fa;
          border-radius: 12px;
          font-size: 16.5px;
          padding: 13px 16px;
          width: 100%;
          background: #fafdff;
          transition:
            border 0.2s,
            box-shadow 0.2s;
          box-shadow: 0 2px 8px 0 rgba(60, 100, 220, 0.03);
        }
        .find-email-input:focus {
          outline: none;
          border: 1.8px solid #3577f1;
          box-shadow: 0 4px 16px 0 rgba(48, 100, 220, 0.06);
        }
        .find-email-btn {
          margin-top: 6px;
          padding: 13px 0;
          border: none;
          border-radius: 10px;
          background: linear-gradient(90deg, #3577f1 60%, #296fff 100%);
          color: #fff;
          font-size: 17.4px;
          font-weight: 700;
          letter-spacing: -1px;
          cursor: pointer;
          box-shadow: 0 2px 14px 0 rgba(60, 120, 250, 0.08);
          transition:
            background 0.19s,
            box-shadow 0.19s;
        }
        .find-email-btn:active {
          background: linear-gradient(90deg, #296fff 80%, #3577f1 100%);
          box-shadow: 0 2px 12px 0 rgba(48, 100, 220, 0.12);
        }
        .find-email-btn:disabled {
          background: #b7c6e4;
          color: #fff;
          cursor: not-allowed;
        }
        .loader {
          width: 22px;
          height: 22px;
          border: 2.5px solid #f1f5fa;
          border-top: 2.5px solid #3577f1;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
        .find-email-result {
          margin-top: 34px;
          width: 100%;
          background: #f5f8ff;
          border-radius: 15px;
          padding: 23px 14px 18px 14px;
          text-align: center;
          box-shadow: 0 3px 12px 0 rgba(80, 130, 255, 0.08);
          animation: fadein 0.25s;
        }
        .result-icon.success {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          color: #3577f1;
        }
        .result-title {
          color: #3577f1;
          font-size: 16.5px;
          font-weight: 800;
          margin-bottom: 9px;
        }
        .result-email {
          font-size: 17px;
          color: #222;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 13px;
        }
        .result-none {
          font-size: 16.5px;
          color: #e30e0e;
          font-weight: 500;
        }
        .go-login-btn {
          background: linear-gradient(90deg, #3577f1 60%, #296fff 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 28px;
          font-size: 15.2px;
          font-weight: 800;
          margin-top: 2px;
          cursor: pointer;
          box-shadow: 0 2px 8px 0 rgba(60, 120, 250, 0.09);
          transition: background 0.17s;
        }
        .go-login-btn:active {
          background: linear-gradient(90deg, #296fff 80%, #3577f1 100%);
        }
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeup {
          from {
            opacity: 0;
            transform: translateY(48px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 500px) {
          .find-email-panel {
            padding: 24px 7vw 30px 7vw;
            border-radius: 17px;
          }
        }
      `}</style>
    </div>
  );
}
