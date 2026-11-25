import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import {
  FEATURE_ROUTES,
  GUIDE_ROUTES,
  MARKETING_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
  USE_CASE_ROUTES,
} from "@/lib/company/company-links";

/**
 * Long-form guides for search visitors who are not looking for Auroranexis yet, but for an
 * answer to a problem Auroranexis solves. Rules for every guide:
 *
 * - Practical and complete on its own: a reader should be able to act on it without buying anything.
 * - No invented statistics, benchmarks, customers or quotes. Example numbers are labelled as examples.
 * - Product statements must match the live feature, solution and pricing pages.
 * - When you change a guide, update `updated` (and content-dates.ts) in the same PR.
 */

export type GuideLink = { label: string; href: string };

export type GuideSection = {
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  steps?: ReadonlyArray<{ title: string; text: string }>;
  /** Short example, rendered as a highlighted box after paragraphs, bullets and steps. */
  example?: { title: string; lines: readonly string[] };
  /** Paragraph rendered after the example. */
  closing?: string;
  links?: readonly GuideLink[];
};

export type GuideContent = {
  slug: string;
  path: string;
  /** Visible H1. */
  title: string;
  /** <title> without the " | Auroranexis" suffix — keep it ≤ 46 characters. */
  seoTitle: string;
  /** Meta description — ≤ 155 characters. */
  description: string;
  /** Short teaser for the guides hub. */
  summary: string;
  published: string;
  updated: string;
  readingMinutes: number;
  intro: readonly string[];
  sections: readonly GuideSection[];
  /** Honest "where the product fits" block. */
  productFit: { heading: string; paragraphs: readonly string[]; links: readonly GuideLink[] };
  faq: ReadonlyArray<{ question: string; answer: string }>;
};

/** Author byline uses the legal name from the imprint data (single source of truth). */
export const GUIDES_AUTHOR = {
  name: COMPANY_INFORMATION.owner,
  role: "Founder, Auroranexis",
  linkedInUrl: COMPANY_INFORMATION.founderLinkedInUrl,
} as const;

