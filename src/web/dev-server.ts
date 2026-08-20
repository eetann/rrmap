import { apiApp } from "./api";
import index from "./index.html";

const server = Bun.serve({
  routes: { "/": index },
  fetch: (req) => apiApp.fetch(req),
  development: true,
  // SSE (/api/events) は長時間接続を維持するため、デフォルト10秒のidleTimeoutを無効化する
  idleTimeout: 0,
});

console.log(`rrmap web UI (dev): ${server.url}`);
