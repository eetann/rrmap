import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { getWebDistDir } from "../paths";
import { apiApp } from "./api";

const distDir = getWebDistDir();

apiApp.use("/*", serveStatic({ root: distDir }));

export function startServer(port?: number) {
  // port未指定時は0を渡し、OSに空きポートを選ばせる
  const server = serve({ fetch: apiApp.fetch, port: port ?? 0 }, (info) => {
    console.log(`rrmap web UI: http://localhost:${info.port}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (port !== undefined && error.code === "EADDRINUSE") {
      console.error(
        `ポート ${port} は使用中です。別のポートを指定するか、--portを省略してください。`,
      );
      process.exit(1);
    }
    throw error;
  });
}
