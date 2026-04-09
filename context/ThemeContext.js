import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "default", setTheme: () => {} });

export const THEMES = [
  { id: "default",  name: "Dark Purple",   preview: ["#0a0a0f", "#6c63ff", "#f0f0f8"] },
  { id: "midnight", name: "Midnight Blue", preview: ["#070d1a", "#3b82f6", "#e8f0fe"] },
  { id: "forest",   name: "Forest Green",  preview: ["#060f0a", "#22c55e", "#e8f5ec"] },
  { id: "sunset",   name: "Sunset",        preview: ["#0f080a", "#f97316", "#fdf0e8"] },
  { id: "rose",     name: "Rose",          preview: ["#0f080d", "#ec4899", "#fde8f5"] },
  { id: "slate",    name: "Slate",         preview: ["#0a0c10", "#94a3b8", "#e2e8f0"] },
  { id: "ocean",    name: "Ocean",         preview: ["#040e14", "#06b6d4", "#e0f7fc"] },
  { id: "gold",     name: "Gold",          preview: ["#0f0c04", "#f59e0b", "#fdf6e0"] },
  { id: "light",    name: "Light",         preview: ["#f8f9fc", "#6c63ff", "#1a1a2e"] },
  { id: "soft",     name: "Soft Dark",     preview: ["#16161e", "#a78bfa", "#f0eeff"] },
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("default");

  useEffect(() => {
    const saved = localStorage.getItem("ep_theme") || "default";
    setThemeState(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const setTheme = (id) => {
    setThemeState(id);
    localStorage.setItem("ep_theme", id);
    document.documentElement.setAttribute("data-theme", id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
