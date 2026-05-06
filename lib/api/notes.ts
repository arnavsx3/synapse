import { api } from "./client";

export type Note = {
  id: string;
  title: string;
  content: string | null;
  userId: string;
  workspaceId: string;
  projectId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type CreateNoteInput = {
  title: string;
  content: string;
  projectId?: string | null;
};

type UpdateNoteInput = {
  id: string;
  title?: string;
  content?: string;
  projectId?: string | null;
};

export const getNotes = async (
  workspaceId: string,
  projectId?: string | null,
) => {
  const response = await api.get<{ notes: Note[] }>(
    `/workspaces/${workspaceId}/notes`,
    {
      params: projectId ? { projectId } : undefined,
    },
  );

  return response.data.notes;
};

export const createNote = async (
  workspaceId: string,
  data: CreateNoteInput,
) => {
  const response = await api.post<{ note: Note }>(
    `/workspaces/${workspaceId}/notes`,
    data,
  );

  return response.data.note;
};

export const updateNote = async (
  workspaceId: string,
  data: UpdateNoteInput,
) => {
  const response = await api.patch<{ note: Note }>(
    `/workspaces/${workspaceId}/notes`,
    data,
  );

  return response.data.note;
};

export const deleteNote = async (workspaceId: string, id: string) => {
  const response = await api.delete<{ note: Note }>(
    `/workspaces/${workspaceId}/notes`,
    {
      data: { id },
    },
  );

  return response.data.note;
};
