import type { Question } from "./types";

/**
 * The twenty-question interest questionnaire. It measures what kind of work
 * sounds interesting, not qualifications, so no question asks about
 * certifications, coding ability, grades, or experience.
 *
 * Each option maps to exactly one career path. Scores are normalized by how
 * many options map to each path (see src/lib/careers/scoring.ts), so the
 * uneven counts across paths do not favour any of them.
 */
export const QUESTIONS: readonly Question[] = [
  {
    id: "q1",
    prompt: "Your club gives you a practice website to work on. What would you want to do?",
    options: [
      { id: "q1-a", text: "Watch for suspicious activity and figure out which warnings need attention.", path: "soc" },
      { id: "q1-b", text: "Try to break into it, with permission, and explain how you got in.", path: "offensive" },
      { id: "q1-c", text: "Work with its developers to make the features harder to abuse.", path: "appsec" },
      { id: "q1-d", text: "Research the attackers most likely to target a website like this.", path: "intel" },
    ],
  },
  {
    id: "q2",
    prompt: "You’re helping launch a new student platform. Which responsibility interests you most?",
    options: [
      { id: "q2-a", text: "Plan how the team would contain an attack and restore service.", path: "ir" },
      { id: "q2-b", text: "Secure the online servers and storage that run the platform.", path: "cloud" },
      { id: "q2-c", text: "Decide how members, officers, and administrators sign in and get access.", path: "iam" },
      { id: "q2-d", text: "Identify the biggest risks and agree on security requirements.", path: "grc" },
    ],
  },
  {
    id: "q3",
    prompt: "Which puzzle would you most enjoy solving?",
    options: [
      { id: "q3-a", text: "Reconstruct what happened on a computer using files and timestamps.", path: "forensics" },
      { id: "q3-b", text: "Find signs of an intruder that existing security alerts missed.", path: "hunting" },
      { id: "q3-c", text: "Figure out how suspicious traffic moved between connected devices.", path: "network" },
      { id: "q3-d", text: "Take apart a suspicious program to understand what it does.", path: "malware" },
    ],
  },
  {
    id: "q4",
    prompt: "A company discovers that someone accessed customer accounts. Which task would you choose?",
    options: [
      { id: "q4-a", text: "Find and fix the weakness in the application’s account features.", path: "appsec" },
      { id: "q4-b", text: "Stop the ongoing intrusion and coordinate the recovery.", path: "ir" },
      { id: "q4-c", text: "Examine the affected systems and reconstruct what the intruder did.", path: "forensics" },
      { id: "q4-d", text: "Review account permissions and remove inappropriate access.", path: "iam" },
    ],
  },
  {
    id: "q5",
    prompt: "Which guided workshop would you sign up for first?",
    options: [
      { id: "q5-a", text: "Break into a deliberately vulnerable practice system.", path: "offensive" },
      { id: "q5-b", text: "Build a secure environment in AWS or Azure.", path: "cloud" },
      { id: "q5-c", text: "Create a rule that catches suspicious behavior automatically.", path: "hunting" },
      { id: "q5-d", text: "Investigate a malicious file inside an isolated practice environment.", path: "malware" },
    ],
  },
  {
    id: "q6",
    prompt: "Which contribution would feel most satisfying?",
    options: [
      { id: "q6-a", text: "Give the team an accurate briefing on an emerging threat.", path: "intel" },
      { id: "q6-b", text: "Help an organization decide which security risks to address first.", path: "grc" },
      { id: "q6-c", text: "Spot a real attack among a queue of security warnings.", path: "soc" },
      { id: "q6-d", text: "Make it harder for an attacker to move between devices.", path: "network" },
    ],
  },
  {
    id: "q7",
    prompt: "Which kind of recurring work sounds most appealing?",
    options: [
      { id: "q7-a", text: "Investigate incoming alerts and decide what needs escalation.", path: "soc" },
      { id: "q7-b", text: "Practice response procedures and take action when an incident happens.", path: "ir" },
      { id: "q7-c", text: "Develop theories about hidden attacks and test them against activity records.", path: "hunting" },
      { id: "q7-d", text: "Review changes to cloud systems and fix insecure configurations.", path: "cloud" },
    ],
  },
  {
    id: "q8",
    prompt: "You’re reviewing a new app before release. What would you focus on?",
    options: [
      { id: "q8-a", text: "See whether several small weaknesses can combine into a successful attack.", path: "offensive" },
      { id: "q8-b", text: "Examine how its features could be misused and improve their design.", path: "appsec" },
      { id: "q8-c", text: "Check which systems it connects to and which connections should be allowed.", path: "network" },
      { id: "q8-d", text: "Check whether it meets agreed security requirements and document remaining risks.", path: "grc" },
    ],
  },
  {
    id: "q9",
    prompt: "Which question would make you want to investigate further?",
    options: [
      { id: "q9-a", text: "“What exactly happened on this laptop yesterday?”", path: "forensics" },
      { id: "q9-b", text: "“Which attack campaigns are targeting organizations like ours?”", path: "intel" },
      { id: "q9-c", text: "“Why does this account have access to information it doesn’t need?”", path: "iam" },
      { id: "q9-d", text: "“What is this unfamiliar program doing behind the scenes?”", path: "malware" },
    ],
  },
  {
    id: "q10",
    prompt: "Which project would you most want to show on your portfolio?",
    options: [
      { id: "q10-a", text: "A cloud environment with secure storage, monitoring, and configuration checks.", path: "cloud" },
      { id: "q10-b", text: "An evidence-backed timeline of a simulated computer intrusion.", path: "forensics" },
      { id: "q10-c", text: "A report showing how you breached a practice system and how to fix it.", path: "offensive" },
      { id: "q10-d", text: "A research brief connecting public reports about an attack campaign.", path: "intel" },
    ],
  },
  {
    id: "q11",
    prompt: "Which improvement would you most enjoy making?",
    options: [
      { id: "q11-a", text: "Automatically remove unnecessary access when someone changes roles or leaves.", path: "iam" },
      { id: "q11-b", text: "Improve a detection rule so it catches attacks with fewer false alarms.", path: "hunting" },
      { id: "q11-c", text: "Add security checks that help developers catch problems before release.", path: "appsec" },
      { id: "q11-d", text: "Improve the process analysts use to investigate and prioritize alerts.", path: "soc" },
    ],
  },
  {
    id: "q12",
    prompt: "Which demanding part of the work would you be most willing to stick with?",
    options: [
      { id: "q12-a", text: "Follow up with teams and collect evidence that security requirements are being met.", path: "grc" },
      { id: "q12-b", text: "Spend hours understanding a small piece of unfamiliar program behavior.", path: "malware" },
      { id: "q12-c", text: "Make time-sensitive decisions while the facts are still incomplete.", path: "ir" },
      { id: "q12-d", text: "Troubleshoot a connection problem without weakening security controls.", path: "network" },
    ],
  },
  {
    id: "q13",
    prompt: "A practice system is behaving strangely. What would you want to examine?",
    options: [
      { id: "q13-a", text: "A suspicious program’s instructions and behavior.", path: "malware" },
      { id: "q13-b", text: "The security alerts, to determine whether the behavior is dangerous.", path: "soc" },
      { id: "q13-c", text: "The cloud settings, to find exposed services or insecure changes.", path: "cloud" },
      { id: "q13-d", text: "The application’s code and feature logic, to find the underlying weakness.", path: "appsec" },
    ],
  },
  {
    id: "q14",
    prompt: "Which task involving incomplete information sounds most interesting?",
    options: [
      { id: "q14-a", text: "Search activity records for a pattern that could reveal a hidden attacker.", path: "hunting" },
      { id: "q14-b", text: "Compare conflicting threat reports and explain what the evidence supports.", path: "intel" },
      { id: "q14-c", text: "Help a team weigh uncertain security risks against its operational needs.", path: "grc" },
      { id: "q14-d", text: "Reconstruct an event from scattered files, logs, and timestamps.", path: "forensics" },
    ],
  },
  {
    id: "q15",
    prompt: "Which responsibility would you most want during a club security exercise?",
    options: [
      { id: "q15-a", text: "Configure network boundaries so an attack cannot easily spread.", path: "network" },
      { id: "q15-b", text: "Make sure each account has only the access it needs.", path: "iam" },
      { id: "q15-c", text: "Play the authorized attacker and test whether the defenses hold up.", path: "offensive" },
      { id: "q15-d", text: "Lead the effort to contain the attack and bring systems back safely.", path: "ir" },
    ],
  },
  {
    // A hypothetical scenario for the questionnaire only; this website has no member portal.
    id: "q16",
    prompt: "You’re helping build the cybersecurity club’s member portal. Which task would you pick?",
    options: [
      { id: "q16-a", text: "Test whether someone could bypass its security, with permission.", path: "offensive" },
      { id: "q16-b", text: "Make sure members cannot view or change someone else’s private information.", path: "appsec" },
      { id: "q16-c", text: "Secure the servers, storage, and backups that keep it running.", path: "cloud" },
      { id: "q16-d", text: "Set up the right permissions for members, officers, and administrators.", path: "iam" },
    ],
  },
  {
    id: "q17",
    prompt: "A suspicious login appears in a practice environment. What interests you most?",
    options: [
      { id: "q17-a", text: "Review the alert and decide whether it needs further investigation.", path: "soc" },
      { id: "q17-b", text: "Search for similar behavior elsewhere, including activity that triggered no alerts.", path: "hunting" },
      { id: "q17-c", text: "Contain the suspected compromise and help restore safe access.", path: "ir" },
      { id: "q17-d", text: "Reconstruct what the account did using the available evidence.", path: "forensics" },
    ],
  },
  {
    id: "q18",
    prompt: "Students report a fake internship offer spreading online. What would you want to investigate?",
    options: [
      { id: "q18-a", text: "Compare public reports, accounts, and websites to understand the campaign.", path: "intel" },
      { id: "q18-b", text: "Identify weaknesses in how the organization verifies and shares opportunities.", path: "grc" },
      { id: "q18-c", text: "Understand what a suspicious attachment does using a provided analysis report.", path: "malware" },
      { id: "q18-d", text: "Check whether campus devices connected to the fake offer’s website.", path: "network" },
    ],
  },
  {
    id: "q19",
    prompt: "Which improvement would you most enjoy demonstrating?",
    options: [
      { id: "q19-a", text: "A broken application security check that now correctly protects users.", path: "appsec" },
      { id: "q19-b", text: "An insecure cloud configuration that now passes your security checks.", path: "cloud" },
      { id: "q19-c", text: "An account with excessive permissions that now has only necessary access.", path: "iam" },
      { id: "q19-d", text: "An unclear security process that now has owners, requirements, and evidence.", path: "grc" },
    ],
  },
  {
    id: "q20",
    prompt: "At the end of a security exercise, which accomplishment would make you proudest?",
    options: [
      { id: "q20-a", text: "I correctly identified which alerts represented real problems.", path: "soc" },
      { id: "q20-b", text: "I discovered suspicious behavior our existing alerts had missed.", path: "hunting" },
      { id: "q20-c", text: "I helped contain the incident and documented how to recover.", path: "ir" },
      { id: "q20-d", text: "I demonstrated an attack path and explained how to close it.", path: "offensive" },
    ],
  },
];
