---
title: Talking to developers
objective: Learn to work with developers as a partner so that security findings get understood, prioritized, and fixed.
kind: lesson
estimatedMinutes: 20
prerequisites:
  - Complete "Writing a security finding"
completionChecks:
  - I can explain why a partnership approach beats a gatekeeper approach.
  - I can frame a finding in a way a developer can act on without feeling blamed.
  - I can explain how secure defaults reduce friction.
  - I can describe what a security champion is and why it helps.
references:
  - title: OWASP Proactive Controls
    url: https://owasp.org/www-project-proactive-controls/
  - title: OWASP Software Assurance Maturity Model (SAMM)
    url: https://owaspsamm.org/
  - title: OWASP Cheat Sheet Series
    url: https://cheatsheetseries.owasp.org/
status: published
lastReviewed: 2026-09-15
---

You can find every vulnerability in an application and still change nothing if the developers do not act on what you found. Application security succeeds or fails on relationships as much as on technical skill. The developers are not your adversaries; they are the people who will actually fix the problems, usually while juggling deadlines and features. This lesson is about working with them well, which is one of the most reliable ways to have real impact.

## Partner, not gatekeeper

The old model of security as the team that says "no" at the end does not work. It gets security involved too late, makes developers hide work to avoid friction, and turns fixes into arguments. The better model is partnership: security shows up early, helps teams make good choices, and treats a vulnerability as a shared problem to solve rather than a failing grade to hand out. Your job is to make the secure path the easy path, not to stand at the gate.

> **Note:** Developers usually want to build safe software. They are rarely careless; more often they are busy, or were never shown the safe pattern. Assume good intent and your advice lands far better.

## Framing a finding so it gets fixed

How you deliver a finding matters as much as its content. A few habits help:

- **Lead with the concrete.** Show the reproduction and the impact, not a lecture. Let the facts make the case.
- **Talk about the code, not the coder.** "This endpoint is missing an ownership check" invites a fix. "You forgot security again" invites defensiveness.
- **Bring the fix, not just the flaw.** Point to the safe pattern and a reference, such as the relevant OWASP cheat sheet, so the next step is obvious.
- **Be honest about severity.** If you inflate every issue to critical, people stop believing you. Save the urgency for when it is real.
- **Prioritize.** Developers have limited time. Help them see which two things matter most this week rather than handing over a list of forty.

## Reduce friction with secure defaults

The most durable way to win a developer's trust is to make security cost them less. Every time you replace a rule people must remember with a default that is safe out of the box, you remove a chance to get it wrong and a reason to resent security. A framework that escapes output by default, a project template with the right headers already set, a linter that flags a risky pattern as it is typed: these prevent bugs quietly, without a meeting. The OWASP Proactive Controls are a good catalog of defenses to bake in this way.

## Meet people where they are

Skip the jargon when it does not help. A developer does not need the taxonomy of an attack; they need to know what to change and why it matters. Learn a little about how their team works, their language, and their deadlines, and fit your advice into that reality. When you must push back on a risky decision, explain the trade-off plainly and, where you can, offer a safer option that still ships.

## Security champions

You cannot review everything yourself, and you should not try. A **security champion** is a developer on a product team who has extra interest in security and acts as a local point of contact, catching issues early and pulling in the security team when needed. Growing champions scales your impact far beyond what one person can review, and it builds the culture that maturity models like OWASP SAMM describe. In a club setting, being the person others come to with security questions is exactly this role in miniature.

> **Tip:** Celebrate fixes, not just findings. Thanking a team when they resolve an issue makes the next conversation easier and signals that you are on the same side.

## Guided practice

1. Take a finding you wrote in the previous lesson and rewrite its summary to focus on the code and the fix, not on blame.
2. Add a one-line "why this matters" a non-specialist would understand.
3. Turn one recurring issue into a proposed secure default, and write a sentence on how it would prevent the problem going forward.
4. Think of a group you belong to. Who could be a security champion, and what would you ask them to watch for?
5. Practice explaining one vulnerability from this path out loud in plain language, as if to a busy teammate.

## Check yourself

- **Why is a partnership approach better than a gatekeeper approach?** Because security involved early and collaboratively gets more fixes shipped than security that only says "no" at the end.
- **How should you frame a finding?** Concretely, about the code rather than the person, with a suggested fix, honest severity, and clear priority.
- **What is a security champion?** A developer embedded in a product team who champions security locally and links the team to the security group, scaling impact and culture.
