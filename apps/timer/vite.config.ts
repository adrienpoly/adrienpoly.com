import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// The app is served from the root of its own subdomain. To build it for a
// sub-path instead, pass the base on the command line: `vite build --base=/timer/`.
// The manifest scope, start URL and service worker scope all follow the base.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "prompt": a new version waits until the user accepts it (see src/pwa/UpdatePrompt.tsx).
      registerType: "prompt",
      // Icons are generated from public/logo.svg (see pwa-assets.config.ts).
      pwaAssets: { config: true },
      // The manifest is a static file: the installed app keeps this name in every language.
      manifest: {
        name: "Sport Timer",
        short_name: "Timer",
        description: "Workout timer: Tabata, rounds and intervals.",
        lang: "en",
        display: "standalone",
        // No fixed orientation: the session screen has a landscape layout.
        orientation: "any",
        theme_color: "#0f0f14",
        background_color: "#0f0f14",
      },
      workbox: {
        // Fonts are bundled, so the app looks the same offline.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
    }),
  ],
});
