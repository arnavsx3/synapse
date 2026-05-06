"use client";

import { useEffect, useState } from "react";
import { useAssistantRealtime } from "@/lib/realtime/use-assistant-realtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChat,
  deleteChat,
  getChatMessages,
  getChats,
  sendChatMessage,
  type Chat,
  type ChatMessage,
  updateChat,
} from "@/lib/api/chats";
import { useAssistantStore } from "@/lib/store/assistant-store";

export function AssistantWorkspace({ workspaceId }: { workspaceId: string }) {
  const {
    selectedChatId,
    draft,
    error,
    setSelectedChatId,
    setDraft,
    clearDraft,
    setError,
    clearError,
    resetAssistantState,
  } = useAssistantStore();

  useEffect(() => {
    resetAssistantState();
  }, [resetAssistantState, workspaceId]);

  const queryClient = useQueryClient();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState("");

  const { data: chats = [], isLoading: chatsLoading } = useQuery<Chat[]>({
    queryKey: ["chats", workspaceId],
    queryFn: () => getChats(workspaceId),
  });

  const activeChatId = selectedChatId ?? chats[0]?.id ?? null;

  useAssistantRealtime({
    workspaceId,
    activeChatId,
    selectedChatId,
    setSelectedChatId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<
    ChatMessage[]
  >({
    queryKey: ["chat-messages", workspaceId, activeChatId],
    queryFn: () => getChatMessages(workspaceId, activeChatId!),
    enabled: Boolean(activeChatId),
    refetchOnWindowFocus: false,
  });

  const createChatMutation = useMutation({
    mutationFn: (data: { title?: string }) => createChat(workspaceId, data),
    onMutate: () => {
      clearError();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });
    },
    onError: () => {
      setError("Unable to create a new chat.");
    },
  });

  const renameChatMutation = useMutation({
    mutationFn: (data: { id: string; title: string }) =>
      updateChat(workspaceId, data),
    onMutate: () => {
      clearError();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });
      setEditingChatId(null);
      setEditingChatTitle("");
    },
    onError: () => {
      setError("Unable to rename chat.");
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: (chatId: string) => deleteChat(workspaceId, chatId),
    onMutate: () => {
      clearError();
    },
    onSuccess: async (_data, deletedChatId) => {
      if (selectedChatId === deletedChatId) {
        setSelectedChatId(null);
      }

      await queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });
      await queryClient.removeQueries({
        queryKey: ["chat-messages", workspaceId, deletedChatId],
      });
    },
    onError: () => {
      setError("Unable to delete chat.");
    },
  });

  const sendChatMessageMutation = useMutation({
    mutationFn: ({ chatId, message }: { chatId: string; message: string }) =>
      sendChatMessage(workspaceId, chatId, { message }),
    onMutate: () => {
      clearError();
    },
    onSuccess: async (_data, variables) => {
      clearDraft();
      await queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });
      await queryClient.invalidateQueries({
        queryKey: ["chat-messages", workspaceId, variables.chatId],
      });
    },
    onError: async (_error, variables) => {
      setError("Your message was saved, but the assistant reply failed.");

      await queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });
      await queryClient.invalidateQueries({
        queryKey: ["chat-messages", workspaceId, variables.chatId],
      });
    },
  });

  const handleNewChat = async () => {
    const chat = await createChatMutation.mutateAsync({});
    setSelectedChatId(chat.id);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const message = draft.trim();

    if (!message || sendChatMessageMutation.isPending) {
      return;
    }

    let chatId = activeChatId;

    if (!chatId) {
      const chat = await createChatMutation.mutateAsync({});
      chatId = chat.id;
      setSelectedChatId(chat.id);
    }

    await sendChatMessageMutation.mutateAsync({
      chatId,
      message,
    });
  };

  const handleRenameChat = async (chatId: string) => {
    const title = editingChatTitle.trim();

    if (!title) {
      setError("Chat title cannot be empty.");
      return;
    }

    await renameChatMutation.mutateAsync({
      id: chatId,
      title,
    });
  };

  const handleDeleteChat = async (chatId: string) => {
    const confirmed = window.confirm(
      "Delete this chat? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    await deleteChatMutation.mutateAsync(chatId);
  };

  const isSaving =
    createChatMutation.isPending ||
    renameChatMutation.isPending ||
    deleteChatMutation.isPending;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">
            Chats
          </h2>

          <button
            type="button"
            onClick={handleNewChat}
            disabled={createChatMutation.isPending}
            className="rounded-md bg-(--primary) px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
            New Chat
          </button>
        </div>

        <div className="space-y-2">
          {chatsLoading ? (
            <p className="text-sm text-[#94A3B8]">Loading chats...</p>
          ) : chats.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">
              No chats yet. Start your first one.
            </p>
          ) : (
            chats.map((chat) => {
              const isEditing = editingChatId === chat.id;

              if (isEditing) {
                return (
                  <div
                    key={chat.id}
                    className="rounded-md border border-white/10 bg-black/30 p-2">
                    <input
                      value={editingChatTitle}
                      onChange={(event) =>
                        setEditingChatTitle(event.target.value)
                      }
                      className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-2 text-sm outline-none transition focus:border-(--primary)"
                    />

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRenameChat(chat.id)}
                        disabled={isSaving}
                        className="flex-1 rounded-md bg-(--primary) px-2 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingChatId(null);
                          setEditingChatTitle("");
                        }}
                        disabled={isSaving}
                        className="flex-1 rounded-md border border-white/10 px-2 py-1.5 text-xs font-medium text-[#94A3B8] transition hover:bg-white/10 hover:text-white disabled:opacity-60">
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-1 rounded-md transition ${
                    activeChatId === chat.id
                      ? "bg-indigo-500/10 text-white"
                      : "text-[#CBD5E1] hover:bg-white/10 hover:text-white"
                  }`}>
                  <button
                    type="button"
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`min-w-0 flex-1 rounded-md border px-3 py-3 text-left text-sm transition ${
                      activeChatId === chat.id
                        ? "border-(--primary)"
                        : "border-white/10 bg-black/20"
                    }`}>
                    <p className="truncate font-medium">{chat.title}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingChatId(chat.id);
                      setEditingChatTitle(chat.title);
                    }}
                    disabled={isSaving}
                    className="px-2 py-2 text-xs opacity-70 transition hover:opacity-100 disabled:opacity-40"
                    aria-label={`Rename ${chat.title}`}>
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteChat(chat.id)}
                    disabled={isSaving}
                    className="px-2 py-2 text-xs text-red-200 opacity-70 transition hover:opacity-100 disabled:opacity-40"
                    aria-label={`Delete ${chat.title}`}>
                    Del
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <section className="rounded-lg border border-white/10 bg-white/5">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Synapse Assistant
          </h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Persistent, chat-based AI workflow inside this workspace
          </p>
        </div>

        <div className="flex min-h-[65vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {!activeChatId ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    Start a new chat
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-[#94A3B8]">
                    Send a message below and a new persistent conversation will
                    be created automatically for this workspace.
                  </p>
                </div>
              </div>
            ) : messagesLoading ? (
              <p className="text-sm text-[#94A3B8]">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">
                No messages yet. Ask the assistant something.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-auto bg-(--primary) text-white"
                      : "bg-black/30 text-[#E2E8F0]"
                  }`}>
                  {message.content}
                </div>
              ))
            )}

            {sendChatMessageMutation.isPending && (
              <div className="max-w-[85%] rounded-2xl bg-black/30 px-4 py-3 text-sm text-[#94A3B8]">
                Thinking...
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-4">
            {error && (
              <p className="mb-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask the assistant something..."
                className="flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none transition placeholder:text-[#64748B] focus:border-(--primary)"
              />

              <button
                type="submit"
                disabled={sendChatMessageMutation.isPending || isSaving}
                className="rounded-md bg-(--primary) px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
                Send
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
