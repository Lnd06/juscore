import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icone.png", "icone-192.png", "icone-512.png"],
      manifest: {
        name: "JusCore AI",
        short_name: "JusCore",
        description: "Seu ecossistema jurídico inteligente operado por IA.",
        theme_color: "#0B0F19",
        background_color: "#0B0F19",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "icone-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icone-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api/],
        // Garante que o novo SW assume controle imediatamente
        skipWaiting: true,
        clientsClaim: true,
        // Remove caches antigas automaticamente
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
