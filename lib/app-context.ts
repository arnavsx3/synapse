import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { ensureDefaultWorkspaceForUser } from "@/lib/workspaces/defaults";

const LOCAL_USER_EMAIL = "local@synapse.test";

export async function getAppContext() {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, LOCAL_USER_EMAIL))
    .limit(1);

  const user = existingUser ?? (await db
    .insert(users)
    .values({ email: LOCAL_USER_EMAIL, name: "Local User" })
    .returning())[0];

  await ensureDefaultWorkspaceForUser(user);
  return { user };
}
