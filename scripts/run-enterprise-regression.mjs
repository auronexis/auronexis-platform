#!/usr/bin/env node
/**
 * Enterprise regression runner — executes the curated Build Bible + domain suites.
 * Usage: node scripts/run-enterprise-regression.mjs
 */

import { spawnSync } from "node:child_process";
import { ENTERPRISE_REGRESSION_SUITE, rootDir } from "./_test-helpers/read-source.mjs";

const result = spawnSync(process.execPath, ["--test", ...ENTERPRISE_REGRESSION_SUITE], {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
