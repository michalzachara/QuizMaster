"use client";
import { useTheme } from "next-themes";
import { Volume2, Sparkles, SlidersHorizontal } from "lucide-react";
import { defaults, playSound, unlockSound, usePreferences } from "@/lib/preferences";
import { ThemeSwitch } from "./providers";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
export function PreferencesPanel() {
  const [prefs, update] = usePreferences();
  const { setTheme } = useTheme();
  return <Card className="preferences-panel"><span className="feature-icon violet"><SlidersHorizontal/></span><h2>Twój rytm, Twój styl</h2><p className="muted">Preferencje zapisują się automatycznie w tej przeglądarce.</p>
    <label className="preference-toggle"><span><Volume2 size={20}/>Efekty dźwiękowe<small>Kliknięcia, zapis, odpowiedzi i finał gry.</small></span><input type="checkbox" checked={prefs.sound} onChange={e => update({ sound: e.target.checked })}/></label>
    <label>Głośność: {prefs.volume}%<input aria-label="Głośność efektów" type="range" min={0} max={100} value={prefs.volume} onChange={e => update({ volume: Number(e.target.value) })}/></label><Button variant="outline" disabled={!prefs.sound} onClick={() => { unlockSound(); playSound("success"); }}>Odsłuchaj dźwięk</Button>
    <label className="preference-toggle"><span><Sparkles size={20}/>Animacje<small>Ruch kart, przejścia i konfetti.</small></span><input type="checkbox" checked={prefs.animations} onChange={e => update({ animations: e.target.checked })}/></label>
    <label className="preference-toggle"><span>Większy tekst</span><input type="checkbox" checked={prefs.largeText} onChange={e => update({ largeText: e.target.checked })}/></label>
    <label className="preference-toggle"><span>Kompaktowy widok<small>Mniej odstępów w panelu i listach.</small></span><input type="checkbox" checked={prefs.compact} onChange={e => update({ compact: e.target.checked })}/></label>
    <fieldset><legend>Motyw kolorystyczny</legend><ThemeSwitch/></fieldset>
    <Button variant="ghost" onClick={() => { update(defaults); setTheme("light"); }}>Przywróć domyślne ustawienia</Button>
  </Card>;
}
