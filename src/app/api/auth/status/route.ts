import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

/** Tells the login page whether to show "create the first admin" or plain sign-in. */
export async function GET() {
  try {
    await connectDB();
    const needsSetup = (await User.countDocuments()) === 0;
    return NextResponse.json({ needsSetup });
  } catch (err) {
    console.error("Status error:", err);
    return NextResponse.json({ needsSetup: false });
  }
}
