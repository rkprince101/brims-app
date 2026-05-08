import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MASTER_PASSWORD, hashPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    const { username, password, masterPassword } = await request.json();

    // Validate required fields
    if (!username || !password || !masterPassword) {
      return NextResponse.json(
        { error: "Username, password, and master password are required." },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters." },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Verify master password
    if (masterPassword !== MASTER_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid master password. Registration denied." },
        { status: 401 }
      );
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "Registration successful! You can now log in." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
