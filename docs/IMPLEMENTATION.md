# Stan implementacji QuizMaster

## Zweryfikowane fundamenty

- Istniejący Next.js 16, React 19, Tailwind i shadcn/ui zostały zachowane.
- Dodano zależności dla Prisma/PostgreSQL, Auth.js, Socket.IO, formularzy i motywów.
- Schemat Prisma obejmuje użytkowników, zaproszenia nauczycieli, quizy, pytania,
  odpowiedzi, publikacje testów, podejścia, rozgrywki i uczestników.
- Publikacje oraz sesje przechowują snapshot quizu, aby edycja źródła nie zmieniała testu.
- Unikalność odpowiedzi live jest wymuszana w bazie.
- Lokalny katalog `.codex/` oraz wygenerowany klient Prisma są ignorowane przez Git.
- Pliki `.env` nie były odczytywane. Konfiguracja Prisma korzysta wyłącznie ze
  zmiennych przekazanych procesowi, bez automatycznego ładowania plików sekretów.

## Co pozostaje

To fundament projektu, nie gotowa aplikacja. Interfejs jest nadal szablonem Next.js.
Nie zaimplementowano jeszcze uwierzytelniania, autoryzacji, edytora quizów,
rozwiązywania testów, serwera Socket.IO, dashboardów i trzech motywów.
Sam schemat danych nie zapewnia kontroli uprawnień ani limitów czasowych.

Planowana architektura: Next.js obsługuje panel i HTTP; osobny proces Socket.IO
zarządza rozgrywką. Oba korzystają z PostgreSQL i wspólnej warstwy autoryzacji.
Transakcje i blokady rekordów muszą serializować odpowiedzi i zmiany stanu gry.
Uczeń otrzymuje wyłącznie publiczną projekcję pytania bez poprawnych odpowiedzi.

## Kontrola jakości

Przeszły `npm run lint`, `npx tsc --noEmit` i `npx prisma validate`.
Migracja początkowa powstała przez porównanie pustej bazy ze schematem.
Nie zastosowano migracji do rzeczywistej bazy. Nie wykonano testów integracyjnych
ani bezpieczeństwa. Nie uruchamiano builda, który automatycznie ładuje lokalne
pliki środowiskowe Next.js.

Nie wykryto poleceń Docker ani psql w PATH. Przed testami integracyjnymi trzeba
udostępnić osobną, testową bazę PostgreSQL i przekazać DATABASE_URL do procesu.
Nie należy używać do tego bazy produkcyjnej.

Instalacja zgłosiła 13 podatności zależności (2 niskie, 11 umiarkowanych).
Wymagają przeglądu przed wdrożeniem; nie wykonywano automatycznej naprawy
wymuszającej potencjalnie niekompatybilne aktualizacje.
