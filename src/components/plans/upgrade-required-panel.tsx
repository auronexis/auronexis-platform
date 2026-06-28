import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTitle, MutedText } from "@/components/ui/typography";

type UpgradeRequiredPanelProps = {
  title?: string;
  message: string;
  requiredPlanLabel?: string;
};

export function UpgradeRequiredPanel({
  title = "Upgrade required",
  message,
  requiredPlanLabel,
}: UpgradeRequiredPanelProps) {
  return (
    <Card padding="lg" className="mx-auto max-w-2xl text-center">
      <PageTitle>{title}</PageTitle>
      <MutedText className="mt-3">{message}</MutedText>
      {requiredPlanLabel ? (
        <p className="mt-2 text-sm font-medium text-foreground">
          {requiredPlanLabel} plan required
        </p>
      ) : null}
      <div className="mt-6">
        <Link href="/settings/plans">
          <Button type="button">View plans</Button>
        </Link>
      </div>
    </Card>
  );
}
