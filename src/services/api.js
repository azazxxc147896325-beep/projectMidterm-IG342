import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const PAGE_SIZE = 8;
const now = () => new Date().toISOString();
const recordFrom = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
const friendshipId = (userId, friendId) => `${userId}_${friendId}`;
const likeId = (postId, userId) => `${postId}_${userId}`;

async function getProfileMap(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const snapshots = await Promise.all(uniqueIds.map((id) => getDoc(doc(db, "profiles", id))));
  return new Map(snapshots.filter((item) => item.exists()).map((item) => [item.id, recordFrom(item)]));
}

async function hydratePosts(items, userId) {
  const profiles = await getProfileMap(items.map((item) => item.author_id));
  const liked = await Promise.all(items.map((item) => getDoc(doc(db, "likes", likeId(item.id, userId)))));
  return items.map((item, index) => ({
    ...item,
    author: profiles.get(item.author_id) || null,
    likes: Number(item.like_count || 0),
    comments: Number(item.comment_count || 0),
    liked: liked[index].exists(),
  }));
}

async function hydrateComments(items) {
  const profiles = await getProfileMap(items.map((item) => item.author_id));
  return items.map((item) => ({ ...item, author: profiles.get(item.author_id) || null }));
}

export async function getProfile(userId) {
  const snapshot = await getDoc(doc(db, "profiles", userId));
  if (!snapshot.exists()) throw new Error("ไม่พบโปรไฟล์");
  return recordFrom(snapshot);
}

export async function getPosts({ userId, cursor = null, authorId, friendsOnly = false, limit = PAGE_SIZE }) {
  const constraints = [];
  if (authorId) constraints.push(where("author_id", "==", authorId));
  if (friendsOnly) {
    const links = await getDocs(query(collection(db, "friendships"), where("user_id", "==", userId)));
    const ids = links.docs.map((item) => item.data().friend_id).slice(0, 30);
    if (!ids.length) return { items: [], hasMore: false, nextCursor: null };
    constraints.push(where("author_id", "in", ids));
  }
  constraints.push(orderBy("created_at", "desc"), orderBy(documentId(), "desc"));
  if (cursor) constraints.push(startAfter(cursor.created_at, cursor.id));
  constraints.push(limitQuery(limit + 1));
  const snapshot = await getDocs(query(collection(db, "posts"), ...constraints));
  const hasMore = snapshot.docs.length > limit;
  const rawItems = snapshot.docs.slice(0, limit).map(recordFrom);
  const items = await hydratePosts(rawItems, userId);
  const last = rawItems.at(-1);
  return { items, hasMore, nextCursor: hasMore && last ? { created_at: last.created_at, id: last.id } : null };
}

export async function getPostCount(authorId) {
  const result = await getCountFromServer(query(collection(db, "posts"), where("author_id", "==", authorId)));
  return result.data().count;
}

export async function getPost(postId, userId) {
  const snapshot = await getDoc(doc(db, "posts", postId));
  if (!snapshot.exists()) throw new Error("ไม่พบโพสต์");
  return (await hydratePosts([recordFrom(snapshot)], userId))[0];
}

export async function createPost(authorId, content, style) {
  const created_at = now();
  const reference = await addDoc(collection(db, "posts"), {
    author_id: authorId,
    content,
    ...style,
    like_count: 0,
    comment_count: 0,
    created_at,
    updated_at: created_at,
  });
  return getPost(reference.id, authorId);
}

export async function updatePost(postId, content, style) {
  const values = { content, ...style, updated_at: now() };
  await updateDoc(doc(db, "posts", postId), values);
  return { id: postId, ...values };
}

async function deleteReferences(references) {
  for (let index = 0; index < references.length; index += 400) {
    const batch = writeBatch(db);
    references.slice(index, index + 400).forEach((reference) => batch.delete(reference));
    await batch.commit();
  }
}

export async function deletePost(postId) {
  const [comments, likes, notifications] = await Promise.all([
    getDocs(query(collection(db, "comments"), where("post_id", "==", postId))),
    getDocs(query(collection(db, "likes"), where("post_id", "==", postId))),
    getDocs(query(collection(db, "notifications"), where("post_id", "==", postId))),
  ]);
  await deleteReferences([...comments.docs, ...likes.docs, ...notifications.docs].map((item) => item.ref));
  await deleteDoc(doc(db, "posts", postId));
}

