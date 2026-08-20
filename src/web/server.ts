import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { apiRoutes } from "./api";
import { compileRoutes, matchRoute } from "./router";

const distDir = path.join(import.meta.dirname, "..", "..", "dist", "web");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

async function serveStatic(pathname: string): Promise<Response | null> {
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const filePath = path.join(distDir, relativePath);
  if (!filePath.startsWith(distDir)) {
    return null;
  }
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    return new Response(data, {
      headers: { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" },
    });
  } catch {
    return null;
  }
}

const compiledRoutes = compileRoutes(apiRoutes);

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const matched = matchRoute(compiledRoutes, url.pathname, request.method);
  if (matched) {
    return matched.handler(request, matched.params);
  }
  const staticResponse = await serveStatic(url.pathname);
  if (staticResponse) {
    return staticResponse;
  }
  return new Response("Not Found", { status: 404 });
}

function toWebRequest(nodeReq: IncomingMessage): Request {
  const host = nodeReq.headers.host ?? "localhost";
  const url = `http://${host}${nodeReq.url ?? "/"}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeReq.headers)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else {
      headers.set(key, value);
    }
  }
  const hasBody = nodeReq.method !== "GET" && nodeReq.method !== "HEAD";
  return new Request(url, {
    method: nodeReq.method,
    headers,
    body: hasBody ? (Readable.toWeb(nodeReq) as unknown as ReadableStream) : undefined,
    duplex: hasBody ? "half" : undefined,
  } as RequestInit);
}

async function writeWebResponse(response: Response, nodeRes: ServerResponse): Promise<void> {
  nodeRes.statusCode = response.status;
  response.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value);
  });
  if (!response.body) {
    nodeRes.end();
    return;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  nodeRes.end(buffer);
}

const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (nodeReq, nodeRes) => {
  try {
    const request = toWebRequest(nodeReq);
    const response = await handleRequest(request);
    await writeWebResponse(response, nodeRes);
  } catch (error) {
    console.error(error);
    nodeRes.statusCode = 500;
    nodeRes.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`rrmap web UI: http://localhost:${port}`);
});
