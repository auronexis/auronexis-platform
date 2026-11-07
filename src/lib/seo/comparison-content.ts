import { FEATURE_ROUTES, MARKETING_ROUTES, SOLUTION_ROUTES, TEMPLATE_ROUTES } from "@/lib/company/company-links";

/**
 * Fair comparison pages. Every competitor fact comes from the competitor's own public page
 * on the stated date; anything not published there is described as "not listed", never as
 * "missing". Update `checkedOn` and the rows together when re-checking.
 */
export type ComparisonRow = {
  criterion: string;
  competitor: string;
  auroranexis: string;
};

export type ComparisonPageContent = {
  path: string;
  competitorName: string;
  checkedOn: string;
  title: string;
  seoTitle: string;
  description: string;
  metaDescription: string;
  intro: string;
  rows: readonly ComparisonRow[];
  costExample: { heading: string; rows: readonly ComparisonRow[]; note: string };
  chooseCompetitor: readonly string[];
  chooseAuroranexis: readonly string[];
  together: string;
  sources: ReadonlyArray<{ label: string; href: string }>;
  faq: ReadonlyArray<{ question: string; answer: string }>;
  /** Competitor pricing at a glance — answers "<competitor> pricing" searches with dated facts. */
  pricingSnapshot: {
    heading: string;
    checkedOn: string;
    intro: string;
    items: readonly string[];
    sourceHref: string;
  };
  /** Other tools people compare, each fact from that vendor's own pricing page on `checkedOn`. */
  otherAlternatives: {
    heading: string;
    checkedOn: string;
    intro: string;
    items: ReadonlyArray<{ name: string; href: string; bestFor: string; pricing: string }>;
  };
  relatedLinks: ReadonlyArray<{ label: string; href: string }>;
  trademarkNote: string;
};

