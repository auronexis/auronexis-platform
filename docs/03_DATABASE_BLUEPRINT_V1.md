\# AURORANEXIS DATABASE BLUEPRINT v1.0



Version: 1.0



Status: Active



Database:



PostgreSQL



Provider:



Supabase



\---



\# PURPOSE



The Auroranexis database powers:



\* Organizations

\* Users

\* Clients

\* Workflows

\* Risks

\* Incidents

\* Reports

\* Health Scores

\* Profitability Intelligence



The system must support:



\* Multi-Tenancy

\* Role-Based Access Control

\* Scalability

\* Future Expansion



\---



\# CORE DATABASE PRINCIPLE



Every business record belongs to an organization.



No record may exist without organization ownership.



All business tables must include:



organization\_id



\---



\# MULTI-TENANCY MODEL



Organization



↓



Users



↓



Clients



↓



Workflows



↓



Incidents / Risks / Reports



Users must never access another organization's data.



All queries must be organization-scoped.



\---



\# TABLE



organizations



Purpose:



Agency account.



Fields:



\* id (uuid)

\* name (text)

\* slug (text)

\* plan (text)

\* created\_at (timestamp)

\* updated\_at (timestamp)



Relationships:



One organization has many users.



One organization has many clients.



\---



\# TABLE



users



Purpose:



Internal users.



Authentication handled by Supabase Auth.



Fields:



\* id (uuid)

\* auth\_user\_id (uuid)

\* organization\_id (uuid)

\* full\_name (text)

\* email (text)

\* role (text)

\* created\_at (timestamp)

\* updated\_at (timestamp)



Roles:



\* owner

\* admin

\* staff

\* viewer



\---



\# TABLE



clients



Purpose:



Agency customers.



Fields:



\* id (uuid)

\* organization\_id (uuid)

\* name (text)

\* contact\_name (text)

\* contact\_email (text)

\* monthly\_revenue (numeric)

\* assigned\_user\_id (uuid)

\* health\_score (integer)

\* health\_status (text)

\* notes (text)

\* is\_archived (boolean)

\* created\_at (timestamp)

\* updated\_at (timestamp)



Health Status Values:



\* healthy

\* watch

\* critical



\---



\# TABLE



workflows



Purpose:



Operational assets.



Fields:



\* id (uuid)

\* organization\_id (uuid)

\* client\_id (uuid)

\* name (text)

\* platform (text)

\* description (text)

\* owner\_user\_id (uuid)

\* status (text)

\* last\_reviewed\_at (timestamp)

\* is\_archived (boolean)

\* created\_at (timestamp)

\* updated\_at (timestamp)



Platforms:



\* n8n

\* make

\* zapier

\* openai

\* claude

\* custom



Status:



\* active

\* warning

\* critical

\* archived



\---



\# TABLE



incidents



Purpose:



Operational failures.



Fields:



\* id (uuid)

\* organization\_id (uuid)

\* client\_id (uuid)

\* workflow\_id (uuid)

\* title (text)

\* description (text)

\* severity (text)

\* status (text)

\* assigned\_user\_id (uuid)

\* opened\_at (timestamp)

\* resolved\_at (timestamp)

\* created\_at (timestamp)

\* updated\_at (timestamp)



Severity:



\* low

\* medium

\* high

\* critical



Status:



\* open

\* investigating

\* resolved

\* archived



\---



\# TABLE



risks



Purpose:



Predictive operational risks.



Fields:



\* id (uuid)

\* organization\_id (uuid)

\* client\_id (uuid)

\* workflow\_id (uuid)

\* title (text)

\* description (text)

\* risk\_type (text)

\* severity (text)

\* status (text)

\* due\_at (timestamp)

\* created\_at (timestamp)

\* updated\_at (timestamp)



Risk Types:



\* expiring\_credentials

\* missing\_documentation

\* inactive\_workflow

\* repeated\_incidents

\* sla\_warning

\* manual



Status:



\* open

\* monitoring

\* resolved

\* archived



\---



\# TABLE



reports



Purpose:



Generated client reports.



Fields:



\* id (uuid)

\* organization\_id (uuid)

\* client\_id (uuid)

\* report\_type (text)

\* report\_month (date)

\* title (text)

\* executive\_summary (text)

\* recommendations (text)

\* pdf\_url (text)

\* created\_by\_user\_id (uuid)

\* created\_at (timestamp)

\* updated\_at (timestamp)



Report Types:



\* monthly

\* quarterly

\* custom



\---



\# TABLE



health\_scores



Purpose:



Historical health score tracking.



Fields:



\* id (uuid)

\* organization\_id (uuid)

\* client\_id (uuid)

\* score (integer)

\* status (text)

\* reason (text)

\* calculated\_at (timestamp)



Status:



\* healthy

\* watch

\* critical



Purpose:



Trend visualization.



\---



\# TABLE



profitability\_snapshots



Purpose:



Profitability intelligence.



Fields:



\* id (uuid)

\* organization\_id (uuid)

\* client\_id (uuid)

\* month (date)

\* monthly\_revenue (numeric)

\* support\_hours (numeric)

\* incident\_count (integer)

\* ai\_cost\_estimate (numeric)

\* profitability\_status (text)

\* notes (text)

\* created\_at (timestamp)



Status:



\* strong\_margin

\* watch

\* high\_service\_load



Never display:



unprofitable



\---



\# TABLE



organization\_settings



Purpose:



Organization configuration.



Fields:



\* id (uuid)

\* organization\_id (uuid)

\* language (text)

\* timezone (text)

\* brand\_name (text)

\* report\_footer\_text (text)

\* created\_at (timestamp)

\* updated\_at (timestamp)



\---



\# RELATIONSHIPS



organizations



→ users



→ clients



clients



→ workflows



→ incidents



→ risks



→ reports



→ health\_scores



→ profitability\_snapshots



users



→ assigned clients



→ assigned incidents



→ workflow ownership



\---



\# ROW LEVEL SECURITY



Enable RLS on:



\* organizations

\* users

\* clients

\* workflows

\* incidents

\* risks

\* reports

\* health\_scores

\* profitability\_snapshots

\* organization\_settings



Rule:



User can only access rows belonging to their organization.



\---



\# PERMISSIONS



Owner



Full access.



Admin



Operational management.



Staff



Operational updates.



Viewer



Read only.



Permissions must be enforced server-side.



\---



\# INDEXING STRATEGY



Create indexes for:



organization\_id



client\_id



workflow\_id



assigned\_user\_id



status



health\_score



created\_at



Purpose:



Fast dashboard queries.



\---



\# DATA RETENTION



Soft delete preferred.



Archive instead of hard delete.



Use:



is\_archived



where possible.



\---



\# SECURITY RULES



Never store:



\* passwords

\* API secrets

\* service keys



Never expose:



\* internal notes

\* confidential operational data



without permission checks.



\---



\# MVP TABLES



Required:



\* organizations

\* users

\* clients

\* workflows

\* incidents

\* risks

\* reports



Recommended:



\* health\_scores

\* profitability\_snapshots

\* organization\_settings



\---



\# FUTURE TABLES



Not MVP:



\* audit\_logs

\* notifications

\* integrations

\* api\_connections

\* client\_portal\_users

\* sla\_policies

\* report\_templates



\---



\# FINAL DATABASE RULE



Every table must support:



\* Visibility

\* Risk Detection

\* Client Health

\* Reporting

\* Profitability Intelligence



If not:



Do not add it.



