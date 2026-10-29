import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { requireRole } from "@/lib/auth/guard";

// List staff accounts (admin only). New accounts are created via POST /api/auth/register.
export async function GET() {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const users = await User.find()
      .select("email fullName role isActive createdAt")
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({
      users: users.map((u) => ({
        id: String(u._id),
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
      })),
    });
  } catch (err) {
    console.error("Users list error:", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
