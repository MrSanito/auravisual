"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Lock, User as UserIcon, Eye, EyeOff, Loader2, ArrowRight, TrendingUp } from "lucide-react";

export default function LoginPage() {
  const { user, login, error, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim() || !password.trim()) {
      setLocalError("Please enter both username and password");
      return;
    }

    const success = await login(username, password);
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 font-sans antialiased">
      {/* Background decoration elements matching the original dashboard theme */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-400/10 blur-[140px]" />

      <div className="relative mx-auto w-full max-w-md px-6 py-12">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <TrendingUp size={22} className="stroke-[2.5]" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
              Welcome to Fin Tracker
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Sign in to manage your budget and transactions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {(localError || error) && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600 bg-red-50">
                {localError || error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <p className="text-[11px] leading-relaxed text-gray-500">
              Hint: Use <span className="font-semibold text-gray-700">admin</span> for username and <span className="font-semibold text-gray-700">admin</span> for password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
