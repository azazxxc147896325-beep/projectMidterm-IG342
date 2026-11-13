import usePresence from "../hooks/usePresence";
import { useTheme } from "../contexts/ThemeContext";

export default function Avatar({ user, size = "md", online }) {
  const { t } = useTheme();
  const liveOnline = usePresence(online === undefined ? user?.id : null);
  const active = online ?? liveOnline;
  const status = active ? t("กำลังใช้งาน", "Online") : t("ออฟไลน์", "Offline");
  return (
    <div className={`avatar avatar-${size} avatar-${user?.color || "mint"}`} aria-label={`${t("รูปโปรไฟล์", "Profile picture")} ${user?.name || t("ผู้ใช้", "user")}`}>
      {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{user?.initials || "QM"}</span>}
      {user?.id && <i className={`presence-dot ${active ? "is-online" : "is-offline"}`} role="img" aria-label={status} title={status}/>}
    </div>
  );
}