export const AGENCYANALYTICS_ALTERNATIVE: ComparisonPageContent = {
  path: MARKETING_ROUTES.agencyAnalyticsAlternative,
  competitorName: "AgencyAnalytics",
  checkedOn: "28 October 2026",
  title: "AgencyAnalytics alternatives and pricing: a fair comparison",
  seoTitle: "AgencyAnalytics Alternatives & Pricing (2026)",
  description:
    "AgencyAnalytics is built for marketing reports. Auroranexis is built for running client accounts: health scores, SLAs, incidents, risks and client reports in one workspace. Here is an honest comparison, including when AgencyAnalytics is the better choice.",
  metaDescription:
    "AgencyAnalytics pricing in 2026, the main alternatives by need (Swydo, DashThis, Databox, Whatagraph, Auroranexis) and a fair, dated comparison.",
  intro:
    "Agencies usually search for an AgencyAnalytics alternative for one of two reasons: the per-client price adds up as the client list grows, or they need more than marketing dashboards — a way to see which clients are at risk, whether service levels are met and what was delivered. The two products overlap only partly. This page compares them on published facts so you can decide which one fits your work.",
  rows: [
    {
      criterion: "Main focus",
      competitor: "Reporting and dashboards for marketing agencies, with 90+ marketing integrations",
      auroranexis:
        "Client operations for service businesses: health score per client, SLA tracking, incidents, risks, client reports and portal",
    },
    {
      criterion: "Pricing model",
      competitor: "Per client: USD 20 per client per month, billed annually (Core plan); volume pricing from 25 clients",
      auroranexis:
        "Per workspace: Professional EUR 179/month (up to 25 clients, 3 team members), Business EUR 599/month (up to 100 clients, 10 team members); VAT added at checkout",
    },
    {
      criterion: "Free trial",
      competitor: "14 days, no credit card",
      auroranexis: "7 days on the Business plan, no payment details (limited to 10 clients, 3 team members)",
    },
    {
      criterion: "Team members",
      competitor: "Unlimited staff users and client users",
      auroranexis: "3 (Professional) or 10 (Business) team members; custom on Enterprise",
    },
    {
      criterion: "Data sources",
      competitor: "90+ marketing integrations (ads, SEO, social, analytics), Google Sheets, custom metrics, API",
      auroranexis:
        "No marketing data connectors. Work is recorded in Auroranexis; notifications via Slack, Microsoft Teams and webhooks; REST API on Enterprise",
    },
    {
      criterion: "Client reports",
      competitor: "Automated, scheduled reports with approvals, AI summary and version history",
      auroranexis:
        "Report templates and schedules that draft from client data (health, SLAs, incidents, risks); human review before publishing; PDF and portal",
    },
    {
      criterion: "Client portal and branding",
      competitor: "White-labeled client portal, custom domain and custom email",
      auroranexis: "Client portal on all plans; white-label branding from Professional",
    },
    {
      criterion: "Client health score",
      competitor: "Not listed (goals, alerts and anomaly detection on marketing metrics are listed)",
      auroranexis: "Health score per client from delivery, SLA, incident, risk and engagement signals",
    },
    {
      criterion: "SLA tracking",
      competitor: "Not listed",
      auroranexis: "Response and resolution targets per priority and client (Business plan)",
    },
    {
      criterion: "Incidents and risk register",
      competitor: "Not listed",
      auroranexis: "Incident records and a risk register with likelihood × impact score, owner and mitigation (Business plan)",
    },
    {
      criterion: "Client profitability",
      competitor: "Not listed as a product feature",
      auroranexis: "Revenue, cost and margin per client next to its health (from Professional)",
    },
    {
      criterion: "Refunds",
      competitor: "30-day money-back guarantee",
      auroranexis: "Trial ends automatically without charge; paid plans follow the published refund and cancellation policy",
    },
  ],
  costExample: {
    heading: "List price example",
    rows: [
      {
        criterion: "10 clients",
        competitor: "USD 200 per month (10 × USD 20, billed annually)",
        auroranexis: "EUR 179 per month (Professional)",
      },
      {
        criterion: "25 clients",
        competitor: "USD 500 per month (25 × USD 20, billed annually; volume pricing available)",
        auroranexis: "EUR 179 per month (Professional, up to 25 clients)",
      },
      {
        criterion: "60 clients",
        competitor: "Volume pricing on request",
        auroranexis: "EUR 599 per month (Business, up to 100 clients)",
      },
    ],
    note: "Published list prices only, before tax, in each vendor's own currency, without conversion. They do not include add-ons, discounts or user limits, so compare your own setup before deciding.",
  },
  chooseCompetitor: [
    "Your clients mainly buy SEO, PPC or social media services and expect performance dashboards",
    "You need automatic data pulls from Google Ads, GA4, Meta and similar platforms",
    "You want unlimited staff users at no extra cost",
    "You prefer a longer trial (14 days) or a money-back guarantee",
  ],
  chooseAuroranexis: [
    "You deliver ongoing services — managed IT, accounting, facility, recruitment, BPO or agency retainers — and need to see which clients are at risk",
    "You promise response or resolution times and need to prove them per client",
    "You want incidents, risks, reports and the client portal for each account in one place",
    "You want one price for the workspace instead of a price per client",
  ],
  together:
    "Some marketing agencies use both: a marketing reporting tool for channel performance, and Auroranexis for account health, service levels and the client relationship. Auroranexis does not import marketing metrics, so in that setup the marketing report stays in the reporting tool.",
  sources: [
    { label: "AgencyAnalytics pricing and feature list (feature list checked 28 October 2026, pricing re-checked 7 November 2026)", href: "https://agencyanalytics.com/pricing" },
    { label: "Swydo pricing (checked 7 November 2026)", href: "https://www.swydo.com/pricing/" },
    { label: "DashThis pricing (checked 7 November 2026)", href: "https://dashthis.com/pricing/" },
    { label: "Databox pricing (checked 7 November 2026)", href: "https://databox.com/pricing" },
    { label: "Whatagraph pricing (checked 7 November 2026)", href: "https://whatagraph.com/pricing" },
    { label: "Auroranexis pricing", href: MARKETING_ROUTES.pricing },
    { label: "Auroranexis integrations", href: MARKETING_ROUTES.integrations },
  ],
  faq: [
    {
      question: "How much does AgencyAnalytics cost?",
      answer:
        "As of 7 November 2026, AgencyAnalytics lists its Core plan at USD 20 per client per month, billed annually, with 20% saved on annual billing, a free 14-day trial and discounted per-client pricing from 25 clients. Add-ons such as AI Tracker and Rank Tracker cost extra.",
    },
    {
      question: "What are the main AgencyAnalytics competitors?",
      answer:
        "For marketing reporting, people most often compare Swydo, DashThis, Databox and Whatagraph. Auroranexis is an alternative when the need is running client accounts — health scores, SLAs, incidents and client reports — rather than marketing dashboards.",
    },
    {
      question: "What is the best AgencyAnalytics alternative?",
      answer:
        "It depends on what you need. For marketing performance reports, look at other marketing reporting tools. If you need to run client accounts — health scores, SLAs, incidents, risks and client reports — Auroranexis covers that, but it does not import marketing data.",
    },
    {
      question: "Is Auroranexis cheaper than AgencyAnalytics?",
      answer:
        "The pricing models differ: AgencyAnalytics charges per client (USD 20 per client per month on annual billing as of 28 October 2026), Auroranexis charges per workspace (EUR 179 per month for up to 25 clients). Which is cheaper depends on your client count, team size and currency.",
    },
    {
      question: "Can Auroranexis pull data from Google Analytics or Google Ads?",
      answer:
        "No. Auroranexis has no marketing data connectors. It focuses on delivery and relationship data: SLAs, incidents, risks, reports and health per client.",
    },
    {
      question: "Can I try Auroranexis for free?",
      answer:
        "Yes. The 7-day trial gives you the Business plan without payment details and ends automatically. One trial per company.",
    },
    {
      question: "Can I move my clients from AgencyAnalytics to Auroranexis?",
      answer:
        "You can add clients in Auroranexis and set up their SLA policies, risks and report templates. There is no automatic import from AgencyAnalytics.",
    },
  ],
  pricingSnapshot: {
    heading: "AgencyAnalytics pricing in 2026",
    checkedOn: "7 November 2026",
    intro:
      "AgencyAnalytics charges per client. This is what its public pricing page shows; prices are in USD and may differ by region and currency.",
    items: [
      "Core plan: USD 20 per client per month, billed annually (annual billing saves 20% compared with monthly).",
      "Monthly plans have no commitment; annual plans have a one-year commitment.",
      "Unlimited staff users and client users are included.",
      "From 25 clients: discounted per-client pricing on request, with dedicated onboarding and priority support.",
      "Optional add-ons (billed annually): AI Tracker USD 20.83 per month for 250 credits, Rank Tracker USD 41.67 per month for 500 keywords.",
      "Free 14-day trial, no credit card required.",
      "Billing currencies: USD, CAD, AUD, NZD, GBP and EUR.",
    ],
    sourceHref: "https://agencyanalytics.com/pricing",
  },
  otherAlternatives: {
    heading: "Other AgencyAnalytics alternatives, by need",
    checkedOn: "7 November 2026",
    intro:
      "Most AgencyAnalytics alternatives are marketing reporting tools. Pick by what you need to show clients. Prices are the entry prices on each vendor's own pricing page on the date shown.",
    items: [
      {
        name: "Swydo",
        href: "https://www.swydo.com/pricing/",
        bestFor: "Marketing reports priced by data source instead of by client, with unlimited clients, users and reports",
        pricing: "From USD/EUR 69 per month for 10 data sources; 14-day free trial, no credit card",
      },
      {
        name: "DashThis",
        href: "https://dashthis.com/pricing/",
        bestFor: "Simple marketing dashboards for a small number of clients",
        pricing: "Individual plan from USD 44 per month for 3 dashboards and 15 sources; 14-day free trial",
      },
      {
        name: "Databox",
        href: "https://databox.com/pricing",
        bestFor: "KPI dashboards and analytics across business tools, not only marketing",
        pricing: "Free plan available; paid plans listed from USD 71 per month billed annually; 14-day trial",
      },
      {
        name: "Whatagraph",
        href: "https://whatagraph.com/pricing",
        bestFor: "Larger agencies that want cross-channel marketing data in one governed layer",
        pricing: "Max plan from EUR 699 per month billed annually; Prime on request; demo instead of a listed free trial",
      },
      {
        name: "Auroranexis",
        href: MARKETING_ROUTES.pricing,
        bestFor:
          "Running client accounts rather than marketing reports: health score per client, SLAs, incidents, risks, client reports and a client portal",
        pricing: "Professional EUR 179 per month for up to 25 clients; Business EUR 599 per month for up to 100 clients; 7-day free trial without payment details",
      },
    ],
  },
  relatedLinks: [
    { label: "Customer health score software", href: SOLUTION_ROUTES.customerHealthScore },
    { label: "SLA management software", href: SOLUTION_ROUTES.slaManagement },
    { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
    { label: "Client portal", href: FEATURE_ROUTES.clientPortal },
    { label: "Quarterly business review template", href: TEMPLATE_ROUTES.quarterlyBusinessReview },
    { label: "Pricing", href: MARKETING_ROUTES.pricing },
  ],
  trademarkNote:
    "AgencyAnalytics, Swydo, DashThis, Databox and Whatagraph are trademarks of their owners. Auroranexis is not affiliated with or endorsed by any of them. Competitor information is taken from its public website on the date shown and may have changed since — check the source before deciding.",
};
