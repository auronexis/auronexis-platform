\# AURORANEXIS ACTIVITY SYSTEM v1.0



Version: 1.0



Status: Active



\---



\# PURPOSE



The Activity System provides:



\* visibility

\* accountability

\* traceability

\* operational history



Every meaningful action inside Auroranexis must generate an activity event.



Purpose:



Answer:



"What happened?"



"Who did it?"



"When did it happen?"



\---



\# SYSTEM COMPONENTS



The Activity System consists of:



1\. Activity Feed

2\. Audit Trail

3\. Entity Timeline

4\. User Activity History



\---



\# ACTIVITY EVENT



Definition:



A record of a meaningful action.



Examples:



\* Client Created

\* Client Updated

\* Workflow Added

\* Workflow Archived

\* Incident Opened

\* Incident Resolved

\* Risk Created

\* Risk Closed

\* Report Generated

\* User Invited



\---



\# DATABASE TABLE



activity\_events



Purpose:



Store all activity records.



Fields:



\* id (uuid)

\* organization\_id (uuid)

\* user\_id (uuid)

\* entity\_type (text)

\* entity\_id (uuid)

\* event\_type (text)

\* title (text)

\* description (text)

\* metadata (jsonb)

\* created\_at (timestamp)



\---



\# ENTITY TYPES



Supported:



\* organization

\* user

\* client

\* workflow

\* incident

\* risk

\* report

\* health\_score



\---



\# EVENT TYPES



Client Events:



\* client\_created

\* client\_updated

\* client\_archived



Workflow Events:



\* workflow\_created

\* workflow\_updated

\* workflow\_archived



Incident Events:



\* incident\_created

\* incident\_updated

\* incident\_resolved

\* incident\_archived



Risk Events:



\* risk\_created

\* risk\_updated

\* risk\_resolved

\* risk\_archived



Report Events:



\* report\_generated



User Events:



\* user\_invited

\* user\_disabled

\* role\_changed



Health Events:



\* health\_score\_changed



\---



\# ACTIVITY FEED



Purpose:



Provide operational visibility.



Location:



Dashboard



Display:



Most Recent Events



Default:



Last 25 Events



\---



\# FEED DISPLAY FORMAT



Example:



John Smith created Incident



5 minutes ago



\---



Sarah Jones resolved Risk



2 hours ago



\---



Health Score changed



Yesterday



\---



\# DASHBOARD SECTION



Widget:



Recent Activity



Display:



\* Timestamp

\* User

\* Event

\* Related Entity



Actions:



Open Related Record



\---



\# CLIENT TIMELINE



Every Client must have:



Timeline Tab



Displays:



\* Client Events

\* Workflow Events

\* Risk Events

\* Incident Events

\* Report Events

\* Health Score Changes



Purpose:



Single Client History



\---



\# INCIDENT TIMELINE



Every Incident must display:



\* Created

\* Assigned

\* Updated

\* Resolved



Purpose:



Full Incident Lifecycle



\---



\# RISK TIMELINE



Every Risk must display:



\* Created

\* Updated

\* Status Changes

\* Resolved



\---



\# USER ACTIVITY



Purpose:



Operational accountability.



Display:



\* Actions performed

\* Timestamp

\* Related entity



Filters:



\* Last 7 Days

\* Last 30 Days

\* Last 90 Days



\---



\# AUDIT TRAIL



Purpose:



Security and accountability.



Track:



\* User Invites

\* User Removal

\* Role Changes

\* Client Archive

\* Workflow Archive

\* Risk Resolution

\* Incident Resolution



Audit events must never be editable.



\---



\# IMMUTABILITY



Activity Events:



Read Only



Users cannot modify:



\* title

\* timestamp

\* actor

\* event type



Activity records are immutable.



\---



\# EVENT CREATION RULES



Events must be generated automatically.



Never rely on manual user entry.



\---



\# EVENT METADATA



Store additional information inside:



metadata



Examples:



Client Created:



{

"client\_name": "Acme Agency"

}



Incident Resolved:



{

"severity": "critical"

}



Role Changed:



{

"old\_role": "staff",

"new\_role": "admin"

}



\---



\# FILTERS



Activity Feed Filters:



\* Client

\* Workflow

\* Incident

\* Risk

\* Report

\* User



Date Filters:



\* Today

\* Last 7 Days

\* Last 30 Days

\* Last 90 Days



\---



\# SEARCH



Activity records must support:



Keyword Search



Search Fields:



\* title

\* description



\---



\# SECURITY



Users may only view activity belonging to:



Their Organization



All activity queries must be organization scoped.



\---



\# PERFORMANCE



Dashboard Feed:



Limit 25 Records



Timeline:



Paginated



Large organizations must not load entire history.



\---



\# DATA RETENTION



Activity Records:



Permanent



Do not delete.



Do not modify.



\---



\# FUTURE FEATURES



Not MVP:



\* Activity Export

\* Advanced Analytics

\* User Productivity Metrics

\* Compliance Reporting



\---



\# AUDIT REQUIREMENT



Every activity event must store:



\* Actor

\* Timestamp

\* Entity

\* Event Type



No exceptions.



\---



\# FINAL RULE



If an important action occurs inside Auroranexis:



An activity event must exist.



If no activity event exists:



The action effectively never happened.



