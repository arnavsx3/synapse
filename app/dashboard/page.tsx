import { getFirstWorkspace } from "@/lib/db/queries/workspaces";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const workspace = await getFirstWorkspace();

  if (!workspace) {
    redirect("/workspaces");
  }

  redirect(`/workspaces/${workspace.id}/dashboard`);
}
