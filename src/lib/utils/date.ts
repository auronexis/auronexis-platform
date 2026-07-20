import { formatAppDate } from "@/lib/i18n/date";
import type { AppLocale } from "@/lib/i18n/types";

export function formatDistanceToNow(date: Date, locale: AppLocale = "en"): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatAppDate(date.toISOString(), locale);
}
