import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobCardId = searchParams.get("jobCardId");
  const where = jobCardId ? { jobCardId } : {};
  const ions = await prisma.ion.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(ions);
}

export async function POST(req) {
  const body = await req.json();
  const { spares, ...ionData } = body;

  const ion = await prisma.ion.create({
    data: {
      ...ionData,
      ...(spares && spares.length > 0 && {
        requestedSpares: {
          create: spares.map((s) => ({
            spareName: s.spareName,
            partNumber: s.partNumber,
            quantityRequested: s.quantityRequested,
            jobCardId: ionData.jobCardId,
          })),
        },
      }),
    },
    include: {
      requestedSpares: true,
    },
  });

  return NextResponse.json(ion);
}
