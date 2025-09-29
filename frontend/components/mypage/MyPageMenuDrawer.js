import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,  
} from "@mui/material";
import { User, BookOpen, CreditCard, Tag, Star, MessageCircle, LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { useIsTabletOrBelow980 } from "@/lib/hooks/useIsDeviceSize";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";
const MENUS = [
  { label: "내 정보", icon: User },
  { label: "수강정보", icon: BookOpen },
  { label: "결제내역", icon: CreditCard },
  { label: "쿠폰", icon: Tag },
  { label: "포인트", icon: Star },
  { label: "1:1문의", icon: MessageCircle },
];

const siteUrl =
  (typeof window !== "undefined" && window.location.origin) ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://orpconsulting.co.kr";

const rememberAfterLogout = () => {
  try {
    const here = window.location.pathname + window.location.search;
    sessionStorage.setItem("AFTER_LOGOUT_GO", here);
  } catch {}
};

export default function MyPageMenuDrawer({
  open,
  setOpen,
  activeMenu,
  setActiveMenu,
}) {
  const isTabletOrBelow = useIsTabletOrBelow980();
  const router = useRouter();
  const { logout, user } = useContext(UserContext);

  if (!isTabletOrBelow) return null;

 // 소셜 로그아웃 분기 + 일반 로그아웃
  const handleLogout = async () => {
    // 이전 위치 기억
    rememberAfterLogout();
  
    // 소셜 로그아웃 분기
    if (user?.socialProvider === "kakao") {
      const restKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
      if (!restKey) {
        // REST 키 없으면 일반 로그아웃으로 폴백
        await logout();
        return;
      }
      const redirectUri = `${siteUrl}/logout/callback`;
      window.location.href =
        `https://kauth.kakao.com/oauth/logout` +
        `?client_id=${encodeURIComponent(restKey)}` +
        `&logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
      return;
    }
  
    if (user?.socialProvider === "naver") {
      const returl = `${siteUrl}/logout/callback`;
      window.location.href =
        `https://nid.naver.com/nidlogin.logout?returl=${encodeURIComponent(returl)}`;
      return;
    }
  
    // 일반 로그아웃: UserContext.logout 내부에서 서버호출+이동 처리
    await logout();
  };
  

  return (
    <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
      <div
        style={{
          width: 230,
          padding: "24px 0",
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <List>
  {MENUS.map((menu) => {
    const Icon = menu.icon;
    return (
      <ListItem
        key={menu.label}
        selected={menu.label === activeMenu}
        onClick={() => {
          setActiveMenu(menu.label);
          setOpen(false);
          router.push({
            pathname: "/mypage",
            query: { menu: menu.label },
          });
        }}
        sx={{
          borderRadius: "6px",
          transition: "background 0.12s, color 0.11s",
          cursor: "pointer",
          mb: "2px",
          "&:hover": {
            background: "#e5eefe",
            color: "#1e3a6e",
            fontWeight: 700,
          },
        }}
      >
        <ListItemIcon>
          <Icon size={18} />
        </ListItemIcon>
        <ListItemText primary={menu.label} />
      </ListItem>
    );
  })}
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
              letterSpacing: "0.5px",
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
