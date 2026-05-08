import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const wo = await prisma.workOrder.update({
      where: { id, userId: user.userId },
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
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.workOrder.delete({ where: { id, userId: user.userId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { closingRemark } = body;
    if (!closingRemark || !closingRemark.trim()) {
      return NextResponse.json({ error: "Closing remark is required" }, { status: 400 });
    }
    const wo = await prisma.workOrder.update({
      where: { id, userId: user.userId },
      data: { status: "CLOSED_BY_RCC", closingRemark, closedDate: new Date().toISOString().split("T")[0] },
      include: { vep: true },
    });
    return NextResponse.json(wo);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
