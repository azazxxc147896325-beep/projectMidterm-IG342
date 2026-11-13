import { cardFonts, cardPatterns, cardThemes } from "../constants/cardStyles";
import { useTheme } from "../contexts/ThemeContext";

export default function PostStylePicker({ value, onChange }) {
  const { t } = useTheme();
  const themeLabels = { theme: "Theme", black: "Black", plain: "White", mint: "Mint", blue: "Blue", purple: "Purple", pink: "Pink", peach: "Peach", yellow: "Yellow" };
  const patternLabels = { none: "None", dots: "Dots", grid: "Grid", waves: "Waves", sparkles: "Sparkles", petals: "Petals" };
  const update = (key, next) => onChange({ ...value, [key]: next });
  return <div className="post-style-picker">
    <section><strong>{t("สีการ์ด", "Card color")}</strong><div className="style-color-list">{cardThemes.map((item) => <button type="button" key={item.id} aria-pressed={value.card_theme === item.id} className={value.card_theme === item.id ? "active" : ""} onClick={() => update("card_theme", item.id)} aria-label={`${t("สี", "Color ")}${t(item.label, themeLabels[item.id])}`} title={t(item.label, themeLabels[item.id])}><i style={{ background: item.color }}/></button>)}</div></section>
    <section><strong>{t("ฟอนต์", "Font")}</strong><div className="style-choice-list">{cardFonts.map((item) => <button type="button" key={item.id} aria-pressed={value.card_font === item.id} className={value.card_font === item.id ? "active" : ""} onClick={() => update("card_font", item.id)} style={{ fontFamily: item.label }}>{item.label}</button>)}</div></section>
    <section><strong>{t("ลวดลาย", "Pattern")}</strong><div className="style-choice-list">{cardPatterns.map((item) => <button type="button" key={item.id} aria-pressed={value.card_pattern === item.id} className={value.card_pattern === item.id ? "active" : ""} onClick={() => update("card_pattern", item.id)}>{t(item.label, patternLabels[item.id])}</button>)}</div></section>
  </div>;
}
