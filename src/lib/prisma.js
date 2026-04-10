import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import path from "path";

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = globalForPrisma.prisma;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
