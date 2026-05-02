"use client";

import { useRealtime } from "@/providers/realtime-provider";

export function RealtimeStatus() {
  const { status } = useRealtime();

  const label =
    status === "connected"
      ? "Live"
      : status === "connecting"
        ? "Connecting"
        : "Offline";

  const classes =
    status === "connected"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : status === "connecting"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
        : "border-red-400/30 bg-red-500/10 text-red-200";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
