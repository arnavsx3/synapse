"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/providers/realtime-provider";
import { REALTIME_EVENTS } from "./events";

export function useWorkspaceListRealtime() {
  const queryClient = useQueryClient();
  const { socket } = useRealtime();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleWorkspaceChanged = () => {
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    };

    socket.on(REALTIME_EVENTS.WORKSPACE_CHANGED, handleWorkspaceChanged);

    return () => {
      socket.off(REALTIME_EVENTS.WORKSPACE_CHANGED, handleWorkspaceChanged);
    };
  }, [queryClient, socket]);
}
