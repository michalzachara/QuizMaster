import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuizMaster",
  description: "Twórz quizy i ucz się razem.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
