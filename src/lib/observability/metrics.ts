import { logger } from "@/lib/observability/logger";

type MetricValue = number;

/** Record a lightweight metric sample — in-memory safe logging only. */
export function trackMetric(name: string, value: MetricValue, tags?: Record<string, string>): void {
  logger.info(`metric:${name}`, { value, ...tags });
}
