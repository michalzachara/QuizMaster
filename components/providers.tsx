"use client";
import { ThemeProvider, useTheme } from "next-themes";
import { MotionConfig } from "motion/react";
import { Sun, Moon, Sparkles } from "lucide-react";
export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="light" themes={["light", "dark", "neon"]} enableSystem={false}><MotionConfig reducedMotion="user">{children}</MotionConfig></ThemeProvider>;
}
export function ThemeSwitch() {
  const { setTheme } = useTheme();
  return <div className="theme-switch" aria-label="Motyw"><button type="button" title="Jasny" aria-label="Motyw jasny" onClick={() => setTheme("light")}><Sun size={16}/></button><button type="button" title="Ciemny" aria-label="Motyw ciemny" onClick={() => setTheme("dark")}><Moon size={16}/></button><button type="button" title="Neon" aria-label="Motyw neon" onClick={() => setTheme("neon")}><Sparkles size={16}/></button></div>;
}
