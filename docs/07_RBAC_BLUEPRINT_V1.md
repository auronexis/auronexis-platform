\# AURORANEXIS RBAC BLUEPRINT v1.0



Version: 1.0



Status: Active



\---



\# PURPOSE



RBAC = Role Based Access Control



This document defines exactly what each role may:



\* View

\* Create

\* Edit

\* Delete

\* Export

\* Manage



No permissions may be assumed.



All permissions must follow this document.



\---



\# ROLES



Auroranexis supports four roles:



1\. Owner

2\. Admin

3\. Staff

4\. Viewer



\---



\# ROLE HIERARCHY



Owner

↑



Admin

↑



Staff

↑



Viewer



Higher roles inherit lower role permissions.



\---



\# OWNER



Purpose:



Business owner.



Full system control.



Can:



\* View all data

\* Create all data

\* Edit all data

\* Archive all data

\* Export all data

\* Invite users

\* Remove users

\* Change roles

\* Access profitability

\* Access reports

\* Access settings

\* Manage organization



Restrictions:



None



\---



\# ADMIN



Purpose:



Operations manager.



Can:



\* View all data

\* Create all data

\* Edit all data

\* Archive all data

\* Access reports

\* Access incidents

\* Access risks

\* Access workflows

\* Access clients

\* Invite users



Cannot:



\* Delete organization

\* Transfer ownership

\* Change owner role

\* Access billing system



\---



\# STAFF



Purpose:



Operations employee.



Can:



\* View clients

\* View workflows

\* View incidents

\* View risks

\* View reports



Can create:



\* incidents

\* risks

\* workflow updates

\* client notes



Can edit:



\* assigned incidents

\* assigned risks

\* assigned workflows



Cannot:



\* invite users

\* remove users

\* modify organization settings

\* access profitability

\* archive clients

\* archive workflows



\---



\# VIEWER



Purpose:



Read-only user.



Can:



\* view dashboard

\* view clients

\* view workflows

\* view incidents

\* view risks

\* view reports



Cannot:



\* create anything

\* edit anything

\* archive anything

\* invite users

\* modify settings

\* access profitability



\---



\# MODULE PERMISSIONS



\## Dashboard



Owner:

Read



Admin:

Read



Staff:

Read



Viewer:

Read



\---



\## Clients



Owner:

CRUD



Admin:

CRUD



Staff:

Read



Viewer:

Read



\---



\## Workflows



Owner:

CRUD



Admin:

CRUD



Staff:

Create + Update



Viewer:

Read



\---



\## Incidents



Owner:

CRUD



Admin:

CRUD



Staff:

Create + Update



Viewer:

Read



\---



\## Risks



Owner:

CRUD



Admin:

CRUD



Staff:

Create + Update



Viewer:

Read



\---



\## Reports



Owner:

Create + Read + Export



Admin:

Create + Read + Export



Staff:

Read



Viewer:

Read



\---



\## Profitability



Owner:

Read



Admin:

Read



Staff:

No Access



Viewer:

No Access



\---



\## Settings



Owner:

Full Access



Admin:

Limited Access



Staff:

No Access



Viewer:

No Access



\---



\# USER MANAGEMENT



Owner:



\* invite user

\* remove user

\* change role



Admin:



\* invite user

\* deactivate user



Staff:



No Access



Viewer:



No Access



\---



\# ORGANIZATION MANAGEMENT



Owner only.



Includes:



\* company name

\* branding

\* plan

\* subscription

\* ownership transfer



\---



\# DATA ISOLATION



Every record must belong to:



organization\_id



Users may only access records belonging to their organization.



Cross-organization access is forbidden.



Must be enforced by:



\* PostgreSQL RLS

\* Server-side authorization



Both layers are required.



\---



\# PROFITABILITY PROTECTION



Profitability data is sensitive.



Visible only to:



\* Owner

\* Admin



Never visible to:



\* Staff

\* Viewer



\---



\# REPORT ACCESS



Reports may only be accessed by:



\* members of the same organization



PDF URLs must never be public.



Reports must use signed URLs.



\---



\# AUDIT REQUIREMENT



Every sensitive action must create an audit event.



Examples:



\* client created

\* client archived

\* incident resolved

\* risk closed

\* report generated

\* user invited

\* user removed



\---



\# SECURITY RULE



UI permissions are not security.



Buttons being hidden is not security.



All permissions must be validated:



1\. Server Side

2\. Database Level



Both are mandatory.



\---



\# FINAL RULE



If a role is not explicitly allowed to perform an action:



The action is forbidden.

