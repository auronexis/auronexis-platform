import Link from "next/link";
import {
  Handshake,
  LifeBuoy,
  Lock,
  Mail,
  Newspaper,
  Scale,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { ContactChannelIcon, EnterpriseContactChannel } from "@/lib/company/contact-channels";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

const CONTACT_ICONS: Record<ContactChannelIcon, LucideIcon> = {
  "life-buoy": LifeBuoy,
  handshake: Handshake,
  shield: Shield,
  scale: Scale,
  mail: Mail,
  lock: Lock,
  users: Users,
  newspaper: Newspaper,
};

type EnterpriseContactCardProps = {
  channel: EnterpriseContactChannel;
  variant?: "marketing" | "default";
  className?: string;
};

export function EnterpriseContactCard({
  channel,
  variant = "default",
  className,
}: EnterpriseContactCardProps) {
  const Icon = CONTACT_ICONS[channel.icon];
  const isMarketing = variant === "marketing";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border p-5 shadow-sm",
        transitionInteractive,
        "hover:border-primary/25 hover:shadow-md",
        isMarketing
          ? "border-border-subtle bg-surface-1 text-foreground"
          : "border-white/10 bg-white/[0.03] text-white",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            isMarketing
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-white/15 bg-white/10 text-primary-foreground",
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{channel.title}</h3>
          <p
            className={cn(
              "mt-1 text-sm leading-relaxed",
              isMarketing ? "text-muted" : "text-primary-foreground/75",
            )}
          >
            {channel.purpose}
          </p>
        </div>
      </div>

      <Link
        href={channel.mailtoHref}
        className={cn(
          "mt-4 inline-block text-sm font-medium hover:underline",
          isMarketing ? "text-primary" : "text-primary-foreground/90 hover:text-white",
          focusRing,
          "rounded",
        )}
        aria-label={`Email ${channel.title} at ${channel.email}`}
      >
        {channel.email}
      </Link>

      {channel.responseExpectation ? (
        <p
          className={cn(
            "mt-auto pt-3 text-xs leading-relaxed",
            isMarketing ? "text-muted" : "text-primary-foreground/60",
          )}
        >
          {channel.responseExpectation}
        </p>
      ) : (
        <span className="mt-auto block min-h-[1.25rem]" aria-hidden />
      )}
    </article>
  );
}
