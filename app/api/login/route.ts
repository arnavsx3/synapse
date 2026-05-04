import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validators/auth";
import {
  getSessionCookieName,
  shouldUseSecureCookies,
} from "@/lib/auth/session";
import { ensureDefaultWorkspaceForUser } from "@/lib/workspaces/defaults";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { email, password } = result.data;
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    await ensureDefaultWorkspaceForUser({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    const sessionToken = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

    await db.insert(sessions).values({
      sessionToken,
      userId: user.id,
      expires,
    });

    const response = NextResponse.json(
      { message: "Logged in" },
      { status: 200 },
    );

    response.cookies.set(getSessionCookieName(), sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookies(),
      path: "/",
      expires,
    });

    return response;
  } catch (error) {
    console.error("Login error: ", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