const automatedClientReporting: GuideContent = {
  slug: "automated-client-reporting",
  path: GUIDE_ROUTES.automatedClientReporting,
  title: "Automated client reporting: a practical guide for service businesses",
  seoTitle: "Automated Client Reporting: A Practical Guide",
  description:
    "How service businesses automate recurring client reports: what to automate, what to keep human, a five-step setup, and the mistakes that cost renewals.",
  summary:
    "What to automate in recurring client reports, what must stay human, and a five-step setup you can start this month.",
  published: "2026-10-23",
  updated: "2026-10-23",
  readingMinutes: 8,
  intro: [
    "If you run a service business with recurring clients, you probably send some kind of monthly or quarterly report: what was done, what went wrong, what comes next. Most teams build these by hand — copying numbers from a ticket system, a spreadsheet and last month's slides into a new document for every client.",
    "Automated client reporting means the structure, the numbers and the delivery are prepared for you, so a person only has to check the draft and add judgement. Done well, it saves hours every month and makes every client report consistent. Done badly, it sends clients a wall of numbers nobody reads. This guide shows the difference.",
  ],
  sections: [
    {
      heading: "What should be automated — and what should not",
      paragraphs: [
        "The goal is not to remove people from reporting. It is to remove the copying and formatting, so the time that is left goes into the part only a person can do: explaining what the numbers mean for this particular client.",
      ],
      bullets: [
        "Automate: collecting the figures for the reporting period, filling a fixed report structure, creating the next draft on a schedule, exporting a PDF or publishing to a portal, and keeping a record of what each client received.",
        "Keep human: the summary in plain language, the explanation of anything that went wrong, recommendations, and the final decision to send.",
        "Never automate: sending a report that nobody on your team has read. One wrong number in an unreviewed report costs more trust than ten late reports.",
      ],
    },
    {
      heading: "What belongs in a recurring client report",
      paragraphs: [
        "Clients rarely read long reports. They want to know three things: is the service working, was there a problem, and do they need to decide anything. A structure that answers those questions works for almost any service business — IT services, agencies, accounting firms, facility services or property management.",
      ],
      steps: [
        { title: "Summary", text: "Three to five sentences in plain language: how the period went and the one thing the client should know." },
        { title: "Work delivered", text: "What you did in the period, compared with what was agreed." },
        { title: "Service levels", text: "Response and resolution times against the targets in your contract, if you have them." },
        { title: "Issues and incidents", text: "What went wrong, what you did about it, and what prevents it from happening again." },
        { title: "Open risks and decisions", text: "Anything that needs the client's attention or approval." },
        { title: "Next period", text: "Planned work and dates, so the next report has something to measure against." },
      ],
      links: [{ label: "Executive report template", href: TEMPLATE_ROUTES.executiveReport }],
    },
    {
      heading: "A five-step setup",
      steps: [
        {
          title: "Start with one template",
          text: "Write one report structure for all clients, using the sections above. Resist building a custom report per client — you can vary the content, not the structure.",
        },
        {
          title: "Define the period and the data sources",
          text: "Decide which records feed each section — tickets, incidents, delivered work, SLA results — and make sure they are recorded somewhere you can query, not in people's inboxes.",
        },
        {
          title: "Generate a draft per client",
          text: "At the end of the period, let your tool fill the template with that client's figures for that period. The draft should be complete enough that a reviewer only edits, never builds.",
        },
        {
          title: "Review in fifteen minutes",
          text: "Check that the numbers match what the client sees, write the summary, explain any miss, and remove anything that is not useful to this client.",
        },
        {
          title: "Publish, keep the record, schedule the next draft",
          text: "Send or publish the report, keep a copy of exactly what was delivered, and have the next draft created automatically so the cadence never depends on someone remembering.",
        },
      ],
    },
    {
      heading: "Marketing dashboards versus operational reports",
      paragraphs: [
        "When you search for client reporting software, most results are marketing dashboards. They connect to advertising, SEO and social media accounts and chart those metrics for agency clients. If your reports are mainly campaign performance, that is the right kind of tool.",
        "If your reports are about the service itself — work delivered, response times, incidents, open risks — you need operational reporting: reports built from your delivery records, with a review step and a history of what each client received. Ask these questions before you choose:",
      ],
      bullets: [
        "Where does the data come from, and will the numbers match what the client sees?",
        "Is there a review step before anything reaches the client?",
        "Can clients see their reports in a portal, or only as email attachments?",
        "Is there a history of every report you delivered, for renewals and disputes?",
        "How does the price grow with the number of clients you serve?",
      ],
    },
    {
      heading: "Common mistakes that cost renewals",
      bullets: [
        "Reports nobody reads: twenty pages of charts with no summary. Lead with the summary and keep the rest short.",
        "Numbers that do not match: if your report says one thing and the client's own records say another, the report loses all credibility.",
        "Only good news: clients usually know when something went wrong. A report that hides it reads as either careless or dishonest.",
        "Irregular delivery: a report that arrives on different dates every month signals that the service is irregular too.",
        "No record: when a client asks at renewal what you delivered last year, you should be able to show every report in seconds.",
      ],
    },
  ],
  productFit: {
    heading: "Where Auroranexis fits",
    paragraphs: [
      "Auroranexis is client operations software for service businesses, and automated client reporting is one of its core modules. Each report belongs to one client and one reporting period. Templates define the structure, and generating a draft fills in metrics and a default narrative from the workspace — health signals, SLA outcomes, incidents and open risks. Your team reviews and edits, then publishes to the client portal, as a PDF or by email where configured. Recurring schedules create the next draft, but nothing is sent to a client without review. AI-assisted summaries are optional; reporting works without them.",
      "Auroranexis is not a marketing analytics dashboard. If your reports are mainly ad and SEO metrics, a marketing reporting tool will suit you better. Plans start at €179 per month for up to 25 clients.",
    ],
    links: [
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
      { label: "How reports work", href: FEATURE_ROUTES.reports },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
  },
  faq: [
    {
      question: "What is automated client reporting?",
      answer:
        "It means the data, structure and delivery of recurring client reports are prepared by software, so a person only reviews the draft, adds the summary and approves it, instead of building every report by hand.",
    },
    {
      question: "Should automated reports be sent to clients without review?",
      answer:
        "No. Automate the preparation, not the decision to send. A short human review catches wrong numbers and adds the explanation clients actually read.",
    },
    {
      question: "How often should I send client reports?",
      answer:
        "Monthly works for most recurring services. Larger accounts often add a quarterly business review that looks at trends and plans. Choose a cadence you can keep without exceptions.",
    },
    {
      question: "What should a client report include?",
      answer:
        "A plain-language summary, work delivered against what was agreed, service levels against targets, issues and what was done about them, open risks or decisions, and the plan for the next period.",
    },
  ],
};

const clientProfitabilityAnalysis: GuideContent = {
  slug: "client-profitability-analysis",
  path: GUIDE_ROUTES.clientProfitabilityAnalysis,
  title: "Client profitability analysis: how to find out which clients make you money",
  seoTitle: "Client Profitability Analysis: Step by Step",
  description:
    "A step-by-step client profitability analysis for service businesses: the formula, a worked example, hidden cost drivers and what to do with the results.",
  summary:
    "A simple formula and worked example to find out which clients really make you money — and what to do about the ones that do not.",
  published: "2026-10-23",
  updated: "2026-10-23",
  readingMinutes: 9,
  intro: [
    "In most service businesses, the clients who pay the most are not automatically the ones who earn you the most. A large client who calls every day, changes scope every week and needs urgent fixes at night can be worth less than a smaller client who simply pays and lets you work.",
    "A client profitability analysis tells you which is which. You do not need an accounting system or a finance team for a first version — a spreadsheet and three months of data are enough. This guide walks through the calculation, a worked example, and what to do with the result.",
  ],
  sections: [
    {
      heading: "The basic formula",
      paragraphs: [
        "Client profit is the revenue you receive from a client minus the direct cost of serving that client. Client margin is that profit as a share of the revenue.",
      ],
      bullets: [
        "Client profit = revenue from the client − direct cost of serving the client",
        "Direct cost = hours spent × loaded hourly cost + tools, licences and third-party costs used only for that client",
        "Client margin = client profit ÷ revenue from the client × 100",
      ],
    },
    {
      heading: "Work out your loaded hourly cost",
      paragraphs: [
        "The loaded hourly cost is what one hour of your team's time really costs you — not the salary alone. Add salary, employer costs and a fair share of overhead such as rent, software and management time for one person, and divide by the hours that person can actually spend on client work in a year.",
      ],
      example: {
        title: "Example",
        lines: [
          "Total yearly cost of one team member, including overhead: €60,000",
          "Hours available for client work per year: 1,300",
          "Loaded hourly cost: €60,000 ÷ 1,300 ≈ €46 per hour",
        ],
      },
    },
    {
      heading: "A worked example",
      paragraphs: [
        "Two clients, one month, with the loaded hourly cost from above rounded to €45. The numbers are illustrative; use your own.",
      ],
      example: {
        title: "Two clients, one month",
        lines: [
          "Client A pays €4,000. 50 hours × €45 = €2,250, plus €150 in tools used only for this client.",
          "Client A: direct cost €2,400 · profit €1,600 · margin 40%",
          "Client B pays €2,500. 15 hours × €45 = €675, plus €100 in tools.",
          "Client B: direct cost €775 · profit €1,725 · margin 69%",
        ],
      },
      closing:
        "Client B pays less but earns more than Client A. Without the analysis, most teams would treat Client A as the more important account.",
    },
    {
      heading: "The hidden cost drivers",
      paragraphs: [
        "When a client turns out less profitable than expected, the cause is rarely the planned work. It is usually one of these:",
      ],
      bullets: [
        "Unplanned work: incidents, urgent requests and fixes that are not in the contract.",
        "Scope creep: small extras that were never priced but slowly became normal.",
        "Coordination: extra meetings, long email threads and many contact persons.",
        "Rework: tasks done twice because requirements changed or were unclear.",
        "Out-of-hours work, travel, and late payment that ties up your cash.",
      ],
    },
    {
      heading: "Step by step",
      steps: [
        { title: "Pick a period", text: "Use the last three months. One month is too noisy; a year hides recent changes." },
        { title: "List revenue per client", text: "Take what you actually invoiced in the period, not the contract value." },
        { title: "Collect hours per client", text: "Use time tracking if you have it. If not, ask the team for honest estimates and start tracking from now on." },
        { title: "Add direct costs", text: "Licences, subcontractors and anything else you pay only because of this client." },
        { title: "Calculate profit and margin", text: "Apply the formula above for every client and sort the list by margin." },
        { title: "Look at effort signals", text: "Next to each client, note the number of incidents and unplanned requests. They usually explain the outliers." },
      ],
    },
    {
      heading: "What to do with the results",
      paragraphs: ["Group your clients into four groups and treat each group differently:"],
      bullets: [
        "High revenue, high margin: your best clients. Protect them and look for ways to grow the relationship.",
        "High revenue, low margin: rescope or reprice. Show the client the effort data and agree on what is included.",
        "Low revenue, high margin: easy to serve. Often the best candidates for additional services.",
        "Low revenue, low margin: raise prices, reduce scope, or decide whether you want to keep the client.",
      ],
    },
    {
      heading: "How to talk to a client about price",
      paragraphs: [
        "A price conversation goes better with evidence than with opinions. Instead of saying that the client is \"a lot of work\", show what changed: how many unplanned requests there were, how many incidents, how much time they took compared with what the contract covers. Then offer options — a higher fee, a smaller scope, or extra services billed separately — so the client can choose.",
        "Repeat the analysis every quarter. Profitability changes when clients grow, change their team or start using your service differently, and you want to notice before renewal, not after.",
      ],
    },
  ],
  productFit: {
    heading: "Where Auroranexis fits",
    paragraphs: [
      "Auroranexis brings profitability context into the same workspace as your delivery records, so you can see which clients consume disproportionate effort relative to their contract value — next to their incidents, reporting and service history. Portfolio views help compare margin and effort across clients, and export-friendly summaries support leadership reviews.",
      "It does not replace your accounting system: invoices, bookkeeping and tax stay where they are. Auroranexis gives operations and account leads the context to act on the numbers.",
    ],
    links: [
      { label: "Client profitability reporting", href: FEATURE_ROUTES.profitability },
      { label: "Customer health score template", href: TEMPLATE_ROUTES.customerHealthScore },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
  },
  faq: [
    {
      question: "How do you calculate client profitability?",
      answer:
        "Subtract the direct cost of serving a client — hours spent multiplied by your loaded hourly cost, plus client-specific tools and third-party costs — from the revenue you received from that client in the same period.",
    },
    {
      question: "What is a good client margin?",
      answer:
        "It depends on your industry, pricing model and overhead. Compare your clients with each other first; the spread between your best and worst clients is usually more useful than an outside benchmark.",
    },
    {
      question: "Do I need time tracking for a client profitability analysis?",
      answer:
        "It makes the result much more reliable, but you can start with honest estimates from the team for the last three months and introduce time tracking for the next quarter.",
    },
    {
      question: "How often should I analyse client profitability?",
      answer:
        "Quarterly is a good rhythm for most service businesses, and always before a contract renewal or price change.",
    },
  ],
};

const slaReporting: GuideContent = {
  slug: "sla-reporting",
  path: GUIDE_ROUTES.slaReporting,
  title: "SLA reporting: what to measure and how to show it to clients",
  seoTitle: "SLA Reporting: What to Measure and Show",
  description:
    "Which SLA metrics to track, how to calculate them, how to present misses honestly, and a simple monthly SLA reporting process for service providers.",
  summary:
    "The SLA metrics that matter, how to calculate them, and how to report misses in a way that builds trust instead of losing it.",
  published: "2026-10-23",
  updated: "2026-10-23",
  readingMinutes: 8,
  intro: [
    "A service level agreement only helps you if you can show that you meet it. Most service providers have SLA targets in their contracts, but the evidence lives somewhere else — in a ticket system, in emails, in someone's memory. When a client asks how you performed, the answer is assembled by hand.",
    "SLA reporting turns that evidence into a regular, honest summary. It proves reliability when things go well, and it shows you problems before the client raises them. This guide covers what to measure, how to calculate it, and how to present it.",
  ],
  sections: [
    {
      heading: "The SLA metrics that matter",
      paragraphs: ["Keep the list short. These cover almost every service contract:"],
      bullets: [
        "First response time: how long until a request or incident received its first meaningful response.",
        "Resolution time: how long until it was solved.",
        "SLA attainment: the share of requests that met their target — the single most useful number.",
        "Breaches: every request that missed its target, with the reason.",
        "Volume by priority: how many requests there were at each priority level, to explain the workload.",
        "Availability: only if your contract promises uptime for a system you operate.",
      ],
    },
    {
      heading: "How to calculate SLA attainment",
      paragraphs: [
        "SLA attainment is the number of requests that met their target divided by all requests in the period, multiplied by 100. Calculate it separately for response and for resolution, and per priority level.",
        "Do not report averages alone. An average resolution time can look fine while several urgent incidents took far too long. Attainment and a list of breaches show what an average hides.",
      ],
      example: {
        title: "Example",
        lines: [
          "40 high-priority incidents in the month, 37 resolved within the target",
          "Resolution attainment: 37 ÷ 40 × 100 = 92.5%",
          "3 breaches, each listed with cause and corrective action",
        ],
      },
    },
    {
      heading: "Define targets per priority — and when the clock runs",
      paragraphs: [
        "Targets only work if everyone measures them the same way. Write down, per client or contract tier:",
      ],
      bullets: [
        "Priority levels and what qualifies for each — for example, \"urgent\" means the client cannot work at all.",
        "Response and resolution targets per priority.",
        "Whether the clock runs 24/7 or only during business hours, and in which time zone.",
        "When the clock pauses — for example while you wait for information from the client.",
      ],
      example: {
        title: "Example targets — adapt them to your contracts and team size",
        lines: [
          "Urgent (client cannot work): first response 30 minutes, resolution 4 hours",
          "High (important function impaired): first response 1 hour, resolution 1 business day",
          "Normal (single user or workaround available): first response 4 business hours, resolution 3 business days",
          "Low (question or small change): first response 1 business day, resolution 10 business days",
        ],
      },
      links: [
        { label: "SLA policy template", href: TEMPLATE_ROUTES.slaPolicy },
        { label: "SLA & uptime calculator", href: MARKETING_ROUTES.slaCalculator },
      ],
    },
    {
      heading: "How to present SLA results to clients",
      bullets: [
        "Start with one line: the attainment for the period and whether it met the contract.",
        "Show the trend over the last three to six months, not just the current month.",
        "List every breach with the cause and what you changed so it does not happen again.",
        "Explain unusual volume — a spike in requests often explains a dip in attainment.",
        "Keep it to one page. Detail can go in an appendix for clients who want it.",
      ],
      closing:
        "Reporting misses honestly is what makes the rest of the report believable. Clients usually remember the outage anyway; a clear explanation and a fix turn it into evidence that you are in control.",
    },
    {
      heading: "A simple monthly SLA reporting process",
      steps: [
        { title: "Attach a policy to every client", text: "Each client gets the SLA policy that matches their contract." },
        { title: "Record everything with timestamps", text: "Requests and incidents need a created, first-response and resolved time, in one system." },
        { title: "Watch warnings weekly", text: "Review requests that are close to their target, not only the ones that already missed it." },
        { title: "Report monthly", text: "Include SLA results in the regular client report, with the breaches explained." },
        { title: "Review quarterly", text: "Check whether targets still fit the contract and the team's capacity." },
      ],
    },
    {
      heading: "Common mistakes",
      bullets: [
        "Measuring differently from the contract, for example 24/7 when the contract says business hours.",
        "Reporting averages only, which hide the incidents clients care about most.",
        "Tracking SLAs in a spreadsheet that someone updates by hand at the end of the month.",
        "Reporting only when the client asks — by then the conversation is already about a problem.",
      ],
    },
  ],
  productFit: {
    heading: "Where Auroranexis fits",
    paragraphs: [
      "In Auroranexis you define SLA policies with response and resolution targets and assign them per client — by contract tier, service type or portfolio segment. Incidents and operational records are evaluated against those policies automatically, warnings and breaches show up on the records and on portfolio dashboards, and SLA outcomes can be included in client reports and the client portal. Policy and assignment changes are recorded in audit logs.",
      "SLA tracking is part of the Business and Enterprise plans, starting at €599 per month.",
    ],
    links: [
      { label: "SLA tracking", href: SOLUTION_ROUTES.slaManagement },
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
  },
  faq: [
    {
      question: "What is SLA reporting?",
      answer:
        "SLA reporting is the regular summary of how a service provider performed against the service levels agreed with a client — usually response and resolution times, attainment against targets, and an explanation of every breach.",
    },
    {
      question: "What is the difference between an SLA, an SLO and a KPI?",
      answer:
        "An SLA is the agreement with the client, including targets and consequences. An SLO is an individual target inside it, such as resolving urgent incidents within four hours. A KPI is any metric you track internally, whether or not it is promised to a client.",
    },
    {
      question: "How often should SLA reports be sent?",
      answer:
        "Monthly, as part of the regular client report, with a quarterly look at trends. Urgent breaches should be communicated when they happen, not only in the next report.",
    },
    {
      question: "What should I do when an SLA is missed?",
      answer:
        "Tell the client early, explain the cause, describe what you changed to prevent it, and apply any agreed service credits without being asked. List the breach in the next report as well.",
    },
  ],
};

const customerHealthScore: GuideContent = {
  slug: "customer-health-score",
  path: GUIDE_ROUTES.customerHealthScore,
  title: "Customer health score: how to build one for a service business",
  seoTitle: "Customer Health Score for Service Businesses",
  description:
    "How to build a customer health score when you sell a service, not software: which signals to use, how to weight them, a worked example and what to do next.",
  summary:
    "Which signals show client health in a service business, how to turn them into one score, and what to do when a client turns amber or red.",
  published: "2026-10-28",
  updated: "2026-10-28",
  readingMinutes: 9,
  intro: [
    "Most advice on customer health scores is written for software companies. It tells you to score logins, feature adoption and product usage. If you run an agency, an IT service provider, an accounting firm or a facility services company, your clients do not log in to anything. They receive a service, and their health shows up in other places: in how reliably you deliver, how they respond to you, and how the commercial relationship develops.",
    "A customer health score for a service business turns those signals into one simple rating per client, so you can see early which accounts need attention. This guide shows which signals to use, how to combine them, a worked example you can copy into a spreadsheet, and how to act on the result.",
  ],
  sections: [
    {
      heading: "What a customer health score is — and what it is not",
      paragraphs: [
        "A customer health score is a regular, rule-based rating of how likely a client is to stay, grow or leave. It combines a few signals you already have into one number or colour, and it should always show which signals caused the rating.",
        "It is not a prediction you can trust blindly, and it is not a replacement for talking to your clients. It is a way to make sure no account drifts for months without anyone noticing. A good score starts conversations; it does not end them.",
      ],
    },
    {
      heading: "The signals that show client health in a service business",
      paragraphs: [
        "Choose signals from four groups. You do not need all of them — four to six signals in total are enough for a first version.",
      ],
      bullets: [
        "Delivery: SLA attainment, number and severity of incidents, missed deadlines, rework. This is what the client experiences directly.",
        "Relationship: how quickly the client answers, whether they attend review meetings, whether your main contact has changed, the tone of recent feedback.",
        "Commercial: late or disputed invoices, requests for discounts, a reduced scope, or the opposite — requests for additional work.",
        "Engagement: whether the client reads your reports, uses the client portal if you have one, and gives input on plans.",
      ],
      closing:
        "A change of the main contact person deserves special attention. The person who chose you may be gone, and the new contact may not know what you deliver. Treat it as an early warning even when everything else looks fine.",
    },
    {
      heading: "How to build the score in six steps",
      steps: [
        {
          title: "Look back at clients you lost",
          text: "Write down the clients who left or reduced their contract in the last one or two years, and what happened in the months before. Those patterns tell you which signals matter in your business.",
        },
        {
          title: "Pick four to six signals",
          text: "Choose signals you can measure every month without guessing. If a signal depends on someone's mood that day, define it more precisely or leave it out.",
        },
        {
          title: "Set simple thresholds",
          text: "For every signal, define what counts as healthy, watch and at risk. Three levels are enough; scoring them 100, 50 and 0 keeps the arithmetic easy.",
        },
        {
          title: "Weight the signals",
          text: "Give the signals that best explained past losses the highest weight. The weights must add up to 100%.",
        },
        {
          title: "Calculate and set bands",
          text: "Multiply each signal score by its weight and add the results. Then turn the number into a colour, for example green at 75 or above, amber from 50 to under 75, red below 50.",
        },
        {
          title: "Assign an owner and an action per band",
          text: "Every client needs one person responsible for its health, and every band needs an agreed next step. A score without an action is just another dashboard.",
        },
      ],
    },
    {
      heading: "Example thresholds",
      paragraphs: [
        "These thresholds are an example for a service provider with monthly reporting. Adapt them to your contracts and your clients.",
      ],
      example: {
        title: "Example — three levels per signal",
        lines: [
          "SLA attainment: 100 if at or above target · 50 if up to 5 percentage points below · 0 if more than 5 percentage points below",
          "Incidents: 100 if no major incident in 90 days · 50 if one · 0 if two or more",
          "Responsiveness: 100 if the client replies within the agreed time and attends reviews · 50 if one review was missed · 0 if two reviews were missed or questions stay unanswered",
          "Payment: 100 if invoices are paid on time · 50 if one invoice was late · 0 if invoices are disputed or repeatedly late",
          "Sentiment: 100 if feedback is positive or neutral · 50 if there was one complaint · 0 if there were escalations or the main contact changed",
        ],
      },
      links: [{ label: "Customer health score template", href: TEMPLATE_ROUTES.customerHealthScore }],
    },
    {
      heading: "A worked example",
      paragraphs: [
        "One client, one month, using the thresholds above and these example weights: SLA attainment 30%, incidents 20%, responsiveness 20%, payment 15%, sentiment 15%. The numbers are illustrative; use your own.",
      ],
      example: {
        title: "Example — one client, one month",
        lines: [
          "SLA attainment at target: 100 × 30% = 30",
          "One major incident in 90 days: 50 × 20% = 10",
          "Two review meetings missed: 0 × 20% = 0",
          "Invoices paid on time: 100 × 15% = 15",
          "One complaint: 50 × 15% = 7.5",
          "Health score: 30 + 10 + 0 + 15 + 7.5 = 62.5 → amber",
        ],
      },
      closing:
        "The total says amber, but the detail says more: delivery is fine, yet the client has stopped showing up. That is why every score must show its drivers. The right action here is not a technical fix but a conversation with the client about whether the service still meets their needs.",
    },
    {
      heading: "What to do with green, amber and red clients",
      bullets: [
        "Green: keep the regular rhythm. Use the good results in your reports and ask whether there is more you could help with.",
        "Amber: the owner looks at the drivers within a week, talks to the client and writes down what will change. Check again at the next review.",
        "Red: escalate to the account lead or management, agree on a recovery plan with dates, and tell the client openly what you are doing. Review weekly until the client is back to amber.",
        "Any band: when a client moves down a band, treat the change itself as a signal, even if the new band is still green.",
      ],
      closing:
        "Bring the health history to your quarterly review with the client. Showing that you noticed a problem early and acted on it builds more trust than a perfect score.",
    },
    {
      heading: "Common mistakes",
      bullets: [
        "Too many signals: with fifteen inputs, nobody can explain why a client is amber. Start with four to six.",
        "Opinion only: a score based only on an account manager's gut feeling changes with the manager's mood. Use facts where you can and define the rest clearly.",
        "Revenue as health: a large client is not automatically a healthy one. Keep revenue and profitability separate from the health score and look at both.",
        "A black box: if the team cannot see why a client is red, they will not trust the score or act on it.",
        "Never checking it: test the score every six months against the clients who actually left or renewed, and adjust signals and weights.",
      ],
      links: [
        { label: "Client profitability analysis", href: GUIDE_ROUTES.clientProfitabilityAnalysis },
        { label: "SLA reporting", href: GUIDE_ROUTES.slaReporting },
      ],
    },
  ],
  productFit: {
    heading: "Where Auroranexis fits",
    paragraphs: [
      "Auroranexis is client operations software for service businesses. It derives client health indicators from the operational records in your workspace — incident volume, open risks, SLA performance and delivery activity — so health is based on evidence rather than check-in notes. Scoring is rule-based and shows the signals behind every rating; it is not a black-box AI score. You can configure thresholds and assign an owner per client, see health trends across the portfolio on dashboards, export summaries for quarterly reviews, and decide what each client sees in the client portal.",
      "Auroranexis is not a product analytics tool. If you sell software and want to score in-app usage, a customer success platform built for software companies will suit you better. Plans start at €179 per month for up to 25 clients; the incident, risk and SLA modules that feed many health signals are part of the Business and Enterprise plans, starting at €599 per month.",
    ],
    links: [
      { label: "Customer health score software", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "Client health monitoring", href: FEATURE_ROUTES.healthMonitoring },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
  },
  faq: [
    {
      question: "What is a customer health score?",
      answer:
        "It is a regular, rule-based rating of each client that combines a few signals — such as delivery quality, responsiveness, payment behaviour and feedback — into one number or colour, so you can see early which clients need attention.",
    },
    {
      question: "How many metrics should a customer health score have?",
      answer:
        "Four to six is a good start. Fewer signals make the score easy to explain and to trust. Add more only when you can show that they would have warned you about a client you lost.",
    },
    {
      question: "How do you calculate a customer health score?",
      answer:
        "Give every signal a score — for example 100 for healthy, 50 for watch and 0 for at risk — multiply each score by the signal's weight, and add the results. Then translate the total into a band such as green, amber or red.",
    },
    {
      question: "Should clients see their own health score?",
      answer:
        "Usually not the score itself, because it includes internal judgements such as payment behaviour. Share the parts that describe your service — SLA results, incidents and open risks — in your regular reports instead.",
    },
    {
      question: "How often should the health score be updated?",
      answer:
        "Monthly is enough for most service businesses, ideally right before the monthly report. Review red clients weekly until they recover, and check the scoring rules themselves every six months.",
    },
  ],
};

const clientChurnWarningSigns: GuideContent = {
  slug: "client-churn-warning-signs",
  path: GUIDE_ROUTES.clientChurnWarningSigns,
  title: "Warning signs a client is about to leave, and what to do about them",
  seoTitle: "Client Churn Warning Signs and What to Do",
  description:
    "The warning signs that a service client is about to leave, how to check them, and a step-by-step plan to keep the account or let it go well.",
  summary:
    "Thirteen warning signs that a recurring client may leave, how to tell a real signal from noise, and what to do in the first week after you spot one.",
  published: "2026-11-04",
  updated: "2026-11-04",
  readingMinutes: 9,
  intro: [
    "Clients of service businesses rarely leave without warning. An agency, an IT service provider, an accounting firm or a facility services company usually loses a client after weeks or months of small changes: shorter replies, a cancelled review meeting, a new contact who asks basic questions, an invoice that is suddenly questioned. Each change looks harmless on its own. Together, they are a pattern.",
    "The problem is that these signals are spread across different people and tools. The account manager notices the tone, finance notices the late payment, and the delivery team notices the extra escalations — but nobody puts the pieces together until the notice of termination arrives. This guide lists the warning signs that matter most, shows how to check whether they are real, and gives you a practical plan for the first week after you spot one.",
  ],
  sections: [
    {
      heading: "Why service clients leave",
      paragraphs: [
        "Before looking at the signs, it helps to know the usual causes. In service businesses, clients rarely leave because of one bad month. They leave because they stop seeing the value, because the relationship has weakened, or because something changed on their side.",
      ],
      bullets: [
        "Value is no longer visible: the work is being done, but the client cannot see what it achieves, so the invoice starts to feel expensive.",
        "Delivery has slipped: missed deadlines, repeated incidents or rework have used up the client's patience.",
        "The relationship has changed: the person who chose you has left, or a new manager wants to bring in their own providers.",
        "The client's situation has changed: budget cuts, a merger, a new strategy or a decision to take the work in-house.",
        "A competitor made a better offer: often after the client started looking because of one of the reasons above.",
      ],
      closing:
        "Only the last two are mostly outside your control. The first three are where warning signs appear early and where your response makes the biggest difference.",
    },
    {
      heading: "Thirteen warning signs to watch",
      paragraphs: [
        "Group the signs by where they appear. One sign alone is a reason to pay attention, not to panic. Two or more from different groups within a few weeks is a reason to act.",
      ],
      bullets: [
        "Communication: replies get shorter and slower, or questions stay unanswered.",
        "Communication: review meetings are cancelled, moved again and again, or attended by someone more junior.",
        "Communication: feedback stops. A client who used to complain about details and now says nothing is not necessarily happy.",
        "People: your main contact leaves, changes role or is replaced by someone who does not know your history.",
        "People: a new decision-maker, such as a new head of marketing, IT or finance, appears in conversations.",
        "Delivery: escalations increase, or the client starts copying their manager into routine emails.",
        "Delivery: the same type of incident or mistake happens more than once in a short period.",
        "Commercial: the client questions invoices, asks for a discount or wants to reduce the scope.",
        "Commercial: payments arrive later than usual without an explanation.",
        "Commercial: renewal talks are postponed, or the client asks for a shorter contract term.",
        "Information: the client asks for exports of their data, copies of documents, passwords or admin access to accounts you manage.",
        "Information: the client asks detailed questions about the notice period or the exit terms in the contract.",
        "Engagement: reports are no longer opened, portal logins stop, and nobody gives input on plans.",
      ],
      closing:
        "Requests for data, access or exit terms deserve the fastest response. They do not always mean the client is leaving — some clients simply tidy up their documentation — but they are among the clearest signs, because they are exactly what a client needs to prepare an exit.",
    },
    {
      heading: "How to tell a real signal from noise",
      paragraphs: [
        "Not every short email means trouble. People go on holiday, have busy quarters and change their habits. To avoid both overreacting and ignoring a real problem, check each sign against three questions.",
      ],
      steps: [
        {
          title: "Is it a change from this client's normal behaviour?",
          text: "Compare with the same client over the last six to twelve months, not with your other clients. A client who always pays on day 40 is not a risk when they pay on day 40.",
        },
        {
          title: "Does it repeat or combine with other signs?",
          text: "One cancelled meeting is noise. A cancelled meeting, a late payment and a question about the notice period in the same month are a pattern.",
        },
        {
          title: "Is there a simple explanation you can confirm?",
          text: "Ask. A short, friendly message such as \"We noticed the last two reviews were moved — is there a better time or format for you?\" often answers the question within a day.",
        },
      ],
    },
    {
      heading: "Write signals down in one place",
      paragraphs: [
        "Warning signs only form a pattern when someone can see them together. Keep a simple signal log per client — a shared spreadsheet is enough to start — and ask everyone who works with the client to add what they notice. Review the log for every client before the monthly report and before any renewal discussion.",
      ],
      example: {
        title: "Example — signal log for one client",
        lines: [
          "3 Sep · Account manager · Monthly review moved for the second time",
          "17 Sep · Finance · Invoice paid 21 days later than usual",
          "24 Sep · Delivery · Client copied their manager into a routine ticket",
          "2 Oct · Account manager · New operations manager joined the review meeting",
          "Pattern: four signs from four groups in one month → owner contacts the client this week",
        ],
      },
      closing:
        "The entries above are invented for illustration. The point is the structure: date, who noticed it, and what exactly happened, written as a fact rather than a feeling.",
    },
    {
      heading: "What to do in the first week",
      paragraphs: [
        "Once you see a pattern, speed matters more than a perfect plan. The goal of the first week is to understand what the client thinks, not to defend yourself or offer a discount.",
      ],
      steps: [
        {
          title: "Name one owner",
          text: "One person is responsible for the client until the situation is clear. Usually that is the account manager, with a senior person in the background.",
        },
        {
          title: "Prepare the facts",
          text: "Collect what you delivered in the last three to six months, the service levels you reached, the incidents and how you handled them, and anything still open. You need this to have an honest conversation.",
        },
        {
          title: "Ask for a conversation about the relationship, not the project",
          text: "Say openly that you want to make sure the service still fits the client's needs. Ask what has changed on their side, what they would like to be different, and how they judge the value of your work today.",
        },
        {
          title: "Listen and write down what you hear",
          text: "Do not argue during the conversation. Repeat the main points back to the client so they know you understood, and agree on when you will come back with a proposal.",
        },
        {
          title: "Come back with a written plan",
          text: "Within a few days, send a short plan: what you will change, who is responsible and by when. Keep promises small enough that you can deliver all of them.",
        },
      ],
      links: [{ label: "Quarterly business review template", href: TEMPLATE_ROUTES.quarterlyBusinessReview }],
    },
    {
      heading: "Mind the notice period",
      paragraphs: [
        "Most recurring service contracts have a notice period, and clients usually decide well before it. If you only start paying attention when the renewal date is close, the decision may already be made. Work backwards from the notice deadline of every contract.",
      ],
      example: {
        title: "Example — working back from a notice deadline",
        lines: [
          "Contract ends: 30 June",
          "Notice period: 3 months → notice must be given by 31 March",
          "Assume the client needs about 2 months to decide and find an alternative → the decision forms from about the end of January",
          "Your latest sensible point for a relationship review: early January, before that decision starts",
        ],
      },
      closing:
        "The dates are an example; check the terms in your own contracts. Put each client's notice deadline in your calendar with a reminder several months earlier, and hold a review before that reminder, not after the notice arrives.",
    },
    {
      heading: "When to let a client go",
      paragraphs: [
        "Not every client should be saved. If a client has been unprofitable for a long time, keeps asking for work outside the agreed scope, or treats your team badly, a respectful exit can be the better decision. Look at the client's profitability before you offer discounts or extra work to keep them.",
        "If a client does leave, make the exit professional: hand over data and access quickly and completely, confirm the last date of service in writing, and ask for a short exit conversation. Ask what made them decide and when they started thinking about it. The answer to the second question tells you which warning signs you missed.",
      ],
      links: [
        { label: "Client profitability analysis", href: GUIDE_ROUTES.clientProfitabilityAnalysis },
        { label: "Customer health score", href: GUIDE_ROUTES.customerHealthScore },
      ],
    },
    {
      heading: "Common mistakes",
      bullets: [
        "Waiting for proof: by the time a client says they are unhappy, they have often already decided. Act on patterns, not on certainty.",
        "Leading with a discount: a lower price does not fix missing value or a broken relationship, and it teaches the client that complaining pays.",
        "Keeping it in one head: if only the account manager knows the client is drifting, nobody else can help, and the knowledge leaves with that person.",
        "Hiding problems: a client who discovers an incident you did not mention loses trust much faster than one you told early.",
        "Forgetting quiet clients: the clients who never complain and never attend reviews are often the ones who leave without warning.",
      ],
    },
  ],
  productFit: {
    heading: "Where Auroranexis fits",
    paragraphs: [
      "Auroranexis is client operations software for service businesses. It brings many of the signals in this guide into one workspace: client health indicators built from operational records, incidents, open risks, SLA performance, report engagement and portal usage where configured, plus an activity history for every client. Health scoring is rule-based and shows the evidence behind each rating, so your team can see which clients show declining signals and why, and prepare account reviews with facts rather than notes.",
      "Auroranexis does not read your email or judge the tone of client messages, and it is not a CRM. Signals such as a changed contact or a question about the notice period still need to be noticed and recorded by your team. Plans start at €179 per month for up to 25 clients; the incident, risk and SLA modules are part of the Business and Enterprise plans, starting at €599 per month. You can also start a 7-day free trial or apply for the 6-week pilot program.",
    ],
    links: [
      { label: "Customer success tools", href: FEATURE_ROUTES.customerSuccess },
      { label: "Customer health score software", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
  },
  faq: [
    {
      question: "What are the most common signs that a client is about to leave?",
      answer:
        "Slower and shorter communication, cancelled review meetings, a new main contact or decision-maker, questioned invoices or late payments, more escalations, and requests for data exports, access or the exit terms of the contract.",
    },
    {
      question: "How early can you spot client churn?",
      answer:
        "Often several months before the notice arrives, if someone collects the signals in one place. Work backwards from each contract's notice deadline and hold a relationship review well before the client has to decide.",
    },
    {
      question: "What should I say to a client who seems unhappy?",
      answer:
        "Ask for a conversation about whether the service still fits their needs. Ask what has changed on their side and what they would like to be different, listen without defending yourself, and come back with a short written plan.",
    },
    {
      question: "Should I offer a discount to keep a client?",
      answer:
        "Usually not as the first step. A discount does not solve missing value or a weakened relationship. Understand the reason first, fix what you can, and check the client's profitability before changing the price.",
    },
    {
      question: "What is the difference between warning signs and a customer health score?",
      answer:
        "Warning signs are individual events you notice, such as a cancelled meeting or a late payment. A health score combines a few measurable signals into one regular rating. The two work best together: the score shows the trend, the signal log explains it.",
    },
  ],
};

const quarterlyBusinessReview: GuideContent = {
  slug: "quarterly-business-review",
  path: GUIDE_ROUTES.quarterlyBusinessReview,
  title: "How to run a quarterly business review with clients",
  seoTitle: "How to Run a Quarterly Business Review",
  description:
    "How to run a quarterly business review (QBR) with clients of a service business: who to invite, what to prepare, how to show results and how to follow up.",
  summary:
    "A practical way to prepare, run and follow up a QBR with recurring clients, including how to present bad news and how to decide which clients need one.",
  published: "2026-11-11",
  updated: "2026-11-11",
  readingMinutes: 10,
  intro: [
    "A quarterly business review, or QBR, is a planned meeting with a client every three months to look back at the last quarter and agree what comes next. Many agencies, IT service providers, accounting firms and facility services companies hold them, but often in a way that does not help much: a long slide deck of completed tasks, a polite \"any questions?\", and no change afterwards.",
    "A good QBR is different. It starts with the client's goals, shows honestly how the last quarter contributed to them, deals openly with problems, and ends with a short list of decisions and actions. Done well, it is one of the best tools a service business has to show its value and to catch an unhappy client early. This guide explains how to prepare, run and follow up a QBR, and how to adapt it to small and large clients.",
  ],
  sections: [
    {
      heading: "What a QBR is for",
      paragraphs: [
        "A QBR has three jobs. It shows the client what your work achieved, in their terms. It checks whether the client's goals, people or budget have changed. And it agrees on the priorities for the next quarter, so both sides know what to expect.",
        "A QBR is not a status meeting, a sales pitch or a monthly report read aloud. Your monthly reports cover the details. The QBR steps back and asks whether the relationship is still heading in the right direction. If you use the meeting mainly to present new services, clients learn to skip it.",
      ],
    },
    {
      heading: "Decide which clients get a QBR",
      paragraphs: [
        "A full QBR takes preparation time, so not every client needs the same format. Decide once per client and write the decision down, so the rhythm does not depend on who has time this month.",
      ],
      bullets: [
        "Full QBR (45–60 minutes, with slides): your largest clients, clients with SLAs or complex delivery, and any client with a renewal in the next six months.",
        "Short review (20–30 minutes, a one-page summary): smaller recurring clients. Same structure, fewer slides.",
        "Written review only: very small clients who prefer email. Send the one-page summary and offer a conversation if they want one.",
        "Extra review, whatever the size: any client who shows warning signs, such as cancelled meetings, a new main contact or repeated incidents.",
      ],
      links: [{ label: "Client churn warning signs", href: GUIDE_ROUTES.clientChurnWarningSigns }],
    },
    {
      heading: "Who should attend",
      paragraphs: [
        "On your side, keep it small: the person responsible for the account, and the delivery or service lead if service performance is on the agenda. Bring a senior person when the client brings one, or when there is a serious problem to discuss.",
        "On the client's side, the most important attendee is the person who decides whether to renew, not only the person you work with day to day. If the decision-maker never attends, ask your main contact openly who should see the results and whether a shorter slot would make it easier for them. A QBR that only reaches the operational contact cannot do its main job.",
      ],
    },
    {
      heading: "How to prepare in two weeks",
      steps: [
        {
          title: "Two weeks before: collect the facts",
          text: "Pull the quarter's numbers from the systems you already use: work delivered against the plan, service levels, incidents, open risks, and the client's health trend if you track one. Read the last QBR summary and check which actions were completed.",
        },
        {
          title: "Ten days before: ask the client what they want to discuss",
          text: "Send a short message: \"We are preparing our quarterly review. Is there anything you would like us to cover, or anything that has changed on your side?\" The answer often tells you more than your own data.",
        },
        {
          title: "One week before: choose three main messages",
          text: "Agree internally on the three things the client should remember. For example: one result you are proud of, one problem and how you fixed it, and one recommendation for the next quarter.",
        },
        {
          title: "Three days before: build the slides",
          text: "Keep the main part short. Put detailed task lists and full metric tables in an appendix. Every main slide should answer the question \"so what does this mean for the client?\"",
        },
        {
          title: "Two days before: send the material",
          text: "Send the slides or the one-page summary in advance, so the meeting can be spent on discussion rather than reading.",
        },
      ],
      links: [{ label: "QBR template with a 60-minute agenda", href: TEMPLATE_ROUTES.quarterlyBusinessReview }],
    },
    {
      heading: "Show results against the client's goals",
      paragraphs: [
        "The most common QBR mistake is to report activity instead of outcomes. \"We closed 412 tickets\" describes your effort. \"Your team waited less for IT support than last quarter\" describes the client's benefit. Start from the goals the client named at the beginning of the year, and show for each one what changed and what you did.",
        "Compare with the previous quarter, so the client sees a trend rather than a single number. Where you cannot measure the effect yourself, say so, and ask the client how they see it.",
      ],
      example: {
        title: "Example — one goal, two quarters",
        lines: [
          "Client goal: faster IT support for staff",
          "Previous quarter: 352 of 400 tickets answered within target = 88.0%",
          "This quarter: 391 of 412 tickets answered within target = 94.9%",
          "Change: +6.9 percentage points, with 12 more tickets than last quarter",
          "What we changed: a second person on the morning shift and a new process for password resets",
        ],
      },
      closing:
        "The numbers are invented for illustration. The structure is what matters: the goal, the result over time, and the reason behind the change.",
      links: [{ label: "SLA reporting guide", href: GUIDE_ROUTES.slaReporting }],
    },
    {
      heading: "How to present bad news",
      paragraphs: [
        "Every client has quarters with problems: a missed deadline, a major incident, a service level below target. Do not hide them in the appendix. The client usually knows already, and a QBR that skips them loses credibility for everything else on the slides.",
      ],
      steps: [
        {
          title: "Name it first",
          text: "Raise the problem yourself, early in the meeting, in one plain sentence. Do not wait for the client to ask.",
        },
        {
          title: "Explain the cause briefly",
          text: "Say what happened and why, without blaming the client, a supplier or a colleague.",
        },
        {
          title: "Show what you changed",
          text: "Describe the fix and what prevents the same problem from happening again. If the fix is not finished, give a date.",
        },
        {
          title: "Agree on how you will report progress",
          text: "Tell the client where they will see whether the fix works, for example in the next two monthly reports.",
        },
      ],
    },
    {
      heading: "Run the meeting",
      paragraphs: [
        "Open by asking whether the client's goals or situation have changed since the last review. Then go through results, service performance, risks and next quarter's plan. Leave at least a quarter of the time for discussion and feedback; if the slides take the whole hour, the QBR has become a presentation.",
        "Ask open questions and write down the answers. Useful questions include:",
      ],
      bullets: [
        "What has changed in your business since our last review?",
        "Which part of our work is most valuable to you right now — and which least?",
        "Is there anything we do that creates extra work on your side?",
        "Who else in your organisation should see these results?",
        "What would make the next quarter a success from your point of view?",
      ],
      closing:
        "Close the meeting by reading back the actions you agreed, with an owner and a date for each. If you made a recommendation that needs a decision, agree when the client will decide.",
    },
    {
      heading: "Follow up within two working days",
      paragraphs: [
        "The follow-up is what turns a QBR from a meeting into a plan. Send a short written summary within two working days and store it with the client's records, so the next QBR can start from it.",
      ],
      example: {
        title: "Example — QBR follow-up summary",
        lines: [
          "Thank you for the review on [date]. Here is a short summary.",
          "What went well: [one or two results against your goals]",
          "What we are fixing: [problem, fix, date]",
          "Changes on your side we noted: [for example a new contact or a new priority]",
          "Agreed actions: [action — owner — date], [action — owner — date]",
          "Next review: [date]. We will start with the status of these actions.",
        ],
      },
      closing:
        "Open the next QBR with the status of these actions. Clients notice when promises from the last review are checked, and they notice even more when they are quietly forgotten.",
    },
    {
      heading: "Common mistakes",
      bullets: [
        "Too many slides: if you cannot explain the quarter in five or six main slides, the client will not remember it either.",
        "Activity instead of outcomes: hours, tickets and tasks belong in the appendix. Lead with what changed for the client.",
        "Selling first: a QBR that opens with a new offer feels like a sales meeting. Make recommendations at the end, based on the client's goals.",
        "The wrong people: if the decision-maker never attends, the results never reach the person who decides about renewal.",
        "No follow-up: without a written summary and owners, the same issues come back three months later.",
        "Only good news: leaving out problems the client already knows about makes the whole review less credible.",
      ],
      links: [
        { label: "Automated client reporting", href: GUIDE_ROUTES.automatedClientReporting },
        { label: "Customer health score", href: GUIDE_ROUTES.customerHealthScore },
      ],
    },
  ],
  productFit: {
    heading: "Where Auroranexis fits",
    paragraphs: [
      "Auroranexis is client operations software for service businesses. It keeps much of what you need for a QBR in one workspace: published client reports with a history per client, SLA results, incidents and open risks, client health indicators with the signals behind each rating, and an activity timeline. Reports are built from templates, can be scheduled, reviewed before publishing, exported as PDF and shared in the client portal, where you control what each client sees.",
      "Auroranexis does not run the meeting for you, and it is not a presentation or slide tool: the conversation, the questions and the follow-up are still your team's work. Plans start at €179 per month for up to 25 clients; SLA tracking and the risk and incident modules are part of the Business and Enterprise plans, starting at €599 per month. You can start a 7-day free trial or apply for the 6-week pilot program.",
    ],
    links: [
      { label: "Report templates and publishing", href: FEATURE_ROUTES.reports },
      { label: "Automated client reporting software", href: SOLUTION_ROUTES.aiReporting },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
  },
  faq: [
    {
      question: "What is a quarterly business review?",
      answer:
        "A quarterly business review (QBR) is a planned meeting with a client every three months. It looks back at what the last quarter achieved against the client's goals, discusses problems and changes, and agrees on priorities and actions for the next quarter.",
    },
    {
      question: "How long should a QBR be?",
      answer:
        "Forty-five to sixty minutes is enough for most large clients, and twenty to thirty minutes for smaller ones. Keep at least a quarter of the time for discussion, and send the material two days in advance so the meeting is not spent reading slides.",
    },
    {
      question: "What should be included in a QBR?",
      answer:
        "The client's goals and whether they changed, results against those goals compared with the previous quarter, service performance and incidents, open risks and what you need from the client, a plan for the next quarter, and agreed actions with owners and dates.",
    },
    {
      question: "Who should attend a QBR?",
      answer:
        "On your side, the account owner and, if needed, the delivery lead. On the client's side, your day-to-day contact and, ideally, the person who decides about renewing the contract.",
    },
    {
      question: "What is the difference between a QBR and a monthly report?",
      answer:
        "A monthly report documents what happened in the month. A QBR steps back: it looks at trends over the quarter, checks whether the client's goals are still the same, and agrees on direction. The monthly reports are the input; the QBR is the conversation about them.",
    },
  ],
};

const monthlyClientReportTemplate: GuideContent = {
  slug: "monthly-client-report-template",
  path: GUIDE_ROUTES.monthlyClientReportTemplate,
  title: "What to include in a monthly client report (with an outline)",
  seoTitle: "Monthly Client Report Template and Outline",
  description:
    "A monthly client report outline for service businesses: the seven sections, example wording for each, a one-page version, a cover email and a checklist.",
  summary:
    "A seven-section outline for monthly client reports, with example wording, a one-page version for small clients, a cover email and a pre-send checklist.",
  published: "2026-11-18",
  updated: "2026-11-18",
  readingMinutes: 9,
  intro: [
    "Most monthly client report templates you find online are slide designs for marketing agencies: colourful charts of clicks, leads and ad spend. That is useful if you run campaigns. If you run an IT service, an accounting or payroll practice, a cleaning or facility contract, or a property portfolio, your clients want to know something else: was the work done, did the service meet what was agreed, did anything go wrong, and do they need to decide anything.",
    "This guide gives you a plain outline for that kind of report. It covers the seven sections that belong in it, what to write in each one with example wording, how long the report should be, a one-page version for small clients, a short cover email, and a checklist to run before you send. You can copy the outline into a document today and use it for next month's reports.",
  ],
  sections: [
    {
      heading: "What a monthly client report is for",
      paragraphs: [
        "A monthly report has two jobs. It gives the client an honest record of what happened in the month, and it shows the value of the service in a form they can pass on to their own manager. A third job is quieter but just as important: over a year, your reports become the evidence you rely on at renewal.",
        "That means the report is not a list of everything your team touched. It is a short answer to the questions a busy client actually has. If a section does not help answer one of those questions, leave it out or move it to an appendix.",
      ],
    },
    {
      heading: "The outline: seven sections",
      paragraphs: [
        "Use the same sections in the same order every month and for every client. Clients learn where to look, and changes from one month to the next become easy to spot. You can change what goes into a section; keep the structure stable.",
      ],
      steps: [
        { title: "1. Header", text: "Client name, reporting period, date of the report, and who prepared it. One line each." },
        { title: "2. Summary", text: "Three to five sentences in plain language: how the month went and the one thing the client should know." },
        { title: "3. Work delivered", text: "What you did, compared with what was agreed for the month or in the contract." },
        { title: "4. Service levels", text: "Results against the targets in your contract, if you have them, with the previous month for comparison." },
        { title: "5. Issues and incidents", text: "What went wrong, what you did about it, and what prevents it from happening again." },
        { title: "6. Open risks and decisions", text: "Anything that needs the client's attention, approval or input, with a date." },
        { title: "7. Next month", text: "Planned work and key dates, so next month's report has something to measure against." },
      ],
      closing:
        "Put detailed ticket lists, timesheets or full metric tables in an appendix at the end. Most readers will never open it, but the few who want the detail will know where it is.",
    },
    {
      heading: "How to write the summary",
      paragraphs: [
        "The summary is the only part many clients read, so write it last, after you have seen all the numbers. It should make sense to someone who reads nothing else. Start with an overall verdict, mention the most important result, name any problem in plain words, and end with what you need from the client, if anything.",
        "Avoid internal terms, ticket numbers and abbreviations the client does not use. Write the way you would explain the month to the client's manager in a short conversation.",
      ],
      example: {
        title: "Example summary — IT services client",
        lines: [
          "November was a stable month. All planned updates were installed on schedule, and support requests were answered faster than in October.",
          "One problem: the backup of the file server failed on two nights in the second week. We found the cause, fixed it on 14 November, and tested a full restore on 15 November.",
          "One decision for you: three laptops reach the end of their warranty in January. Please confirm by 10 December whether we should order replacements.",
        ],
      },
      closing: "This summary is invented for illustration. Notice that it states the problem openly and gives the client a specific question with a date.",
    },
    {
      heading: "What to write in each section",
      bullets: [
        "Work delivered: compare with the plan, not just a list of tasks. \"Agreed: 24 hours of project work. Delivered: 21 hours; 3 hours moved to December at your request.\" If you work on a fixed scope, list the recurring items and mark each as done, partly done or not done, with a reason.",
        "Service levels: show the target, the result and last month's result side by side. If you missed a target, say so in the same line and point to the issues section for the reason.",
        "Issues and incidents: for each one, give the date, what the client noticed, the cause in one sentence, the fix, and what you changed to prevent it. Do not leave out problems the client already knows about.",
        "Open risks and decisions: write each item as a question the client can answer, with an owner and a date. \"Please approve\" is clearer than \"for your information\".",
        "Next month: list the planned work and any dates that matter to the client, such as maintenance windows, filing deadlines, inspections or contract milestones.",
      ],
      example: {
        title: "Example — service levels section",
        lines: [
          "Urgent requests answered within 1 hour: 4 of 4 (100%). October: 3 of 3 (100%).",
          "All requests resolved within the agreed time: 183 of 197 = 92.9%. Target: 95%. October: 96.1%.",
          "Below target by 2.1 percentage points. Most of the late requests were caused by the backup problem described under Issues.",
        ],
      },
      closing: "The numbers are invented for illustration. Check your own arithmetic before every report: a wrong percentage is the fastest way to lose a client's trust in the whole document.",
      links: [{ label: "SLA reporting guide", href: GUIDE_ROUTES.slaReporting }],
    },
    {
      heading: "Adapting the outline to your type of service",
      paragraphs: [
        "The seven sections work across most recurring services. What changes is the content of sections 3 to 6. Some examples of what usually belongs there:",
      ],
      bullets: [
        "IT and managed services: requests and response times, patching and backup status, security incidents, devices or licences that need a decision.",
        "Accounting, bookkeeping and payroll: filings and payroll runs completed, upcoming deadlines, documents still missing from the client, and questions that block your work.",
        "Cleaning and facility services: visits or shifts completed against the schedule, inspection results, complaints and how they were handled, access or supply problems on site.",
        "Property management: maintenance requests and their status, rent and arrears figures, vacancies, upcoming inspections, and spending that needs the owner's approval.",
        "Agencies on a retainer: work delivered against the retainer, hours or credits used, results the client cares about, and approvals you are waiting for.",
      ],
    },
    {
      heading: "How long should the report be?",
      paragraphs: [
        "As short as it can be while still answering the client's questions. For most clients, two to four pages plus an optional appendix is enough. A larger client with service level agreements and several locations may need more, but the summary still belongs on the first page.",
        "For small clients, a one-page version works well. Use the same sections, but limit each one to one or two lines. If nothing happened in a section, say so in one line, for example \"No incidents this month.\" An empty section tells the client something useful too; a missing one makes them wonder.",
        "Whatever the length, send reports on the same working day every month, for example by the fifth working day. Regular delivery is part of the message: it shows that the service is under control.",
      ],
    },
    {
      heading: "A short cover email",
      paragraphs: [
        "Many clients see the email before they open the report, so put the summary in the email too. Keep it short and make the next step clear.",
      ],
      example: {
        title: "Example — cover email",
        lines: [
          "Subject: [Client name] — monthly report for [month]",
          "Hello [name], your report for [month] is attached [or: is available in your client portal].",
          "In short: [one or two sentences from the summary].",
          "One thing we need from you: [decision or input] by [date].",
          "If anything in the report is unclear, just reply to this email.",
        ],
      },
    },
    {
      heading: "Checklist before you send",
      bullets: [
        "The reporting period and the client name are correct everywhere, including the file name.",
        "Every number matches the source system, and every percentage has been recalculated.",
        "Last month's figures are shown where the client will want to compare.",
        "Every missed target and every incident the client knows about is mentioned and explained.",
        "Each open decision has an owner and a date.",
        "Nothing in the report belongs to another client. Check copied text and attachments twice.",
        "No internal notes, abbreviations or ticket comments that were not written for the client.",
        "A colleague or the account owner has read it before it goes out.",
        "A copy of exactly what was sent is stored with the client's records.",
      ],
      links: [
        { label: "Executive report template", href: TEMPLATE_ROUTES.executiveReport },
        { label: "Automated client reporting guide", href: GUIDE_ROUTES.automatedClientReporting },
      ],
    },
    {
      heading: "Common mistakes",
      bullets: [
        "Activity instead of outcomes: \"We closed 197 requests\" says little. \"Requests were resolved faster than last month\" says what the client gets.",
        "A different structure every month: clients cannot compare months if the sections move around.",
        "Only good news: a report that skips a known problem makes the client doubt everything else in it.",
        "No questions for the client: if decisions are buried in the text, they do not get made, and the same item appears again next month.",
        "Too much detail up front: long tables before the summary push the important part where nobody reads it.",
      ],
      links: [{ label: "How to run a quarterly business review", href: GUIDE_ROUTES.quarterlyBusinessReview }],
    },
  ],
  productFit: {
    heading: "Where Auroranexis fits",
    paragraphs: [
      "Auroranexis is client operations software for service businesses, and recurring client reports are one of its core modules. Report templates have configurable sections and branding, so you can set up an outline like the one above once and use it for every client. Depending on the template, reports can include incidents, risks, SLA outcomes and delivery metrics from your workspace. Your team generates a draft, reviews and edits it, then publishes it to the client portal, where you control what each client sees, or exports it as a PDF. Schedules create recurring reports, and a history of every published report is kept per client.",
      "Auroranexis prepares the structure and the figures; the summary and the judgement in it remain your team's work. It is not a slide design or marketing analytics tool. AI-assisted narrative is optional and available for executive reports, and a person still reviews before anything is published. Plans start at €179 per month for up to 25 clients; SLA tracking and the risk and incident modules are part of the Business and Enterprise plans, starting at €599 per month. You can start a 7-day free trial or apply for the 6-week pilot program.",
    ],
    links: [
      { label: "Report templates and publishing", href: FEATURE_ROUTES.reports },
      { label: "Client portal", href: FEATURE_ROUTES.clientPortal },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
  },
  faq: [
    {
      question: "What should be included in a monthly client report?",
      answer:
        "A header with the client and period, a short plain-language summary, work delivered against what was agreed, service levels against targets, issues and incidents with what you did about them, open risks and decisions for the client, and the plan for next month.",
    },
    {
      question: "How long should a monthly client report be?",
      answer:
        "Two to four pages plus an optional appendix is enough for most clients, and one page often works for small ones. Keep the same sections every month and put the summary on the first page.",
    },
    {
      question: "When should I send monthly client reports?",
      answer:
        "On a fixed working day early in the following month, for example by the fifth working day. Pick a date you can keep for every client, every month.",
    },
    {
      question: "Should I include problems and missed targets in a client report?",
      answer:
        "Yes. State the problem plainly, explain the cause in one sentence, and say what you changed. Clients usually know about problems already, and a report that leaves them out loses credibility.",
    },
    {
      question: "What is the difference between a monthly report and a QBR?",
      answer:
        "A monthly report records what happened in the month. A quarterly business review is a conversation every three months that looks at trends across those reports, checks whether the client's goals have changed and agrees on priorities.",
    },
  ],
};

const mspClientReporting: GuideContent = {
  slug: "msp-client-reporting",
  path: GUIDE_ROUTES.mspClientReporting,
  title: "Client reporting for MSPs: what to show every month",
  seoTitle: "MSP Client Reporting: What to Show Monthly",
  description:
    "What an MSP should show clients every month: service desk, patching, backups, security, assets and decisions, with clear metric definitions and an example.",
  summary:
    "What managed service providers should report to clients every month, how to turn PSA and RMM exports into numbers clients trust, and a one-page example.",
  published: "2026-11-25",
  updated: "2026-11-25",
  readingMinutes: 9,
  intro: [
    "A managed IT service is easy to forget when it works. Updates install at night, backups run, threats are blocked, and the client sees nothing. Then one bad week happens, and the client remembers only that. A good monthly report fixes this imbalance: it makes the quiet work visible and gives the client a fair picture of the whole month.",
    "Most MSPs already have plenty of data. The service desk tool, the remote monitoring tool, the backup console and the security products can all export reports. The problem is that these exports are written for technicians. A business owner does not want forty pages of device lists. They want to know whether their IT is safe and working, what went wrong, and what they need to decide.",
    "This guide explains what to show every month, how to define each number so it stays comparable, how to write for two different readers, and what to leave out. It ends with a one-page example you can adapt.",
  ],
  sections: [
    {
      heading: "Two readers, two layers",
      paragraphs: [
        "Most MSP clients have two kinds of readers. The first is the owner, director or office manager who pays for the service. They read the first page and look for problems and decisions. The second is the internal IT contact or a technically minded manager, who may want device-level detail.",
        "Write for both by using two layers. Page one is a short summary in plain business language: how the month went, what went wrong, and what the client needs to decide. Everything after that is supporting detail that a technical reader can check. Keep raw tool exports in an appendix, or leave them out and offer them on request.",
        "If you only have time to do one layer well, do the first page. It is the part that shapes how the client feels about your service at renewal.",
      ],
    },
    {
      heading: "What to show every month",
      paragraphs: [
        "Use the same areas in the same order every month, so the client learns where to look and changes stand out. For most managed IT contracts, seven areas cover what matters:",
      ],
      steps: [
        { title: "1. Service desk", text: "Requests received and resolved, response and resolution times against the agreed targets, and the main themes behind the requests." },
        { title: "2. Service levels", text: "Results against each target in the contract, with last month's result next to it. If there is no formal SLA, show response and resolution times against what you promised." },
        { title: "3. Patching and updates", text: "How many managed devices are fully up to date, how many are waiting for a restart, and how many could not be updated and why." },
        { title: "4. Backups and recovery", text: "Successful and failed backup jobs, how failures were fixed, and the date and result of the last restore test." },
        { title: "5. Security", text: "Security events that needed action, confirmed incidents, and the status of protection such as endpoint security and multi-factor sign-in, if you manage them." },
        { title: "6. Devices, licences and lifecycle", text: "Devices added or removed, warranties and contracts that end soon, and licence counts that no longer match the number of users." },
        { title: "7. Decisions and recommendations", text: "Anything that needs the client's approval or budget, each with a short reason, an estimated cost if you know it, and a date." },
      ],
      closing:
        "Projects, if the client has any running, can be one extra line: what was planned for the month, what was delivered, and the next milestone.",
    },
    {
      heading: "Define each number once and keep it stable",
      paragraphs: [
        "Clients lose trust in a report when numbers change meaning from one month to the next. Before the first report, write down a short definition for every figure you show, and use the same definition every month.",
      ],
      bullets: [
        "Patch status: say which devices count. For example, \"all managed workstations and servers that were online at least once in the last 14 days\". Show offline devices as a separate line rather than quietly dropping them.",
        "Backup success: count scheduled jobs, not devices. A server that failed on three nights is three failed jobs, not one problem device.",
        "Response time: say whether it is measured in business hours or around the clock, and whether the clock pauses while you wait for the client.",
        "Device counts: your monitoring tool, backup console and licence portal will rarely show the same total. Pick one as the reference list, and explain any difference in one line.",
        "Exclusions: if you leave something out, such as test machines or devices the client manages itself, say so in a footnote.",
      ],
      closing:
        "When you change a definition, say so in the report and show last month's figure under the new definition too. Otherwise the client will read the change as an improvement or a decline.",
      links: [{ label: "SLA reporting guide", href: GUIDE_ROUTES.slaReporting }],
    },
    {
      heading: "Example: a one-page monthly summary",
      paragraphs: [
        "The example below is invented for illustration. The client has around 140 managed devices and an agreed response time target. Note that the summary states the problem openly and ends with decisions that have dates.",
      ],
      example: {
        title: "Example — November summary for a client with 142 managed devices",
        lines: [
          "Overall: a stable month with one backup problem, now fixed and tested.",
          "Service desk: 86 requests received. 79 of 86 answered within the agreed response time = 91.9% (target 90%; October 74 of 78 = 94.9%).",
          "Updates: 131 of 142 managed devices fully up to date = 92.3%. 7 are waiting for a restart; 4 have been offline for more than 14 days (list attached).",
          "Backups: 12 protected servers and cloud services, one job each per night for 30 nights = 360 jobs. 354 successful = 98.3%. The 6 failed jobs were all on the accounting server from 9 to 14 November; the cause was a full storage disk, fixed on 15 November. A full restore test on 20 November succeeded.",
          "Security: 2 suspicious emails reported by staff, both checked and removed. No confirmed security incident.",
          "Decisions for you: 9 laptops reach the end of their warranty by 31 March — please confirm by 12 December whether we should quote replacements. We also found 3 unused software licences; shall we cancel them at renewal?",
        ],
      },
      closing:
        "Check the arithmetic before every report: 79 ÷ 86 = 91.9%, 131 ÷ 142 = 92.3% and 354 ÷ 360 = 98.3%. A wrong percentage on page one makes the client doubt every other number.",
    },
    {
      heading: "Turn activity into outcomes",
      paragraphs: [
        "Tool exports describe activity: patches deployed, alerts processed, scripts run. Clients care about outcomes: are we protected, can we recover, is our team able to work. For each area, add one sentence that translates the activity into what it means for the client.",
      ],
      bullets: [
        "Instead of \"1,240 patches deployed\", write \"92% of devices are fully up to date; the rest are listed with a reason.\"",
        "Instead of \"360 backup jobs monitored\", write \"All business data could be restored; we proved it with a test on 20 November.\"",
        "Instead of \"312 alerts processed\", write \"Two issues needed action; neither affected your staff.\"",
        "Instead of a list of request categories, write \"Most requests this month were about the new printer; we have fixed the driver so this should drop in December.\"",
      ],
    },
    {
      heading: "What to leave out",
      bullets: [
        "Raw alert counts. A large number looks either alarming or meaningless, and it says nothing about risk.",
        "Ticket numbers, internal codes and technician notes that were not written for the client.",
        "Charts without a takeaway. If you cannot say in one sentence what a chart shows, remove it.",
        "Device lists on page one. Put them in an appendix or attach them separately.",
        "Detailed security information that would help an attacker, such as unpatched vulnerabilities by device name, in a document that may be forwarded. Share that detail with the IT contact through a safer channel.",
        "Anything from another client. When you copy last month's report or a colleague's template, check names, figures and attachments twice.",
      ],
    },
    {
      heading: "Reporting problems and incidents",
      paragraphs: [
        "The monthly report is not the place to tell a client about a serious incident for the first time. Serious problems should be communicated when they happen. The report then records them: the date, what the client noticed, the cause in one sentence, what you did, and what you changed to prevent it from happening again.",
        "Do not leave out problems the client already knows about, and do not hide a missed target in a footnote. Put the missed target in the same line as the result and point to the explanation. Clients tend to forgive a problem that is explained; they rarely forgive one they discover themselves.",
        "If your contract or a regulation requires specific incident reporting, follow those terms separately. The monthly report is a summary, not a replacement for any formal notice.",
      ],
      links: [{ label: "Incident response template", href: TEMPLATE_ROUTES.incidentResponse }],
    },
    {
      heading: "A monthly reporting routine that holds",
      paragraphs: [
        "Reports that depend on one person finding a free afternoon arrive late. A fixed routine keeps them on time as the number of clients grows.",
      ],
      steps: [
        { title: "Day 1: export", text: "Pull the same exports from the service desk, monitoring, backup and security tools for every client, for the same calendar month." },
        { title: "Days 2–3: check and fill in", text: "Reconcile device counts, recalculate percentages, and fill in the seven areas. Mark anything unusual for the account owner." },
        { title: "Day 4: write the summary", text: "The account owner writes the first page and the decisions, because they know the client's priorities." },
        { title: "Day 5: review and send", text: "A second person checks the report, then it is sent or published with a short cover email. Store a copy of exactly what was sent." },
      ],
      closing:
        "Use working days and pick a delivery date you can keep for every client. Regular delivery is part of the message: it shows that the service is under control.",
      links: [
        { label: "Monthly client report outline", href: GUIDE_ROUTES.monthlyClientReportTemplate },
        { label: "Automated client reporting guide", href: GUIDE_ROUTES.automatedClientReporting },
      ],
    },
    {
      heading: "Monthly reports and quarterly reviews",
      paragraphs: [
        "The monthly report records what happened. A quarterly business review uses three monthly reports to look at trends, talk about the client's plans for the next months, and agree on priorities such as replacements, security improvements or budget. If your monthly reports use stable definitions, preparing the quarterly review becomes mostly a matter of comparing three pages.",
      ],
      links: [
        { label: "How to run a quarterly business review", href: GUIDE_ROUTES.quarterlyBusinessReview },
        { label: "Customer health score guide", href: GUIDE_ROUTES.customerHealthScore },
      ],
    },
  ],
  productFit: {
    heading: "Where Auroranexis fits",
    paragraphs: [
      "Auroranexis is client operations software for service businesses, including MSPs and IT service providers. It is not a remote monitoring, backup or service desk tool, and it does not have native connectors to them; your technical data stays in those systems. Auroranexis sits on top of the client relationship: report templates with configurable sections and branding, scheduled reports, a draft-review-publish workflow, PDF export, and a client portal where you control what each client sees. Depending on the template, reports can include incidents, risks, SLA outcomes and delivery metrics you track in the workspace, and a history of every published report is kept per client.",
      "Plans start at €179 per month for up to 25 clients. SLA tracking per contract and the risk and incident modules are part of the Business and Enterprise plans, starting at €599 per month. You can start a 7-day free trial of the Business plan without a credit card, or apply for the 6-week pilot program with your own clients.",
    ],
    links: [
      { label: "Report templates and publishing", href: FEATURE_ROUTES.reports },
      { label: "SLA tracking for MSPs", href: SOLUTION_ROUTES.slaManagement },
      { label: "Auroranexis for MSPs", href: USE_CASE_ROUTES.msps },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
      { label: "Pilot program", href: MARKETING_ROUTES.pilotProgram },
    ],
  },
  faq: [
    {
      question: "What should an MSP include in a monthly client report?",
      answer:
        "A short summary, service desk results, service levels against targets, patch status, backup results and the last restore test, security events that needed action, devices and licences that need attention, and the decisions the client has to make, each with a date.",
    },
    {
      question: "How long should an MSP monthly report be?",
      answer:
        "One page of summary is enough for most small and mid-sized clients, followed by a few pages of supporting detail for the IT contact. Put device lists and raw tool exports in an appendix or share them on request.",
    },
    {
      question: "Should I send the reports from my RMM or PSA tool directly to clients?",
      answer:
        "They are a useful source, but they are written for technicians. Most clients understand a report better when you add a plain-language summary, explain what the numbers mean for them, and list the decisions they need to make.",
    },
    {
      question: "How do I report patch compliance fairly?",
      answer:
        "Define which devices count, for example managed devices that were online in the last 14 days, and show devices that are offline or waiting for a restart as separate lines. Keep the same definition every month.",
    },
    {
      question: "Should security incidents go in the monthly report?",
      answer:
        "Yes, as a record: date, impact, cause, fix and prevention. A serious incident should be communicated when it happens, not first in the monthly report, and any formal reporting duties in the contract or in law apply separately.",
    },
  ],
};

export const GUIDES: readonly GuideContent[] = [
  automatedClientReporting,
  clientProfitabilityAnalysis,
  slaReporting,
  customerHealthScore,
  clientChurnWarningSigns,
  quarterlyBusinessReview,
  monthlyClientReportTemplate,
  mspClientReporting,
];

export const GUIDE_PAGES: Record<string, GuideContent> = Object.fromEntries(
  GUIDES.map((guide) => [guide.slug, guide]),
);

export const GUIDE_SLUGS = GUIDES.map((guide) => guide.slug);

export const GUIDES_HUB = {
  path: MARKETING_ROUTES.guides,
  title: "Guides for service businesses with recurring clients",
  seoTitle: "Client Operations Guides",
  description:
    "Practical guides on client reporting, QBRs, profitability, SLA reporting, customer health and churn signs for service businesses with recurring clients.",
} as const;
