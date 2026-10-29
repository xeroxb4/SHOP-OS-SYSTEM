"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  // null = still checking, true = no users yet (first-time setup), false = normal sign-in
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => setNeedsSetup(Boolean(d.needsSetup)))
      .catch(() => setNeedsSetup(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = needsSetup ? "/api/auth/register" : "/api/auth/login";
    const body = needsSetup ? { email, password, fullName } : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Is the server running?");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="bg-white border rounded-xl p-8 w-full max-w-sm" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-lg font-bold mb-1" style={{ color: "var(--ink)" }}>
          Shop OS System
        </h1>
        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
          {needsSetup === null
            ? "Checking setup…"
            : needsSetup
            ? "No accounts yet. Create the first admin account."
            : "Sign in with the account your admin created."}
        </p>

        {needsSetup !== null && (
          <form onSubmit={handleSubmit}>
            {needsSetup && (
              <input
                className="input-field"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <input
              className="input-field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="password"
              placeholder={needsSetup ? "Password (at least 8 characters)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={needsSetup ? 8 : undefined}
            />
            {error && (
              <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Please wait…" : needsSetup ? "Create admin account" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
