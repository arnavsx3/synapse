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

type Scope = "all" | "inbox" | `project:${string}`;

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
  const [scope, setScope] = useState<Scope>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");

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
    const loadProjects = async () => {
      try {
        const projectList = await getProjects();
        setProjects(projectList);
      } catch {
        setError("Unable to load projects.");
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      setError("");

      try {
        const noteList = await getNotes(getNotesFilterFromScope(scope));
        setNotes(noteList);
        setSelectedNoteId(noteList[0]?.id ?? null);
      } catch {
        setError("Unable to load notes.");
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [scope]);

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

    setSaving(true);
    setError("");

    try {
      const project = await createProject({ name });
      setProjects((currentProjects) => [...currentProjects, project]);
      setProjectName("");
      setScope(`project:${project.id}`);
    } catch {
      setError("Unable to create project.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNote = async () => {
    setSaving(true);
    setError("");

    try {
      const note = await createNote({
        title: "Untitled note",
        content: "Start writing...",
        projectId: selectedProjectId,
      });

      setNotes((currentNotes) => [note, ...currentNotes]);
      setSelectedNoteId(note.id);
    } catch {
      setError("Unable to create note.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) {
      return;
    }

    const title = noteTitle.trim();
    const content = noteContent.trim();

    if (!title || !content) {
      setError("A note needs both a title and content.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const note = await updateNote({
        id: selectedNote.id,
        title,
        content,
      });

      setNotes((currentNotes) =>
        currentNotes.map((currentNote) =>
          currentNote.id === note.id ? note : currentNote,
        ),
      );
    } catch {
      setError("Unable to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await deleteNote(selectedNote.id);
      const remainingNotes = notes.filter(
        (note) => note.id !== selectedNote.id,
      );
      setNotes(remainingNotes);
      setSelectedNoteId(remainingNotes[0]?.id ?? null);
    } catch {
      setError("Unable to delete note.");
    } finally {
      setSaving(false);
    }
  };

  const handleRenameProject = async (projectId: string) => {
    const name = editingProjectName.trim();

    if (!name) {
      setError("Project name cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const project = await updateProject({ id: projectId, name });

      setProjects((currentProjects) =>
        currentProjects.map((currentProject) =>
          currentProject.id === project.id ? project : currentProject,
        ),
      );

      setEditingProjectId(null);
      setEditingProjectName("");
    } catch {
      setError("Unable to rename project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setSaving(true);
    setError("");

    try {
      await deleteProject(projectId);

      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectId),
      );

      if (scope === `project:${projectId}`) {
        setScope("inbox");
      }
    } catch {
      setError("Unable to delete project.");
    } finally {
      setSaving(false);
    }
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
                          setEditingProjectId(null);
                          setEditingProjectName("");
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
