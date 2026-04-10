import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const vep = await prisma.vep.update({ where: { id }, data: body });
  return NextResponse.json(vep);
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  await prisma.vep.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
