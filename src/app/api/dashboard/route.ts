import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product, Sale, Batch } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth/jwt";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const products = await Product.find({ isActive: true }).lean();
    const totalProducts = products.length;
    const totalStockUnits = products.reduce(
      (sum, p) => sum + (p.warehouseQty || 0) + (p.shopQty || 0),
      0
    );
    const totalStockCost = products.reduce(
      (sum, p) =>
        sum +
        ((p.warehouseQty || 0) + (p.shopQty || 0)) * (p.costPrice || 0),
      0
    );
    const totalWholesaleValue = products.reduce(
      (sum, p) =>
        sum +
        ((p.warehouseQty || 0) + (p.shopQty || 0)) * (p.wholesalePrice || 0),
      0
    );
    const totalRetailValue = products.reduce(
      (sum, p) =>
        sum +
        ((p.warehouseQty || 0) + (p.shopQty || 0)) * (p.retailPrice || 0),
      0
    );

    const lowStock = products
      .filter(
        (p) =>
          (p.warehouseQty || 0) + (p.shopQty || 0) <= (p.reorderLevel || 5)
      )
      .map((p) => ({
        id: p._id,
        product_name: p.variant,
        current_stock: (p.warehouseQty || 0) + (p.shopQty || 0),
        reorder_level: p.reorderLevel,
      }))
      .slice(0, 10);

    // Expiry alerts from batches
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const batches = await Batch.find({ quantity: { $gt: 0 } })
      .populate("productId", "variant")
      .lean();

    const expiryAlerts = batches
      .map((b) => {
        const exp = new Date(b.expiryDate);
        let status = "OK";
        let daysRemaining = Math.ceil(
          (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (exp < now) status = "EXPIRED";
        else if (exp <= in30) status = "EXPIRING WITHIN 30 DAYS";
        else if (exp <= in90) status = "EXPIRING WITHIN 90 DAYS";
        return {
          product_name: (b.productId as any)?.variant || "Unknown",
          expiry_status: status,
          days_remaining: daysRemaining,
          expiry_date: b.expiryDate,
        };
      })
      .filter((b) => b.expiry_status !== "OK")
      .sort((a, b) => a.days_remaining - b.days_remaining)
      .slice(0, 10);

    // Sales totals
    const sales = await Sale.find().lean();
    let totalSales = 0;
    let totalProfit = 0;
    sales.forEach((s) => {
      (s.items || []).forEach((item) => {
        totalSales += item.quantity * item.unitPrice;
        totalProfit += item.quantity * (item.unitPrice - item.costPrice);
      });
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysSales = sales.filter((s) => new Date(s.saleDate) >= today);
    let todaysRevenue = 0;
    todaysSales.forEach((s) => {
      (s.items || []).forEach((item) => {
        todaysRevenue += item.quantity * item.unitPrice;
      });
    });

    return NextResponse.json({
      summary: {
        total_products: totalProducts,
        total_stock_units: totalStockUnits,
        total_stock_cost_value: totalStockCost,
        total_wholesale_value: totalWholesaleValue,
        total_retail_value: totalRetailValue,
        potential_wholesale_profit: totalWholesaleValue - totalStockCost,
        potential_retail_profit: totalRetailValue - totalStockCost,
        total_sales: totalSales,
        total_profit: totalProfit,
        total_customers: 0, // placeholder
      },
      today: {
        sales_count: todaysSales.length,
        revenue: todaysRevenue,
      },
      lowStock,
      expiryAlerts,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
