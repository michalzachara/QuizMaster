"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { QuizLibrary } from "./quiz-library";
import { Plus, ArrowUpRight, BookOpen, Radio, Trophy, Users, ArrowRight } from "lucide-react";
import { api, useResource, type Me } from "@/lib/client";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { parseJoinCode } from "@/lib/join-code";
import { DashboardInsights } from "./dashboard-insights";
import { PreferencesPanel } from "./preferences-panel";

type DashboardData = {
  quizzes: {
    id: string;
    title: string;
    description: string;
    published: boolean;
    _count: { questions: number };
  }[];
  attempts: {
    id: string;
    title: string;
    name: string;
    score: number | null;
    maxScore: number;
    finished: boolean;
    startedAt: string;
  }[];
  games: {
    id: string;
    title: string;
    pin: string;
    status: string;
    participants: number;
    createdAt: string;
  }[];
};

const gameLabels: Record<string, string> = {
  WAITING: "Poczekalnia",
  QUESTION: "W trakcie",
  RESULTS: "W trakcie",
  FINISHED: "Zakończona",
};

export function Dashboard({ me, view }: { me: Me; view: string }) {
  const { data, error } = useResource<DashboardData>("dashboard");
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="loading">Ładujemy Twoje wyniki…</p>;
  const finished = data.attempts.filter((a) => a.finished);
  const average = finished.length
    ? Math.round(
        finished.reduce((sum, a) => sum + ((a.score || 0) / a.maxScore) * 100, 0) / finished.length,
      )
    : null;
  const teacher = me.role === "TEACHER";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {view === "history" ? "TWOJE OSIĄGNIĘCIA" : "DOBRY MOMENT NA NAUKĘ"}
          </span>
          <h1>
            {view === "quizzes"
              ? "Moja biblioteka quizów"
              : view === "history"
                ? "Historia i wyniki"
                : `Cześć, ${me.name.split(" ")[0]}!`}
          </h1>
          <p className="muted">
            {teacher
              ? "Zainspiruj klasę. Resztą zajmiemy się razem."
              : "Kolejne odkrycie jest bliżej, niż myślisz."}
          </p>
        </div>
        <Link href={teacher ? "/quizzes/new" : "/join"} className="link-button">
          <Plus size={18} />
          {teacher ? "Utwórz quiz" : "Dołącz do quizu"}
        </Link>
      </div>
      {view === "dashboard" && (
        <>
          <div className="dashboard-banner">
            <div>
              <span className="pill">
                {teacher ? "TWOJA NASTĘPNA ŚWIETNA LEKCJA" : "GOTOWOŚĆ TO PIERWSZY KROK"}
              </span>
              <h2>{teacher ? "Daj wiedzy trochę energii." : "Masz kod? Dołącz do gry."}</h2>
              <p>
                {teacher
                  ? "Stwórz pytania, zaproś uczniów i odkrywajcie razem."
                  : "Dołącz do klasy i sprawdź, co już potrafisz."}
              </p>
              <Link href={teacher ? "/quizzes/new" : "/join"}>
                {teacher ? "Zacznij od nowego quizu" : "Wpisz kod rozgrywki"}{" "}
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="banner-symbol">{teacher ? "✦" : "?"}</div>
          </div>
          <div className="stat-grid">
            {[
              {
                label: teacher ? "Twoje quizy" : "Ukończone testy",
                value: teacher ? data.quizzes.length : finished.length,
                icon: BookOpen,
              },
              { label: "Sesje na żywo", value: data.games.length, icon: Radio },
              {
                label: "Średni wynik testów",
                value: average === null ? "—" : `${average}%`,
                icon: Trophy,
              },
              {
                label: teacher ? "Udziały w sesjach" : "Podejścia do testów",
                value: teacher
                  ? data.games.reduce((s, g) => s + g.participants, 0)
                  : data.attempts.length,
                icon: Users,
              },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="stat-card">
                <Icon size={20} />
                <strong>{value}</strong>
                <span>{label}</span>
              </Card>
            ))}
          </div>
          <small className="muted">
            Podsumowanie obejmuje do 100 ostatnich quizów, sesji i podejść.
          </small>
          <DashboardInsights attempts={data.attempts} games={data.games} />
        </>
      )}
      {teacher && view !== "history" && (
        <QuizLibrary quizzes={data.quizzes} userId={me.id} compact={view === "dashboard"} />
      )}
      {view !== "quizzes" && (
        <>
          <section className="panel-section">
            <div className="section-row">
              <h2>Testy indywidualne</h2>
              <span className="muted">{finished.length} ukończonych</span>
            </div>
            {!data.attempts.length ? (
              <Card className="empty">
                <Trophy size={30} />
                <h3>Wyniki pojawią się tutaj</h3>
                <p>
                  {teacher
                    ? "Udostępnij test z poziomu wybranego quizu."
                    : "Otwórz link do testu otrzymany od nauczyciela."}
                </p>
              </Card>
            ) : (
              <Card className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Quiz</th>
                      <th>{teacher ? "Uczeń" : "Data"}</th>
                      <th>Wynik</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.attempts.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.title}</strong>
                        </td>
                        <td>
                          {teacher ? a.name : new Date(a.startedAt).toLocaleDateString("pl-PL")}
                        </td>
                        <td>
                          {a.finished ? (
                            <div className="result-cell">
                              <span>
                                {a.score} / {a.maxScore}
                              </span>
                              <div className="mini-bar">
                                <i style={{ width: `${((a.score || 0) / a.maxScore) * 100}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="badge">W trakcie</span>
                          )}
                        </td>
                        <td>
                          <Link href={`/attempt/${a.id}`}>{a.finished ? "Wynik" : "Otwórz"} ↗</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </section>
          <section className="panel-section">
            <h2>Rozgrywki na żywo</h2>
            {!data.games.length ? (
              <Card className="empty">
                <Radio size={30} />
                <h3>Jeszcze wszystko przed Tobą</h3>
                <p>
                  {teacher
                    ? "Uruchom pierwszą rozgrywkę z biblioteki quizów."
                    : "Dołącz do quizu kodem otrzymanym od nauczyciela."}
                </p>
              </Card>
            ) : (
              <div className="session-list">
                {data.games.map((g) => (
                  <Link href={`/live/${g.id}`} key={g.id} className="session-row">
                    <span className="feature-icon violet">
                      <Radio size={20} />
                    </span>
                    <div>
                      <strong>{g.title}</strong>
                      <small>
                        {new Date(g.createdAt).toLocaleDateString("pl-PL")} · {g.participants}{" "}
                        uczestników
                      </small>
                    </div>
                    <span className="badge">{gameLabels[g.status]}</span>
                    <ArrowUpRight size={18} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

export function Join({ me }: { me: Me }) {
  const [pin, setPin] = useState(() =>
    typeof window === "undefined"
      ? ""
      : parseJoinCode(new URLSearchParams(window.location.search).get("pin") || "") || "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div className="join-wrap">
      <Card className="join-card">
        <span className="feature-icon violet">
          <Radio size={32} />
        </span>
        <span className="eyebrow">ZAGRAJMY RAZEM</span>
        <h1>
          Jeden kod.
          <br />
          Wspólna przygoda.
        </h1>
        <p className="muted">Wpisz 6-cyfrowy kod wyświetlony przez nauczyciela.</p>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const g = await api<{ id: string }>("games/join", "POST", { pin });
              router.push(`/live/${g.id}`);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            aria-label="Kod rozgrywki"
            className="pin-input"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            onPaste={(e) => {
              e.preventDefault();
              const code = parseJoinCode(e.clipboardData.getData("text"));
              if (code) {
                setPin(code);
                setError("");
              } else setError("Wklej sześciocyfrowy kod lub link do rozgrywki z kodem.");
            }}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            required
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="primary-button" disabled={busy || me.role !== "STUDENT"}>
            {busy ? "Dołączamy…" : "Dołącz do rozgrywki"}
            <ArrowRight size={18} />
          </Button>
          {me.role !== "STUDENT" && (
            <p>To widok ucznia. Rozgrywkę nauczyciela uruchom z biblioteki quizów.</p>
          )}
        </form>
        <small>
          Uczestniczysz jako <strong>{me.name}</strong>.
        </small>
      </Card>
    </div>
  );
}

export function Profile({ me, reload }: { me: Me; reload: () => void }) {
  const [name, setName] = useState(me.name),
    [password, setPassword] = useState(""),
    [currentPassword, setCurrent] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await api("me", "PUT", { name, ...(password ? { password, currentPassword } : {}) });
      if (password) {
        await signOut({ callbackUrl: "/login" });
        return;
      }
      setMessage("Zapisano zmiany.");
      reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PO TWOJEMU</span>
          <h1>Ustawienia konta</h1>
          <p className="muted">Twoje dane i bezpieczeństwo w jednym miejscu.</p>
        </div>
      </div>
      <PreferencesPanel />
      <div className="settings-grid">
        <Card>
          <h2>Twój profil</h2>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <label>
              Imię i nazwisko
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={60}
                required
              />
            </label>
            <label>
              E-mail
              <Input value={me.email} disabled />
            </label>
            <p>
              <span className="badge">{me.role === "TEACHER" ? "Nauczyciel" : "Uczeń"}</span>
            </p>
            <h3>Zmiana hasła</h3>
            <label>
              Obecne hasło
              <Input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </label>
            <label>
              Nowe hasło
              <Input
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <small>
                Pozostaw puste, jeśli nie zmieniasz hasła. Zmiana hasła wyloguje wszystkie sesje.
              </small>
            </label>
            <Button type="submit" disabled={busy} className="primary-button">
              Zapisz zmiany
            </Button>
          </form>
        </Card>
        <Card>
          <h2>Twoje konto</h2>
          <p className="muted">
            Typ konta został wybrany podczas rejestracji. Nauczyciel zarządza swoimi quizami, a
            uczeń ma dostęp do własnych wyników.
          </p>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
            Wyloguj się
          </Button>
        </Card>
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </>
  );
}
