/**
 * Custom resolve hook: map `@/…` imports to `src/…` for Node behavioral tests.
 * Prefers `foo.ts` over a `foo/` directory when both exist (e.g. `@/lib/env`).
 */
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

let srcRoot = null;
let helpersDir = null;

export async function initialize(data) {
  srcRoot = data?.srcRoot ?? null;
  helpersDir = dirname(fileURLToPath(import.meta.url));
}

function resolveAlias(specifier) {
  if (!srcRoot || !specifier.startsWith("@/")) {
    return null;
  }
  const rel = specifier.slice(2);
  const candidates = [
    join(srcRoot, `${rel}.ts`),
    join(srcRoot, `${rel}.tsx`),
    join(srcRoot, `${rel}.js`),
    join(srcRoot, rel, "index.ts"),
    join(srcRoot, rel),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  return pathToFileURL(join(srcRoot, `${rel}.ts`)).href;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    const stub = join(helpersDir ?? process.cwd(), "server-only-stub.mjs");
    return {
      shortCircuit: true,
      url: pathToFileURL(stub).href,
    };
  }
  const aliased = resolveAlias(specifier);
  if (aliased) {
    return nextResolve(aliased, context);
  }
  return nextResolve(specifier, context);
}
