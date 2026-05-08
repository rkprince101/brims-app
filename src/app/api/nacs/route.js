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
    const nacs = await prisma.nac.findMany({
      where,
      include: {
        requestedSpare: { select: { spareName: true, partNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(nacs);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const nac = await prisma.nac.create({
      data: { ...body, userId: user.userId },
      include: {
        requestedSpare: { select: { spareName: true, partNumber: true } },
      },
    });
    return NextResponse.json(nac);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
