import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RealtimeStatus } from "@/components/realtime-status";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { LogoutButton } from "@/app/dashboard/logout-button";
import {
  getWorkspaceByOwner,
  listWorkspacesByOwner,
} from "@/lib/db/queries/workspaces";

export default async function WorkspaceTenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  const [currentWorkspace, workspaces] = await Promise.all([
    getWorkspaceByOwner(workspaceId, session.user.id),
    listWorkspacesByOwner(session.user.id),
  ]);

  if (!currentWorkspace) {
    redirect("/workspaces");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-(--bg-start) via-(--bg-mid) to-(--bg-end) text-(--text-main)">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              {currentWorkspace.name}
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Workspace-scoped notes, projects, chats, and AI context
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceSwitcher
              workspaces={workspaces.map((workspace) => ({
                id: workspace.id,
                name: workspace.name,
              }))}
              currentWorkspaceId={currentWorkspace.id}
            />

            <Link
              href="/workspaces"
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-[#CBD5E1] transition hover:bg-white/10 hover:text-white">
              Manage Workspaces
            </Link>

            <Link
              href={`/workspaces/${currentWorkspace.id}/dashboard`}
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-[#CBD5E1] transition hover:bg-white/10 hover:text-white">
              Dashboard
            </Link>

            <Link
              href={`/workspaces/${currentWorkspace.id}/assistant`}
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-[#CBD5E1] transition hover:bg-white/10 hover:text-white">
              Assistant
            </Link>

            <RealtimeStatus />

            <p className="hidden text-sm text-[#94A3B8] sm:block">
              {session.user.email ?? ""}
            </p>

            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

