import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";

export async function GET() {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ user: auth.user });
}
