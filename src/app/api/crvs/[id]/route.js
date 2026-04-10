import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const crv = await prisma.crv.update({
    where: { id },
    data: {
      voucherType: body.voucherType,
      voucherNumber: body.voucherNumber,
      vendorOrUnitName: body.vendorOrUnitName,
      receiptDate: body.receiptDate,
      procurementId: body.procurementId || null,
      remarks: body.remarks,
    },
    include: { crvItems: true, procurement: { select: { method: true, supplyOrderNumber: true } } },
  });
  return NextResponse.json(crv);
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  await prisma.crv.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
