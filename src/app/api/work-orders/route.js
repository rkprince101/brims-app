import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const workOrders = await prisma.workOrder.findMany({
    include: { vep: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(workOrders);
}

export async function POST(req) {
  const body = await req.json();
  const wo = await prisma.workOrder.create({
    data: body,
    include: { vep: true },
  });
  return NextResponse.json(wo);
}
