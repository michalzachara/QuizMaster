import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Landing } from "@/components/landing";
import { currentUser } from "@/lib/current-user";

async function PublicHome() {
  if (await currentUser()) redirect("/dashboard");
  return <Landing />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="gate" aria-busy="true">
          <div className="loader" />
          <p>Otwieramy QuizMaster…</p>
        </main>
      }
    >
      <PublicHome />
    </Suspense>
  );
}
