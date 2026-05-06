import { api } from "./client";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  workspaceId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type CreateProjectInput = {
  name: string;
  description?: string;
};

type UpdateProjectInput = {
  id: string;
  name?: string;
  description?: string;
};

export const getProjects = async (workspaceId: string) => {
  const response = await api.get<{ projects: Project[] }>(
    `/workspaces/${workspaceId}/projects`,
  );

  return response.data.projects;
};

export const createProject = async (
  workspaceId: string,
  data: CreateProjectInput,
) => {
  const response = await api.post<{ project: Project }>(
    `/workspaces/${workspaceId}/projects`,
    data,
  );

  return response.data.project;
};

export const updateProject = async (
  workspaceId: string,
  data: UpdateProjectInput,
) => {
  const response = await api.patch<{ project: Project }>(
    `/workspaces/${workspaceId}/projects`,
    data,
  );

  return response.data.project;
};

export const deleteProject = async (workspaceId: string, id: string) => {
  const response = await api.delete<{ project: Project }>(
    `/workspaces/${workspaceId}/projects`,
    {
      data: { id },
    },
  );

  return response.data.project;
};
