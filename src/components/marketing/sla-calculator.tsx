"use client";

import { useId, useMemo, useState } from "react";
import {
  SLA_PERIODS,
  allowedDowntimeSeconds,
  formatDuration,
  formatPercent,
  isValidSlaPercent,
  parallelAvailability,
  periodSeconds,
  serialAvailability,
  uptimeFromDowntime,
  type SlaPeriodId,
} from "@/lib/tools/sla-calculator";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

const PRESETS = [99, 99.5, 99.9, 99.95, 99.99, 99.999] as const;

const inputClass = cn(
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white",
  "placeholder:text-primary-foreground/40",
  focusRing,
);
const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-primary-foreground/70";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6";

function parseNumber(raw: string): number {
  return Number(raw.replace(",", ".").trim());
}

function AllowedDowntime() {
  const id = useId();
  const [raw, setRaw] = useState("99.9");
  const sla = parseNumber(raw);
  const valid = raw.trim() !== "" && isValidSlaPercent(sla);

  return (
    <section className={cardClass} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-lg font-semibold text-white">
        1. Allowed downtime for an SLA
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-end">
        <label className="block" htmlFor={`${id}-sla`}>
          <span className={labelClass}>SLA / uptime target (%)</span>
          <input
            id={`${id}-sla`}
            inputMode="decimal"
            className={inputClass}
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            aria-invalid={!valid}
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Common SLA targets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRaw(String(preset))}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                sla === preset
                  ? "border-primary bg-primary/20 text-white"
                  : "border-white/15 text-primary-foreground/80 hover:bg-white/5",
                focusRing,
              )}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      {valid ? (
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-live="polite">
          {SLA_PERIODS.map((period) => (
            <div key={period.id} className="rounded-xl border border-white/10 p-3">
              <dt className="text-xs text-primary-foreground/65">Per {period.label.toLowerCase()}</dt>
              <dd className="mt-1 text-base font-semibold text-white">
                {formatDuration(allowedDowntimeSeconds(sla, period.seconds))}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-amber-300" role="alert">
          Enter a percentage between 0 and 100, for example 99.9.
        </p>
      )}
    </section>
  );
}

function AchievedUptime() {
  const id = useId();
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("90");
  const [period, setPeriod] = useState<SlaPeriodId>("month");
  const [targetRaw, setTargetRaw] = useState("99.9");

  const result = useMemo(() => {
    const h = parseNumber(hours || "0");
    const m = parseNumber(minutes || "0");
    if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || m < 0) return null;
    const downtime = h * 3600 + m * 60;
    const seconds = periodSeconds(period);
    const uptime = uptimeFromDowntime(downtime, seconds);
    const target = parseNumber(targetRaw);
    const hasTarget = targetRaw.trim() !== "" && isValidSlaPercent(target);
    const budget = hasTarget ? allowedDowntimeSeconds(target, seconds) : null;
    return { uptime, hasTarget, met: hasTarget ? uptime >= target : null, budget, downtime };
  }, [hours, minutes, period, targetRaw]);

  return (
    <section className={cardClass} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-lg font-semibold text-white">
        2. Uptime you delivered after an outage
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <label className="block" htmlFor={`${id}-h`}>
          <span className={labelClass}>Downtime hours</span>
          <input id={`${id}-h`} inputMode="decimal" className={inputClass} value={hours} onChange={(e) => setHours(e.target.value)} />
        </label>
        <label className="block" htmlFor={`${id}-m`}>
          <span className={labelClass}>Downtime minutes</span>
          <input id={`${id}-m`} inputMode="decimal" className={inputClass} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </label>
        <label className="block" htmlFor={`${id}-p`}>
          <span className={labelClass}>Period</span>
          <select
            id={`${id}-p`}
            className={inputClass}
            value={period}
            onChange={(e) => setPeriod(e.target.value as SlaPeriodId)}
          >
            {SLA_PERIODS.map((entry) => (
              <option key={entry.id} value={entry.id} className="bg-slate-900">
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block" htmlFor={`${id}-t`}>
          <span className={labelClass}>SLA target (%)</span>
          <input id={`${id}-t`} inputMode="decimal" className={inputClass} value={targetRaw} onChange={(e) => setTargetRaw(e.target.value)} />
        </label>
      </div>

      {result ? (
        <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2" aria-live="polite">
          <p className="text-sm text-primary-foreground/80">
            Achieved uptime:{" "}
            <span className="text-2xl font-semibold text-white">{formatPercent(result.uptime)}</span>
          </p>
          {result.hasTarget && result.budget !== null ? (
            <p className={cn("text-sm font-medium", result.met ? "text-emerald-300" : "text-rose-300")}>
              {result.met
                ? `Within target — ${formatDuration(result.budget - result.downtime)} of downtime budget left.`
                : `SLA missed — ${formatDuration(result.downtime - result.budget)} over the allowed ${formatDuration(result.budget)}.`}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-amber-300" role="alert">
          Enter the downtime as positive numbers.
        </p>
      )}
    </section>
  );
}

function CombinedSla() {
  const id = useId();
  const [values, setValues] = useState<string[]>(["99.9", "99.9", "99.95"]);
  const parsed = values.map(parseNumber);
  const valid = values.every((value) => value.trim() !== "") && parsed.every(isValidSlaPercent);

  return (
    <section className={cardClass} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-lg font-semibold text-white">
        3. Combined SLA of several services
      </h2>
      <p className="mt-2 text-sm text-primary-foreground/75">
        For example hosting, your application and a third-party API. Add up to six services.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {values.map((value, index) => (
          <div key={index} className="flex items-end gap-2">
            <label className="block flex-1" htmlFor={`${id}-s${index}`}>
              <span className={labelClass}>Service {index + 1} (%)</span>
              <input
                id={`${id}-s${index}`}
                inputMode="decimal"
                className={inputClass}
                value={value}
                onChange={(event) =>
                  setValues((current) => current.map((entry, i) => (i === index ? event.target.value : entry)))
                }
              />
            </label>
            {values.length > 1 ? (
              <button
                type="button"
                onClick={() => setValues((current) => current.filter((_, i) => i !== index))}
                className={cn("mb-1 rounded px-2 py-1 text-xs text-primary-foreground/70 hover:text-white", focusRing)}
                aria-label={`Remove service ${index + 1}`}
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {values.length < 6 ? (
        <button
          type="button"
          onClick={() => setValues((current) => [...current, "99.9"])}
          className={cn("mt-3 text-sm font-medium text-primary hover:underline", focusRing, "rounded")}
        >
          + Add a service
        </button>
      ) : null}

      {valid ? (
        <dl className="mt-5 grid gap-3 sm:grid-cols-2" aria-live="polite">
          <div className="rounded-xl border border-white/10 p-3">
            <dt className="text-xs text-primary-foreground/65">All must work (in series)</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{formatPercent(serialAvailability(parsed))}</dd>
            <dd className="text-xs text-primary-foreground/65">
              {formatDuration(allowedDowntimeSeconds(serialAvailability(parsed), periodSeconds("month")))} downtime per month
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <dt className="text-xs text-primary-foreground/65">One is enough (redundant)</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{formatPercent(parallelAvailability(parsed))}</dd>
            <dd className="text-xs text-primary-foreground/65">Assumes independent failures</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-amber-300" role="alert">
          Every service needs a percentage between 0 and 100.
        </p>
      )}
    </section>
  );
}

export function SlaCalculator() {
  return (
    <div className="grid gap-5">
      <AllowedDowntime />
      <AchievedUptime />
      <CombinedSla />
    </div>
  );
}

export function CopyCitation({ html }: { html: string }) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  return (
    <div className="max-w-3xl">
      <label htmlFor={id} className={labelClass}>
        HTML link
      </label>
      <textarea id={id} readOnly rows={2} value={html} className={cn(inputClass, "font-mono text-xs")} />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(html);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        className={cn(
          "mt-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5",
          focusRing,
        )}
      >
        {copied ? "Copied" : "Copy link HTML"}
      </button>
    </div>
  );
}
