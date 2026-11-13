export const PRESENCE_TTL = 90_000;
export const PRESENCE_HEARTBEAT = 30_000;

export function sessionTime(value) {
  return typeof value?.toMillis === "function" ? value.toMillis() : Number(value) || 0;
}

export function isUserOnline(sessions, now = Date.now()) {
  return Object.values(sessions || {}).some((value) => {
    const elapsed = now - sessionTime(value);
    return elapsed >= -PRESENCE_TTL && elapsed < PRESENCE_TTL;
  });
}
