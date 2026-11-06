import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "argon2";
import { database } from "@/lib/db";
import { credentialsSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/security";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    async authorize(input) {
      const parsed = credentialsSchema.safeParse(input);
      if (!parsed.success) return null;
      try { await rateLimit(`login:${parsed.data.email}`, 10, 300); await rateLimit("login:global", 300, 60); } catch { return null; }
      const user = await database().user.findUnique({ where: { email: parsed.data.email } });
      if (!user || !await verify(user.passwordHash, parsed.data.password).catch(() => false)) return null;
      return { id: user.id, name: user.name, email: user.email, sessionVersion: user.sessionVersion };
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user) { token.sub = user.id; token.sessionVersion = user.sessionVersion; } return token; },
    session({ session, token }) { if (session.user) { session.user.id = token.sub!; session.user.sessionVersion = Number(token.sessionVersion); } return session; },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sub) {
        await database().user.updateMany({ where: { id: message.token.sub, sessionVersion: Number(message.token.sessionVersion) }, data: { sessionVersion: { increment: 1 } } });
      }
    },
  },
});
