import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [vepCount, activeWOs, openJCs, closedJCs, recentJCs] = await Promise.all([
      prisma.vep.count(),
      prisma.workOrder.count({ where: { status: { not: "COMPLETED" } } }),
      prisma.jobCard.count({ where: { status: { not: "CLOSED" } } }),
      prisma.jobCard.count({ where: { status: "CLOSED" } }),
      prisma.jobCard.findMany({
        where: { status: { not: "CLOSED" } },
        include: { workOrder: { include: { vep: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      totalVEPs: vepCount,
      activeWorkOrders: activeWOs,
      openJobCards: openJCs,
      closedJobCards: closedJCs,
      recentJobCards: recentJCs,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
