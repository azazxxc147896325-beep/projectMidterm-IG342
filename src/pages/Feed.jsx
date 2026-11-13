import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingSpinner from "../components/LoadingSpinner";
import PostCard from "../components/PostCard";
import PostStylePicker from "../components/PostStylePicker";
import PageTitle from "../components/PageTitle";
import { defaultCardStyle } from "../constants/cardStyles";
import { useAuth } from "../contexts/AuthContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { createPost, getPost, getPosts } from "../services/api";
import { messageFrom, toAppUser } from "../utils/format";
import { getDraftPost, setDraftPost } from "../utils/localPreferences";
import { useTheme } from "../contexts/ThemeContext";

export default function Feed() {
  const { user, profile } = useAuth();
  const { t } = useTheme();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState(() => getDraftPost(user.id));
  const [feedFilter, setFeedFilter] = useState(() => localStorage.getItem("feedFilter") === "friends" ? "friends" : "all");
  const [postStyle, setPostStyle] = useState(defaultCardStyle);
  const [styleOpen, setStyleOpen] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const targetPostId = searchParams.get("post");
  const refreshPosts = useCallback(async () => {
    try {
      const result = await getPosts({ userId: user.id, friendsOnly: feedFilter === "friends", limit: Math.max(posts.length, 8) });
      let data = result.items;
      if (feedFilter === "all" && targetPostId && !data.some((post) => post.id === targetPostId)) data = [await getPost(targetPostId, user.id), ...data];
      setPosts(data);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (e) { setError(messageFrom(e)); }
  }, [feedFilter, posts.length, targetPostId, user.id]);
  useRealtimeRefresh(`feed-${user.id}`, ["posts", "comments", "likes", "profiles"], refreshPosts);
  useEffect(() => { setDraftPost(user.id, draft); }, [draft, user.id]);
  useEffect(() => { localStorage.setItem("feedFilter", feedFilter); }, [feedFilter]);
  useEffect(() => {
    let active = true; setLoading(true);
    const postId = searchParams.get("post");
    getPosts({ userId: user.id, friendsOnly: feedFilter === "friends" }).then(async (data) => {
      let items = data.items;
      if (feedFilter === "all" && postId && !items.some((post) => post.id === postId)) items = [await getPost(postId, user.id), ...items];
      if (active) { setPosts(items); setHasMore(data.hasMore); setNextCursor(data.nextCursor); }
    }).catch((e) => active && setError(messageFrom(e))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [feedFilter, user.id, searchParams]);
  useEffect(() => {
    const postId = searchParams.get("post");
    if (!loading && postId) {
      const target = document.getElementById(`post-${postId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("shared-post-focus");
        const timer = window.setTimeout(() => target.classList.remove("shared-post-focus"), 2200);
        return () => window.clearTimeout(timer);
      }
    }
    return undefined;
  }, [loading, posts, searchParams]);
  const publish = async () => {
    const value = draft.trim(); if (!value || busy) return; setBusy(true); setError("");
    try { const post = await createPost(user.id, value, postStyle); if (feedFilter === "all") setPosts((items) => [post, ...items.filter((item) => item.id !== post.id)]); setDraft(""); setPostStyle(defaultCardStyle); setStyleOpen(false); setDraftPost(user.id, ""); }
    catch (e) { setError(messageFrom(e)); } finally { setBusy(false); }
  };
  const loadMore = async () => {
    if (!nextCursor || busy) return;
    setBusy(true);
    try { const data = await getPosts({ userId: user.id, friendsOnly: feedFilter === "friends", cursor: nextCursor }); setPosts((items) => [...new Map([...items, ...data.items].map((item) => [item.id, item])).values()]); setNextCursor(data.nextCursor); setHasMore(data.hasMore); }
    catch (e) { setError(messageFrom(e)); } finally { setBusy(false); }
  };
  return <div className="page-stack">
    <PageTitle eyebrow="YOUR SPACE" title={`${t("สวัสดี", "Hello")} ${profile?.display_name || profile?.username || t("เพื่อนใหม่", "new friend")}`} description={t("วันนี้มีประโยคอะไรอยากแบ่งปันไหม?", "What would you like to share today?")} />
    <section className={`composer card composer-theme-${postStyle.card_theme} composer-pattern-${postStyle.card_pattern}`}><Avatar user={toAppUser(profile)} /><div className="composer-main"><textarea className={`post-font-${postStyle.card_font}`} value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 500))} placeholder={t("เขียนประโยคหรือความรู้สึกของคุณ...", "Write a quote or share how you feel...")} rows="2"/>{styleOpen && <PostStylePicker value={postStyle} onChange={setPostStyle}/>}<div className="composer-tools"><div><button type="button" className={styleOpen ? "active" : ""} onClick={() => setStyleOpen((value) => !value)} aria-expanded={styleOpen} aria-label={t("ตกแต่งการ์ด", "Style card")}><Icon name="palette"/></button><span>{t("ตกแต่งการ์ด", "Style card")} · {draft.length}/500</span></div><button className="primary-button" onClick={publish} disabled={!draft.trim() || busy}>{busy ? t("กำลังแชร์...", "Sharing...") : t("แบ่งปัน", "Share")}</button></div></div></section>
    {error && <div className="alert error" role="alert">{error}</div>}
    <div className="feed-tabs" role="group" aria-label={t("ตัวกรองฟีด", "Feed filter")}><button className={feedFilter === "all" ? "active" : ""} onClick={() => setFeedFilter("all")}>{t("โพสต์ทั้งหมด", "All posts")}</button><button className={feedFilter === "friends" ? "active" : ""} onClick={() => setFeedFilter("friends")}>{t("เฉพาะเพื่อน", "Friends only")}</button></div>
    {loading ? <LoadingSpinner label={t("กำลังโหลดโพสต์...", "Loading posts...")}/> : posts.length ? posts.map((post) => <PostCard post={post} key={post.id} onDeleted={(id) => setPosts((items) => items.filter((item) => item.id !== id))} />) : <EmptyState icon="edit" title={t("ยังไม่มีโพสต์", "No posts yet")} description={t("เป็นคนแรกที่แบ่งปันประโยคดี ๆ กับชุมชน", "Be the first to share something meaningful with the community.")}/>} 
    {hasMore && !loading && <button className="load-more" onClick={loadMore} disabled={busy}>{busy ? t("กำลังโหลด...", "Loading...") : t("ดูโพสต์เพิ่มเติม", "View more posts")}</button>}
  </div>;
}
