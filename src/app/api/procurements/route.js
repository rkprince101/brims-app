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
      include: {
        items: true,
      },
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
    const { items, ...procData } = body;
    
    const procurement = await prisma.procurement.create({
      data: {
        ...procData,
        userId: user.userId,
        items: {
          create: (items || []).map((item) => ({ ...item, userId: user.userId })),
        }
      },
      include: { items: true },
    });
    
    return NextResponse.json(procurement);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
