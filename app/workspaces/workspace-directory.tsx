"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
  type Workspace,
} from "@/lib/api/workspaces";
import { useWorkspaceListRealtime } from "@/lib/realtime/use-workspace-list-realtime";

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
}

export function WorkspaceDirectory() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useWorkspaceListRealtime();

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null,
  );
  const [editingWorkspaceName, setEditingWorkspaceName] = useState("");
  const [error, setError] = useState("");

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,
    onMutate: () => {
      setError("");
    },
    onSuccess: async (workspace) => {
      setNewWorkspaceName("");
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.push(`/workspaces/${workspace.id}/dashboard`);
    },
    onError: (mutationError) => {
      setError(getErrorMessage(mutationError, "Unable to create workspace."));
    },
  });

  const renameWorkspaceMutation = useMutation({
    mutationFn: ({
      workspaceId,
      name,
    }: {
      workspaceId: string;
      name: string;
    }) => updateWorkspace(workspaceId, { name }),
    onMutate: () => {
      setError("");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setEditingWorkspaceId(null);
      setEditingWorkspaceName("");
    },
    onError: (mutationError) => {
      setError(getErrorMessage(mutationError, "Unable to rename workspace."));
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: deleteWorkspace,
    onMutate: () => {
      setError("");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setEditingWorkspaceId(null);
      setEditingWorkspaceName("");
    },
    onError: (mutationError) => {
      setError(getErrorMessage(mutationError, "Unable to delete workspace."));
    },
  });

  const isSaving =
    createWorkspaceMutation.isPending ||
    renameWorkspaceMutation.isPending ||
    deleteWorkspaceMutation.isPending;

  const handleCreateWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = newWorkspaceName.trim();

    if (!name) {
      setError("Workspace name cannot be empty.");
      return;
    }

    await createWorkspaceMutation.mutateAsync({ name });
  };

  const handleRenameWorkspace = async (workspaceId: string) => {
    const name = editingWorkspaceName.trim();

    if (!name) {
      setError("Workspace name cannot be empty.");
      return;
    }

    await renameWorkspaceMutation.mutateAsync({
      workspaceId,
      name,
    });
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    const confirmed = window.confirm(
      "Delete this workspace and everything inside it? Notes, projects, chats, and embeddings in this workspace will be removed.",
    );

    if (!confirmed) {
      return;
    }

    await deleteWorkspaceMutation.mutateAsync(workspaceId);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Workspace Directory
          </h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Each workspace gets its own projects, notes, chats, and AI context.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <form onSubmit={handleCreateWorkspace} className="flex gap-3">
          <input
            value={newWorkspaceName}
            onChange={(event) => setNewWorkspaceName(event.target.value)}
            placeholder="New workspace name"
            className="flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none transition placeholder:text-[#64748B] focus:border-(--primary)"
          />

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-(--primary) px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
            Create
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-[#94A3B8]">
            Loading workspaces...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-[#94A3B8]">
            No workspaces yet. Create your first one above.
          </div>
        ) : (
          workspaces.map((workspace) => {
            const isEditing = editingWorkspaceId === workspace.id;

            if (isEditing) {
              return (
                <div
                  key={workspace.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <input
                    value={editingWorkspaceName}
                    onChange={(event) =>
                      setEditingWorkspaceName(event.target.value)
                    }
                    className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none transition focus:border-(--primary)"
                  />

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRenameWorkspace(workspace.id)}
                      disabled={isSaving}
                      className="flex-1 rounded-md bg-(--primary) px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingWorkspaceId(null);
                        setEditingWorkspaceName("");
                      }}
                      disabled={isSaving}
                      className="flex-1 rounded-md border border-white/10 px-3 py-2 text-sm text-[#94A3B8] transition hover:bg-white/10 hover:text-white disabled:opacity-60">
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={workspace.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {workspace.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Created workspace
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingWorkspaceId(workspace.id);
                      setEditingWorkspaceName(workspace.name);
                    }}
                    disabled={isSaving}
                    className="rounded-md border border-white/10 px-3 py-2 text-xs text-[#94A3B8] transition hover:bg-white/10 hover:text-white disabled:opacity-60">
                    Rename
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/workspaces/${workspace.id}/dashboard`)
                    }
                    className="rounded-md bg-(--primary) px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                    Open Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/workspaces/${workspace.id}/assistant`)
                    }
                    className="rounded-md border border-white/10 px-3 py-2 text-sm text-[#CBD5E1] transition hover:bg-white/10 hover:text-white">
                    Open Assistant
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteWorkspace(workspace.id)}
                    disabled={isSaving || workspaces.length <= 1}
                    className="rounded-md border border-red-400/30 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/10 disabled:opacity-40">
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
