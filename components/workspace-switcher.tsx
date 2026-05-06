"use client";

import { usePathname, useRouter } from "next/navigation";

type WorkspaceOption = {
  id: string;
  name: string;
};

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
}: {
  workspaces: WorkspaceOption[];
  currentWorkspaceId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (nextWorkspaceId: string) => {
    if (nextWorkspaceId === currentWorkspaceId) {
      return;
    }

    const segments = pathname.split("/");

    if (segments.length >= 3) {
      segments[2] = nextWorkspaceId;
      router.push(segments.join("/"));
      return;
    }

    router.push(`/workspaces/${nextWorkspaceId}/dashboard`);
  };

  return (
    <select
      value={currentWorkspaceId}
      onChange={(event) => handleChange(event.target.value)}
      className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#CBD5E1] outline-none transition focus:border-(--primary)">
      {workspaces.map((workspace) => (
        <option key={workspace.id} value={workspace.id}>
          {workspace.name}
        </option>
      ))}
    </select>
  );
}
