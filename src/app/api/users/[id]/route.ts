import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import type { UserRole } from "@/lib/models";
import { requireRole } from "@/lib/auth/guard";

const ROLES: UserRole[] = ["admin", "warehouse", "shop", "viewer"];

// Change a user's role or switch their access on/off (admin only).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }
  if (id === auth.user.userId) {
    return NextResponse.json(
      { error: "You cannot change your own role or access" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const update: { role?: UserRole; isActive?: boolean } = {};
    if (body.role !== undefined) {
      if (!ROLES.includes(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      update.role = body.role;
    }
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(id, update, { new: true })
      .select("email fullName role isActive")
      .lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      user: {
        id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
