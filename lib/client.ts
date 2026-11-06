"use client";
import { useCallback, useEffect, useState } from "react";
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/v1/${path}`, { method, headers: body !== undefined ? { "Content-Type": "application/json" } : {}, body: body !== undefined ? JSON.stringify(body) : undefined, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Nie udało się wykonać operacji.");
  return data as T;
}
export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null); const [error, setError] = useState(""); const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => { let active = true; api<T>(path).then(d => { if (active) { setData(d); setError(""); } }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [path, version]);
  return { data, error, reload };
}
export type Me = { id: string; name: string; email: string; role: "TEACHER" | "STUDENT" };
