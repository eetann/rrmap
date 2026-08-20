import type { ApiHandler } from "./api";

type CompiledRoute = {
  regex: RegExp;
  paramNames: string[];
  methods: Record<string, ApiHandler>;
};

export function compileRoutes(routes: Record<string, Record<string, ApiHandler>>): CompiledRoute[] {
  return Object.entries(routes).map(([pattern, methods]) => {
    const paramNames: string[] = [];
    const regexSource = pattern
      .split("/")
      .map((segment) => {
        if (segment.startsWith(":")) {
          paramNames.push(segment.slice(1));
          return "([^/]+)";
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");
    return { regex: new RegExp(`^${regexSource}$`), paramNames, methods };
  });
}

export function matchRoute(
  compiledRoutes: CompiledRoute[],
  pathname: string,
  method: string,
): { handler: ApiHandler; params: Record<string, string> } | null {
  for (const route of compiledRoutes) {
    const match = route.regex.exec(pathname);
    if (!match) {
      continue;
    }
    const handler = route.methods[method];
    if (!handler) {
      continue;
    }
    const params: Record<string, string> = {};
    route.paramNames.forEach((name, index) => {
      params[name] = match[index + 1] ?? "";
    });
    return { handler, params };
  }
  return null;
}
