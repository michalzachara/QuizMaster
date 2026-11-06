import { Suspense } from "react";
import { Workspace } from "@/components/workspace";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
async function RoutePage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if ((path[0] === "login" || path[0] === "register") && await currentUser()) redirect("/dashboard");
  return <Workspace/>;
}
export default function Page({ params }: { params: Promise<{ path: string[] }> }) { return <Suspense fallback={<p className="loading">Ładowanie…</p>}><RoutePage params={params}/></Suspense>; }
