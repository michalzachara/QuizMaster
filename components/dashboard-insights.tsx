"use client";
import { useState } from "react";
import { Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Card } from "./ui/card";

type Attempt = { startedAt: string; finished: boolean };
type Game = { createdAt: string };
export function DashboardInsights({ attempts, games }: { attempts: Attempt[]; games: Game[] }) {
  const [period, setPeriod] = useState(7);
  const [today] = useState(() => new Date());
  const days = Array.from({ length: period }, (_, index) => {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - period + index + 1);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const inDay = (value: string) => new Date(value) >= start && new Date(value) < end;
    return { label: start.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }), short: start.toLocaleDateString("pl-PL", { weekday: "short" }), tests: attempts.filter(a => inDay(a.startedAt)).length, games: games.filter(g => inDay(g.createdAt)).length };
  });
  const max = Math.ceil(Math.max(2, ...days.flatMap(day => [day.tests, day.games])) / 2) * 2;
  const complete = attempts.filter(a => a.finished).length;
  const percentage = attempts.length ? Math.round(complete / attempts.length * 100) : 0;
  const total = days.reduce((sum, day) => sum + day.tests + day.games, 0);
  return <div className="insights-grid">
    <section aria-labelledby="activity-title"><div className="insight-heading"><h2 id="activity-title">Aktywność</h2><div className="period-switch" aria-label="Okres wykresu">{[7, 14].map(value => <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value} dni</button>)}</div></div>
      <Card className="activity-card"><div className="activity-summary"><div><strong>{total}</strong><span>rozpoczętych testów i sesji</span></div><div className="chart-legend"><span><i/>Testy</span><span><i/>Sesje na żywo</span></div></div>
        <div className="activity-chart" role="img" aria-label={`Aktywność w ostatnich ${period} dniach. Łącznie ${total} rozpoczętych testów i sesji. Szczegóły w tabeli poniżej.`}><div className="chart-gridlines" aria-hidden="true"><span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span></div><div className="chart-columns">{days.map(day => <div className="chart-day" key={day.label} title={`${day.label}: ${day.tests} testów, ${day.games} sesji`}><div className="chart-bars"><i style={{ height: `${day.tests / max * 100}%` }}/><i style={{ height: `${day.games / max * 100}%` }}/></div><small>{period === 7 ? day.short : day.label.split(" ")[0]}</small></div>)}</div></div>
        {!total && <p className="chart-empty"><Activity size={16}/>Pierwsza rozgrywka lub test pojawi się tutaj.</p>}
        <details className="chart-data"><summary>Pokaż dane wykresu</summary><table><caption>Rozpoczęte testy i sesje</caption><thead><tr><th>Dzień</th><th>Testy</th><th>Sesje</th></tr></thead><tbody>{days.map(day => <tr key={day.label}><td>{day.label}</td><td>{day.tests}</td><td>{day.games}</td></tr>)}</tbody></table></details>
      </Card>
    </section>
    <section aria-labelledby="completion-title"><div className="insight-heading"><h2 id="completion-title">Status testów</h2><Link href="/history" aria-label="Zobacz historię testów"><ArrowUpRight size={20}/></Link></div><Card className="completion-card"><div className="completion-ring" style={{ background: `conic-gradient(var(--primary) 0 ${percentage}%, var(--muted) ${percentage}% 100%)` }} role="img" aria-label={`${complete} z ${attempts.length} podejść ukończonych`}><div><strong>{attempts.length ? `${percentage}%` : "—"}</strong><span>ukończonych</span></div></div><div className="completion-legend"><span><i/>Ukończone<strong>{complete}</strong></span><span><i/>W trakcie<strong>{attempts.length - complete}</strong></span></div><p>{attempts.length ? "Podsumowanie dostępnej historii podejść." : "Wyniki pojawią się po pierwszym teście."}</p></Card></section>
  </div>;
}
