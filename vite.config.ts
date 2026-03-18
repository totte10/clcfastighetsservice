import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true as const,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,webp,jpg,jpeg}"],
        globIgnores: [
          "**/pwa-192x192.png",
          "**/pwa-512x512.png",
          "**/favicon.png",
          "**/clc-logo.png",
          "**/apple-touch-icon.png",
        ],
        navigateFallbackDenylist: [/^\/~oauth/],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      manifest: {
        name: "CLC – Field Service Manager",
        short_name: "CLC",
        description: "AI-powered field service management for projects, planning, maps, and route work.",
        theme_color: "#0b0d12",
        background_color: "#0b0d12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/green-logo.jpg",
            sizes: "1600x1600",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "/green-logo.jpg",
            sizes: "1600x1600",
            type: "image/jpeg",
            purpose: "maskable",
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
});
