export const cardThemes = [
  { id: "theme", label: "ตามธีม", color: "var(--accent-soft)" },
  { id: "black", label: "ดำ", color: "#191c23" },
  { id: "plain", label: "ขาว", color: "#ffffff" },
  { id: "mint", label: "มิ้นต์", color: "#e8f7f1" },
  { id: "blue", label: "ฟ้า", color: "#eaf3ff" },
  { id: "purple", label: "ม่วง", color: "#f2ebff" },
  { id: "pink", label: "ชมพู", color: "#fff0f5" },
  { id: "peach", label: "พีช", color: "#fff0e8" },
  { id: "yellow", label: "เหลือง", color: "#fff8dc" },
];

export const cardFonts = [
  { id: "default", label: "Noto Sans Thai" },
  { id: "prompt", label: "Prompt" },
  { id: "kanit", label: "Kanit" },
  { id: "sarabun", label: "Sarabun" },
];

export const cardPatterns = [
  { id: "none", label: "ไม่มี" },
  { id: "dots", label: "จุด" },
  { id: "grid", label: "ตาราง" },
  { id: "waves", label: "คลื่น" },
  { id: "sparkles", label: "ประกาย" },
  { id: "petals", label: "กลีบดอก" },
];

export const defaultCardStyle = { card_theme: "theme", card_font: "default", card_pattern: "none" };

export const coverThemes = [
  { id: "mint", label: "Mint", color: "linear-gradient(135deg,#c9efe3,#edf9f5)" },
  { id: "sky", label: "Sky", color: "linear-gradient(135deg,#cbe4ff,#edf6ff)" },
  { id: "sunset", label: "Sunset", color: "linear-gradient(135deg,#ffd8c7,#ffeef3)" },
  { id: "lavender", label: "Lavender", color: "linear-gradient(135deg,#ddd0ff,#f4efff)" },
  { id: "night", label: "Night", color: "linear-gradient(135deg,#40506d,#7280a0)" },
  { id: "meadow", label: "Meadow", color: "linear-gradient(135deg,#b9dfad,#eef6cf)" },
];

export function postStyleFrom(post) {
  return {
    card_theme: post.card_theme || defaultCardStyle.card_theme,
    card_font: post.card_font || defaultCardStyle.card_font,
    card_pattern: post.card_pattern || defaultCardStyle.card_pattern,
  };
}
