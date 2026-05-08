import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const jobCardId = searchParams.get("jobCardId");
    const where = jobCardId ? { jobCardId, userId: user.userId } : { userId: user.userId };
    const procurements = await prisma.procurement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(procurements);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const procurement = await prisma.procurement.create({ data: { ...body, userId: user.userId } });
    return NextResponse.json(procurement);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
