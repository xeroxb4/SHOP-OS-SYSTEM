import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models";
import { requireRole } from "@/lib/auth/guard";

export async function GET() {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

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
  const auth = await requireRole("admin", "warehouse");
  if (!auth.ok) return auth.response;

  try {
    const { brandId, name } = await req.json();
    if (!mongoose.isValidObjectId(brandId) || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Choose a brand and enter a type name" },
        { status: 400 }
      );
    }
    await connectDB();
    const category = await Category.create({ brandId, name: name.trim() });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "That type already exists for this brand" },
        { status: 409 }
      );
    }
    console.error("Create category error:", err);
    return NextResponse.json({ error: "Failed to create type" }, { status: 500 });
  }
}
