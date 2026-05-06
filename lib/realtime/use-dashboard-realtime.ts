"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/providers/realtime-provider";
import { useRouter } from "next/navigation";
import type { Scope } from "@/lib/store/workspace-store";
import {
  REALTIME_EVENTS,
  type NoteChangedPayload,
  type ProjectChangedPayload,
  type WorkspaceChangedPayload,
} from "./events";

type UseDashboardRealtimeOptions = {
  workspaceId: string;
  scope: Scope;
  selectedNoteId: string | null;
  setScope: (scope: Scope) => void;
  setSelectedNoteId: (id: string | null) => void;
};

export function useDashboardRealtime({
  workspaceId,
  scope,
  selectedNoteId,
  setScope,
  setSelectedNoteId,
}: UseDashboardRealtimeOptions) {
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
        setScope("all");
        setSelectedNoteId(null);
        router.push("/workspaces");
      }
    };

    const handleProjectChanged = (payload: ProjectChangedPayload) => {
      if (payload.workspaceId !== workspaceId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ["projects", workspaceId],
      });
      void queryClient.invalidateQueries({ queryKey: ["notes", workspaceId] });

      if (
        payload.action === "deleted" &&
        scope === `project:${payload.projectId}`
      ) {
        setScope("inbox");
      }
    };

    const handleNoteChanged = (payload: NoteChangedPayload) => {
      if (payload.workspaceId !== workspaceId) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ["notes", workspaceId] });

      if (payload.action === "deleted" && selectedNoteId === payload.noteId) {
        setSelectedNoteId(null);
      }
    };

    socket.on(REALTIME_EVENTS.WORKSPACE_CHANGED, handleWorkspaceChanged);
    socket.on(REALTIME_EVENTS.PROJECT_CHANGED, handleProjectChanged);
    socket.on(REALTIME_EVENTS.NOTE_CHANGED, handleNoteChanged);

    return () => {
      socket.off(REALTIME_EVENTS.WORKSPACE_CHANGED, handleWorkspaceChanged);
      socket.off(REALTIME_EVENTS.PROJECT_CHANGED, handleProjectChanged);
      socket.off(REALTIME_EVENTS.NOTE_CHANGED, handleNoteChanged);
    };
  }, [
    queryClient,
    router,
    scope,
    selectedNoteId,
    setScope,
    setSelectedNoteId,
    socket,
    workspaceId,
  ]);
}