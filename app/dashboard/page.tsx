import { auth } from "@/auth";
import { getFirstWorkspaceByOwner } from "@/lib/db/queries/workspaces";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspace = await getFirstWorkspaceByOwner(session.user.id);

  if (!workspace) {
    redirect("/workspaces");
  }

  redirect(`/workspaces/${workspace.id}/dashboard`);
}
