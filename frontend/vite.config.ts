import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Dev server proxies /api to the SAT-SA backend so the browser only talks to one origin
// (no CORS, no external network). Override the target with SATSA_API=http://host:port.
const api = process.env.SATSA_API ?? "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { host: "127.0.0.1", port: 5173, proxy: { "/api": { target: api, changeOrigin: true } } },
  preview: { host: "127.0.0.1", port: 4173, proxy: { "/api": { target: api, changeOrigin: true } } },
});
