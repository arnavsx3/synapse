import { create } from "zustand";

export type Scope = "all" | "inbox" | `project:${string}`;

type WorkspaceStore = {
  scope: Scope;
  selectedNoteId: string | null;
  editingProjectId: string | null;
  editingProjectName: string;

  setScope: (scope: Scope) => void;
  setSelectedNoteId: (id: string | null) => void;
  setEditingProjectId: (id: string | null) => void;
  setEditingProjectName: (name: string) => void;
  resetProjectEditing: () => void;
  resetWorkspaceState: () => void;
};

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  scope: "all",
  selectedNoteId: null,
  editingProjectId: null,
  editingProjectName: "",

  setScope: (scope) => set({ scope }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setEditingProjectId: (id) => set({ editingProjectId: id }),
  setEditingProjectName: (name) => set({ editingProjectName: name }),
  resetProjectEditing: () =>
    set({
      editingProjectId: null,
      editingProjectName: "",
    }),
  resetWorkspaceState: () =>
    set({
      scope: "all",
      selectedNoteId: null,
      editingProjectId: null,
      editingProjectName: "",
    }),
}));
