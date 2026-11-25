import type { CapacitorConfig } from "@capacitor/cli";

// Not used by the PWA. It makes the app ready to be wrapped as a native iOS app:
// `pnpm exec cap add ios`, then `pnpm build && pnpm exec cap sync`.
const config: CapacitorConfig = {
  appId: "com.adrienpoly.timer",
  appName: "Timer",
  webDir: "dist",
};

export default config;
