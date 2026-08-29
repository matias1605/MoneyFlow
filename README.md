# Moneyflow

App personal para administrar mis finanzas **periodo a periodo**: sueldo quincenal (monto
variable), pasajes de tren/bus, suscripciones y gastos por categoría. Proyecto de un solo usuario.

Basado en mi Excel `BALANCE GENERAL.xlsx`, pero como aplicación real con base de datos.

## Stack

- **Backend:** Node.js + Express + Prisma ORM
- **Base de datos:** PostgreSQL
- **Frontend:** React + Vite
- Lenguaje: JavaScript (ESM) en back y front

## Estructura

```
Moneyflow/
  backend/     API REST (Express + Prisma)
  frontend/    Interfaz (React + Vite)
  package.json workspaces: corre back y front juntos con "npm run dev"
```

## Requisitos

- Node.js 18+ (probado con v22)
- PostgreSQL 14+ corriendo localmente

## Puesta en marcha

1. **Instalar dependencias** (desde la raíz):

   ```bash
   npm install
   ```

2. **Crear la base de datos** `moneyflow` en PostgreSQL. Por ejemplo, con `psql`:

   ```bash
   createdb -U postgres moneyflow
   ```

   (o creala desde pgAdmin).

3. **Configurar credenciales.** Copiá `backend/.env.example` a `backend/.env` y completá tu
   contraseña de PostgreSQL:

   ```
   DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/moneyflow?schema=public"
   ```

   > `backend/.env` está en `.gitignore` y **nunca** se sube al repo.

4. **Crear las tablas** (migración) y opcionalmente cargar un periodo de ejemplo:

   ```bash
   npm run prisma:migrate      # crea las tablas
   npm run prisma:seed         # (opcional) primer periodo de ejemplo
   ```

5. **Correr la app** (backend + frontend juntos):

   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - API: http://localhost:3001/api

## Importar / Exportar Excel

En la barra lateral (tarjeta **Excel**):

- **Exportar este periodo** — baja un `.xlsx` con todo el detalle del periodo actual
  (ingresos, pasajes, suscripciones, gastos, costos de ruta y resumen). Este archivo es de
  **ida y vuelta**: podés editarlo y volver a importarlo.
- **Exportar todos (resumen)** — baja un `.xlsx` con una fila por periodo y sus totales
  (ingresos, gastos, saldo y desglose por categoría). Ideal para respaldo y análisis.
- **Importar periodo** — subís un `.xlsx` con el formato que exporta Moneyflow y crea un
  periodo nuevo con esos datos.

> La importación espera el formato propio de Moneyflow (las hojas `Periodo`, `Ingresos`,
> `Suscripciones`, `Gastos`, `PasajesCostos`, `PasajesUso`). La forma más segura de obtenerlo
> es exportar un periodo, editarlo y volver a subirlo.

## Modelo de datos

- **Period** — un periodo con fechas editables (no es un mes calendario; ej. 31 ago – 25 sep).
- **Income** — cada pago de sueldo (quincenas, 2+ por periodo, monto variable).
- **Subscription** — cargos recurrentes (ej. Claude).
- **Expense** — gastos por categoría (Comida, Servicios, Ocio, Salud, Otros).
- **RouteCost / TransitWeek / TransitDay / TransitMark** — la calculadora de pasajes:
  costos por ruta, semanas con fechas editables, días y las marcas (checkboxes) de uso.

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Corre backend y frontend a la vez |
| `npm run prisma:migrate` | Aplica migraciones (crea/actualiza tablas) |
| `npm run prisma:seed` | Carga un periodo de ejemplo |
| `npm run prisma:studio` | Abre Prisma Studio para ver/editar la base |
| `npm run build` | Compila el frontend para producción |
