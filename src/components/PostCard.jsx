import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { addComment, deleteComment, deletePost, getComments, subscribeToCollection, toggleLike, updatePost } from "../services/api";
import { messageFrom, timeAgo, toAppUser } from "../utils/format";
import Avatar from "./Avatar";
import ConfirmDialog from "./ConfirmDialog";
import Icon from "./Icon";
import ShareDialog from "./ShareDialog";
import PostStylePicker from "./PostStylePicker";
import { postStyleFrom } from "../constants/cardStyles";
import { useTheme } from "../contexts/ThemeContext";

export default function PostCard({ post, onDeleted, onCommentsClick }) {
  const { user, profile } = useAuth();
  const { language, t } = useTheme();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [content, setContent] = useState(post.content);
  const [editValue, setEditValue] = useState(post.content);
  const [cardStyle, setCardStyle] = useState(() => postStyleFrom(post));
  const [editStyle, setEditStyle] = useState(() => postStyleFrom(post));
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mine = post.author_id === user.id;
  useEffect(() => { setLiked(post.liked); setLikeCount(post.likes); }, [post.liked, post.likes]);
  useEffect(() => { setContent(post.content); setEditValue(post.content); }, [post.content]);
  useEffect(() => { const next = postStyleFrom(post); setCardStyle(next); setEditStyle(next); }, [post]);
  useEffect(() => {
    if (!commentsOpen) return undefined;
    let active = true;
    let timer;
    const refreshComments = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => getComments(post.id).then((data) => active && setComments(data)).catch((e) => active && setError(messageFrom(e))), 120);
    };
    const unsubscribe = subscribeToCollection("comments", refreshComments, `post_id=eq.${post.id}`);
    return () => { active = false; window.clearTimeout(timer); unsubscribe(); };
  }, [commentsOpen, post.id]);
  const like = async () => {
    if (busy) return; const previous = liked; setLiked(!previous); setLikeCount((n) => n + (previous ? -1 : 1)); setBusy(true);
    try { await toggleLike(post.id, user.id, previous); } catch (e) { setLiked(previous); setLikeCount((n) => n + (previous ? 1 : -1)); setError(messageFrom(e)); } finally { setBusy(false); }
  };
  const openComments = async () => {
    setCommentsOpen((value) => !value);
    if (!commentsOpen && !comments.length) { try { setComments(await getComments(post.id)); } catch (e) { setError(messageFrom(e)); } }
  };
  const submitComment = async (event) => {
    event.preventDefault(); if (!comment.trim() || busy) return; setBusy(true);
    try { const item = await addComment(post.id, user.id, comment.trim()); setComments((items) => [...items, item]); setComment(""); } catch (e) { setError(messageFrom(e)); } finally { setBusy(false); }
  };
  const saveEdit = async () => {
    if (!editValue.trim() || busy) return; setBusy(true);
    try { await updatePost(post.id, editValue.trim(), editStyle); setContent(editValue.trim()); setCardStyle(editStyle); setEditing(false); } catch (e) { setError(messageFrom(e)); } finally { setBusy(false); }
  };
  const remove = async () => { setBusy(true); try { await deletePost(post.id); onDeleted?.(post.id); } catch (e) { setError(messageFrom(e)); setConfirming(false); setBusy(false); } };
  const removeComment = async (id) => { try { await deleteComment(id); setComments((items) => items.filter((item) => item.id !== id)); } catch (e) { setError(messageFrom(e)); } };
  const author = toAppUser(post.author);
  return <article className={`post-card card card-theme-${cardStyle.card_theme} card-pattern-${cardStyle.card_pattern} post-font-${cardStyle.card_font}`} id={`post-${post.id}`}>
    <header className="post-header"><Link to={mine ? "/profile" : `/profile/${post.author_id}`}><Avatar user={author}/></Link><Link className="post-author" to={mine ? "/profile" : `/profile/${post.author_id}`}><strong>{author.name}</strong><span>@{author.username} · {timeAgo(post.created_at, language)}</span></Link>{mine && <div className="post-owner-actions"><button className="icon-button" onClick={() => setEditing(!editing)} aria-label={t("แก้ไขโพสต์", "Edit post")}><Icon name="edit" size={17}/></button><button className="icon-button danger-text" onClick={() => setConfirming(true)} aria-label={t("ลบโพสต์", "Delete post")}><Icon name="x" size={17}/></button></div>}</header>
    {editing ? <div className="post-editor"><textarea maxLength="500" value={editValue} onChange={(e) => setEditValue(e.target.value)} rows="3"/><PostStylePicker value={editStyle} onChange={setEditStyle}/><div className="post-editor-actions"><button className="secondary-button" onClick={() => { setEditing(false); setEditStyle(cardStyle); }}>{t("ยกเลิก", "Cancel")}</button><button className="primary-button" onClick={saveEdit} disabled={!editValue.trim() || busy}>{t("บันทึก", "Save")}</button></div></div> : <div className="quote-body"><span className="quote-mark">“</span><p>{content}</p></div>}
    {error && <div className="inline-error">{error}</div>}
    <div className="post-stats"><span><b>{likeCount}</b> {t("คนถูกใจ", "likes")}</span><span>{commentsOpen ? comments.length : post.comments} {t("ความคิดเห็น", "comments")}</span></div>
    <div className="post-actions"><button className={liked ? "liked" : ""} onClick={like} disabled={busy}><Icon name="heart" filled={liked}/>{t("ถูกใจ", "Like")}</button><button onClick={onCommentsClick || openComments}><Icon name="message"/>{t("แสดงความคิดเห็น", "Comment")}</button><button onClick={() => setSharing(true)}><Icon name="share"/>{t("แชร์", "Share")}</button></div>
    {commentsOpen && <div className="comments-panel">{comments.map((item) => { const commentUser = toAppUser(item.author); return <div className="mini-comment" key={item.id}><Avatar user={commentUser} size="sm"/><p><strong>{commentUser.name}</strong> {item.content}</p>{item.author_id === user.id && <button className="icon-button" onClick={() => removeComment(item.id)} aria-label={t("ลบความคิดเห็น", "Delete comment")}><Icon name="x" size={14}/></button>}</div>; })}<form onSubmit={submitComment} className="comment-form"><Avatar user={toAppUser(profile)} size="sm"/><input maxLength="300" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("เขียนความคิดเห็น...", "Write a comment...")} aria-label={t("เขียนความคิดเห็น", "Write a comment")}/><button disabled={!comment.trim() || busy}>{t("ส่ง", "Send")}</button></form></div>}
    {confirming && <ConfirmDialog title={t("ลบโพสต์นี้?", "Delete this post?")} description={t("การลบโพสต์ไม่สามารถย้อนกลับได้", "This action cannot be undone.")} busy={busy} onCancel={() => setConfirming(false)} onConfirm={remove}/>} 
    {sharing && <ShareDialog post={{ ...post, content, ...cardStyle }} author={author} onClose={() => setSharing(false)}/>} 
  </article>;
}
