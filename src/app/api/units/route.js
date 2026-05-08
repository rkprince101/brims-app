import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const units = await prisma.unit.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(units);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const unit = await prisma.unit.create({
      data: { ...body, userId: user.userId },
    });
    return NextResponse.json(unit);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
