import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: "/",

  server: {
    port: 5174,
    proxy: {
      // ✅ ใช้เฉพาะตอน dev
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    sourcemap: true,
    target: "es2018",
    cssTarget: "es2018",
    chunkSizeWarningLimit: 900,
    minify: mode === "production" ? "esbuild" : false,

    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          nivo: ["@nivo/core", "@nivo/pie", "@nivo/line", "@nivo/bar"],
          mui: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
        },
      },
    },
  },

  define: {
    "process.env": {},
  },
}));
