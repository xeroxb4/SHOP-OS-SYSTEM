import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import type { UserRole } from "@/lib/models";
import { getCurrentUser } from "./jwt";

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export type Guard =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

function fail(status: number, error: string): Guard {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

/**
 * Checks that the caller is signed in AND still active, using their current
 * role from the database (not the role frozen into the token). That way
 * deactivating a user or changing their role takes effect immediately.
 *
 * Pass no roles to allow any signed-in user.
 *
 *   const auth = await requireRole("admin", "warehouse");
 *   if (!auth.ok) return auth.response;
 */
export async function requireRole(...roles: UserRole[]): Promise<Guard> {
  try {
    const token = await getCurrentUser();
    if (!token) return fail(401, "Please sign in");

    await connectDB();
    const u = await User.findById(token.userId)
      .select("email fullName role isActive")
      .lean();
    if (!u || !u.isActive) return fail(401, "Please sign in");

    if (roles.length > 0 && !roles.includes(u.role)) {
      return fail(403, "You do not have permission to do this");
    }

    return {
      ok: true,
      user: {
        userId: String(u._id),
        email: u.email,
        fullName: u.fullName,
        role: u.role,
      },
    };
  } catch (err) {
    console.error("Auth guard error:", err);
    return fail(500, "Server error while checking your access");
  }
}
