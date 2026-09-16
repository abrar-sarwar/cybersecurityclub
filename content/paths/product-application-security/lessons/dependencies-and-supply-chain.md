---
title: Dependencies and the software supply chain
objective: Understand the risk from third-party code and learn the practices that keep dependencies safe: scanning, pinning, SBOMs, and secrets hygiene.
kind: lesson
estimatedMinutes: 30
prerequisites:
  - Complete "A tour of the OWASP Top 10"
completionChecks:
  - I can explain why most application code today comes from dependencies.
  - I can describe how dependency scanning finds known-vulnerable components.
  - I can explain what an SBOM is and why it helps.
  - I can name a way to keep secrets out of a code repository.
references:
  - title: "OWASP Top 10, A06:2021 Vulnerable and Outdated Components"
    url: https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/
  - title: OWASP Dependency-Check
    url: https://owasp.org/www-project-dependency-check/
  - title: CISA, Software Bill of Materials (SBOM)
    url: https://www.cisa.gov/sbom
  - title: OWASP Secrets Management Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
status: published
lastReviewed: 2026-09-15
---

Very little of a modern application is code your team wrote. Most of it is open-source libraries, and those libraries depend on other libraries, sometimes hundreds deep. That is a good thing; nobody should rewrite a date parser. But it means your security depends on code you did not write and may not have read. This is the software supply chain, and looking after it is a core application security job.

## Why this matters

When a widely used library has a serious flaw disclosed, every app that ships it is suddenly exposed until it updates. Attackers watch these disclosures and scan the internet for apps still running the old version. The weakness is not in your code at all, yet the risk is entirely yours. The OWASP Top 10 calls this "Vulnerable and Outdated Components," and it is common precisely because updating dependencies is easy to put off.

There is a second angle: the dependency itself may be malicious. Attackers publish packages with names close to popular ones, hoping for a typo, or they compromise a real package and push a poisoned update. So supply chain security is about both **known flaws in honest libraries** and **untrustworthy code sneaking in**.

## Know what you ship: the SBOM

You cannot protect what you cannot see. A **Software Bill of Materials (SBOM)** is a complete list of the components in your application, like an ingredients label. When a new flaw is announced, an SBOM lets you answer "are we affected?" in minutes instead of days. Two common machine-readable formats are **CycloneDX** and **SPDX**, and tools can generate an SBOM automatically from your project. Governments and large buyers increasingly ask for one; CISA has good background reading on the topic.

## Scan your dependencies

**Dependency scanning** compares the components you use against databases of known vulnerabilities and flags matches. You have probably seen the simplest form already: `npm audit` for Node projects or `pip-audit` for Python. Dedicated tools such as OWASP Dependency-Check, and platform features like automated dependency alerts and update pull requests, do the same across ecosystems and can run automatically. The output tells you which dependency is affected, how serious it is, and usually which version fixes it.

Two cautions make scanning useful rather than noisy. First, not every alert is reachable in your app, so triage matters: a flaw in a code path you never call is lower priority than one on your login page. Second, transitive dependencies (the libraries your libraries pull in) are often where the real risk hides, so make sure your scanner looks all the way down.

## Pin and lock versions

If your build can silently pull a newer version of a dependency, then your build is not reproducible and a poisoned update could slip in unnoticed. **Lockfiles**, such as `package-lock.json` or `poetry.lock`, record the exact versions and checksums used, so every build and every teammate gets the same code. Commit the lockfile, review changes to it like any other code, and update dependencies deliberately rather than by accident.

> **Tip:** Small, frequent dependency updates are safer and less painful than a giant catch-up once a year. Automated update pull requests make this routine.

## Keep secrets out of the repository

A related supply chain risk is leaked secrets. API keys, database passwords, and tokens committed into a repository, even in an old commit or a private repo, are a common way attackers get in. Two habits help. First, keep secrets out of code entirely by using environment variables or a secrets manager, and add sensitive files to `.gitignore`. Second, run **secrets scanning** in your pipeline; tools like Gitleaks look for patterns that resemble keys and fail the build if they find one.

> **Careful:** If a secret is ever committed, rotating it (issuing a new one and disabling the old) is the only real fix. Deleting the line does not help, because the value still lives in the repository's history.

## Guided practice

1. Pick a small project of your own with dependencies, or clone a sample project.
2. Run the built-in scanner for its ecosystem, such as `npm audit` or `pip-audit`, and read the report.
3. For one flagged item, find which version fixes it and whether the dependency is direct or transitive.
4. Confirm the project has a committed lockfile. If not, generate one.
5. Generate or look at an SBOM for the project if you have a tool handy, and notice how many components it lists compared with what you expected.
6. Skim your repository for anything that looks like a secret, and confirm sensitive files are ignored.

## Check yourself

- **Why is dependency risk your problem even when the bug is in someone else's code?** Because you ship that code, so its flaws are exploitable in your app until you update.
- **What is an SBOM good for?** Quickly answering whether your app contains a component that a new vulnerability affects.
- **What is the right fix for a secret that was committed?** Rotate it; removing the line does not help because it remains in history.
