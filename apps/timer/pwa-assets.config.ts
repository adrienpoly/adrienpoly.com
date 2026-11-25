import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// public/logo.svg already has its own background and margins, so no extra padding is added.
const background = "#0f0f14";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background } },
  },
  images: ["public/logo.svg"],
});
