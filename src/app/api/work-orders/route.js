import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const workOrders = await prisma.workOrder.findMany({
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
    const body = await req.json();
    const wo = await prisma.workOrder.create({
      data: body,
      include: { vep: true },
    });
    return NextResponse.json(wo);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
