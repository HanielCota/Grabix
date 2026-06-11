import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDb } from "@/server/db";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";
import { claimPendingEntitlements } from "@/server/entitlements";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [Google],
  pages: { signIn: "/sign-in" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      const id = token.id as string | undefined;
      if (id && session.user) {
        session.user.id = id;
      }
      return session;
    },
    async signIn({ user }) {
      // Grant any Pro entitlement that arrived (via billing webhook) before
      // this email had an account. Never block login if the claim fails.
      try {
        if (user?.id && user.email) {
          await claimPendingEntitlements(user.email, user.id);
        }
      } catch (err) {
        // biome-ignore lint/suspicious/noConsole: operator-facing webhook reconciliation warning
        console.warn("[Grabix] claimPendingEntitlements falhou no sign-in:", err);
      }
      return true;
    },
  },
});
