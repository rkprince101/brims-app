import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const jobCardId = searchParams.get("jobCardId");
    const where = jobCardId ? { jobCardId, userId: user.userId } : { userId: user.userId };
    const ions = await prisma.ion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { requestedSpares: true },
    });
    return NextResponse.json(ions);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { spares, ...ionData } = body;

    const ion = await prisma.ion.create({
      data: {
        ...ionData,
        userId: user.userId,
        ...(spares && spares.length > 0 && {
          requestedSpares: {
            create: spares.map((s) => ({
              spareName: s.spareName,
              partNumber: s.partNumber,
              quantityRequested: s.quantityRequested,
              jobCardId: ionData.jobCardId,
              userId: user.userId,
            })),
          },
        }),
      },
      include: {
        requestedSpares: true,
      },
    });

    return NextResponse.json(ion);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
