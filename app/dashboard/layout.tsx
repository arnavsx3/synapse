import { RealtimeStatus } from "@/components/realtime-status";
import { RealtimeProvider } from "@/providers/realtime-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-linear-to-br from-(--bg-start) via-(--bg-mid) to-(--bg-end) text-(--text-main)">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Synapse</h1>
              <p className="text-xs text-[#94A3B8]">
                AI-native knowledge workspace
              </p>
            </div>

            <div className="flex items-center gap-4">
              <RealtimeStatus />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </RealtimeProvider>
  );
}
