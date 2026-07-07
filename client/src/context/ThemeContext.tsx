import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { THEMES, FONT_PRESETS, type ThemeName, type FontName } from "./themeConfig";

interface ThemeContextValue {
  name: ThemeName;
  setName: (name: ThemeName) => void;
  font: FontName;
  setFont: (font: FontName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEYS = {
  theme: "tm_theme",
  font: "tm_font",
} as const;

function applyThemeVariables(themeName: ThemeName, fontName: FontName) {
  const theme = THEMES[themeName];
  const fonts = FONT_PRESETS[fontName];
  const root = document.documentElement;

  // Apply color variables
  root.style.setProperty("--color-paper", theme.paper);
  root.style.setProperty("--color-paperDark", theme.paperDark);
  root.style.setProperty("--color-ink", theme.ink);
  root.style.setProperty("--color-inkSoft", theme.inkSoft);
  root.style.setProperty("--color-pencil", theme.pencil);
  root.style.setProperty("--color-pencilLight", theme.pencilLight);
  root.style.setProperty("--color-coral", theme.coral);
  root.style.setProperty("--color-coralSoft", theme.coralSoft);
  root.style.setProperty("--color-teal", theme.teal);
  root.style.setProperty("--color-tealSoft", theme.tealSoft);
  root.style.setProperty("--color-yellow", theme.yellow);
  root.style.setProperty("--color-yellowSoft", theme.yellowSoft);
  root.style.setProperty("--color-lilac", theme.lilac);
  root.style.setProperty("--color-lilacSoft", theme.lilacSoft);

  // Apply font variables
  root.style.setProperty("--font-head", fonts.head);
  root.style.setProperty("--font-body", fonts.body);
  root.style.setProperty("--font-ui", fonts.ui);
  root.style.setProperty("--font-scale", String(fonts.scale));
}

function getStoredTheme(): ThemeName {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  if (stored && stored in THEMES) return stored as ThemeName;
  return "sketch";
}

function getStoredFont(): FontName {
  const stored = localStorage.getItem(STORAGE_KEYS.font);
  if (stored && stored in FONT_PRESETS) return stored as FontName;
  return "handwritten";
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [name, setNameState] = useState<ThemeName>(getStoredTheme);
  const [font, setFontState] = useState<FontName>(getStoredFont);

  const setName = (newName: ThemeName) => {
    setNameState(newName);
    localStorage.setItem(STORAGE_KEYS.theme, newName);
  };

  const setFont = (newFont: FontName) => {
    setFontState(newFont);
    localStorage.setItem(STORAGE_KEYS.font, newFont);
  };

  // Apply CSS variables on mount and when theme/font changes
  useEffect(() => {
    applyThemeVariables(name, font);
  }, [name, font]);

  return (
    <ThemeContext.Provider value={{ name, setName, font, setFont }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
