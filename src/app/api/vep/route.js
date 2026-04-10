import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const veps = await prisma.vep.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(veps);
}

export async function POST(req) {
  const body = await req.json();
  const vep = await prisma.vep.create({ data: body });
  return NextResponse.json(vep);
}
