import { useEffect, useRef } from "react";
import { subscribeToCollection } from "../services/api";

export default function useRealtimeRefresh(channelName, tables, onChange) {
  const callbackRef = useRef(onChange);
  const tablesRef = useRef(tables);
  callbackRef.current = onChange;
  tablesRef.current = tables;
  const tablesKey = tables.map((item) => typeof item === "string" ? item : `${item.table}:${item.filter || ""}`).join(",");

  useEffect(() => {
    let timer;
    let running = false;
    let queued = false;
    let disposed = false;
    const runRefresh = async () => {
      if (disposed) return;
      if (running) { queued = true; return; }
      running = true;
      try { await callbackRef.current(); }
      finally {
        running = false;
        if (queued && !disposed) { queued = false; runRefresh().catch(() => {}); }
      }
    };
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { runRefresh().catch(() => {}); }, 120);
    };
    const unsubscribers = tablesRef.current.map((item) => {
      const config = typeof item === "string" ? { table: item } : item;
      return subscribeToCollection(config.table, refresh, config.filter);
    });
    return () => { disposed = true; window.clearTimeout(timer); unsubscribers.forEach((unsubscribe) => unsubscribe()); };
  }, [channelName, tablesKey]);
}
