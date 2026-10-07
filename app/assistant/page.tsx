import { getAppContext } from "@/lib/app-context";
import { getFirstWorkspaceByOwner } from "@/lib/db/queries/workspaces";
import { redirect } from "next/navigation";

export default async function AssistantPage() {
  const session = await getAppContext();

  const workspace = await getFirstWorkspaceByOwner(session.user.id);

  if (!workspace) {
    redirect("/workspaces");
  }

  redirect(`/workspaces/${workspace.id}/assistant`);
}
