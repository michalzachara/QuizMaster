# QuizMaster — opis projektu

QuizMaster to aplikacja internetowa do tworzenia quizów, prowadzenia rozgrywek
na żywo i udostępniania testów indywidualnych. Łączy panel nauczyciela z przestrzenią
ucznia, automatycznym sprawdzaniem odpowiedzi oraz historią wyników.

Interfejs jest po polsku i działa w przeglądarce na komputerze, tablecie i telefonie.

**Instalacja i konfiguracja:** [Instrukcja uruchomienia](README_URUCHOMIENIE.md).

## Dla kogo jest aplikacja?

Przy rejestracji użytkownik wybiera jedną z dwóch ról:

- **Nauczyciel** — tworzy i publikuje quizy, prowadzi rozgrywki, udostępnia testy
  oraz przegląda wyniki swoich uczniów.
- **Uczeń** — dołącza do rozgrywki kodem, otwiera test z linku i sprawdza własne wyniki.

Nie ma roli administratora ani weryfikacji konta kodem e-mail. Do udziału w testach
oraz rozgrywkach potrzebne jest konto ucznia.

## Funkcje aplikacji

### Konta i ustawienia

- Rejestracja, logowanie i wylogowanie.
- Edycja nazwy użytkownika oraz zmiana hasła z podaniem obecnego hasła.
- Automatyczne przekierowanie zalogowanej osoby ze strony głównej, logowania
  i rejestracji do panelu.
- Trzy motywy: biały, ciemny i neonowy, wybierane ikonkami.
- Włączanie dźwięków, regulacja głośności i odsłuch efektu.
- Ustawienia animacji, większego tekstu i kompaktowego widoku.

Preferencje wyglądu i dźwięku są zapisywane w przeglądarce.

### Tworzenie i edycja quizów

- Tytuł, opis, wersja robocza i publikowanie quizu.
- Pytania jednokrotnego wyboru, wielokrotnego wyboru oraz prawda/fałsz.
- Osobny czas odpowiedzi i maksymalna liczba punktów dla każdego pytania.
- Dodawanie pytań bez ustawionego limitu ich liczby w edytorze.
- Duplikowanie, usuwanie i zmiana kolejności pytań oraz podgląd quizu.
- Duplikowanie całego quizu.
- Wskazywanie błędnie wypełnionych pól i komunikaty o wyniku zapisu.

Quizy z historią testów lub rozgrywek są chronione przed usunięciem. Treść udostępnionego
testu i uruchomionej sesji jest utrwalana, więc późniejsza edycja quizu nie zmienia
pytań w tych testach i sesjach.

### Biblioteka quizów

- Wyszukiwanie po tytule i opisie, również bez polskich znaków.
- Filtrowanie quizów opublikowanych i roboczych.
- Sortowanie według ostatniej edycji, tytułu lub liczby pytań.
- Oznaczanie quizów gwiazdką i filtr „Tylko ulubione”.
- Szybkie przejście do edycji, licznik wyników i czyszczenie filtrów.

Ulubione są zapisywane osobno dla konta w danej przeglądarce. Nie synchronizują się
między urządzeniami. Wyszukiwanie i filtrowanie działają na pobranej liście,
bez dodatkowego zapytania do serwera przy każdym wpisanym znaku.

### Rozgrywka na żywo

Nauczyciel uruchamia opublikowany quiz i udostępnia sześciocyfrowy kod lub link.
Uczniowie dołączają do poczekalni, a prowadzący uruchamia kolejne pytania.

- Wspólna poczekalnia i lista uczestników.
- Kopiowanie kodu i linku; możliwość wklejenia linku w pole kodu.
- Odliczanie czasu synchronizowane z serwerem.
- Punkty za poprawność i szybkość odpowiedzi.
- Wyniki pytań, ranking i podium na zakończenie.
- Możliwość powrotu do stanu gry po ponownym połączeniu.

Za poprawną odpowiedź gracz otrzymuje od około 50% do 100% punktów pytania.
Im szybciej odpowie, tym większy wynik. Błędna lub spóźniona odpowiedź daje 0 punktów.
W pytaniach wielokrotnego wyboru wymagany jest dokładnie poprawny zestaw odpowiedzi.
Czas i punkty oblicza serwer:

```text
punkty = round(maksymalne_punkty × (1 − 0,5 × czas_odpowiedzi / limit_czasu))
```

Nowe osoby mogą dołączać tylko w poczekalni.

### Testy indywidualne z linku

- Okno dostępności: początek i koniec możliwości rozpoczęcia testu.
- Limit podejść oraz ustawienie ujawniania odpowiedzi po zakończeniu.
- Automatyczny limit czasu: suma czasów wszystkich pytań + 5 minut.
- Wznawianie rozpoczętego podejścia i zapis odpowiedzi.
- Automatyczne sprawdzanie oraz podsumowanie wyniku.

Wygaśnięcie linku blokuje nowe podejścia. Osoba, która rozpoczęła wcześniej,
zachowuje swój pełny czas na ukończenie i oddanie testu. Zamknięcie przeglądarki
nie zatrzymuje licznika. W tym trybie punkty zależą od poprawności, a nie szybkości.

### Panel i strona główna

- Historia testów i rozgrywek oraz podsumowania wyników.
- Wykres aktywności z wyborem 7 lub 14 dni i statystyki ukończenia testów.
- Opis zasad, odpowiedzi na częste pytania i prezentacja trybów nauki.
- Quiz demonstracyjny z trzema pytaniami, dostępny bez konta.
- Symulator punktacji za szybkość i kalkulator czasu testu.

## Technologie i organizacja kodu

Aplikacja korzysta z Next.js, React i TypeScript. Interfejs wykorzystuje Tailwind CSS,
Base UI, Lucide, Motion oraz next-themes. Logowanie obsługuje Auth.js, hasła są haszowane
przez Argon2, a dane wejściowe sprawdza Zod. PostgreSQL jest obsługiwany przez Prisma
z adapterem `pg`. Rozgrywki na żywo korzystają z Socket.IO.

| Katalog lub plik | Przeznaczenie                                             |
| ---------------- | --------------------------------------------------------- |
| `app/`           | Strony, API i style aplikacji                             |
| `components/`    | Widoki, formularze i elementy interfejsu                  |
| `lib/`           | Walidacja, dostęp do danych, punktacja i logika rozgrywek |
| `prisma/`        | Schemat bazy i migracje                                   |
| `server.ts`      | Wspólny serwer HTTP i Socket.IO                           |
| `tests/`         | Testy jednostkowe                                         |
| `scripts/`       | Skrypty pomocnicze i testy integracyjne                   |

Widoki edytora i rozgrywki są ładowane na żądanie. Dane panelu pobierają się równolegle,
a uczestnicy jednej gry współdzielą odczyt jej stanu w danym cyklu odświeżania.
Kontrola uprawnień i odpowiedzi pozostaje osobna dla każdego gracza.

## Obecny zakres i ograniczenia

- Podsumowania i biblioteka obejmują do 100 ostatnich rekordów danej kategorii.
- Brak wysyłki e-maili, resetu hasła przez e-mail i trwałych kont demonstracyjnych.
- Brak przesyłania obrazków do pytań, odpowiedzi tekstowych, pauzowania rozgrywki
  i losowania kolejności pytań.
- Brak limitu liczby pytań w edytorze nie oznacza nieograniczonego rozmiaru zapisu:
  API przyjmuje formularz quizu do 16 MB.
- Obecna konfiguracja serwera jest przygotowana dla jednej instancji Node.js.
  Uruchomienie kilku instancji wymaga dodatkowej koordynacji Socket.IO.
