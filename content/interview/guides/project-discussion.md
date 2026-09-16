---
title: How to talk about your projects
summary: A structure for walking through your own security projects honestly, including how to be candid about scope and help, how to answer "what would you do differently," and how to prepare from the club projects.
lastReviewed: "2026-09-15"
references:
  - title: MITRE ATT&CK
    url: https://attack.mitre.org/
    note: A shared vocabulary for describing attacker techniques when you explain a project.
  - title: National Vulnerability Database (NVD)
    url: https://nvd.nist.gov/
    note: Useful when a project involves a specific vulnerability you want to describe accurately.
  - title: CISA Known Exploited Vulnerabilities (KEV) Catalog
    url: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
    note: Helpful context if your project touches a flaw that has been exploited in the wild.
  - title: OWASP Juice Shop project
    url: https://owasp.org/www-project-juice-shop/
    note: A safe, intentionally vulnerable app several club projects build on.
---

Your projects are often the most convincing thing you bring to an interview, because they show what you actually do, not just what you can recite. But a project only helps you if you can talk about it clearly and honestly. This guide gives you a structure to follow, a standard for honesty, a way to answer the "what would you do differently" question, and specific prompts to prepare from the club projects.

## A structure that works every time

When you walk through a project, follow the same six beats. It keeps you from rambling and makes sure you cover what interviewers actually care about.

**1. Context.** In one or two sentences, say what the project was and why it mattered. "I investigated a set of authentication logs to find signs of an account takeover" is enough. Do not open with tool names.

**2. Your role.** Say exactly what *you* did. If it was a solo project, say so. If it was a team or a guided lab, be clear about which parts were yours. This is where honesty starts.

**3. Key decisions.** Pick one or two real decisions and explain the trade-off. "I decided to isolate the host instead of shutting it down, so I would not lose volatile evidence." Decisions are where your judgment shows.

**4. What broke.** Every real project has a rough patch: something did not work, a result surprised you, an assumption was wrong. Sharing it makes you more credible, not less, and it is usually the most interesting part of the story.

**5. What you learned.** State the lesson plainly, and make it something that transfers to future work.

**6. Evidence.** Point to something concrete: a write-up, a repository, a diagram, a short incident summary. Evidence turns a claim into a demonstration.

> **Tip:** Practice the whole walkthrough out loud in about two minutes. If you cannot get through the six beats in two minutes, you are including too much detail. The interviewer will ask for depth where they want it.

## Honesty about scope and help

The single fastest way to lose an interviewer's trust is to overstate what you did. The fastest way to build it is to be precise about scope and generous about credit.

- **Be exact about scope.** "I followed a guided lab and then extended it by writing my own test cases" is a strong, honest statement. "I built a full detection pipeline" when you configured one rule is not.
- **Name the help you received.** Guides, teammates, documentation, and AI tools are all normal parts of real work. Saying "I used the project walkthrough to get started, then figured out the analysis myself" is completely respectable.
- **Understanding beats copying.** The test is whether you can explain each part in your own words. If you used a snippet you do not understand, either learn it before the interview or be upfront that you have not dug into it yet.

> **Careful:** Interviewers frequently probe with "can you explain how this part works?" If your answer only holds together as long as nobody asks a follow-up, it will not hold together. Prepare to go one level deeper than your summary.

Being honest about scope does not make your work smaller. It makes *you* bigger, because it shows you know exactly where your understanding ends -- which is a senior habit.

## Answering "what would you do differently?"

This question trips people up because "nothing, it went great" sounds arrogant and "everything, it was a mess" sounds like you cannot judge your own work. The good answer sits in the middle.

1. **Name one specific change.** Not a vague "I'd manage my time better," but "I would write my test cases before building the matrix, so I would catch gaps earlier."
2. **Explain why.** Tie the change to something concrete that happened.
3. **Show the lesson transfers.** "Now I write the checks first on any project like this."
4. **Keep some things that went well.** It is fine to say a decision was correct and you would repeat it. Balance shows judgment.

Avoid two traps: claiming perfection, and being so self-critical that it sounds like the project failed. You are demonstrating reflection, not confession.

## Prepare from the club projects

Each club project is designed to give you a clean, honest story to tell. Before an interview, write a short paragraph for each project you completed, using the six beats above. Here are prompts to get you started:

- **Authentication log investigation.** What patterns did you find in the logs, and how did you tell a real attack from noise? Walk through your timeline and how you assessed impact. What was your single most useful finding, and what did you leave as an open question?
- **RBAC access matrix.** What roles and systems did you model, and how did you apply least privilege? Which deliberate flaw in the starting matrix did you catch, and how did your test cases prove access was correct?
- **Fix a vulnerable app.** Describe the flaw you found in your local instance, how you confirmed it *only* against that local app, and how you fixed it in code. How did you verify the fix actually closed the hole? (Be clear that you only ever tested software you were authorized to test.)
- **Document a small network.** Walk through your diagram and trust zones. Pick one control -- segmentation, a firewall rule, MFA on the router admin, backups, or logging -- and explain the specific threat it addresses.

> **Note:** For each project, prepare one "what broke" moment and one "what I'd do differently" answer in advance. Those two are asked constantly, and having a genuine, specific response ready is the difference between a smooth answer and a scramble.

## Put it together

Pick your strongest project, write out the six beats, mark honestly which parts were yours and where you got help, and rehearse the two-minute version. Then prepare one level of depth below each beat for the inevitable follow-ups. Do that for two projects and you will walk in ready for most of what an interviewer can ask -- and, more importantly, you will be telling the truth the whole way through.
