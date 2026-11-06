# Weryfikacja — 6 listopada 2026

## Wyniki

- `npm run build`: kompilacja, TypeScript i generowanie stron zakończone sukcesem.
- `npm run lint`: bez błędów i ostrzeżeń.
- `npm test`: 4 testy, 4 sukcesy.
- `npx tsx scripts/check-flows.ts`: przepływy HTTP i Socket.IO przeszły.
- Przegląd wizualny w przeglądarce: strona główna i logowanie przy szerokości
  1365 px i 390 px. Brak poziomego przewijania. Sprawdzono jasny i neonowy motyw.

Test integracyjny tworzy osobne, losowo nazwane konta i quiz. W bloku finally
usuwa tylko własne rekordy. Nie usuwa danych istniejących użytkowników.

Zweryfikowane przepływy:

1. Auth.js — logowanie i odczyt sesji po stronie serwera.
   Rejestracja obu ról działa bez zaproszenia i kodu e-mail. Zalogowane konto
   jest przekierowywane z `/`, `/login` i `/register` do `/dashboard`.
2. Tworzenie oraz edycja quizu, publikacja testu i limit podejść.
3. Zapis poprawnej odpowiedzi, naliczenie 1000 punktów i zakończenie testu.
4. Prawdziwe połączenia Socket.IO prowadzącego i dwóch uczniów, poczekalnia,
   start pytania, odpowiedź, ponowne połączenie, upływ czasu i końcowy ranking.

Testy bezpieczeństwa sprawdzają odpowiedź serwera oraz stan bazy:

- Uczeń próbuje utworzyć quiz nauczyciela: HTTP 403; brak nowego quizu.
- Inny uczeń odczytuje lub kończy cudze podejście: HTTP 403; podejście niezmienione.
- Dodatkowe pole score=999999: HTTP 400; wynik niezmieniony.
- Ponowne przesłanie odpowiedzi: HTTP 409; punkty nie są naliczane drugi raz.
- Uczeń próbuje sterować rozgrywką: HTTP 403; stan nadal WAITING.
- Odpowiedź po czasie: HTTP 409; brak dodatkowego rekordu LiveAnswer.
- Publiczne pytanie nie zawiera właściwości correct ani correctIds przed zakończeniem.

## Granice weryfikacji

Nie wykonano testu obciążeniowego ani pełnego audytu penetracyjnego.
Podgląd wizualny nie obejmował wszystkich ekranów po zalogowaniu.
Nie zweryfikowano wdrożenia na publicznym hostingu.
