---
title: Writing a security finding
objective: Write a clear, actionable security finding that a developer can understand, reproduce, and fix.
kind: exercise
estimatedMinutes: 35
prerequisites:
  - Complete "Broken access control"
  - Complete "Secure code review"
completionChecks:
  - I can list the parts of a good security finding.
  - I can write reproduction steps someone else can follow.
  - I can explain impact in terms a non-specialist understands.
  - I can give a concrete, actionable remediation.
references:
  - title: OWASP Risk Rating Methodology
    url: https://owasp.org/www-community/OWASP_Risk_Rating_Methodology
  - title: "FIRST, Common Vulnerability Scoring System (CVSS)"
    url: https://www.first.org/cvss/
  - title: OWASP Web Security Testing Guide
    url: https://owasp.org/www-project-web-security-testing-guide/
status: published
lastReviewed: 2026-09-15
---

Finding a vulnerability is only half the job. If you cannot explain it clearly, it will not get fixed. A good security finding is a small piece of technical writing aimed at a busy developer: it tells them exactly what is wrong, how to see it for themselves, why it matters, and what to do. In this exercise you will write one up from scratch using the IDOR you fixed earlier in the path.

## What a finding contains

A useful finding has these parts, and it is worth using the same structure every time so nothing is forgotten:

- **Title.** A short, specific summary, such as "Any logged-in user can read other users' orders."
- **Severity.** A rating of how serious it is. Teams often use a simple High/Medium/Low, sometimes backed by a method like the OWASP Risk Rating Methodology or a CVSS score. Base it on impact and likelihood, not on how clever the bug is.
- **Affected component.** Where it lives: the endpoint, file, or feature.
- **Description.** What the flaw is, in plain language.
- **Steps to reproduce.** A numbered recipe anyone can follow to see it.
- **Impact.** What an attacker gains and who is affected, in business terms.
- **Remediation.** A concrete fix, not just "make it secure."
- **References.** Links to relevant guidance so the developer can learn more.

> **Tip:** Write for the person who has to fix it, not to show off. The best compliment a finding can get is a developer saying "oh, I see exactly what you mean" and fixing it without a meeting.

## Guided practice

You will document the earlier IDOR: an `/api/orders/:id` endpoint that returns any order without checking ownership. Write each section in a document.

1. **Draft the title.** Make it specific about who can do what. Avoid vague titles like "access control issue."
2. **Rate the severity.** This exposes other users' private order data to any logged-in user with no special skill. Decide High, Medium, or Low and write one sentence justifying it in terms of impact and how easy it is to exploit.
3. **Name the affected component.** Give the method and path, for example `GET /api/orders/:id`, and the file if you know it.
4. **Write the description.** In two or three sentences, explain that the endpoint looks up an order by id but never checks that the requesting user owns it.
5. **Write reproduction steps.** Make them concrete and copyable, for example:

   ```text
   1. Log in as user A.
   2. Note that your own order is /api/orders/1.
   3. Request /api/orders/2, which belongs to user B.
   4. Observe that user B's order details are returned.
   ```

6. **Write the impact.** State what an attacker gains: reading every customer's order history, including items and totals, simply by changing a number. Mention the privacy and trust consequences.
7. **Write the remediation.** Be concrete: check on the server that the logged-in user owns the requested order before returning it, deny by default, and return "not found" for objects the user may not access. Add that the same pattern should be applied to similar endpoints.
8. **Add references.** Link the OWASP Broken Access Control material so the developer has context.

> **Careful:** Keep reproduction steps to systems you own or that are meant for practice, and never include real customer data or live secrets in a finding. Use placeholder accounts and redact anything sensitive.

## What separates good from weak

A weak finding says "the orders endpoint is insecure, please fix." It gives the reader nothing to act on. A strong finding lets a developer reproduce the problem in a minute, understand why it matters, and see the shape of the fix. Prioritize clarity over volume: three well-written findings that get fixed beat thirty vague ones that get ignored. When you rate severity, be consistent and honest, because your credibility depends on not crying wolf.

## Check yourself

- **What are the essential parts of a finding?** Title, severity, affected component, description, reproduction steps, impact, remediation, and references.
- **Why write impact in business terms?** Because the people who prioritize the fix care about what it means for users and the organization, not only the technical detail.
- **What makes reproduction steps good?** They are concrete and ordered so someone else can follow them exactly and see the problem themselves.
