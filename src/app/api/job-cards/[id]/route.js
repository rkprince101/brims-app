import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const MASTER_PASSWORD = "rishikesh.prince";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const jc = await prisma.jobCard.findUnique({
      where: { id },
      include: { workOrder: { include: { vep: true } }, relatedJobCard: true },
    });
    if (!jc) {
      return NextResponse.json({ error: "Job card not found" }, { status: 404 });
    }
    return NextResponse.json(jc);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { _password, relatedJobCard, ...updates } = body;

    const existing = await prisma.jobCard.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Job card not found" }, { status: 404 });
    }

    const isUnlink = Object.keys(updates).length === 1 && updates.relatedJobCardId === null;

    if ((existing.status === "CLOSED" || existing.status === "CLOSED_BY_RCC") && _password !== MASTER_PASSWORD && !isUnlink) {
      return NextResponse.json({ error: "This job card is closed. Enter master password to make changes." }, { status: 403 });
    }

    const jc = await prisma.jobCard.update({
      where: { id },
      data: updates,
      include: { workOrder: { include: { vep: true } }, relatedJobCard: true },
    });
    return NextResponse.json(jc);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
