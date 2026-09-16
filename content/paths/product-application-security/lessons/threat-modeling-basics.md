---
title: Threat modeling basics
objective: Run a lightweight threat model of a small application using a data flow diagram and the STRIDE prompts.
kind: lesson
estimatedMinutes: 30
prerequisites:
  - Complete "Security in the development lifecycle"
diagram: threat-model-dfd
completionChecks:
  - I can explain what threat modeling is and when to do it.
  - I can draw a simple data flow diagram with trust boundaries.
  - I can use the STRIDE prompts to find possible threats.
  - I can turn a threat into a concrete mitigation to track.
references:
  - title: OWASP Threat Modeling
    url: https://owasp.org/www-community/Threat_Modeling
  - title: OWASP Threat Modeling Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
  - title: The Threat Modeling Manifesto
    url: https://www.threatmodelingmanifesto.org/
status: published
lastReviewed: 2026-09-15
---

Threat modeling is a structured conversation about what could go wrong with a system before you build or ship it. It answers four questions: what are we working on, what can go wrong, what are we going to do about it, and did we do a good enough job. You do not need special tools or a security title to start. A whiteboard, the people who know the system, and an hour of focused thinking are enough. This lesson gives you a repeatable way in.

## Why do it early

Many serious problems are design problems, not coding problems. If a checkout flow trusts a price sent by the browser, no amount of careful coding on that endpoint fixes the design. Threat modeling catches this class of issue while it is still cheap to change: a sentence in a design doc rather than a rebuild after launch. It is the clearest example of the "shift left" idea from the previous lesson.

## Step 1: Draw what you are building

Start by drawing a data flow diagram. Keep it simple. You need four kinds of things:

- **External entities**, such as a user or another company's service.
- **Processes**, such as your web server or an API.
- **Data stores**, such as a database or a file bucket.
- **Data flows**, the arrows showing information moving between them.

Then draw **trust boundaries** as dashed lines wherever data crosses from something you control less to something you control more, for example from the user's browser into your server, or from your app into a third-party service. The diagram on this page shows this shape: a user talking to a web app that reads and writes a database, with a boundary between the browser and the server.

> **Tip:** The trust boundaries are where the interesting threats cluster. When you are short on time, focus your attention on the arrows that cross a dashed line.

## Step 2: Ask what can go wrong

Now walk the diagram and look for threats. A popular set of prompts is STRIDE, which is six categories to jog your thinking:

- **Spoofing:** could someone pretend to be another user or service?
- **Tampering:** could someone change data in transit or at rest?
- **Repudiation:** could someone do something and later deny it because nothing was logged?
- **Information disclosure:** could someone read data they should not?
- **Denial of service:** could someone make the system unavailable?
- **Elevation of privilege:** could a normal user gain admin powers?

Point STRIDE at each element and each crossing of a boundary. For the browser-to-server flow, spoofing raises the question of authentication, tampering raises input validation and integrity, and elevation of privilege raises authorization checks. You will quickly generate a list of concrete worries.

## Step 3: Decide what to do

For each threat worth taking seriously, choose a response. Usually you **mitigate** it by adding a control, such as authentication, an authorization check, encryption, or logging. Sometimes you **accept** a low risk, **transfer** it, or **eliminate** it by dropping the risky feature. Write the decision down as a task with an owner, so the model produces action rather than just a scary list.

> **Careful:** A threat model that lives only in someone's head or a forgotten document does nothing. Track each mitigation like any other work item, and revisit the model when the design changes in a big way.

## Step 4: Check your work

Ask whether the model is good enough for now. Did you cover the sensitive data flows? Did the people who understand the system agree with the diagram? You are not trying to be perfect; you are trying to be meaningfully better than not thinking about it at all. The Threat Modeling Manifesto is a good short read on this mindset.

## Guided practice

1. Pick a small system you understand, such as a login page that stores users in a database.
2. Draw its data flow diagram: the user, the web app, the database, and the arrows between them.
3. Add dashed trust boundaries wherever data crosses into more trusted territory.
4. Walk each boundary crossing and write down at least one threat for three different STRIDE letters.
5. For each threat, write one concrete mitigation, for example "hash passwords" or "check the logged-in user owns the record."
6. Note which mitigation you would build first and why.

## Check yourself

- **What are the four questions a threat model answers?** What are we working on, what can go wrong, what are we going to do about it, and did we do a good enough job.
- **Why draw trust boundaries?** They mark where data moves into more trusted territory, which is where the most important threats and controls sit.
- **What does the S in STRIDE stand for, and what control addresses it?** Spoofing, usually addressed by authentication that proves who a user or service is.
