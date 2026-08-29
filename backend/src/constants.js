// Rutas de pasajes por defecto (tren y bus), replicando el Excel original.
export const DEFAULT_ROUTES = [
  { routeKey: "trenIda", label: "Tren ida", cost: 0.75 },
  { routeKey: "trenVuelta", label: "Tren regreso", cost: 0.75 },
  { routeKey: "tc", label: "T - C", cost: 1 },
  { routeKey: "tu", label: "T - U", cost: 1.5 },
  { routeKey: "cu", label: "C - U", cost: 2 },
  { routeKey: "uc", label: "U - C", cost: 2 },
];

// Días por defecto al crear una semana nueva (lunes a viernes).
export const DEFAULT_DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Categorías de gasto válidas (deben coincidir con el enum Category de Prisma).
export const CATEGORIES = ["COMIDA", "SERVICIOS", "OCIO", "SALUD", "OTROS"];
