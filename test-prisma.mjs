import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const adapter = new PrismaBetterSqlite3({ url: `file:${join(__dirname, "dev.db")}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.vep.count();
  console.log("Count:", count);
}

main().catch(console.error);
