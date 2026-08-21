import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { getWebDistDir } from "../paths";
import { apiApp } from "./api";

const distDir = getWebDistDir();

apiApp.use("/*", serveStatic({ root: distDir }));

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: apiApp.fetch, port }, (info) => {
  console.log(`rrmap web UI: http://localhost:${info.port}`);
});
