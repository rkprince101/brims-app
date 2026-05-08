import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(units);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const unit = await prisma.unit.create({
      data: body,
    });
    return NextResponse.json(unit);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
