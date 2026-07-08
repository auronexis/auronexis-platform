import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Children } from "react";
import { motionEmptyEnter } from "@/lib/ui/motion";
import { cn } from "@/lib/utils/cn";
import {
  auroraTableCell,
  auroraTableHead,
  auroraTableHeaderCell,
  auroraTableRow,
  auroraTableShell,
} from "@/lib/ui/aurora";

/** Remove JSX whitespace text nodes — invalid inside tbody/tr/table sections. */
export function omitWhitespaceTextNodes(children: ReactNode): ReactNode[] {
  return Children.toArray(children).filter(
    (child) => !(typeof child === "string" && child.trim() === ""),
  );
}

type AuroraDataTableProps = HTMLAttributes<HTMLDivElement>;

export function AuroraDataTable({ className, children, ...props }: AuroraDataTableProps) {
  return (
    <div className={cn(auroraTableShell, className)} {...props}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

type AuroraTableProps = HTMLAttributes<HTMLTableElement>;

export function AuroraTable({ className, children, ...props }: AuroraTableProps) {
  return (
    <table className={cn("min-w-full divide-y divide-border/70", className)} {...props}>
      {children}
    </table>
  );
}

type AuroraTableHeadProps = HTMLAttributes<HTMLTableSectionElement>;

export function AuroraTableHead({ className, children, ...props }: AuroraTableHeadProps) {
  return (
    <thead className={cn(auroraTableHead, "divide-y divide-border/70", className)} {...props}>
      {children}
    </thead>
  );
}

type AuroraTableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export function AuroraTableBody({ className, children, ...props }: AuroraTableBodyProps) {
  return (
    <tbody className={cn("divide-y divide-border/60 bg-surface", className)} {...props}>
      {omitWhitespaceTextNodes(children)}
    </tbody>
  );
}

type AuroraTableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  interactive?: boolean;
  selected?: boolean;
};

export function AuroraTableRow({
  className,
  children,
  interactive = false,
  selected = false,
  ...props
}: AuroraTableRowProps) {
  return (
    <tr
      className={cn(interactive && auroraTableRow, className)}
      data-interactive={interactive ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
      {...props}
    >
      {omitWhitespaceTextNodes(children)}
    </tr>
  );
}

type AuroraTableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement>;

export function AuroraTableHeaderCell({
  className,
  children,
  ...props
}: AuroraTableHeaderCellProps) {
  return (
    <th className={cn(auroraTableHeaderCell, className)} {...props}>
      {children}
    </th>
  );
}

type AuroraTableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

export function AuroraTableCell({ className, children, ...props }: AuroraTableCellProps) {
  return (
    <td className={cn(auroraTableCell, className)} {...props}>
      {children}
    </td>
  );
}

type AuroraTableEmptyProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function AuroraTableEmpty({ title, description, action }: AuroraTableEmptyProps) {
  return (
    <div
      className={cn(
        "flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-gradient-to-b from-muted/5 to-surface px-6 py-10 text-center",
        motionEmptyEnter,
      )}
    >
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
