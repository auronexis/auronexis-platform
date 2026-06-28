\# AURORANEXIS ARCHITECTURE RECONCILIATION v1.0



Version: 1.0



Status: Active



Purpose:



Resolve contradictions identified during the Second Architecture Review.



This document has higher priority than:



\* 03\_DATABASE\_BLUEPRINT\_V1.md

\* 04\_UX\_FLOW\_BLUEPRINT\_V1.md

\* 05\_CURSOR\_MASTER\_PROMPT\_V1.md



for the topics explicitly covered below.



\---



\# DOCUMENT HIERARCHY



Official Documentation Order:



00\_PROJECT\_OVERVIEW.md



01\_BUILD\_BIBLE\_V1.md



02\_SAAS\_SPECIFICATION\_V1.md



03\_DATABASE\_BLUEPRINT\_V1.md



04\_UX\_FLOW\_BLUEPRINT\_V1.md



05\_CURSOR\_MASTER\_PROMPT\_V1.md



06\_BRAND\_STANDARD\_V1.md



07\_RBAC\_BLUEPRINT\_V1.md



08\_HEALTH\_SCORE\_ENGINE\_V1.md



09\_ACTIVITY\_SYSTEM\_V1.md



10\_ARCHITECTURE\_RECONCILIATION\_V1.md



\---



\# PRIORITY ORDER



If documents conflict:



01\_BUILD\_BIBLE\_V1.md



↓



10\_ARCHITECTURE\_RECONCILIATION\_V1.md



↓



07\_RBAC\_BLUEPRINT\_V1.md



↓



08\_HEALTH\_SCORE\_ENGINE\_V1.md



↓



09\_ACTIVITY\_SYSTEM\_V1.md



↓



All remaining documents



\---



\# RESOLUTION 01



HEALTH SCORE FORMULA



Issue:



Health Score Engine used multiplication.



Decision:



Health Score uses additive scoring.



Official Formula:



Health Score =



Incident Score



\+



Severity Score



\+



Risk Score



\+



Workflow Score



\+



Activity Score



\+



Reporting Score



\+



Executive Adjustment



Maximum Score:



100



Minimum Score:



0



This replaces all multiplication-based formulas.



\---



\# RESOLUTION 02



HEALTH SCORE CONFIGURABILITY



Issue:



Documents require configurable scoring.



Decision:



Version 1 uses fixed scoring weights.



Future versions may allow customization.



MVP:



Fixed weights.



Not configurable.



\---



\# RESOLUTION 03



HEALTH SCORE TABLE REQUIREMENT



Issue:



health\_scores listed as Recommended.



Decision:



health\_scores is Required.



Purpose:



\* Health History

\* Trends

\* Reporting

\* Dashboard



MVP cannot function without it.



\---



\# RESOLUTION 04



HEALTH DECLINE RISK TYPE



Issue:



health\_decline missing from Risk Types.



Decision:



Add:



health\_decline



to supported risk types.



\---



\# RESOLUTION 05



ACTIVITY EVENTS TABLE



Issue:



activity\_events missing from database blueprint.



Decision:



activity\_events is a Required MVP table.



Purpose:



\* Dashboard Activity Feed

\* Audit Trail

\* Client Timeline

\* User Activity History



\---



\# RESOLUTION 06



ACTIVITY EVENT TYPES



Add:



incident\_assigned



note\_added



health\_score\_adjusted



to supported event types.



\---



\# RESOLUTION 07



CLIENT TIMELINE



Issue:



Timeline tab missing.



Decision:



Client Detail receives additional tab:



Timeline



Updated Tabs:



Overview



Workflows



Incidents



Reports



Notes



Timeline



Health History



\---



\# RESOLUTION 08



USER ACTIVITY PAGE



Decision:



Add route:



/settings/users/\[id]/activity



Purpose:



User Activity History



\---



\# RESOLUTION 09



PROFITABILITY DATA PROTECTION



Issue:



Viewer can see revenue.



Decision:



monthly\_revenue is sensitive.



Visible only to:



\* Owner

\* Admin



Staff:



Hidden



Viewer:



Hidden



Client lists must not expose revenue to Staff or Viewer.



\---



\# RESOLUTION 10



STAFF CLIENT NOTES



Issue:



Conflict between Client Read and Note Creation.



Decision:



Staff may create notes.



Staff may not edit client core data.



Allowed:



\* Create Note

\* Edit Own Note



Forbidden:



\* Edit Client

\* Archive Client

\* Delete Client



\---



\# RESOLUTION 11



STAFF ASSIGNMENT RULE



Issue:



Assignment scope unclear.



Decision:



Staff may edit only:



\* assigned incidents

\* assigned risks

\* assigned workflows



Staff may not edit records assigned to other users.



\---



\# RESOLUTION 12



RLS STRATEGY



Decision:



RLS protects tenancy.



Server authorization protects permissions.



Architecture:



Layer 1:



Organization Isolation



(PostgreSQL RLS)



Layer 2:



Role Authorization



(Server Actions)



Both are required.



\---



\# RESOLUTION 13



HEALTH SCORE AUDIT DATA



Every health score record must store:



\* previous\_score

\* new\_score

\* factor\_breakdown

\* calculation\_source

\* calculated\_at



Purpose:



Auditability



\---



\# RESOLUTION 14



ACTIVITY EVENT SECURITY



activity\_events records:



Immutable



Insert:



Server Only



Update:



Forbidden



Delete:



Forbidden



Purpose:



Trusted Audit Trail



\---



\# RESOLUTION 15



ALERTS



Alerts are informational.



MVP uses dashboard alerts only.



No notification system in MVP.



No emails.



No push notifications.



\---



\# RESOLUTION 16



WORKFLOW REVIEW RULE



Workflow becomes overdue after:



30 days



without review.



Workflow becomes neglected after:



60 days



without review.



Used by Health Score Engine.



\---



\# RESOLUTION 17



REPORTING CONSISTENCY RULE



Expected Reporting Frequency:



Monthly



Missing:



1 report



Penalty:



Medium



Missing:



2+ reports



Penalty:



Maximum



Used by Health Score Engine.



\---



\# RESOLUTION 18



CLIENT ACTIVITY DEFINITION



Client Activity means:



Any activity event related to:



\* Client

\* Workflow

\* Incident

\* Risk

\* Report



within the last 30 days.



Used by Health Score Engine.



\---



\# RESOLUTION 19



AUDIT LOGS



Decision:



Separate audit\_logs table is not required.



activity\_events becomes the official audit system.



audit\_logs is deprecated.



\---



\# RESOLUTION 20



FOUNDATION BUILD GATE



Before implementation begins:



Cursor must review:



00-10



documentation set.



If no Critical Architecture Issues remain:



Foundation Build may begin.



\---



\# FINAL RULE



When documentation conflicts exist:



This document provides the official resolution.



Implementation must follow this document.

