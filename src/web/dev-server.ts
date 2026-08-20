import type { BunRequest } from "bun";
import { apiRoutes } from "./api";
import index from "./index.html";

const routes: Record<string, unknown> = { "/": index };
for (const [pattern, methods] of Object.entries(apiRoutes)) {
  const wrapped: Record<string, (req: BunRequest) => Promise<Response>> = {};
  for (const [method, handler] of Object.entries(methods)) {
    wrapped[method] = (req) => handler(req, req.params);
  }
  routes[pattern] = wrapped;
}

const server = Bun.serve({
  routes,
  development: true,
} as Bun.Serve.Options<undefined, never>);

console.log(`rrmap web UI (dev): ${server.url}`);
