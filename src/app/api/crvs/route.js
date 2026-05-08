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
    
    const crvs = await prisma.crv.findMany({
      where,
      include: {
        crvItems: {
          include: {
            requestedSpare: { select: { spareName: true } }
          }
        },
        procurement: { select: { method: true, supplyOrderNumber: true } },
        jobCard: { select: { jobCardNumber: true } }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(crvs);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { items, ...crvData } = body;
    
    const crv = await prisma.crv.create({
      data: {
        ...crvData,
        userId: user.userId,
        crvItems: {
          create: (items || []).map((item) => ({ ...item, userId: user.userId })),
        }
      },
      include: {
        crvItems: true,
      }
    });
    
    return NextResponse.json(crv);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
