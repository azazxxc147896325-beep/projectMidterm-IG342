import { afterEach, describe, expect, it, vi } from "vitest";
import { messageFrom, timeAgo, toAppUser } from "./format";

describe("format utilities", () => {
  afterEach(() => vi.useRealTimers());

  it("creates a stable app-user shape from a profile", () => {
    const result = toAppUser({ id: "user-1", username: "somchai", display_name: "สมชาย ใจดี" });
    expect(result.name).toBe("สมชาย ใจดี");
    expect(result.initials).toBe("สใ");
    expect(result.color).toMatch(/^(mint|pink|blue|peach|yellow|purple)$/);
  });

  it("formats recent timestamps in Thai", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T12:00:00Z"));
    expect(timeAgo("2026-10-07T11:55:00Z")).toBe("5 นาที");
    expect(timeAgo("2026-10-07T10:00:00Z")).toBe("2 ชม.");
  });

  it("turns unique constraint errors into a friendly message", () => {
    expect(messageFrom({ code: "23505" })).toBe("ข้อมูลนี้มีอยู่ในระบบแล้ว");
  });
});
