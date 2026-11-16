"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema } from "@/lib/validation";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeSwitch } from "./providers";
import { ArrowRight, Zap, ShieldCheck, GraduationCap, Presentation } from "lucide-react";

export function AuthScreen({ register: registration }: { register: boolean }) {
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: registration ? "" : "Użytkownik",
      email: "",
      password: "",
      role: "STUDENT",
    },
  });
  async function submit(values: z.infer<typeof registrationSchema>) {
    setError("");
    try {
      if (registration) await api("register", "POST", values);
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error)
        throw new Error("Nieprawidłowy e-mail lub hasło. Po wielu próbach odczekaj 5 minut.");
      const target = new URLSearchParams(window.location.search).get("next");
      const destination = new URL(target || "/dashboard", window.location.origin);
      window.location.assign(
        destination.origin === window.location.origin
          ? destination.pathname + destination.search
          : "/dashboard",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd.");
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Zap size={24} />
          </span>
          QuizMaster<span className="brand-dot">.</span>
        </Link>
        <div>
          <span className="eyebrow">WIEDZA ZACZYNA SIĘ OD CIEKAWOŚCI</span>
          <h1>
            Małe pytania.
            <br />
            Wielkie odkrycia.
          </h1>
          <p>
            Twórz, graj i sprawdzaj swoje postępy.
            <br />
            Dobra lekcja zostaje z Tobą na dłużej.
          </p>
          <div className="auth-art">
            <span>?</span>
            <span>✦</span>
            <span>✓</span>
          </div>
        </div>
        <small>
          <ShieldCheck size={16} /> Twoje wyniki. Twoja przestrzeń do nauki.
        </small>
      </section>
      <section className="auth-form">
        <div className="auth-top">
          <Link href="/">← Strona główna</Link>
          <ThemeSwitch />
        </div>
        <div className="auth-form-inner">
          <span className="eyebrow">ZACZYNAMY?</span>
          <h2>{registration ? "Twoja nowa przygoda" : "Dobrze Cię widzieć"}</h2>
          <p className="muted">
            {registration
              ? "Wybierz, jak chcesz korzystać z QuizMaster, i załóż konto."
              : "Zaloguj się i wróć do swojej nauki."}
          </p>
          <form onSubmit={form.handleSubmit(submit)} className="stack">
            {registration && (
              <fieldset className="role-picker">
                <legend>Kim jesteś?</legend>
                <div className="role-options">
                  <label className="role-choice">
                    <input type="radio" value="STUDENT" {...form.register("role")} />
                    <GraduationCap size={25} />
                    <strong>Uczeń</strong>
                    <span>Rozwiązuj quizy i odkrywaj</span>
                  </label>
                  <label className="role-choice">
                    <input type="radio" value="TEACHER" {...form.register("role")} />
                    <Presentation size={25} />
                    <strong>Nauczyciel</strong>
                    <span>Twórz quizy i prowadź lekcje</span>
                  </label>
                </div>
              </fieldset>
            )}
            {registration && (
              <label>
                Jak się nazywasz?
                <Input autoComplete="name" {...form.register("name")} />
              </label>
            )}
            <label>
              E-mail
              <Input type="email" autoComplete="email" {...form.register("email")} />
            </label>
            <label>
              Hasło
              <Input
                type="password"
                autoComplete={registration ? "new-password" : "current-password"}
                {...form.register("password")}
              />
              <small>Co najmniej 10 znaków.</small>
            </label>
            {Object.values(form.formState.errors).map((e, i) => (
              <p className="error" key={i}>
                {e.message}
              </p>
            ))}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting} className="primary-button">
              {form.formState.isSubmitting
                ? "Chwileczkę…"
                : registration
                  ? "Utwórz konto"
                  : "Zaloguj się"}
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="auth-footer">
            {registration ? "Masz już konto?" : "Pierwszy raz tutaj?"}{" "}
            <Link href={registration ? "/login" : "/register"}>
              {registration ? "Zaloguj się" : "Załóż konto"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
