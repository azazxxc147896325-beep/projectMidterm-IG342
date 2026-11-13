import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingSpinner from "../components/LoadingSpinner";
import PageTitle from "../components/PageTitle";
import { useAuth } from "../contexts/AuthContext";
import { getNotifications, markNotifications, subscribeToCollection } from "../services/api";
import { messageFrom, timeAgo, toAppUser } from "../utils/format";
import { useTheme } from "../contexts/ThemeContext";

const icon = { like: "heart", comment: "message", friend_request: "users", friend_accepted: "check" };
export default function Notifications() {
  const { language, t } = useTheme();
  const copy = { like: t("ถูกใจโพสต์ของคุณ", "liked your post"), comment: t("แสดงความคิดเห็นบนโพสต์ของคุณ", "commented on your post"), friend_request: t("ส่งคำขอเป็นเพื่อนถึงคุณ", "sent you a friend request"), friend_accepted: t("ยอมรับคำขอเป็นเพื่อนแล้ว", "accepted your friend request") };
  const { user } = useAuth(); const navigate = useNavigate(); const [items, setItems] = useState([]); const [tab, setTab] = useState("all"); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => {
    let active = true; const refresh = () => getNotifications(user.id).then((data) => active && setItems(data)).catch((e) => active && setError(messageFrom(e))).finally(() => active && setLoading(false)); refresh();
    const unsubscribe = subscribeToCollection("notifications", refresh, `recipient_id=eq.${user.id}`);
    return () => { active = false; unsubscribe(); };
  }, [user.id]);
  const markAll = async () => { try { await markNotifications(user.id); setItems((values) => values.map((item) => ({ ...item, is_read: true }))); } catch (e) { setError(messageFrom(e)); } };
  const markOne = async (item) => { if (item.is_read) return; try { await markNotifications(user.id, [item.id]); setItems((values) => values.map((value) => value.id === item.id ? { ...value, is_read: true } : value)); } catch (e) { setError(messageFrom(e)); } };
  const openNotification = async (item) => { await markOne(item); if ((item.type === "like" || item.type === "comment") && item.post_id) navigate(`/post/${item.post_id}`); else if (item.actor?.id) navigate(`/profile/${item.actor.id}`); };
  const unread = items.filter((item) => !item.is_read).length; const visible = tab === "unread" ? items.filter((item) => !item.is_read) : items;
  return <div className="page-stack"><PageTitle eyebrow="UPDATES" title={t("การแจ้งเตือน", "Notifications")} description={t("ไม่พลาดทุกความเคลื่อนไหวจากเพื่อนของคุณ", "Keep up with every update from your friends.")} action={<button className="text-button" onClick={markAll} disabled={!unread}><Icon name="check" size={17}/>{t("อ่านทั้งหมดแล้ว", "Mark all read")}</button>}/>{error && <div className="alert error">{error}</div>}<div className="notification-tabs"><button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>{t("ทั้งหมด", "All")}</button><button className={tab === "unread" ? "active" : ""} onClick={() => setTab("unread")}>{t("ยังไม่อ่าน", "Unread")} <b>{unread}</b></button></div>{loading ? <LoadingSpinner/> : <section className="notification-list card">{visible.map((item) => { const actor = toAppUser(item.actor); const typeIcon = icon[item.type] || "bell"; return <button className={`notification-row ${!item.is_read ? "unread" : ""}`} key={item.id} onClick={() => openNotification(item)}><div className="notification-avatar"><Avatar user={actor}/><span className={`notification-type type-${typeIcon}`}><Icon name={typeIcon} size={13} filled={typeIcon === "heart"}/></span></div><div><p><strong>{actor.name}</strong> {copy[item.type] || t("มีความเคลื่อนไหวใหม่", "has a new update")}</p><small>{timeAgo(item.created_at, language)}</small></div><Icon name="chevron" size={16} className="notification-chevron"/>{!item.is_read && <i/>}</button>; })}{!visible.length && <EmptyState icon="bell" title={t("ยังไม่มีรายการ", "Nothing here yet")} description={t("การแจ้งเตือนใหม่จะปรากฏที่นี่", "New notifications will appear here.")}/>}</section>}</div>;
}
