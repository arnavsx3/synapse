import { ensureDefaultWorkspace } from "@/lib/workspaces/defaults";

export async function getAppContext() {
  const workspace = await ensureDefaultWorkspace();
  return { workspace, user: { id: workspace.id } };
}
