import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobCardId = searchParams.get("jobCardId");
    const where = jobCardId ? { jobCardId } : {};
    const procurements = await prisma.procurement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(procurements);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const procurement = await prisma.procurement.create({ data: body });
    return NextResponse.json(procurement);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
