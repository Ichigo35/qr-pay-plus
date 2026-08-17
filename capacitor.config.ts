import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "la.qrpay.app",
  appName: "QR Pay Laos",
  // Build with `npm run build:mobile` before `npx cap sync` — it produces a
  // self-contained dist/client (real index.html, no remote server.url) that
  // Capacitor bundles into the native app so it runs fully offline.
  webDir: "dist/client",
  ios: { contentInset: "always" },
  android: { allowMixedContent: false },
  plugins: {
    Camera: {
      // Permissions demandées uniquement à l'usage.
      permissions: ["camera", "photos"],
    },
  },
};

export default config;
