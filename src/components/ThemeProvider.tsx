"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const ThemeContext = createContext<{
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}>({
  mode: "system",
  setMode: () => {}
});

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", useDark);
  document.documentElement.dataset.themeMode = mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem("clear-card-theme") as ThemeMode | null;
    const initial = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setModeState(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(mode);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode: (nextMode: ThemeMode) => {
        window.localStorage.setItem("clear-card-theme", nextMode);
        setModeState(nextMode);
        applyTheme(nextMode);
      }
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
