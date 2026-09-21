import type { CareerId } from "./types";

/** How the work moves, start to finish. Drawn as connected nodes on each path page. */
export const CAREER_FLOWS: Record<CareerId, { label: string; note: string }[]> = {
  soc: [
    { label: "Alert", note: "A rule fires on something that looks off" },
    { label: "Triage", note: "Decide what it is and how urgent" },
    { label: "Evidence", note: "Pull the logs around it" },
    { label: "Decision", note: "Malicious, benign, or needs more" },
    { label: "Escalate", note: "Hand confirmed problems to responders" },
  ],
  hunting: [
    { label: "Hypothesis", note: "A testable idea about attacker behavior" },
    { label: "Query", note: "Search the logs that would show it" },
    { label: "Compare", note: "Rule out ordinary explanations" },
    { label: "Findings", note: "State what the evidence supports" },
    { label: "Rule", note: "Turn it into an alert that lasts" },
  ],
  ir: [
    { label: "Identify", note: "Confirm this is really an incident" },
    { label: "Contain", note: "Cut the attacker's access" },
    { label: "Eradicate", note: "Remove the cause, not the symptom" },
    { label: "Recover", note: "Return systems to safe use" },
    { label: "Review", note: "Write down what to change" },
  ],
  forensics: [
    { label: "Preserve", note: "Copy the evidence, never the original" },
    { label: "Extract", note: "Pull artifacts and timestamps" },
    { label: "Timeline", note: "Order events across sources" },
    { label: "Interpret", note: "Separate fact from inference" },
    { label: "Report", note: "Explain it so others can check" },
  ],
  intel: [
    { label: "Collect", note: "Gather public reporting with dates" },
    { label: "Verify", note: "Compare sources against each other" },
    { label: "Assess", note: "State confidence in each conclusion" },
    { label: "Brief", note: "Write what defenders should do" },
    { label: "Share", note: "Hand behavior to hunters and SOC" },
  ],
  offensive: [
    { label: "Scope", note: "Written permission and limits" },
    { label: "Map", note: "Find where the system can be attacked" },
    { label: "Test", note: "Try a small number of weaknesses" },
    { label: "Prove", note: "Show impact without causing harm" },
    { label: "Report", note: "Reproducible steps and fixes" },
  ],
  appsec: [
    { label: "Design", note: "Ask how a feature could be misused" },
    { label: "Review", note: "Read the code and the checks" },
    { label: "Test", note: "Try the abuse case for real" },
    { label: "Fix", note: "Correct it on the server side" },
    { label: "Regress", note: "Add a test so it stays fixed" },
  ],
  cloud: [
    { label: "Template", note: "Read the infrastructure as code" },
    { label: "Scan", note: "Check it against security rules" },
    { label: "Harden", note: "Close exposure and trim permissions" },
    { label: "Verify", note: "Re-run the checks and compare" },
    { label: "Guardrail", note: "Block the same mistake next time" },
  ],
  iam: [
    { label: "Roles", note: "Decide what each role may do" },
    { label: "Grant", note: "Give new people only that" },
    { label: "Change", note: "Adjust access when roles change" },
    { label: "Review", note: "Check who still needs what" },
    { label: "Remove", note: "Close access the day someone leaves" },
  ],
  grc: [
    { label: "Identify", note: "Find what could go wrong" },
    { label: "Rate", note: "Judge likelihood and impact" },
    { label: "Control", note: "Propose something that reduces it" },
    { label: "Owner", note: "Name who is responsible" },
    { label: "Evidence", note: "Show the control is working" },
  ],
  network: [
    { label: "Zones", note: "Separate users, servers, admins" },
    { label: "Policy", note: "Write the connections allowed" },
    { label: "Rules", note: "Block everything else by default" },
    { label: "Test", note: "Check both allowed and blocked paths" },
    { label: "Monitor", note: "Watch traffic for surprises" },
  ],
  malware: [
    { label: "Sample", note: "A report or an isolated sandbox run" },
    { label: "Behavior", note: "What it changes and contacts" },
    { label: "Indicators", note: "Hashes, domains, file paths" },
    { label: "Compare", note: "Line it up against related samples" },
    { label: "Share", note: "Hand detections to the defenders" },
  ],
};
