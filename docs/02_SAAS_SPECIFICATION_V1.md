\# AURORANEXIS SAAS SPECIFICATION v1.0



Version: 1.0



Status: Active



\---



\# PRODUCT



Product Name:



Auroranexis



Category:



AI Operations Assurance Platform



Public Positioning:



The Operations Command Center for AI Automation Agencies



Tagline:



Monitor Clients.

Detect Risks.

Prove Value.



\---



\# PRODUCT PURPOSE



Auroranexis exists to help agencies manage client automation operations.



The platform provides:



\* operational visibility

\* risk awareness

\* client health tracking

\* executive reporting

\* profitability intelligence



\---



\# PRIMARY USERS



\## Owner



Responsibilities:



\* organization management

\* profitability review

\* operational oversight



Permissions:



Full access.



\---



\## Admin



Responsibilities:



\* client management

\* workflow management

\* incident management

\* reporting



Permissions:



Operational management access.



\---



\## Staff



Responsibilities:



\* maintain client operations

\* update workflows

\* manage incidents



Permissions:



Limited operational access.



\---



\## Viewer



Responsibilities:



\* consume information



Permissions:



Read-only access.



\---



\# NAVIGATION



Primary Navigation:



Dashboard



Clients



Risks



Incidents



Reports



Profitability



Settings



No additional navigation items in MVP.



\---



\# MODULE 1



DASHBOARD



Purpose:



Provide immediate operational visibility.



Displayed Metrics:



\* Total Clients

\* Healthy Clients

\* Watch Clients

\* Critical Clients

\* Open Incidents

\* Open Risks



Sections:



Client Health Overview



Critical Alerts



Recent Activity



Risk Summary



Profitability Summary



Primary Action:



Review Critical Clients



\---



\# MODULE 2



CLIENTS



Purpose:



Manage agency customers.



Functions:



\* Create Client

\* Edit Client

\* Archive Client

\* Search Client

\* Filter Client



Client Fields:



\* Name

\* Contact Name

\* Contact Email

\* Monthly Revenue

\* Assigned Owner

\* Health Score

\* Health Status



\---



\# CLIENT DETAIL



Tabs:



Overview



Workflows



Incidents



Reports



Notes



Health History



Default Tab:



Overview



\---



\# MODULE 3



WORKFLOWS



Purpose:



Track automation assets.



Supported Platforms:



\* n8n

\* Make

\* Zapier

\* OpenAI

\* Claude

\* Custom



Workflow Fields:



\* Name

\* Platform

\* Description

\* Owner

\* Status

\* Last Reviewed



Status Values:



\* Active

\* Warning

\* Critical

\* Archived



Functions:



\* Create Workflow

\* Edit Workflow

\* Archive Workflow



\---



\# MODULE 4



INCIDENT CENTER



Purpose:



Track operational issues.



Severity Levels:



\* Low

\* Medium

\* High

\* Critical



Status Values:



\* Open

\* Investigating

\* Resolved

\* Archived



Functions:



\* Create Incident

\* Assign Incident

\* Update Incident

\* Resolve Incident



\---



\# MODULE 5



RISK CENTER



Purpose:



Identify future operational risks.



Risk Types:



\* Expiring Credentials

\* Missing Documentation

\* Inactive Workflow

\* Repeated Incident Pattern

\* SLA Warning

\* Manual Risk



Severity:



\* Low

\* Medium

\* High

\* Critical



Functions:



\* Create Risk

\* Update Risk

\* Resolve Risk



\---



\# MODULE 6



REPORTS



Purpose:



Demonstrate operational value.



Report Types:



Monthly



Quarterly



Generated Content:



\* Health Summary

\* Incident Summary

\* Risk Summary

\* Operational Recommendations



Outputs:



PDF Export



Future:



Client Portal



\---



\# MODULE 7



PROFITABILITY



Purpose:



Business intelligence.



Metrics:



\* Monthly Revenue

\* Support Load

\* Incident Count

\* Operational Complexity



Status Values:



Strong Margin



Watch



High Service Load



The system must never display:



Unprofitable



\---



\# HEALTH SCORE SYSTEM



Purpose:



Provide a single operational indicator.



Scale:



0–100



Ranges:



80–100 Healthy



50–79 Watch



0–49 Critical



Health Score Inputs:



\* Open Incidents

\* Severity

\* Risk Count

\* Workflow Status

\* Documentation Completeness



Health Score logic must be configurable.



Do not hardcode business rules.



\---



\# SETTINGS



Organization



Users



Notifications



Branding



Security



\---



\# MVP SCOPE



Included:



\* Authentication

\* Organizations

\* Users

\* Dashboard

\* Clients

\* Workflows

\* Risks

\* Incidents

\* Reports

\* Profitability



Excluded:



\* Billing

\* CRM

\* Chat

\* Ticketing

\* Knowledge Base

\* Prompt Library

\* Marketplace



\---



\# SECURITY REQUIREMENTS



Authentication:



Supabase Auth



Authorization:



Role Based Access Control



Database:



PostgreSQL



Security:



Row Level Security



All business data must be organization scoped.



\---



\# DESIGN REQUIREMENTS



Style:



Enterprise SaaS



References:



\* Linear

\* Stripe

\* Vanta

\* Datadog



Goals:



\* trustworthy

\* clean

\* operational

\* executive



Avoid:



\* AI gimmicks

\* gaming aesthetics

\* excessive animations



\---



\# MOBILE REQUIREMENTS



Dashboard responsive



Clients responsive



Incidents responsive



Reports responsive



Core functionality available on mobile.



\---



\# SUCCESS CRITERIA



10 Beta Agencies



3 Paying Agencies



100 Managed Clients



Monthly Active Users



Monthly Reports Generated



Health Score Adoption



\---



\# FINAL PRODUCT GOAL



Auroranexis should become:



The Operations Command Center for AI Automation Agencies.



Every feature must improve:



\* Visibility

\* Risk Detection

\* Client Retention

\* Operational Control

\* Profitability Awareness



If a feature does not improve one of those outcomes:



Do not build it.



