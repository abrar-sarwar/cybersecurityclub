---
title: Security testing in CI
objective: Learn the main kinds of automated security testing and how to wire them into a continuous integration pipeline without drowning the team in noise.
kind: lesson
estimatedMinutes: 30
prerequisites:
  - Complete "Secure code review"
  - Complete "Dependencies and the software supply chain"
completionChecks:
  - I can explain the difference between SAST, DAST, and dependency scanning.
  - I can describe where each check belongs in a pipeline.
  - I can explain how to handle false positives without ignoring real ones.
  - I can describe a sensible policy for failing a build on findings.
references:
  - title: OWASP DevSecOps Guideline
    url: https://owasp.org/www-project-devsecops-guideline/
  - title: OWASP ZAP
    url: https://www.zaproxy.org/
  - title: Gitleaks
    url: https://github.com/gitleaks/gitleaks
  - title: "NIST SP 800-218, Secure Software Development Framework (SSDF)"
    url: https://csrc.nist.gov/pubs/sp/800/218/final
status: published
lastReviewed: 2026-09-15
---

The best security check is one that runs by itself on every change, so nobody has to remember it. Continuous integration (CI), the automation that builds and tests your code whenever it changes, is the natural home for that. This lesson covers the main kinds of automated security testing, where each fits, and how to introduce them so developers see them as helpful rather than as a wall of noise.

## The main kinds of testing

**SAST, static application security testing**, reads your source code without running it and flags risky patterns: a query built by string concatenation, a use of a dangerous function, or a missing check. It runs early and fast, right on a pull request, and it can point to the exact line. Its weakness is false positives, because it cannot always tell whether a risky-looking pattern is actually reachable.

**DAST, dynamic application security testing**, tests the running application from the outside, the way an attacker would, sending requests and observing responses. It finds issues that only appear at runtime and does not care what language you used. Its weaknesses are that it needs a deployed environment to test against and it only covers the paths it manages to reach. OWASP ZAP is a well-known open-source DAST tool.

**Dependency scanning** checks your third-party components against known-vulnerability databases, as you saw in the supply chain lesson. **Secret scanning**, with tools such as Gitleaks, looks for keys and passwords accidentally committed. Some teams add **IaC scanning** for infrastructure configuration files. Together these cover code you wrote, code you run, code you imported, and the configuration around it.

> **Note:** No single scanner finds everything. The kinds are complementary: SAST reads the code, DAST pokes the app, dependency and secret scanners check what you ship. A good program uses several, lightly.

## Where each check belongs

Fast checks go early, slow checks go later. A sensible layout:

- **On every commit or pull request:** SAST, secret scanning, and dependency scanning. These are quick and give the author feedback while the change is fresh.
- **On merge to the main branch or a nightly build:** a DAST scan against a freshly deployed test environment, since it takes longer and needs somewhere to run.
- **Before release:** confirm there are no unresolved high-severity findings and that the build is reproducible from a committed lockfile.

Here is the shape of a pipeline step that runs a scan and lets its result affect the build:

```yaml
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Dependency scan
        run: npm audit --audit-level=high
      - name: Secret scan
        run: gitleaks detect --no-banner
```

## Failing the build without crying wolf

The hardest part is not running the tools; it is deciding what should stop a build. Fail on everything and developers will start ignoring the pipeline or disabling checks. Fail on nothing and the checks are decoration. Aim for a policy people trust:

- **Gate on severity and newness.** Block on new high-severity findings introduced by this change, and merely report lower-severity or pre-existing ones. Breaking the build for a problem someone else introduced last year frustrates the wrong person.
- **Use a baseline.** Record the known findings once, then only fail on things not in that baseline. This lets a team adopt a tool on a messy codebase without stopping all work, while still catching anything new.
- **Make triage easy.** Give developers a clear way to mark a false positive with a reason, reviewed by someone, rather than a blanket "ignore" that hides real issues too.

> **Careful:** A suppressed finding is a decision, not a delete. Record why it was suppressed and who approved it, so the next person understands and so a real issue is not quietly buried.

## Keep it fast and kind

Developers judge a check by how fast and how accurate it is. A scan that adds ten minutes to every pull request or cries wolf constantly will get routed around. Tune the rules, cache what you can, and start with a small set of high-confidence checks before expanding. The NIST SSDF and the OWASP DevSecOps Guideline both describe building this up gradually rather than all at once.

## Guided practice

1. Take a small project of your own with a CI setup, or sketch one on paper.
2. List which of SAST, DAST, dependency scanning, and secret scanning you would add, and at which stage each runs.
3. Add one quick check for real if you can, such as a dependency-audit step, and watch it run on a pull request.
4. Write a one-paragraph policy for what should fail the build versus what should only be reported.
5. Decide how a teammate would flag a false positive in your scheme.

## Check yourself

- **What is the core difference between SAST and DAST?** SAST reads the source code without running it; DAST tests the running application from the outside.
- **Why use a baseline when adopting a scanner?** So the build only fails on new findings, letting a team start using the tool without stopping all work on old issues.
- **Why not fail the build on every finding?** Because noise erodes trust, and developers will bypass or ignore a pipeline that blocks constantly on low-value results.
