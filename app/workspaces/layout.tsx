import { RealtimeProvider } from "@/providers/realtime-provider";

export default function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RealtimeProvider>{children}</RealtimeProvider>;
}

