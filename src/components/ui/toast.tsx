"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";
import { motionToastEnter } from "@/lib/ui/motion";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { container: string; icon: typeof CheckCircle2 }
> = {
  success: {
    container: "border-success/25 bg-success/10 text-foreground",
    icon: CheckCircle2,
  },
  error: {
    container: "border-danger/25 bg-danger/10 text-foreground",
    icon: AlertCircle,
  },
  warning: {
    container: "border-warning/25 bg-warning/10 text-foreground",
    icon: AlertTriangle,
  },
  info: {
    container: "border-primary/25 bg-primary/10 text-foreground",
    icon: Info,
  },
};

const DEFAULT_DURATION = 4000;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const variant = toast.variant ?? "info";
  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    if (paused) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration ?? DEFAULT_DURATION);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [onDismiss, paused, toast.duration, toast.id]);

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm",
        motionToastEnter,
        styles.container,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Icon icon={styles.icon} size="sm" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm text-muted">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "shrink-0 rounded-md p-1 text-muted",
          transitionInteractive,
          "hover:bg-black/5 hover:text-foreground",
          focusRing,
        )}
      >
        <Icon icon={X} size="sm" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...input, id }]);
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 top-4 z-[200] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
