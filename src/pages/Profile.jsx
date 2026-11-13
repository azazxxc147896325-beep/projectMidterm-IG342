import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingSpinner from "../components/LoadingSpinner";
import PostCard from "../components/PostCard";
import { coverThemes } from "../constants/cardStyles";
import { useAuth } from "../contexts/AuthContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import useModalA11y from "../hooks/useModalA11y";
import { friendAction, getFriendCount, getFriendStatus, getPostCount, getPosts, getProfile, updateProfile, uploadAvatar } from "../services/api";
import { messageFrom, toAppUser } from "../utils/format";
import { useTheme } from "../contexts/ThemeContext";

export default function Profile() {
  const { t } = useTheme();
  const friendLabels = { add: t("เพิ่มเพื่อน", "Add friend"), requested: t("ยกเลิกคำขอ", "Cancel request"), accept: t("ตอบรับคำขอ", "Accept request"), friend: t("เป็นเพื่อนแล้ว", "Friends") };
  const { userId } = useParams();
  const { user: authUser, profile: ownProfile, refreshProfile } = useAuth();
  const isMe = !userId || userId === authUser.id;
  const targetId = isMe ? authUser.id : userId;
  const [profile, setProfile] = useState(isMe ? ownProfile : null);
  const [posts, setPosts] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const [relationship, setRelationship] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", cover_theme: "mint" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();
  const postLimitRef = useRef(8);
  const editDialogRef = useModalA11y(() => { if (!busy) setEditing(false); }, editing);

  const loadProfilePage = useCallback(async () => {
    const [personResult, values, totalPosts, status, friends] = await Promise.all([
      getProfile(targetId),
      getPosts({ userId: authUser.id, authorId: targetId, limit: postLimitRef.current }),
      getPostCount(targetId),
      isMe ? Promise.resolve(null) : getFriendStatus(authUser.id, targetId),
      getFriendCount(targetId),
    ]);
    return { person: personResult, values, totalPosts, status, friends };
  }, [authUser.id, isMe, targetId]);

  const applyProfilePage = useCallback(({ person, values, totalPosts, status, friends }, updateForm = true) => {
    setProfile(person); setPosts(values.items); setPostCount(totalPosts); setNextCursor(values.nextCursor); setHasMore(values.hasMore); setRelationship(status); setFriendCount(friends);
    if (updateForm) setForm({ display_name: person.display_name, bio: person.bio || "", cover_theme: person.cover_theme || "mint" });
  }, []);

  const refreshLive = useCallback(async () => {
    try { applyProfilePage(await loadProfilePage(), !editing); }
    catch (e) { setError(messageFrom(e)); }
  }, [applyProfilePage, editing, loadProfilePage]);

  useRealtimeRefresh(`profile-${authUser.id}-${targetId}`, [
    { table: "profiles", filter: `id=eq.${targetId}` },
    { table: "posts", filter: `author_id=eq.${targetId}` },
    "comments", "likes", "friend_requests", "friendships",
  ], refreshLive);

  useEffect(() => {
    let active = true; postLimitRef.current = 8; setLoading(true);
    loadProfilePage().then((data) => active && applyProfilePage(data)).catch((e) => active && setError(messageFrom(e))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [applyProfilePage, loadProfilePage, ownProfile]);

  const save = async () => {
    if (!form.display_name.trim()) return;
    setBusy(true);
    try {
      const next = await updateProfile(authUser.id, { display_name: form.display_name.trim(), bio: form.bio.trim(), cover_theme: form.cover_theme });
      setProfile(next); await refreshProfile(); setEditing(false);
    } catch (e) { setError(messageFrom(e)); }
    finally { setBusy(false); }
  };

  const changeAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) { setError(t("กรุณาเลือกไฟล์รูปภาพขนาดไม่เกิน 2 MB", "Please choose an image no larger than 2 MB.")); return; }
    setBusy(true);
    try {
      const avatar_url = await uploadAvatar(authUser.id, file);
      const next = await updateProfile(authUser.id, { avatar_url });
      setProfile(next); await refreshProfile();
    } catch (e) { setError(messageFrom(e)); }
    finally { setBusy(false); event.target.value = ""; }
  };

  const updateFriendship = async () => {
    if (!relationship || relationship.status === "friend" || busy) return;
    setBusy(true); setError("");
    try {
      const { error: actionError } = await friendAction(authUser.id, { id: targetId, ...relationship });
      if (actionError) throw actionError;
      setRelationship(await getFriendStatus(authUser.id, targetId));
    } catch (e) { setError(messageFrom(e)); }
    finally { setBusy(false); }
  };

  const loadMore = async () => {
    if (!nextCursor || busy) return;
    setBusy(true); setError("");
    try {
      const result = await getPosts({ userId: authUser.id, authorId: targetId, cursor: nextCursor });
      setPosts((items) => [...new Map([...items, ...result.items].map((item) => [item.id, item])).values()]);
      postLimitRef.current += result.items.length;
      setNextCursor(result.nextCursor); setHasMore(result.hasMore);
    } catch (e) { setError(messageFrom(e)); }
    finally { setBusy(false); }
  };

  if (loading) return <LoadingSpinner label={t("กำลังโหลดโปรไฟล์...", "Loading profile...")}/>;
  if (!profile) return <EmptyState icon="user" title={t("ไม่พบโปรไฟล์", "Profile not found")} description={t("ผู้ใช้นี้อาจไม่มีอยู่ในระบบ", "This user may not exist.")}/>;
  const person = toAppUser(profile);

  return <div className="profile-page profile-redesign">
    {error && <div className="alert error">{error}</div>}
    <section className="profile-hero card">
      <div className={`profile-cover cover-${profile.cover_theme || "mint"}`}><span>QM</span><i/><i/></div>
      <div className="profile-panel">
        <div className="profile-topline">
          <div className="profile-avatar-wrap"><Avatar user={person} size="xl"/>{isMe && <><button disabled={busy} onClick={() => inputRef.current?.click()} aria-label={t("เปลี่ยนรูปโปรไฟล์", "Change profile picture")}><Icon name="camera" size={17}/></button><input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={changeAvatar}/></>}</div>
          <div className="profile-actions">{isMe ? <button className="secondary-button" onClick={() => setEditing(true)}><Icon name="edit" size={17}/>{t("แก้ไขโปรไฟล์", "Edit profile")}</button> : relationship && <button disabled={busy || relationship.status === "friend"} onClick={updateFriendship} className={`friend-button profile-friend-button status-${relationship.status}`}>{relationship.status === "add" && <Icon name="plus" size={16}/>} {relationship.status === "friend" && <Icon name="check" size={16}/>} {busy ? t("กำลังบันทึก...", "Saving...") : friendLabels[relationship.status]}</button>}</div>
        </div>
        <div className="profile-identity"><div><h1>{person.name}</h1><span>@{person.username}</span></div><span className="profile-member-label">{t("สมาชิก QuoteMate", "QuoteMate member")}</span></div>
        <p className="profile-bio">{person.bio || t("ยังไม่ได้เพิ่มคำแนะนำตัว", "No bio yet")}</p>
        <div className="profile-metrics"><div><strong>{postCount}</strong><span>{t("โพสต์", "Posts")}</span></div><div><strong>{friendCount}</strong><span>{t("เพื่อน", "Friends")}</span></div></div>
      </div>
    </section>
    <div className="profile-content-heading"><div><h2>{t("โพสต์", "Posts")}</h2><span>{postCount} {t("รายการ", "items")}</span></div><Icon name="edit" size={18}/></div>
    {posts.length ? posts.map((post) => <PostCard key={post.id} post={post} onDeleted={(id) => { setPosts((items) => items.filter((item) => item.id !== id)); setPostCount((count) => Math.max(0, count - 1)); }}/>) : <EmptyState icon="edit" title={t("ยังไม่มีโพสต์", "No posts yet")} description={t("โพสต์ที่แบ่งปันจะแสดงอยู่ในส่วนนี้", "Shared posts will appear here.")}/>} 
    {hasMore && <button className="load-more" onClick={loadMore} disabled={busy}>{busy ? t("กำลังโหลด...", "Loading...") : t("ดูโพสต์เพิ่มเติม", "View more posts")}</button>}
    {editing && <div className="modal-backdrop" onMouseDown={() => !busy && setEditing(false)}><div ref={editDialogRef} className="modal card" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" tabIndex="-1" onMouseDown={(event) => event.stopPropagation()}><header><div><h2 id="edit-profile-title">{t("แก้ไขโปรไฟล์", "Edit profile")}</h2><p>{t("ปรับข้อมูลและพื้นหลังโปรไฟล์", "Update your information and profile background.")}</p></div><button className="icon-button" disabled={busy} onClick={() => setEditing(false)} aria-label={t("ปิด", "Close")}><Icon name="x"/></button></header><label>{t("ชื่อที่แสดง", "Display name")}<input maxLength="60" value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })}/></label><label>Bio<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows="3" maxLength="160"/></label><div className="cover-picker"><strong>{t("พื้นหลังโปรไฟล์", "Profile background")}</strong><div>{coverThemes.map((item) => <button type="button" key={item.id} className={form.cover_theme === item.id ? "active" : ""} onClick={() => setForm({ ...form, cover_theme: item.id })}><i style={{ background: item.color }}/><span>{item.label}</span></button>)}</div></div><div className="modal-actions"><button className="secondary-button" disabled={busy} onClick={() => setEditing(false)}>{t("ยกเลิก", "Cancel")}</button><button className="primary-button" onClick={save} disabled={busy || !form.display_name.trim()}>{busy ? t("กำลังบันทึก...", "Saving...") : t("บันทึกการเปลี่ยนแปลง", "Save changes")}</button></div></div></div>}
  </div>;
}
