import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  
  if (query.trim().length < 2) {
    return NextResponse.json({ veps: [], workOrders: [], jobCards: [] });
  }

  const veps = await prisma.vep.findMany({
    where: {
      OR: [
        { registrationNumber: { contains: query } },
        { name: { contains: query } },
        { engineNumber: { contains: query } },
        { chassisNumber: { contains: query } },
      ],
    },
    take: 20,
  });

  const workOrders = await prisma.workOrder.findMany({
    where: {
      workOrderNumber: { contains: query },
    },
    include: { vep: true },
    take: 20,
  });

  const jobCards = await prisma.jobCard.findMany({
    where: {
      jobCardNumber: { contains: query },
    },
    include: { workOrder: { include: { vep: true } } },
    take: 20,
  });

  return NextResponse.json({ veps, workOrders, jobCards });
}
