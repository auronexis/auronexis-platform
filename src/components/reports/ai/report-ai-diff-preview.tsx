import { AIDiffPreview } from "@/components/ai/ai-diff-preview";

import { REPORT_AI_SECTION_LABELS, type PendingDiff } from "@/lib/ai/types";



type ReportAIDiffPreviewProps = {

  diff: PendingDiff;

  onAccept: () => void;

  onReject: () => void;

  disabled?: boolean;

};



/** Report copilot diff preview — uses shared AIDiffPreview. */

export function ReportAIDiffPreview({ diff, onAccept, onReject, disabled }: ReportAIDiffPreviewProps) {

  return (

    <AIDiffPreview

      targetLabel={REPORT_AI_SECTION_LABELS[diff.section]}

      current={diff.current}

      proposed={diff.proposed}

      onAccept={onAccept}

      onReject={onReject}

      disabled={disabled}

    />

  );

}


