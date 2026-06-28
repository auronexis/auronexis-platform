import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { CardHeading, MutedText } from "@/components/ui/typography";
import { getAuroraModule, auroraSurfaceInteractive } from "@/lib/ui/aurora";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type SettingsNavCardProps = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const settingsIdentity = getAuroraModule("settings");

export function SettingsNavCard({ href, title, description, icon }: SettingsNavCardProps) {
  return (
    <Link
      href={href}
      className={cn(auroraSurfaceInteractive, "group block p-6", focusRing)}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            settingsIdentity.iconContainer,
            "transition-colors duration-150 group-hover:border-border/30",
          )}
        >
          <Icon icon={icon} size="md" />
        </span>
        <span className="min-w-0 flex-1">
          <CardHeading className="text-lg">{title}</CardHeading>
          <MutedText className="mt-2">{description}</MutedText>
        </span>
      </div>
    </Link>
  );
}
