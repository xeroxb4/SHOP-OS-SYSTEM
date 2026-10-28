import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product, Category, Brand } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth/jwt";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      categoryId,
      variant,
      sku,
      costPrice = 0,
      wholesalePrice = 0,
      retailPrice = 0,
      reorderLevel = 5,
    } = body;

    if (!categoryId || !variant) {
      return NextResponse.json(
        { error: "categoryId and variant are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.create({
      categoryId,
      variant,
      sku: sku || undefined,
      costPrice,
      wholesalePrice,
      retailPrice,
      reorderLevel,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Product with this variant already exists in the category" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
