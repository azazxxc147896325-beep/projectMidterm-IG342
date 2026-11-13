import { deleteField, doc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { isUserOnline, PRESENCE_HEARTBEAT, PRESENCE_TTL, sessionTime } from "../utils/presenceStatus";

const watchers = new Map();

export function subscribePresence(uid, callback) {
  if (!uid) return () => {};
  let entry = watchers.get(uid);
  if (!entry) {
    entry = { online: false, sessions: {}, callbacks: new Set(), timer: null };
    watchers.set(uid, entry);
    const refresh = () => {
      window.clearTimeout(entry.timer);
      const online = isUserOnline(entry.sessions);
      if (entry.online !== online) {
        entry.online = online;
        entry.callbacks.forEach((notify) => notify());
      }
      const expiry = Math.max(0, ...Object.values(entry.sessions).map(sessionTime)) + PRESENCE_TTL;
      if (online) entry.timer = window.setTimeout(refresh, Math.max(1, expiry - Date.now()));
    };
    entry.unsubscribe = onSnapshot(doc(db, "profiles", uid), (snapshot) => {
      entry.sessions = snapshot.data()?.presence_sessions || {};
      refresh();
    }, () => {
      entry.sessions = {};
      refresh();
    });
  }
  entry.callbacks.add(callback);
  return () => {
    entry.callbacks.delete(callback);
    if (!entry.callbacks.size) {
      entry.unsubscribe();
      window.clearTimeout(entry.timer);
      watchers.delete(uid);
    }
  };
}

export const getPresence = (uid) => watchers.get(uid)?.online || false;

export function startPresence(uid) {
  const ref = doc(db, "profiles", uid);
  const sessionId = crypto.randomUUID();
  const field = `presence_sessions.${sessionId}`;
  let stopped = false;
  let queue = Promise.resolve();
  const write = (active) => {
    queue = queue.catch(() => {}).then(() => updateDoc(ref, {
      [field]: active ? serverTimestamp() : deleteField(),
    })).catch(() => {});
    return queue;
  };
  const update = () => {
    if (!stopped) void write(document.visibilityState === "visible" && navigator.onLine);
  };
  // Remove abandoned sessions without changing another open tab's heartbeat.
  void runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (stopped) return;
    const stale = Object.entries(snapshot.data()?.presence_sessions || {})
      .filter(([, timestamp]) => Date.now() - sessionTime(timestamp) >= PRESENCE_TTL);
    if (stale.length) transaction.update(ref, Object.fromEntries(stale.map(([id]) => [`presence_sessions.${id}`, deleteField()])));
  }).catch(() => {});
  update();
  const timer = window.setInterval(update, PRESENCE_HEARTBEAT);
  const hide = () => { void write(false); };
  document.addEventListener("visibilitychange", update);
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  window.addEventListener("pagehide", hide);
  window.addEventListener("pageshow", update);
  return () => {
    stopped = true;
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", update);
    window.removeEventListener("online", update);
    window.removeEventListener("offline", update);
    window.removeEventListener("pagehide", hide);
    window.removeEventListener("pageshow", update);
    return write(false);
  };
}
