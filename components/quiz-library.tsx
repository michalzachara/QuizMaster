"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowUpRight, BookOpen, Plus, Search, SlidersHorizontal, Star, X } from "lucide-react";
import {
  filterQuizzes,
  readFavorites,
  type LibraryQuiz,
  type QuizFilter,
  type QuizSort,
} from "@/lib/quiz-library";
import { useNotification } from "./notifications";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("qm-favorites", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("qm-favorites", listener);
  };
}

function savedFavorites(key: string) {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function QuizLibrary({
  quizzes,
  userId,
  compact = false,
}: {
  quizzes: LibraryQuiz[];
  userId: string;
  compact?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuizFilter>("all");
  const [sort, setSort] = useState<QuizSort>("recent");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const key = `quizmaster-favorites:${userId}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => savedFavorites(key),
    () => "",
  );
  const favorites = readFavorites(raw);
  const notify = useNotification();
  const results = filterQuizzes(quizzes, { search, status, sort, favoritesOnly, favorites });
  const visible = compact ? results.slice(0, 6) : results;
  const filtered = search.trim() !== "" || status !== "all" || favoritesOnly;

  function reset() {
    setSearch("");
    setStatus("all");
    setSort("recent");
    setFavoritesOnly(false);
  }

  function toggleFavorite(quiz: LibraryQuiz) {
    const current = readFavorites(savedFavorites(key));
    const removing = current.includes(quiz.id);
    const updated = removing ? current.filter((id) => id !== quiz.id) : [...current, quiz.id];
    try {
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new Event("qm-favorites"));
      notify({
        title: removing ? "Usunięto z ulubionych" : "Dodano do ulubionych",
        message: quiz.title,
        kind: "success",
      });
    } catch {
      notify({
        title: "Nie można zapisać ulubionych",
        message: "Przeglądarka blokuje zapis danych. Sprawdź jej ustawienia prywatności.",
        kind: "error",
      });
    }
  }

  return (
    <section className="panel-section quiz-library" aria-label="Biblioteka quizów">
      <div className="section-row">
        <div>
          <span className="eyebrow">TWOJE POMYSŁY W JEDNYM MIEJSCU</span>
          <h2>{compact ? "Twoje ostatnie quizy" : "Wszystkie quizy"}</h2>
        </div>
        {compact && (
          <Link href="/quizzes" className="secondary-link">
            Cała biblioteka <ArrowUpRight size={18} />
          </Link>
        )}
      </div>
      {quizzes.length > 0 && (
        <div className="library-toolbar">
          <div className="library-search">
            <Search size={20} aria-hidden="true" />
            <Input
              aria-label="Szukaj quizu po tytule lub opisie"
              placeholder="Tytuł, temat lub słowo kluczowe…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Wyczyść wyszukiwanie">
                <X size={18} />
              </button>
            )}
          </div>
          <label className="library-sort">
            <SlidersHorizontal size={17} aria-hidden="true" />
            <span>Sortuj</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as QuizSort)}
              aria-label="Sortowanie quizów"
            >
              <option value="recent">Ostatnio edytowane</option>
              <option value="title">Tytuł A–Z</option>
              <option value="questions">Najwięcej pytań</option>
            </select>
          </label>
          <div className="library-filters" role="group" aria-label="Filtruj quizy według statusu">
            {(
              [
                { value: "all", label: "Wszystkie" },
                { value: "published", label: "Opublikowane" },
                { value: "draft", label: "Robocze" },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={status === item.value}
                onClick={() => setStatus(item.value)}
              >
                {item.label}
                <span>
                  {
                    quizzes.filter(
                      (quiz) =>
                        item.value === "all" || quiz.published === (item.value === "published"),
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="library-favorites"
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            <Star size={17} />
            Tylko ulubione
          </button>
        </div>
      )}
      {quizzes.length > 0 && (
        <div className="library-summary">
          <span role="status">
            Wyświetlono {visible.length} z {results.length} pasujących quizów
          </span>
          {filtered && (
            <button type="button" onClick={reset}>
              Wyczyść filtry <X size={14} />
            </button>
          )}
          <small>
            Ulubione są zapisywane dla Twojego konta w tej przeglądarce. Lista obejmuje do 100
            ostatnich quizów.
          </small>
        </div>
      )}
      {!results.length ? (
        <Card className="empty">
          <BookOpen size={32} />
          <h3>
            {quizzes.length
              ? "Nie znaleziono pasujących quizów"
              : "Twój pierwszy quiz zaczyna się tutaj"}
          </h3>
          <p>
            {quizzes.length
              ? favoritesOnly
                ? "Oznacz quiz gwiazdką lub zmień pozostałe filtry."
                : "Zmień wyszukiwane słowa albo wyczyść filtry."
              : "Dodaj pytania, sprawdź podgląd i zaproś uczniów do wspólnej nauki."}
          </p>
          {quizzes.length ? (
            <Button variant="outline" onClick={reset}>
              Pokaż wszystkie quizy
            </Button>
          ) : (
            <Link href="/quizzes/new" className="link-button">
              <Plus size={17} />
              Utwórz pierwszy quiz
            </Link>
          )}
        </Card>
      ) : (
        <div className="quiz-grid">
          {visible.map((quiz, index) => {
            const favorite = favorites.includes(quiz.id);
            return (
              <article className="library-card" key={quiz.id}>
                <Link href={`/quizzes/${quiz.id}`} className="quiz-card">
                  <div className={`quiz-cover cover-${index % 4}`}>
                    <BookOpen size={40} />
                    <span className="badge">
                      {quiz.published ? "Opublikowany" : "Wersja robocza"}
                    </span>
                  </div>
                  <div className="quiz-card-body">
                    <small>{quiz._count.questions} pytań</small>
                    <h3>{quiz.title}</h3>
                    <p>{quiz.description || "Twój pomysł na angażującą lekcję."}</p>
                    <span>
                      Otwórz quiz <ArrowUpRight size={17} />
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  className="library-star"
                  aria-pressed={favorite}
                  aria-label={`${favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}: ${quiz.title}`}
                  title={favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                  onClick={() => toggleFavorite(quiz)}
                >
                  <Star size={19} fill={favorite ? "currentColor" : "none"} />
                </button>
                <Link className="library-edit" href={`/quizzes/${quiz.id}/edit`}>
                  Edytuj quiz <ArrowUpRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
