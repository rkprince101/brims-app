import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    await prisma.ion.update({
      where: { id },
      data: {
        referenceNumber: body.referenceNumber,
        dateRequested: body.dateRequested,
        remarks: body.remarks,
      },
    });

    if (body.spares) {
      const existingSpares = await prisma.requestedSpare.findMany({ where: { ionId: id } });
      const incomingIds = body.spares.map((s) => s.id).filter(Boolean);
      
      // Delete spares that are no longer in the list
      const toDelete = existingSpares.filter((s) => !incomingIds.includes(s.id));
      if (toDelete.length > 0) {
        await prisma.requestedSpare.deleteMany({
          where: { id: { in: toDelete.map((s) => s.id) } },
        });
      }

      // Identify the jobCardId safely
      const ionInfo = await prisma.ion.findUnique({ where: { id }, select: { jobCardId: true } });

      // Upsert incoming spares
      for (const spare of body.spares) {
        if (spare.id) {
          await prisma.requestedSpare.update({
            where: { id: spare.id },
            data: {
              spareName: spare.spareName,
              partNumber: spare.partNumber,
              quantityRequested: spare.quantityRequested,
            },
          });
        } else {
          await prisma.requestedSpare.create({
            data: {
              jobCardId: ionInfo.jobCardId,
              ionId: id,
              spareName: spare.spareName,
              partNumber: spare.partNumber,
              quantityRequested: spare.quantityRequested,
            },
          });
        }
      }
    }

    const updatedIon = await prisma.ion.findUnique({
      where: { id },
      include: { requestedSpares: true },
    });

    return NextResponse.json(updatedIon);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.ion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
