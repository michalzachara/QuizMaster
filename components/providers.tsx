"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { MotionConfig } from "motion/react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { Notifications } from "./notifications";
import { useEffect } from "react";
import { playSound, unlockSound, usePreferences } from "@/lib/preferences";

export function Providers({ children }: { children: React.ReactNode }) {
  const [prefs] = usePreferences();
  useEffect(() => {
    document.documentElement.dataset.motion = prefs.animations ? "on" : "off";
    document.documentElement.dataset.largeText = String(prefs.largeText);
    document.documentElement.dataset.compact = String(prefs.compact);
  }, [prefs.animations, prefs.largeText, prefs.compact]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      unlockSound();
      if (
        event.target instanceof Element &&
        event.target.closest("button:not(:disabled), a, input[type=radio], input[type=checkbox]")
      )
        playSound("click");
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      themes={["light", "dark", "neon"]}
      value={{ light: "light", dark: "dark", neon: "neon", violet: "light" }}
      enableSystem={false}
    >
      <MotionConfig reducedMotion={prefs.animations ? "user" : "always"}>
        <Notifications>
          <ThemeMigration />
          {children}
        </Notifications>
      </MotionConfig>
    </ThemeProvider>
  );
}

function ThemeMigration() {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    if (theme === "violet") setTheme("light");
  }, [theme, setTheme]);
  return null;
}

export function ThemeSwitch() {
  const { setTheme } = useTheme();
  return (
    <div className="theme-switch" aria-label="Motyw">
      <button
        type="button"
        title="Biały"
        aria-label="Motyw biały"
        onClick={() => setTheme("light")}
      >
        <Sun size={16} />
      </button>
      <button
        type="button"
        title="Ciemny"
        aria-label="Motyw ciemny"
        onClick={() => setTheme("dark")}
      >
        <Moon size={16} />
      </button>
      <button type="button" title="Neon" aria-label="Motyw neon" onClick={() => setTheme("neon")}>
        <Sparkles size={16} />
      </button>
    </div>
  );
}
