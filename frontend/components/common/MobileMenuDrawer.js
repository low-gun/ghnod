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
import { Activity, GraduationCap, CalendarDays, Handshake, FolderOpen, ShoppingBag } from "lucide-react";
const MENU_ICONS = {
  진단: Activity,
  "조직 개발": GraduationCap,
  "리더십 개발": GraduationCap,
  공개과정: GraduationCap,
  공론화: Handshake,
  일정: CalendarDays,
  "교보재 판매": ShoppingBag,
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
      {centerGroup.map((menu) => {
  const Icon = MENU_ICONS[menu.label] || Activity;
  return (
    <ListItem
      key={menu.label}
      onClick={() => {
        onClose();
        router.push(menu.sub ? `${menu.link}/${menu.sub[0].slug}` : menu.link);
      }}
      sx={{
        borderRadius: "6px",
        transition: "background 0.12s, color 0.11s",
        cursor: "pointer",
        mb: "2px",
        "&:hover": { background: "#e5eefe", color: "#1e3a6e", fontWeight: 700 },
        fontWeight: 500,
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
    </Drawer>
  );
}
