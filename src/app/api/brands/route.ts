import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Brand } from "@/lib/models";
import { requireRole } from "@/lib/auth/guard";

export async function GET() {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const brands = await Brand.find().sort({ name: 1 }).lean();
    return NextResponse.json({ brands });
  } catch {
    return NextResponse.json({ error: "Failed to load brands" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole("admin", "warehouse");
  if (!auth.ok) return auth.response;

  try {
    const { name } = await req.json();
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }
    await connectDB();
    const brand = await Brand.create({ name: name.trim() });
    return NextResponse.json({ brand }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "That brand already exists" }, { status: 409 });
    }
    console.error("Create brand error:", err);
    return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
  }
}
