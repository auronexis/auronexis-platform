import type { CopilotTaskType } from "@/lib/ai/copilot/types";

export type CopilotSuggestedPrompt = {
  id: string;
  label: string;
  prompt: string;
  taskType: CopilotTaskType;
};

export const WORKSPACE_SUGGESTED_PROMPTS: CopilotSuggestedPrompt[] = [
  {
    id: "attention",
    label: "Clients needing attention",
    prompt: "Which clients need attention today?",
    taskType: "workspace_question",
  },
  {
    id: "portfolio-risks",
    label: "Portfolio risks",
    prompt: "Explain the highest portfolio risks.",
    taskType: "workspace_question",
  },
  {
    id: "overdue-reports",
    label: "Overdue reports",
    prompt: "Which reports are overdue?",
    taskType: "workspace_question",
  },
  {
    id: "critical-incidents",
    label: "Critical incidents",
    prompt: "Summarize critical incidents.",
    taskType: "workspace_question",
  },
  {
    id: "weekly-priorities",
    label: "Weekly priorities",
    prompt: "What should the team prioritize this week?",
    taskType: "workspace_question",
  },
  {
    id: "revenue-risk",
    label: "Revenue at risk",
    prompt: "Explain the revenue at risk.",
    taskType: "workspace_question",
  },
  {
    id: "executive-brief",
    label: "Executive brief",
    prompt: "Create an executive brief.",
    taskType: "executive_brief",
  },
];

export const CLIENT_SUGGESTED_PROMPTS: CopilotSuggestedPrompt[] = [
  {
    id: "client-summary",
    label: "Summarize this client",
    prompt: "Summarize this client based on verified workspace data.",
    taskType: "client_summary",
  },
  {
    id: "health-score",
    label: "Health score",
    prompt: "Why is the health score changing?",
    taskType: "client_summary",
  },
  {
    id: "open-risks",
    label: "Open risks",
    prompt: "Explain open risks for this client.",
    taskType: "client_summary",
  },
  {
    id: "next-actions",
    label: "Next actions",
    prompt: "What should we do next for this client?",
    taskType: "client_summary",
  },
  {
    id: "follow-up",
    label: "Follow-up plan",
    prompt: "Draft an internal follow-up plan.",
    taskType: "client_summary",
  },
];
