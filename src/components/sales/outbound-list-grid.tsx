import Link from "next/link";
import type { OutboundList } from "@/types/database";
import type { OutboundListType } from "@/types/database";
import { OUTBOUND_LIST_TYPES } from "@/lib/sales/outbound-lists";

type OutboundListGridProps = {
  lists: OutboundList[];
  leadCounts: Record<OutboundListType, number>;
  activeType?: OutboundListType;
};

export function OutboundListGrid({ lists, leadCounts, activeType }: OutboundListGridProps) {
  const listByType = new Map(lists.map((list) => [list.list_type, list]));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {OUTBOUND_LIST_TYPES.map((item) => {
        const list = listByType.get(item.key);
        const count = leadCounts[item.key] ?? 0;
        const active = activeType === item.key;

        return (
          <Link
            key={item.key}
            href={`/sales/outbound?segment=${item.key}`}
            className={`aurora-surface block p-5 transition-colors hover:border-primary/20 ${active ? "border-primary/30 ring-1 ring-primary/20" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{item.label}</h3>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                {count}
              </span>
            </div>
            {list?.description ? (
              <p className="mt-3 text-xs text-muted">{list.description}</p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
