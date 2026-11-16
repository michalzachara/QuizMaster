"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  History,
  Settings,
  LogOut,
  Zap,
  Radio,
  Plus,
} from "lucide-react";
import { useResource, type Me } from "@/lib/client";
import { ThemeSwitch } from "./providers";
import { AuthScreen } from "./auth-screen";
import { Dashboard, Join, Profile } from "./workspace-panels";
import { QuizEditor, QuizDetails } from "./quiz-editor";
import { Assignment, Attempt, LiveGame } from "./play";
import { Button } from "./ui/button";

export function Workspace() {
  const path = usePathname();
  if (path === "/login" || path === "/register")
    return <AuthScreen key={path} register={path === "/register"} />;
  return <AuthenticatedWorkspace key={path} path={path} />;
}

function AuthenticatedWorkspace({ path }: { path: string }) {
  const { data: me, error, reload } = useResource<Me>("me");
  if (error)
    return (
      <main className="gate">
        <span className="brand-icon">
          <Zap />
        </span>
        <h1>Twoja przestrzeń do nauki</h1>
        <p>{error}</p>
        <Link
          className="link-button"
          href={`/login?next=${encodeURIComponent(path + (typeof window !== "undefined" ? window.location.search : ""))}`}
        >
          Zaloguj się
        </Link>
        <Link href="/register">Nie masz konta? Zarejestruj się</Link>
      </main>
    );
  if (!me)
    return (
      <main className="gate" aria-busy="true">
        <div className="loader" />
        <p>Otwieramy Twój panel…</p>
      </main>
    );
  const segments = path.split("/").filter(Boolean);
  let content: React.ReactNode;
  if (
    segments[0] === "dashboard" ||
    (segments[0] === "quizzes" && !segments[1]) ||
    segments[0] === "history"
  )
    content = <Dashboard me={me} view={segments[0]} />;
  else if (segments[0] === "quizzes" && me.role === "TEACHER")
    content =
      segments[1] === "new" || segments[2] === "edit" ? (
        <QuizEditor id={segments[1] === "new" ? undefined : segments[1]} />
      ) : (
        <QuizDetails id={segments[1]} />
      );
  else if (segments[0] === "join") content = <Join me={me} />;
  else if (segments[0] === "settings") content = <Profile me={me} reload={reload} />;
  else if (segments[0] === "test" && segments[1]) content = <Assignment id={segments[1]} />;
  else if (segments[0] === "attempt" && segments[1]) content = <Attempt id={segments[1]} />;
  else if (segments[0] === "live" && segments[1]) content = <LiveGame id={segments[1]} />;
  else
    content = (
      <div className="empty">
        <h1>Nie znaleziono strony lub brak uprawnień.</h1>
        <Link href="/dashboard">Wróć do panelu</Link>
      </div>
    );
  const links = [
    { href: "/dashboard", label: "Mój panel", icon: LayoutDashboard },
    ...(me.role === "TEACHER"
      ? [{ href: "/quizzes", label: "Moje quizy", icon: BookOpen }]
      : [{ href: "/join", label: "Dołącz do quizu", icon: Radio }]),
    { href: "/history", label: "Historia i wyniki", icon: History },
    { href: "/settings", label: "Ustawienia", icon: Settings },
  ];
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Zap />
          </span>
          QuizMaster<span className="brand-dot">.</span>
        </Link>
        <span className="sidebar-label">TWOJA PRZESTRZEŃ</span>
        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href} className={path.startsWith(href) ? "active" : ""}>
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-tip">
          <span>✦</span>
          <strong>Mały krok. Duży postęp.</strong>
          <p>Każde pytanie to okazja, żeby odkryć coś nowego.</p>
        </div>
        <div className="sidebar-bottom">
          <ThemeSwitch />
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut size={17} /> Wyloguj
          </Button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-top">
          <span>{me.role === "TEACHER" ? "Przestrzeń nauczyciela" : "Przestrzeń ucznia"}</span>
          <div className="header-actions">
            <Link href="/settings" className="header-settings" aria-label="Ustawienia konta">
              <Settings size={21} />
            </Link>
            <div className="user-chip">
              <span className="avatar">{me.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{me.name}</strong>
                <small>{me.role === "TEACHER" ? "Nauczyciel" : "Uczeń"}</small>
              </div>
            </div>
          </div>
        </header>
        <nav className="mobile-nav">
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href} title={label} aria-label={label}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
          <ThemeSwitch />
        </nav>
        <main className="workspace-content">{content}</main>
        <footer className="workspace-footer">
          QuizMaster · Z ciekawości rodzi się wiedza.
          <Link href={me.role === "TEACHER" ? "/quizzes/new" : "/join"}>
            <Plus size={14} />
            {me.role === "TEACHER" ? "Nowy quiz" : "Dołącz do quizu"}
          </Link>
        </footer>
      </div>
    </div>
  );
}
