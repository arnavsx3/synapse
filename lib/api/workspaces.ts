import { api } from "./client";

export type Workspace = {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type CreateWorkspaceInput = {
  name: string;
};

type UpdateWorkspaceInput = {
  name: string;
};

export const getWorkspaces = async () => {
  const response = await api.get<{ workspaces: Workspace[] }>("/workspaces");
  return response.data.workspaces;
};

export const getWorkspace = async (workspaceId: string) => {
  const response = await api.get<{ workspace: Workspace }>(
    `/workspaces/${workspaceId}`,
  );

  return response.data.workspace;
};

export const createWorkspace = async (data: CreateWorkspaceInput) => {
  const response = await api.post<{ workspace: Workspace }>(
    "/workspaces",
    data,
  );
  return response.data.workspace;
};

export const updateWorkspace = async (
  workspaceId: string,
  data: UpdateWorkspaceInput,
) => {
  const response = await api.patch<{ workspace: Workspace }>(
    `/workspaces/${workspaceId}`,
    data,
  );

  return response.data.workspace;
};

export const deleteWorkspace = async (workspaceId: string) => {
  const response = await api.delete<{ workspace: Workspace }>(
    `/workspaces/${workspaceId}`,
  );

  return response.data.workspace;
};
