import type { AIWarning } from "@/lib/ai/types";
import { FormAlert } from "@/components/ui/form-alert";

type ReportAIWarningsProps = {
  warnings: AIWarning[];
};

export function ReportAIWarnings({ warnings }: ReportAIWarningsProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <section aria-label="AI warnings" className="space-y-2">
      {warnings.map((warning) => (
        <FormAlert key={warning.id} variant="warning">
          {warning.message}
        </FormAlert>
      ))}
    </section>
  );
}
