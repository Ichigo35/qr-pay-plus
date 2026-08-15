import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "la.qrpay.app",
  appName: "QR Pay Laos",
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
