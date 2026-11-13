import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

afterEach(cleanup);

function LanguageProbe() {
  const { language, setLanguage, t } = useTheme();
  return <><p>{t("ตั้งค่า", "Settings")}</p><button onClick={() => setLanguage(language === "th" ? "en" : "th")}>switch</button></>;
}

describe("ThemeProvider language", () => {
  beforeEach(() => localStorage.clear());

  it("updates translated UI and persists the selected language", () => {
    render(<ThemeProvider><LanguageProbe/></ThemeProvider>);
    expect(screen.getByText("ตั้งค่า")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "switch" }));

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(localStorage.getItem("language")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});

function ModeProbe() {
  const { mode, setMode } = useTheme();
  return <button onClick={() => setMode("dark")}>{mode}</button>;
}

it("persists dark mode independently of the accent theme", () => {
  localStorage.clear();
  localStorage.setItem("themeId", "pink");
  render(<ThemeProvider><ModeProbe/></ThemeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "system" }));
  expect(document.documentElement.dataset.mode).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("pink");
  expect(localStorage.getItem("colorMode")).toBe("dark");
});

function ChromeProbe() {
  const { setMode, setTheme } = useTheme();
  return <><button onClick={() => setMode("light")}>light</button><button onClick={() => setMode("dark")}>dark</button><button onClick={() => setTheme("pink")}>pink</button></>;
}

it("syncs browser chrome with theme tokens and dark mode", () => {
  localStorage.clear();
  localStorage.setItem("colorMode", "light");
  const style = document.createElement("style");
  style.textContent = ':root{--accent-faint:#f2faf7;--bg:#f7faf8}:root[data-theme="pink"]{--accent-faint:#fdf5f8}:root[data-mode="dark"]{--bg:#101419}';
  document.head.appendChild(style);
  render(<ThemeProvider><ChromeProbe/></ThemeProvider>);
  const meta = (name) => document.querySelector(`meta[name="${name}"]`).content;
  expect(meta("theme-color")).toBe("#f2faf7");
  fireEvent.click(screen.getByRole("button", { name: "pink" }));
  expect(meta("theme-color")).toBe("#fdf5f8");
  fireEvent.click(screen.getByRole("button", { name: "dark" }));
  expect(meta("theme-color")).toBe("#101419");
  expect(meta("apple-mobile-web-app-status-bar-style")).toBe("black");
  fireEvent.click(screen.getByRole("button", { name: "light" }));
  expect(meta("theme-color")).toBe("#fdf5f8");
  expect(meta("color-scheme")).toBe("light");
  style.remove();
});
