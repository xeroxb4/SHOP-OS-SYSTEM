import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { UserRole } from "../models/User";

const TOKEN_NAME = "shop_os_token";
const EXPIRES_IN = "7d";

/**
 * The secret must come from .env.local. There is deliberately no fallback:
 * a built-in default would let anyone forge an admin login.
 */
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("change-this")) {
    throw new Error(
      "JWT_SECRET is missing or too weak. Set a random string of at least 32 characters in .env.local"
    );
  }
  return secret;
}

/** Call before doing any work that ends in a sign-in, so setup never half-completes. */
export function assertJwtConfigured(): void {
  getSecret();
}

export function isJwtConfigError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("JWT_SECRET");
}

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN, algorithm: "HS256" });
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = getSecret(); // a missing secret is a setup error, not a "logged out" user
  try {
    return jwt.verify(token, secret, { algorithms: ["HS256"] }) as TokenPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}
