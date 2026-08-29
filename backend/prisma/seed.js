import { PrismaClient } from "@prisma/client";
import { DEFAULT_ROUTES } from "../src/constants.js";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.period.count();
  if (existing > 0) {
    console.log(`Ya hay ${existing} periodo(s); no se agrega seed.`);
    return;
  }

  const period = await prisma.period.create({
    data: {
      label: "Septiembre 31 - 25",
      startDate: new Date("2025-08-31T00:00:00.000Z"),
      endDate: new Date("2025-09-25T00:00:00.000Z"),
      routeCosts: { create: DEFAULT_ROUTES },
      subscriptions: { create: [{ name: "Claude", amount: 88.31 }] },
      incomes: {
        create: [
          { label: "1ra quincena", amount: 275 },
          { label: "2da quincena", amount: 275 },
        ],
      },
      weeks: {
        create: [
          {
            label: "Semana 1",
            orderIndex: 0,
            days: {
              create: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((l, i) => ({
                label: l,
                orderIndex: i,
              })),
            },
          },
        ],
      },
    },
  });

  console.log(`Seed listo. Periodo creado: "${period.label}" (id ${period.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
