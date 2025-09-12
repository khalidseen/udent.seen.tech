import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme;
<<<<<<< HEAD
      return savedTheme || "light"; // تم تغيير الافتراضي من "system" إلى "light"
    }
    return "light"; // تم تغيير الافتراضي من "system" إلى "light"
=======
      return savedTheme || "system";
    }
    return "system";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
<<<<<<< HEAD
    // تخزين الثيم في localStorage
    localStorage.setItem("theme", theme);
    
    // إضافة فئة افتراضية للوضع النهاري في حالة عدم وجود إعدادات
    if (!localStorage.getItem("theme-initialized")) {
      root.classList.add("light");
      localStorage.setItem("theme-initialized", "true");
    }
=======
    localStorage.setItem("theme", theme);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
