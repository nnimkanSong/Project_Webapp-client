// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",                     // สำคัญมาก! ให้ asset path ถูกตอน deploy
  server: {
    port: 5174,
    proxy: {
      // ใช้เฉพาะตอน dev เท่านั้น
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
