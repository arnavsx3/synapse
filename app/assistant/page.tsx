import { getFirstWorkspace } from "@/lib/db/queries/workspaces";
import { redirect } from "next/navigation";

export default async function AssistantPage() {
  const workspace = await getFirstWorkspace();

  if (!workspace) {
    redirect("/workspaces");
  }

  redirect(`/workspaces/${workspace.id}/assistant`);
}
