"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "amoled" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read persisted theme or system preference
    const savedTheme = localStorage.getItem("rhpv-theme") as Theme | null;
    if (savedTheme && ["dark", "amoled", "light"].includes(savedTheme)) {
      setThemeState(savedTheme);
      applyThemeClass(savedTheme);
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme: Theme = systemPrefersDark ? "dark" : "light";
      setThemeState(initialTheme);
      applyThemeClass(initialTheme);
    }
    setMounted(true);
  }, []);

  const applyThemeClass = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove("dark", "amoled", "light");
    root.classList.add(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("rhpv-theme", newTheme);
    applyThemeClass(newTheme);
  };

  const toggleTheme = () => {
    const order: Theme[] = ["dark", "amoled", "light"];
    const nextIndex = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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
