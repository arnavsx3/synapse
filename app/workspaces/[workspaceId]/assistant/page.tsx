import { AssistantWorkspace } from "@/app/assistant/assistant-workspace";

export default async function WorkspaceAssistantPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return <AssistantWorkspace key={workspaceId} workspaceId={workspaceId} />;
}
