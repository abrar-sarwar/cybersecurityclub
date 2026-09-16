---
title: Security concepts and the CIA triad
objective: Explain confidentiality, integrity and availability, classify security controls by category and type, and connect these ideas to zero trust and change management.
kind: lesson
estimatedMinutes: 35
prerequisites:
  - Everyday familiarity with computers, accounts and networks (no prior security knowledge needed)
diagram: cia-triad
completionChecks:
  - I can give a concrete example of a confidentiality, an integrity and an availability failure.
  - I can sort a given control into a category (technical, managerial, operational, physical) and a type (preventive, deterrent, detective, corrective, compensating, directive).
  - I can explain non-repudiation and the three parts of AAA.
  - I can describe what a change management process protects against and name its main elements.
references:
  - title: NIST Cybersecurity Framework 2.0
    url: https://www.nist.gov/cyberframework
  - title: NIST SP 800-207, Zero Trust Architecture
    url: https://csrc.nist.gov/pubs/sp/800/207/final
  - title: CompTIA Security+ (SY0-701) official page and exam objectives
    url: https://www.comptia.org/certifications/security
status: published
lastReviewed: "2026-09-15"
---

Almost every topic on Security+ comes back to three questions: who is allowed to see this, has it been changed, and can we get to it when we need it? Those three questions are the CIA triad, and they are the lens the exam uses for everything from firewalls to backups. This lesson covers the triad, the vocabulary used to classify controls, and two ideas the SY0-701 objectives place in the same domain: zero trust and change management. Learn these words carefully, because every later lesson assumes them.

## The CIA triad

**Confidentiality** means only authorized people and systems can read data. Encryption, access permissions and data classification all serve it. A confidentiality failure looks like a shared folder accidentally set to "anyone with the link" that contains a roster with phone numbers.

**Integrity** means data and systems are accurate and are changed only by authorized means. Hashes, digital signatures, version control and input validation serve it. An integrity failure looks like a grade record altered without a trail, or a downloaded installer that was tampered with in transit.

**Availability** means systems and data are usable when they are needed. Redundancy, backups, patching and capacity planning serve it. An availability failure looks like ransomware locking the registration system during registration week, or a denial-of-service attack against a club website the day of an event.

The three goals pull against each other. Locking a system down hard improves confidentiality but can hurt availability; making a system trivially reachable does the reverse. Many exam questions simply ask which part of the triad a given attack or control most directly affects, so practice naming it out loud.

> **Tip:** When a question describes an attack, ask "what did the attacker gain: reading, changing, or denying?" Reading is confidentiality, changing is integrity, denying is availability.

## Non-repudiation and AAA

**Non-repudiation** means a party cannot credibly deny having taken an action. Digital signatures provide it for documents and code; audit logs tied to individual (not shared) accounts provide it for system activity. A shared "admin" login destroys non-repudiation because nobody can say who typed the command.

**AAA** is three separate steps:

- **Authentication**: proving who you are (password, security key, fingerprint).
- **Authorization**: deciding what you may do once identified (read this folder, not that one).
- **Accounting**: recording what you actually did (logs, session records).

Students mix up the first two constantly. A valid login proves identity; it says nothing about permission. The identity lesson later in this track goes deeper.

## Control categories and types

Security+ classifies every control two ways at once. The **category** says what kind of thing the control is:

| Category | What it is | Examples |
| --- | --- | --- |
| Technical | Implemented in hardware or software | Firewall rule, encryption, MFA, EDR agent |
| Managerial | Policy, planning and oversight | Risk assessment, security policy, vendor review |
| Operational | Carried out by people day to day | Backups, guard patrols, awareness training delivery |
| Physical | Protects places and hardware | Locks, fences, badge readers, cameras |

The **type** says what the control does relative to an unwanted event:

