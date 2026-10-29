"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/purchases", label: "Purchase invoices" },
  { href: "/transfers", label: "Stock transfers" },
  { href: "/pos", label: "Point of sale" },
  { href: "/reports", label: "Sales & profit" },
];

const ADMIN_NAV = [{ href: "/users", label: "Users" }];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col p-4 text-sm"
        style={{ background: "var(--sidebar)", color: "#EDEFE7" }}
      >
        <div className="flex items-center gap-2.5 mb-7 px-1.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-white"
            style={{ background: "var(--accent)" }}
          >
            S
          </div>
          <div>
            <div className="font-semibold text-sm">Shop OS</div>
            <div className="text-[11px]" style={{ color: "#A9B49F" }}>
              {user?.fullName} · {user?.role}
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {(user?.role === "admin" ? [...NAV, ...ADMIN_NAV] : NAV).map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-2.5 py-2 rounded-md transition-colors"
                style={{
                  background: active ? "var(--sidebar-hover)" : "transparent",
                  color: active ? "#fff" : "#CBD3C2",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="btn-secondary w-full justify-center mt-4"
          style={{ fontSize: 12 }}
        >
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-7 overflow-y-auto" style={{ background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
