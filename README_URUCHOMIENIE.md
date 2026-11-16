# QuizMaster — instrukcja uruchomienia

Opis aplikacji i jej funkcji znajdziesz w [README.md](README.md).

## 1. Wymagania

- Node.js 24 i npm.
- Dostępna baza PostgreSQL — lokalna lub w Neon.
- Terminal, np. PowerShell na Windows.

Sprawdź środowisko:

```sh
node --version
npm --version
```

Aplikacja wymaga trwałego procesu Node.js, ponieważ jeden serwer obsługuje zarówno
strony, jak i rozgrywki przez Socket.IO. Sam hosting plików statycznych nie wystarczy.

## 2. Instalacja zależności

```sh
npm ci
```


## 3. Konfiguracja środowiska

Jeśli projekt nie ma jeszcze pliku `.env`, skopiuj `.env.example`.
Nie nadpisuj istniejącej konfiguracji.

PowerShell:

```powershell
if (-not (Test-Path -LiteralPath .env)) {
  Copy-Item -LiteralPath .env.example -Destination .env
}
```

W pliku `.env` ustaw:

| Zmienna        | Co wpisać                                                                          |
| -------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL` | Adres połączenia z bazą PostgreSQL dla aplikacji                                   |
| `DIRECT_URL`   | Opcjonalny bezpośredni adres bazy do migracji; jeśli go nie używasz, usuń tę linię |
| `AUTH_SECRET`  | Własny losowy sekret sesji                                                         |
| `AUTH_URL`     | Adres, pod którym otwierasz aplikację, domyślnie `http://localhost:3100`           |
| `PORT`         | Port serwera, domyślnie `3100`                                                     |

Przykładowa konfiguracja lokalnej bazy — zamień dane w adresie na własne:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/quizmaster"
AUTH_SECRET="TU_WKLEJ_WYGENEROWANY_SEKRET"
AUTH_URL="http://localhost:3100"
PORT=3100
```

Sekret wygenerujesz poleceniem:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

W przypadku Neon wklej adres połączenia otrzymany dla swojej bazy. Dla aplikacji
użyj połączenia z poolingiem, a dla `DIRECT_URL` połączenia bezpośredniego.
Przykładowy układ obu adresów znajduje się w `.env.example`.

Nie zostawiaj przykładowego `DIRECT_URL` z wartościami `USER`, `PASSWORD` i `HOST`:
migracje użyją go zamiast `DATABASE_URL`. Gdy `DIRECT_URL` nie jest ustawione,
konfiguracja migracji korzysta z `DATABASE_URL`; dla hostów Neon usuwa z niego
część `-pooler`, aby użyć połączenia bezpośredniego.

Plik `.env` jest ignorowany przez Git. Nie umieszczaj prawdziwych haseł ani sekretów
w README lub innych plikach przeznaczonych do publikacji.

## 4. Przygotowanie bazy i klienta Prisma

Baza wskazana w adresie połączenia musi już istnieć. Poniższe polecenie zastosuje
migracje projektu i utworzy potrzebne tabele:

```sh
npm run db:migrate
```

Następnie wygeneruj klienta Prisma:

```sh
npx prisma generate
```

Jest to potrzebne przed pierwszym uruchomieniem trybu developerskiego.
Polecenie `npm run build` również generuje klienta automatycznie.

## 5. Wybierz tryb uruchomienia

### Praca nad kodem

```sh
npm run dev
```

Otwórz [http://localhost:3100](http://localhost:3100).
Tryb developerski odświeża aplikację po zmianach. Pierwsze wejście na dany widok
może trwać dłużej, ponieważ jego kod jest kompilowany.

### Zwykłe użytkowanie i sprawdzanie wydajności

Zatrzymaj poprzedni proces skrótem `Ctrl+C`, a następnie wykonaj:

```sh
npm run build
npm run start
```

Otwórz [http://localhost:3100](http://localhost:3100).
Przy ocenie szybkości korzystaj z tego trybu. Po zmianie kodu zatrzymaj serwer,
ponownie wykonaj `npm run build` i uruchom `npm run start`.

Używaj skryptów projektu, zamiast uruchamiać samo `next dev` lub `next start`:
`server.ts` uruchamia też Socket.IO, niezbędne do rozgrywek na żywo.

## 6. Pierwszy quiz

1. Załóż konto i wybierz rolę **Nauczyciel**.
2. Otwórz bibliotekę, utwórz quiz i dodaj pytania z poprawnymi odpowiedziami.
3. Opublikuj quiz.
4. Uruchom rozgrywkę na żywo albo utwórz link do testu indywidualnego.
5. W drugiej przeglądarce lub prywatnym oknie załóż konto **Uczeń**.
6. Dołącz kodem lub otwórz link, rozwiąż pytania i sprawdź wyniki.

Nie ma gotowych kont demonstracyjnych. Rejestracja nie wymaga kodu e-mail.

## 7. Inny port, telefon lub hosting

Jeśli zmieniasz port, zmień zarówno `PORT`, jak i port w `AUTH_URL`, np.:

```dotenv
PORT=3101
AUTH_URL="http://localhost:3101"
```

Aby otworzyć aplikację na telefonie w tej samej sieci, ustaw `AUTH_URL` na adres
komputera dostępny w tej sieci, np. `http://192.168.1.20:3100`, i otwieraj ten sam
adres na obu urządzeniach. Podany adres IP to przykład — użyj własnego.
Port musi być dostępny przez zaporę systemową. `localhost` na telefonie oznacza
telefon, a nie komputer z serwerem.

