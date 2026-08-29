import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El frontend corre en :5173 y habla con el backend en :3001.
// Todas las llamadas a /api se redirigen al backend vía proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
