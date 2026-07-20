import type { NextResponse } from "next/server";
import { paginateArray } from "@/lib/api/pagination/cursor";
import { apiPaginated } from "@/lib/api/responses/json";
import {
  applyListFilters,
  parseListQuery,
  sortByField,
  type ApiListQuery,
} from "@/lib/api/validation/query";

type FilterFieldMap<T extends Record<string, unknown>> = {
  status?: keyof T;
  client?: keyof T;
  owner?: keyof T;
  severity?: keyof T;
  priority?: keyof T;
  createdAt?: keyof T;
  updatedAt?: keyof T;
};

type PaginatedListOptions<T extends Record<string, unknown>> = {
  request: Request;
  items: T[];
  fieldMap?: FilterFieldMap<T>;
  getSortValue: (item: T) => string;
  getCursorValue?: (item: T) => string;
  /** When set, skip parseListQuery and reuse an already-parsed query. */
  query?: ApiListQuery;
};

/**
 * Shared v1 list pipeline: parse → filter → sort → paginate → apiPaginated.
 * Preserves existing response shape used by Public API list endpoints.
 */
export function respondWithPaginatedList<T extends Record<string, unknown>>(
  options: PaginatedListOptions<T>,
): NextResponse {
  const query = options.query ?? parseListQuery(options.request);
  let items = options.items;

  if (options.fieldMap) {
    items = applyListFilters(items, query, options.fieldMap);
  }

  items = sortByField(items, options.getSortValue, query.sort);

  return apiPaginated(
    paginateArray(items, {
      limit: query.limit,
      cursor: query.cursor,
      getCursorValue: options.getCursorValue ?? ((item) => String(item.id)),
    }),
  );
}
