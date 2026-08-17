// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isMobileBuild = process.env.MOBILE_BUILD === "1";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(isMobileBuild ? { spa: { enabled: true } } : {}),
  },
  // Cloudflare/nitro is only needed for the web deploy target. The mobile
  // (Capacitor) build skips it so TanStack Start emits its own plain,
  // Node-runnable server bundle, which its SPA-prerender step can actually
  // import and run locally to produce a real static dist/client/index.html.
  nitro: isMobileBuild ? false : undefined,
});
