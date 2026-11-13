import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

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
