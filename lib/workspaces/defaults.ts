import {
  createWorkspace,
  getFirstWorkspaceByOwner,
} from "@/lib/db/queries/workspaces";

type WorkspaceBootstrapUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

function buildDefaultWorkspaceName(user: WorkspaceBootstrapUser) {
  const trimmedName = user.name?.trim();

  if (trimmedName) {
    return `${trimmedName}'s Workspace`;
  }

  const emailPrefix = user.email?.split("@")[0]?.trim();

  if (emailPrefix) {
    return `${emailPrefix}'s Workspace`;
  }

  return "My Workspace";
}

export async function ensureDefaultWorkspaceForUser(
  user: WorkspaceBootstrapUser,
) {
  const existing = await getFirstWorkspaceByOwner(user.id);

  if (existing) {
    return existing;
  }

  return createWorkspace({
    name: buildDefaultWorkspaceName(user),
    ownerUserId: user.id,
  });
}
