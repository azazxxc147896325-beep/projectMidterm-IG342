import { beforeEach, describe, expect, it } from "vitest";
import { getDraftPost, hasSeenOnboarding, markOnboardingSeen, setDraftPost } from "./localPreferences";

describe("local preferences", () => {
  beforeEach(() => localStorage.clear());

  it("stores drafts under the shared draftPost key by user", () => {
    setDraftPost("user-1", "hello");
    setDraftPost("user-2", "world");

    expect(JSON.parse(localStorage.getItem("draftPost"))).toEqual({ "user-1": "hello", "user-2": "world" });
    expect(getDraftPost("user-1")).toBe("hello");
  });

  it("migrates and removes the previous per-user draft key", () => {
    localStorage.setItem("draftPost:user-1", "old draft");
    expect(getDraftPost("user-1")).toBe("old draft");

    setDraftPost("user-1", "old draft");
    expect(localStorage.getItem("draftPost:user-1")).toBeNull();
  });

  it("removes an empty draft and records completed onboarding", () => {
    setDraftPost("user-1", "hello");
    setDraftPost("user-1", "");
    expect(localStorage.getItem("draftPost")).toBeNull();

    expect(hasSeenOnboarding()).toBe(false);
    markOnboardingSeen();
    expect(hasSeenOnboarding()).toBe(true);
  });
});
