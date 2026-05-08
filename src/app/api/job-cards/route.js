import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const jobCards = await prisma.jobCard.findMany({
      where: { userId: user.userId },
      include: { workOrder: { include: { vep: true } }, relatedJobCard: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(jobCards);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const jc = await prisma.jobCard.create({
      data: { ...body, userId: user.userId },
      include: { workOrder: { include: { vep: true } } },
    });
    // Update WO status
    await prisma.workOrder.update({
      where: { id: body.workOrderId, userId: user.userId },
      data: { status: "ASSIGNED_TO_JOB_CARD" },
    });
    return NextResponse.json(jc);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
