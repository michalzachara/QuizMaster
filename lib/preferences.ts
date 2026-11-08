"use client";
import { useSyncExternalStore } from "react";
export const defaults = { sound: true, volume: 35, animations: true, largeText: false, compact: false };
const key = "quizmaster-preferences";
function snapshot() { try { return localStorage.getItem(key) || ""; } catch { return ""; } }
function subscribe(listener: () => void) { window.addEventListener("storage", listener); window.addEventListener("qm-preferences", listener); return () => { window.removeEventListener("storage", listener); window.removeEventListener("qm-preferences", listener); }; }
export function getPreferences(raw = typeof window === "undefined" ? "" : snapshot()) {
  try { const value = JSON.parse(raw); return { sound: typeof value.sound === "boolean" ? value.sound : true, volume: typeof value.volume === "number" ? Math.max(0, Math.min(100, value.volume)) : 35, animations: value.animations !== false, largeText: value.largeText === true, compact: value.compact === true }; } catch { return defaults; }
}
export function usePreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  return [getPreferences(raw), (change: Partial<typeof defaults>) => { try { localStorage.setItem(key, JSON.stringify({ ...getPreferences(), ...change })); window.dispatchEvent(new Event("qm-preferences")); } catch { /* Storage can be unavailable in private browser contexts. */ } }] as const;
}
let audio: AudioContext | undefined;
let unlocked = false;
export function unlockSound() { unlocked = true; }
export function playSound(kind: "click" | "success" | "error" | "finish" = "click") {
  const prefs = getPreferences();
  if (!unlocked || !prefs.sound || !prefs.volume) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume().catch(() => {});
    const notes = kind === "success" ? [523, 659, 784] : kind === "finish" ? [523, 659, 784, 1047] : kind === "error" ? [294, 220] : [740];
    notes.forEach((frequency, i) => {
      const oscillator = audio!.createOscillator(), gain = audio!.createGain();
      const start = audio!.currentTime + i * .09;
      oscillator.type = "sine"; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(prefs.volume / 100 * .12, start + .01); gain.gain.exponentialRampToValueAtTime(.001, start + .13);
      oscillator.connect(gain); gain.connect(audio!.destination); oscillator.start(start); oscillator.stop(start + .15);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  } catch { /* Audio support must never block the quiz. */ }
}
