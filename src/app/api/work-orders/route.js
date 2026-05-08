import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workOrders = await prisma.workOrder.findMany({
      where: { userId: user.userId },
      include: { vep: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(workOrders);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const wo = await prisma.workOrder.create({
      data: { ...body, userId: user.userId },
      include: { vep: true },
    });
    return NextResponse.json(wo);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
