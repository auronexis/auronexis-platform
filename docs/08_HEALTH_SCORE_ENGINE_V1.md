\# AURORANEXIS HEALTH SCORE ENGINE v1.0



Version: 1.0



Status: Active



\---



\# PURPOSE



The Health Score Engine provides a single operational health indicator for every client.



Goal:



Answer one question:



"How healthy is this client relationship right now?"



Health Score must:



\* detect risk early

\* identify operational decline

\* support retention

\* prioritize agency attention



\---



\# SCORE RANGE



Minimum:



0



Maximum:



100



\---



\# STATUS LEVELS



Healthy



80 - 100



Color:



Green



\---



Watch



50 - 79



Color:



Amber



\---



Critical



0 - 49



Color:



Red



\---



\# CALCULATION PRINCIPLE



Health Score is calculated from weighted factors.



No manual score entry allowed.



Score must be system-generated.



\---



\# FACTOR 1



OPEN INCIDENTS



Purpose:



Measure operational instability.



Weight:



25%



Rules:



0 Open Incidents



+25



1 Open Incident



+20



2 Open Incidents



+15



3 Open Incidents



+10



4+



+0



\---



\# FACTOR 2



INCIDENT SEVERITY



Purpose:



Measure impact.



Weight:



20%



Rules:



No Critical Incidents



+20



1 Critical Incident



+10



2 Critical Incidents



+5



3+



+0



\---



\# FACTOR 3



OPEN RISKS



Purpose:



Measure future problems.



Weight:



15%



Rules:



0 Open Risks



+15



1-2 Risks



+10



3-4 Risks



+5



5+



+0



\---



\# FACTOR 4



WORKFLOW HEALTH



Purpose:



Measure operational maintenance.



Weight:



15%



Rules:



All Workflows Reviewed



+15



One Workflow Overdue



+10



Multiple Overdue



+5



Severely Neglected



+0



\---



\# FACTOR 5



CLIENT ACTIVITY



Purpose:



Measure engagement.



Weight:



10%



Rules:



Recent Activity < 30 Days



+10



30-60 Days



+5



60+ Days



+0



\---



\# FACTOR 6



REPORTING CONSISTENCY



Purpose:



Measure delivery discipline.



Weight:



10%



Rules:



Reports Current



+10



One Missing Report



+5



Multiple Missing Reports



+0



\---



\# FACTOR 7



MANUAL EXECUTIVE ADJUSTMENT



Purpose:



Exceptional circumstances.



Weight:



5%



Allowed Range:



\-5



to



+5



Must include:



Reason



User



Timestamp



Audit Event



\---



\# FINAL SCORE FORMULA



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



If calculated score exceeds 100:



Store 100



If calculated score drops below 0:



Store 0

\# CALCULATION FREQUENCY



Automatic Recalculation:



Every Night



Additionally:



\* Client Updated

\* Incident Updated

\* Risk Updated

\* Report Generated

\* Workflow Updated



\---



\# HEALTH HISTORY



Every score change must be stored.



Table:



health\_scores



Store:



\* client\_id

\* score

\* status

\* reason

\* calculated\_at



Purpose:



Trend Analysis



\---



\# TREND ANALYSIS



Track:



30 Days



90 Days



180 Days



365 Days



\---



\# HEALTH TRENDS



Improving



Stable



Declining



Rapid Decline



\---



\# RAPID DECLINE DETECTION



Trigger:



Health Score drops:



20+



points



within



30 days



Create:



Risk Record



Type:



health\_decline



Severity:



high



\---



\# DASHBOARD BEHAVIOR



Dashboard must display:



Healthy Clients



Watch Clients



Critical Clients



\---



\# CLIENT PAGE DISPLAY



Show:



Current Score



Status



Trend



Last Calculation Date



\---



\# ALERT THRESHOLDS



Score Below 50



Create Critical Alert



\---



Score Below 30



Create Executive Alert



\---



Score Drops 20+



Create Risk Alert



\---



\# PROFITABILITY IMPACT



Health Score should influence:



Profitability Analysis



Examples:



Low Health



\*



High Support Load



=



Retention Risk



\---



\# FUTURE AI LAYER



Not MVP



Future Versions may include:



\* predictive scoring

\* anomaly detection

\* churn prediction

\* machine learning analysis



Not part of v1.



\---



\# AUDIT REQUIREMENT



Every Health Score change must record:



\* previous score

\* new score

\* calculation source

\* timestamp



\---



\# SECURITY RULE



Health Score calculations must occur:



Server Side



Never Client Side.



\---



\# FINAL RULE



Health Score must answer:



"Which client requires attention before a problem becomes a cancellation?"



If the score cannot answer that question:



The scoring model must be revised.