export async function toggleLike(postId, userId, liked) {
  const postRef = doc(db, "posts", postId);
  const likeRef = doc(db, "likes", likeId(postId, userId));
  const notificationRef = doc(db, "notifications", `like_${postId}_${userId}`);
  await runTransaction(db, async (transaction) => {
    const post = await transaction.get(postRef);
    if (!post.exists()) throw new Error("ไม่พบโพสต์");
    const ownerId = post.data().author_id;
    if (liked) {
      transaction.delete(likeRef);
      transaction.update(postRef, { like_count: Math.max(0, Number(post.data().like_count || 0) - 1) });
      if (ownerId !== userId) transaction.delete(notificationRef);
    } else {
      transaction.set(likeRef, { post_id: postId, user_id: userId, created_at: now() });
      transaction.update(postRef, { like_count: Number(post.data().like_count || 0) + 1 });
      if (ownerId !== userId) transaction.set(notificationRef, { recipient_id: ownerId, actor_id: userId, type: "like", post_id: postId, is_read: false, created_at: now() });
    }
  });
}

async function commentQuery(postId, count, descending = false) {
  const snapshot = await getDocs(query(
    collection(db, "comments"),
    where("post_id", "==", postId),
    orderBy("created_at", descending ? "desc" : "asc"),
    limitQuery(count),
  ));
  return hydrateComments(snapshot.docs.map(recordFrom));
}

export const getComments = (postId) => commentQuery(postId, 200, false);

export async function getCommentsPage(postId, page = 0, pageSize = 5) {
  const all = await commentQuery(postId, (page + 1) * pageSize + 1, true);
  const start = page * pageSize;
  return { items: all.slice(start, start + pageSize), hasMore: all.length > start + pageSize };
}

export async function getCommentsWindow(postId, limit = 5) {
  const items = await commentQuery(postId, limit + 1, true);
  return { items: items.slice(0, limit), hasMore: items.length > limit };
}

export async function addComment(postId, authorId, content) {
  const commentRef = doc(collection(db, "comments"));
  const postRef = doc(db, "posts", postId);
  const created_at = now();
  await runTransaction(db, async (transaction) => {
    const post = await transaction.get(postRef);
    if (!post.exists()) throw new Error("ไม่พบโพสต์");
    const values = { post_id: postId, author_id: authorId, content, created_at, updated_at: created_at };
    transaction.set(commentRef, values);
    transaction.update(postRef, { comment_count: Number(post.data().comment_count || 0) + 1 });
    if (post.data().author_id !== authorId) {
      transaction.set(doc(db, "notifications", `comment_${commentRef.id}`), {
        recipient_id: post.data().author_id,
        actor_id: authorId,
        type: "comment",
        post_id: postId,
        comment_id: commentRef.id,
        is_read: false,
        created_at,
      });
    }
  });
  const author = await getProfile(authorId);
  return { id: commentRef.id, post_id: postId, author_id: authorId, content, created_at, updated_at: created_at, author };
}

export async function deleteComment(commentId) {
  const commentRef = doc(db, "comments", commentId);
  await runTransaction(db, async (transaction) => {
    const comment = await transaction.get(commentRef);
    if (!comment.exists()) return;
    const postRef = doc(db, "posts", comment.data().post_id);
    const post = await transaction.get(postRef);
    transaction.delete(commentRef);
    if (post.exists() && post.data().author_id !== comment.data().author_id) transaction.delete(doc(db, "notifications", `comment_${commentId}`));
    if (post.exists()) transaction.update(postRef, { comment_count: Math.max(0, Number(post.data().comment_count || 0) - 1) });
  });
}

async function relationshipData(userId) {
  const [requests, friends] = await Promise.all([
    getDocs(query(collection(db, "friend_requests"), where("participants", "array-contains", userId), where("status", "==", "pending"))),
    getDocs(query(collection(db, "friendships"), where("user_id", "==", userId))),
  ]);
  return { requests: requests.docs.map(recordFrom), friendIds: new Set(friends.docs.map((item) => item.data().friend_id)) };
}

export async function findPeople(userId, search = "") {
  const [profilesSnapshot, relations] = await Promise.all([
    getDocs(query(collection(db, "profiles"), orderBy("username"), limitQuery(100))),
    relationshipData(userId),
  ]);
  const term = search.trim().toLowerCase();
  return profilesSnapshot.docs.map(recordFrom).filter((person) => person.id !== userId && (!term || person.username.toLowerCase().includes(term) || person.display_name.toLowerCase().includes(term))).map((person) => {
    const pending = relations.requests.find((item) => item.participants.includes(person.id));
    let status = "add";
    if (relations.friendIds.has(person.id)) status = "friend";
    else if (pending?.receiver_id === userId) status = "accept";
    else if (pending) status = "requested";
    return { ...person, status, requestId: pending?.id };
  });
}

