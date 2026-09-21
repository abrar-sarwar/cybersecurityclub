import type { CareerId } from "./types";

/**
 * The project library: thirty projects a student can finish alone, ranked by
 * how much they add to a first portfolio. Rank 1 is the best place to start.
 *
 * Everything here runs on public data, published reports, or a local lab.
 * Nothing asks a student to touch a system they do not own.
 */
export type ProjectDifficulty = "easy" | "medium" | "hard";

export type LibraryProject = {
  /** 1 is the strongest first portfolio piece. */
  rank: number;
  slug: string;
  title: string;
  path: CareerId;
  /** Harder projects take longer and carry more weight on a résumé. */
  difficulty: ProjectDifficulty;
  /** Rough hands-on time, not a deadline. */
  hours: string;
  /** One sentence: what you build. */
  summary: string;
  /** One sentence: what it proves to someone reading your portfolio. */
  benefit: string;
  stack: string[];
  frameworks: { name: string; use: string }[];
  /** Five or six steps, in order. */
  steps: string[];
  /** What ends up in the repository. */
  publish: string[];
  /** Five names to pick from, so two projects never look alike. */
  nameIdeas: string[];
  /** Example résumé line, adapted once the work is done. */
  resumeBullet: string;
};

export const LIBRARY_PROJECTS: readonly LibraryProject[] = [
  {
    rank: 1,
    slug: "alert-queue-triage",
    title: "Alert Queue Triage",
    path: "soc",
    difficulty: "easy",
    hours: "4 to 6 hours",
    summary: "Work a small queue of practice alerts and decide which ones are real.",
    benefit: "Shows you can judge evidence and escalate with a reason, the daily work of a SOC.",
    stack: ["Security Datasets", "Splunk Free or Elastic", "MITRE ATT&CK", "Markdown"],
    frameworks: [
      { name: "MITRE ATT&CK", use: "Name the technique each alert suggests, so your notes use shared vocabulary." },
      { name: "SANS triage questions", use: "For every alert answer: what happened, who, when, from where, what next." },
    ],
    steps: [
      "Pick 10 to 12 alerts from a public practice dataset.",
      "For each one, write what the alert claims in your own words.",
      "Pull the surrounding log lines: account, host, time, source.",
      "Look for the ordinary explanation before the alarming one.",
      "Label each alert malicious, benign or needs evidence, with one sentence of reasoning.",
      "List the alerts you would escalate and what a responder should check first.",
    ],
    publish: ["A triage table, one row per alert", "Log excerpts or screenshots behind each decision", "A short note on which rules produced noise"],
    nameIdeas: ["Nightwatch", "Firstlight", "Triage Deck", "Signal Desk", "Quiet Hours"],
    resumeBullet:
      "Triaged 12 practice alerts against 3 days of endpoint and sign-in logs; escalated 2 confirmed intrusions with evidence and closed 10 with written reasoning.",
  },
  {
    rank: 2,
    slug: "failed-login-hunt",
    title: "Failed-Login Hunt",
    path: "hunting",
    difficulty: "medium",
    hours: "5 to 8 hours",
    summary: "Search a public authentication dataset for password spraying and prove or disprove it.",
    benefit: "Shows you can start from a hypothesis, query real data and stay honest about limits.",
    stack: ["LANL authentication dataset", "Python", "pandas", "Sigma"],
    frameworks: [
      { name: "MITRE ATT&CK T1110", use: "Frame the hunt around brute force and password spraying behaviour." },
      { name: "Sigma", use: "Write the finished detection in a format other tools can import." },
    ],
    steps: [
      "Write the hypothesis: repeated failures from one source, then a success.",
      "Read the dataset documentation and note what each field means.",
      "Query for sources with many failures across many accounts.",
      "Check whether a success followed, and how quickly.",
      "Rule out ordinary causes: expired service passwords, shared addresses, typos.",
      "Draft a Sigma rule and count how often it fires on a normal day.",
    ],
    publish: ["The hypothesis and every query you ran", "Findings with the evidence tables", "The Sigma rule and its false-positive count"],
    nameIdeas: ["Beacon", "Lowlight", "Spray Watch", "Hunt Log", "Nightshift"],
    resumeBullet:
      "Hunted 1.4 million authentication records for password spraying; 6 queries isolated 1 source trying 3 passwords across 400 accounts, and the resulting rule fired 0 times on a normal-day baseline.",
  },
  {
    rank: 3,
    slug: "account-compromise-playbook",
    title: "Account Compromise Playbook",
    path: "ir",
    difficulty: "easy",
    hours: "4 to 6 hours",
    summary: "Run a fictional compromised-account incident and write the playbook it produces.",
    benefit: "Shows you can make time-pressured decisions and record them so others can follow.",
    stack: ["NIST SP 800-61", "CISA tabletop package", "Markdown", "Timeline spreadsheet"],
    frameworks: [
      { name: "NIST SP 800-61", use: "Structure the write-up around detection, containment, eradication, recovery, lessons." },
      { name: "CISA tabletop packages", use: "Borrow the scenario injects that keep the exercise realistic." },
    ],
    steps: [
      "Write a one-paragraph scenario: a shared club account posting links nobody approved.",
      "List the signs that confirm compromise, and what you still do not know.",
      "Decide containment steps and note what each one disrupts.",
      "Work through recovery: sessions, recovery settings, connected apps.",
      "Record every decision on a timeline with the time and the reason.",
      "Finish with what you would change to prevent a repeat.",
    ],
    publish: ["The playbook, step by step", "The exercise timeline with reasoning", "A short lessons-learned section"],
    nameIdeas: ["Firebreak", "Containment", "Blue Hour", "Cold Start", "Runbook Zero"],
    resumeBullet:
      "Ran a simulated account compromise from detection to recovery in 45 minutes; logged 14 timestamped decisions and produced a 6-step containment playbook revised after a tabletop with 3 students.",
  },
  {
    rank: 4,
    slug: "fake-internship-campaign-brief",
    title: "Fake Internship Campaign Brief",
    path: "intel",
    difficulty: "easy",
    hours: "4 to 6 hours",
    summary: "Research a documented job-scam campaign from public sources and brief a non-technical team.",
    benefit: "Shows you can weigh sources, state confidence and write for people who are not analysts.",
    stack: ["OSINT", "FTC and IC3 advisories", "MITRE ATT&CK", "Source log"],
    frameworks: [
      { name: "Admiralty source grading", use: "Rate each source for reliability and each claim for credibility." },
      { name: "MITRE ATT&CK", use: "Describe the delivery and social engineering steps in shared terms." },
    ],
    steps: [
      "Choose a campaign with public reporting from at least three publishers.",
      "Log every source: publisher, date, link, main claim.",
      "Separate what several sources confirm from single-source claims.",
      "Write the pattern: how the offer arrives, what it asks for, how it looks legitimate.",
      "Give each conclusion a confidence level and say why.",
      "Finish with defensive steps a career center could actually take.",
    ],
    publish: ["The brief, one page", "The source log with dates", "Confidence statements beside each conclusion"],
    nameIdeas: ["Lighthouse", "Paper Trail", "Cold Offer", "Source Desk", "Open Ledger"],
    resumeBullet:
      "Researched a documented fake internship campaign across 11 public sources spanning 6 months; separated 7 corroborated facts from 4 single-source claims and delivered 5 defensive recommendations.",
  },
  {
    rank: 5,
    slug: "incident-timeline-reconstruction",
    title: "Incident Timeline Reconstruction",
    path: "forensics",
    difficulty: "hard",
    hours: "6 to 10 hours",
    summary: "Rebuild what happened on a practice disk image, artifact by artifact.",
    benefit: "Shows careful evidence handling and the discipline to separate fact from inference.",
    stack: ["Digital Corpora image", "Autopsy", "The Sleuth Kit", "Timeline spreadsheet"],
    frameworks: [
      { name: "NIST SP 800-86", use: "Follow collect, examine, analyse, report, and keep the original untouched." },
      { name: "Chain of custody", use: "Record who handled each item, when, and its hash value." },
    ],
    steps: [
      "Work only from a copy, and record its hash value.",
      "Inventory every evidence item before you open anything.",
      "Extract artifacts: file timestamps, browser history, connected devices.",
      "Place each event on a timeline with its source.",
      "Check time zones so sources line up.",
      "Write what the evidence shows, what you infer and what is missing.",
    ],
    publish: ["The evidence inventory with hashes", "The timeline table", "Limitations and conflicts you found"],
    nameIdeas: ["Lantern", "Cold Case", "Timeline Zero", "Quiet Disk", "Chain Link"],
    resumeBullet:
      "Reconstructed 36 hours of activity from a practice disk image; inventoried 14 evidence items, built a 27-event timeline from 4 artifact sources and documented 2 timestamp conflicts.",
  },
  {
    rank: 6,
    slug: "vulnerable-app-test-report",
    title: "Vulnerable App Test Report",
    path: "offensive",
    difficulty: "hard",
    hours: "6 to 10 hours",
    summary: "Test a deliberately vulnerable app in your own lab and report three findings properly.",
    benefit: "Shows you work inside a scope and can prove impact without causing harm.",
    stack: ["OWASP Juice Shop", "ZAP", "Burp Suite Community", "Docker"],
    frameworks: [
      { name: "OWASP Top 10", use: "Classify each finding, so a reader knows the category at a glance." },
      { name: "PTES reporting", use: "Structure the report: scope, approach, findings, evidence, remediation." },
    ],
    steps: [
      "Run the app locally in Docker and write your scope in one paragraph.",
      "Explore as a normal user; note where input, sign-in and private data meet.",
      "Pick three weaknesses rather than chasing everything.",
      "Record exact reproduction steps with screenshots.",
      "Explain impact in the owner's terms, not the tool's.",
      "Recommend a fix for each, and retest one after applying it.",
    ],
    publish: ["Scope and approach", "Three findings with reproduction steps", "Remediation advice and one retest"],
    nameIdeas: ["Trapdoor", "Glass House", "Open Window", "Scope Alpha", "Lockpick Lab"],
    resumeBullet:
      "Tested an intentionally vulnerable web application across 9 features in a local lab; confirmed 3 findings with reproducible steps and evidence, and retested 2 after applying the recommended fixes.",
  },
  {
    rank: 7,
    slug: "broken-access-control-fix",
    title: "Broken Access Control Fix",
    path: "appsec",
    difficulty: "medium",
    hours: "5 to 8 hours",
    summary: "Build a two-user app, break its record access, fix it and keep it fixed.",
    benefit: "Shows you can find the most common web flaw and prove your fix with tests.",
    stack: ["Node.js", "Express", "Playwright", "GitHub Actions"],
    frameworks: [
      { name: "OWASP ASVS V4", use: "Write the access-control requirement in the wording the standard uses." },
      { name: "OWASP Top 10 A01", use: "Name the category and link the cheat sheet in your README." },
    ],
    steps: [
      "Build a small app where each user owns private records.",
      "State the requirement in one sentence: a user reads only their own records.",
      "Sign in as user A, note how a record is requested.",
      "Request user A's record as user B and capture the response.",
      "Fix it with a server-side ownership check on every read and write.",
      "Add automated tests that fail if the check disappears.",
    ],
    publish: ["The code, sample data only", "Before-and-after requests", "The regression tests and CI run"],
    nameIdeas: ["Keyring", "Owner Check", "Two Doors", "Gatehouse", "Record Guard"],
    resumeBullet:
      "Built a two-user demo and tested 6 record endpoints for ownership checks; fixed the 2 that exposed another user's data and added 4 regression tests that fail if the weakness returns.",
  },
  {
    rank: 8,
    slug: "cloud-template-hardening",
    title: "Cloud Template Hardening",
    path: "cloud",
    difficulty: "easy",
    hours: "4 to 6 hours",
    summary: "Scan an infrastructure template, fix what it exposes and automate the check.",
    benefit: "Shows you can read infrastructure as code and stop a misconfiguration before deploy.",
    stack: ["Terraform", "Checkov", "AWS S3 and IAM", "GitHub Actions"],
    frameworks: [
      { name: "CIS AWS Benchmark", use: "Map each fix to the benchmark item it satisfies." },
      { name: "AWS shared responsibility model", use: "Explain in the README which side of the line each fix sits on." },
    ],
    steps: [
      "Write or find a small template: a bucket, a policy, logging.",
      "Read it yourself first and note anything public or overly broad.",
      "Run Checkov and save the output.",
      "Group findings: exposure, permissions, logging.",
      "Fix them in a copy and explain each change in one line.",
      "Re-run the scan, compare, and add it to CI.",
    ],
    publish: ["Original and corrected templates", "Scan output before and after", "The CI workflow file"],
    nameIdeas: ["Bedrock", "Closed Bucket", "Guardrail", "Drift Check", "Policy Sweep"],
    resumeBullet:
      "Reviewed a 120-line Terraform template with an open-source scanner; fixed 14 of 17 findings covering public storage, broad permissions and missing logging, documented 3 accepted risks and added the checks to CI.",
  },
  {
    rank: 9,
    slug: "role-based-access-lab",
    title: "Role-Based Access Lab",
    path: "iam",
    difficulty: "medium",
    hours: "5 to 8 hours",
    summary: "Design member, officer and admin roles, then test joining, changing role and leaving.",
    benefit: "Shows you understand least privilege and the lifecycle where most access problems start.",
    stack: ["Keycloak", "Docker", "Permissions matrix", "NIST SP 800-63"],
    frameworks: [
      { name: "RBAC (NIST model)", use: "Assign permissions to roles, never to people, and say so in the README." },
      { name: "Joiner, mover, leaver", use: "Test all three transitions, not just account creation." },
    ],
    steps: [
      "List every action in the demo, then decide which role may do it.",
      "Build the permissions matrix: actions down, roles across.",
      "Create a test account per role and check every cell.",
      "Add a joiner and confirm what they can reach.",
      "Promote a member to officer and check nothing extra was granted.",
      "Remove an account and prove access is gone everywhere.",
    ],
    publish: ["The permissions matrix", "Access test results per role", "The lifecycle walkthrough"],
    nameIdeas: ["Turnstile", "Badge Office", "Least Privilege Lab", "Access Ledger", "Revoke"],
    resumeBullet:
      "Designed 3 roles across 18 actions in a local demo; tested all 54 permission combinations, corrected 5 that granted more than intended and verified a leaver lost all 18.",
  },
  {
    rank: 10,
    slug: "student-org-risk-register",
    title: "Student Org Risk Register",
    path: "grc",
    difficulty: "easy",
    hours: "4 to 6 hours",
    summary: "Assess a fictional organization's platform and rank the risks with reasoning.",
    benefit: "Shows you can turn messy reality into decisions leaders can act on.",
    stack: ["NIST CSF 2.0", "Risk register", "Control mapping", "Evidence log"],
    frameworks: [
      { name: "NIST CSF 2.0", use: "Organise findings under Govern, Identify, Protect, Detect, Respond, Recover." },
      { name: "Qualitative risk rating", use: "Rate likelihood and impact on a simple scale, and justify each rating." },
    ],
    steps: [
      "Describe the fictional organization: members, data, who runs it.",
      "List 6 to 8 risks in plain language.",
      "Rate likelihood and impact, one sentence of reasoning each.",
      "Rank them and explain why the top three win.",
      "Propose a control and an owner for each.",
      "Say what evidence would prove each control works.",
    ],
    publish: ["The risk register", "Controls with named owners", "The evidence each control needs"],
    nameIdeas: ["Ledger", "Risk Desk", "Paper Shield", "Control Map", "Register One"],
    resumeBullet:
      "Assessed a fictional student organization platform and registered 8 risks rated by likelihood and impact; proposed a control and owner for each and defined the evidence for the top 3.",
  },
  {
    rank: 11,
    slug: "segmented-lab-network",
    title: "Segmented Lab Network",
    path: "network",
    difficulty: "hard",
    hours: "6 to 10 hours",
    summary: "Build two network zones, write default-deny rules and test what really gets blocked.",
    benefit: "Shows you can design a boundary and prove it holds, not just describe one.",
    stack: ["VirtualBox", "OPNsense", "nmap", "Wireshark"],
    frameworks: [
      { name: "Default deny", use: "Block everything first, then open only what the lab needs." },
      { name: "CIS Controls v8 (network)", use: "Cite the control your segmentation satisfies." },
    ],
    steps: [
      "Sketch two zones: everyday users and administrators.",
      "Write the connection policy in plain sentences.",
      "Build the hosts and apply default-deny rules.",
      "Test every rule from both sides, including what must fail.",
      "Capture traffic for one blocked attempt as evidence.",
      "Fix any rule that behaved differently than you expected.",
    ],
    publish: ["The network diagram", "The rule table with reasons", "Connection tests, pass and fail"],
    nameIdeas: ["Bulkhead", "Two Rooms", "Quiet Segment", "Deny First", "Zone Line"],
    resumeBullet:
      "Built a 5-host segmented lab with separate user and administrator zones; wrote 9 default-deny firewall rules and documented 24 connection tests, including the 11 expected to fail.",
  },
  {
    rank: 12,
    slug: "malware-report-comparison",
    title: "Malware Report Comparison",
    path: "malware",
    difficulty: "easy",
    hours: "3 to 5 hours",
    summary: "Compare two published analyses of related samples and publish a cited table.",
    benefit: "Shows careful reading and honest sourcing without touching live malware.",
    stack: ["CISA advisories", "MITRE ATT&CK", "Comparison table", "Markdown"],
    frameworks: [
      { name: "MITRE ATT&CK", use: "Map each behaviour to a technique so the two reports line up." },
      { name: "Analyst confidence language", use: "Say supported, partially supported or unconfirmed for every claim." },
    ],
    steps: [
      "Pick two published reports on related samples.",
      "Record publisher, date and link for each.",
      "Summarise behaviour: arrival, changes made, what it contacts.",
      "Build a side-by-side table of behaviours and indicators.",
      "Flag anything only one report claims.",
      "Write your reading separately from their findings, with indicators defanged.",
    ],
    publish: ["The comparison table", "Defanged indicator list", "Your interpretation, clearly marked"],
    nameIdeas: ["Petri", "Two Reports", "Sample Study", "Indicator Desk", "Paper Lab"],
    resumeBullet:
      "Compared 2 published analyses of related malware samples; tabulated 18 behaviours and 12 indicators and flagged 3 claims supported by only one report.",
  },
  {
    rank: 13,
    slug: "phishing-report-triage",
    title: "Phishing Report Triage",
    path: "soc",
    difficulty: "easy",
    hours: "3 to 5 hours",
    summary: "Work a batch of reported emails and decide which are phishing, safe or unclear.",
    benefit: "Shows header analysis and a repeatable decision process anyone can follow.",
    stack: ["Public phishing corpora", "Message header analyser", "MITRE ATT&CK", "Markdown"],
    frameworks: [
      { name: "MITRE ATT&CK T1566", use: "Classify each message by phishing sub-technique." },
      { name: "SPF, DKIM, DMARC", use: "Read the authentication results and explain what each one proves." },
    ],
    steps: [
      "Collect 8 to 10 sample messages from a public corpus.",
      "Read headers: sender, path, authentication results.",
      "Check links and attachments by name only, never by opening them.",
      "Decide phishing, safe or unclear, with one line of reasoning.",
      "Write what a user should do for each verdict.",
      "Summarise the patterns you saw across the batch.",
    ],
    publish: ["The verdict table", "Header evidence per message", "Guidance written for users"],
    nameIdeas: ["Mailroom", "Header Desk", "Bait Box", "Inbox Watch", "Return Path"],
    resumeBullet:
      "Triaged 10 reported messages using header and authentication analysis; classified 6 as phishing with cited evidence and wrote user guidance for each verdict.",
  },
  {
    rank: 14,
    slug: "detection-noise-review",
    title: "Detection Noise Review",
    path: "soc",
    difficulty: "medium",
    hours: "4 to 6 hours",
    summary: "Find the rules that cry wolf, tune one, and measure the difference.",
    benefit: "Shows you improve the system instead of only working the queue.",
    stack: ["Security Datasets", "Sigma", "Python", "Spreadsheet"],
    frameworks: [
      { name: "Alert triage metrics", use: "Track volume, true positives and time spent per rule." },
      { name: "Sigma", use: "Publish the tuned rule in a portable format." },
    ],
    steps: [
      "Count alerts per rule across the dataset.",
      "Pick the noisiest rule and sample 20 of its alerts.",
      "Work out what benign activity triggers it.",
      "Tune the logic, narrowly and on purpose.",
      "Re-run it and compare volume and catches.",
      "Write what you would lose if the tuning is wrong.",
    ],
    publish: ["Before-and-after alert counts", "The tuned rule", "The risk you accepted, stated plainly"],
    nameIdeas: ["Quiet Down", "Signal Gain", "Rule Diet", "False Alarm", "Tuning Fork"],
    resumeBullet:
      "Analysed alert volume by rule across a practice dataset; tuned the noisiest rule to cut 40 repeat false positives while keeping every true positive in the sample.",
  },
  {
    rank: 15,
    slug: "beaconing-traffic-hunt",
    title: "Beaconing Traffic Hunt",
    path: "hunting",
    difficulty: "medium",
    hours: "5 to 8 hours",
    summary: "Look for machines phoning home on a schedule inside public network logs.",
    benefit: "Shows statistical thinking about traffic, not just keyword searching.",
    stack: ["Zeek sample logs", "Python", "pandas", "MITRE ATT&CK"],
    frameworks: [
      { name: "MITRE ATT&CK T1071", use: "Frame the hunt around command-and-control over standard protocols." },
      { name: "Hypothesis-driven hunting", use: "Write the hypothesis and the disproof condition before you query." },
    ],
    steps: [
      "State the hypothesis: a host contacts one destination at regular intervals.",
      "Group connections by source and destination pair.",
      "Measure the gaps between connections and their variance.",
      "Separate software updates and telemetry from the rest.",
      "Chart the strongest candidate over time.",
      "Say what would confirm it and what data you lack.",
    ],
    publish: ["Queries and notebook", "The interval chart", "Findings with alternative explanations"],
    nameIdeas: ["Metronome", "Steady Hand", "Callback", "Pulse Check", "Long Signal"],
    resumeBullet:
      "Analysed 2 weeks of sample network logs for beaconing; measured connection intervals across 3,000 host pairs and documented 1 candidate with its alternative explanations.",
  },
  {
    rank: 16,
    slug: "sigma-rule-pack",
    title: "Sigma Rule Pack",
    path: "hunting",
    difficulty: "hard",
    hours: "6 to 10 hours",
    summary: "Write five detection rules and test each against attack and normal data.",
    benefit: "Shows detection engineering: rules with measured false positives, not guesses.",
    stack: ["Sigma", "sigma-cli", "Security Datasets", "GitHub Actions"],
    frameworks: [
      { name: "Sigma specification", use: "Use the standard fields, level and tags so others can import the rules." },
      { name: "MITRE ATT&CK", use: "Tag each rule with the technique it detects." },
    ],
    steps: [
      "Choose five techniques from one ATT&CK tactic.",
      "Write a rule for each, starting from the log fields you actually have.",
      "Run them against a recorded attack dataset.",
      "Run them again against ordinary activity and count the noise.",
      "Tighten anything that fires on normal days.",
      "Document coverage and the gaps you left on purpose.",
    ],
    publish: ["The five rules", "Test results on both datasets", "A coverage note with the gaps"],
    nameIdeas: ["Rulebook", "Five Signals", "Tripwire", "Detection Set", "Watchlist"],
    resumeBullet:
      "Authored 5 Sigma rules for one ATT&CK tactic; validated each against a recorded attack dataset and a normal-activity baseline, tightening 2 that produced noise.",
  },
  {
    rank: 17,
    slug: "ransomware-tabletop",
    title: "Ransomware Tabletop",
    path: "ir",
    difficulty: "medium",
    hours: "4 to 6 hours",
    summary: "Run a discussion exercise with injects and capture the decisions people struggle with.",
    benefit: "Shows facilitation and the judgment to spot gaps before a real incident finds them.",
    stack: ["CISA tabletop package", "NIST SP 800-61", "Slides", "Notes template"],
    frameworks: [
      { name: "CISA tabletop packages", use: "Use their inject structure and discussion questions." },
      { name: "NIST SP 800-61", use: "Score the discussion against the response phases." },
    ],
    steps: [
      "Write a scenario with three injects that escalate.",
      "Invite two or three people and set the ground rules.",
      "Run each inject and record decisions, not opinions.",
      "Note where the group hesitated or disagreed.",
      "Write the gaps as actions with owners.",
      "Send a one-page summary within a day.",
    ],
    publish: ["The scenario and injects", "The decision log", "Gaps written as owned actions"],
    nameIdeas: ["Dry Run", "Table Talk", "Cold Room", "Inject Three", "Pressure Test"],
    resumeBullet:
      "Facilitated a 3-inject ransomware tabletop with 3 participants; logged 11 decisions and turned 4 hesitation points into owned follow-up actions.",
  },
  {
    rank: 18,
    slug: "browser-artifact-review",
    title: "Browser Artifact Review",
    path: "forensics",
    difficulty: "easy",
    hours: "3 to 5 hours",
    summary: "Reconstruct a browsing session from history, downloads and cache in a practice image.",
    benefit: "Shows you can read a single artifact family carefully and say what it cannot prove.",
    stack: ["Digital Corpora image", "Autopsy", "SQLite browser", "Timeline spreadsheet"],
    frameworks: [
      { name: "NIST SP 800-86", use: "Keep the examine and analyse steps separate in your write-up." },
      { name: "Artifact corroboration", use: "Support each conclusion with at least two artifacts." },
    ],
    steps: [
      "Copy the image and record the hash.",
      "Extract history, downloads and cache entries.",
      "Rebuild the session in order, with timestamps.",
      "Check downloads against files on disk.",
      "Note where artifacts disagree.",
      "State what the evidence cannot show, such as who was typing.",
    ],
    publish: ["The session timeline", "Artifact screenshots", "Limitations, stated plainly"],
    nameIdeas: ["Breadcrumb", "Cache Light", "Session Replay", "Trace Back", "History Desk"],
    resumeBullet:
      "Reconstructed a browsing session from a practice disk image; corroborated 19 timeline events across history, downloads and cache, and documented 2 artifact conflicts.",
  },
  {
    rank: 19,
    slug: "usb-device-review",
    title: "USB Device Usage Review",
    path: "forensics",
    difficulty: "medium",
    hours: "4 to 6 hours",
    summary: "Work out which removable devices were used, when, and what that does and does not prove.",
    benefit: "Shows registry and log analysis plus the restraint not to overclaim.",
    stack: ["Practice Windows image", "Registry Explorer", "Autopsy", "Timeline spreadsheet"],
    frameworks: [
      { name: "Windows artifact references", use: "Cite the registry keys and logs you relied on." },
      { name: "Inference discipline", use: "Label every line fact or inference." },
    ],
    steps: [
      "Work from a copy and record its hash.",
      "Pull device entries from the registry and system logs.",
      "Match serial numbers to first and last connection times.",
      "Look for file activity in the same window.",
      "Build the timeline across both sources.",
      "Write clearly why connection is not the same as copying.",
    ],
    publish: ["The device table with timestamps", "The combined timeline", "A fact-versus-inference note"],
    nameIdeas: ["Plug Log", "Serial Trace", "Removable", "Port Watch", "Cold Copy"],
    resumeBullet:
      "Identified 3 removable devices from a practice Windows image; correlated connection times with file activity and separated 6 facts from 2 inferences in the report.",
  },
  {
    rank: 20,
    slug: "threat-actor-profile",
    title: "Threat Actor Profile",
    path: "intel",
    difficulty: "medium",
    hours: "5 to 8 hours",
    summary: "Build a sourced profile of one publicly documented group and what it means locally.",
    benefit: "Shows structured research and the ability to turn reporting into defender actions.",
    stack: ["MITRE ATT&CK Groups", "CISA advisories", "Vendor reporting", "Source log"],
    frameworks: [
      { name: "MITRE ATT&CK", use: "Build the technique table straight from the group's mapped behaviours." },
      { name: "Diamond Model", use: "Organise adversary, capability, infrastructure and victim." },
    ],
    steps: [
      "Pick a group with public, non-contradictory reporting.",
      "Log sources with dates, and note disagreements.",
      "Map the techniques they are reported to use.",
      "Note the sectors and regions they target.",
      "Translate three techniques into detections a small team could run.",
      "State confidence and what would change your assessment.",
    ],
    publish: ["The profile with citations", "The technique table", "Three detection ideas"],
    nameIdeas: ["Field Notes", "Profile One", "Known Quantity", "Adversary Desk", "Cold Read"],
    resumeBullet:
      "Profiled a publicly documented threat group from 9 sources; mapped 12 ATT&CK techniques and converted 3 into detection ideas for a small team.",
  },
  {
    rank: 21,
    slug: "web-recon-methodology",
    title: "Authorized Web Recon Methodology",
    path: "offensive",
    difficulty: "medium",
    hours: "4 to 6 hours",
    summary: "Write and follow a repeatable recon process against your own lab application.",
    benefit: "Shows method over tool-running, which is what separates testers from scanners.",
    stack: ["OWASP Juice Shop", "ZAP", "httpx", "Markdown"],
    frameworks: [
      { name: "OWASP Web Security Testing Guide", use: "Follow its information-gathering section as your checklist." },
      { name: "Rules of engagement", use: "State targets and limits before any tooling runs." },
    ],
    steps: [
      "Write the scope and the rules you will follow.",
      "Map the application surface by hand first.",
      "Record technologies, endpoints and entry points.",
      "Run one automated pass and compare with your manual notes.",
      "Explain where the tool missed something you found.",
      "Publish the checklist so someone else can repeat it.",
    ],
    publish: ["The methodology checklist", "Findings from both passes", "A manual-versus-tool comparison"],
    nameIdeas: ["First Pass", "Map Room", "Recon Deck", "Surface Study", "Checklist Zero"],
    resumeBullet:
      "Wrote and followed a recon methodology on a local lab application; documented 24 endpoints by hand and showed where an automated pass missed 3 of them.",
  },
  {
    rank: 22,
    slug: "api-authorization-lab",
    title: "API Authorization Lab",
    path: "offensive",
    difficulty: "hard",
    hours: "6 to 10 hours",
    summary: "Test an API you built for object and function level authorization flaws.",
    benefit: "Shows API testing skill, the area most teams are weakest in.",
    stack: ["Your own API", "Postman or curl", "OWASP API Top 10", "Docker"],
    frameworks: [
      { name: "OWASP API Security Top 10", use: "Test API1 and API5 deliberately, by name." },
      { name: "Test matrix", use: "Every endpoint by every role, recorded as pass or fail." },
    ],
    steps: [
      "Build or reuse a small API with two roles.",
      "List endpoints and the role each should allow.",
      "Call every endpoint as every role and record results.",
      "Try object identifiers belonging to the other user.",
      "Fix the failures server-side.",
      "Re-run the whole matrix and publish both runs.",
    ],
    publish: ["The endpoint and role matrix", "Both test runs", "The fixes with code links"],
    nameIdeas: ["Object Line", "Role Matrix", "Endpoint Lab", "Access Probe", "Second User"],
    resumeBullet:
      "Tested 14 API endpoints against 2 roles for object and function level authorization; fixed 3 failures server-side and re-ran all 28 checks clean.",
  },
  {
    rank: 23,
    slug: "secure-code-review-pack",
    title: "Secure Code Review Pack",
    path: "appsec",
    difficulty: "medium",
    hours: "5 to 8 hours",
    summary: "Review a small open-source project and write findings a maintainer could act on.",
    benefit: "Shows you can read unfamiliar code and communicate without blame.",
    stack: ["An open-source repository", "Semgrep", "OWASP Top 10", "Markdown"],
    frameworks: [
      { name: "OWASP Code Review Guide", use: "Follow its review order rather than reading top to bottom." },
      { name: "CWE", use: "Give each finding a CWE id so it is searchable." },
    ],
    steps: [
      "Pick a small project with a permissive licence.",
      "Map where input enters and leaves the code.",
      "Run Semgrep, then read the areas it flags by hand.",
      "Write findings with file, line and impact.",
      "Suggest a patch for the clearest one.",
      "Keep the tone useful: describe the issue, not the author.",
    ],
    publish: ["The review notes with CWE ids", "One suggested patch", "What you checked and found clean"],
    nameIdeas: ["Close Read", "Line by Line", "Patchwork", "Review Desk", "Second Pair"],
    resumeBullet:
      "Reviewed a small open-source project with static analysis and manual reading; documented 5 findings with CWE ids and proposed a patch for the highest-impact issue.",
  },
  {
    rank: 24,
    slug: "ci-security-gate",
    title: "CI Security Gate",
    path: "appsec",
    difficulty: "hard",
    hours: "4 to 6 hours",
    summary: "Add dependency, secret and static checks to a pipeline without blocking the team.",
    benefit: "Shows engineering judgment: security that developers keep instead of switching off.",
    stack: ["GitHub Actions", "Semgrep", "Gitleaks", "Dependabot"],
    frameworks: [
      { name: "OWASP DevSecOps guidance", use: "Place each check at the stage where it costs least." },
      { name: "Fail thresholds", use: "Decide what blocks a merge and what only warns, and write it down." },
    ],
    steps: [
      "Add dependency scanning to a repository you own.",
      "Add secret scanning and test it with a fake key.",
      "Add static analysis limited to changed files.",
      "Set which severities block a merge.",
      "Measure the added minutes per run.",
      "Document how to handle a false positive.",
    ],
    publish: ["The workflow file", "A run showing a blocked and an allowed case", "The false-positive process"],
    nameIdeas: ["Gatecheck", "Merge Guard", "Pipeline Watch", "Green Build", "Shift Left"],
    resumeBullet:
      "Added dependency, secret and static analysis gates to a CI pipeline; tuned severity thresholds so builds gained 40 seconds and only 2 severities block a merge.",
  },
  {
    rank: 25,
    slug: "cloud-logging-baseline",
    title: "Cloud Logging Baseline",
    path: "cloud",
    difficulty: "medium",
    hours: "4 to 6 hours",
    summary: "Define what a small cloud account must log, and prove the template delivers it.",
    benefit: "Shows you think about what happens after an incident, not only prevention.",
    stack: ["Terraform", "Checkov", "CloudTrail and S3 access logs", "Markdown"],
    frameworks: [
      { name: "CIS AWS Benchmark logging section", use: "Use its items as your required-logs list." },
      { name: "NIST CSF Detect", use: "Tie each log source to what it lets you detect." },
    ],
    steps: [
      "List what must be logged: API calls, storage access, authentication.",
      "Check the template against that list.",
      "Add the missing log sources.",
      "Decide retention and say why.",
      "Write one question per log source that it can answer.",
      "Re-scan and record the result.",
    ],
    publish: ["The required-logs list", "Template changes", "Questions each source answers"],
    nameIdeas: ["Black Box", "Flight Recorder", "Trail Head", "Log Baseline", "Keep Record"],
    resumeBullet:
      "Defined a 6-source logging baseline for a cloud template; added 3 missing sources, set retention with stated reasoning and documented the questions each source answers.",
  },
  {
    rank: 26,
    slug: "least-privilege-policy-lab",
    title: "Least-Privilege Policy Lab",
    path: "cloud",
    difficulty: "hard",
    hours: "5 to 8 hours",
    summary: "Take a wildcard cloud policy and cut it down to only what the app needs.",
    benefit: "Shows the hardest cloud skill: removing permissions without breaking anything.",
    stack: ["AWS IAM policy files", "Policy simulator", "Checkov", "Terraform"],
    frameworks: [
      { name: "Least privilege", use: "Justify every action left in the policy." },
      { name: "CIS AWS Benchmark IAM section", use: "Check the result against the benchmark items." },
    ],
    steps: [
      "Start from a policy with wildcard actions.",
      "List what the application actually calls.",
      "Rewrite the policy to those actions and resources.",
      "Simulate the calls that must still work.",
      "Simulate the calls that must now fail.",
      "Document each permission you kept and why.",
    ],
    publish: ["Before-and-after policies", "Simulation results both ways", "A justification per action"],
    nameIdeas: ["Trim", "Narrow Path", "Star Removal", "Policy Cut", "Just Enough"],
    resumeBullet:
      "Reduced a wildcard IAM policy to 9 specific actions; verified allowed calls still worked and 12 previously permitted calls now fail, with a justification per action.",
  },
  {
    rank: 27,
    slug: "joiner-mover-leaver-automation",
    title: "Joiner, Mover, Leaver Automation",
    path: "iam",
    difficulty: "hard",
    hours: "6 to 10 hours",
    summary: "Script the access changes for joining, changing role and leaving, then prove they ran.",
    benefit: "Shows automation of the process where manual work quietly leaves access behind.",
    stack: ["Python", "Keycloak admin API", "Docker", "pytest"],
    frameworks: [
      { name: "Joiner, mover, leaver", use: "One function per transition, each with its own tests." },
      { name: "Evidence by default", use: "Every run writes a log a reviewer can read." },
    ],
    steps: [
      "Model roles and permissions in a local identity service.",
      "Write the joiner script and its test.",
      "Write the mover script: add new access, remove old.",
      "Write the leaver script and verify nothing survives.",
      "Log every change with a timestamp.",
      "Run all three end to end and keep the output.",
    ],
    publish: ["The scripts and tests", "A full run log", "The permissions matrix before and after"],
    nameIdeas: ["Turnstile Auto", "Three Doors", "Lifecycle", "Offboard", "Access Robot"],
    resumeBullet:
      "Automated joiner, mover and leaver access changes against a local identity service; covered 3 transitions with 9 tests and produced a timestamped change log per run.",
  },
  {
    rank: 28,
    slug: "control-evidence-pack",
    title: "Control Evidence Pack",
    path: "grc",
    difficulty: "medium",
    hours: "4 to 6 hours",
    summary: "Pick five controls and collect the evidence that would satisfy an auditor.",
    benefit: "Shows you know the difference between a policy and proof it is followed.",
    stack: ["NIST CSF 2.0", "CIS Controls v8", "Evidence log", "Screenshots"],
    frameworks: [
      { name: "CIS Controls v8", use: "Choose five implementation group 1 controls." },
      { name: "Audit evidence", use: "For each control record what, who, when and how often." },
    ],
    steps: [
      "Choose five controls a small organization could run.",
      "Write what each control requires in one sentence.",
      "Decide what evidence proves it, and how often it is collected.",
      "Collect a sample for a fictional or your own lab environment.",
      "Note where evidence would be weak or missing.",
      "Summarise readiness honestly.",
    ],
    publish: ["The control list with requirements", "Evidence samples", "A gaps and readiness note"],
    nameIdeas: ["Proof Set", "Evidence Desk", "Audit Ready", "Five Controls", "Paper Trail Two"],
    resumeBullet:
      "Built an evidence pack for 5 CIS Controls; defined collection frequency per control and documented 2 gaps where available evidence would not satisfy a reviewer.",
  },
  {
    rank: 29,
    slug: "firewall-rule-review",
    title: "Firewall Rule Review",
    path: "network",
    difficulty: "easy",
    hours: "3 to 5 hours",
    summary: "Audit a messy rule set, find what is redundant or too broad, and rewrite it.",
    benefit: "Shows you can tidy inherited configuration safely, a common first-job task.",
    stack: ["OPNsense", "Rule export", "Spreadsheet", "nmap"],
    frameworks: [
      { name: "Default deny", use: "Judge every rule against what it opens and why." },
      { name: "Change control", use: "Record the reason and the rollback for each change." },
    ],
    steps: [
      "Export the rule set from your lab firewall.",
      "Mark each rule: needed, redundant, too broad, unknown.",
      "Trace what each questionable rule allows.",
      "Rewrite the set, narrowest first.",
      "Test the connections that must keep working.",
      "Write the rollback plan for each change.",
    ],
    publish: ["The annotated original rules", "The rewritten set", "Test results and rollback notes"],
    nameIdeas: ["Rule Sweep", "Tidy Edge", "Narrow Gate", "Clean Table", "Rollback Ready"],
    resumeBullet:
      "Audited 22 lab firewall rules; retired 7 redundant entries, narrowed 4 overly broad ones and verified 15 required connections still worked after the rewrite.",
  },
  {
    rank: 30,
    slug: "sandbox-report-summary",
    title: "Sandbox Report Summary",
    path: "malware",
    difficulty: "easy",
    hours: "2 to 4 hours",
    summary: "Turn a long public sandbox report into a one-page summary defenders can use.",
    benefit: "Shows you can read technical output and write for an audience in a hurry.",
    stack: ["Public sandbox reports", "MITRE ATT&CK", "Markdown", "Indicator table"],
    frameworks: [
      { name: "MITRE ATT&CK", use: "Group observed behaviour by tactic." },
      { name: "Defanged indicators", use: "Write addresses so nobody clicks them by accident." },
    ],
    steps: [
      "Pick a published sandbox report for a known sample.",
      "List what it changed: files, registry, services.",
      "List what it contacted, defanged.",
      "Group behaviour by ATT&CK tactic.",
      "Write three detection or blocking suggestions.",
      "Keep it to one page and cite the report.",
    ],
    publish: ["The one-page summary", "The defanged indicator table", "Three defensive suggestions"],
    nameIdeas: ["One Page", "Short Read", "Behaviour Brief", "Quick Sample", "Digest"],
    resumeBullet:
      "Condensed a public sandbox report into a one-page defender summary; grouped 14 behaviours by ATT&CK tactic and proposed 3 detection or blocking actions.",
  },
];

