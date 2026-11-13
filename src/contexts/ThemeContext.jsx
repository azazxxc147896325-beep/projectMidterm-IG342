/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export const themes = [
  { id: "mint", label: "Pastel Mint", color: "#78c6af" }, { id: "blue", label: "Pastel Blue", color: "#86aeda" },
  { id: "purple", label: "Pastel Purple", color: "#ae93d7" }, { id: "pink", label: "Pastel Pink", color: "#df95ad" },
  { id: "peach", label: "Pastel Peach", color: "#e7a185" }, { id: "yellow", label: "Pastel Yellow", color: "#d7ba65" },
];
export const fonts = ["Noto Sans Thai", "Prompt", "Kanit", "Sarabun"];
export const languages = [
  { id: "th", label: "ไทย" },
  { id: "en", label: "English" },
];
const languageIds = new Set(languages.map((item) => item.id));

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("themeId") || "mint");
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("colorMode");
    return ["light", "dark", "system"].includes(saved) ? saved : "system";
  });
  useLayoutEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      const root = document.documentElement;
      const resolvedMode = mode === "system" ? (media?.matches ? "dark" : "light") : mode;
      root.dataset.theme = theme;
      root.dataset.mode = resolvedMode;
      const tokens = getComputedStyle(root);
      const color = tokens.getPropertyValue(resolvedMode === "dark" ? "--bg" : "--accent-faint").trim()
        || (resolvedMode === "dark" ? "#101419" : "#f7faf8");
      const setMeta = (name, content) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = name;
          document.head.appendChild(meta);
        }
        meta.content = content;
      };
      setMeta("theme-color", color);
      setMeta("color-scheme", resolvedMode);
      setMeta("apple-mobile-web-app-status-bar-style", resolvedMode === "dark" ? "black" : "default");
      localStorage.setItem("themeId", theme);
      localStorage.setItem("colorMode", mode);
    };
    apply();
    media?.addEventListener("change", apply);
    return () => media?.removeEventListener("change", apply);
  }, [mode, theme]);
  const [font, setFont] = useState(() => localStorage.getItem("fontId") || "Noto Sans Thai");
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    return languageIds.has(saved) ? saved : "th";
  });
  useEffect(() => { document.documentElement.style.setProperty("--app-font", `'${font}', sans-serif`); localStorage.setItem("fontId", font); }, [font]);
  useEffect(() => { document.documentElement.lang = language; localStorage.setItem("language", language); }, [language]);
  useEffect(() => {
    const syncPreferences = (event) => {
      if (event.key === "themeId" && event.newValue) setTheme(event.newValue);
      if (event.key === "colorMode" && ["light", "dark", "system"].includes(event.newValue)) setMode(event.newValue);
      if (event.key === "fontId" && event.newValue) setFont(event.newValue);
      if (event.key === "language" && event.newValue) setLanguage(event.newValue);
    };
    window.addEventListener("storage", syncPreferences);
    return () => window.removeEventListener("storage", syncPreferences);
  }, []);
  const value = useMemo(() => ({
    theme, setTheme, mode, setMode, font, setFont, language, setLanguage,
    t: (thai, english) => language === "en" ? english : thai,
  }), [theme, mode, font, language]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext) || { language: "th", t: (thai) => thai };
