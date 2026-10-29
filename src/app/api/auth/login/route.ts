import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { comparePassword } from "@/lib/auth/password";
import { signToken, setAuthCookie, isJwtConfigError } from "@/lib/auth/jwt";
import { isBlocked, recordFailure, clearFailures } from "@/lib/auth/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const key = `${ip}|${email}`;
    const wait = isBlocked(key);
    if (wait > 0) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} minutes.` },
        { status: 429 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });
    const valid = user && user.isActive && (await comparePassword(password, user.password));
    if (!user || !valid) {
      recordFailure(key);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    clearFailures(key);
    await setAuthCookie(
      signToken({
        userId: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      })
    );

    return NextResponse.json({
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    if (isJwtConfigError(err)) {
      return NextResponse.json(
        { error: "Server is not configured: set a strong JWT_SECRET in .env.local, then restart." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
