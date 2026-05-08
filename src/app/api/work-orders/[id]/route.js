import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const wo = await prisma.workOrder.update({
      where: { id },
      data: body,
      include: { vep: true },
    });
    return NextResponse.json(wo);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.workOrder.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { closingRemark } = body;
    if (!closingRemark || !closingRemark.trim()) {
      return NextResponse.json({ error: "Closing remark is required" }, { status: 400 });
    }
    const wo = await prisma.workOrder.update({
      where: { id },
      data: { status: "CLOSED_BY_RCC", closingRemark, closedDate: new Date().toISOString().split("T")[0] },
      include: { vep: true },
    });
    return NextResponse.json(wo);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
