"use client";

import { useCallback, useEffect, useState } from "react";

function money(n: number) {
  return "GHS " + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Product = {
  id: string;
  variant: string;
  sku?: string;
  brandName: string;
  categoryName: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  warehouseQty: number;
  shopQty: number;
};
type Brand = { _id: string; name: string };
type Category = { _id: string; name: string; brandId: { _id: string; name: string } | null };
type Notice = { kind: "ok" | "error"; text: string } | null;

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data.error || "Something went wrong" };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

const label = { color: "var(--muted)" } as const;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

  // brand form
  const [brandName, setBrandName] = useState("");
  // type form
  const [typeBrandId, setTypeBrandId] = useState("");
  const [typeName, setTypeName] = useState("");
  // product form
  const [categoryId, setCategoryId] = useState("");
  const [variant, setVariant] = useState("");
  const [sku, setSku] = useState("");
  const [cost, setCost] = useState("");
  const [wholesale, setWholesale] = useState("");
  const [retail, setRetail] = useState("");
  const [reorder, setReorder] = useState("5");

  const load = useCallback(async () => {
    try {
      const [p, b, c, me] = await Promise.all([
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/brands").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);
      setProducts(p.products || []);
      setBrands(b.brands || []);
      setCategories(c.categories || []);
      setCanEdit(["admin", "warehouse"].includes(me.user?.role));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(
    url: string,
    body: unknown,
    success: string,
    reset: () => void
  ) {
    setNotice(null);
    setBusy(true);
    const result = await post(url, body);
    setBusy(false);
    if (!result.ok) {
      setNotice({ kind: "error", text: result.error || "Something went wrong" });
      return;
    }
    reset();
    setNotice({ kind: "ok", text: success });
    load();
  }

  const addBrand = (e: React.FormEvent) => {
    e.preventDefault();
    submit("/api/brands", { name: brandName }, `Brand “${brandName.trim()}” added.`, () =>
      setBrandName("")
    );
  };

  const addType = (e: React.FormEvent) => {
    e.preventDefault();
    submit(
      "/api/categories",
      { brandId: typeBrandId, name: typeName },
      `Type “${typeName.trim()}” added.`,
      () => setTypeName("")
    );
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    submit(
      "/api/products",
      {
        categoryId,
        variant,
        sku,
        costPrice: cost || 0,
        wholesalePrice: wholesale || 0,
        retailPrice: retail || 0,
        reorderLevel: reorder === "" ? 5 : reorder,
      },
      `Product “${variant.trim()}” added.`,
      () => {
        setVariant("");
        setSku("");
        setCost("");
        setWholesale("");
        setRetail("");
      }
    );
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Products</h1>
        <p className="text-sm mt-1" style={label}>
          Brand → type → variant, with cost, wholesale and retail price
        </p>
      </div>

      {canEdit && (
        <div className="panel">
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--sidebar)" }}>
            Add to catalogue
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mb-2">
            <form onSubmit={addBrand} className="mb-3">
              <label className="text-xs block mb-1" style={label}>New brand</label>
              <div className="flex gap-2">
                <input
                  className="input-field"
                  style={{ marginBottom: 0 }}
                  placeholder="e.g. Nivea"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  required
                />
                <button type="submit" className="btn-secondary" disabled={busy}>
                  Add brand
                </button>
              </div>
            </form>

            <form onSubmit={addType} className="mb-3">
              <label className="text-xs block mb-1" style={label}>New type under a brand</label>
              <div className="flex gap-2">
                <select
                  className="input-field"
                  style={{ marginBottom: 0 }}
                  value={typeBrandId}
                  onChange={(e) => setTypeBrandId(e.target.value)}
                  required
                >
                  <option value="">Brand…</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                <input
                  className="input-field"
                  style={{ marginBottom: 0 }}
                  placeholder="e.g. Body lotion"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  required
                />
                <button type="submit" className="btn-secondary" disabled={busy || brands.length === 0}>
                  Add type
                </button>
              </div>
            </form>
          </div>

          <form onSubmit={addProduct}>
            <div className="text-xs mb-2" style={label}>New product (variant)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3">
              <div className="col-span-2">
                <label className="text-xs block mb-1" style={label}>Type</label>
                <select
                  className="input-field"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">
                    {categories.length === 0 ? "Add a brand and a type first" : "Choose brand and type…"}
                  </option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.brandId?.name} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs block mb-1" style={label}>Variant name</label>
                <input
                  className="input-field"
                  placeholder="e.g. Soft Milk 400ml"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={label}>SKU (optional)</label>
                <input className="input-field" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={label}>Cost price (GHS)</label>
                <input className="input-field" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={label}>Wholesale price (GHS)</label>
                <input className="input-field" type="number" min="0" step="0.01" value={wholesale} onChange={(e) => setWholesale(e.target.value)} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={label}>Retail price (GHS)</label>
                <input className="input-field" type="number" min="0" step="0.01" value={retail} onChange={(e) => setRetail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={label}>Reorder level</label>
                <input className="input-field" type="number" min="0" step="1" value={reorder} onChange={(e) => setReorder(e.target.value)} />
              </div>
            </div>
            <div className="max-w-xs">
              <button type="submit" className="btn-primary" disabled={busy || categories.length === 0}>
                {busy ? "Saving…" : "Add product"}
              </button>
            </div>
          </form>

          {notice && (
            <p
              className="text-sm mt-3"
              role="status"
              style={{ color: notice.kind === "ok" ? "var(--primary)" : "var(--danger)" }}
            >
              {notice.text}
            </p>
          )}
        </div>
      )}

      <div className="panel">
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--sidebar)" }}>
          All SKUs
        </div>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted2)" }}>Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted2)" }}>
            {canEdit
              ? "No products yet. Add a brand, then a type under it, then your first product above."
              : "No products yet. Ask an admin or warehouse user to add them."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase" style={label}>
                  <th className="pb-2">Brand</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Variant</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2 text-right">Cost</th>
                  <th className="pb-2 text-right">Wholesale</th>
                  <th className="pb-2 text-right">Retail</th>
                  <th className="pb-2 text-right">Warehouse</th>
                  <th className="pb-2 text-right">Shop</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                    <td className="py-2">{p.brandName}</td>
                    <td className="py-2">{p.categoryName}</td>
                    <td className="py-2">{p.variant}</td>
                    <td className="py-2 font-mono text-xs">{p.sku || "—"}</td>
                    <td className="py-2 text-right font-mono">{money(p.costPrice)}</td>
                    <td className="py-2 text-right font-mono">{money(p.wholesalePrice)}</td>
                    <td className="py-2 text-right font-mono">{money(p.retailPrice)}</td>
                    <td className="py-2 text-right font-mono">{p.warehouseQty}</td>
                    <td className="py-2 text-right font-mono">{p.shopQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
