import { describe, expect, it } from "vitest";
import { isUserOnline, PRESENCE_TTL } from "./presenceStatus";

const now = 1_000_000;
const timestamp = (time) => ({ toMillis: () => time });

describe("presence sessions", () => {
  it("expires abandoned sessions at the timeout boundary", () => {
    expect(isUserOnline({ tab: timestamp(now - PRESENCE_TTL + 1) }, now)).toBe(true);
    expect(isUserOnline({ tab: timestamp(now - PRESENCE_TTL) }, now)).toBe(false);
  });

  it("keeps a user online while another tab or device is active", () => {
    expect(isUserOnline({ closed: timestamp(now - PRESENCE_TTL), active: timestamp(now - 1000) }, now)).toBe(true);
    expect(isUserOnline({ closed: timestamp(now - PRESENCE_TTL) }, now)).toBe(false);
  });

  it("does not show missing, pending, or invalid timestamps as online", () => {
    expect(isUserOnline(undefined, now)).toBe(false);
    expect(isUserOnline({ pending: null, invalid: "invalid" }, now)).toBe(false);
    expect(isUserOnline({ future: timestamp(now + PRESENCE_TTL + 1) }, now)).toBe(false);
  });
});
