import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const COOKIE_NAME = "brims_session";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-in-production"
);

/**
 * Extract the current user's ID from the session cookie.
 * Returns { userId, username } or null if not authenticated.
 * Use this in every API route to enforce multi-tenant data isolation.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}
