"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMaster, setShowMaster] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, masterPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      // Redirect to login with success indicator
      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* Logo / Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-accent)] text-white font-bold text-lg mb-4">
          B
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Create your account
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          A master password is required to register
        </p>
      </div>

      {/* Form Card */}
      <div className="notion-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 rounded-md px-3 py-2 animate-fade-in">
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label htmlFor="register-username" className="notion-label">
              Username
            </label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="notion-input"
              placeholder="Choose a username (min 3 characters)"
              autoComplete="username"
              required
              minLength={3}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="register-password" className="notion-label">
              Password
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="notion-input pr-10"
                placeholder="Choose a password (min 6 characters)"
                autoComplete="new-password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Master Password */}
          <div>
            <label htmlFor="register-master" className="notion-label">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[var(--color-warning)]" />
                Master Password
              </span>
            </label>
            <div className="relative">
              <input
                id="register-master"
                type={showMaster ? "text" : "password"}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="notion-input pr-10"
                placeholder="Enter the master password"
                required
              />
              <button
                type="button"
                onClick={() => setShowMaster(!showMaster)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                tabIndex={-1}
              >
                {showMaster ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Required to verify your authorization
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="notion-button-primary w-full justify-center py-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <UserPlus size={16} />
                Register
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)] text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--color-accent)] hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
