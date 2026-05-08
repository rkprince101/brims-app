import { NextResponse } from "next/server";
import { getSessionToken, verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const token = await getSessionToken();

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { username: payload.username, userId: payload.userId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
