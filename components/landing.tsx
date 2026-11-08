"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Zap, Radio, BookOpen, ShieldCheck, Trophy, Check, GraduationCap, Presentation, ListChecks, Clock3, Palette, MousePointer2, ChevronDown } from "lucide-react";
import { LandingDemo, LandingTools } from "./landing-interactive";
import { ThemeSwitch } from "./providers";

const faqs = [
  ["Czy jest limit liczby pytań?", "Edytor nie ogranicza liczby pytań. Możesz dodawać kolejne, duplikować je i zmieniać ich kolejność. Każde pytanie ma własny czas i liczbę punktów."],
  ["Co jeśli link wygaśnie w trakcie testu?", "Po wygaśnięciu linku nie można rozpocząć nowego podejścia. Jeśli test został rozpoczęty wcześniej, uczeń zachowuje swój pełny limit czasu: sumę czasów pytań plus 5 minut."],
  ["Czy mogę korzystać z QuizMaster na telefonie?", "Tak. Quizy, testy i panel działają w przeglądarce na telefonie, tablecie i komputerze. Nie musisz instalować aplikacji."],
  ["Jak założyć konto nauczyciela?", "Podczas rejestracji wybierz Nauczyciel, wpisz imię, adres e-mail i hasło. Konto jest gotowe od razu — bez zaproszenia i bez zatwierdzania przez administratora."],
  ["Czym różni się quiz na żywo od testu?", "W rozgrywce na żywo nauczyciel prowadzi wszystkich przez te same pytania, a każde z nich ma własny licznik. Test indywidualny otwierasz z linku i rozwiązujesz samodzielnie w ustalonym limicie czasu."],
  ["Czy uczeń musi mieć konto?", "Tak. Zalogowany uczeń dołącza kodem do rozgrywki lub otwiera link do testu. Dzięki temu odpowiedzi i wyniki zapisują się na jego koncie."],
  ["Jakie pytania mogę dodawać?", "W edytorze dostępne są pytania jednokrotnego wyboru, wielokrotnego wyboru oraz prawda/fałsz. Dla każdego pytania ustawisz poprawne odpowiedzi, czas i liczbę punktów."],
  ["Co się stanie, gdy odświeżę stronę?", "Odpowiedzi i stan rozgrywki są zapisywane w bazie. Po ponownym otwarciu wrócisz do bieżącego etapu. Czas nadal biegnie, także wtedy, gdy strona jest zamknięta."],
];
export function Landing() {
  return <div className="landing landing-v2">
    <header className="landing-nav">
      <Link href="/" className="brand"><span className="brand-icon"><Zap/></span>QuizMaster<span className="brand-dot">.</span></Link>
      <nav aria-label="Nawigacja główna"><a href="#jak-to-dziala">Jak to działa</a><a href="#mozliwosci" className="nav-features">Możliwości</a><ThemeSwitch/><Link href="/login">Zaloguj się</Link><Link className="link-button" href="/register">Załóż konto <ArrowUpRight size={18}/></Link></nav>
    </header>
    <main>
      <section className="hero">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="hero-copy">
          <span className="pill"><span className="status-dot"/> MNIEJ NUDY. WIĘCEJ ODKRYĆ.</span>
          <h1>Nauka, która<br/><span>wciąga do gry.</span></h1>
          <p>Pomysły zamieniaj w quizy. Pytania — w rozmowy. Połącz energię wspólnej rozgrywki ze swobodą nauki we własnym tempie.</p>
          <div className="hero-actions"><Link className="link-button large" href="/register">Zacznij z QuizMaster <ArrowRight size={20}/></Link><Link className="secondary-link" href="/join"><Radio size={20}/> Mam kod do quizu</Link></div>
          <div className="hero-note"><Check size={18}/> Dla uczniów i nauczycieli <span>•</span> W przeglądarce, bez instalacji</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, rotate: 3 }} animate={{ opacity: 1, rotate: 0 }} transition={{ duration: .6 }} className="hero-visual" aria-label="Interaktywny quiz demonstracyjny">
          <div className="floating-tag"><Zap size={19}/> Ciekawość to supermoc</div>
          <LandingDemo/>
          <div className="floating-score"><Trophy size={28}/><div>Małe zwycięstwa.<br/><strong>Wielka motywacja.</strong></div></div><div className="orb orb-one"/><div className="orb orb-two"/>
        </motion.div>
      </section>
      <div className="capability-strip"><span><Presentation size={21}/> Twórz po swojemu</span><span><Radio size={21}/> Grajcie razem</span><span><Clock3 size={21}/> Ucz się w swoim tempie</span><span><Trophy size={21}/> Zobacz swoje postępy</span></div>
      <section className="how-section" id="jak-to-dziala">
        <div className="section-heading"><span className="eyebrow">OD POMYSŁU DO PIERWSZEGO „WIEM!”</span><h2>Trzy kroki.<br/>I zaczyna się dobra lekcja.</h2><p>Bez skomplikowanych ustawień. Z miejscem na Twoją kreatywność.</p></div>
        <div className="how-grid">{[
          { icon: ListChecks, title: "Ułóż swoje pytania", text: "Wybierz typ odpowiedzi, ustaw czas i punkty. Zapisz wersję roboczą, sprawdź podgląd i opublikuj quiz." },
          { icon: MousePointer2, title: "Zaproś do nauki", text: "Uruchom rozgrywkę i udostępnij sześciocyfrowy kod. Wolisz test indywidualny? Wystarczy link." },
          { icon: Trophy, title: "Zobacz, co już potraficie", text: "Odpowiedzi sprawdza serwer. Uczniowie poznają wynik, a nauczyciel może wrócić do historii i podsumowań." },
        ].map(({ icon: Icon, title, text }, i) => <article key={title}><div className="how-top"><span className="step-number">0{i + 1}</span><Icon size={30}/></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className="mode-section" id="tryby">
        <div className="section-heading"><span className="eyebrow">RÓŻNE POTRZEBY. TA SAMA CIEKAWOŚĆ.</span><h2>Wspólny moment.<br/>Albo własny rytm.</h2></div>
        <div className="mode-grid">
          <article className="mode-live"><div className="mode-title"><div className="feature-icon violet"><Radio/></div><span className="pill">NA ŻYWO</span></div><h3>Cała klasa.<br/>Ta sama ekscytacja.</h3><p>Poczekalnia, wspólne pytania, odliczanie i ranking. Nauczyciel nadaje tempo, a każdy uczeń ma szansę pokazać, co potrafi.</p><ul className="feature-list"><li><Check/>Dołączanie sześciocyfrowym kodem</li><li><Check/>Punkty i czas liczone na serwerze</li><li><Check/>Ranking i podium na zakończenie</li></ul><Link href="/join">Dołącz do rozgrywki <ArrowRight size={20}/></Link><div className="mode-decoration" aria-hidden="true"><Radio size={100}/></div></article>
          <article className="mode-solo"><div className="mode-title"><div className="feature-icon mint"><BookOpen/></div><span className="pill">INDYWIDUALNIE</span></div><h3>Skupienie.<br/>Na Twoich zasadach.</h3><p>Sprawdzian, powtórka czy praca domowa? Udostępnij test linkiem i pozwól uczniom pracować samodzielnie w ustalonym czasie.</p><ul className="feature-list"><li><Check/>Termin dostępności i limit podejść</li><li><Check/>Automatyczne sprawdzanie odpowiedzi</li><li><Check/>Zapisane wyniki i historia testów</li></ul><Link href="/register">Stwórz swój pierwszy test <ArrowRight size={20}/></Link><div className="mode-decoration" aria-hidden="true"><BookOpen size={100}/></div></article>
        </div>
      </section>
      <section className="possibilities" id="mozliwosci"><div className="section-heading"><span className="eyebrow">WSZYSTKO W JEDNYM MIEJSCU</span><h2>Mniej organizowania.<br/>Więcej uczenia.</h2><p>Od pierwszego pytania do ostatniego punktu — spójna przestrzeń dla obu stron lekcji.</p></div><div className="feature-bento">
        <article className="bento-editor"><span className="feature-icon violet"><ListChecks/></span><h3>Twoje pytania, Twój styl.</h3><p>Jednokrotny wybór, wielokrotny wybór i prawda/fałsz. Dodawaj pytania bez limitu liczby, zmieniaj ich kolejność, duplikuj quizy i korzystaj z podglądu przed publikacją.</p><div className="question-types"><span><span>A</span> Jedna odpowiedź <Check size={18}/></span><span><ListChecks size={20}/> Kilka odpowiedzi <Check size={18}/></span><span><Check size={20}/> Prawda / Fałsz</span></div></article>
        <article className="bento-themes"><Palette size={30}/><h3>Dobierz klimat do siebie.</h3><p>Biały dla przejrzystości. Ciemny dla skupienia. Neonowy dla energii. W ustawieniach dopasujesz też dźwięki, animacje i wielkość tekstu.</p><div className="theme-samples" aria-label="Trzy dostępne motywy"><span className="sample-light">Aa<small>Biały</small></span><span className="sample-dark">Aa<small>Ciemny</small></span><span className="sample-neon">Aa<small>Neon</small></span></div></article>
        <article className="bento-safety"><ShieldCheck size={30}/><h3>Uczciwe zasady gry.</h3><p>Poprawne odpowiedzi pozostają na serwerze do momentu ich ujawnienia. Punkty nie zależą od danych wpisanych w przeglądarce.</p></article>
        <article className="bento-history"><Trophy size={30}/><h3>Wyniki, do których wrócisz.</h3><p>Po lekcji nic nie ginie. Historia testów i sesji pozwala wrócić do rezultatów, zamiast zapisywać je na kartce.</p><Link href="/register">Zbuduj swoją historię <ArrowUpRight size={20}/></Link></article>
      </div></section>
      <LandingTools/>
      <section className="roles-section"><div><span className="eyebrow">PO DWÓCH STRONACH TEJ SAMEJ LEKCJI</span><h2>Ty wybierasz rolę.<br/>My dajemy przestrzeń.</h2><p>Wybierz typ konta przy rejestracji i zacznij od razu. Bez zaproszeń, administratora i czekania na aktywację.</p><Link className="link-button large" href="/register">Wybierz swoją rolę <ArrowRight size={19}/></Link></div><div className="role-feature-list"><article><Presentation size={27}/><div><h3>Jestem nauczycielem</h3><p>Tworzę quizy, prowadzę rozgrywki, udostępniam testy i przeglądam wyniki swoich uczniów.</p></div></article><article><GraduationCap size={29}/><div><h3>Jestem uczniem</h3><p>Dołączam kodem lub linkiem, rozwiązuję pytania i sprawdzam swoje wyniki w jednym panelu.</p></div></article></div></section>
      <section className="faq-section" id="pytania"><div className="section-heading"><span className="eyebrow">JESZCZE JEDNO PYTANIE?</span><h2>Warto wiedzieć na start.</h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={22}/></summary><p>{answer}</p></details>)}</div></section>
      <section className="landing-cta"><span className="cta-star" aria-hidden="true">✦</span><span className="eyebrow">NASTĘPNA ŚWIETNA LEKCJA ZACZYNA SIĘ TUTAJ</span><h2>Zrób miejsce<br/>na ciekawość.</h2><p>Twórz, odkrywaj i ucz się razem. Reszta zaczyna się od jednego pytania.</p><Link href="/register" className="link-button large">Dołącz do QuizMaster <ArrowRight size={20}/></Link><small>Masz już konto? <Link href="/login">Zaloguj się →</Link></small></section>
    </main>
    <footer className="landing-footer"><div><Link href="/" className="brand">QuizMaster<span className="brand-dot">.</span></Link><p>Z ciekawości rodzi się wiedza.</p></div><nav aria-label="Nawigacja w stopce"><a href="#jak-to-dziala">Jak to działa</a><a href="#mozliwosci">Możliwości</a><a href="#pytania">Pytania i odpowiedzi</a><Link href="/login">Zaloguj się <ArrowUpRight size={16}/></Link></nav><ThemeSwitch/></footer>
  </div>;
}
