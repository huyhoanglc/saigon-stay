import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Web khách chạy cổng 5173, web admin chạy cổng 5174
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
