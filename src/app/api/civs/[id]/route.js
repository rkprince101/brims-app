import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const civ = await prisma.civ.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(civ);
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  await prisma.civ.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
