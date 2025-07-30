import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { User, BookOpen, CreditCard, Tag, Star, MessageCircle, LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MENUS = [
  { label: "내 정보", icon: <User size={18} /> },
  { label: "수강정보", icon: <BookOpen size={18} /> },
  { label: "결제내역", icon: <CreditCard size={18} /> },
  { label: "쿠폰", icon: <Tag size={18} /> },
  { label: "포인트", icon: <Star size={18} /> },
  { label: "1:1문의", icon: <MessageCircle size={18} /> },
];

export default function MyPageMenuDrawer({ open, setOpen, activeMenu, setActiveMenu }) {
  const isTabletOrBelow = useIsTabletOrBelow();
  const router = useRouter();
  const { logout, user } = useContext(UserContext);

  if (!isTabletOrBelow) return null;

  // 소셜 로그아웃 분기 + 일반 로그아웃
  const handleLogout = async () => {
    const KAKAO_LOGOUT_URL = `https://kauth.kakao.com/oauth/logout?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&logout_redirect_uri=https://YOUR_DOMAIN/logout/callback`;
    const NAVER_LOGOUT_URL = `https://nid.naver.com/nidlogin.logout?returl=https://ghnod.vercel.app/logout/callback`;

    if (user?.socialProvider === "kakao") {
      window.location.href = KAKAO_LOGOUT_URL;
      return;
    }
    if (user?.socialProvider === "naver") {
      window.location.href = NAVER_LOGOUT_URL;
      return;
    }

    try {
      await logout(); // UserContext 내장 함수
      toast.success("로그아웃 되었습니다.");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  return (
    <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
      <div style={{
        width: 230,
        padding: "24px 0",
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}>
        <List>
          {MENUS.map((menu) => (
            <ListItem
              key={menu.label}
              selected={menu.label === activeMenu}
              onClick={() => {
                setActiveMenu(menu.label);
                setOpen(false);
                router.push({ pathname: "/mypage", query: { menu: menu.label } });
              }}
              sx={{
                borderRadius: "6px",
                transition: "background 0.12s, color 0.11s",
                cursor: "pointer",
                mb: "2px",
                '&:hover': {
                  background: "#e5eefe",
                  color: "#1e3a6e",
                  fontWeight: 700,
                },
              }}
            >
              <ListItemIcon>{menu.icon}</ListItemIcon>
              <ListItemText primary={menu.label} />
            </ListItem>
          ))}
        </List>
        <div style={{ width: "100%" }}>
          <Divider style={{ margin: "16px 0 0 0", background: "#eee" }} />
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              border: "none",
              background: "none",
              color: "#d92d20",
              fontWeight: "bold",
              fontSize: "15px",
              padding: "14px 0 10px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              letterSpacing: "0.5px"
            }}
          >
            <LogOut size={18} style={{ marginRight: 4 }} />
            로그아웃
          </button>
        </div>
      </div>
    </Drawer>
  );
}
