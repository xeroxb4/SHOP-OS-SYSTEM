"use client";

import { useCallback, useEffect, useState } from "react";

type StaffUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
};

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "warehouse", label: "Warehouse" },
  { value: "shop", label: "Shop" },
  { value: "viewer", label: "Viewer (read only)" },
];

const label = { color: "var(--muted)" } as const;

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [myId, setMyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("shop");

  const load = useCallback(async () => {
    try {
      const [res, me] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);
      setMyId(me.user?.userId || "");
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error || "Could not create the account" });
        return;
      }
      setMessage({ kind: "ok", text: `Account created for ${fullName.trim()}.` });
      setFullName("");
      setEmail("");
      setPassword("");
      load();
    } catch {
      setMessage({ kind: "error", text: "Network error. Is the server running?" });
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, change: { role?: string; isActive?: boolean }) {
    setMessage(null);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage({ kind: "error", text: data.error || "Could not update the account" });
      return;
    }
    load();
  }

  if (loading) return <p style={label}>Loading…</p>;

  if (forbidden) {
    return (
      <div>
        <h1 className="text-xl font-bold">Users</h1>
        <p className="text-sm mt-1" style={label}>Only admins can manage user accounts.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Users</h1>
        <p className="text-sm mt-1" style={label}>
          Create staff accounts and control what each person can do
        </p>
      </div>

      <div className="panel">
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--sidebar)" }}>
          Add a staff account
        </div>
        <form onSubmit={createUser}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-3">
            <div>
              <label className="text-xs block mb-1" style={label}>Full name</label>
              <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs block mb-1" style={label}>Email</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs block mb-1" style={label}>Password (8+ characters)</label>
              <input className="input-field" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs block mb-1" style={label}>Role</label>
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="max-w-xs">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Create account"}
            </button>
          </div>
        </form>
        {message && (
          <p
            className="text-sm mt-3"
            role="status"
            style={{ color: message.kind === "ok" ? "var(--primary)" : "var(--danger)" }}
          >
            {message.text}
          </p>
        )}
      </div>

      <div className="panel">
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--sidebar)" }}>
          Accounts
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase" style={label}>
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Access</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.id === myId;
                return (
                  <tr key={u.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                    <td className="py-2">
                      {u.fullName}
                      {isMe && <span className="text-xs ml-2" style={label}>(you)</span>}
                    </td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">
                      <select
                        className="input-field"
                        style={{ marginBottom: 0, width: "auto" }}
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => update(u.id, { role: e.target.value })}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      {isMe ? (
                        <span className="text-xs" style={label}>Active</span>
                      ) : (
                        <button
                          className="btn-secondary"
                          onClick={() => update(u.id, { isActive: !u.isActive })}
                        >
                          {u.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
