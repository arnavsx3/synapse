"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await login({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Unable to sign in");
        return;
      }
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
            className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-(--primary) transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-(--primary) transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-(--primary) hover:bg-indigo-500 transition font-medium disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
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
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full p-3 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition">
          Continue with Google
        </button>
        {/* Footer */}
        <p className="text-sm text-center text-[#94A3B8] mt-6">
          Don’t have an account?{" "}
          <a href="/signup" className="text-(--primary) hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
