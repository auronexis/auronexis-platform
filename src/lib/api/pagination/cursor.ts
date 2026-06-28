export type PaginatedResult<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export function encodeCursor(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | null): string | null {
  if (!cursor) {
    return null;
  }

  try {
    return Buffer.from(cursor, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function paginateArray<T>(
  items: T[],
  options: {
    limit: number;
    cursor: string | null;
    getCursorValue: (item: T) => string;
  },
): PaginatedResult<T> {
  const limit = Math.min(Math.max(options.limit, 1), 100);
  let startIndex = 0;

  if (options.cursor) {
    const decoded = decodeCursor(options.cursor);
    if (decoded) {
      const index = items.findIndex((item) => options.getCursorValue(item) === decoded);
      startIndex = index >= 0 ? index + 1 : 0;
    }
  }

  const slice = items.slice(startIndex, startIndex + limit);
  const last = slice[slice.length - 1];
  const hasMore = startIndex + limit < items.length;

  return {
    data: slice,
    nextCursor: hasMore && last ? encodeCursor(options.getCursorValue(last)) : null,
    hasMore,
  };
}
