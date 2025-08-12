import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useRouter } from "next/router";
import { useIsTabletOrBelow980 } from "@/lib/hooks/useIsDeviceSize";
import { centerGroup } from "@/data/menuData";
import {
  Activity,
  GraduationCap,
  CalendarDays,
  Handshake,
  FolderOpen,
  ShoppingBag,
} from "lucide-react";

const MENU_ICONS = {
  진단: <Activity size={18} />,
  교육: <GraduationCap size={18} />,
  교육일정: <CalendarDays size={18} />,
  컨설팅: <Handshake size={18} />,
  수행사례: <FolderOpen size={18} />,
  FTShop: <ShoppingBag size={18} />,
};

export default function MobileMenuDrawer({ open, onClose }) {
  const isCompactNav = useIsTabletOrBelow980(); // ✅ 980px 이하에서만 렌더
  const router = useRouter();

  if (!isCompactNav) return null;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 230,
          padding: "24px 0",
          boxSizing: "border-box",
        },
      }}
    >
      <List>
        {centerGroup.map((menu) => (
          <ListItem
            key={menu.label}
            onClick={() => {
              onClose();
              router.push(
                menu.sub ? `${menu.link}/${menu.sub[0].slug}` : menu.link
              );
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
              fontWeight: 500,
            }}
          >
            <ListItemIcon>
              {MENU_ICONS[menu.label] || <Activity size={18} />}
            </ListItemIcon>
            <ListItemText primary={menu.label} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
