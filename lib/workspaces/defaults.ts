import {
  createWorkspace,
  getFirstWorkspace,
} from "@/lib/db/queries/workspaces";

export async function ensureDefaultWorkspace() {
  const existing = await getFirstWorkspace();

  if (existing) {
    return existing;
  }

  return createWorkspace({ name: "My Workspace" });
}
