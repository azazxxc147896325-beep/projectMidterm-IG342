import { requireSupabase, supabase } from "../lib/supabase";

const PAGE_SIZE = 8;
const postSelect = `
  id, author_id, content, card_theme, card_font, card_pattern, created_at, updated_at,
  author:profiles!posts_author_id_fkey(id, username, display_name, bio, avatar_url),
  likes(count), comments(count), viewer_like:likes(user_id)
`;

function normalizePost(post, userId) {
  return {
    ...post,
    likes: Number(post.likes?.[0]?.count || 0),
    comments: Number(post.comments?.[0]?.count || 0),
    liked: Boolean(post.viewer_like?.some((like) => like.user_id === userId)),
    viewer_like: undefined,
  };
}

export async function getPosts({ userId, cursor = null, authorId, friendsOnly = false, limit = PAGE_SIZE }) {
  requireSupabase();
  let query = supabase.from("posts")
    .select(postSelect)
    .eq("viewer_like.user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  if (authorId) query = query.eq("author_id", authorId);
  if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  if (friendsOnly) {
    const { data: links, error: linkError } = await supabase.from("friendships").select("friend_id").eq("user_id", userId);
    if (linkError) throw linkError;
    const ids = links.map((item) => item.friend_id);
    if (!ids.length) return { items: [], hasMore: false, nextCursor: null };
    query = query.in("author_id", ids);
  }
  const { data, error } = await query;
  if (error) throw error;
  const hasMore = data.length > limit;
  const items = data.slice(0, limit).map((post) => normalizePost(post, userId));
  const last = items.at(-1);
  return { items, hasMore, nextCursor: hasMore && last ? { created_at: last.created_at, id: last.id } : null };
}

export async function getPostCount(authorId) {
  const { count, error } = await supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", authorId);
  if (error) throw error;
  return count || 0;
}

export async function getPost(postId, userId) {
  requireSupabase();
  const { data, error } = await supabase.from("posts").select(postSelect).eq("viewer_like.user_id", userId).eq("id", postId).single();
  if (error) throw error;
  return normalizePost(data, userId);
}

export async function createPost(authorId, content, style) {
  const { data, error } = await supabase.from("posts").insert({ author_id: authorId, content, ...style }).select("id").single();
  if (error) throw error;
  return getPost(data.id, authorId);
}

export async function updatePost(postId, content, style) {
  const { data, error } = await supabase.from("posts").update({ content, ...style }).eq("id", postId).select("id, content, card_theme, card_font, card_pattern, updated_at").single();
  if (error) throw error;
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function toggleLike(postId, userId, liked) {
  const query = liked
    ? supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId)
    : supabase.from("likes").insert({ post_id: postId, user_id: userId });
  const { error } = await query;
  if (error) throw error;
}

export async function getComments(postId) {
  const { data, error } = await supabase.from("comments").select("id, content, author_id, created_at, author:profiles!comments_author_id_fkey(id, username, display_name, avatar_url)").eq("post_id", postId).order("created_at");
  if (error) throw error;
  return data;
}

export async function getCommentsPage(postId, page = 0, pageSize = 5) {
  const start = page * pageSize;
  const { data, error } = await supabase.from("comments").select("id, content, author_id, created_at, author:profiles!comments_author_id_fkey(id, username, display_name, avatar_url)").eq("post_id", postId).order("created_at", { ascending: false }).range(start, start + pageSize);
  if (error) throw error;
  return { items: data.slice(0, pageSize), hasMore: data.length > pageSize };
}

export async function getCommentsWindow(postId, limit = 5) {
  const { data, error } = await supabase.from("comments").select("id, content, author_id, created_at, author:profiles!comments_author_id_fkey(id, username, display_name, avatar_url)").eq("post_id", postId).order("created_at", { ascending: false }).range(0, limit);
  if (error) throw error;
  return { items: data.slice(0, limit), hasMore: data.length > limit };
}

export async function addComment(postId, authorId, content) {
  const { data, error } = await supabase.from("comments").insert({ post_id: postId, author_id: authorId, content }).select("id, content, author_id, created_at, author:profiles!comments_author_id_fkey(id, username, display_name, avatar_url)").single();
  if (error) throw error;
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function findPeople(userId, query = "") {
  let request = supabase.from("profiles").select("id, username, display_name, bio, avatar_url").neq("id", userId).order("username").limit(30);
  const searchTerm = query.trim().replace(/[,().%_"\\]/g, " ").replace(/\s+/g, " ");
  if (searchTerm) request = request.or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
  const [{ data: people, error }, { data: requests, error: requestError }, { data: friends, error: friendError }] = await Promise.all([
    request,
    supabase.from("friend_requests").select("id, sender_id, receiver_id, status").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).eq("status", "pending"),
    supabase.from("friendships").select("friend_id").eq("user_id", userId),
  ]);
  if (error || requestError || friendError) throw error || requestError || friendError;
  const friendIds = new Set(friends.map((item) => item.friend_id));
  return people.map((person) => {
    const pending = requests.find((item) => item.sender_id === person.id || item.receiver_id === person.id);
    let status = "add";
    if (friendIds.has(person.id)) status = "friend";
    else if (pending?.receiver_id === userId) status = "accept";
    else if (pending) status = "requested";
    return { ...person, status, requestId: pending?.id };
  });
}

export async function friendAction(userId, person) {
  if (person.status === "add") return supabase.rpc("send_friend_request", { target_id: person.id });
  if (person.status === "requested") return supabase.rpc("cancel_friend_request", { request_id: person.requestId });
  if (person.status === "accept") return supabase.rpc("respond_friend_request", { request_id: person.requestId, response: "accepted" });
  return { data: null, error: null };
}

export async function getFriendStatus(userId, personId) {
  const [{ data: friendship, error: friendError }, { data: request, error: requestError }] = await Promise.all([
    supabase.from("friendships").select("id").eq("user_id", userId).eq("friend_id", personId).maybeSingle(),
    supabase.from("friend_requests").select("id, sender_id, receiver_id").or(`and(sender_id.eq.${userId},receiver_id.eq.${personId}),and(sender_id.eq.${personId},receiver_id.eq.${userId})`).eq("status", "pending").maybeSingle(),
  ]);
  if (friendError || requestError) throw friendError || requestError;
  if (friendship) return { status: "friend" };
  if (request?.receiver_id === userId) return { status: "accept", requestId: request.id };
  if (request) return { status: "requested", requestId: request.id };
  return { status: "add" };
}

export async function getFriendCount(userId) {
  const { data: count, error } = await supabase.rpc("friend_count", { target_id: userId });
  if (error) throw error;
  return Number(count || 0);
}

export async function getNotifications(userId) {
  const { data, error } = await supabase.from("notifications").select("id, type, post_id, is_read, created_at, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data;
}

export async function markNotifications(userId, ids) {
  let query = supabase.from("notifications").update({ is_read: true }).eq("recipient_id", userId);
  if (ids?.length) query = query.in("id", ids);
  const { error } = await query;
  if (error) throw error;
}

export async function updateProfile(userId, values) {
  const { data, error } = await supabase.from("profiles").update(values).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId, file) {
  const path = `${userId}/avatar-current`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const { data: files } = await supabase.storage.from("avatars").list(userId);
  const stalePaths = (files || []).filter((item) => item.name !== "avatar-current").map((item) => `${userId}/${item.name}`);
  if (stalePaths.length) await supabase.storage.from("avatars").remove(stalePaths);
  return `${data.publicUrl}?v=${Date.now()}`;
}
