"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/providers/realtime-provider";
import { useRouter } from "next/navigation";
import {
  REALTIME_EVENTS,
  type WorkspaceChangedPayload,
  type ChatChangedPayload,
  type ChatMessageCreatedPayload,
} from "./events";

type UseAssistantRealtimeOptions = {
  workspaceId: string;
  activeChatId: string | null;
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void;
};

export function useAssistantRealtime({
  workspaceId,
  activeChatId,
  selectedChatId,
  setSelectedChatId,
}: UseAssistantRealtimeOptions) {
  const queryClient = useQueryClient();
  const { socket } = useRealtime();
  const router = useRouter();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleWorkspaceChanged = (payload: WorkspaceChangedPayload) => {
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });

      if (payload.action === "deleted" && payload.workspaceId === workspaceId) {
        setSelectedChatId(null);
        router.push("/workspaces");
      }
    };

    const handleChatChanged = (payload: ChatChangedPayload) => {
      if (payload.workspaceId !== workspaceId) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });

      if (payload.action === "deleted") {
        void queryClient.removeQueries({
          queryKey: ["chat-messages", workspaceId, payload.chatId],
        });

        if (selectedChatId === payload.chatId) {
          setSelectedChatId(null);
        }
      }

      if (activeChatId === payload.chatId) {
        void queryClient.invalidateQueries({
          queryKey: ["chat-messages", workspaceId, payload.chatId],
        });
      }
    };

    const handleChatMessageCreated = (payload: ChatMessageCreatedPayload) => {
      if (payload.workspaceId !== workspaceId) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ["chats", workspaceId] });

      if (activeChatId === payload.chatId) {
        void queryClient.invalidateQueries({
          queryKey: ["chat-messages", workspaceId, payload.chatId],
        });
      }
    };

    socket.on(REALTIME_EVENTS.WORKSPACE_CHANGED, handleWorkspaceChanged);
    socket.on(REALTIME_EVENTS.CHAT_CHANGED, handleChatChanged);
    socket.on(REALTIME_EVENTS.CHAT_MESSAGE_CREATED, handleChatMessageCreated);

    return () => {
      socket.off(REALTIME_EVENTS.WORKSPACE_CHANGED, handleWorkspaceChanged);
      socket.off(REALTIME_EVENTS.CHAT_CHANGED, handleChatChanged);
      socket.off(
        REALTIME_EVENTS.CHAT_MESSAGE_CREATED,
        handleChatMessageCreated,
      );
    };
  }, [
    activeChatId,
    queryClient,
    router,
    selectedChatId,
    setSelectedChatId,
    socket,
    workspaceId,
  ]);
}
