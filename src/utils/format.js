export function toAppUser(profile) {
  if (!profile) return { id: "", username: "unknown", name: "ผู้ใช้ QuoteMate", initials: "QM", color: "mint" };
  const name = profile.display_name || profile.username || "ผู้ใช้ QuoteMate";
  return {
    ...profile,
    name,
    initials: name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "QM",
    color: ["mint", "pink", "blue", "peach", "yellow", "purple"][Math.abs(hash(profile.id || name)) % 6],
  };
}

function hash(value) {
  return [...String(value)].reduce((sum, char) => ((sum << 5) - sum) + char.charCodeAt(0), 0);
}

export function timeAgo(value, language = "th") {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return language === "en" ? "just now" : "เมื่อสักครู่";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} ${language === "en" ? "min" : "นาที"}`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${language === "en" ? "hr" : "ชม."}`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ${language === "en" ? "days" : "วัน"}`;
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "th-TH", { dateStyle: "medium" }).format(new Date(value));
}

export function messageFrom(error) {
  const english = globalThis.localStorage?.getItem("language") === "en";
  const fallback = english ? "Something went wrong. Please try again." : "เกิดข้อผิดพลาด กรุณาลองใหม่";
  if (!error) return fallback;
  if (error.code === "23505") return english ? "This information already exists." : "ข้อมูลนี้มีอยู่ในระบบแล้ว";
  if (!english) return error.message || fallback;
  const translations = {
    "Username หรือ Password ไม่ถูกต้อง": "Incorrect username or password.",
    "ระบบฐานข้อมูลยังตั้งค่าไม่ครบ กรุณาติดตั้ง QuoteMate schema ก่อนสมัครสมาชิก": "The database setup is incomplete. Install the QuoteMate schema before creating an account.",
    "Username นี้ถูกใช้งานแล้ว": "This username is already taken.",
    "ไม่พบโปรไฟล์ของบัญชีนี้": "No profile is linked to this account.",
    "ไม่พบโปรไฟล์": "Profile not found.",
    "ไม่พบโพสต์": "Post not found.",
  };
  return translations[error.message] || error.message || fallback;
}