export const PROJECTS_BY_PATH = (path: CareerId) => LIBRARY_PROJECTS.filter((project) => project.path === path);

export function getLibraryProject(slug: string) {
  return LIBRARY_PROJECTS.find((project) => project.slug === slug);
}

/**
 * Difficulty is also the résumé signal: an easy project proves you can finish
 * something, a hard one is the piece an interviewer spends the most time on.
 */
export const DIFFICULTY: Record<ProjectDifficulty, { label: string; weight: 1 | 2 | 3; resumeValue: string; note: string }> = {
  easy: {
    label: "Easy",
    weight: 1,
    resumeValue: "Good first project",
    note: "A weekend of work. Start here if you have never published a project.",
  },
  medium: {
    label: "Medium",
    weight: 2,
    resumeValue: "Solid portfolio piece",
    note: "Two or three sessions. Enough depth to carry an interview answer.",
  },
  hard: {
    label: "Hard",
    weight: 3,
    resumeValue: "Strongest résumé piece",
    note: "The ones worth the most on a résumé: real scope, real decisions, and plenty to talk about.",
  },
};

export const DIFFICULTY_ORDER: ProjectDifficulty[] = ["easy", "medium", "hard"];

/** Résumé weight first, then the ranked order inside each level. */
export const byResumeWeight = (a: LibraryProject, b: LibraryProject) =>
  DIFFICULTY[b.difficulty].weight - DIFFICULTY[a.difficulty].weight || a.rank - b.rank;
