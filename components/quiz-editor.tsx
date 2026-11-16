"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Radio, Copy } from "lucide-react";
import { api, useResource } from "@/lib/client";
import { type QuizInput } from "@/lib/validation";
import { Card } from "./ui/card";
import { AssignmentShare } from "./assignment-share";
import { Button } from "./ui/button";

import { QuizStudio } from "./quiz-studio";

type Quiz = QuizInput & {
  id: string;
  assignments: {
    id: string;
    timeLimitSeconds: number;
    maxAttempts: number;
    closesAt: string | null;
  }[];
};

const newQuestion = (): QuizInput["questions"][number] => ({
  text: "",
  type: "SINGLE",
  seconds: 30,
  points: 1000,
  options: [
    { text: "", correct: true },
    { text: "", correct: false },
    { text: "", correct: false },
    { text: "", correct: false },
  ],
});

export function QuizEditor({ id }: { id?: string }) {
  const { data, error } = useResource<Quiz>(id ? `quizzes/${id}` : "me");
  if (id && error) return <p className="error">{error}</p>;
  if (id && !data) return <p>Ładowanie edytora…</p>;
  return (
    <QuizStudio
      key={id || "new"}
      id={id}
      initial={
        id && data
          ? {
              title: data.title,
              description: data.description,
              published: data.published,
              questions: data.questions.map((q) => ({
                text: q.text,
                type: q.type,
                seconds: q.seconds,
                points: q.points,
                options: q.options.map((o) => ({ text: o.text, correct: o.correct })),
              })),
            }
          : { title: "", description: "", published: false, questions: [newQuestion()] }
      }
    />
  );
}

export function QuizDetails({ id }: { id: string }) {
  const { data: q, error, reload } = useResource<Quiz>(`quizzes/${id}`);
  const router = useRouter();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function run(action: string) {
    setBusy(true);
    setMessage("");
    try {
      if (action === "delete") {
        await api(`quizzes/${id}`, "DELETE");
        router.push("/quizzes");
      } else {
        const r = await api<{ id: string }>(`quizzes/${id}/${action}`, "POST", {});
        router.push(action === "games" ? `/live/${r.id}` : `/quizzes/${r.id}`);
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (error) return <p className="error">{error}</p>;
  if (!q) return <p>Ładowanie quizu…</p>;
  return (
    <>
      <div className="page-heading">
        <div>
          <Link className="back-link" href="/quizzes">
            ← Biblioteka quizów
          </Link>
          <h1>{q.title}</h1>
          <p className="muted">{q.description}</p>
          <span className="badge">
            {q.published ? "Opublikowany" : "Wersja robocza"} · {q.questions.length} pytań
          </span>
        </div>
        <div className="button-row">
          <Button variant="outline" disabled={busy} onClick={() => run("duplicate")}>
            <Copy size={16} />
            Duplikuj
          </Button>
          <Link className="link-button" href={`/quizzes/${id}/edit`}>
            Edytuj quiz
          </Link>
        </div>
      </div>
      {message && (
        <p className="notice" role="alert">
          {message}
        </p>
      )}
      <div className="mode-grid details-modes">
        <Card>
          <span className="feature-icon violet">
            <Radio />
          </span>
          <h2>Wspólna energia. Na żywo.</h2>
          <p className="muted">
            Otwórz poczekalnię, udostępnij kod i poprowadź klasę przez kolejne pytania.
          </p>
          <Button
            className="primary-button"
            disabled={busy || !q.published}
            onClick={() => run("games")}
          >
            Rozpocznij rozgrywkę <Radio size={18} />
          </Button>
          {!q.published && <small>Opublikuj quiz w edytorze, aby go udostępnić.</small>}
        </Card>
        <AssignmentShare
          id={id}
          published={q.published}
          questions={q.questions}
          onCreated={reload}
        />
      </div>
      <section className="panel-section">
        <h2>Pytania w tym quizie</h2>
        <div className="session-list">
          {q.questions.map((question, i) => (
            <Card key={i} className="question-summary">
              <span className="question-number">{i + 1}</span>
              <div>
                <h3>{question.text}</h3>
                <p className="muted">
                  {question.seconds} sekund · {question.points} punktów
                </p>
                <div className="summary-options">
                  {question.options.map((o, n) => (
                    <span key={n} className={o.correct ? "correct" : ""}>
                      {o.correct && "✓ "}
                      {o.text}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      {q.assignments.length > 0 && (
        <section className="panel-section">
          <h2>Udostępnione testy</h2>
          {q.assignments.map((a) => (
            <Card className="session-row" key={a.id}>
              <Link href={`/test/${a.id}`}>Otwórz test ↗</Link>
              <span>
                {Math.floor(a.timeLimitSeconds / 60)} min {a.timeLimitSeconds % 60} s ·{" "}
                {a.maxAttempts} podejść ·{" "}
                {a.closesAt
                  ? `Rozpoczęcie do ${new Date(a.closesAt).toLocaleString("pl-PL")}`
                  : "Bez terminu (starszy link)"}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(`${window.location.origin}/test/${a.id}`).then(
                    () => setMessage("Skopiowano link."),
                    () => setMessage("Otwórz test i skopiuj adres."),
                  )
                }
              >
                Kopiuj link
              </Button>
            </Card>
          ))}
        </section>
      )}
      <div className="danger-zone">
        <p>Quizy z historią testów lub rozgrywek są chronione przed usunięciem.</p>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Usunąć ten quiz? Tej operacji nie można cofnąć."))
              void run("delete");
          }}
        >
          <Trash2 size={16} />
          Usuń quiz
        </Button>
      </div>
    </>
  );
}
