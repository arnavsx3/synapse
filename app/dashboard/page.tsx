import { getAppContext } from "@/lib/app-context";
import { getFirstWorkspaceByOwner } from "@/lib/db/queries/workspaces";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getAppContext();

  const workspace = await getFirstWorkspaceByOwner(session.user.id);

  if (!workspace) {
    redirect("/workspaces");
  }

  redirect(`/workspaces/${workspace.id}/dashboard`);
}
