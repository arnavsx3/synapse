import { Workspace } from "@/app/dashboard/workspace";

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return <Workspace key={workspaceId} workspaceId={workspaceId} />;
}
