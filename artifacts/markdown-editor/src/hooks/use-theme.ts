import { useState, useEffect } from "react";
import type { EditorTheme } from "@/lib/types";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("marksync-dark-mode");
    if (saved !== null) return saved === "true";
    return true; // default dark
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("marksync-dark-mode", String(isDark));
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}

export function useEditorTheme() {
  const [theme, setTheme] = useState<EditorTheme>(() => {
    return (localStorage.getItem("marksync-editor-theme") as EditorTheme) || "default-dark";
  });

  const changeTheme = (t: EditorTheme) => {
    setTheme(t);
    localStorage.setItem("marksync-editor-theme", t);
  };

  return { theme, changeTheme };
}
