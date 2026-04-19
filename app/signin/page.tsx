"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-(--bg-start) via-(--bg-mid) to-(--bg-end) text-(--text-main) px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">Login to your workspace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full p-3 rounded-lg bg-[#6366F1] hover:bg-indigo-500 transition font-medium">
            Sign in
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-[#94A3B8]">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google */}
        <button
          onClick={() => signIn("google")}
          className="w-full p-3 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition">
          Continue with Google
        </button>

        {/* Footer */}
        <p className="text-sm text-center text-[#94A3B8] mt-6">
          Don’t have an account?{" "}
          <a href="/signup" className="text-[#6366F1] hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
