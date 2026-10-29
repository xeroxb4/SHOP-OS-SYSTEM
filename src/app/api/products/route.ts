import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { requireRole } from "@/lib/auth/guard";

// Prices are in cedis; keep them to 2 decimal places.
function money(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export async function GET() {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const products = await Product.find({ isActive: true })
      .populate({
        path: "categoryId",
        populate: { path: "brandId", select: "name" },
        select: "name brandId",
      })
      .sort({ variant: 1 })
      .lean();

    const formatted = products.map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cat = p.categoryId as any;
      const brand = cat?.brandId;
      return {
        id: p._id,
        variant: p.variant,
        sku: p.sku,
        costPrice: p.costPrice,
        wholesalePrice: p.wholesalePrice,
        retailPrice: p.retailPrice,
        reorderLevel: p.reorderLevel,
        warehouseQty: p.warehouseQty,
        shopQty: p.shopQty,
        brandName: brand?.name || "",
        categoryName: cat?.name || "",
        categoryId: cat?._id,
      };
    });

    return NextResponse.json({ products: formatted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole("admin", "warehouse");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const variant = typeof body.variant === "string" ? body.variant.trim() : "";
    const sku = typeof body.sku === "string" ? body.sku.trim() : "";

    if (!mongoose.isValidObjectId(body.categoryId) || !variant) {
      return NextResponse.json(
        { error: "Choose a type and enter a variant name" },
        { status: 400 }
      );
    }

    const costPrice = money(body.costPrice ?? 0);
    const wholesalePrice = money(body.wholesalePrice ?? 0);
    const retailPrice = money(body.retailPrice ?? 0);
    if (costPrice === null || wholesalePrice === null || retailPrice === null) {
      return NextResponse.json(
        { error: "Prices must be numbers of 0 or more" },
        { status: 400 }
      );
    }

    const reorderLevel = Number(body.reorderLevel ?? 5);
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
      return NextResponse.json(
        { error: "Reorder level must be a whole number of 0 or more" },
        { status: 400 }
      );
    }

    await connectDB();
    const product = await Product.create({
      categoryId: body.categoryId,
      variant,
      sku: sku || undefined,
      costPrice,
      wholesalePrice,
      retailPrice,
      reorderLevel,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "That variant (or SKU) already exists" },
        { status: 409 }
      );
    }
    console.error("Create product error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
