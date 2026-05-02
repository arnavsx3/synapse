"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/providers/realtime-provider";
import {
  REALTIME_EVENTS,
  type ChatChangedPayload,
  type ChatMessageCreatedPayload,
} from "./events";

type UseAssistantRealtimeOptions = {
  activeChatId: string | null;
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void;
};

export function useAssistantRealtime({
  activeChatId,
  selectedChatId,
  setSelectedChatId,
}: UseAssistantRealtimeOptions) {
  const queryClient = useQueryClient();
  const { socket } = useRealtime();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleChatChanged = (payload: ChatChangedPayload) => {
      void queryClient.invalidateQueries({ queryKey: ["chats"] });

      if (payload.action === "deleted") {
        void queryClient.removeQueries({
          queryKey: ["chat-messages", payload.chatId],
        });

        if (selectedChatId === payload.chatId) {
          setSelectedChatId(null);
        }
      }

      if (activeChatId === payload.chatId) {
        void queryClient.invalidateQueries({
          queryKey: ["chat-messages", payload.chatId],
        });
      }
    };

    const handleChatMessageCreated = (payload: ChatMessageCreatedPayload) => {
      void queryClient.invalidateQueries({ queryKey: ["chats"] });

      if (activeChatId === payload.chatId) {
        void queryClient.invalidateQueries({
          queryKey: ["chat-messages", payload.chatId],
        });
      }
    };

    socket.on(REALTIME_EVENTS.CHAT_CHANGED, handleChatChanged);
    socket.on(REALTIME_EVENTS.CHAT_MESSAGE_CREATED, handleChatMessageCreated);

    return () => {
      socket.off(REALTIME_EVENTS.CHAT_CHANGED, handleChatChanged);
      socket.off(
        REALTIME_EVENTS.CHAT_MESSAGE_CREATED,
        handleChatMessageCreated,
      );
    };
  }, [activeChatId, queryClient, selectedChatId, setSelectedChatId, socket]);
}
