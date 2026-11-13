import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingSpinner from "../components/LoadingSpinner";
import PostCard from "../components/PostCard";
import { useAuth } from "../contexts/AuthContext";
import { addComment, deleteComment, getCommentsPage, getCommentsWindow, getPost, subscribeToCollection } from "../services/api";
import { messageFrom, timeAgo, toAppUser } from "../utils/format";
import { useTheme } from "../contexts/ThemeContext";

const COMMENTS_PER_PAGE = 5;

export default function PostDetail() {
  const { language, t } = useTheme();
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const commentsRef = useRef(null);
  const inputRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(0);
  pageRef.current = page;

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getPost(postId, user.id), getCommentsPage(postId, 0, COMMENTS_PER_PAGE)])
      .then(([postData, commentData]) => { if (active) { setPost(postData); setComments(commentData.items); setHasMore(commentData.hasMore); setPage(0); } })
      .catch((e) => active && setError(messageFrom(e)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [postId, user.id]);

  useEffect(() => {
    let active = true;
    let refreshTimer;
    const refresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(async () => {
        try {
          const limit = (pageRef.current + 1) * COMMENTS_PER_PAGE;
          const [postData, commentData] = await Promise.all([getPost(postId, user.id), getCommentsWindow(postId, limit)]);
          if (active) { setPost(postData); setComments(commentData.items); setHasMore(commentData.hasMore); }
        } catch (e) { if (active) setError(messageFrom(e)); }
      }, 120);
    };
    const unsubscribers = [
      subscribeToCollection("comments", refresh, `post_id=eq.${postId}`),
      subscribeToCollection("likes", refresh, `post_id=eq.${postId}`),
      subscribeToCollection("posts", refresh),
    ];
    return () => { active = false; window.clearTimeout(refreshTimer); unsubscribers.forEach((unsubscribe) => unsubscribe()); };
  }, [postId, user.id]);

  const loadMore = async () => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getCommentsPage(postId, nextPage, COMMENTS_PER_PAGE);
      setComments((items) => [...items, ...result.items]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (e) { setError(messageFrom(e)); }
    finally { loadingMoreRef.current = false; setLoadingMore(false); }
  };

  const handleScroll = (event) => {
    const element = event.currentTarget;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 70) loadMore();
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!comment.trim() || busy) return;
    setBusy(true);
    try {
      const item = await addComment(postId, user.id, comment.trim());
      setComments((items) => [item, ...items]);
      setPost((value) => ({ ...value, comments: value.comments + 1 }));
      setComment("");
    } catch (e) { setError(messageFrom(e)); }
    finally { setBusy(false); }
  };

  const removeComment = async (id) => {
    try {
      await deleteComment(id);
      setComments((items) => items.filter((item) => item.id !== id));
      setPost((value) => ({ ...value, comments: Math.max(0, value.comments - 1) }));
    } catch (e) { setError(messageFrom(e)); }
  };

  if (loading) return <LoadingSpinner label={t("กำลังเปิดโพสต์...", "Opening post...")}/>;
  if (!post) return <EmptyState icon="message" title={t("ไม่พบโพสต์", "Post not found")} description={t("โพสต์นี้อาจถูกลบไปแล้ว", "This post may have been deleted.")}/>;

  return <div className="post-detail-page page-stack">
    <button className="detail-back" onClick={() => navigate(-1)}><Icon name="chevron" size={17}/>{t("กลับ", "Back")}</button>
    {error && <div className="alert error" role="alert">{error}</div>}
    <PostCard post={post} onDeleted={() => navigate("/feed", { replace: true })} onCommentsClick={() => { commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); inputRef.current?.focus({ preventScroll: true }); }}/>
    <section className="post-comments-card card" ref={commentsRef}>
      <header><div><h2>{t("ความคิดเห็น", "Comments")}</h2><span>{post.comments} {t("รายการ", "items")}</span></div><small>{t(`เลื่อนลงเพื่อดูเพิ่มครั้งละ ${COMMENTS_PER_PAGE} รายการ`, `Scroll to load ${COMMENTS_PER_PAGE} more at a time`)}</small></header>
      <div className="post-detail-comments" onScroll={handleScroll}>
        {comments.map((item) => { const author = toAppUser(item.author); return <div className="detail-comment" key={item.id}><Link to={item.author_id === user.id ? "/profile" : `/profile/${item.author_id}`}><Avatar user={author} size="sm"/></Link><div><p><Link to={item.author_id === user.id ? "/profile" : `/profile/${item.author_id}`}><strong>{author.name}</strong></Link> {item.content}</p><small>{timeAgo(item.created_at, language)}</small></div>{item.author_id === user.id && <button className="icon-button" onClick={() => removeComment(item.id)} aria-label={t("ลบความคิดเห็น", "Delete comment")}><Icon name="x" size={14}/></button>}</div>; })}
        {!comments.length && <p className="no-comments">{t("ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็นได้เลย", "No comments yet. Be the first to comment.")}</p>}
        {loadingMore && <LoadingSpinner label={t("กำลังโหลดความคิดเห็น...", "Loading comments...")}/>} 
        {hasMore && !loadingMore && <button className="comments-load-more" onClick={loadMore}>{t("โหลดความคิดเห็นเพิ่ม", "Load more comments")}</button>}
        {!hasMore && comments.length > COMMENTS_PER_PAGE && <p className="comments-end">{t("แสดงครบทุกความคิดเห็นแล้ว", "All comments are shown")}</p>}
      </div>
      <form className="detail-comment-form" onSubmit={submitComment}><Avatar user={toAppUser(profile)} size="sm"/><input ref={inputRef} maxLength="300" value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t("เขียนความคิดเห็น...", "Write a comment...")} aria-label={t("เขียนความคิดเห็น", "Write a comment")}/><button disabled={busy || !comment.trim()}>{busy ? t("กำลังส่ง...", "Sending...") : t("ส่ง", "Send")}</button></form>
    </section>
  </div>;
}
