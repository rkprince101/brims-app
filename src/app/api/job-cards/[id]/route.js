import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const jc = await prisma.jobCard.update({
    where: { id },
    data: body,
    include: { workOrder: { include: { vep: true } } },
  });
  return NextResponse.json(jc);
}
