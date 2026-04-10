import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobCardId = searchParams.get("jobCardId");
  if (!jobCardId) return NextResponse.json([]);
  const spares = await prisma.requestedSpare.findMany({
    where: { jobCardId },
    include: { ion: { select: { referenceNumber: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(spares);
}

export async function POST(req) {
  const body = await req.json();
  const spare = await prisma.requestedSpare.create({
    data: body,
    include: { ion: { select: { referenceNumber: true } } },
  });
  return NextResponse.json(spare);
}
