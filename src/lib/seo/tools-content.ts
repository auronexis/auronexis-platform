/**
 * Copy for the free tools under /tools. Tools answer a concrete question (for example "how much
 * downtime does 99.9% allow?") on the page itself, so they rank for that question and get cited
 * and linked by others. Keep every claim checkable: formulas are shown, assumptions are stated.
 */
import {
  GUIDE_ROUTES,
  MARKETING_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
} from "@/lib/company/company-links";

export type ToolPageContent = {
  path: string;
  title: string;
  /** <title> text without the " | Auroranexis" suffix; at most 47 characters. */
  seoTitle: string;
  metaDescription: string;
  description: string;
  intro: string;
  formula: ReadonlyArray<{ label: string; expression: string; example: string }>;
  assumptions: readonly string[];
  guidance: ReadonlyArray<{ heading: string; paragraphs: readonly string[] }>;
  faq: ReadonlyArray<{ question: string; answer: string }>;
  relatedLinks: ReadonlyArray<{ label: string; href: string }>;
  /** Text other sites can paste to cite the tool. */
  citation: { anchor: string; credit: string };
};

export const SLA_CALCULATOR_PAGE: ToolPageContent = {
  path: MARKETING_ROUTES.slaCalculator,
  title: "SLA & uptime calculator",
  seoTitle: "SLA Calculator: Uptime % to Allowed Downtime",
  metaDescription:
    "Free SLA and uptime calculator: turn 99.9% into allowed downtime per day, week, month and year, work back from an outage, and combine SLAs of several services.",
  description:
    "Turn an availability target into the downtime it allows per day, week, month, quarter and year, work out the uptime you actually delivered after an outage, and combine the SLAs of services that depend on each other.",
  intro:
    "An SLA of 99.9% sounds close to perfect, but it still allows 43 minutes of downtime a month. Use the calculator to see what a target means in real time before you promise it to a client, and to check whether last month's outages kept you inside the agreement.",
  formula: [
    {
      label: "Allowed downtime",
      expression: "period × (1 − SLA ÷ 100)",
      example: "Month (30.44 days) × (1 − 0.999) = 43m 49s",
    },
    {
      label: "Achieved uptime",
      expression: "(period − downtime) ÷ period × 100",
      example: "(43,830 min − 90 min) ÷ 43,830 min × 100 = 99.79%",
    },
    {
      label: "Services in series (all must work)",
      expression: "SLA₁ × SLA₂ × … × SLAₙ",
      example: "99.9% × 99.9% × 99.95% = 99.75%",
    },
    {
      label: "Redundant services (one is enough)",
      expression: "1 − (1 − SLA₁) × (1 − SLA₂) × …",
      example: "Two independent 99% links = 99.99%",
    },
  ],
  assumptions: [
    "A year is 365.25 days; a month is a twelfth of that (30.44 days) and a quarter a quarter of it.",
    "Allowed downtime is rounded down to the second, so the result never exceeds what the SLA allows.",
    "The calculation covers the full period (24/7). If your SLA only counts service hours or excludes planned maintenance, measure against those hours instead.",
    "Redundancy assumes the services fail independently. Shared power, network or software usually makes real redundancy lower.",
  ],
  guidance: [
    {
      heading: "Uptime SLAs and response-time SLAs are different promises",
      paragraphs: [
        "An uptime SLA (\"99.9% availability\") limits how long a service may be unavailable. A response-time SLA (\"critical tickets answered within 30 minutes\") limits how long a client waits for a person. MSPs and agencies usually need both: the first for the systems they run, the second for their service desk.",
        "Report each one the way it is defined: uptime as a percentage per month, response and resolution times as the share of tickets inside target per priority.",
      ],
    },
    {
      heading: "Before you promise a number to a client",
      paragraphs: [
        "Check what the services you depend on promise. If your hosting provider commits to 99.9% and your own application adds risk on top, you cannot honestly offer 99.95% end to end.",
        "Agree in writing how downtime is measured: from when (first alert or client report), what is excluded (planned maintenance announced in advance, client-caused outages) and what happens on a breach (service credits, a report, a review).",
      ],
    },
    {
      heading: "Tracking SLAs across many clients",
      paragraphs: [
        "A calculator answers one question at a time. When every client has its own targets, it helps to keep incidents, SLA results and client reports per client in one place, so monthly SLA reporting is a review instead of a spreadsheet exercise.",
      ],
    },
  ],
  faq: [
    {
      question: "How much downtime is 99.9% uptime?",
      answer:
        "99.9% (three nines) allows about 1m 26s per day, 10m 4s per week, 43m 49s per month and 8h 45m 57s per year.",
    },
    {
      question: "How much downtime is 99.99% uptime?",
      answer:
        "99.99% (four nines) allows about 8.6 seconds per day, 1 minute per week, 4m 22s per month and 52m 35s per year.",
    },
    {
      question: "How much downtime is 99.5% uptime?",
      answer: "99.5% allows about 7m 12s per day, 3h 39m per month and 1d 19h 49m per year.",
    },
    {
      question: "How do you calculate an SLA percentage?",
      answer:
        "Divide the time the service was available by the total time in the period and multiply by 100. A month with 90 minutes of downtime is (43,830 − 90) ÷ 43,830 × 100 ≈ 99.79% uptime.",
    },
    {
      question: "How do you calculate the combined SLA of several services?",
      answer:
        "If every service must work, multiply their availabilities: 99.9% × 99.9% × 99.95% ≈ 99.75%. If any one of several redundant copies is enough, subtract the chance that all are down at once from 100%.",
    },
    {
      question: "Does planned maintenance count as downtime?",
      answer:
        "Only if the SLA says so. Many SLAs exclude maintenance that was announced in advance and happens in an agreed window. Write the rule into the agreement and apply it the same way every month.",
    },
    {
      question: "What is the difference between an SLA, an SLO and an SLI?",
      answer:
        "The SLA is the promise to the client (often with consequences), the SLO is the internal target you aim for (usually stricter than the SLA), and the SLI is the measurement itself, such as the uptime percentage you actually recorded.",
    },
  ],
  relatedLinks: [
    { label: "SLA policy template", href: TEMPLATE_ROUTES.slaPolicy },
    { label: "SLA reporting guide", href: GUIDE_ROUTES.slaReporting },
    { label: "SLA tracking for MSPs and agencies", href: SOLUTION_ROUTES.slaManagement },
    { label: "Incident response playbook template", href: TEMPLATE_ROUTES.incidentResponse },
  ],
  citation: {
    anchor: "SLA & uptime calculator",
    credit: "by Auroranexis",
  },
};
