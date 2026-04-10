import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const wo = await prisma.workOrder.update({
    where: { id },
    data: body,
    include: { vep: true },
  });
  return NextResponse.json(wo);
}
