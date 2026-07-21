import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const apiTarget = process.env.VITE_API_PROXY || "http://localhost:3001";
  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 8080,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "robots.txt",
          "pwa-icon-192.png",
          "pwa-icon-512.png",
          "apple-touch-icon.png",
        ],
        manifest: {
          name: "LetterCraft — Конструктор писем",
          short_name: "LetterCraft",
          description: "Конструктор корпоративных писем на фирменном бланке",
          theme_color: "#F18F50",
          background_color: "#121027",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/pwa-icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/v1\/brand\/.*\/file$/,
              handler: "CacheFirst",
              options: {
                cacheName: "brand-assets",
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
        devOptions: {
          enabled: mode !== "production" && process.env.VITE_PWA_DEV === "1",
        },
      }),
    ],
  };
});
