import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const veps = await prisma.vep.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(veps);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const vep = await prisma.vep.create({ data: { ...body, userId: user.userId } });
    return NextResponse.json(vep);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { veps } = body;
    if (!Array.isArray(veps) || veps.length === 0) {
      return NextResponse.json({ error: "Invalid payload: expected array of veps" }, { status: 400 });
    }

    const created = [];
    const skipped = [];
    const errors = [];

    for (const vep of veps) {
      try {
        const record = await prisma.vep.create({ data: { ...vep, userId: user.userId } });
        created.push(record);
      } catch (e) {
        if (e.code === "P2002") {
          skipped.push({ registrationNumber: vep.registrationNumber, reason: "Duplicate registration number" });
        } else {
          errors.push({ registrationNumber: vep.registrationNumber, error: e.message });
        }
      }
    }

    return NextResponse.json({ created, skipped, errors });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
