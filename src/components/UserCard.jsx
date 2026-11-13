import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { friendAction } from "../services/api";
import { messageFrom, toAppUser } from "../utils/format";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { useTheme } from "../contexts/ThemeContext";

export default function UserCard({ user, currentUserId, compact = false, onChanged }) {
  const { t } = useTheme();
  const labels = { add: t("เพิ่มเพื่อน", "Add friend"), requested: t("ยกเลิกคำขอ", "Cancel request"), accept: t("ตอบรับ", "Accept"), friend: t("เป็นเพื่อนแล้ว", "Friends") };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [relationship, setRelationship] = useState({ status: user.status, requestId: user.requestId });
  const person = toAppUser(user);

  useEffect(() => { setRelationship({ status: user.status, requestId: user.requestId }); }, [user.requestId, user.status]);

  const action = async () => {
    if (busy || relationship.status === "friend") return;
    const previous = relationship;
    const optimistic = relationship.status === "add" ? { status: "requested" }
      : relationship.status === "requested" ? { status: "add" }
        : { status: "friend" };
    setRelationship(optimistic); setBusy(true); setError("");
    try {
      const { data, error: apiError } = await friendAction(currentUserId, { ...user, ...previous });
      if (apiError) throw apiError;
      if (previous.status === "add" && data) setRelationship({ status: "requested", requestId: data });
      await onChanged?.();
    } catch (actionError) {
      setRelationship(previous);
      setError(messageFrom(actionError));
    } finally { setBusy(false); }
  };

  return <div className={`user-card ${compact ? "user-card-compact" : "card"}`}><Link to={`/profile/${user.id}`}><Avatar user={person} size={compact ? "md" : "lg"}/></Link><div className="user-card-info"><Link to={`/profile/${user.id}`}><strong>{person.name}</strong></Link><span>@{person.username}</span>{!compact && <p>{person.bio || t("สมาชิก QuoteMate", "QuoteMate member")}</p>}{error && <small className="inline-error">{error}</small>}</div><button disabled={busy || relationship.status === "friend"} onClick={action} className={`friend-button status-${relationship.status}`}>{relationship.status === "add" && <Icon name="plus" size={16}/>} {relationship.status === "friend" && <Icon name="check" size={16}/>} {busy ? t("กำลังบันทึก...", "Saving...") : labels[relationship.status]}</button></div>;
}
