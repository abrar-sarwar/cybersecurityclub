---
title: A tour of the OWASP Top 10
objective: Summarize the OWASP Top 10 categories in plain language so you can use them as a shared checklist when reviewing an application.
kind: lesson
estimatedMinutes: 30
prerequisites:
  - Complete "How a web request works"
completionChecks:
  - I can explain what the OWASP Top 10 is and what it is for.
  - I can describe several of the categories in my own words.
  - I can say which edition is current and where to confirm the latest one.
  - I can pick a likely category for a described weakness.
references:
  - title: OWASP Top 10
    url: https://owasp.org/www-project-top-ten/
  - title: "OWASP Top 10, A03:2021 Injection"
    url: https://owasp.org/Top10/A03_2021-Injection/
  - title: OWASP Proactive Controls
    url: https://owasp.org/www-project-proactive-controls/
status: published
lastReviewed: 2026-09-15
---

The OWASP Top 10 is the most widely used starting list in application security. It is a community project from the Open Worldwide Application Security Project that groups the most common and serious web application weaknesses into ten categories. It is not a standard you get certified against and it is not exhaustive, but it gives teams a shared vocabulary. When someone says "that looks like broken access control," everyone knows roughly what they mean. This lesson tours the categories so the rest of the path has a common map.

> **Note:** The current published edition is the 2021 list. OWASP updates it every few years, so check owasp.org for the latest edition before you quote it in a report or a talk.

## What the list is for

Think of the Top 10 as a prompt list, not a scorecard. Early in a review you can walk down the categories and ask "could this app have that problem?" It helps you avoid tunnel vision, and it helps you explain risk to people who do not live in security every day. It pairs well with the OWASP Proactive Controls, which describe the defenses that prevent these same problems.

## The 2021 categories in plain language

- **A01 Broken Access Control.** Users can reach data or actions that should be off limits, such as viewing another person's order by changing an id. This moved to the top because it is so common. You will practice it later in the path.
- **A02 Cryptographic Failures.** Sensitive data is not protected well, for example passwords stored without proper hashing, secrets in plain text, or missing encryption in transit.
- **A03 Injection.** Untrusted input is mixed into a command or query so the input changes its meaning. SQL injection and cross-site scripting both live here.
- **A04 Insecure Design.** The problem is in the plan, not the code. A feature was designed without thinking through abuse, so no amount of clean coding fixes it. Threat modeling helps here.
- **A05 Security Misconfiguration.** Default passwords, verbose error pages, open cloud buckets, or unnecessary features left on. Secure defaults matter.
- **A06 Vulnerable and Outdated Components.** The app depends on libraries with known flaws that were never updated. This is a supply chain topic you will study in detail.
- **A07 Identification and Authentication Failures.** Weak login and session handling, such as allowing weak passwords, poor session management, or session fixation.
- **A08 Software and Data Integrity Failures.** Code or data is trusted without verifying where it came from, including insecure deserialization and unverified updates in a build pipeline.
- **A09 Security Logging and Monitoring Failures.** When something goes wrong, no one can tell, because the app does not log the right events or no one watches the logs.
- **A10 Server-Side Request Forgery (SSRF).** The server can be tricked into making requests to addresses the attacker chooses, which can reach internal systems that were not meant to be exposed.

## How to actually use it

The categories overlap on purpose, so do not agonize over which bucket a finding belongs in. Use the list in three ways. First, as a review checklist to make sure you looked broadly. Second, as a teaching aid when you explain a risk to a developer or a manager. Third, as an index into deeper resources: each category on the OWASP site links to prevention guidance and real examples.

> **Careful:** The Top 10 is a floor, not a ceiling. An app can pass a quick Top 10 walk-through and still have serious problems that need a deeper standard such as the OWASP Application Security Verification Standard. Treat the list as where you start, not where you stop.

## Guided practice

1. Open the OWASP Top 10 page and skim the 2021 list in full.
2. Pick three categories that are new to you and read each one-page summary.
3. For each, write one sentence in your own words describing the weakness and one sentence on how you would prevent it.
4. Think of an app you use often. For three categories, note where that app might be exposed. You are practicing the reviewer's habit of asking "could this happen here?"
5. Bookmark the page and confirm which edition is current today.

## Check yourself

- **Is the OWASP Top 10 a complete list of every web weakness?** No. It is the most common and impactful categories, meant as a shared starting point, not full coverage.
- **Which edition should you cite?** The current published edition, which is the 2021 list at the time of writing; always confirm on owasp.org because it is updated periodically.
- **Where would "a user changes an id in the URL and sees someone else's data" fit?** Broken Access Control (A01).
