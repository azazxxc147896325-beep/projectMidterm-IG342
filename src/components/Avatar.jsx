import { useTheme } from "../contexts/ThemeContext";

export default function Avatar({ user, size = "md", online = false }) {
  const { t } = useTheme();
  return (
    <div className={`avatar avatar-${size} avatar-${user?.color || "mint"}`} aria-label={`${t("รูปโปรไฟล์", "Profile picture")} ${user?.name || t("ผู้ใช้", "user")}`}>
      {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{user?.initials || "QM"}</span>}
      {online && <i />}
    </div>
  );
}
