import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db