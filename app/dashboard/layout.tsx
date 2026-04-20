import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
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
            <p className="hidden text-sm text-[#94A3B8] sm:block">
              {session.user.email}
            </p>

            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
