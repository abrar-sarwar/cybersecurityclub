/** Guidance shown with every starter project for turning finished work into a portfolio piece. */
export const PORTFOLIO_GUIDE = {
  heading: "Turn your project into a portfolio piece",
  intro: [
    "A project becomes easier to evaluate when someone can understand what you did, inspect the evidence, and follow your reasoning.",
    "Create a short report, GitHub README, or portfolio page. A clear two-to-four-page report is a useful starting point, not a strict requirement.",
  ],
  sections: [
    { label: "Goal", prompt: "What question or problem did you investigate?" },
    { label: "Environment", prompt: "What tools, practice data, or systems did you use?" },
    { label: "Your work", prompt: "What did you personally do, and why?" },
    { label: "Evidence", prompt: "Include useful screenshots, queries, code, or test results." },
    { label: "Findings", prompt: "What did you discover? What remains uncertain?" },
    { label: "Fix or recommendation", prompt: "What should change, and did you test it?" },
    { label: "Sources and limitations", prompt: "Credit datasets and guides. Clearly identify simulated work." },
  ],
  publishing: [
    "Use sample or redacted information in the public version.",
    "Publish the report somewhere accessible without requesting permission, and check the link before putting it on a résumé.",
  ],
  numbers: "Count as you work, and put the figures in the report: records searched, findings confirmed, tests added, checks failing before and after. A reviewer can check every one of them against your evidence, which is exactly why they are worth including. Leave out business impact you cannot show.",
  value: [
    "Your résumé gives a short description of the project. The linked report lets a reviewer inspect your work and gives you concrete evidence and decisions to discuss during an interview.",
    "Not every recruiter will open it, but it makes your work available for review.",
  ],
  naming: {
    heading: "Name it, then show your tools",
    body: "A résumé line works best in three parts: your project’s own name, the tools and frameworks you used, and a link to the work. “Role-Based Access Lab” reads like a class exercise. A name plus a tool list tells a reviewer what you can actually work with, and every tool, dataset or framework you list honestly is another thing an interviewer can ask you about.",
    format: "Project name | tools, datasets and frameworks | link",
    link: "Hyperlink the last part to the published work, so “GitHub” or “Project Report” opens your repository or report. Check the link before you send the résumé.",
    examples: [
      { weak: "Role-Based Access Lab", strong: "Turnstile | Keycloak, RBAC design, NIST SP 800-63, Docker | GitHub" },
      { weak: "Login Hunt", strong: "Beacon | Python, pandas, Sigma, MITRE ATT&CK | GitHub" },
      { weak: "Cloud Project", strong: "Bedrock | Terraform, Checkov, AWS IAM, CIS Benchmarks | GitHub" },
    ],
  },
  example: {
    name: "Beacon",
    stack: ["Python", "pandas", "Sigma", "MITRE ATT&CK", "LANL authentication dataset"],
    linkLabel: "GitHub",
    bullet:
      "Investigated a public authentication-log dataset for repeated failed logins followed by successful access; documented search queries, supporting evidence, and limitations in a reproducible hunt report.",
  },
} as const;

/** Plain Markdown so it pastes cleanly into a GitHub README, a document, or a portfolio page. */
export const WRITE_UP_TEMPLATE = `# Project title

> Practice project. Describe the simulated scenario, practice data, or lab used.

## Goal
What question or problem did you investigate?

## Environment
What tools, practice data, or systems did you use? Link datasets and guides.

## My work
What did you personally do, and why?

## Evidence
Screenshots, queries, code, or test results. Use sample or redacted information only.

## Findings
What did you discover?
The numbers behind it (records searched, findings confirmed, tests added).
What remains uncertain?

## Fix or recommendation
What should change, and did you test it?

## Sources and limitations
- Datasets and guides used:
- What was simulated:
- Limitations:
`;
