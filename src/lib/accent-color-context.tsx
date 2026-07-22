"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AccentColor = "teal" | "blue" | "coral" | "pink" | "amber" | "purple";

export const ACCENT_COLOR_OPTIONS: { value: AccentColor; label: string; swatch: string }[] = [
  { value: "purple", label: "Roxo", swatch: "#7C6CF0" },
  { value: "teal", label: "Verde-azulado", swatch: "#1D9E75" },
  { value: "blue", label: "Azul", swatch: "#378ADD" },
  { value: "coral", label: "Coral", swatch: "#D85A30" },
  { value: "pink", label: "Rosa", swatch: "#D4537E" },
  { value: "amber", label: "Âmbar", swatch: "#BA7517" },
];

const ACCENT_COLOR_VALUES: Record<
  AccentColor,
  { accent: string; hover: string; fg: string }
> = {
  purple: { accent: "#5b3fa8", hover: "#452f82", fg: "#ffffff" },
  teal: { accent: "#0f6e56", hover: "#085041", fg: "#ffffff" },
  blue: { accent: "#185fa5", hover: "#0c447c", fg: "#ffffff" },
  coral: { accent: "#993c1d", hover: "#712b13", fg: "#ffffff" },
  pink: { accent: "#993556", hover: "#72243e", fg: "#ffffff" },
  amber: { accent: "#854f0b", hover: "#633806", fg: "#ffffff" },
};

interface AccentColorContextValue {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const AccentColorContext = createContext<AccentColorContextValue | null>(null);
const STORAGE_KEY = "fincontrol-accent-color";

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColor] = useState<AccentColor>("teal");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ACCENT_COLOR_OPTIONS.some((o) => o.value === stored)) {
      setAccentColor(stored as AccentColor);
    }
  }, []);

  useEffect(() => {
    const values = ACCENT_COLOR_VALUES[accentColor];
    const root = document.documentElement.style;
    root.setProperty("--accent", values.accent);
    root.setProperty("--accent-hover", values.hover);
    root.setProperty("--accent-fg", values.fg);
    localStorage.setItem(STORAGE_KEY, accentColor);
  }, [accentColor]);

  return (
    <AccentColorContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const ctx = useContext(AccentColorContext);
  if (!ctx) {
    throw new Error("useAccentColor deve ser usado dentro de AccentColorProvider");
  }
  return ctx;
}
