"use client";



import { AIDiffPreview } from "@/components/ai/ai-diff-preview";

import {

  OPERATIONAL_FIELD_LABELS,

  type OperationalPendingDiff,

} from "@/lib/ai/operational/types";



type OperationalAIDiffPreviewProps = {

  diff: OperationalPendingDiff;

  onAccept: () => void;

  onReject: () => void;

  disabled?: boolean;

};



/** Operational copilot diff preview — uses shared AIDiffPreview. */

export function OperationalAIDiffPreview({

  diff,

  onAccept,

  onReject,

  disabled,

}: OperationalAIDiffPreviewProps) {

  return (

    <AIDiffPreview

      targetLabel={OPERATIONAL_FIELD_LABELS[diff.field]}

      current={diff.current}

      proposed={diff.proposed}

      onAccept={onAccept}

      onReject={onReject}

      disabled={disabled}

    />

  );

}


