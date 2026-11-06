# Neon — konfiguracja i weryfikacja

Aplikacja korzysta z istniejącej bazy Neon wskazanej przez DATABASE_URL.
Prisma używa adaptera pg w środowisku Node.js i puli do 5 połączeń.
Połączenia nie są udostępniane przeglądarce. Pliki .env oraz .neon są ignorowane.

Konfiguracja Prisma ładuje .env.local/.env przez mechanizm Next.js. Migracje
używają DIRECT_URL albo adresu DATABASE_URL bez przyrostka -pooler w hoście Neon.
Wzór bez sekretów znajduje się w .env.example.

Polecenia:

```sh
npx prisma migrate deploy
npm run build
npm run start -- --port 3100
node scripts/test-database.mjs
```

Weryfikacja 2026-11-06:

- Migracja 202611060001_foundation: All migrations have been successfully applied.
- Build: Compiled successfully, TypeScript i generowanie stron zakończone.
- GET /: HTTP 200.
- GET /api/health: {"status":"ok","database":"connected"}.
- Test bazy: PASS: Neon insert/read, STUDENT default, rollback and no remaining test record.

Build korzysta z webpack i oficjalnego pluginu Tailwind PostCSS, ponieważ
Turbopack kończył się błędem procesu przetwarzającego CSS na tym komputerze.
Czcionki systemowe zastąpiły pobieranie Google Fonts podczas builda.

Instalacja globalnego Neon CLI nie powiodła się z powodu uprawnień.
Użyto npx neon@latest. Init utworzył neon.ts, ale logowanie podczas deploy
wygasło. Sam deploy nie został potwierdzony. Użytkownik podał DATABASE_URL,
więc migrację i testy wykonano bezpośrednio na tej bazie. Aby kontynuować
zarządzanie konfiguracją Neon przez CLI, wykonaj npx neon@latest login,
a potem npx neon@latest deploy.

Nie uruchomiono jeszcze przepływów rejestracji, edycji quizów ani rozgrywek:
te funkcje nadal wymagają implementacji. Test połączenia nie zastępuje
testów bezpieczeństwa i przepływów całej aplikacji.
