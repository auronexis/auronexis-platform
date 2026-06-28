import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export function apiJson<T>(
  data: T,
  init?: ResponseInit & { headers?: Record<string, string> },
): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  return NextResponse.json(data, { ...init, headers });
}

export function apiPaginated<T>(payload: {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}): NextResponse {
  return apiJson(payload);
}

export function apiError(
  status: number,
  code: string,
  message: string,
  extraHeaders?: Record<string, string>,
): NextResponse {
  const body: ApiErrorBody = { error: { code, message } };
  return apiJson(body, { status, headers: extraHeaders });
}

export function apiRateLimited(retryAfterSeconds: number, limit: number): NextResponse {
  return apiError(429, "rate_limit_exceeded", "Too many requests.", {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": "0",
    "Retry-After": String(retryAfterSeconds),
  });
}
