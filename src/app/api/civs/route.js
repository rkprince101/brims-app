import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobCardId = searchParams.get("jobCardId");
    
    const where = jobCardId ? { jobCardId } : {};
    
    const civs = await prisma.civ.findMany({
      where,
      include: { jobCard: { select: { jobCardNumber: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(civs);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const civ = await prisma.civ.create({ data: body });
    return NextResponse.json(civ);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
