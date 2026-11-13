/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.mode = mode === "system" ? (media?.matches ? "dark" : "light") : mode;
      localStorage.setItem("colorMode", mode);
    };
    apply();
    media?.addEventListener("change", apply);
    return () => media?.removeEventListener("change", apply);
  }, [mode]);
  const [font, setFont] = useState(() => localStorage.getItem("fontId") || "Noto Sans Thai");
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    return languageIds.has(saved) ? saved : "th";
  });
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("themeId", theme); }, [theme]);
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
