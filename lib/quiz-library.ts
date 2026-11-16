export type LibraryQuiz = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  _count: { questions: number };
};

export type QuizFilter = "all" | "published" | "draft";
export type QuizSort = "recent" | "title" | "questions";

function searchable(value: string) {
  return value
    .toLocaleLowerCase("pl")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");
}

export function readFavorites(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === "string"))]
      : [];
  } catch {
    return [];
  }
}

export function filterQuizzes(
  quizzes: LibraryQuiz[],
  options: {
    search: string;
    status: QuizFilter;
    sort: QuizSort;
    favoritesOnly: boolean;
    favorites: string[];
  },
) {
  const words = searchable(options.search).trim().split(/\s+/).filter(Boolean);
  const favorites = new Set(options.favorites);
  const result = quizzes.filter((quiz) => {
    if (options.status === "published" && !quiz.published) return false;
    if (options.status === "draft" && quiz.published) return false;
    if (options.favoritesOnly && !favorites.has(quiz.id)) return false;
    const text = searchable(`${quiz.title} ${quiz.description}`);
    return words.every((word) => text.includes(word));
  });

  // The API already returns the most recently edited quizzes first.
  if (options.sort === "title") result.sort((a, b) => a.title.localeCompare(b.title, "pl"));
  if (options.sort === "questions") result.sort((a, b) => b._count.questions - a._count.questions);
  return result;
}
