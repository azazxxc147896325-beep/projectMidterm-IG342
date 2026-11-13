import { useCallback, useSyncExternalStore } from "react";
import { getPresence, subscribePresence } from "../services/presence";

export default function usePresence(uid) {
  const subscribe = useCallback((notify) => subscribePresence(uid, notify), [uid]);
  const getSnapshot = useCallback(() => getPresence(uid), [uid]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
