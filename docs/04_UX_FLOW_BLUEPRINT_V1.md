\# AURORANEXIS UX FLOW BLUEPRINT v1.0



Version: 1.0



Status: Active



\---



\# PURPOSE



This document defines how users navigate through Auroranexis.



Auroranexis must feel like:



An Operations Command Center.



Not:



\* CRM

\* Ticket System

\* Chat Application

\* Project Management Tool



The user should always understand:



1\. What is happening?

2\. What requires attention?

3\. What should I do next?



\---



\# GLOBAL NAVIGATION



Primary Sidebar Navigation:



Dashboard



Clients



Risks



Incidents



Reports



Profitability



Settings



Navigation must remain simple.



No additional modules in MVP.



\---



\# USER FLOW 01



LOGIN



Entry Point:



/login



User enters:



\* email

\* password



Authentication:



Supabase Auth



After successful login:



Redirect to:



Dashboard



No onboarding flow in MVP.



\---



\# USER FLOW 02



DASHBOARD



Purpose:



Immediate operational visibility.



Questions answered:



\* Which clients require attention?

\* What is critical?

\* What changed recently?



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



Primary CTA:



Review Critical Clients



\---



\# DASHBOARD ACTIONS



User can:



Open Client



Open Incident



Open Risk



Open Report



All critical items should be reachable within one click.



\---



\# USER FLOW 03



CLIENTS PAGE



Route:



/clients



Purpose:



Manage agency customers.



Functions:



\* Search

\* Filter

\* Create Client

\* Archive Client



Columns:



\* Name

\* Health Score

\* Status

\* Revenue

\* Assigned Owner



Primary CTA:



Create Client



\---



\# USER FLOW 04



CREATE CLIENT



Route:



/clients/new



Fields:



\* Client Name

\* Contact Name

\* Contact Email

\* Monthly Revenue

\* Assigned Owner

\* Notes



After Save:



Redirect:



Client Detail Page



Success Message:



Client Created Successfully



\---



\# USER FLOW 05



CLIENT DETAIL PAGE



Route:



/clients/\[id]



Purpose:



Single source of truth.



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



\# CLIENT OVERVIEW



Displays:



\* Health Score

\* Health Status

\* Revenue

\* Assigned Owner

\* Open Incidents

\* Open Risks



Actions:



Add Workflow



Add Incident



Generate Report



\---



\# USER FLOW 06



WORKFLOWS



Route:



/clients/\[id]/workflows



Purpose:



Manage operational assets.



Displayed:



\* Name

\* Platform

\* Status

\* Last Reviewed



Actions:



Create Workflow



Edit Workflow



Archive Workflow



\---



\# WORKFLOW DETAIL



Displays:



\* Name

\* Platform

\* Description

\* Owner

\* Status

\* Last Reviewed



Actions:



Create Risk



Create Incident



Edit Workflow



\---



\# USER FLOW 07



INCIDENT CENTER



Route:



/incidents



Purpose:



Track operational failures.



Columns:



\* Title

\* Client

\* Severity

\* Status

\* Assigned User

\* Opened Date



Filters:



Open



Investigating



Resolved



Critical



Primary CTA:



Create Incident



\---



\# CREATE INCIDENT



Route:



/incidents/new



Fields:



\* Title

\* Client

\* Workflow

\* Severity

\* Description

\* Assigned User



After Save:



Open Incident Detail



Success Message:



Incident Created



\---



\# INCIDENT DETAIL



Displays:



\* Status

\* Severity

\* Description

\* Timeline

\* Notes



Actions:



Assign User



Update Status



Add Notes



Resolve Incident



Archive Incident



\---



\# USER FLOW 08



RISK CENTER



Route:



/risks



Purpose:



Track operational threats.



Columns:



\* Title

\* Client

\* Severity

\* Status

\* Due Date



Filters:



Open



Monitoring



Resolved



Critical



Primary CTA:



Create Risk



\---



\# CREATE RISK



Route:



/risks/new



Fields:



\* Title

\* Client

\* Workflow

\* Risk Type

\* Severity

\* Due Date

\* Description



After Save:



Open Risk Detail



Success Message:



Risk Created



\---



\# RISK DETAIL



Displays:



\* Description

\* Related Client

\* Related Workflow

\* Severity

\* Due Date



Actions:



Update Status



Add Notes



Resolve Risk



Archive Risk



\---



\# USER FLOW 09



REPORTS



Route:



/reports



Purpose:



Demonstrate value.



Columns:



\* Client

\* Report Type

\* Month

\* Health Score

\* Created Date



Actions:



Generate Report



View Report



Download PDF



\---



\# GENERATE REPORT



Route:



/reports/new



User Selects:



\* Client

\* Month

\* Report Type



System Generates:



\* Executive Summary

\* Health Overview

\* Incident Summary

\* Risk Summary

\* Recommendations



Output:



PDF



\---



\# USER FLOW 10



PROFITABILITY



Route:



/profitability



Purpose:



Business intelligence.



Displayed:



\* Revenue

\* Support Load

\* Incident Count

\* Profitability Status



Status Values:



Strong Margin



Watch



High Service Load



Actions:



Open Client



No direct editing required.



\---



\# USER FLOW 11



SETTINGS



Route:



/settings



Tabs:



Organization



Users



Notifications



Branding



Security



\---



\# ORGANIZATION SETTINGS



Fields:



\* Organization Name

\* Timezone

\* Language



\---



\# USER MANAGEMENT



Fields:



\* Name

\* Email

\* Role



Actions:



Invite User



Change Role



Disable User



Roles:



\* Owner

\* Admin

\* Staff

\* Viewer



\---



\# MOBILE EXPERIENCE



Required:



\* Responsive Dashboard

\* Responsive Clients

\* Responsive Incidents

\* Responsive Reports



Core functionality must work on mobile devices.



\---



\# UX PRINCIPLES



Every page must answer:



1\. What is happening?

2\. What requires attention?

3\. What should I do next?



\---



\# NAVIGATION RULE



Users should never need more than:



Three clicks



to reach:



\* Client

\* Incident

\* Risk

\* Report



\---



\# DESIGN PRINCIPLE



Auroranexis should feel like:



\* Linear

\* Vanta

\* Stripe

\* Datadog



Characteristics:



\* clean

\* executive

\* operational

\* trustworthy



Avoid:



\* unnecessary animations

\* flashy UI

\* AI gimmicks



\---



\# FINAL UX RULE



The user should always feel:



"I know exactly which client needs my attention right now."



If a screen fails to provide that clarity:



Redesign it.



