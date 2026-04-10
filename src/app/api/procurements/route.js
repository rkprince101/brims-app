import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobCardId = searchParams.get("jobCardId");
  if (!jobCardId) return NextResponse.json([]);
  const procurements = await prisma.procurement.findMany({
    where: { jobCardId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(procurements);
}

export async function POST(req) {
  const body = await req.json();
  const procurement = await prisma.procurement.create({ data: body });
  return NextResponse.json(procurement);
}
