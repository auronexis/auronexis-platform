export type ApiSortDirection = "asc" | "desc";

export type ApiListQuery = {
  limit: number;
  cursor: string | null;
  sort: ApiSortDirection;
  status?: string;
  client?: string;
  owner?: string;
  severity?: string;
  priority?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
};

function readParam(url: URL, key: string): string | undefined {
  const value = url.searchParams.get(key);
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function parseListQuery(request: Request): ApiListQuery {
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 25;
  const sort = url.searchParams.get("sort") === "asc" ? "asc" : "desc";

  return {
    limit,
    cursor: url.searchParams.get("cursor"),
    sort,
    status: readParam(url, "status"),
    client: readParam(url, "client"),
    owner: readParam(url, "owner"),
    severity: readParam(url, "severity"),
    priority: readParam(url, "priority"),
    createdAfter: readParam(url, "created_after"),
    createdBefore: readParam(url, "created_before"),
    updatedAfter: readParam(url, "updated_after"),
    updatedBefore: readParam(url, "updated_before"),
  };
}

export function applyListFilters<T extends Record<string, unknown>>(
  items: T[],
  query: ApiListQuery,
  fieldMap: {
    status?: keyof T;
    client?: keyof T;
    owner?: keyof T;
    severity?: keyof T;
    priority?: keyof T;
    createdAt?: keyof T;
    updatedAt?: keyof T;
  },
): T[] {
  return items.filter((item) => {
    if (query.status && fieldMap.status && String(item[fieldMap.status]) !== query.status) {
      return false;
    }
    if (query.client && fieldMap.client && String(item[fieldMap.client]) !== query.client) {
      return false;
    }
    if (query.owner && fieldMap.owner && String(item[fieldMap.owner]) !== query.owner) {
      return false;
    }
    if (query.severity && fieldMap.severity && String(item[fieldMap.severity]) !== query.severity) {
      return false;
    }
    if (query.priority && fieldMap.priority && String(item[fieldMap.priority]) !== query.priority) {
      return false;
    }

    const createdAt = fieldMap.createdAt ? String(item[fieldMap.createdAt] ?? "") : "";
    if (query.createdAfter && createdAt && createdAt < query.createdAfter) return false;
    if (query.createdBefore && createdAt && createdAt > query.createdBefore) return false;

    const updatedAt = fieldMap.updatedAt ? String(item[fieldMap.updatedAt] ?? "") : "";
    if (query.updatedAfter && updatedAt && updatedAt < query.updatedAfter) return false;
    if (query.updatedBefore && updatedAt && updatedAt > query.updatedBefore) return false;

    return true;
  });
}

export function sortByField<T>(
  items: T[],
  getValue: (item: T) => string,
  direction: ApiSortDirection,
): T[] {
  return [...items].sort((a, b) => {
    const left = getValue(a);
    const right = getValue(b);
    if (left === right) return 0;
    const result = left < right ? -1 : 1;
    return direction === "asc" ? result : -result;
  });
}
