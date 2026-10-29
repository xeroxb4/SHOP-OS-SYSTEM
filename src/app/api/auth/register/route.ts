import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import type { UserRole } from "@/lib/models";
import { hashPassword } from "@/lib/auth/password";
import { signToken, setAuthCookie, assertJwtConfigured, isJwtConfigError } from "@/lib/auth/jwt";
import { requireRole } from "@/lib/auth/guard";

const ROLES: UserRole[] = ["admin", "warehouse", "shop", "viewer"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Two cases only:
 *  1. The database has no users yet  -> anyone may create the first admin.
 *  2. Otherwise                      -> only a signed-in admin may create users,
 *                                       and they choose the role.
 * A role sent by a stranger is never trusted.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.fullName || "").trim();
    const password = String(body.password || "");

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password and full name are required" },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    assertJwtConfigured(); // fail before creating anything if the server is not set up

    await connectDB();

    const isFirstUser = (await User.countDocuments()) === 0;
    let role: UserRole = "admin";

    if (!isFirstUser) {
      const auth = await requireRole("admin");
      if (!auth.ok) return auth.response;
      role = ROLES.includes(body.role) ? body.role : "shop";
    }

    if (await User.findOne({ email })) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = await User.create({
      email,
      password: await hashPassword(password),
      fullName,
      role,
    });

    if (isFirstUser) {
      // Two people submitting the setup form at the same moment must not both become admin.
      if ((await User.countDocuments()) > 1) {
        await User.deleteOne({ _id: user._id });
        return NextResponse.json(
          { error: "Setup was already completed. Sign in instead." },
          { status: 409 }
        );
      }
      await setAuthCookie(
        signToken({
          userId: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        })
      );
    }

    return NextResponse.json(
      { user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role } },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Register error:", err);
    if (isJwtConfigError(err)) {
      return NextResponse.json(
        { error: "Server is not configured: set a strong JWT_SECRET in .env.local, then restart." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
