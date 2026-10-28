"use client";

import { useEffect, useState } from "react";

function money(n: number) {
  return "GHS " + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Products</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Brand → type → variant, with cost, wholesale and retail price
        </p>
      </div>

      <div className="panel">
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--sidebar)" }}>
          All SKUs
        </div>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted2)" }}>Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted2)" }}>
            No products yet. Add brands, categories and products via the API or upcoming forms.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase" style={{ color: "var(--muted)" }}>
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
