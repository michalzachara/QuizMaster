# QuizMaster

Platforma do tworzenia quizów, testów indywidualnych i rozgrywek na żywo.
Autor: do uzupełnienia.

## Funkcje

- Rejestracja z wyborem roli: uczeń lub nauczyciel. Bez administratora, zaproszeń i weryfikacji e-mail.
- Logowanie Auth.js, hasła Argon2id, edycja profilu, zmiana hasła i wylogowanie.
- Edytor pytań jednokrotnego i wielokrotnego wyboru oraz prawda/fałsz.
- Wersje robocze, publikowanie, podgląd, kolejność pytań i duplikowanie quizów.
- Test indywidualny z linkiem, terminem dostępności, limitem czasu i podejść.
- Socket.IO: kod PIN, poczekalnia, pytania, czas serwerowy, ranking, podium i powrót po rozłączeniu.
- Panele obu ról, rzeczywiste wyniki i historia w PostgreSQL.
- Responsywny interfejs po polsku oraz motywy jasny, ciemny i neonowy.
- Zalogowani użytkownicy są przekierowywani ze strony głównej, logowania i rejestracji do dashboardu.

## Instalacja

Wymagany Node.js 24, npm i PostgreSQL (lokalnie lub Neon).

```sh
npm ci
```

Utwórz `.env` na podstawie `.env.example`. Ustaw `DATABASE_URL`, opcjonalny bezpośredni
`DIRECT_URL`, losowy `AUTH_SECRET`, `AUTH_URL` i `PORT`. Nie commituj sekretów.

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
npm run db:migrate
npm run build
npm run start
```

Domyślny adres: http://localhost:3100. `AUTH_URL` musi odpowiadać dokładnemu adresowi,
z którego korzystają przeglądarki. Dla innych urządzeń ustaw adres hosta dostępny
w sieci. W produkcji używaj HTTPS i poprawnie skonfigurowanego reverse proxy.
Do pracy lokalnej: `npm run dev`. Polecenia uruchamiają Next.js i Socket.IO razem.

## Architektura

Next.js App Router i TypeScript; React, Tailwind, komponenty oparte na shadcn/Base UI,
Lucide, Motion, next-themes, React Hook Form i Zod. PostgreSQL obsługuje Prisma
z adapterem pg. Jeden trwały proces Node (`server.ts`) obsługuje HTTP i Socket.IO
na tym samym porcie. Nie należy wdrażać go jako zwykłej funkcji serverless.
Instalacja na serwerze wymaga także tsx (obecnie w devDependencies, więc `npm ci`
bez pomijania zależności developerskich).

Snapshot quizu utrwala treść testu/sesji niezależnie od późniejszej edycji źródła.
Transakcje i blokady rekordów chronią czas, punktację i pojedynczy zapis odpowiedzi.
Serwer odświeża stan rozgrywek co sekundę; klient wyświetla zsynchronizowany licznik.
Przy wielu instancjach potrzebny będzie adapter pokojów i zaplanowana koordynacja
aktualizacji. Obecna konfiguracja jest przeznaczona dla jednej instancji aplikacji.

## Zasady i bezpieczeństwo

- Wybór nauczyciela przy rejestracji jest świadomą regułą produktu. Nauczyciel ma dostęp wyłącznie do swoich quizów i wyników swoich testów/sesji.
- Uczeń widzi własne wyniki i ranking rozgrywki, do której dołączył.
- PIN/link stanowi zaproszenie do quizu. Nowi uczestnicy live mogą dołączyć tylko w poczekalni.
- Poprawne odpowiedzi nie są wysyłane przed ich ujawnieniem. Punkty liczy serwer.
- Zod, limity wielkości JSON, kontrola Origin i limity żądań w bazie chronią operacje.
- Auth.js obsługuje sesje i zabezpieczenia logowania. Wylogowanie i zmiana hasła unieważniają sesje konta.
- Role nie dają dostępu do haseł, sekretów ani bazy z przeglądarki.
- Nie ma wysyłki poczty ani odzyskiwania hasła przez e-mail.

## Testy

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
# W drugim terminalu, przy uruchomionej aplikacji:
npx tsx scripts/check-flows.ts
```

Testy integracyjne korzystają z tymczasowych kont i quizu; w finally usuwają tylko
utworzone przez siebie rekordy. Na docelowym wdrożeniu uruchamiaj je na osobnej
bazie testowej. Wyniki i granice weryfikacji: `docs/VERIFICATION.md`.

Scenariusz: utwórz konto nauczyciela, utwórz i opublikuj quiz. Uruchom live albo
wygeneruj test. W osobnej przeglądarce zaloguj ucznia i dołącz kodem/linkiem.
Po zakończeniu sprawdź historię obu kont.

## Struktura

- `app/` — strony i API, w tym Auth.js i API v1.
- `components/` — widoki, formularze, motywy i komponenty UI.
- `lib/` — baza, walidacja, punktacja, kontrola dostępu, testy i rozgrywki.
- `prisma/` — schemat i migracje.
- `server.ts` — trwały serwer aplikacji oraz Socket.IO.
- `tests/`, `scripts/` — testy jednostkowe i integracyjne.

## Ograniczenia i dalszy rozwój

Nie dodano uploadu obrazków, pytań tekstowych, pauzowania gry
ani losowania kolejności. Podsumowania pokazują do 100 ostatnich rekordów.
Nie wykonano testów obciążeniowych ani audytu penetracyjnego. Biblioteki wymagają
okresowego przeglądu aktualizacji i podatności przed publicznym wdrożeniem.
Nie ma trwałych kont demonstracyjnych ani fikcyjnych wyników w panelach.

Praca odbywa się w gałęziach `codex/`, z logicznymi commitami. Nie wykonano push.
Przed połączeniem z main należy zachować i osobno rozliczyć lokalne zmiany użytkownika.

Punktacja na żywo: poprawny komplet odpowiedzi daje round(punkty × (1 − 0,5 × czas / limit)). Czas liczony jest na serwerze od rozpoczęcia pytania. Przed upływem limitu wynik maleje od 100% do 50%; błędne i spóźnione odpowiedzi dają 0. Testy indywidualne zachowują punktację za poprawność.
