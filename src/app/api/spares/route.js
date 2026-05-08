import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const jobCardId = searchParams.get("jobCardId");
    if (!jobCardId) return NextResponse.json([]);
    const spares = await prisma.requestedSpare.findMany({
      where: { jobCardId, userId: user.userId },
      include: { ion: { select: { referenceNumber: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(spares);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const spare = await prisma.requestedSpare.create({
      data: { ...body, userId: user.userId },
      include: { ion: { select: { referenceNumber: true } } },
    });
    return NextResponse.json(spare);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
