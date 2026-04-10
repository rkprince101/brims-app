import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const p = await prisma.procurement.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(p);
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  await prisma.procurement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
