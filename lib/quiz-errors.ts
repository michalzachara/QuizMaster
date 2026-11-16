import { quizInput, type QuizInput } from "./validation";

export function quizErrors(quiz: QuizInput): Record<string, string> {
  const result = quizInput.safeParse(quiz);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    const field = issue.path.at(-1);
    let message = "Sprawdź wartość tego pola.";
    if (path === "title") message = "Wpisz tytuł od 3 do 120 znaków.";
    else if (path === "description") message = "Opis może mieć maksymalnie 1000 znaków.";
    else if (field === "text")
      message = issue.path.includes("options")
        ? "Wpisz odpowiedź od 1 do 300 znaków."
        : "Wpisz treść pytania od 1 do 1000 znaków.";
    else if (field === "seconds") message = "Wpisz pełną liczbę sekund od 5 do 300.";
    else if (field === "points") message = "Wpisz pełną liczbę punktów od 100 do 5000.";
    else if (field === "options") message = issue.message;
    errors[path] = message;
  }
  return errors;
}
