import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { getWebDistDir } from "../paths";
import { apiApp } from "./api";
import { openBrowser } from "./open-browser";

const distDir = getWebDistDir();

apiApp.use("/*", serveStatic({ root: distDir }));

// SPAなので、URLパスで表現している画面はすべて同じindex.htmlを返す
const serveIndexHtml = serveStatic({ root: distDir, path: "index.html" });
apiApp.get("/tasks", serveIndexHtml);
apiApp.get("/tasks/:id", serveIndexHtml);
apiApp.get("/milestones", serveIndexHtml);
apiApp.get("/milestones/:id", serveIndexHtml);

export function startServer(port?: number, open?: boolean) {
  // port未指定時は0を渡し、OSに空きポートを選ばせる
  const server = serve({ fetch: apiApp.fetch, port: port ?? 0 }, (info) => {
    const url = `http://localhost:${info.port}`;
    console.log(`rrmap web UI: ${url}`);
    if (open) {
      openBrowser(url);
    }
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
