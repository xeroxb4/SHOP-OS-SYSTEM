import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth/jwt";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const categories = await Category.find()
      .populate("brandId", "name")
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { brandId, name } = await req.json();
    if (!brandId || !name?.trim()) {
      return NextResponse.json(
        { error: "brandId and name are required" },
        { status: 400 }
      );
    }
    await connectDB();
    const category = await Category.create({
      brandId,
      name: name.trim(),
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Category already exists for this brand" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
