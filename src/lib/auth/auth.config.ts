import type { NextAuthConfig } from "next-auth";

/** Edge-safe Auth.js settings for middleware. */
export const authConfig = {
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "kollimalai-arasan@2026",
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.phone = (user as { phone?: string | null }).phone ?? null;
        token.status = (user as { status?: string }).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as any;
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as string;
        sessionUser.phone = (token.phone as string | null) ?? null;
        sessionUser.status = token.status as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
