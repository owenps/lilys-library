import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ThemeName } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeClasses: Record<ThemeName, string> = {
  "flat-white": "",
  "espresso": "espresso",
  "cappuccino": "cappuccino",
  "spicy-chai": "spicy-chai",
  "matcha": "matcha",
  "london-fog": "london-fog",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("lilys-library-theme") as ThemeName;
    return saved || "flat-white";
  });

  // Sync theme from user metadata on login
  useEffect(() => {
    if (user?.user_metadata?.theme) {
      const userTheme = user.user_metadata.theme as ThemeName;
      setThemeState(userTheme);
      localStorage.setItem("lilys-library-theme", userTheme);
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    Object.values(themeClasses).forEach((cls) => {
      if (cls) root.classList.remove(cls);
    });

    // Add new theme class
    const themeClass = themeClasses[theme];
    if (themeClass) {
      root.classList.add(themeClass);
    }

    localStorage.setItem("lilys-library-theme", theme);
  }, [theme]);

  const setTheme = async (newTheme: ThemeName) => {
    setThemeState(newTheme);

    // Save to user metadata if logged in
    if (user) {
      await supabase.auth.updateUser({
        data: { theme: newTheme },
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
