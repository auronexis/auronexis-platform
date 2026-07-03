"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import {
  passwordStrengthLabel,
  passwordStrengthPercent,
  validatePasswordPolicy,
} from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils/cn";

const labelClassName = "block text-sm font-medium text-slate-700";
const inputClassName = cn(
  "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs",
  "placeholder:text-slate-400",
  "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

type AuthPasswordInputProps = {
  id?: string;
  name: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
  showStrength?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export function AuthPasswordInput({
  id,
  name,
  label,
  autoComplete = "new-password",
  required = true,
  showStrength = false,
  error,
  value: controlledValue,
  onChange,
}: AuthPasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? `${name}-${generatedId}`;
  const errorId = `${inputId}-error`;
  const strengthId = `${inputId}-strength`;
  const [visible, setVisible] = useState(false);
  const [internalValue, setInternalValue] = useState("");

  const value = controlledValue ?? internalValue;
  const validation = validatePasswordPolicy(value);
  const strengthPercent = passwordStrengthPercent(validation.strength);

  function handleChange(nextValue: string) {
    if (onChange) {
      onChange(nextValue);
    } else {
      setInternalValue(nextValue);
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className={labelClassName}>
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error ? errorId : null, showStrength && value ? strengthId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="••••••••••••"
          className={cn(inputClassName, "pr-10", error && "border-red-500 focus:border-red-500 focus:ring-red-500/20")}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className={cn(
            "absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-md text-slate-500",
            "hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20",
          )}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>

      {showStrength && value ? (
        <div id={strengthId} className="space-y-1.5" aria-live="polite">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Password strength</span>
            <span className="font-medium">{passwordStrengthLabel(validation.strength)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                validation.strength === "weak" && "bg-red-500",
                validation.strength === "fair" && "bg-amber-500",
                validation.strength === "good" && "bg-blue-500",
                validation.strength === "strong" && "bg-emerald-500",
              )}
              style={{ width: `${strengthPercent}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={strengthPercent}
              aria-label={`Password strength: ${passwordStrengthLabel(validation.strength)}`}
            />
          </div>
          <ul className="grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
            <li className={validation.checks.minLength ? "text-emerald-700" : undefined}>
              {validation.checks.minLength ? "✓" : "○"} At least 12 characters
            </li>
            <li className={validation.checks.uppercase ? "text-emerald-700" : undefined}>
              {validation.checks.uppercase ? "✓" : "○"} One uppercase letter
            </li>
            <li className={validation.checks.lowercase ? "text-emerald-700" : undefined}>
              {validation.checks.lowercase ? "✓" : "○"} One lowercase letter
            </li>
            <li className={validation.checks.number ? "text-emerald-700" : undefined}>
              {validation.checks.number ? "✓" : "○"} One number
            </li>
          </ul>
        </div>
      ) : null}

      {error ? (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { inputClassName, labelClassName };
