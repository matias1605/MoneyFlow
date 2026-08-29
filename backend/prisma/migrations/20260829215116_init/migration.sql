-- CreateEnum
CREATE TYPE "Category" AS ENUM ('COMIDA', 'SERVICIOS', 'OCIO', 'SALUD', 'OTROS');

-- CreateTable
CREATE TABLE "periods" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "transitDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incomes" (
    "id" SERIAL NOT NULL,
    "periodId" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "date" DATE,

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "periodId" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "periodId" INTEGER NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'OTROS',
    "description" TEXT NOT NULL DEFAULT '',
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "date" DATE,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_costs" (
    "id" SERIAL NOT NULL,
    "periodId" INTEGER NOT NULL,
    "routeKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "route_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit_weeks" (
    "id" SERIAL NOT NULL,
    "periodId" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "startDate" DATE,
    "endDate" DATE,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "transit_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit_days" (
    "id" SERIAL NOT NULL,
    "weekId" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "transit_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit_marks" (
    "id" SERIAL NOT NULL,
    "dayId" INTEGER NOT NULL,
    "routeKey" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transit_marks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incomes_periodId_idx" ON "incomes"("periodId");

-- CreateIndex
CREATE INDEX "subscriptions_periodId_idx" ON "subscriptions"("periodId");

-- CreateIndex
CREATE INDEX "expenses_periodId_idx" ON "expenses"("periodId");

-- CreateIndex
CREATE INDEX "route_costs_periodId_idx" ON "route_costs"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "route_costs_periodId_routeKey_key" ON "route_costs"("periodId", "routeKey");

-- CreateIndex
CREATE INDEX "transit_weeks_periodId_idx" ON "transit_weeks"("periodId");

-- CreateIndex
CREATE INDEX "transit_days_weekId_idx" ON "transit_days"("weekId");

-- CreateIndex
CREATE INDEX "transit_marks_dayId_idx" ON "transit_marks"("dayId");

-- CreateIndex
CREATE UNIQUE INDEX "transit_marks_dayId_routeKey_key" ON "transit_marks"("dayId", "routeKey");

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_costs" ADD CONSTRAINT "route_costs_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit_weeks" ADD CONSTRAINT "transit_weeks_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit_days" ADD CONSTRAINT "transit_days_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "transit_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit_marks" ADD CONSTRAINT "transit_marks_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "transit_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
