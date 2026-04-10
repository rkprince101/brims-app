import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const nac = await prisma.nac.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(nac);
}
