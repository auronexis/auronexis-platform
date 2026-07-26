import "server-only";

import {
  getCatalogEntryByProductPath,
  isFastSpringProductPath,
  listPublicCatalogEntries,
  type FastSpringProductPath,
} from "@/lib/billing/catalog";
import { isFastSpringApiConfigured } from "@/lib/fastspring/env";
import { fastSpringApiFetch } from "@/lib/fastspring/http";
import { normalizeCountryCode } from "@/lib/fastspring/country";

/** Cache TTL: FastSpring FX updates ~every 6h; refresh hourly for freshness without thrashing. */
export const FASTSPRING_PRICE_CACHE_TTL_MS = 60 * 60 * 1000;

export type LocalizedPriceSource = "fastspring" | "base_usd_fallback";

export type LocalizedPlanPrice = {
  productPath: FastSpringProductPath;
  country: string;
  currency: string;
  amount: number;
  formattedAmount: string;
  interval: "month";
  source: LocalizedPriceSource;
};

type CacheEntry = {
  expiresAt: number;
  value: LocalizedPlanPrice;
};

const priceCache = new Map<string, CacheEntry>();

function cacheKey(productPath: string, country: string, currency: string | null): string {
  return `${productPath}|${country}|${currency ?? ""}`;
}

export function clearFastSpringPriceCache(): void {
  priceCache.clear();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * Parse a country pricing node from FastSpring Price API.
 * Documented fields: currency, price, display
 * https://developer.fastspring.com/reference/products
 */
export function parseFastSpringCountryPricingNode(
  node: unknown,
): { currency: string; amount: number; formattedAmount: string } | null {
  const record = asRecord(node);
  if (!record) return null;
  const currency = asString(record.currency)?.toUpperCase();
  const amount = asNumber(record.price);
  const formattedAmount = asString(record.display);
  if (!currency || amount === null || !formattedAmount) {
    return null;
  }
  return { currency, amount, formattedAmount };
}

/**
 * Extract pricing for one product/country from list or single-product responses.
 */
export function extractLocalizedPriceFromFastSpringPayload(input: {
  payload: unknown;
  productPath: FastSpringProductPath;
  country: string;
}): { currency: string; amount: number; formattedAmount: string } | null {
  const country = input.country.toUpperCase();
  const root = asRecord(input.payload);
  if (!root) return null;

  // List response: { products: [ { product, pricing: { DE: {...} } } ] }
  const products = root.products;
  if (Array.isArray(products)) {
    for (const item of products) {
      const product = asRecord(item);
      if (!product) continue;
      const path = asString(product.product)?.toLowerCase();
      if (path !== input.productPath) continue;
      const pricing = asRecord(product.pricing);
      if (!pricing) continue;
      const parsed = parseFastSpringCountryPricingNode(pricing[country]);
      if (parsed) return parsed;
    }
  }

  // Single-product wrappers may nest under pricing or return country map directly.
  const pricing = asRecord(root.pricing);
  if (pricing) {
    const byCountry = parseFastSpringCountryPricingNode(pricing[country]);
    if (byCountry) return byCountry;
  }

  const direct = parseFastSpringCountryPricingNode(root[country]);
  if (direct) return direct;

  // Some responses return a single country object at the root when filtered.
  if (asString(root.currency) && asNumber(root.price) !== null && asString(root.display)) {
    return parseFastSpringCountryPricingNode(root);
  }

  return null;
}

function buildUsdFallback(
  productPath: FastSpringProductPath,
  country: string,
): LocalizedPlanPrice {
  const entry = getCatalogEntryByProductPath(productPath);
  const amount = entry?.fallbackMonthlyUsd ?? 0;
  return {
    productPath,
    country,
    currency: "USD",
    amount,
    formattedAmount: `$${amount.toLocaleString("en-US")}`,
    interval: "month",
    source: "base_usd_fallback",
  };
}

async function fetchLocalizedPriceUncached(input: {
  productPath: FastSpringProductPath;
  country: string;
  currency?: string | null;
}): Promise<LocalizedPlanPrice> {
  const country = normalizeCountryCode(input.country) ?? "US";
  const currency = input.currency?.trim().toUpperCase() || null;

  if (!isFastSpringApiConfigured()) {
    return buildUsdFallback(input.productPath, country);
  }

  const params = new URLSearchParams({ country });
  if (currency) {
    params.set("currency", currency);
  }

  try {
    // Official: GET /products/{product_path}/price
    // https://developer.fastspring.com/reference/retrieve-a-product-price
    const result = await fastSpringApiFetch(
      `/products/${encodeURIComponent(input.productPath)}/price?${params.toString()}`,
    );

    if (!result.ok) {
      console.error("[fastspring][pricing] product price request failed", {
        productPath: input.productPath,
        country,
        httpStatus: result.status,
      });
      return buildUsdFallback(input.productPath, country);
    }

    const parsed = extractLocalizedPriceFromFastSpringPayload({
      payload: result.json,
      productPath: input.productPath,
      country,
    });

    if (!parsed) {
      console.error("[fastspring][pricing] unparseable price payload", {
        productPath: input.productPath,
        country,
      });
      return buildUsdFallback(input.productPath, country);
    }

    return {
      productPath: input.productPath,
      country,
      currency: parsed.currency,
      amount: parsed.amount,
      formattedAmount: parsed.formattedAmount,
      interval: "month",
      source: "fastspring",
    };
  } catch (error) {
    const aborted =
      error instanceof Error && (error.name === "AbortError" || /aborted/i.test(error.message));
    console.error("[fastspring][pricing] request error", {
      productPath: input.productPath,
      country,
      errorCategory: aborted ? "timeout" : "network_error",
    });
    return buildUsdFallback(input.productPath, country);
  }
}

/**
 * Localized price for one allowlisted FastSpring product path.
 * Never fabricates foreign FX — API failure falls back to base USD only.
 */
export async function getLocalizedPrice(input: {
  productPath: string;
  country: string;
  currency?: string | null;
}): Promise<LocalizedPlanPrice | null> {
  if (!isFastSpringProductPath(input.productPath)) {
    return null;
  }

  const country = normalizeCountryCode(input.country) ?? "US";
  const currency = input.currency?.trim().toUpperCase() || null;
  const key = cacheKey(input.productPath, country, currency);
  const cached = priceCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await fetchLocalizedPriceUncached({
    productPath: input.productPath,
    country,
    currency,
  });
  priceCache.set(key, { expiresAt: Date.now() + FASTSPRING_PRICE_CACHE_TTL_MS, value });
  return value;
}

/**
 * Fetch public plan prices for a country with bounded concurrency (no N+1 waterfall).
 * Prefer parallel single-product calls; list endpoint shape varies by account.
 */
export async function getPublicLocalizedPrices(input: {
  country: string;
  currency?: string | null;
}): Promise<LocalizedPlanPrice[]> {
  const country = normalizeCountryCode(input.country) ?? "US";
  const paths = listPublicCatalogEntries().map((e) => e.productPath);

  // One list call when possible to reduce round-trips.
  if (isFastSpringApiConfigured()) {
    try {
      const params = new URLSearchParams({ country });
      if (input.currency?.trim()) {
        params.set("currency", input.currency.trim().toUpperCase());
      }
      const listResult = await fastSpringApiFetch(`/products/price?${params.toString()}`);
      if (listResult.ok) {
        const fromList: LocalizedPlanPrice[] = [];
        for (const path of paths) {
          const parsed = extractLocalizedPriceFromFastSpringPayload({
            payload: listResult.json,
            productPath: path,
            country,
          });
          if (parsed) {
            const value: LocalizedPlanPrice = {
              productPath: path,
              country,
              currency: parsed.currency,
              amount: parsed.amount,
              formattedAmount: parsed.formattedAmount,
              interval: "month",
              source: "fastspring",
            };
            priceCache.set(
              cacheKey(path, country, input.currency?.trim().toUpperCase() || null),
              { expiresAt: Date.now() + FASTSPRING_PRICE_CACHE_TTL_MS, value },
            );
            fromList.push(value);
          }
        }
        if (fromList.length === paths.length) {
          return fromList;
        }
      } else {
        console.error("[fastspring][pricing] list prices failed", {
          country,
          httpStatus: listResult.status,
        });
      }
    } catch {
      console.error("[fastspring][pricing] list prices error", { country });
    }
  }

  return Promise.all(
    paths.map(async (productPath) => {
      const price = await getLocalizedPrice({
        productPath,
        country,
        currency: input.currency,
      });
      return price ?? buildUsdFallback(productPath, country);
    }),
  );
}

export async function getLocalizedPriceForPlanKey(input: {
  planKey: "professional" | "business" | "enterprise";
  country: string;
  currency?: string | null;
}): Promise<LocalizedPlanPrice> {
  const price = await getLocalizedPrice({
    productPath: input.planKey,
    country: input.country,
    currency: input.currency,
  });
  return price ?? buildUsdFallback(input.planKey, normalizeCountryCode(input.country) ?? "US");
}
