import { useCallback, useEffect, useRef, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import PostCard from "../components/PostCard";
import PageTitle from "../components/PageTitle";
import { useAuth } from "../contexts/AuthContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { getPosts } from "../services/api";
import { messageFrom } from "../utils/format";
import { useTheme } from "../contexts/ThemeContext";

export default function Friends() {
  const { user } = useAuth(); const [posts, setPosts] = useState([]); const [nextCursor, setNextCursor] = useState(null); const [hasMore, setHasMore] = useState(false); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const limitRef = useRef(8);
  const { t } = useTheme();
  const refresh = useCallback(() => getPosts({ userId: user.id, friendsOnly: true, limit: limitRef.current }).then((result) => { setPosts(result.items); setNextCursor(result.nextCursor); setHasMore(result.hasMore); }).catch((e) => setError(messageFrom(e))).finally(() => setLoading(false)), [user.id]);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtimeRefresh(`friends-${user.id}`, ["posts", "comments", "likes", "profiles", "friend_requests", "friendships"], refresh);
  const loadMore = async () => { if (!nextCursor || busy) return; setBusy(true); try { const result = await getPosts({ userId: user.id, friendsOnly: true, cursor: nextCursor }); setPosts((items) => [...new Map([...items, ...result.items].map((item) => [item.id, item])).values()]); limitRef.current += result.items.length; setNextCursor(result.nextCursor); setHasMore(result.hasMore); } catch (e) { setError(messageFrom(e)); } finally { setBusy(false); } };
  return <div className="page-stack"><PageTitle eyebrow="FRIENDS FEED" title={t("เรื่องราวจากเพื่อน", "Stories from friends")} description={t("ติดตามความคิดและประโยคดี ๆ จากคนที่คุณสนิท", "Follow thoughts and meaningful words from people close to you.")}/>{error && <div className="alert error">{error}</div>}{loading ? <LoadingSpinner/> : posts.length ? posts.map((post) => <PostCard post={post} key={post.id} onDeleted={(id) => setPosts((items) => items.filter((item) => item.id !== id))}/>) : <EmptyState icon="users" title={t("ยังไม่มีเรื่องราวจากเพื่อน", "No stories from friends yet")} description={t("ลองไปค้นหาและเพิ่มเพื่อน แล้วเรื่องราวของพวกเขาจะปรากฏที่นี่", "Find and add friends to see their stories here.")}/>} {hasMore && !loading && <button className="load-more" onClick={loadMore} disabled={busy}>{busy ? t("กำลังโหลด...", "Loading...") : t("ดูโพสต์เพิ่มเติม", "View more posts")}</button>}</div>;
}
