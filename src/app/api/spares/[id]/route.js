import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const spare = await prisma.requestedSpare.update({
    where: { id },
    data: body,
    include: { ion: { select: { referenceNumber: true } } },
  });
  return NextResponse.json(spare);
}
