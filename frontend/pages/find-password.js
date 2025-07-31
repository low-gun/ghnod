import { useState } from "react";
import { ChevronLeft, MailCheck } from "lucide-react";
import { useRouter } from "next/router";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function FindPasswordPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null); // null | "sent" | "notfound" | "error"
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showAlert("이메일을 입력하세요.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // 실제로는 API 요청
      // const res = await api.post("/auth/find-password", { email });
      // if (res.data.success) setResult("sent");
      // else setResult("notfound");
      // 데모: "testuser@email.com"만 성공 처리
      setTimeout(() => {
        if (email === "testuser@email.com") {
          setResult("sent");
        } else {
          setResult("notfound");
        }
        setLoading(false);
      }, 700);
    } catch (err) {
      setResult("error");
      setLoading(false);
      showAlert("처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="findpw-bg">
      <div className="findpw-panel">
        <button className="back-btn" onClick={() => router.back()}>
          <ChevronLeft size={24} /> <span>로그인으로</span>
        </button>
        <div className="findpw-title-wrap">
          <MailCheck size={38} color="#3577f1" style={{ marginBottom: 4 }} />
          <h2 className="findpw-title">비밀번호 찾기</h2>
          <div className="findpw-desc">
            가입하신 이메일을 입력하시면
            <br />
            임시 비밀번호를 메일로 발송해 드립니다.
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="findpw-form"
        >
          <input
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="findpw-input"
            autoFocus
            required
          />
          <button type="submit" className="findpw-btn" disabled={loading}>
            {loading ? <span className="loader"></span> : "임시 비밀번호 받기"}
          </button>
        </form>
        {/* 결과 카드 */}
        {result && (
          <div className="findpw-result">
            {result === "sent" && (
              <>
                <div className="result-icon success">
                  <MailCheck size={32} />
                </div>
                <div className="result-title">
                  임시 비밀번호가 이메일로 발송되었습니다.
                </div>
                <div className="result-desc">
                  메일이 도착하지 않으면 스팸함도 확인해 주세요.
                  <br />
                  로그인 후 반드시 비밀번호를 변경해 주세요.
                </div>
                <button
                  className="go-login-btn"
                  onClick={() => router.push("/login")}
                >
                  로그인 바로가기
                </button>
              </>
            )}
            {result === "notfound" && (
              <div className="result-none">
                <span>일치하는 회원 정보가 없습니다.</span>
              </div>
            )}
            {result === "error" && (
              <div className="result-none" style={{ color: "#b90000" }}>
                <span>처리 중 오류가 발생했습니다.</span>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        .findpw-bg {
          min-height: 100vh;
          background: linear-gradient(115deg, #3577f1 30%, #fff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family:
            "Pretendard", "Apple SD Gothic Neo", "Segoe UI", "sans-serif";
        }
        .findpw-panel {
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
        .findpw-title-wrap {
          text-align: center;
          margin-bottom: 32px;
        }
        .findpw-title {
          font-size: 23px;
          font-weight: 800;
          color: #28374a;
          letter-spacing: -1px;
          margin: 0 0 6px 0;
        }
        .findpw-desc {
          color: #5c6c8c;
          font-size: 15.3px;
          font-weight: 400;
          margin-bottom: 0;
          letter-spacing: -0.3px;
        }
        .findpw-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .findpw-input {
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
        .findpw-input:focus {
          outline: none;
          border: 1.8px solid #3577f1;
          box-shadow: 0 4px 16px 0 rgba(48, 100, 220, 0.06);
        }
        .findpw-btn {
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
        .findpw-btn:active {
          background: linear-gradient(90deg, #296fff 80%, #3577f1 100%);
          box-shadow: 0 2px 12px 0 rgba(48, 100, 220, 0.12);
        }
        .findpw-btn:disabled {
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
        .findpw-result {
          margin-top: 34px;
          width: 100%;
          background: #f5f8ff;
          border-radius: 15px;
          padding: 25px 14px 20px 14px;
          text-align: center;
          box-shadow: 0 3px 12px 0 rgba(80, 130, 255, 0.08);
          animation: fadein 0.25s;
        }
        .result-icon.success {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 7px;
          color: #3577f1;
        }
        .result-title {
          color: #3577f1;
          font-size: 16.7px;
          font-weight: 800;
          margin-bottom: 11px;
        }
        .result-desc {
          font-size: 15.3px;
          color: #42536a;
          margin-bottom: 16px;
          line-height: 1.6;
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
          .findpw-panel {
            padding: 24px 7vw 30px 7vw;
            border-radius: 17px;
          }
        }
      `}</style>
    </div>
  );
}
