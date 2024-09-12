import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as any as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

export default prisma;
