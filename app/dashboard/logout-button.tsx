"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/login",
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg bg-(--primary) px-4 py-2 text-sm font-medium transition hover:bg-indigo-500">
      Logout
    </button>
  );
}
