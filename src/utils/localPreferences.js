const DRAFT_KEY = "draftPost";

function readDrafts() {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

export function getDraftPost(userId) {
  const drafts = readDrafts();
  const legacyDraft = localStorage.getItem(`${DRAFT_KEY}:${userId}`) || "";
  return typeof drafts[userId] === "string" ? drafts[userId] : legacyDraft;
}

export function setDraftPost(userId, content) {
  const drafts = readDrafts();
  if (content) drafts[userId] = content;
  else delete drafts[userId];

  if (Object.keys(drafts).length) localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  else localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(`${DRAFT_KEY}:${userId}`);
}

export function markOnboardingSeen() {
  localStorage.setItem("onboardingSeen", "true");
}

export function hasSeenOnboarding() {
  return localStorage.getItem("onboardingSeen") === "true";
}
