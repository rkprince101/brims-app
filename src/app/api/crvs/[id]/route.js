import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const crv = await prisma.crv.update({
      where: { id, userId: user.userId },
      data: {
        voucherType: body.voucherType,
        voucherNumber: body.voucherNumber,
        vendorOrUnitName: body.vendorOrUnitName,
        receiptDate: body.receiptDate,
        procurementId: body.procurementId || null,
        jobCardId: body.jobCardId !== undefined ? body.jobCardId : undefined,
        remarks: body.remarks,
      },
      include: { crvItems: true, procurement: { select: { method: true, supplyOrderNumber: true } } },
    });
    return NextResponse.json(crv);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.crv.delete({ where: { id, userId: user.userId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
