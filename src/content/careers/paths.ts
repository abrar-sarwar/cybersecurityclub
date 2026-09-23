import type { CareerId, CareerPath, UpcomingPath } from "./types";

/**
 * The twelve career paths. These describe areas of work to explore; several
 * related job titles usually require experience, and finishing a starter
 * project does not by itself make someone ready for them.
 *
 * External resources were checked on 2026-09-17 (each link loaded and showed
 * the named page). Prefer official documentation or the original dataset
 * source when adding more.
 */
export const CAREER_PATHS: readonly CareerPath[] = [
  {
    id: "soc",
    slug: "soc-analysis",
    name: "SOC Analysis",
    summary:
      "Security operations center (SOC) analysts review an organization’s security alerts, decide which ones point to real problems, and pass confirmed issues to the people who can act on them.",
    workFocus: "reviewing security alerts and deciding which ones need attention",
    overview: [
      "A security operations center, or SOC, is the team that watches an organization’s systems for signs of attack. Security tools collect logs from computers, networks, and cloud services, and raise an alert when activity matches a rule someone wrote.",
      "Most alerts turn out to be harmless. The analyst’s core job is triage: gathering enough evidence to decide whether an alert is malicious, benign, or needs a closer look, and escalating the real problems with a clear explanation of what was found.",
      "The work rewards careful reading, consistent notes, and steady judgment. Because alerts touch nearly every system, it is also a practical way to learn how the other areas of security fit together.",
    ],
    terms: [
      { term: "Log", definition: "A timestamped record of activity, such as a sign-in, a file download, or a network connection." },
      { term: "Alert", definition: "A notification raised when activity matches a detection rule." },
      { term: "Triage", definition: "Sorting alerts by what they are and how urgently they need action." },
      { term: "SIEM", definition: "Security information and event management: a platform that gathers logs in one place so analysts can search them and receive alerts." },
      { term: "False positive", definition: "An alert that fired on harmless activity." },
      { term: "Escalation", definition: "Handing a confirmed or suspected incident to a responder or senior analyst, together with the evidence gathered so far." },
    ],
    tasks: [
      "Work through a queue of new alerts and record a decision for each one.",
      "Search logs to see what happened just before and after an alert.",
      "Check whether an IP address, web domain, or file has been reported as malicious by trusted sources.",
      "Write short case notes that another analyst could pick up and follow.",
      "Escalate confirmed incidents to incident responders with the supporting evidence.",
      "Point out detection rules that keep firing on normal activity so they can be improved.",
    ],
    roles: ["SOC analyst", "Security operations analyst"],
    project: {
      title: "Investigate a Small Alert Queue",
      summary:
        "Use practice security alerts and supporting logs. Decide which alerts look malicious, which appear harmless, and which need more evidence.",
      materials: [
        "A handful of practice alerts and the logs behind them, from a public practice dataset or a training scenario",
        "A spreadsheet or any log search tool you are comfortable with",
        "A document for your notes and decisions",
      ],
      steps: [
        "Pick five to ten practice alerts and write down, in your own words, what each alert claims happened.",
        "For each alert, find the related log entries and note who was involved, what happened, when, and from where.",
        "Look for an ordinary explanation first, then note what would make the activity suspicious instead.",
        "Label each alert malicious, benign, or needs more evidence, and write one or two sentences explaining why.",
        "For each alert you would escalate, list the evidence and what you would ask a responder to check next.",
        "Finish with a short summary of patterns you noticed, such as alerts that fire on routine activity.",
      ],
      publish: [
        "An investigation report with a short section for each alert",
        "The log excerpts or screenshots that support each decision",
        "Your decision for each alert and the reasoning behind it",
        "Escalation recommendations for the alerts you judged malicious",
        "A note that the alerts and logs are practice data",
      ],
      extension: "Explain a change that could reduce unnecessary alerts, then test it against the practice examples.",
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Alerts triaged", source: "your queue table, one row per alert" },
        { label: "Log volume searched", source: "date range and sources in the report" },
        { label: "Escalations raised", source: "decisions marked malicious, with evidence" },
        { label: "False positives explained", source: "tuning note and the events it covers" },
      ],
      resumeExample: {
        name: "Nightwatch",
        stack: ["Splunk Free", "Sigma", "MITRE ATT&CK", "Security Datasets", "Markdown"],
        bullet:
          "Triaged 12 practice alerts against 3 days of endpoint and sign-in logs; escalated the 2 confirmed intrusions with evidence, closed 10 with written reasoning, and proposed a rule change that removed 40 repeat false positives.",
      },
    },
    related: ["hunting", "ir", "intel"],
    resources: [
      {
        label: "Security Datasets (Open Threat Research Forge)",
        href: "https://github.com/OTRF/Security-Datasets",
        description: "Free recordings of simulated attack activity and the logs it produced, useful for practice investigations.",
      },
      {
        label: "MITRE ATT&CK",
        href: "https://attack.mitre.org/",
        description: "A public knowledge base of attacker techniques. Look up the behavior an alert describes to understand what it could mean.",
      },
    ],
  },
  {
    id: "offensive",
    slug: "offensive-security",
    name: "Offensive Security",
    summary:
      "Penetration testers and red team operators attack systems with written permission to find weaknesses before real attackers do, then explain how to fix them.",
    workFocus: "testing defenses with permission and showing how weaknesses could be exploited",
    overview: [
      "Offensive security professionals are hired to think like attackers. A penetration test examines an agreed set of systems for weaknesses within a set scope and time. A red team engagement goes further, imitating a realistic attacker to see how well an organization notices and responds.",
      "Permission is what separates this work from a crime. Every engagement has written authorization and rules of engagement that define exactly what may be tested and how.",
      "The report is the real product. A finding only helps if the reader understands the risk, can reproduce the problem, and knows how to fix it.",
    ],
    terms: [
      { term: "Vulnerability", definition: "A weakness that could be used to cause harm." },
      { term: "Exploit", definition: "A method that takes advantage of a vulnerability." },
      { term: "Scope", definition: "The written list of systems and activities a tester is allowed to include." },
      { term: "Remediation", definition: "The fix or mitigation for a finding." },
      { term: "Intentionally vulnerable application", definition: "Software built with deliberate weaknesses so people can practice attacking it legally." },
    ],
    tasks: [
      "Agree on scope and rules of engagement before any testing starts.",
      "Map an application or network to understand where it could be attacked.",
      "Test for weaknesses and confirm their impact without causing damage.",
      "Chain small findings together to show a realistic attack path.",
      "Write findings with reproducible steps, evidence, and remediation advice.",
    ],
    roles: ["Penetration tester", "Red team operator"],
    project: {
      title: "Test a Vulnerable Practice App",
      summary:
        "Use an intentionally vulnerable application in an authorized local lab. Investigate a small number of weaknesses and explain their impact.",
      materials: [
        "An intentionally vulnerable web application running on your own computer or in a virtual machine, such as OWASP Juice Shop",
        "A web browser and its developer tools, plus a free intercepting proxy such as ZAP if you want to inspect requests",
        "A document for evidence and notes",
      ],
      steps: [
        "Install the practice app locally and write a short scope: which app, which address, and what is off limits. Only test systems you own or are explicitly allowed to test.",
        "Use the app as a normal visitor and note the features that accept input, handle sign-ins, or show private data.",
        "Choose two or three weaknesses to investigate instead of trying everything.",
        "For each weakness, record the exact steps to reproduce it, with screenshots.",
        "Explain the impact: what an attacker could do and who would be affected.",
        "Recommend a fix for each finding, citing published guidance where you can.",
      ],
      publish: [
        "A penetration-test report that states the scope and your testing approach",
        "Reproducible steps for each finding",
        "Evidence such as screenshots or captured requests",
        "The impact of each finding and remediation advice",
        "A statement that testing took place in an authorized local lab",
      ],
      extension: "Apply a fix where possible and document a retest.",
      notes: ["Never test a website or network you do not own or have written permission to test, even if it looks similar to your practice app."],
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Scope items tested", source: "the scope section of the report" },
        { label: "Findings confirmed", source: "one entry per reproducible issue" },
        { label: "Reproduction steps recorded", source: "evidence attached to each finding" },
        { label: "Findings retested after a fix", source: "retest notes" },
      ],
      resumeExample: {
        name: "Trapdoor",
        stack: ["OWASP Juice Shop", "ZAP", "Burp Suite Community", "OWASP Top 10", "Docker"],
        bullet:
          "Tested an intentionally vulnerable web application across 9 features in a local lab; confirmed 3 findings with reproducible steps and evidence, and retested 2 after applying the recommended fixes.",
      },
    },
    related: ["appsec", "network", "cloud"],
    resources: [
      {
        label: "OWASP Juice Shop",
        href: "https://owasp.org/www-project-juice-shop/",
        description: "A free, intentionally insecure web application built for security training.",
      },
      {
        label: "ZAP",
        href: "https://www.zaproxy.org/",
        description: "A free, open-source tool for inspecting and testing web application traffic.",
      },
    ],
  },
  {
    id: "appsec",
    slug: "application-security",
    name: "Application / Product Security",
    summary:
      "Application and product security engineers work with software developers to design, build, and test features so they are hard to abuse.",
    workFocus: "designing and fixing software features so they are harder to misuse",
    overview: [
      "Much of what people rely on every day is software, and many attacks target weaknesses in how it was built. Application security (often shortened to AppSec) and product security teams help developers prevent those weaknesses instead of patching them after release.",
      "The work includes threat modeling new features, reviewing code, running automated security tests, and helping teams understand and fix what those tests find.",
      "It suits people who like understanding how software works and enjoy working alongside developers to make practical improvements.",
    ],
    terms: [
      { term: "Threat model", definition: "A structured look at how a feature or system could be misused and what would prevent it." },
      { term: "Authentication", definition: "Checking who someone is, for example with a password." },
      { term: "Authorization", definition: "Checking whether a signed-in user is allowed to perform a specific action on a specific piece of data." },
      { term: "Broken access control", definition: "A weakness where users can reach data or actions they should not, such as another person’s records." },
      { term: "Regression test", definition: "An automated test that makes sure a fixed problem does not quietly come back." },
    ],
    tasks: [
      "Review designs for new features and list the ways they could be abused.",
      "Read code changes for security problems.",
      "Run and tune automated security scanning in the tools developers already use.",
      "Help developers reproduce and fix vulnerabilities.",
      "Write secure coding guidance with concrete examples.",
    ],
    roles: ["Application security engineer", "Product security engineer"],
    project: {
      title: "Protect Private Records in a Small App",
      summary:
        "Create a simple demo with two users. Test whether either user can access the other’s private records, correct the access-control weakness, and verify the fix.",
      materials: [
        "A small web app you write yourself in any language or framework you are learning",
        "Two made-up test users, each with a few sample records",
        "A way to send requests, such as a browser, a command-line tool, or an automated test",
      ],
      steps: [
        "Build a minimal app where each user has private records, such as notes, stored with the owner’s ID.",
        "Write the security requirement in one sentence, for example: a user can only view and change their own records.",
        "Sign in as the first user and note how a record is requested, such as a web address that contains the record’s ID.",
        "As the second user, request the first user’s record directly. If it loads, you have found broken access control.",
        "Fix the weakness by checking the record’s owner on the server for every read and every change.",
        "Repeat the same requests and confirm they are now refused, while each user can still reach their own records.",
      ],
      publish: [
        "The code, in a public repository that contains sample data only",
        "A short explanation of the security requirement",
        "Before-and-after tests showing the weakness and the fix",
      ],
      extension: "Add automated regression tests so the weakness is caught if it is reintroduced.",
      notes: ["This is a practice lab you build yourself with made-up users and data."],
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Endpoints reviewed", source: "list of routes you checked" },
        { label: "Abuse cases tested", source: "your test matrix" },
        { label: "Access-control bugs fixed", source: "before-and-after requests" },
        { label: "Regression tests added", source: "the test file in your repository" },
      ],
      resumeExample: {
        name: "Keyring",
        stack: ["Node.js", "Express", "OWASP ASVS", "OWASP Top 10", "Playwright", "GitHub Actions"],
        bullet:
          "Built a two-user demo application and tested 6 record endpoints for ownership checks; fixed the 2 that exposed another user\u2019s private records and added 4 regression tests that fail if the weakness returns.",
      },
    },
    related: ["offensive", "iam", "cloud"],
    resources: [
      {
        label: "OWASP Authorization Cheat Sheet",
        href: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
        description: "Practical guidance on checking permissions correctly in applications.",
      },
      {
        label: "OWASP Insecure Direct Object Reference Prevention Cheat Sheet",
        href: "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html",
        description: "Explains the exact weakness this project looks for: reaching records by changing an ID.",
      },
    ],
  },
  {
    id: "intel",
    slug: "threat-intelligence",
    name: "Threat Intelligence",
    summary:
      "Threat intelligence analysts research who is attacking organizations, how, and why, then turn that research into practical guidance for defenders.",
    workFocus: "researching attack campaigns and weighing what the evidence supports",
    overview: [
      "Threat intelligence is information about threats that has been collected, checked, and analyzed so people can make decisions with it. Analysts study attack campaigns, the groups behind them, and the techniques those groups use.",
      "Much of the work is reading reports from security companies, government agencies, and researchers, comparing their claims, and judging how reliable each source is. Good analysts state how confident they are in each conclusion and keep verified facts separate from claims.",
      "The results are usually written: briefings, reports, and recommendations shaped around what a specific organization needs to know.",
    ],
    terms: [
      { term: "Campaign", definition: "A series of related attacks that share goals, methods, or infrastructure." },
      { term: "Phishing", definition: "Messages designed to trick people into sharing information, sending money, or opening something harmful." },
      { term: "Confidence level", definition: "A statement of how strongly the evidence supports a conclusion, often described as low, moderate, or high." },
      { term: "Tactics, techniques, and procedures (TTPs)", definition: "The patterns of behavior attackers use to reach their goals." },
      { term: "Intelligence brief", definition: "A short report that explains a threat and what to do about it." },
    ],
    tasks: [
      "Track reporting on campaigns that matter to an organization.",
      "Compare sources and judge how reliable each one is.",
      "Describe attacker behavior using a shared framework such as MITRE ATT&CK.",
      "Write briefings with clear confidence statements.",
      "Share findings with SOC analysts and threat hunters so they know what to look for.",
    ],
    roles: ["Cyber threat intelligence analyst", "Threat researcher"],
    project: {
      title: "Investigate a Fake Internship Campaign",
      summary:
        "Research a documented phishing or fake internship campaign using public reports and publicly accessible community discussions, then write a concise intelligence brief with defensive recommendations.",
      materials: [
        "Public reports about job or internship scams from government agencies, universities, or security companies",
        "Publicly accessible community discussions about the campaign; relevant public Discord conversations can be one source",
        "A source log in a spreadsheet: publisher, date, link, and what each source claims",
      ],
      steps: [
        "Choose a documented phishing or fake internship campaign that has public reporting.",
        "Collect sources and record each one’s publisher, date, link, and main claims.",
        "Identify recurring patterns, such as how the offer arrived, what it asked for, and how it tried to look legitimate.",
        "Mark which details are confirmed by several reliable sources and which are single, unconfirmed claims.",
        "Assign a confidence level to each conclusion and explain the reason for it.",
        "Write defensive recommendations that students and career offices could realistically follow.",
      ],
      publish: [
        "A concise intelligence brief explaining the campaign",
        "A source list with publication dates",
        "Confidence statements that separate verified facts from claims",
        "Practical defensive recommendations",
      ],
      extension: "Translate one observed behavior into a hypothesis that could be tested in practice system logs.",
      notes: [
        "Reviewing online reports about a campaign is threat intelligence. Searching an environment’s logs for evidence of that behavior is threat hunting.",
        "Keep the project to public evidence and defensive analysis. Do not contact suspected scammers, reply to offers, or look for stolen information. Remove names and usernames when you quote community discussions.",
      ],
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Sources reviewed", source: "your source log, with dates" },
        { label: "Corroborated facts vs single-source claims", source: "confidence column in the brief" },
        { label: "Indicators or patterns catalogued", source: "campaign table" },
        { label: "Recommendations delivered", source: "the defensive section" },
      ],
      resumeExample: {
        name: "Lighthouse",
        stack: ["OSINT", "MITRE ATT&CK", "FTC and IC3 advisories", "Source log", "Markdown"],
        bullet:
          "Researched a documented fake internship campaign across 11 public sources spanning 6 months; separated 7 corroborated facts from 4 single-source claims and delivered 5 defensive recommendations to a career center audience.",
      },
    },
    related: ["hunting", "soc", "grc"],
    resources: [
      {
        label: "FTC Consumer Advice: Job Scams",
        href: "https://consumer.ftc.gov/articles/job-scams",
        description: "The Federal Trade Commission’s public guidance on how job scams work and how to report them.",
      },
      {
        label: "Internet Crime Complaint Center (IC3)",
        href: "https://www.ic3.gov/",
        description: "The FBI’s complaint center, which publishes public service announcements about current fraud schemes.",
      },
      {
        label: "MITRE ATT&CK",
        href: "https://attack.mitre.org/",
        description: "A shared vocabulary for describing attacker techniques in your brief.",
      },
    ],
  },
  {
    id: "ir",
    slug: "incident-response",
    name: "Incident Response",
    summary:
      "Incident responders take charge when a security incident is confirmed: they limit the damage, remove the attacker’s access, restore systems, and help the organization learn from what happened.",
    workFocus: "containing attacks, making decisions under pressure, and restoring systems safely",
    overview: [
      "An incident is a security event that harms, or threatens to harm, an organization’s systems or information. Incident response is the organized effort to handle it.",
      "Responders follow a plan that usually moves through preparation, identification (confirming what is happening), containment (stopping it from spreading), eradication (removing the cause), recovery (returning to normal), and a lessons-learned review.",
      "The work combines technical investigation with coordination. Responders make time-sensitive decisions with incomplete information, keep a careful record of what was done and why, and explain the situation to people who are not security specialists.",
    ],
    terms: [
      { term: "Incident", definition: "A security event that harms, or threatens to harm, systems or information." },
      { term: "Containment", definition: "Actions that limit an attacker’s reach, such as disabling an account or isolating a device from the network." },
      { term: "Playbook", definition: "A written, step-by-step plan for handling a specific type of incident." },
      { term: "Tabletop exercise", definition: "A discussion-based rehearsal in which a team talks through a fictional incident to test its plan." },
      { term: "Indicator of compromise", definition: "Evidence, such as a suspicious web address or file, suggesting a system was attacked." },
    ],
    tasks: [
      "Confirm whether reported activity is an actual incident.",
      "Choose containment steps and weigh their effect on normal work.",
      "Coordinate with IT staff, leadership, and communications teams.",
      "Keep a timeline of actions, decisions, and the reasons for them.",
      "Guide recovery and check that systems are safe to use again.",
      "Lead a lessons-learned review and update playbooks.",
    ],
    roles: ["Incident responder", "Incident response consultant"],
    project: {
      title: "Respond to a Simulated Account Compromise",
      summary:
        "Work through a fictional compromised-account scenario. Document identification, containment, recovery, and follow-up actions.",
      materials: [
        "A short fictional scenario that you write, optionally inspired by a published tabletop exercise",
        "A spreadsheet or document for the exercise timeline",
        "A document for the response playbook",
      ],
      steps: [
        "Write a short fictional scenario, for example: a student organization’s shared social media account starts posting links nobody approved.",
        "Identification: list the signs that the account is compromised and the first questions you need answered.",
        "Containment: decide what to do immediately, such as changing the password and signing out other sessions, and note what each action might disrupt.",
        "Recovery: describe how to remove the intruder’s access, check account recovery settings, and return the account to normal use.",
        "Follow-up: decide who needs to be told, what to watch afterward, and what to change so it is less likely to happen again.",
        "Record every decision on a timeline with the time, the action, and the reason.",
      ],
      publish: [
        "A response playbook for compromised accounts",
        "The exercise timeline, with the reasoning behind each decision",
        "A short lessons-learned section",
        "A clear label that the scenario is fictional",
      ],
      extension: "Run a tabletop exercise with another student and revise the playbook based on what was unclear.",
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Time from detection to containment", source: "exercise timeline" },
        { label: "Decisions logged", source: "timeline entries with reasons" },
        { label: "Playbook steps produced", source: "the published playbook" },
        { label: "Gaps found in the tabletop", source: "the revision notes" },
      ],
      resumeExample: {
        name: "Firebreak",
        stack: ["NIST SP 800-61", "CISA tabletop package", "Incident timeline", "Markdown playbook"],
        bullet:
          "Ran a simulated account compromise from detection to recovery in 45 minutes; logged 14 timestamped decisions, produced a 6-step containment playbook, and revised it after a tabletop with 3 students.",
      },
    },
    related: ["forensics", "soc", "hunting"],
    resources: [
      {
        label: "NIST SP 800-61 Rev. 3: Incident Response Recommendations",
        href: "https://csrc.nist.gov/pubs/sp/800/61/r3/final",
        description: "The National Institute of Standards and Technology’s guidance on incident response.",
      },
      {
        label: "CISA Tabletop Exercise Packages",
        href: "https://www.cisa.gov/resources-tools/services/cisa-tabletop-exercise-packages",
        description: "Free scenario packages from the Cybersecurity and Infrastructure Security Agency for planning discussion-based exercises.",
      },
    ],
  },
  {
    id: "cloud",
    slug: "cloud-security",
    name: "Cloud Security",
    summary:
      "Cloud security analysts and engineers make sure services running on platforms such as AWS, Microsoft Azure, and Google Cloud are configured safely, monitored, and kept that way.",
    workFocus: "securing cloud servers, storage, and configurations",
    overview: [
      "Many organizations run their applications on cloud platforms instead of their own hardware. The provider secures its data centers, but customers remain responsible for how they configure their accounts, storage, networks, and permissions.",
      "Misconfigurations, such as storage anyone on the internet can read or permissions far broader than needed, are a common cause of cloud incidents. Cloud security teams review configurations, add guardrails that block risky settings, and make sure activity is logged.",
      "Much cloud infrastructure is defined in code, so the work often involves reading configuration templates and automating checks.",
    ],
    terms: [
      { term: "Shared responsibility model", definition: "The split between what the cloud provider secures and what the customer must configure and protect." },
      { term: "Infrastructure as code", definition: "Describing servers, storage, and networks in configuration files instead of setting them up by hand." },
      { term: "Template", definition: "An infrastructure-as-code file, such as a Terraform file, that defines cloud resources." },
      { term: "Least privilege", definition: "Giving people and services only the permissions they actually need." },
      { term: "Configuration check", definition: "An automated scan that compares settings in a template against security rules, without deploying anything." },
    ],
    tasks: [
      "Review infrastructure templates before they are deployed.",
      "Find publicly exposed storage and overly broad permissions.",
      "Turn on audit logging and review what it records.",
      "Write policies that block risky configurations automatically.",
      "Investigate alerts about unusual activity in cloud accounts.",
    ],
    roles: ["Cloud security analyst", "Cloud security engineer"],
    project: {
      title: "Review and Harden a Cloud Configuration",
      summary:
        "Review a small infrastructure template for exposed storage, excessive permissions, and missing logging. Correct the issues and rerun configuration checks.",
      materials: [
        "A small infrastructure-as-code template, such as a Terraform file that defines a storage bucket and an access policy",
        "A free, open-source configuration scanner such as Checkov, run on your own computer",
        "A text editor",
      ],
      steps: [
        "Write or find a small template that defines a storage bucket, an access policy, and logging settings.",
        "Read it yourself first and note anything that looks publicly exposed or overly permissive.",
        "Run a configuration scanner against the template and save the results.",
        "Group the findings into exposed storage, excessive permissions, and missing logging.",
        "Correct each issue in a copy of the template and explain why each change helps.",
        "Rerun the scanner and compare the results with the first run. If you leave a finding unfixed, explain why.",
      ],
      publish: [
        "The original and corrected templates",
        "Configuration check results from before and after your changes",
        "An explanation of each change",
        "A note that these are checks of template files, not tests of a deployed environment",
      ],
      extension: "Add automated checks that flag the same configuration mistakes.",
      notes: [
        "The starter version runs entirely on your own computer against template files. It does not require a cloud account or any paid deployment.",
        "Passing configuration checks shows the template follows the rules the tool checks for. It is not the same as testing a deployed environment.",
      ],
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Resources in the template", source: "the template you reviewed" },
        { label: "Findings before and after", source: "scanner output from both runs" },
        { label: "Permissions narrowed", source: "diff of the policy" },
        { label: "Checks automated", source: "the CI configuration" },
      ],
      resumeExample: {
        name: "Bedrock",
        stack: ["Terraform", "Checkov", "AWS S3 and IAM", "CIS Benchmarks", "GitHub Actions"],
        bullet:
          "Reviewed a 120-line Terraform template with an open-source configuration scanner; fixed 14 of 17 findings covering public storage, broad permissions and missing logging, documented the 3 accepted risks, and added the checks to CI.",
      },
    },
    related: ["iam", "appsec", "network"],
    resources: [
      {
        label: "Checkov",
        href: "https://www.checkov.io/",
        description: "A free, open-source tool that scans infrastructure-as-code templates for security misconfigurations.",
      },
      {
        label: "Terraform tutorials (HashiCorp)",
        href: "https://developer.hashicorp.com/terraform/tutorials",
        description: "Official tutorials for writing the kind of template this project reviews.",
      },
      {
        label: "AWS Shared Responsibility Model",
        href: "https://aws.amazon.com/compliance/shared-responsibility-model/",
        description: "Amazon Web Services’ explanation of what the provider secures and what customers must secure.",
      },
    ],
  },
  {
    id: "iam",
    slug: "identity-access-management",
    name: "Identity and Access Management",
    summary:
      "Identity and access management (IAM) specialists decide how people sign in and what each account is allowed to reach, from the day someone joins until the day they leave.",
    workFocus: "deciding who gets access and keeping permissions appropriate over time",
    overview: [
      "Almost every system asks two questions: who are you, and what are you allowed to do? Identity and access management covers both, along with how access changes over time.",
      "IAM teams manage sign-in methods, multi-factor authentication, and role-based permissions. A large part of the work is the account lifecycle: granting the right access when someone joins, adjusting it when their role changes, and removing it when they leave.",
      "Stolen or overly powerful accounts play a part in many incidents, so careful access design has a direct security payoff.",
    ],
    terms: [
      { term: "Authentication", definition: "Proving who you are, for example with a password and a second factor." },
      { term: "Authorization", definition: "Deciding what an authenticated account is allowed to do." },
      { term: "Multi-factor authentication (MFA)", definition: "Signing in with more than one kind of proof, such as a password plus a code from an app." },
      { term: "Role-based access control", definition: "Assigning permissions to roles, such as member or officer, and then assigning people to roles." },
      { term: "Least privilege", definition: "Giving each account only the access it needs." },
      { term: "Account lifecycle", definition: "The joiner, mover, and leaver process of creating, changing, and removing access." },
    ],
    tasks: [
      "Design roles and the permissions each role needs.",
      "Review who can reach sensitive systems and remove access that is no longer needed.",
      "Automate account creation, changes, and removal.",
      "Configure single sign-on and multi-factor authentication.",
      "Investigate suspicious sign-ins and accounts with excessive permissions.",
    ],
    roles: ["IAM analyst", "Identity security engineer"],
    project: {
      title: "Design and Test Role-Based Access",
      summary:
        "Use a local demo with member, officer, and administrator roles. Test what happens when someone joins, changes roles, and leaves.",
      materials: [
        "A small local demo app, database, or directory service that you set up yourself",
        "Made-up test accounts for each role",
        "A spreadsheet for the permissions matrix",
      ],
      steps: [
        "List the actions in your demo, such as viewing events, editing events, and changing someone’s role.",
        "Build a permissions matrix: one row per action, one column per role, and yes or no in each cell.",
        "Create a test account for each role and confirm each one can do only what the matrix allows.",
        "Joiner: add a new member account and test its access.",
        "Mover: change a member to an officer, confirm the new permissions work, and check that nothing extra was granted.",
        "Leaver: remove an account and confirm it can no longer sign in or keep any access.",
      ],
      publish: [
        "A permissions matrix",
        "Access-test results for each role",
        "An account lifecycle walkthrough covering joining, changing roles, and leaving",
      ],
      extension: "Automate an access change and verify that obsolete permissions are removed.",
      notes: ["This is a local practice lab with made-up accounts, for learning how access works."],
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Roles defined", source: "permissions matrix" },
        { label: "Actions mapped per role", source: "matrix columns and rows" },
        { label: "Access tests run", source: "test results table" },
        { label: "Excess permissions removed", source: "before-and-after matrix" },
      ],
      resumeExample: {
        name: "Turnstile",
        stack: ["Keycloak", "RBAC design", "NIST SP 800-63", "Permissions matrix", "Docker"],
        bullet:
          "Designed 3 roles across 18 actions in a local demo; tested all 54 permission combinations, corrected 5 that granted more than intended, and verified that a leaver lost access to all 18 actions.",
      },
    },
    related: ["appsec", "cloud", "grc"],
    resources: [
      {
        label: "OWASP Authorization Cheat Sheet",
        href: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
        description: "Guidance on designing and enforcing permissions, including least privilege.",
      },
      {
        label: "NIST SP 800-63 Digital Identity Guidelines",
        href: "https://pages.nist.gov/800-63-4/",
        description: "The National Institute of Standards and Technology’s guidelines on identity and authentication.",
      },
    ],
  },
  {
    id: "grc",
    slug: "governance-risk-compliance",
    name: "Governance, Risk, and Compliance",
    summary:
      "Governance, risk, and compliance (GRC) analysts help organizations decide which security risks matter most, set clear requirements, and gather evidence that security controls actually work.",
    workFocus: "weighing security risks, setting requirements, and checking the evidence",
    overview: [
      "Governance is how an organization sets its security direction and assigns responsibility. Risk management is how it identifies what could go wrong and decides what to do about it. Compliance is showing that it meets the requirements it has agreed to or must follow.",
      "GRC analysts interview teams, review policies, maintain risk registers, and collect evidence for assessments and audits. They translate technical issues into decisions leaders can make.",
      "It suits people who like organizing complex information, writing clearly, and following up until questions have answers.",
    ],
    terms: [
      { term: "Risk", definition: "The chance that something harmful happens, combined with how bad it would be." },
      { term: "Control", definition: "A safeguard that reduces risk, such as a policy, a review step, or a technical setting." },
      { term: "Risk register", definition: "A table listing risks, how likely and harmful each is, who owns it, and the planned response." },
      { term: "Residual risk", definition: "The risk that remains after controls are in place." },
      { term: "Framework", definition: "A published set of practices, such as the NIST Cybersecurity Framework, used to organize a security program." },
    ],
    tasks: [
      "Identify and rate risks together with the people who run the systems.",
      "Match requirements from frameworks or regulations to specific controls.",
      "Collect and review evidence that controls are working.",
      "Track fixes with the responsible teams until they are done.",
      "Write policies and explain them in plain language.",
    ],
    roles: ["GRC analyst", "IT risk analyst", "IT auditor"],
    project: {
      title: "Assess a Fictional Student Organization",
      summary:
        "Describe a fictional organization and its member platform. Identify a manageable set of risks and explain their relative importance.",
      materials: [
        "A one-page description of a fictional organization that you write",
        "A risk register spreadsheet",
        "A framework to refer to, such as the NIST Cybersecurity Framework",
      ],
      steps: [
        "Describe the fictional organization: who its members are, what information its platform stores, and who runs it.",
        "List five to eight risks, such as officers sharing one password or member records having no backup.",
        "Rate each risk’s likelihood and impact on a simple scale, and explain each rating in a sentence.",
        "Rank the risks and explain why the top ones matter most.",
        "Propose a control for each risk and name the role responsible for it.",
        "For each control, describe the evidence that would show whether it works.",
      ],
      publish: [
        "A risk register with likelihood, impact, and the reasoning for each rating",
        "Proposed controls and the roles responsible for them",
        "The evidence that would show whether each control works",
        "A clear label that this is a simulated assessment of a fictional organization",
      ],
      extension: "Reassess the risks after the proposed controls and explain the remaining uncertainty.",
      notes: ["This is a simulated assessment. Label it clearly as simulated wherever you share it."],
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Risks registered", source: "risk register rows" },
        { label: "Risks ranked with rationale", source: "likelihood and impact columns" },
        { label: "Controls proposed with owners", source: "control column" },
        { label: "Evidence items defined", source: "evidence column" },
      ],
      resumeExample: {
        name: "Ledger",
        stack: ["NIST CSF 2.0", "Risk register", "Control mapping", "Evidence log"],
        bullet:
          "Assessed a fictional student organization platform and registered 8 risks rated by likelihood and impact; proposed a control and owner for each and defined the evidence that would show the top 3 are working.",
      },
    },
    related: ["iam", "intel", "ir"],
    resources: [
      {
        label: "NIST Cybersecurity Framework",
        href: "https://www.nist.gov/cyberframework",
        description: "A widely used framework for organizing and discussing security risks and controls.",
      },
    ],
  },
  {
    id: "forensics",
    slug: "digital-forensics",
    name: "Digital Forensics",
    summary:
      "Digital forensic analysts examine computers, phones, and other devices to reconstruct what happened, handling evidence carefully so their conclusions can be checked.",
    workFocus: "reconstructing past events from files, logs, and timestamps",
    overview: [
      "Digital forensics is the careful collection and examination of digital evidence. Analysts work from exact copies of storage devices or from collected files and piece together what people and programs did, and when.",
      "Findings often support incident response, internal investigations, or legal cases, so the process matters as much as the answer. Analysts document how evidence was handled, avoid changing the original, and keep what the evidence shows separate from what they infer.",
      "The work suits people who enjoy methodical reconstruction and clear, careful writing.",
    ],
    terms: [
      { term: "Disk image", definition: "An exact copy of a storage device, examined instead of the original so the evidence is not changed." },
      { term: "Artifact", definition: "A trace left on a system by activity, such as browser history, a list of recently opened files, or a log entry." },
      { term: "Timeline", definition: "An ordered list of events built from timestamps across different artifacts." },
      { term: "Hash value", definition: "A fingerprint calculated from a file’s contents. If the file changes, the hash value changes." },
      { term: "Chain of custody", definition: "A record of who handled evidence, when, and what they did with it." },
    ],
    tasks: [
      "Create or verify copies of evidence and record their hash values.",
      "Extract artifacts such as browser history, file details, and system logs.",
      "Build timelines of user and program activity.",
      "Explain where the evidence is strong, weak, or missing.",
      "Write reports that people without a technical background can follow.",
    ],
    roles: ["Digital forensic analyst", "Forensic examiner"],
    project: {
      title: "Reconstruct an Incident Timeline",
      summary:
        "Use a practice disk image or supplied evidence files. Record the evidence examined and reconstruct the sequence of events.",
      materials: [
        "A practice disk image or evidence files published for training",
        "A free forensic tool such as Autopsy, or the tools recommended with the practice case",
        "A spreadsheet for the evidence inventory and timeline",
      ],
      steps: [
        "Read the practice case description and write down the questions you are trying to answer.",
        "Record each evidence item in an inventory: its name, where it came from, its hash value if provided, and what it contains.",
        "Extract relevant artifacts, such as file timestamps, browser history, and log entries.",
        "Place each event on a timeline with its timestamp, its source, and what it shows.",
        "Check time zones and gaps so events from different sources line up correctly.",
        "Write your reconstruction, marking what the evidence confirms and what you are inferring.",
        "List the limitations, such as missing logs or timestamps that could have been changed.",
      ],
      publish: [
        "An evidence inventory",
        "The reconstructed timeline",
        "Supporting screenshots of key artifacts",
        "The limitations of the evidence and of your analysis",
        "The name and source of the practice case you used",
      ],
      extension: "Explain where two evidence sources agree or conflict.",
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Evidence items inventoried", source: "evidence inventory" },
        { label: "Timeline events reconstructed", source: "timeline table" },
        { label: "Time span covered", source: "first and last timestamps" },
        { label: "Conflicts or gaps documented", source: "limitations section" },
      ],
      resumeExample: {
        name: "Lantern",
        stack: ["Autopsy", "The Sleuth Kit", "Digital Corpora image", "Timeline analysis"],
        bullet:
          "Reconstructed 36 hours of activity in a practice forensic case from a disk image; inventoried 14 evidence items, built a 27-event timeline from 4 artifact sources, and documented 2 timestamp conflicts.",
      },
    },
    related: ["ir", "malware", "hunting"],
    resources: [
      {
        label: "Digital Corpora",
        href: "https://digitalcorpora.org/",
        description: "Freely available disk images and practice scenarios created for digital forensics education and research.",
      },
      {
        label: "Autopsy",
        href: "https://www.autopsy.com/",
        description: "A free, open-source digital forensics platform for examining disk images.",
      },
    ],
  },
  {
    id: "hunting",
    slug: "threat-hunting-detection",
    name: "Threat Hunting / Detection",
    summary:
      "Threat hunters search activity records for attackers that existing alerts missed, and detection engineers turn what they learn into rules that catch the behavior automatically.",
    workFocus: "searching for hidden attacker activity and writing rules that catch it",
    overview: [
      "Security tools only alert on what they have been told to look for. Threat hunting starts from the possibility that something slipped past them. A hunter writes a hypothesis, a testable idea about how an attacker might behave, and searches logs for evidence for or against it.",
      "Detection engineering is the related work of writing and tuning the rules that produce alerts. A good rule catches the behavior it targets without burying analysts in false alarms, and it is tested against both suspicious and ordinary activity.",
      "Both roles depend on knowing what normal activity looks like, writing precise searches, and being honest when the evidence is inconclusive.",
    ],
    terms: [
      { term: "Hypothesis", definition: "A specific, testable statement, such as “repeated failed logins were followed by a successful unauthorized login.”" },
      { term: "Query", definition: "A search written in a log tool’s language to find matching records." },
      { term: "Detection rule", definition: "Saved logic that raises an alert whenever matching activity appears." },
      { term: "Baseline", definition: "A description of normal activity used for comparison." },
      { term: "False positive", definition: "An alert on harmless activity." },
    ],
    tasks: [
      "Write a hunt hypothesis based on a known attacker technique.",
      "Search authentication, process, or network logs for supporting evidence.",
      "Compare suspicious results with normal activity to rule out ordinary explanations.",
      "Draft or tune a detection rule and measure how often it fires.",
      "Document hunts so they can be repeated later.",
    ],
    roles: ["Threat hunter", "Detection engineer"],
    project: {
      title: "Hunt for Suspicious Login Activity",
      summary:
        "Test the hypothesis that repeated failed logins may have been followed by unauthorized access by searching a public practice authentication dataset.",
      materials: [
        "A public practice dataset that includes authentication (sign-in) events",
        "A tool that can filter and count records, such as a spreadsheet, Python, or a free log search tool",
        "A document to record your queries and findings",
      ],
      steps: [
        "Write the hypothesis: repeated failed logins may have been followed by unauthorized access.",
        "Read the dataset’s documentation so you know what each field means, such as time, account, source, and result.",
        "Find accounts or sources with bursts of failed logins, and save the query you used.",
        "Check whether a successful login from the same source, or to the same account, followed soon after.",
        "Examine timing, accounts, and source information, and look for ordinary explanations such as a mistyped password or a service using an expired password.",
        "State what the evidence supports and what it does not. A failed-login pattern alone does not prove compromise.",
        "If the pattern holds up, draft a detection rule that describes when an alert should fire.",
      ],
      publish: [
        "The hypothesis",
        "Each search query, with a sentence on what it looks for",
        "The evidence you found, such as tables or screenshots",
        "Findings, alternative explanations, and limitations",
        "Any proposed detection rule",
      ],
      extension: "Test the rule against both suspicious and ordinary activity.",
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Records searched", source: "dataset size and date range" },
        { label: "Queries written", source: "the query list in the report" },
        { label: "Accounts or sources flagged", source: "findings table" },
        { label: "Rule results on normal activity", source: "baseline test" },
      ],
      resumeExample: {
        name: "Beacon",
        stack: ["Python", "pandas", "Sigma", "MITRE ATT&CK", "LANL authentication dataset"],
        bullet:
          "Hunted 1.4 million authentication records for password spraying; wrote 6 queries that isolated 1 source trying 3 passwords across 400 accounts, and drafted a detection rule that fired 0 times on a normal-day baseline.",
      },
    },
    related: ["soc", "intel", "ir"],
    resources: [
      {
        label: "Los Alamos National Laboratory: User-Computer Authentication Associations in Time",
        href: "https://csr.lanl.gov/data/auth/",
        description: "A public dataset of anonymized authentication events from a real enterprise network.",
      },
      {
        label: "Security Datasets (Open Threat Research Forge)",
        href: "https://github.com/OTRF/Security-Datasets",
        description: "Recorded logs from simulated attacks, useful for testing hunts and detection rules.",
      },
      {
        label: "Sigma",
        href: "https://sigmahq.io/",
        description: "An open format for writing detection rules that can be shared across log tools.",
      },
    ],
  },
  {
    id: "network",
    slug: "network-security",
    name: "Network Security",
    summary:
      "Network security analysts and engineers design and monitor the connections between devices so attacks are harder to launch and harder to spread.",
    workFocus: "controlling which devices can connect and how traffic moves between them",
    overview: [
      "An organization’s devices are connected by networks, and attackers who get into one device often try to move to others. Network security makes that harder: separating devices into zones, allowing only the connections that are needed, and watching traffic for signs of trouble.",
      "Engineers design and configure firewalls, network segments, and remote access. Analysts review traffic and firewall logs to spot suspicious connections.",
      "It suits people who like understanding how systems connect and enjoy troubleshooting without weakening security.",
    ],
    terms: [
      { term: "Network segmentation", definition: "Dividing a network into separate zones so a problem in one zone does not easily spread." },
      { term: "Firewall rule", definition: "An instruction that allows or blocks traffic based on where it comes from, where it is going, and which port it uses." },
      { term: "Port", definition: "A numbered channel a network service listens on, such as 443 for secure websites." },
      { term: "Lateral movement", definition: "An attacker moving from one compromised device to other devices." },
      { term: "Default deny", definition: "Blocking all traffic unless a rule explicitly allows it." },
    ],
    tasks: [
      "Design segments that separate everyday users, servers, and administrators.",
      "Write and review firewall rules.",
      "Investigate suspicious traffic in network logs or packet captures (recordings of network traffic).",
      "Troubleshoot connection problems without opening unnecessary access.",
      "Keep network diagrams and the reason for each allowed connection up to date.",
    ],
    roles: ["Network security analyst", "Network security engineer"],
    project: {
      title: "Build and Test a Segmented Practice Network",
      summary:
        "Create separate user and administrator areas in a small virtual or simulated network. Define allowed connections and test the rules.",
      materials: [
        "Virtual machines on your own computer, or a free network simulator",
        "A firewall you can configure, such as the one built into a Linux virtual machine or a free open-source firewall such as OPNsense",
        "Simple tools for testing connections, such as ping and a port-checking utility",
      ],
      steps: [
        "Sketch two zones, users and administrators, and decide which devices belong in each.",
        "Write the connection policy in plain language, for example: administrator devices can reach user devices for support, but user devices cannot reach the administrator zone.",
        "Build the network and apply firewall rules that block everything except the allowed connections.",
        "Test every rule from both sides, including connections that should fail.",
        "Record each test: source, destination, port, expected result, and actual result.",
        "Fix any rule that behaved differently than you expected, then test again.",
      ],
      publish: [
        "A network diagram",
        "An explanation of each rule",
        "Actual connection-test results, including tests that were expected to fail",
      ],
      extension: "Demonstrate how the boundaries limit movement from a simulated compromised device.",
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Hosts and zones built", source: "network diagram" },
        { label: "Firewall rules written", source: "rule table" },
        { label: "Connection tests run", source: "test results, pass and fail" },
        { label: "Blocked paths verified", source: "the tests expected to fail" },
      ],
      resumeExample: {
        name: "Bulkhead",
        stack: ["VirtualBox", "OPNsense", "Wireshark", "nmap", "Default-deny policy"],
        bullet:
          "Built a 5-host segmented lab with separate user and administrator zones; wrote 9 default-deny firewall rules and documented 24 connection tests, including the 11 that were expected to fail.",
      },
    },
    related: ["cloud", "offensive", "soc"],
    resources: [
      {
        label: "OPNsense",
        href: "https://opnsense.org/",
        description: "A free, open-source firewall and routing platform you can run in a virtual machine.",
      },
      {
        label: "Wireshark",
        href: "https://www.wireshark.org/",
        description: "A free tool for capturing and inspecting network traffic while you test your rules.",
      },
    ],
  },
  {
    id: "malware",
    slug: "malware-analysis",
    name: "Malware Analysis",
    summary:
      "Malware analysts study malicious software to understand what it does, how to detect it, and how to defend against it.",
    workFocus: "understanding what suspicious programs do behind the scenes",
    overview: [
      "Malware is software designed to cause harm, such as stealing information, locking files for ransom, or giving an attacker remote control of a computer. Malware analysts work out how a sample behaves so defenders can detect and remove it.",
      "The work ranges from reviewing analysis reports and observing programs in a sandbox to reverse engineering, which means reading a program’s compiled instructions to understand its logic. Handling live malware requires strict isolation and experience.",
      "It suits patient people who enjoy taking a small, confusing problem apart and documenting exactly what they found.",
    ],
    terms: [
      { term: "Malware", definition: "Software designed to cause harm." },
      { term: "Sample", definition: "A specific copy of a malicious program that is being studied." },
      { term: "Sandbox", definition: "An isolated environment that runs a program and records what it does, without putting real systems at risk." },
      { term: "Indicator", definition: "Observable evidence of malware, such as a file’s hash value or a web domain it contacts." },
      { term: "Reverse engineering", definition: "Reading a program’s compiled instructions to understand how it works." },
    ],
    tasks: [
      "Review sandbox reports and summarize a sample’s behavior.",
      "Extract indicators and share them with detection teams.",
      "Compare samples to find related malware families.",
      "Reverse engineer key parts of a program to confirm what they do.",
      "Write reports that explain technical findings clearly.",
    ],
    roles: ["Malware analyst", "Reverse engineer"],
    project: {
      title: "Compare Two Malware Analysis Reports",
      summary:
        "Use published analysis reports or supplied sandbox reports. Compare behavior, indicators, and differences.",
      materials: [
        "Two published malware analysis reports from government agencies or security researchers, or supplied sandbox reports",
        "A comparison table in a spreadsheet or document",
      ],
      steps: [
        "Choose two reports about related samples, such as two versions of the same malware family or two families with a similar goal.",
        "Record each report’s publisher, date, and link.",
        "Summarize each sample’s behavior: how it arrives, what it changes, and what it communicates with.",
        "Build a table comparing behaviors and indicators side by side.",
        "Note the differences and whether the reports explain them.",
        "Separate the researchers’ findings from your own interpretation, and cite each claim.",
      ],
      publish: [
        "A cited comparison of the two reports",
        "A table of behaviors and indicators, with web addresses written so they cannot be clicked (for example, example[.]com)",
        "A clear separation between the original researchers’ findings and your interpretation",
      ],
      extension: "Explain what additional evidence would be needed to confirm an uncertain conclusion.",
      notes: [
        "This beginner project works only from published or supplied reports. It does not require downloading or running live malware.",
        "Comparing reports is report analysis, not hands-on reverse engineering. Describe it that way.",
      ],
      /** Counts the finished work actually produces, for the report and the résumé line. */
      metrics: [
        { label: "Reports compared", source: "source list" },
        { label: "Behaviors tabulated", source: "comparison table" },
        { label: "Indicators extracted", source: "indicator table, defanged" },
        { label: "Uncertain claims flagged", source: "your interpretation notes" },
      ],
      resumeExample: {
        name: "Petri",
        stack: ["CISA advisories", "MITRE ATT&CK", "Sandbox reports", "Indicator table"],
        bullet:
          "Compared 2 published analyses of related malware samples; tabulated 18 behaviors and 12 indicators, flagged 3 claims supported by only one report, and published a cited write-up separating their findings from my reading.",
      },
    },
    related: ["forensics", "intel", "hunting"],
    resources: [
      {
        label: "CISA Cybersecurity Alerts & Advisories",
        href: "https://www.cisa.gov/news-events/cybersecurity-advisories",
        description: "Public advisories from the Cybersecurity and Infrastructure Security Agency, including malware analysis reports.",
      },
      {
        label: "MITRE ATT&CK",
        href: "https://attack.mitre.org/",
        description: "A shared vocabulary for describing the behaviors you compare.",
      },
    ],
  },
];

/**
 * Paths that are planned but not written yet. They are listed with the twelve
 * above so the direction is visible, and stay out of CAREER_PATHS so the
 * questionnaire, scoring and detail routes only ever deal with paths that
 * actually have content.
 */
export const UPCOMING_PATHS: readonly UpcomingPath[] = [
  {
    name: "Solution Architect",
    summary:
      "Solution architects decide how the parts of a system fit together — which services are used, how data moves between them and which controls protect it — so a design meets what the business needs without leaving obvious security gaps.",
    roles: ["Solutions Architect", "Cloud Solutions Architect", "Security Architect"],
  },
];

export const CAREER_BY_ID: Readonly<Record<CareerId, CareerPath>> = Object.fromEntries(
  CAREER_PATHS.map((path) => [path.id, path]),
) as Record<CareerId, CareerPath>;

export function getCareerBySlug(slug: string) {
  return CAREER_PATHS.find((path) => path.slug === slug);
}
