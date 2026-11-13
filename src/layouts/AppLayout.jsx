import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import Logo from "../components/Logo";
import OnboardingDialog from "../components/OnboardingDialog";
import { useAuth } from "../contexts/AuthContext";
import { getUnreadNotificationCount, subscribeToCollection } from "../services/api";
import { toAppUser } from "../utils/format";
import { hasSeenOnboarding, markOnboardingSeen } from "../utils/localPreferences";
import { useTheme } from "../contexts/ThemeContext";

const linkClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

export default function AppLayout() {
  const { user, profile } = useAuth();
  const { t } = useTheme();
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const refresh = () => getUnreadNotificationCount(user.id).then(setUnread);
    refresh();
    const unsubscribe = subscribeToCollection("notifications", refresh, `recipient_id=eq.${user.id}`);
    return unsubscribe;
  }, [user.id]);
  const hideRight = location.pathname.startsWith("/settings") || location.pathname.startsWith("/profile/") || location.pathname.startsWith("/post/");
  const currentUser = toAppUser(profile);
  const navItems = [
    { to: "/feed", icon: "home", label: t("หน้าหลัก", "Home") },
    { to: "/friends", icon: "users", label: t("เพื่อน", "Friends") },
    { to: "/discover", icon: "search", label: t("ค้นหาเพื่อน", "Find friends") },
    { to: "/notifications", icon: "bell", label: t("การแจ้งเตือน", "Notifications") },
    { to: "/profile", icon: "user", label: t("โปรไฟล์", "Profile") },
  ];
  const items = navItems.map((item) => item.to === "/notifications" ? { ...item, badge: unread } : item);
  const completeOnboarding = () => { markOnboardingSeen(); setShowOnboarding(false); };
  return (
    <div className="app-shell">
      {showOnboarding && <OnboardingDialog onComplete={completeOnboarding}/>} 
      <header className="mobile-header"><Logo /><div className="mobile-header-actions"><NavLink to="/notifications" className="header-action" aria-label={t("การแจ้งเตือน", "Notifications")}><Icon name="bell" />{unread > 0 && <b>{unread}</b>}</NavLink><NavLink to="/settings" className="header-action" aria-label={t("ตั้งค่า", "Settings")}><Icon name="settings" /></NavLink></div></header>
      <aside className="sidebar">
        <Logo />
        <nav>{items.filter((item) => item.to !== "/profile").map((item) => <NavLink key={item.to} to={item.to} className={linkClass}><span className="nav-icon"><Icon name={item.icon} /></span><span>{item.label}</span>{item.badge > 0 && <b>{item.badge}</b>}</NavLink>)}</nav>
        <div className="sidebar-bottom">
          <NavLink to="/settings" className={linkClass}><span className="nav-icon"><Icon name="settings" /></span><span>{t("ตั้งค่า", "Settings")}</span></NavLink>
          <NavLink to="/profile" className="signed-user" aria-label={t("เปิดโปรไฟล์ของฉัน", "Open my profile")}>
            <div className="signed-user-avatar"><Avatar user={currentUser} size="md" online /></div>
            <div className="signed-user-details"><strong>{currentUser.name}</strong><span>@{currentUser.username}</span></div>
            <Icon name="chevron" size={17} className="signed-user-profile-arrow" />
          </NavLink>
        </div>
      </aside>
      <main className={`main-content ${hideRight ? "wide" : ""}`}><Outlet /></main>
      {!hideRight && <aside className="right-rail">
        <form className="search-box" onSubmit={(event) => { event.preventDefault(); navigate(`/discover${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`); }}><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("ค้นหาเพื่อน", "Find friends")} aria-label={t("ค้นหาเพื่อน", "Find friends")} /></form>
        <section className="rail-card"><div className="rail-heading"><h3>{t("พบเพื่อนใหม่", "Meet new friends")}</h3><NavLink to="/discover">{t("ดูทั้งหมด", "View all")}</NavLink></div><p className="rail-copy">{t("ค้นหาด้วย Username หรือชื่อที่แสดง แล้วเริ่มแบ่งปันประโยคดี ๆ ด้วยกัน", "Search by username or display name and start sharing meaningful words together.")}</p></section>
        <footer>QuoteMate · กิตตินันท์ บุญคุ้ม · 66112126</footer>
      </aside>}
      <nav className="bottom-nav" aria-label={t("เมนูหลัก", "Main navigation")}>{items.map((item) => <NavLink key={item.to} to={item.to} className={linkClass} aria-label={item.label} title={item.label}><span><Icon name={item.icon} />{item.badge > 0 && <b>{item.badge}</b>}</span></NavLink>)}</nav>
    </div>
  );
}
