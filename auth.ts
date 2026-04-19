import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validators/auth";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { sessions } from "@/lib/db/schema";

export const { handlers, auth } = NextAuth({
  adapter: DrizzleAdapter(db),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const result = loginSchema.safeParse(credentials);
        if (!result.success) return null;

        const { email, password } = result.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        const sessionToken = randomUUID();
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await db.insert(sessions).values({
          sessionToken,
          userId: user.id,
          expires,
        });

        const cookieStore = await cookies();
        cookieStore.set("authjs.session-token", sessionToken, {
          expires,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });

        return user;
      },
    }),
  ],

  session: { strategy: "database" },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
