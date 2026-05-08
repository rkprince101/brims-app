import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const uid = user.userId;

    const [vepCount, activeWOs, openJCs, closedJCs, recentJCs] = await Promise.all([
      prisma.vep.count({ where: { userId: uid } }),
      prisma.workOrder.count({ where: { userId: uid, status: { not: "COMPLETED" } } }),
      prisma.jobCard.count({ where: { userId: uid, status: { not: "CLOSED" } } }),
      prisma.jobCard.count({ where: { userId: uid, status: "CLOSED" } }),
      prisma.jobCard.findMany({
        where: { userId: uid, status: { not: "CLOSED" } },
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
