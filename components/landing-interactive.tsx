"use client";

import { useState, useRef } from "react";
import { ArrowRight, Check, RotateCcw, Timer, Trophy } from "lucide-react";
import { playSound, unlockSound } from "@/lib/preferences";

const questions = [
  {
    icon: "🌍",
    text: "Która planeta jest naszym domem?",
    options: ["Mars", "Ziemia", "Wenus", "Jowisz"],
    correct: 1,
    explanation: "Ziemia jest trzecią planetą od Słońca.",
  },
  {
    icon: "💡",
    text: "Ile boków ma sześciokąt?",
    options: ["Cztery", "Pięć", "Sześć", "Osiem"],
    correct: 2,
    explanation: "Sześciokąt ma sześć boków i sześć kątów.",
  },
  {
    icon: "🌊",
    text: "Który ocean jest największy?",
    options: ["Atlantycki", "Indyjski", "Arktyczny", "Spokojny"],
    correct: 3,
    explanation: "Ocean Spokojny zajmuje największą powierzchnię.",
  },
];

export function LandingDemo() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const question = questions[index];
  const finished = index === questions.length - 1 && answer !== null;
  function next() {
    setIndex(finished ? 0 : index + 1);
    setAnswer(null);
    if (finished) setScore(0);
    heading.current?.focus();
  }
  return (
    <div className="example-card demo-card">
      <div className="example-top">
        <span>SPRÓBUJ BEZ KONTA</span>
        <span>0{index + 1} / 03</span>
      </div>
      <div className="example-progress">
        <i
          style={{ width: `${((index + (answer !== null ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>
      <div className="example-icon" aria-hidden="true">
        {question.icon}
      </div>
      <h2 ref={heading} tabIndex={-1}>
        {question.text}
      </h2>
      <div className="example-options" role="group" aria-label="Wybierz odpowiedź">
        {question.options.map((option, i) => (
          <button
            type="button"
            key={`${index}-${i}`}
            disabled={answer !== null}
            className={
              answer !== null && i === question.correct
                ? "correct"
                : answer === i
                  ? "demo-incorrect"
                  : ""
            }
            onClick={() => {
              setAnswer(i);
              const correct = i === question.correct;
              if (correct) setScore(score + 1);
              unlockSound();
              playSound(correct ? "success" : "error");
            }}
          >
            <b>{String.fromCharCode(65 + i)}</b>
            {option}
            {answer !== null && i === question.correct && <Check size={18} />}
          </button>
        ))}
      </div>
      <div className="demo-feedback" role="status">
        {answer === null ? (
          "Kliknij odpowiedź i sprawdź się!"
        ) : (
          <>
            <strong>
              {answer === question.correct
                ? "Świetnie! Dobra odpowiedź."
                : `Poprawna odpowiedź: ${question.options[question.correct]}.`}
            </strong>
            <span>{question.explanation}</span>
            {finished && (
              <strong>
                Twój wynik: {score} / 3.{" "}
                {score === 3 ? "Komplet trafień!" : "Każde pytanie to nowa wiedza."}
              </strong>
            )}
          </>
        )}
      </div>
      {answer !== null && (
        <button type="button" className="link-button demo-next" onClick={next}>
          {finished ? (
            <>
              <RotateCcw size={17} /> Zagraj ponownie
            </>
          ) : (
            <>
              Następne pytanie <ArrowRight size={17} />
            </>
          )}
        </button>
      )}
      <small>Demo: 3 pytania, bez limitu czasu. Wynik nie jest zapisywany.</small>
    </div>
  );
}

export function LandingTools() {
  const [count, setCount] = useState("10");
  const [seconds, setSeconds] = useState("30");
  const [elapsed, setElapsed] = useState(10);
  const n = Number(count),
    s = Number(seconds);
  const valid =
    count !== "" &&
    seconds !== "" &&
    Number.isSafeInteger(n) &&
    n >= 1 &&
    n <= 10000 &&
    Number.isInteger(s) &&
    s >= 5 &&
    s <= 300;
  const total = n * s + 300;
  return (
    <section className="landing-tools" id="zasady">
      <div className="section-heading">
        <span className="eyebrow">SPRAWDŹ, ZANIM ZACZNIESZ</span>
        <h2>
          Jasne zasady.
          <br />
          Więcej dobrych odpowiedzi.
        </h2>
        <p>Przesuń suwak punktów lub zaplanuj czas swojego testu.</p>
      </div>
      <div className="landing-tools-grid">
        <article className="landing-tool">
          <span className="feature-icon violet">
            <Trophy />
          </span>
          <span className="eyebrow">ROZGRYWKA NA ŻYWO</span>
          <h3>Wiedza + refleks = punkty</h3>
          <p>
            Poprawna odpowiedź daje od 50% do 100% punktów. Im szybciej odpowiesz, tym więcej
            zdobędziesz. Błędna odpowiedź lub przekroczenie czasu daje 0.
          </p>
          <div className="score-preview">
            <strong>
              {Math.round(1000 * (1 - (0.5 * elapsed) / 30))}
              <small> / 1000 pkt</small>
            </strong>
            <span>Poprawna odpowiedź po {elapsed} s</span>
          </div>
          <label htmlFor="demo-speed">Czas odpowiedzi w pytaniu trwającym 30 sekund</label>
          <input
            id="demo-speed"
            type="range"
            min={0}
            max={29}
            value={elapsed}
            onChange={(e) => setElapsed(Number(e.target.value))}
          />
          <div className="range-captions">
            <span>0 s · maksimum</span>
            <span>29 s · ostatnia chwila</span>
          </div>
          <small>
            Symulacja punktacji. W teście indywidualnym liczy się poprawność, a nie szybkość.
          </small>
        </article>
        <article className="landing-tool">
          <span className="feature-icon mint">
            <Timer />
          </span>
          <span className="eyebrow">TEST UDOSTĘPNIONY LINKIEM</span>
          <h3>Zaplanuj czas na spokojnie</h3>
          <p>
            Limit testu to suma czasów wszystkich pytań i dodatkowe 5 minut. Sprawdź przykład, w
            którym każde pytanie ma taki sam czas.
          </p>
          <div className="calculator-fields">
            <label>
              Liczba pytań
              <input
                type="number"
                min={1}
                max={10000}
                step={1}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </label>
            <label>
              Sekundy na pytanie
              <input
                type="number"
                min={5}
                max={300}
                step={1}
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
              />
            </label>
          </div>
          <output className="duration-preview" aria-live="polite">
            {valid ? (
              <>
                <strong>
                  {Math.floor(total / 60)} min {total % 60 ? `${total % 60} s` : ""}
                </strong>
                <span>
                  {n} × {s} s + 5 min zapasu
                </span>
              </>
            ) : (
              <span>Podaj 1–10 000 pytań i 5–300 sekund na pytanie.</span>
            )}
          </output>
          <small>
            Termin ważności linku określa, do kiedy można rozpocząć test. Kto zacznie wcześniej,
            zachowuje pełny czas na oddanie odpowiedzi.
          </small>
        </article>
      </div>
    </section>
  );
}
