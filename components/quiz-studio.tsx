"use client";

import { useEffect, useRef, useState } from "react";
import { useNotification } from "./notifications";
import { quizErrors } from "@/lib/quiz-errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleDot,
  Clock,
  Copy,
  Eye,
  ListChecks,
  Plus,
  Save,
  Sparkles,
  ToggleLeft,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
import { api } from "@/lib/client";
import { questionInput, quizInput, type QuizInput } from "@/lib/validation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Question = QuizInput["questions"][number];

const types = [
  { value: "SINGLE", title: "Jedna odpowiedź", hint: "Jeden trafny wybór", icon: CircleDot },
  { value: "MULTIPLE", title: "Wiele odpowiedzi", hint: "Kilka dobrych tropów", icon: ListChecks },
  { value: "BOOLEAN", title: "Prawda / Fałsz", hint: "Szybka decyzja", icon: ToggleLeft },
] as const;

const blank = (): Question => ({
  text: "",
  type: "SINGLE",
  seconds: 30,
  points: 1000,
  options: Array.from({ length: 4 }, () => ({ text: "", correct: false })),
});

export function QuizStudio({ id, initial }: { id?: string; initial: QuizInput }) {
  const [quiz, setQuiz] = useState(initial);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const notify = useNotification();
  const [attempted, setAttempted] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ path: string } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const errors = attempted ? quizErrors(quiz) : {};
  const field = (path: string) => ({
    "data-field": path,
    "aria-invalid": !!errors[path],
    "aria-describedby": errors[path] ? `error-${path}` : undefined,
  });
  const hint = (path: string) =>
    errors[path] ? (
      <span className="field-error" id={`error-${path}`}>
        {errors[path]}
      </span>
    ) : null;
  const questionPath = `questions.${index}`;
  useEffect(() => {
    if (!focusRequest) return;
    const target = root.current?.querySelector<HTMLElement>(`[data-field="${focusRequest.path}"]`);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [focusRequest, index]);
  const [busy, setBusy] = useState(false);
  const [choices, setChoices] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const preview = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const q = quiz.questions[index];
  const ready = quiz.questions.filter((item) => questionInput.safeParse(item).success).length;
  const progress = Math.round(
    ((ready + (quiz.title.trim().length >= 3 ? 1 : 0)) / (quiz.questions.length + 1)) * 100,
  );
  function update(value: Partial<Question>) {
    setQuiz((v) => ({
      ...v,
      questions: v.questions.map((item, i) => (i === index ? { ...item, ...value } : item)),
    }));
  }
  function add(copy = false) {
    const questions = [...quiz.questions];
    questions.splice(index + 1, 0, copy ? structuredClone(q) : blank());
    setQuiz({ ...quiz, questions });
    setIndex(index + 1);
  }
  function move(direction: number) {
    const next = index + direction;
    if (next < 0 || next >= quiz.questions.length) return;
    const questions = [...quiz.questions];
    [questions[next], questions[index]] = [questions[index], questions[next]];
    setQuiz({ ...quiz, questions });
    setIndex(next);
  }
  function changeType(type: Question["type"]) {
    if (type === q.type) return;
    if (type === "BOOLEAN") {
      if (
        q.options.some((o) => o.text.trim()) &&
        !window.confirm("Zmienić odpowiedzi na Prawda i Fałsz? Obecne warianty zostaną zastąpione.")
      )
        return;
      update({
        type,
        options: [
          { text: "Prawda", correct: false },
          { text: "Fałsz", correct: false },
        ],
      });
    } else {
      const first = q.options.findIndex((o) => o.correct);
      update({
        type,
        options: q.options.map((o, i) => ({
          ...o,
          correct: type === "SINGLE" ? i === first : o.correct,
        })),
      });
    }
  }
  async function save(published: boolean) {
    setError("");
    const parsed = quizInput.safeParse({ ...quiz, published });
    if (!parsed.success) {
      setAttempted(true);
      const entries = Object.entries(quizErrors(quiz));
      const path = parsed.error.issues[0].path;
      if (path[0] === "questions" && typeof path[1] === "number") setIndex(path[1]);
      setFocusRequest({ path: entries[0][0] });
      const messages = entries
        .slice(0, 3)
        .map(([key, message]) =>
          key.startsWith("questions.")
            ? `Pytanie ${Number(key.split(".")[1]) + 1}: ${message}`
            : message,
        );
      notify({
        kind: "error",
        title: "Uzupełnij zaznaczone pola",
        message:
          messages.join(" ") +
          (entries.length > 3 ? ` Pozostałe błędy: ${entries.length - 3}.` : ""),
      });
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ id: string }>(
        id ? `quizzes/${id}` : "quizzes",
        id ? "PUT" : "POST",
        parsed.data,
      );
      notify({
        kind: "success",
        title: published ? "Quiz opublikowany!" : "Quiz zapisany!",
        message: published
          ? "Wszystko poszło zgodnie z planem. Możesz rozpocząć rozgrywkę lub udostępnić test."
          : "Wersja robocza została zapisana. Możesz wrócić do edycji w dowolnym momencie.",
      });
      router.push(`/quizzes/${result.id}`);
    } catch (e) {
      setError((e as Error).message);
      notify({
        kind: "error",
        title: "Nie udało się zapisać quizu",
        message: (e as Error).message,
      });
    } finally {
      setBusy(false);
    }
  }
  const previewCorrect = q.options.every((o, i) => o.correct === choices.includes(i));
  return (
    <div ref={root} className="quiz-studio">
      <Link href="/quizzes" className="back-link">
        ← Biblioteka quizów
      </Link>
      <header className="studio-hero">
        <div>
          <span className="studio-kicker">
            <Sparkles size={16} /> TWOJE STUDIO QUIZÓW
          </span>
          <h1>
            Małe pytania.
            <br />
            <span>Wielkie emocje.</span>
          </h1>
          <p>Zamień wiedzę w wyzwanie, które wciąga całą klasę.</p>
        </div>
        <div className="studio-orbit" aria-hidden="true">
          <Zap size={54} />
          <span>Pomysł → gra</span>
        </div>
        <div className="studio-toolbar">
          <div className="studio-stats">
            <span>
              <ListChecks size={17} />
              {quiz.questions.length} pytań
            </span>
            <span>
              <Trophy size={17} />
              {quiz.questions
                .reduce((sum, item) => sum + item.points, 0)
                .toLocaleString("pl-PL")}{" "}
              pkt
            </span>
          </div>
          <div className="button-row">
            <Button
              variant="outline"
              onClick={() => {
                setChoices([]);
                setChecked(false);
                preview.current?.showModal();
              }}
            >
              <Eye size={17} />
              Podgląd
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => save(false)}>
              <Save size={17} />
              Zapisz roboczy
            </Button>
            <Button className="primary-button" disabled={busy} onClick={() => save(true)}>
              <Zap size={17} />
              {busy ? "Zapisywanie…" : "Opublikuj quiz"}
            </Button>
          </div>
        </div>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="studio-meta qm-card" aria-label="Informacje o quizie">
        <div className="studio-section-title">
          <span className="studio-step">01</span>
          <div>
            <h2>Najpierw dobry tytuł</h2>
            <p className="muted">Daj uczniom powód, by kliknąć „zaczynamy”.</p>
          </div>
        </div>
        <div className="studio-meta-fields">
          <label>
            Tytuł quizu
            <Input
              {...field("title")}
              value={quiz.title}
              maxLength={120}
              placeholder="Np. Kosmos bez tajemnic 🚀"
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            />
            {hint("title")}
          </label>
          <label>
            Opis <small>opcjonalnie</small>
            <Input
              {...field("description")}
              value={quiz.description}
              maxLength={1000}
              placeholder="Co odkryjemy podczas tej rozgrywki?"
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
            />
            {hint("description")}
          </label>
        </div>
      </section>
      <div className="studio-layout">
        <aside className="studio-sidebar">
          <div className="section-row">
            <h2>Twoje pytania</h2>
            <span className="badge">{quiz.questions.length} pytań</span>
          </div>
          <nav aria-label="Pytania quizu" className="studio-question-list">
            {quiz.questions.map((item, i) => (
              <button
                key={i}
                aria-current={i === index ? "step" : undefined}
                onClick={() => setIndex(i)}
                className={`studio-question ${i === index ? "active" : ""} ${Object.keys(errors).some((key) => key.startsWith(`questions.${i}.`)) ? "has-error" : ""}`}
              >
                <span className="studio-number">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{item.text || "Nowe pytanie"}</strong>
                  {Object.keys(errors).some((key) => key.startsWith(`questions.${i}.`)) && (
                    <small className="field-error">Wymaga poprawy</small>
                  )}
                  <small>{types.find((t) => t.value === item.type)?.title}</small>
                </span>
                {questionInput.safeParse(item).success && (
                  <Check size={17} className="studio-ready" aria-label="Gotowe" />
                )}
              </button>
            ))}
          </nav>
          <Button className="studio-add" variant="outline" onClick={() => add()}>
            <Plus size={19} />
            Dodaj pytanie
          </Button>
          <div className="studio-progress">
            <Sparkles size={22} />
            <strong>{progress === 100 ? "Gotowe do gry!" : "Twój quiz nabiera kształtu"}</strong>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Kompletność quizu"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <i style={{ width: `${progress}%` }} />
            </div>
            <small>
              {ready} z {quiz.questions.length} pytań gotowych · {progress}%
            </small>
            <small>Zmiany zapiszesz przyciskiem u góry.</small>
          </div>
        </aside>
        <section className="studio-canvas qm-card" aria-label={`Edytor pytania ${index + 1}`}>
          <div className="section-row">
            <span className="studio-kicker">
              <span className="studio-step">02</span> PYTANIE {String(index + 1).padStart(2, "0")}
            </span>
            <div className="button-row studio-tools">
              <Button
                variant="ghost"
                aria-label="Przesuń pytanie w górę"
                disabled={index === 0}
                onClick={() => move(-1)}
              >
                <ArrowUp size={18} />
              </Button>
              <Button
                variant="ghost"
                aria-label="Przesuń pytanie w dół"
                disabled={index === quiz.questions.length - 1}
                onClick={() => move(1)}
              >
                <ArrowDown size={18} />
              </Button>
              <Button variant="ghost" aria-label="Duplikuj pytanie" onClick={() => add(true)}>
                <Copy size={18} />
              </Button>
              <Button
                variant="ghost"
                aria-label="Usuń pytanie"
                disabled={quiz.questions.length === 1}
                onClick={() => {
                  if (q.text.trim() && !window.confirm("Usunąć to pytanie?")) return;
                  setQuiz({ ...quiz, questions: quiz.questions.filter((_, i) => i !== index) });
                  setIndex(Math.max(0, index - 1));
                }}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
          <fieldset className="studio-types">
            <legend>Jak chcesz zapytać?</legend>
            {types.map(({ value, title, hint, icon: Icon }) => (
              <label key={value} className={q.type === value ? "active" : ""}>
                <input
                  type="radio"
                  name="question-type"
                  value={value}
                  checked={q.type === value}
                  onChange={() => changeType(value)}
                />
                <Icon size={23} />
                <strong>{title}</strong>
                <small>{hint}</small>
              </label>
            ))}
          </fieldset>
          <label className="studio-prompt">
            Treść pytania
            <textarea
              {...field(`${questionPath}.text`)}
              className="qm-input"
              value={q.text}
              maxLength={1000}
              placeholder="Zadaj pytanie, które rozbudzi ciekawość…"
              onChange={(e) => update({ text: e.target.value })}
            />
            {hint(`${questionPath}.text`)}
            <small>{q.text.length}/1000 znaków</small>
          </label>
          <div className="studio-answer-heading">
            <h3>Tu zaczyna się wyzwanie</h3>
            <p className="muted">
              {q.type === "MULTIPLE"
                ? "Zaznacz wszystkie poprawne odpowiedzi."
                : "Zaznacz jedną poprawną odpowiedź."}
            </p>
          </div>
          {hint(`${questionPath}.options`)}
          <div
            {...field(`${questionPath}.options`)}
            tabIndex={-1}
            role="group"
            aria-label="Warianty i poprawne odpowiedzi"
            className="studio-answers"
          >
            {q.options.map((option, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`studio-answer answer-tone-${i % 4} ${option.correct ? "is-correct" : ""}`}
              >
                <div className="section-row">
                  <span className="studio-letter">{"ABCDEF"[i]}</span>
                  <label className="studio-correct">
                    <input
                      type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                      name="correct"
                      checked={option.correct}
                      onChange={() =>
                        update({
                          options: q.options.map((o, n) => ({
                            ...o,
                            correct:
                              q.type === "MULTIPLE" ? (n === i ? !o.correct : o.correct) : n === i,
                          })),
                        })
                      }
                      aria-label={`Poprawna odpowiedź ${i + 1}`}
                    />
                    {option.correct ? "Poprawna" : "Oznacz poprawną"}
                  </label>
                </div>
                <textarea
                  {...field(`${questionPath}.options.${i}.text`)}
                  className="qm-input"
                  aria-label={`Odpowiedź ${i + 1}`}
                  placeholder={`Wpisz odpowiedź ${"ABCDEF"[i]}…`}
                  value={option.text}
                  maxLength={300}
                  onChange={(e) =>
                    update({
                      options: q.options.map((o, n) =>
                        n === i ? { ...o, text: e.target.value } : o,
                      ),
                    })
                  }
                />
                {hint(`${questionPath}.options.${i}.text`)}
                {q.type !== "BOOLEAN" && q.options.length > 2 && (
                  <button
                    className="studio-remove"
                    aria-label={`Usuń odpowiedź ${i + 1}`}
                    onClick={() => update({ options: q.options.filter((_, n) => i !== n) })}
                  >
                    <Trash2 size={15} />
                    Usuń
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          {q.type !== "BOOLEAN" && q.options.length < 6 && (
            <Button
              variant="ghost"
              onClick={() => update({ options: [...q.options, { text: "", correct: false }] })}
            >
              <Plus size={17} />
              Dodaj odpowiedź
            </Button>
          )}
          <div className="studio-settings">
            <label>
              <span>
                <Clock size={18} /> Czas na odpowiedź (s)
              </span>
              <Input
                {...field(`${questionPath}.seconds`)}
                type="number"
                min={5}
                max={300}
                value={q.seconds}
                onChange={(e) => update({ seconds: Number(e.target.value) })}
              />
              {hint(`${questionPath}.seconds`)}
            </label>
            <label>
              <span>
                <Trophy size={18} /> Maksymalna liczba punktów
              </span>
              <Input
                {...field(`${questionPath}.points`)}
                type="number"
                min={100}
                max={5000}
                step={100}
                value={q.points}
                onChange={(e) => update({ points: Number(e.target.value) })}
              />
              {hint(`${questionPath}.points`)}
            </label>
          </div>
          <p className="speed-rule">
            Na żywo: im szybciej padnie poprawna odpowiedź, tym więcej punktów (100–50%). Test
            indywidualny: pełne punkty za poprawność.
          </p>
          <div className="studio-bottom">
            <span className="muted">
              {questionInput.safeParse(q).success
                ? "✓ To pytanie jest gotowe. Dobra robota!"
                : "Uzupełnij odpowiedzi i zaznacz poprawne."}
            </span>
            <Button variant="outline" onClick={() => add()}>
              Kolejne pytanie <Plus size={18} />
            </Button>
          </div>
        </section>
      </div>
      <dialog ref={preview} className="preview-dialog studio-preview" aria-label="Podgląd pytania">
        <div className="section-row">
          <span className="studio-kicker">
            <Eye size={17} /> PODGLĄD UCZNIA
          </span>
          <Button variant="ghost" onClick={() => preview.current?.close()}>
            Zamknij ✕
          </Button>
        </div>
        <h2>{q.text || "Tutaj pojawi się Twoje pytanie"}</h2>
        <p className="muted">
          {q.type === "MULTIPLE"
            ? "Wybierz wszystkie poprawne odpowiedzi."
            : "Wybierz jedną odpowiedź."}
        </p>
        <div className="play-options">
          {q.options.map((o, i) => (
            <button
              key={i}
              disabled={checked}
              aria-pressed={choices.includes(i)}
              className={`play-option option-${i % 4} ${choices.includes(i) ? "selected" : ""} ${checked && o.correct ? "correct" : ""}`}
              onClick={() =>
                setChoices(
                  q.type === "MULTIPLE"
                    ? choices.includes(i)
                      ? choices.filter((n) => n !== i)
                      : [...choices, i]
                    : [i],
                )
              }
            >
              <b>{"ABCDEF"[i]}</b>
              {o.text || `Odpowiedź ${i + 1}`}
            </button>
          ))}
        </div>
        <div className="studio-preview-footer">
          <span>
            {q.seconds} s · {q.points} pkt
          </span>
          <Button
            disabled={!choices.length}
            onClick={() => {
              if (checked) {
                setChecked(false);
                setChoices([]);
              } else setChecked(true);
            }}
          >
            {checked ? "Spróbuj ponownie" : "Sprawdź odpowiedź"}
          </Button>
        </div>
        {checked && (
          <p role="status" className="feedback">
            {previewCorrect
              ? `Świetnie! +${q.points} punktów ✨`
              : "Jeszcze jeden krok do wiedzy. Sprawdź zaznaczone poprawne odpowiedzi."}
          </p>
        )}
        <p className="muted">To tylko podgląd — wynik nie jest zapisywany.</p>
      </dialog>
    </div>
  );
}
