import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ─── Master Password (hardcoded) ────────────────────────────────────────────
export const MASTER_PASSWORD = "rishikesh.prince";

// ─── Cookie / Token Config ──────────────────────────────────────────────────
const COOKIE_NAME = "brims_session";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-in-production"
);
const TOKEN_EXPIRY = "7d"; // tokens last 7 days

// ─── Password Hashing ──────────────────────────────────────────────────────
export async function hashPassword(plainText) {
  return bcrypt.hash(plainText, 12);
}

export async function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

// ─── JWT Token ──────────────────────────────────────────────────────────────
export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ─── Session Helpers ────────────────────────────────────────────────────────
export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
