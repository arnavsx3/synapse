import z from "zod";

export const workspaceParamsSchema = z.object({
  workspaceId: z.uuid(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
});