- **Preventive** stops it from happening (a locked door, a firewall deny rule).
- **Deterrent** discourages the attempt (a warning banner, a visible camera).
- **Detective** notices it during or after (an intrusion detection system, log review, a motion sensor).
- **Corrective** fixes the damage (restoring from backup, patching after an exploit).
- **Compensating** substitutes for a control you cannot apply (isolating a device that cannot be patched).
- **Directive** tells people what to do (an acceptable use policy, "authorized personnel only" signage).

Any control has one category and at least one type. A camera is physical; it is detective when someone reviews footage and deterrent when it is placed where people can see it. Read exam questions carefully to see whether they ask for the category or the type, and pick the answer that fits the wording of the scenario rather than the one that sounds most impressive.

## Gap analysis, zero trust and deception

A **gap analysis** compares the current state of an organization with a target state, usually a framework such as NIST CSF 2.0 or an internal policy, and produces a list of gaps to fix. It is the honest starting point for any security program.

**Zero trust** replaces "trusted because you are on the internal network" with "verified on every request". The SY0-701 objectives split it into two planes:

- The **control plane** decides. It includes adaptive identity (adjusting checks based on context), threat scope reduction (limiting what any one identity can reach), policy-driven access control, the **policy engine** (evaluates rules) and the **policy administrator** (tells enforcement points what was decided).
- The **data plane** carries the traffic. It includes the subject or system making the request, implicit trust zones, and the **policy enforcement point**, which actually allows or blocks the connection.

Physical security appears here too: bollards, access control vestibules (two doors that never open at once), fencing, lighting, video surveillance, guards, badge readers and sensors (infrared, pressure, microwave, ultrasonic).

Finally, **deception and disruption** technologies exist to waste attackers' time and reveal them: a **honeypot** is a decoy system, a **honeynet** is a decoy network, a **honeyfile** is a tempting document that should never be opened, and a **honeytoken** is fake data (a bogus credential or API key) that raises an alert when used.

## Change management

Unplanned changes cause outages and open holes; that is why security cares about a boring-sounding process. A change request should include an **approval process**, a named **owner**, the **stakeholders** affected, an **impact analysis**, **test results**, a **backout plan**, a **maintenance window** and a **standard operating procedure** to follow.

Technical implications the exam expects you to recognize: updating allow lists and deny lists, restricted activities during the change, downtime, service and application restarts, legacy applications that break with new versions, and dependencies between systems. After the change, **documentation** must be updated (diagrams, policies, procedures) and configurations kept in **version control** so the previous state can be restored and compared.

> **Careful:** "It's a small change" is how a firewall rule meant for one test server ends up allowing the whole internet into a database. The size of a change is not the size of its impact.

## Guided practice

1. Pick three services you rely on as a student (campus email, the learning management system, a bank app). For each, write one realistic confidentiality failure, one integrity failure and one availability failure. Nine sentences total.
2. Classify each of these by category and type: a login warning banner, a nightly backup job, full-disk encryption, an annual risk assessment, a badge reader, an antivirus quarantine action, a "clean desk" policy, an isolated network segment for an unpatchable lab device.
3. Write a five-line change request for updating your home router's firmware: what changes, why, when (maintenance window), how you will test it, and how you will back out if the update fails.
4. Sketch a zero trust flow for a student opening a club document from a coffee shop: who is the subject, what does the policy engine evaluate, and what does the enforcement point do?

## Check yourself

- **Which part of the triad does a distributed denial-of-service attack target?** Availability; the attacker denies use of the service rather than reading or changing data.
- **A warning banner on the login screen is which control type?** Deterrent (and directive when it states the rules of use). It does not technically stop anyone.
- **An unpatchable lab controller is placed on an isolated VLAN with strict rules. Which type is that?** Compensating; it stands in for the patch that cannot be applied.
- **What is the difference between authentication and authorization?** Authentication proves identity; authorization decides what that identity may do.
- **In zero trust, which component actually permits or blocks a connection?** The policy enforcement point, which sits in the data plane and acts on the decision from the policy engine.
- **Why does a change request need a backout plan?** So a failed change can be reversed quickly, limiting the availability impact and avoiding improvised fixes that create new risk.
