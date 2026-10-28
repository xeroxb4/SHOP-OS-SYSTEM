"use client";

import { useEffect, useState } from "react";

function money(n: number) {
  return "GHS " + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
        <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
          Make sure MongoDB is connected (see README).
        </p>
      </div>
    );
  }

  if (!data) {
    return <p style={{ color: "var(--muted)" }}>Loading dashboard…</p>;
  }

  const s = data.summary || {};
  const lowStock = data.lowStock || [];
  const expiryAlerts = data.expiryAlerts || [];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Live stock, valuation, sales and alerts
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          ["Stock units", Number(s.total_stock_units || 0).toLocaleString()],
          ["Stock at cost", money(s.total_stock_cost_value)],
          ["Wholesale value", money(s.total_wholesale_value)],
          ["Retail value", money(s.total_retail_value)],
          ["Wholesale potential profit", money(s.potential_wholesale_profit)],
          ["Retail potential profit", money(s.potential_retail_profit)],
          ["Total sales", money(s.total_sales)],
          ["Actual profit", money(s.total_profit)],
        ].map(([label, value]) => (
          <div key={label} className="metric-card">
            <div className="text-xs mb-2" style={{ color: "var(--muted)" }}>
              {label}
            </div>
            <div className="text-xl font-bold font-mono">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Today */}
        <div className="panel">
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--sidebar)" }}>
            Today
          </div>
          <div className="flex justify-between py-1.5 text-sm border-b" style={{ borderColor: "var(--line)" }}>
            <span>Sales</span>
            <strong>{data.today?.sales_count ?? 0}</strong>
          </div>
          <div className="flex justify-between py-1.5 text-sm border-b" style={{ borderColor: "var(--line)" }}>
            <span>Revenue</span>
            <strong>{money(data.today?.revenue)}</strong>
          </div>
          <div className="flex justify-between py-1.5 text-sm">
            <span>Products</span>
            <strong>{Number(s.total_products || 0).toLocaleString()}</strong>
          </div>
        </div>

        {/* Low stock */}
        <div className="panel">
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--sidebar)" }}>
            Low stock
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted2)" }}>
              Nothing is at or below reorder level.
            </p>
          ) : (
            lowStock.map((p: any) => (
              <div
                key={p.id}
                className="flex justify-between py-1.5 text-sm border-b"
                style={{ borderColor: "var(--line)" }}
              >
                <span>{p.product_name}</span>
                <span className="tag-warn">
                  {p.current_stock} / {p.reorder_level}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Expiry */}
        <div className="panel">
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--sidebar)" }}>
            Expiry alerts
          </div>
          {expiryAlerts.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted2)" }}>
              No batches expired or expiring within 90 days.
            </p>
          ) : (
            expiryAlerts.map((b: any, i: number) => (
              <div
                key={i}
                className="flex justify-between py-1.5 text-sm border-b"
                style={{ borderColor: "var(--line)" }}
              >
                <span>{b.product_name}</span>
                <span className="tag-warn">
                  {b.expiry_status === "EXPIRED"
                    ? "EXPIRED"
                    : `${b.days_remaining} days`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
