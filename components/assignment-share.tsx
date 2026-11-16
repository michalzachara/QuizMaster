"use client";

import { useState } from "react";
import { Clock, Link as LinkIcon, CalendarClock, Check, Copy } from "lucide-react";
import { assignmentDuration } from "@/lib/validation";
import { api } from "@/lib/client";
import { useNotification } from "./notifications";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

function localDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function AssignmentShare({
  id,
  published,
  questions,
  onCreated,
}: {
  id: string;
  published: boolean;
  questions: { seconds: number }[];
  onCreated: () => void;
}) {
  const [opens, setOpens] = useState("");
  const [closes, setCloses] = useState(() => localDate(new Date(Date.now() + 86400000)));
  const [attempts, setAttempts] = useState(1),
    [reveal, setReveal] = useState(false),
    [busy, setBusy] = useState(false),
    [link, setLink] = useState(""),
    [error, setError] = useState("");
  const notify = useNotification();
  const seconds = assignmentDuration(questions);
  async function submit() {
    setError("");
    const from = opens ? new Date(opens) : new Date(),
      until = new Date(closes);
    if (!closes || !Number.isFinite(until.getTime()) || until <= from || until <= new Date()) {
      const message = "Wybierz przyszły termin zamknięcia, późniejszy niż początek dostępności.";
      setError(message);
      notify({ kind: "error", title: "Sprawdź ważność linku", message });
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ id: string }>(`quizzes/${id}/assignments`, "POST", {
        maxAttempts: attempts,
        revealAnswers: reveal,
        opensAt: from.toISOString(),
        closesAt: until.toISOString(),
      });
      setLink(`${window.location.origin}/test/${result.id}`);
      onCreated();
      notify({
        kind: "success",
        title: "Link do testu gotowy!",
        message: "Skopiuj go i przekaż uczniom. Każdy otrzyma pełny czas od momentu rozpoczęcia.",
      });
    } catch (e) {
      notify({
        kind: "error",
        title: "Nie udało się utworzyć linku",
        message: (e as Error).message,
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="assignment-share">
      <div className="share-heading">
        <span className="feature-icon violet">
          <LinkIcon />
        </span>
        <span className="pill">NAUKA WE WŁASNYM RYTMIE</span>
      </div>
      <h2>
        Jeden link.
        <br />
        Wiele małych zwycięstw.
      </h2>
      <p className="muted">Ustaw okno rozpoczęcia i wyślij klasie gotowe wyzwanie.</p>
      <div className="assignment-duration">
        <Clock size={26} />
        <div>
          <strong>
            {Math.floor(seconds / 60)} min {seconds % 60 ? `${seconds % 60} s` : ""}
          </strong>
          <span>Czas na rozwiązanie</span>
        </div>
        <span className="badge">+5 min zapasu</span>
        <small>
          Suma limitów wszystkich pytań + 5 minut. Liczymy automatycznie dla każdego ucznia od
          chwili rozpoczęcia.
        </small>
      </div>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="question-settings">
          <label>
            <span>
              <CalendarClock size={17} /> Można rozpocząć od
            </span>
            <Input type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} />
            <small>Puste pole = od teraz.</small>
          </label>
          <label>
            Ostatni moment na rozpoczęcie
            <Input
              type="datetime-local"
              required
              value={closes}
              aria-invalid={!!error}
              aria-describedby={error ? "share-expiry-error" : undefined}
              onChange={(e) => {
                setCloses(e.target.value);
                setError("");
              }}
            />
            {error && (
              <span id="share-expiry-error" className="field-error">
                {error}
              </span>
            )}
          </label>
        </div>
        <div className="share-presets">
          <span>Ważność od teraz:</span>
          {[1, 24, 168].map((hours) => (
            <button
              type="button"
              key={hours}
              onClick={() => {
                setCloses(localDate(new Date(Date.now() + hours * 3600000)));
                setError("");
              }}
            >
              {hours === 1 ? "1 godzina" : hours === 24 ? "24 godziny" : "7 dni"}
            </button>
          ))}
        </div>
        <label>
          Liczba podejść
          <Input
            type="number"
            min={1}
            max={10}
            value={attempts}
            required
            onChange={(e) => setAttempts(Number(e.target.value))}
          />
        </label>
        <label className="check-label">
          <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} />
          Pokaż poprawne odpowiedzi po zakończeniu
        </label>
        <p className="share-policy">
          <Check size={19} />
          Kto zacznie przed zamknięciem linku, zachowa pełny czas na dokończenie i oddanie testu.
        </p>
        <Button className="primary-button" type="submit" disabled={busy || !published}>
          <LinkIcon size={18} />
          {busy ? "Tworzymy link…" : "Utwórz link do testu"}
        </Button>
        {!published && <small>Najpierw opublikuj quiz.</small>}
      </form>
      {link && (
        <div className="share-result">
          <strong>Gotowe do udostępnienia ✨</strong>
          <Input aria-label="Link do testu" readOnly value={link} />
          <Button
            onClick={() =>
              navigator.clipboard.writeText(link).then(
                () =>
                  notify({
                    kind: "success",
                    title: "Skopiowano link",
                    message: "Możesz teraz wkleić go w wiadomości do uczniów.",
                  }),
                () =>
                  notify({
                    kind: "error",
                    title: "Skopiuj link ręcznie",
                    message: "Zaznacz adres w polu i skopiuj go.",
                  }),
              )
            }
          >
            <Copy size={17} />
            Kopiuj link
          </Button>
        </div>
      )}
    </Card>
  );
}
