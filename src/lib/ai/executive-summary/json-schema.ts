/** JSON schema for OpenAI Responses API structured output — executive-summary-v1. */
export const executiveSummaryJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "executive_summary",
    "key_outcomes",
    "key_risks",
    "recommended_next_steps",
    "confidence_note",
  ],
  properties: {
    headline: { type: "string", maxLength: 160 },
    executive_summary: { type: "string", maxLength: 2500 },
    key_outcomes: {
      type: "array",
      maxItems: 6,
      items: { type: "string", maxLength: 240 },
    },
    key_risks: {
      type: "array",
      maxItems: 6,
      items: { type: "string", maxLength: 240 },
    },
    recommended_next_steps: {
      type: "array",
      maxItems: 6,
      items: { type: "string", maxLength: 240 },
    },
    confidence_note: { type: "string", maxLength: 400 },
  },
} as const;
