import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Text } from "@/lib/i18n";

export type DashThemeId = "blue" | "teal" | "warm" | "slate";

type Palette = { navy: string; deep: string; brand: string; bright: string; soft: string; page: string; line: string; muted: string };

export const DASH_THEMES: { id: DashThemeId; label: Text; palette: Palette }[] = [
  {
    id: "blue",
    label: { en: "BDA Blue", kn: "ಬಿಡಿಎ ನೀಲಿ" },
    palette: { navy: "#073b78", deep: "#052a57", brand: "#0875e8", bright: "#2b8af0", soft: "#dceeff", page: "#edf6ff", line: "#dce8f7", muted: "#5b7196" },
  },
  {
    id: "teal",
    label: { en: "Muted Teal", kn: "ತಿಳಿ ಹಸಿರು-ನೀಲಿ" },
    palette: { navy: "#064b47", deep: "#043532", brand: "#13845b", bright: "#1f9a6d", soft: "#d9f0e7", page: "#eff8f4", line: "#d6e9e1", muted: "#5c7b73" },
  },
  {
    id: "warm",
    label: { en: "Warm Ivory", kn: "ಬೆಚ್ಚನೆಯ ದಂತ" },
    palette: { navy: "#63451f", deep: "#4a3315", brand: "#b7832e", bright: "#c99540", soft: "#f4e7c9", page: "#fbf5e9", line: "#eee1c7", muted: "#87775c" },
  },
  {
    id: "slate",
    label: { en: "Slate Blue", kn: "ಸ್ಲೇಟ್ ನೀಲಿ" },
    palette: { navy: "#263f5e", deep: "#1a2d44", brand: "#536d8c", bright: "#6683a5", soft: "#e0e8f1", page: "#f1f5f9", line: "#dbe3ed", muted: "#64758b" },
  },
];

const KEY = "bda-dashboard-theme";

/** Overrides the site colour tokens so every utility inside the dashboard shell follows the chosen theme. */
export function themeStyle(id: DashThemeId): CSSProperties {
  const p = DASH_THEMES.find((t) => t.id === id)!.palette;
  return {
    "--color-navy": p.navy,
    "--color-navy-deep": p.deep,
    "--color-brand": p.brand,
    "--color-brand-bright": p.bright,
    "--color-brand-soft": p.soft,
    "--color-page": p.page,
    "--color-line": p.line,
    "--color-muted": p.muted,
  } as CSSProperties;
}

type Ctx = { theme: DashThemeId; setTheme: (id: DashThemeId) => void; picker: boolean; setPicker: (open: boolean) => void };

const DashThemeContext = createContext<Ctx | null>(null);

export function DashThemeProvider({ children }: { children: (theme: DashThemeId) => ReactNode }) {
  const [theme, setThemeState] = useState<DashThemeId>(() => {
    const saved = typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
    return DASH_THEMES.some((t) => t.id === saved) ? (saved as DashThemeId) : "blue";
  });
  const [picker, setPicker] = useState(false);
  useEffect(() => {
    localStorage.setItem(KEY, theme);
  }, [theme]);
  return (
    <DashThemeContext.Provider value={{ theme, setTheme: setThemeState, picker, setPicker }}>{children(theme)}</DashThemeContext.Provider>
  );
}

export function useDashTheme() {
  const ctx = useContext(DashThemeContext);
  if (!ctx) throw new Error("useDashTheme must be used inside DashThemeProvider");
  return ctx;
}
