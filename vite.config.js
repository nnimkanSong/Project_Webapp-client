// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,        
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false, // dev http
        // ถ้า backend มี prefix แปลก ๆ ค่อยใส่ rewrite ได้ เช่น:
        // rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
