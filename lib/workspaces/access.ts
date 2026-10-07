import { getWorkspace } from "@/lib/db/queries/workspaces";
import { workspaceParamsSchema } from "@/lib/validators/workspaces";

export async function getAuthorizedWorkspace(
  paramsPromise: Promise<{ workspaceId: string }>,
  _scopeId?: string,
) {
  const params = await paramsPromise;
  const parsed = workspaceParamsSchema.safeParse(params);

  if (!parsed.success) {
    return {
      workspace: null,
      error: "invalid" as const,
    };
  }

  const workspace = await getWorkspace(parsed.data.workspaceId);

  if (!workspace) {
    return {
      workspace: null,
      error: "not_found" as const,
    };
  }

  return {
    workspace,
  };
}
