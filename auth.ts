import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";
import { ensureDefaultWorkspaceForUser } from "@/lib/workspaces/defaults";

export const { handlers, auth } = NextAuth({
  adapter: DrizzleAdapter(db),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async signIn({ user }) {
      if (user.id) {
        await ensureDefaultWorkspaceForUser({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      }

      return true;
    },

    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
});
