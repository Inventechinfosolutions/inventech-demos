import { createContext, useContext, useEffect, useState, type CSSProperties } from "react";
import type { Text } from "@/lib/i18n";

export type PlannerThemeId = "heritage" | "garden" | "sky" | "dusk";

type Palette = {
  page1: string;
  page2: string;
  glow: string;
  header: string;
  line: string;
  chip: string;
  chipLine: string;
  accent: string;
  ink: string;
  footer: string;
  wave: string;
  navy: string;
  brand: string;
  muted: string;
};

export const PLANNER_THEMES: { id: PlannerThemeId; label: Text; palette: Palette }[] = [
  {
    id: "heritage",
    label: { en: "Heritage Cream", kn: "ಪಾರಂಪರಿಕ ಕೆನೆ" },
    palette: {
      page1: "#fbf6ec",
      page2: "#f7f1e5",
      glow: "#fffaf0",
      header: "rgb(255 253 248 / 0.95)",
      line: "#efe6d6",
      chip: "#f3eee4",
      chipLine: "#eadfca",
      accent: "#c4935a",
      ink: "#13264f",
      footer: "#0f2147",
      wave: "#2a4a86",
      navy: "#0b2c6b",
      brand: "#1d4fc4",
      muted: "#5b6b86",
    },
  },
  {
    id: "garden",
    label: { en: "Garden Mint", kn: "ಉದ್ಯಾನ ಪುದೀನ" },
    palette: {
      page1: "#e9f5ed",
      page2: "#dfeee5",
      glow: "#f7fdf9",
      header: "rgb(248 253 250 / 0.95)",
      line: "#d7eadf",
      chip: "#e2f1e8",
      chipLine: "#cde5d6",
      accent: "#2f9a6a",
      ink: "#0f3d33",
      footer: "#0d3a30",
      wave: "#1f6b56",
      navy: "#0f3d33",
      brand: "#13845b",
      muted: "#557167",
    },
  },
  {
    id: "sky",
    label: { en: "Sky Blue", kn: "ಆಕಾಶ ನೀಲಿ" },
    palette: {
      page1: "#e9f2fd",
      page2: "#dee9f8",
      glow: "#f8fbff",
      header: "rgb(248 251 255 / 0.95)",
      line: "#d9e5f3",
      chip: "#e3edf9",
      chipLine: "#cfdcef",
      accent: "#2b7bd6",
      ink: "#0b2f63",
      footer: "#0b2a57",
      wave: "#2b5ba0",
      navy: "#0b2f63",
      brand: "#0875e8",
      muted: "#5b7196",
    },
  },
  {
    id: "dusk",
    label: { en: "Dusk Lavender", kn: "ಸಂಜೆ ಲ್ಯಾವೆಂಡರ್" },
    palette: {
      page1: "#f2ecf9",
      page2: "#e9e1f4",
      glow: "#fcfaff",
      header: "rgb(252 250 255 / 0.95)",
      line: "#e6ddf0",
      chip: "#ece5f5",
      chipLine: "#ddd2ec",
      accent: "#8a5cc4",
      ink: "#2d1f52",
      footer: "#2a1d4d",
      wave: "#5a428f",
      navy: "#2d1f52",
      brand: "#6d4bb8",
      muted: "#6c6386",
    },
  },
];

const KEY = "bda-planner-theme";

/** CSS variables for the chosen theme; the planner shell and sections read these instead of fixed colours. */
export function plannerThemeStyle(id: PlannerThemeId): CSSProperties {
  const p = PLANNER_THEMES.find((t) => t.id === id)!.palette;
  return {
    "--pl-page1": p.page1,
    "--pl-page2": p.page2,
    "--pl-glow": p.glow,
    "--pl-header": p.header,
    "--pl-line": p.line,
    "--pl-chip": p.chip,
    "--pl-chip-line": p.chipLine,
    "--pl-accent": p.accent,
    "--pl-ink": p.ink,
    "--pl-footer": p.footer,
    "--pl-wave": p.wave,
    "--color-navy": p.navy,
    "--color-brand": p.brand,
    "--color-muted": p.muted,
  } as CSSProperties;
}

export function usePlannerTheme() {
  const [theme, setTheme] = useState<PlannerThemeId>(() => {
    const saved = typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
    return PLANNER_THEMES.some((t) => t.id === saved) ? (saved as PlannerThemeId) : "heritage";
  });
  useEffect(() => {
    localStorage.setItem(KEY, theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

/** "planner" is Design 13 (illustrated); "skyline" is Design 14 (photo hero, photo tiles, light footer). */
export type PlannerVariant = "planner" | "skyline";

export const PlannerVariantContext = createContext<PlannerVariant>("planner");

export const usePlannerVariant = () => useContext(PlannerVariantContext);

export const VARIANT_PATH: Record<PlannerVariant, string> = { planner: "/design-13", skyline: "/design-14" };
