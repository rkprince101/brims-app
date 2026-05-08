import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const jobCards = await prisma.jobCard.findMany({
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
    const body = await req.json();
    const jc = await prisma.jobCard.create({
      data: body,
      include: { workOrder: { include: { vep: true } } },
    });
    // Update WO status
    await prisma.workOrder.update({
      where: { id: body.workOrderId },
      data: { status: "ASSIGNED_TO_JOB_CARD" },
    });
    return NextResponse.json(jc);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
