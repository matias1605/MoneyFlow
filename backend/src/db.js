import { PrismaClient } from "@prisma/client";

// Una sola instancia de Prisma para toda la app.
export const prisma = new PrismaClient();
