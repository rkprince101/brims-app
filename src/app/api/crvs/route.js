import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobCardId = searchParams.get("jobCardId");
  
  const where = jobCardId ? { jobCardId } : {};
  
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
}

export async function POST(req) {
  const body = await req.json();
  const { items, ...crvData } = body;
  
  const crv = await prisma.crv.create({
    data: {
      ...crvData,
      crvItems: {
        create: items || []
      }
    },
    include: {
      crvItems: true,
    }
  });
  
  return NextResponse.json(crv);
}