Na hostingu ustaw `AUTH_URL` na publiczny adres aplikacji z HTTPS.
Serwer pośredniczący powinien przekazywać ruch HTTP oraz połączenia Socket.IO
pod ścieżką `/socket.io/`, w tym WebSocket. Obecna konfiguracja zakłada jedną
instancję serwera Node.js.

## 8. Dostępne polecenia

| Polecenie              | Działanie                                           |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Serwer developerski Next.js i Socket.IO             |
| `npm run build`        | Generowanie klienta Prisma i kompilacja produkcyjna |
| `npm run start`        | Uruchomienie wcześniej zbudowanej aplikacji         |
| `npm run db:migrate`   | Zastosowanie istniejących migracji                  |
| `npm test`             | Testy jednostkowe                                   |
| `npm run lint`         | Kontrola kodu przez ESLint                          |
| `npm run format:check` | Sprawdzenie formatowania                            |
| `npm run format`       | Automatyczne uporządkowanie formatowania            |

### Test integracyjny

Na osobnej bazie testowej skonfiguruj i uruchom aplikację, a w drugim terminalu wykonaj:

```sh
npx tsx scripts/check-flows.ts
```

Skrypt korzysta z `AUTH_URL` i bazy wskazanej w konfiguracji. Sprawdza m.in.
rejestrację, uprawnienia, panel, testy i rozgrywkę na żywo. Tworzy tymczasowe konta
oraz quizy i usuwa własne dane w bloku kończącym test. Nie przerywaj go w trakcie;
wymuszone zakończenie procesu może uniemożliwić sprzątanie danych.

## 9. Najczęstsze problemy

| Problem                                         | Co sprawdzić                                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `EADDRINUSE`                                    | Port jest zajęty. Zatrzymaj poprzedni serwer lub zmień `PORT` i `AUTH_URL`.                                                                 |
| Brak klienta Prisma                             | Uruchom `npx prisma generate`.                                                                                                              |
| Brak tabel lub błąd migracji                    | Sprawdź adres bazy i wykonaj `npm run db:migrate`. Usuń niewypełniony przykładowy `DIRECT_URL`.                                             |
| Brak połączenia z bazą                          | Sprawdź host, dane logowania, dostępność bazy i wymagania SSL dostawcy.                                                                     |
| Logowanie lub dołączanie do gry nie działa      | `AUTH_URL` musi odpowiadać adresowi w przeglądarce. Uruchom aplikację przez skrypty projektu i sprawdź przekazywanie Socket.IO na hostingu. |
| Strona jest wolna w trakcie pracy nad kodem     | Sprawdź działanie po `npm run build` i `npm run start`.                                                                                     |
| Zmiany nie są widoczne w zwykłym trybie         | Zatrzymaj serwer, zbuduj aplikację ponownie i uruchom ją jeszcze raz.                                                                       |
| Ulubione nie pojawiają się na drugim urządzeniu | Ulubione są zapisywane lokalnie dla konta w danej przeglądarce.                                                                             |
