"use client";

import { signOut } from "next-auth/react";

export default function Dashboard() {
  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/login",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-(--bg-start) via-(--bg-mid) to-(--bg-end) text-(--text-main) px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

        <p className="mt-2 text-sm text-[#94A3B8]">
          You are signed in to Synapse.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full p-3 rounded-lg bg-(--primary) hover:bg-indigo-500 transition font-medium">
          Logout
        </button>
      </div>
    </div>
  );
}
