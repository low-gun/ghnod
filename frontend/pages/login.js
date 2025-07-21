export default function LoginPage() {
    // ...state, useContext, etc. 위와 동일...
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { user, login } = useContext(UserContext);
    const { setCartItems, setCartReady } = useCartContext();
    const alreadyRedirected = useRef(false);
  
    // ⭐️ 마운트/언마운트 로그 추가
    useEffect(() => {
      console.log("🟢 [LoginPage] MOUNTED");
      return () => {
        console.log("🟠 [LoginPage] UNMOUNTED");
      };
    }, []);
  
    // ⭐️ 라우팅 useEffect 복원 (기본 버전)
    useEffect(() => {
      console.log(
        "🟩 [LoginPage] 라우팅 useEffect 진입, alreadyRedirected:",
        alreadyRedirected.current,
        "user.id:", user?.id,
        "pathname:", router.pathname
      );
      if (!user?.id) return;
      const target = user.role === "admin" ? "/admin" : "/";
      if (alreadyRedirected.current) return;
      if (router.pathname === "/login" && router.pathname !== target) {
        router.push(target);
        alreadyRedirected.current = true;
        console.log("[LoginPage 라우팅] 최초 이동 시도:", target);
      }
      console.log("🟦 [LoginPage] alreadyRedirected 값(마지막):", alreadyRedirected.current);
    }, [user?.id, user?.role, router.pathname]);
  
    if (user?.id) return null;
  
    return (
      // 1단계 폼 그대로
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "77vh",
        background: "#fff",
        margin: 0,
      }}>
        <div style={{
          width: "360px",
          padding: "40px",
          borderRadius: "8px",
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center",
          boxSizing: "border-box",
        }}>
          <h1 style={{ fontSize: "24px", margin: 0 }}>로그인</h1>
          <form
            onSubmit={e => { e.preventDefault(); alert("submit!"); }}
            autoComplete="off"
            style={{ textAlign: "left" }}
          >
            <input
              type="email"
              name="nope_email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "15px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "15px",
              }}
            />
            <input
              type="password"
              name="nope_password"
              autoComplete="current-password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "15px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "15px",
              }}
            />
            <button type="submit" style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "4px",
              backgroundColor: "#0070f3",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}>
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }
  