export default function RegisterContainer({ children }) {
  return (
    <div className="register-container-root">
      <div className="register-container-card">
        {children}
      </div>
      <style jsx>{`
        .register-container-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8faff;
        }
        .register-container-card {
          width: 100%;
          max-width: 430px;
          background: #fff;
          border-radius: 26px;
          box-shadow: 0 8px 40px 0 rgba(48,100,220,0.13);
          padding: 46px 32px 36px 32px;
          margin: 52px 0;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: fadeup .33s cubic-bezier(.22,.68,.64,1.12);
        }
        @keyframes fadeup {
          from { opacity: 0; transform: translateY(38px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @media (max-width: 600px) {
          .register-container-card {
            padding: 24px 6vw 22px 6vw;
            border-radius: 17px;
          }
        }
      `}</style>
    </div>
  );
}
