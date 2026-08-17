// Promotes the SPA prerender shell to the app's real entry point.
//
// `vite build` with MOBILE_BUILD=1 (see vite.config.ts) emits a fully
// self-contained, hydratable document at dist/client/_shell.html — real
// <head> tags, preloaded assets, and the client bootstrap script, with no
// dependency on a running server. Since every route in this app renders
// entirely client-side (local storage only, no server loaders), that shell
// is a valid entry point for any route. Capacitor just needs it at
// dist/client/index.html.
import { rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const clientDir = fileURLToPath(new URL("../dist/client", import.meta.url));
const shellPath = path.join(clientDir, "_shell.html");
const indexPath = path.join(clientDir, "index.html");

await rename(shellPath, indexPath);
console.log(`[finalize-mobile-build] dist/client/_shell.html -> dist/client/index.html`);
