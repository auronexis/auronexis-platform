/**
 * Node loader: resolve `@/` → `src/` and strip TypeScript for behavioral tests.
 * Usage: node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs ...
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const helpersDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(helpersDir, "..", "..");
const srcRoot = join(rootDir, "src");

register("./ts-alias-hooks.mjs", pathToFileURL(join(helpersDir, "register-ts-alias.mjs")), {
  data: { srcRoot },
});
