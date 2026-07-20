/**
 * Run async mappers with a concurrency cap while preserving input order.
 * Nullish mapper results are dropped (same semantics as a filtered Promise.all map).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R | null | undefined>,
): Promise<R[]> {
  const limit = Math.max(1, Math.floor(concurrency));
  const results: Array<R | null | undefined> = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);

  return results.filter((value): value is R => value != null);
}
