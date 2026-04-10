import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const ion = await prisma.ion.update({
    where: { id },
    data: {
      referenceNumber: body.referenceNumber,
      dateRequested: body.dateRequested,
      remarks: body.remarks,
    },
    include: { requestedSpares: true },
  });
  return NextResponse.json(ion);
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  await prisma.ion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