export async function friendAction(userId, person) {
  if (person.status === "add") {
    const requestRef = doc(collection(db, "friend_requests"));
    const batch = writeBatch(db);
    batch.set(requestRef, { sender_id: userId, receiver_id: person.id, participants: [userId, person.id], status: "pending", created_at: now(), updated_at: now() });
    batch.set(doc(db, "notifications", `friend_request_${requestRef.id}`), { recipient_id: person.id, actor_id: userId, type: "friend_request", friend_request_id: requestRef.id, is_read: false, created_at: now() });
    await batch.commit();
    return { data: requestRef.id, error: null };
  }
  if (person.status === "requested") {
    const batch = writeBatch(db);
    batch.update(doc(db, "friend_requests", person.requestId), { status: "cancelled", updated_at: now() });
    batch.delete(doc(db, "notifications", `friend_request_${person.requestId}`));
    await batch.commit();
    return { data: null, error: null };
  }
  if (person.status === "accept") {
    const requestRef = doc(db, "friend_requests", person.requestId);
    await runTransaction(db, async (transaction) => {
      const request = await transaction.get(requestRef);
      if (!request.exists() || request.data().receiver_id !== userId || request.data().status !== "pending") throw new Error("ไม่สามารถตอบรับคำขอนี้ได้");
      const senderId = request.data().sender_id;
      transaction.update(requestRef, { status: "accepted", updated_at: now() });
      transaction.set(doc(db, "friendships", friendshipId(userId, senderId)), { user_id: userId, friend_id: senderId, request_id: person.requestId, created_at: now() });
      transaction.set(doc(db, "friendships", friendshipId(senderId, userId)), { user_id: senderId, friend_id: userId, request_id: person.requestId, created_at: now() });
      transaction.delete(doc(db, "notifications", `friend_request_${person.requestId}`));
      transaction.set(doc(db, "notifications", `friend_accepted_${person.requestId}`), { recipient_id: senderId, actor_id: userId, type: "friend_accepted", friend_request_id: person.requestId, is_read: false, created_at: now() });
    });
  }
  return { data: null, error: null };
}

export async function getFriendStatus(userId, personId) {
  if ((await getDoc(doc(db, "friendships", friendshipId(userId, personId)))).exists()) return { status: "friend" };
  const requests = await getDocs(query(collection(db, "friend_requests"), where("participants", "array-contains", userId), where("status", "==", "pending")));
  const request = requests.docs.map(recordFrom).find((item) => item.participants.includes(personId));
  if (request?.receiver_id === userId) return { status: "accept", requestId: request.id };
  if (request) return { status: "requested", requestId: request.id };
  return { status: "add" };
}

export async function getFriendCount(userId) {
  const result = await getCountFromServer(query(collection(db, "friendships"), where("user_id", "==", userId)));
  return result.data().count;
}

export async function getNotifications(userId) {
  const snapshot = await getDocs(query(collection(db, "notifications"), where("recipient_id", "==", userId), orderBy("created_at", "desc"), limitQuery(50)));
  const items = snapshot.docs.map(recordFrom);
  const profiles = await getProfileMap(items.map((item) => item.actor_id));
  return items.map((item) => ({ ...item, actor: profiles.get(item.actor_id) || null }));
}

export async function getUnreadNotificationCount(userId) {
  const result = await getCountFromServer(query(collection(db, "notifications"), where("recipient_id", "==", userId), where("is_read", "==", false)));
  return result.data().count;
}

export async function markNotifications(userId, ids) {
  const source = ids?.length
    ? await Promise.all(ids.map((id) => getDoc(doc(db, "notifications", id))))
    : (await getDocs(query(collection(db, "notifications"), where("recipient_id", "==", userId), where("is_read", "==", false)))).docs;
  const batch = writeBatch(db);
  source.filter((item) => item.exists() && item.data().recipient_id === userId).forEach((item) => batch.update(item.ref, { is_read: true }));
  await batch.commit();
}

export async function updateProfile(userId, values) {
  const updated = { ...values, updated_at: now() };
  await updateDoc(doc(db, "profiles", userId), updated);
  return { ...(await getProfile(userId)), ...updated };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("ไม่สามารถอ่านไฟล์รูปภาพได้")); };
    image.src = objectUrl;
  });
}

function canvasToDataUrl(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (!blob) { reject(new Error("ไม่สามารถย่อรูปภาพได้")); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปภาพได้"));
    reader.readAsDataURL(blob);
  }, "image/webp", quality));
}

export async function uploadAvatar(_userId, file) {
  const image = await loadImage(file);
  const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvasToDataUrl(canvas, 0.82);
}

function filterConstraint(filter) {
  const match = filter?.match(/^([^=]+)=eq\.(.+)$/);
  return match ? where(match[1], "==", match[2]) : null;
}

export function subscribeToCollection(name, callback, filter) {
  const constraint = filterConstraint(filter);
  const source = constraint ? query(collection(db, name), constraint) : collection(db, name);
  return onSnapshot(source, callback, () => {});
}
