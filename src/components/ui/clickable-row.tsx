"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode, TableHTMLAttributes } from "react";
import { auroraTableRow } from "@/lib/ui/aurora";
import { omitWhitespaceTextNodes } from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { ROW_INTERACTIVE_ATTR } from "@/components/ui/interactive-surface";

const INTERACTIVE_TARGET_SELECTOR = `a, button, input, select, textarea, [role='button'], [${ROW_INTERACTIVE_ATTR}]`;

type ClickableRowProps = TableHTMLAttributes<HTMLTableRowElement> & {
  href: string;
  ariaLabel: string;
  selected?: boolean;
  children: ReactNode;
};

/** Full-width navigable table row with keyboard support and nested control safety. */
export function ClickableRow({
  href,
  ariaLabel,
  selected = false,
  className,
  children,
  onClick,
  onKeyDown,
  ...props
}: ClickableRowProps) {
  const router = useRouter();

  const navigate = () => {
    router.push(href);
  };

  const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(INTERACTIVE_TARGET_SELECTOR)) {
      onClick?.(event);
      return;
    }
    navigate();
    onClick?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate();
    }
    onKeyDown?.(event);
  };

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={ariaLabel}
      data-interactive="true"
      data-selected={selected ? "true" : undefined}
      className={cn(auroraTableRow, focusRing, "focus-visible:ring-inset", className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {omitWhitespaceTextNodes(children)}
    </tr>
  );
}
