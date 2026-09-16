---
title: Security in the development lifecycle
objective: Describe how security work fits into each phase of building software so that problems are caught early instead of after release.
kind: lesson
estimatedMinutes: 25
prerequisites:
  - Complete "A tour of the OWASP Top 10"
diagram: sdlc-security
completionChecks:
  - I can name the phases of a typical software development lifecycle.
  - I can give one security activity that belongs in each phase.
  - I can explain what "shift left" means and why it saves effort.
  - I can describe the role of secure defaults and guardrails.
references:
  - title: "NIST SP 800-218, Secure Software Development Framework (SSDF)"
    url: https://csrc.nist.gov/pubs/sp/800/218/final
  - title: OWASP Software Assurance Maturity Model (SAMM)
    url: https://owaspsamm.org/
  - title: OWASP Proactive Controls
    url: https://owasp.org/www-project-proactive-controls/
status: published
lastReviewed: 2026-09-15
---

Security is not a phase you bolt on at the end. The cheapest bug to fix is one that never gets written, and the most expensive is one found in production after customers are affected. Application security works best when small, sensible checks are spread across the whole way software is built. This lesson walks through a typical software development lifecycle and shows what security looks like at each step. The diagram on this page lines the activities up against the phases.

## The phases, briefly

Most teams move through the same rough stages, whether they call it agile, iterative, or something else: plan and design, build, test, release, and operate. Work loops rather than marching in a straight line, but the stages still map to distinct security activities.

## Security in each phase

**Plan and design.** This is where you decide what the software should do and, just as importantly, what it should never allow. Write down who the users are, what data is sensitive, and what an attacker might want. A lightweight threat model here catches insecure design, the kind of flaw no clean code can fix later. You will learn to run one in the next lesson.

**Build.** As developers write code, security shows up as safe patterns and good defaults: parameterized database queries, output encoding, input validation, and using well-maintained libraries. Linters and editor plugins can flag risky patterns as they are typed. The goal is to make the secure way the easy way.

**Test.** Alongside normal testing, security testing looks for weaknesses. Static analysis reads the source code, dynamic analysis pokes the running app, and dependency and secret scanners check what you are shipping. Code review by a human catches logic and authorization mistakes that tools miss.

**Release.** Before shipping, confirm the configuration is safe: no debug mode in production, no default credentials, secrets stored properly, and security headers set. This is also where a build pipeline verifies the integrity of what it is deploying.

**Operate.** Once live, the app needs logging and monitoring so problems are noticed, a way to receive vulnerability reports, and a process to patch dependencies as new flaws are disclosed. Security work does not end at launch.

## Shift left

"Shift left" means moving security activity earlier in that timeline, toward the left side of the diagram. The reason is simple: the earlier a problem is found, the fewer things depend on it and the smaller the change needed to fix it. A design flaw caught in a planning conversation costs a discussion. The same flaw caught after launch may mean an incident, a rebuild, and lost trust.

Shifting left does not mean piling all the work on developers or slowing them down. It means giving them fast feedback and safe defaults so the right choice is also the convenient one.

> **Tip:** A control that runs automatically in the pipeline beats a checklist a tired human has to remember. Aim to turn every lesson learned into a guardrail: a test, a lint rule, or a default that prevents the problem from coming back.

## Frameworks that describe this

You do not have to invent this from scratch. The NIST Secure Software Development Framework (SSDF, SP 800-218) lists practices for building software securely and is widely referenced. OWASP SAMM helps a team measure and grow its security maturity over time. Both describe the same idea this lesson covers: spread sensible practices across the lifecycle rather than relying on a single gate at the end.

> **Note:** Frameworks are menus, not mandates. Small teams adopt a few high-value practices first, such as code review and dependency scanning, then add more as they grow.

## Guided practice

1. Sketch the five phases from this lesson on paper: plan and design, build, test, release, operate.
2. Under each phase, write one security activity from this lesson.
3. Add one more activity of your own to any phase, drawing on the OWASP Top 10 you just toured.
4. Circle the activity you think gives the most protection for the least effort on a small team. Be ready to explain why.
5. Skim the SSDF page and find one practice that matches something you wrote.

## Check yourself

- **What does "shift left" mean?** Moving security activities earlier in the lifecycle so problems are found when they are cheaper and smaller to fix.
- **Give one security activity for the design phase.** Threat modeling, or writing down sensitive data and abuse cases before building.
- **Why prefer an automated guardrail over a checklist item?** Because automation runs every time without depending on a person remembering, so protection does not decay.
