import type { CareerId } from "./types";

/**
 * "A day on the job": a short, decision-based walkthrough for each path.
 *
 * Every step offers three realistic choices. None of them is a trick: one is
 * what an experienced person would usually do, the others are workable or
 * risky, and each explains why. It is practice for talking about the work,
 * not a test or a score.
 */
export type ScenarioVerdict = "strong" | "workable" | "risky";

export type ScenarioStep = {
  prompt: string;
  options: { id: string; text: string; verdict: ScenarioVerdict; outcome: string }[];
};

export type Scenario = {
  /** Short title, shown as the message subject. */
  subject: string;
  from: string;
  setup: string;
  steps: ScenarioStep[];
  /** What the student just practiced, and how to talk about it. */
  takeaway: string;
};

const step = (prompt: string, options: [string, ScenarioVerdict, string][]): ScenarioStep => ({
  prompt,
  options: options.map(([text, verdict, outcome], index) => ({ id: `o${index + 1}`, text, verdict, outcome })),
});

export const CAREER_SCENARIOS: Record<CareerId, Scenario> = {
  soc: {
    from: "Priya, SOC lead",
    subject: "4,200 alerts overnight, 10 marked critical",
    setup:
      "You start your shift and the queue is full. Ten alerts are marked critical. I need each one either closed with a reason or escalated by noon.",
    steps: [
      step("Where do you start?", [
        ["Sort the ten by what they touch: accounts, servers, then test machines", "strong", "Right. Risk comes from what an alert touches, not from the order it arrived in."],
        ["Work top to bottom in the order they arrived", "workable", "You will get through them, but a critical alert on a payroll server can sit behind noise."],
        ["Start with the rule that fired the most times", "risky", "That is usually the noisiest rule, not the most dangerous one. The real problem waits."],
      ]),
      step("One critical alert says a professor signed in from two countries an hour apart. What first?", [
        ["Open both sign-ins and check device, network and whether a VPN explains it", "strong", "Exactly. You look for the ordinary explanation before calling it an attack."],
        ["Reset the password straight away", "workable", "Safe, but you disrupt someone and still do not know what happened."],
        ["Close it: impossible travel alerts are usually false positives", "risky", "Often true, and that is how real compromises get closed. A decision needs evidence."],
      ]),
      step("The logs show a successful login from a new country, then new mailbox rules forwarding invoices. Now what?", [
        ["Escalate to incident response with the timeline and the evidence you pulled", "strong", "Yes. Forwarding rules after a strange login is a confirmed problem, and responders need your evidence."],
        ["Keep digging yourself to be completely sure", "workable", "Thoroughness is good, but while you dig, the mail keeps forwarding."],
        ["Email the user and wait for their reply", "risky", "If the account is compromised, the attacker may read that email too."],
      ]),
    ],
    takeaway:
      "You triaged by risk, tested an ordinary explanation, and escalated with evidence. That is the exact story a SOC interviewer asks you to walk through.",
  },
  hunting: {
    from: "Dre, detection engineering",
    subject: "Intel says a group is spraying passwords at universities",
    setup:
      "A published report says attackers try a handful of common passwords across many accounts. Nothing has alerted. Check whether it happened here.",
    steps: [
      step("What is your hypothesis?", [
        ["Many accounts saw a few failed logins from one source, then one succeeded", "strong", "A hypothesis you can actually test: it names the pattern and the evidence you need."],
        ["Someone is attacking us right now", "workable", "True or not, it does not tell you what to search for."],
        ["Our password policy is too weak", "risky", "That is a conclusion about controls, not a search you can run against logs."],
      ]),
      step("Your first query returns 60,000 failed logins. What now?", [
        ["Group by source address and count distinct accounts per source", "strong", "Right. Spraying looks wide and shallow: one source, many accounts, few tries each."],
        ["Look through the newest few hundred by hand", "workable", "You may spot something, but you cannot show the pattern or repeat the work."],
        ["Narrow to admin accounts only", "risky", "Spraying usually starts with ordinary accounts, so you would miss it."],
      ]),
      step("One source tried 3 passwords across 400 accounts and then signed in successfully once. What do you do with it?", [
        ["Write a detection rule and test it against normal activity too", "strong", "Yes. A rule is only useful when you know how often it fires on ordinary days."],
        ["Report the finding and move on", "workable", "The finding matters, but nothing stops it happening again quietly."],
        ["Block the address and close the hunt", "risky", "Blocking one address is quick, and the same pattern returns from the next one."],
      ]),
    ],
    takeaway:
      "You turned a report into a testable hypothesis, proved the pattern with queries, and left behind a rule that others can run. That is a hunt you can describe end to end.",
  },
  ir: {
    from: "Officer group chat",
    subject: "Our shared account is posting links nobody approved",
    setup:
      "It is 9pm before a big event. The club's shared social account is posting spam. Three officers have the password and everyone is asking what to do.",
    steps: [
      step("First move?", [
        ["Change the password and sign out all other sessions", "strong", "Yes. Containment first: stop the access, then investigate."],
        ["Delete the posts so members do not click them", "workable", "Helpful for members, but the attacker still has access and can post again."],
        ["Ask in the group chat who did it", "risky", "Costs time while posts keep going out, and blame is not containment."],
      ]),
      step("Access is cut. What do you record while it is fresh?", [
        ["A timeline: when posts started, who noticed, what you changed and when", "strong", "Exactly. The timeline is what makes the review afterwards useful."],
        ["A screenshot of the posts", "workable", "Useful evidence, but on its own it does not explain what you did or when."],
        ["Nothing yet, write it up tomorrow", "risky", "Details fade fast, and the write-up is the part everyone reads later."],
      ]),
      step("The event is in 12 hours. What do you tell the officers?", [
        ["What happened, what is safe now, and what to watch tonight", "strong", "That is the job: a plain summary people can act on, no jargon."],
        ["Wait until you understand the whole attack", "workable", "Full understanding takes days. People need direction now."],
        ["Say it is handled and move on", "risky", "If it is not fully handled, nobody knows what to watch for."],
      ]),
    ],
    takeaway:
      "You contained first, documented as you went, and communicated in plain language under time pressure. Those three habits are what incident response interviews look for.",
  },
  forensics: {
    from: "Dean's office, via the IT manager",
    subject: "Laptop returned by a departing staff member",
    setup:
      "Files may have been copied before the laptop was handed back. You have the machine and a request to find out what happened, carefully.",
    steps: [
      step("The laptop is on your desk, powered off. What first?", [
        ["Make a copy of the drive and work only from the copy", "strong", "Yes. You never examine the original, and the copy's hash proves nothing changed."],
        ["Boot it and look through the folders", "workable", "Tempting, but booting changes timestamps and weakens anything you find."],
        ["Search for files with a recent date", "risky", "You would be searching the original and trusting one timestamp on its own."],
      ]),
      step("You find a USB device connected twice last week. What next?", [
        ["Line up device times with file opens and build a timeline", "strong", "Right. One artifact suggests, a timeline across sources shows."],
        ["Report that files were copied to USB", "workable", "You cannot support that yet. Connecting a device is not copying files."],
        ["Look for deleted files only", "risky", "Deletion is one path among many, and you would miss the sequence of events."],
      ]),
      step("Two sources disagree about the time by an hour. What do you write?", [
        ["Both times, the time zone difference, and which one you trust and why", "strong", "That is forensic writing: state the conflict rather than smoothing it over."],
        ["The earlier time, since it fits the story", "risky", "Picking the convenient number is how findings fall apart under review."],
        ["Leave the times out and describe the order of events", "workable", "Order helps, but times are usually exactly what the reader needs."],
      ]),
    ],
    takeaway:
      "You protected the original evidence, built a timeline from several sources, and were honest about a conflict. That is the difference between a hunch and a finding.",
  },
  intel: {
    from: "Career center",
    subject: "Students are getting a fake internship offer",
    setup:
      "Several students received the same internship offer asking for a fee and a copy of their ID. The career center wants to know what this is and what to tell people.",
    steps: [
      step("Where do you start?", [
        ["Collect the public reports and log each source with its date", "strong", "Yes. Intelligence work starts with sources you can cite, and dates matter."],
        ["Reply to the recruiter to see what they ask for", "risky", "Never engage. It exposes you and tips off whoever is running the campaign."],
        ["Search social media and note what people say", "workable", "Useful context, but unverified posts need to be marked as claims, not facts."],
      ]),
      step("Two reports disagree about who is behind it. What do you write?", [
        ["What both say, which is better supported, and your confidence", "strong", "Exactly. Stating confidence is what separates intelligence from rumor."],
        ["The newer report, since it is more current", "workable", "Newer is not the same as better sourced."],
        ["Both, without comment, and let the reader decide", "risky", "Leaving the judgment out passes your job to someone with less information."],
      ]),
      step("What goes in the brief for the career center?", [
        ["The pattern, what to check before applying, and where to report it", "strong", "Right. A brief that changes what people do beats a list of technical details."],
        ["Every indicator you collected", "workable", "Useful as an appendix; on its own it is not usable by non-specialists."],
        ["A warning to avoid all internship emails", "risky", "Advice nobody can follow gets ignored, and real offers get missed."],
      ]),
    ],
    takeaway:
      "You worked from public evidence, weighed conflicting sources with a confidence statement, and wrote something a non-technical team could act on.",
  },
  offensive: {
    from: "Client, via your team lead",
    subject: "Two-week test of the members area",
    setup:
      "You have written permission to test one web application in a lab copy. The client wants to know what an attacker could actually reach.",
    steps: [
      step("Day one. What do you do first?", [
        ["Confirm scope in writing: which addresses, which accounts, what is off limits", "strong", "Always. Scope is what makes this legal work instead of a crime."],
        ["Start scanning the application for known vulnerabilities", "workable", "Scanning finds noise fast, and you may touch systems outside the agreement."],
        ["Try the login page with common passwords", "risky", "You could lock out real users before you even know what is in scope."],
      ]),
      step("You can open another member's record by changing a number in the address. What next?", [
        ["Record the exact steps, take evidence, and check how far it goes", "strong", "Yes. A finding is only useful if the client can reproduce it and see its reach."],
        ["Pull every record to show the impact", "risky", "Downloading real data is harm, not proof, and it usually breaks the agreement."],
        ["Note it and move to the next test", "workable", "You will report it, but without depth nobody knows how bad it is."],
      ]),
      step("The report is due. What goes at the top?", [
        ["What an attacker could do, in the client's terms, and the fix", "strong", "Right. The first page is for decisions; the technical detail follows."],
        ["The full tool output", "workable", "Evidence belongs in the report, but nobody makes a decision from raw output."],
        ["A severity score for each finding", "workable", "Scores help sorting, but they do not explain the risk or the fix."],
      ]),
    ],
    takeaway:
      "You worked inside a written scope, proved impact without causing harm, and wrote findings a client could act on. That is the whole job in three steps.",
  },
  appsec: {
    from: "Sam, backend developer",
    subject: "Can you look at this before we ship Friday?",
    setup:
      "A new feature lets members download their own receipts. It works. Sam wants a quick security opinion before release.",
    steps: [
      step("What do you look at first?", [
        ["How the server decides the file belongs to the person asking", "strong", "Yes. Most real problems here are missing ownership checks, not missing scanners."],
        ["Whether the code has any known vulnerable libraries", "workable", "Worth checking, but it does not answer whether this feature leaks receipts."],
        ["The front-end code that hides other people's receipts", "risky", "Anything the browser hides can be asked for directly. The check must be on the server."],
      ]),
      step("Changing the receipt number in the address returns someone else's receipt. How do you raise it?", [
        ["Show Sam the two requests, the data returned, and the one-line requirement", "strong", "Exactly. A reproducible example and a clear rule get fixed fast."],
        ["File a ticket titled “broken access control”", "workable", "Accurate, but the developer still has to work out what to reproduce."],
        ["Ask the team to delay the release", "risky", "You may get a delay and no fix, and the team learns nothing."],
      ]),
      step("Sam pushes a fix. What do you do before it ships?", [
        ["Re-run both requests and add a test that fails if it comes back", "strong", "Right. The test is what keeps the fix from quietly disappearing in six months."],
        ["Take Sam's word that it is fixed", "risky", "Fixes often miss one path, like a second endpoint that serves the same file."],
        ["Review the code change only", "workable", "Reading helps, but running the request is the proof."],
      ]),
    ],
    takeaway:
      "You found a real access-control flaw, reported it so it could be reproduced, and left a regression test behind. That story shows you can work with developers, not just find bugs.",
  },
  cloud: {
    from: "Automated check",
    subject: "Storage bucket set to public in the deploy request",
    setup:
      "A change request would make a storage bucket readable by anyone on the internet. It is due to deploy this afternoon.",
    steps: [
      step("First response?", [
        ["Read the template to see what the bucket holds and why it was opened", "strong", "Yes. Some buckets are genuinely public. You need the reason before you judge."],
        ["Block the change", "workable", "Sometimes correct, but a block without a reason makes security the obstacle."],
        ["Approve it: the check is often noisy", "risky", "Public storage is the classic cloud breach. This is the one to slow down for."],
      ]),
      step("It holds member photos and the author says the site could not load them. What do you propose?", [
        ["Keep it private and serve images through the app or signed links", "strong", "Right. You solved their problem without exposing the bucket."],
        ["Make it public but turn on access logging", "risky", "Logging tells you afterwards who took the photos. It does not stop them."],
        ["Public for now, fix it later", "risky", "“Later” is how these stay open for years, and nobody remembers the reason."],
      ]),
      step("The change is corrected. What stops the next one?", [
        ["Add the rule to the automated checks so the pattern fails early", "strong", "Exactly. Guardrails scale; reviewing every change by hand does not."],
        ["Write it in the team wiki", "workable", "Documentation helps the people who read it, which is rarely everyone."],
        ["Ask to review all storage changes yourself", "risky", "You become the bottleneck, and the first busy week is when one slips through."],
      ]),
    ],
    takeaway:
      "You checked the intent, offered a workable alternative, and turned one fix into a guardrail. That is what cloud security work actually looks like day to day.",
  },
  iam: {
    from: "Club president",
    subject: "New officers start Monday, old ones still have access",
    setup:
      "Eight officers are rotating out and six are rotating in. Everyone currently has access to everything, including the alumni mailing list.",
    steps: [
      step("Where do you start?", [
        ["List what exists and who needs it, by role rather than by person", "strong", "Yes. Roles survive the next rotation; a list of names does not."],
        ["Remove the outgoing officers' accounts today", "workable", "Good instinct, but without a role map you will remove the wrong access somewhere."],
        ["Give the new officers the same access as the old ones", "risky", "That copies whatever excess access had built up, and it grows each year."],
      ]),
      step("The treasurer needs the finance folder only during the budget cycle. What do you set up?", [
        ["Access granted for the cycle, with a date to review it", "strong", "Right. Time-bound access is how you avoid permanent rights nobody remembers granting."],
        ["Permanent access, since they will need it again next year", "risky", "Next year they may not be treasurer. That is how old access piles up."],
        ["Share the password when needed", "risky", "Shared passwords make it impossible to tell who did what."],
      ]),
      step("How do you prove the change worked?", [
        ["Sign in as a test account for each role and record what it can reach", "strong", "Exactly. Tested access beats a spreadsheet that says it should be fine."],
        ["Show the permissions matrix you wrote", "workable", "The matrix is the plan. Testing is the evidence."],
        ["Ask each officer to confirm", "workable", "Helpful, but people rarely notice access they are not using."],
      ]),
    ],
    takeaway:
      "You designed access around roles, made it time-bound, and tested it. Joiner, mover and leaver work is most of an IAM job, and this is the short version of it.",
  },
  grc: {
    from: "Faculty advisor",
    subject: "Is the club's member platform a problem for us?",
    setup:
      "The advisor wants a short, honest assessment of the risks around the club's platform before the department signs off on it.",
    steps: [
      step("How do you start?", [
        ["Ask what the platform stores, who runs it, and what would hurt most if it leaked", "strong", "Yes. Risk starts with what matters, not with a control checklist."],
        ["Send a security questionnaire to the officers", "workable", "Questionnaires collect answers; they rarely surface what actually worries people."],
        ["Compare the platform against a framework", "workable", "Frameworks organize the work, but without context every gap looks equally urgent."],
      ]),
      step("You find eight risks. The advisor has time for three. How do you choose?", [
        ["Rank by likelihood and impact, and say why the top three win", "strong", "Right. The reasoning is what lets someone else agree or push back."],
        ["Pick the three cheapest to fix", "workable", "Quick wins are real, but the expensive one may be the one that matters."],
        ["Present all eight, since they all matter", "risky", "A list of eight equal risks means the advisor decides at random."],
      ]),
      step("For the top risk, a shared officer password, what do you propose?", [
        ["A control, an owner, and the evidence that would show it works", "strong", "Exactly. Without an owner and evidence, a control is a good intention."],
        ["A policy stating passwords must not be shared", "workable", "Policy is a start, and on its own it changes very little."],
        ["A tool purchase", "risky", "Tools without an owner or a process become shelfware, and the risk stays."],
      ]),
    ],
    takeaway:
      "You framed risk around what matters, prioritized with stated reasoning, and proposed controls someone owns and can prove. That is a GRC conversation in miniature.",
  },
  network: {
    from: "IT volunteer",
    subject: "Club lab: one flat network, everything can reach everything",
    setup:
      "The club's practice lab has a few machines, a vulnerable web app and an admin laptop, all on the same network. You have been asked to make it safer without breaking practice.",
    steps: [
      step("What is the first change?", [
        ["Separate the vulnerable practice machines from the admin laptop", "strong", "Yes. Segmentation limits what a compromised practice box can reach."],
        ["Put antivirus on every machine", "workable", "Helpful in general, and it does nothing about everything reaching everything."],
        ["Give each machine a strong password", "workable", "Good hygiene, but it does not stop movement between machines."],
      ]),
      step("How do you decide which connections to allow?", [
        ["Block everything, then allow the connections practice actually needs", "strong", "Default deny. Start closed and open on purpose, with a reason for each rule."],
        ["Allow everything, then block what looks dangerous", "risky", "You will never finish the list, and the gaps are invisible."],
        ["Copy the rules from a tutorial", "workable", "Useful as a starting point, and it rarely matches your lab."],
      ]),
      step("Rules are in. How do you know they work?", [
        ["Test from both sides, including the connections that should fail", "strong", "Exactly. A rule you have not tested from the blocked side is a guess."],
        ["Check the firewall shows the rules", "workable", "The rule existing is not the same as the rule working."],
        ["Run a scan from the admin laptop", "workable", "Good partial test; it only proves the direction you tested."],
      ]),
    ],
    takeaway:
      "You separated what matters, worked default-deny, and tested the blocked paths as well as the allowed ones. That is a network story with evidence behind it.",
  },
  malware: {
    from: "Helpdesk",
    subject: "Two reports about the same suspicious attachment",
    setup:
      "Two published analyses describe attachments from the same campaign. The helpdesk wants to know what to watch for on campus machines.",
    steps: [
      step("How do you compare them?", [
        ["Build a table of behavior and indicators from each report, with sources", "strong", "Yes. Side by side, differences and gaps become obvious."],
        ["Read both and summarize in your own words", "workable", "Fine for a quick read; hard for anyone else to check your work."],
        ["Use the newer one, since it is more current", "risky", "The older report may cover the version you actually have."],
      ]),
      step("One report says the file contacts a domain; the other does not mention it. What do you conclude?", [
        ["Note the difference and mark it as unconfirmed by the second source", "strong", "Right. Absence in one report is not disagreement, and saying so is the honest read."],
        ["Assume both versions contact the domain", "risky", "You would be publishing a claim no source actually makes."],
        ["Leave the domain out", "workable", "You lose a useful indicator that one source does support."],
      ]),
      step("What do you hand the helpdesk?", [
        ["The shared behaviors, the indicators written so they cannot be clicked, and what is uncertain", "strong", "Exactly. Defanged indicators plus honest uncertainty is a usable, safe handover."],
        ["A link to both reports", "workable", "It is sourced, and it leaves the reading and judgment to them."],
        ["A copy of the sample so they can test it", "risky", "Never pass live malware around. Reports and indicators are enough here."],
      ]),
    ],
    takeaway:
      "You compared sources instead of trusting one, separated their findings from your reading, and handed over something safe to act on.",
  },
};
