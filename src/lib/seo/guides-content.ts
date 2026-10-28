import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import {
  FEATURE_ROUTES,
  GUIDE_ROUTES,
  MARKETING_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
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
      links: [{ label: "SLA policy template", href: TEMPLATE_ROUTES.slaPolicy }],
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

export const GUIDES: readonly GuideContent[] = [
  automatedClientReporting,
  clientProfitabilityAnalysis,
  slaReporting,
  customerHealthScore,
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
    "Practical guides on client reporting, profitability, SLA reporting and customer health scores for service businesses with recurring clients.",
} as const;
