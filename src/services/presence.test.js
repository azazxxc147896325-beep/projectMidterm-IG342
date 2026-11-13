import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ listeners: [], update: vi.fn(), unsubscribe: vi.fn() }));
vi.mock("../lib/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_db, _collection, uid) => uid,
  deleteField: () => "deleted",
  serverTimestamp: () => "timestamp",
  updateDoc: mock.update,
  runTransaction: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn((_ref, next, error) => {
    mock.listeners.push({ next, error });
    return mock.unsubscribe;
  }),
}));
import { getPresence, startPresence, subscribePresence } from "./presence";
import { PRESENCE_TTL } from "../utils/presenceStatus";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
  mock.listeners.length = 0;
  mock.update.mockReset().mockResolvedValue(undefined);
  mock.unsubscribe.mockClear();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});
afterEach(() => vi.useRealTimers());

describe("live presence", () => {
  it("shares listeners and expires online badges without a new snapshot", () => {
    const notify = vi.fn();
    const off1 = subscribePresence("user", notify);
    const off2 = subscribePresence("user", vi.fn());
    expect(mock.listeners).toHaveLength(1);
    mock.listeners[0].next({ data: () => ({ presence_sessions: { tab: { toMillis: () => 1_000_000 } } }) });
    expect(getPresence("user")).toBe(true);
    vi.advanceTimersByTime(PRESENCE_TTL);
    expect(getPresence("user")).toBe(false);
    off1();
    expect(mock.unsubscribe).not.toHaveBeenCalled();
    off2();
    expect(mock.unsubscribe).toHaveBeenCalledOnce();
  });

  it("clears online status on a subscription failure", () => {
    const off = subscribePresence("failed", vi.fn());
    mock.listeners[0].next({ data: () => ({ presence_sessions: { tab: Date.now() } }) });
    mock.listeners[0].error(new Error("permission-denied"));
    expect(getPresence("failed")).toBe(false);
    off();
  });

  it("writes independent sessions and removes only the session that stops", async () => {
    const stop1 = startPresence("user");
    const stop2 = startPresence("user");
    await vi.advanceTimersByTimeAsync(0);
    const fields = mock.update.mock.calls.map(([, data]) => Object.keys(data)[0]);
    expect(new Set(fields).size).toBe(2);
    await stop1();
    expect(mock.update).toHaveBeenLastCalledWith("user", { [fields[0]]: "deleted" });
    await stop2();
  });

  it("removes the visible session when the app goes into the background", async () => {
    const stop = startPresence("hidden");
    await vi.advanceTimersByTimeAsync(0);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(Object.values(mock.update.mock.calls.at(-1)[1])).toEqual(["deleted"]);
    await stop();
  });
});
