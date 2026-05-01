import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/client";
import { sessions, users } from "../db/schema";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
};

export function shouldUseSecureCookies() {
  return process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
}

export function getSessionCookieName() {
  return `${shouldUseSecureCookies() ? "__Secure-" : ""}authjs.session-token`;
}

function parseCookies(cookieHeader?: string | null) {
  const parsed: Record<string, string> = {};

  if (!cookieHeader) {
    return parsed;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (!rawName) {
      continue;
    }

    parsed[rawName] = decodeURIComponent(rawValue.join("="));
  }
  return parsed;
}

export async function getUserFromSessionToken(sessionToken?: string | null) {
  if (!sessionToken) {
    return null;
  }

  const [session] = await db
    .select({
      userId: sessions.userId,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.sessionToken, sessionToken),
        gt(sessions.expires, new Date()),
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user ?? null;
}

export async function getUserFromCookieHeader(cookieHeader?: string | null) {
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies[getSessionCookieName()] ?? null;

  return getUserFromSessionToken(sessionToken);
}