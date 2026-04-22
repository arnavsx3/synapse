"use client";

import { useEffect, useState } from "react";
import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  type Project,
} from "@/lib/api/projects";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
  type Note,
} from "@/lib/api/notes";

import { useWorkspaceStore } from "@/lib/store/workspace-store";
import type { Scope } from "@/lib/store/workspace-store";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const getProjectIdFromScope = (scope: Scope) => {
  if (!scope.startsWith("project:")) {
    return null;
  }

  return scope.replace("project:", "");
};

const getNotesFilterFromScope = (scope: Scope) => {
  if (scope === "all") {
    return null;
  }

  if (scope === "inbox") {
    return "inbox";
  }

  return getProjectIdFromScope(scope);
};

export function Workspace() {
  const {
    scope,
    selectedNoteId,
    editingProjectId,
    editingProjectName,
    setScope,
    setSelectedNoteId,
    setEditingProjectId,
    setEditingProjectName,
    resetProjectEditing,
  } = useWorkspaceStore();

  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onMutate: () => {
      setError("");
      setSaving(true);
    },
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectName("");
      setScope(`project:${project.id}`);
    },
    onError: () => {
      setError("Unable to create project.");
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const renameProjectMutation = useMutation({
    mutationFn: updateProject,
    onMutate: () => {
      setError("");
      setSaving(true);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      resetProjectEditing();
    },
    onError: () => {
      setError("Unable to rename project.");
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onMutate: () => {
      setError("");
      setSaving(true);
    },
    onSuccess: async (_data, projectId) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["notes"] });

      if (scope === `project:${projectId}`) {
        setScope("inbox");
      }
    },
    onError: () => {
      setError("Unable to delete project.");
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: createNote,
    onMutate: () => {
      setError("");
      setSaving(true);
    },
    onSuccess: async (note) => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(note.id);
    },
    onError: () => {
      setError("Unable to create note.");
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const saveNoteMutation = useMutation({
    mutationFn: updateNote,
    onMutate: () => {
      setError("");
      setSaving(true);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => {
      setError("Unable to save note.");
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const moveNoteMutation = useMutation({
    mutationFn: updateNote,
    onMutate: () => {
      setError("");
      setSaving(true);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });

      if (scope !== "all") {
        setSelectedNoteId(null);
      }
    },
    onError: () => {
      setError("Unable to move note.");
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onMutate: () => {
      setError("");
      setSaving(true);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(null);
    },
    onError: () => {
      setError("Unable to delete note.");
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const notesFilter = getNotesFilterFromScope(scope);
  const { data: notes = [], isLoading: loading } = useQuery<Note[]>({
    queryKey: ["notes", notesFilter],
    queryFn: () => getNotes(notesFilter),
  });

  const [projectName, setProjectName] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedNote =
    notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null;

  const selectedProjectId = getProjectIdFromScope(scope);
  const selectedProject = selectedProjectId
    ? projects.find((project) => project.id === selectedProjectId)
    : null;

  const scopeTitle =
    scope === "all"
      ? "All Notes"
      : scope === "inbox"
        ? "Inbox"
        : (selectedProject?.name ?? "Project");

  useEffect(() => {
    setNoteTitle(selectedNote?.title ?? "");
    setNoteContent(selectedNote?.content ?? "");
  }, [selectedNote]);

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = projectName.trim();
    if (!name) {
      return;
    }
    createProjectMutation.mutate({ name });
  };

  const handleRenameProject = async (projectId: string) => {
    const name = editingProjectName.trim();

    if (!name) {
      setError("Project name cannot be empty.");
      return;
    }
    renameProjectMutation.mutate({ id: projectId, name });
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm(
      "Delete this project? Its notes will move to Inbox.",
    );

    if (!confirmed) {
      return;
    }

    deleteProjectMutation.mutate(projectId);
  };

  const handleCreateNote = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    createNoteMutation.mutate({
      title: "Untitled note",
      content: "Start writing...",
      projectId: selectedProjectId,
    });
  };

  const handleSaveNote = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!selectedNote) {
      return;
    }

    const title = noteTitle.trim();
    const content = noteContent.trim();

    if (!title || !content) {
      setError("A note needs both a title and content.");
      return;
    }

    saveNoteMutation.mutate({
      id: selectedNote.id,
      title,
      content,
    });
  };

  const handleMoveNote = async (projectId: string | null) => {
    if (!selectedNote) {
      return;
    }

    moveNoteMutation.mutate({
      id: selectedNote.id,
      projectId,
    });
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this note? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    deleteNoteMutation.mutate(selectedNote.id);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(260px,360px)_1fr]">
      <aside className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
              scope === "all"
                ? "bg-(--primary) text-white"
                : "text-[#94A3B8] hover:bg-white/10 hover:text-white"
            }`}>
            All Notes
          </button>
          <button
            type="button"
            onClick={() => setScope("inbox")}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
              scope === "inbox"
                ? "bg-(--primary) text-white"
                : "text-[#94A3B8] hover:bg-white/10 hover:text-white"
            }`}>
            Inbox
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase text-[#94A3B8]">
              Projects
            </h2>
            <span className="text-xs text-[#94A3B8]">{projects.length}</span>
          </div>

          <div className="space-y-1">
            {projects.map((project) => {
              const projectScope: Scope = `project:${project.id}`;
              const isEditing = editingProjectId === project.id;

              if (isEditing) {
                return (
                  <div
                    key={project.id}
                    className="rounded-md border border-white/10 bg-black/30 p-2">
                    <input
                      value={editingProjectName}
                      onChange={(event) =>
                        setEditingProjectName(event.target.value)
                      }
                      className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-2 text-sm outline-none transition focus:border-(--primary)"
                    />

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRenameProject(project.id)}
                        disabled={saving}
                        className="flex-1 rounded-md bg-(--primary) px-2 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          resetProjectEditing();
                        }}
                        disabled={saving}
                        className="flex-1 rounded-md border border-white/10 px-2 py-1.5 text-xs font-medium text-[#94A3B8] transition hover:bg-white/10 hover:text-white disabled:opacity-60">
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={project.id}
                  className={`group flex items-center gap-1 rounded-md transition ${
                    scope === projectScope
                      ? "bg-(--primary) text-white"
                      : "text-[#94A3B8] hover:bg-white/10 hover:text-white"
                  }`}>
                  <button
                    type="button"
                    onClick={() => setScope(projectScope)}
                    className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm">
                    {project.name}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingProjectId(project.id);
                      setEditingProjectName(project.name);
                    }}
                    className="px-2 py-2 text-xs opacity-70 transition hover:opacity-100"
                    aria-label={`Rename ${project.name}`}>
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProject(project.id)}
                    disabled={saving}
                    className="px-2 py-2 text-xs text-red-200 opacity-70 transition hover:opacity-100 disabled:opacity-40"
                    aria-label={`Delete ${project.name}`}>
                    Del
                  </button>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateProject} className="mt-4 space-y-2">
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="New project"
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition placeholder:text-[#64748B] focus:border-(--primary)"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-slate-200 disabled:opacity-60">
              Add Project
            </button>
          </form>
        </div>
      </aside>

      <section className="rounded-lg border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {scopeTitle}
            </h2>
            <p className="text-xs text-[#94A3B8]">{notes.length} notes</p>
          </div>

          <button
            type="button"
            onClick={handleCreateNote}
            disabled={saving}
            className="rounded-md bg-(--primary) px-3 py-2 text-sm font-medium transition hover:bg-indigo-500 disabled:opacity-60">
            New Note
          </button>
        </div>

        <div className="max-h-[64vh] space-y-2 overflow-y-auto p-3">
          {loading ? (
            <p className="p-3 text-sm text-[#94A3B8]">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="p-3 text-sm text-[#94A3B8]">
              No notes here yet. Create one to start this space.
            </p>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedNote?.id === note.id
                    ? "border-(--primary) bg-indigo-500/10"
                    : "border-white/10 bg-black/20 hover:bg-white/10"
                }`}>
                <h3 className="truncate text-sm font-medium">{note.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-[#94A3B8]">
                  {note.content || "Empty note"}
                </p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/5 p-4">
        {error && (
          <p className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        {selectedNote ? (
          <div className="flex min-h-[60vh] flex-col gap-4">
            <input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-3 text-xl font-semibold outline-none transition focus:border-(--primary)"
            />

            <textarea
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              className="min-h-[44vh] w-full flex-1 resize-none rounded-md border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 outline-none transition focus:border-(--primary)"
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#94A3B8]">Move to</span>

              <button
                type="button"
                onClick={() => handleMoveNote(null)}
                disabled={saving}
                className="rounded-md border border-white/10 px-3 py-2 text-xs text-[#94A3B8] transition hover:bg-white/10 hover:text-white disabled:opacity-60">
                Inbox
              </button>

              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleMoveNote(project.id)}
                  disabled={saving}
                  className="rounded-md border border-white/10 px-3 py-2 text-xs text-[#94A3B8] transition hover:bg-white/10 hover:text-white disabled:opacity-60">
                  {project.name}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDeleteNote}
                disabled={saving}
                className="rounded-md border border-red-400/30 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/10 disabled:opacity-60">
                Delete
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={saving}
                className="rounded-md bg-(--primary) px-4 py-2 text-sm font-medium transition hover:bg-indigo-500 disabled:opacity-60">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center text-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Select a note
              </h2>
              <p className="mt-2 max-w-sm text-sm text-[#94A3B8]">
                Choose a note from the list or create a new one in this space.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
