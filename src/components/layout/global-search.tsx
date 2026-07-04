"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BarChart3,
  Bell,
  CreditCard,
  FileText,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { MutedText } from "@/components/ui/typography";
import { cn } from "@/lib/utils/cn";
import {
  auroraInputFocus,
  motionBackdropEnter,
  motionDialogEnter,
  searchResultRow,
  searchResultRowActive,
} from "@/lib/ui/motion";
import { focusRing, pressable, transitionInteractive } from "@/lib/ui/tokens";

type QuickAction = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/clients/new",
    label: "Create client",
    description: "Add a new client to your workspace",
    icon: UserPlus,
    keywords: "client new create",
  },
  {
    href: "/reports/new",
    label: "Create report",
    description: "Draft a new client report",
    icon: FileText,
    keywords: "report new create",
  },
  {
    href: "/settings/plans",
    label: "Go to pricing",
    description: "Compare plans and manage subscription",
    icon: CreditCard,
    keywords: "pricing plans billing subscription",
  },
  {
    href: "/notifications",
    label: "Open notifications",
    description: "View recent alerts and updates",
    icon: Bell,
    keywords: "notifications alerts inbox",
  },
  {
    href: "/settings",
    label: "Open settings",
    description: "Organization and platform configuration",
    icon: Settings,
    keywords: "settings preferences organization",
  },
  {
    href: "/settings/team",
    label: "Open team",
    description: "Manage members, roles, and invitations",
    icon: Users,
    keywords: "team members invite users",
  },
  {
    href: "/reports",
    label: "Open reports",
    description: "Browse reports and templates",
    icon: BarChart3,
    keywords: "reports list templates",
  },
];

type GlobalSearchContextValue = {
  open: boolean;
  openPanel: () => void;
  close: () => void;
  toggle: () => void;
  shortcutLabel: string;
};

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

function useGlobalSearchContext(): GlobalSearchContextValue {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error("GlobalSearch components must be used within GlobalSearchProvider.");
  }
  return context;
}

function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(window.navigator.platform));
  }, []);

  return isMac;
}

type GlobalSearchProviderProps = {
  children: ReactNode;
};

export function GlobalSearchProvider({ children }: GlobalSearchProviderProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const panelInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const titleId = useId();
  const isMac = useIsMac();
  const shortcutLabel = isMac ? "⌘ K" : "Ctrl K";
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const openPanel = useCallback(() => {
    setOpen(true);
  }, []);

  const toggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
        return;
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open, toggle]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      panelInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        close();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredActions = normalizedQuery
    ? QUICK_ACTIONS.filter((action) => {
        const haystack = `${action.label} ${action.description} ${action.keywords ?? ""}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : QUICK_ACTIONS;

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    resultRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, filteredActions.length]);

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (filteredActions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % filteredActions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current === 0 ? filteredActions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const action = filteredActions[activeIndex];
      if (action) {
        close();
        router.push(action.href);
      }
    }
  }

  return (
    <GlobalSearchContext.Provider
      value={{ open, openPanel, close, toggle, shortcutLabel }}
    >
      {children}

      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex items-start justify-center bg-foreground/20 p-4 pt-[12vh] backdrop-blur-sm sm:p-6",
            motionBackdropEnter,
          )}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-surface shadow-lg",
              motionDialogEnter,
            )}
          >
            <div className="border-b border-border px-4 py-3">
              <label htmlFor={`${titleId}-input`} id={titleId} className="sr-only">
                Search workspace
              </label>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-surface px-3 transition-all duration-150",
                  auroraInputFocus,
                )}
              >
                <Icon icon={Search} size="sm" className="text-muted" />
                <input
                  ref={panelInputRef}
                  id={`${titleId}-input`}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Search clients, reports, risks..."
                  className="h-10 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/80"
                />
                <kbd className="hidden rounded border border-border bg-muted/5 px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline-block">
                  Esc
                </kbd>
              </div>
            </div>

            <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Quick actions
              </p>
              <ul className="space-y-1" role="listbox" aria-label="Quick actions">
                {filteredActions.map((action, index) => (
                  <li key={action.href}>
                    <Link
                      ref={(element) => {
                        resultRefs.current[index] = element;
                      }}
                      href={action.href}
                      onClick={close}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5",
                        searchResultRow,
                        focusRing,
                        index === activeIndex && searchResultRowActive,
                      )}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/5 text-muted">
                        <Icon icon={action.icon} size="sm" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">
                          {action.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {action.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {filteredActions.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  No quick actions match your search.
                </p>
              ) : null}
            </div>

            <div className="border-t border-border bg-muted/5 px-4 py-3">
              <MutedText className="text-xs">
                Quick navigation across workspace modules. Use filters above to narrow results.
              </MutedText>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
                <span>
                  <kbd className="rounded border border-border bg-surface px-1 py-0.5">
                    {shortcutLabel}
                  </kbd>{" "}
                  open
                </span>
                <span>
                  <kbd className="rounded border border-border bg-surface px-1 py-0.5">↑</kbd>{" "}
                  <kbd className="rounded border border-border bg-surface px-1 py-0.5">↓</kbd>{" "}
                  navigate
                </span>
                <span>
                  <kbd className="rounded border border-border bg-surface px-1 py-0.5">Enter</kbd>{" "}
                  select
                </span>
                <span>
                  <kbd className="rounded border border-border bg-surface px-1 py-0.5">Esc</kbd> close
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </GlobalSearchContext.Provider>
  );
}

type GlobalSearchTriggerProps = {
  compact?: boolean;
  className?: string;
};

export function GlobalSearchTrigger({ compact = false, className }: GlobalSearchTriggerProps) {
  const { openPanel, shortcutLabel } = useGlobalSearchContext();

  if (compact) {
    return (
      <button
        type="button"
        onClick={openPanel}
        className={cn(
          "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-muted shadow-xs md:hidden",
          transitionInteractive,
          "hover:border-border-strong hover:bg-muted/5 hover:text-foreground hover:shadow-sm",
          auroraInputFocus,
          focusRing,
          pressable,
          className,
        )}
        aria-label="Open search"
      >
        <Icon icon={Search} size="sm" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openPanel}
      className={cn(
        "hidden h-10 w-full max-w-xl cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/5 px-3 text-left shadow-xs md:inline-flex",
        transitionInteractive,
        "hover:border-border-strong hover:bg-surface hover:shadow-md",
        auroraInputFocus,
        focusRing,
        className,
      )}
      aria-label="Open search"
    >
      <Icon icon={Search} size="sm" className="text-muted" />
      <span className="flex-1 truncate text-sm text-muted">Search clients, reports, risks...</span>
      <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted lg:inline-block">
        {shortcutLabel}
      </kbd>
    </button>
  );
}
