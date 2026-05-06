import { create } from "zustand";

type AssistantStore = {
  selectedChatId: string | null;
  draft: string;
  error: string;

  setSelectedChatId: (chatId: string | null) => void;
  setDraft: (draft: string) => void;
  clearDraft: () => void;
  setError: (error: string) => void;
  clearError: () => void;
  resetAssistantState: () => void;
};

export const useAssistantStore = create<AssistantStore>((set) => ({
  selectedChatId: null,
  draft: "",
  error: "",

  setSelectedChatId: (chatId) => set({ selectedChatId: chatId }),
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: "" }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: "" }),
  resetAssistantState: () =>
    set({
      selectedChatId: null,
      draft: "",
      error: "",
    }),
}));
