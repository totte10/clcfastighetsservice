import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,webp}"], // ❌ tog bort png här
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },

      manifest: {
        name: "CLC – Maskinsopning & Framblåsning",
        short_name: "CLC",
        description: "Hantera maskinsopning, framblåsning och tidrapportering",
        theme_color: "#1a1a2e",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",

        icons: [
          {
            src: "/clc-logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/clc-logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
