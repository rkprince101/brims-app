import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    
    if (query.trim().length < 2) {
      return NextResponse.json({ veps: [], workOrders: [], jobCards: [] });
    }

    const veps = await prisma.vep.findMany({
      where: {
        userId: user.userId,
        OR: [
          { registrationNumber: { contains: query, mode: "insensitive" } },
          { oem: { contains: query, mode: "insensitive" } },
          { model: { contains: query, mode: "insensitive" } },
          { engineNumber: { contains: query, mode: "insensitive" } },
          { chassisNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    });

    const workOrders = await prisma.workOrder.findMany({
      where: {
        userId: user.userId,
        workOrderNumber: { contains: query, mode: "insensitive" },
      },
      include: { vep: true },
      take: 20,
    });

    const jobCards = await prisma.jobCard.findMany({
      where: {
        userId: user.userId,
        jobCardNumber: { contains: query, mode: "insensitive" },
      },
      include: { workOrder: { include: { vep: true } } },
      take: 20,
    });

    return NextResponse.json({ veps, workOrders, jobCards });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
