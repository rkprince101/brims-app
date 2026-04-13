import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const veps = await prisma.vep.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(veps);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const vep = await prisma.vep.create({ data: body });
    return NextResponse.json(vep);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
