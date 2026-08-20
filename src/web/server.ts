import path from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { apiApp } from "./api";

const distDir = path.join(import.meta.dirname, "..", "..", "dist", "web");

apiApp.use("/*", serveStatic({ root: distDir }));

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: apiApp.fetch, port }, (info) => {
  console.log(`rrmap web UI: http://localhost:${info.port}`);
});
