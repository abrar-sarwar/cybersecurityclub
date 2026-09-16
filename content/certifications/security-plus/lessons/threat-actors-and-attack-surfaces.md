---
title: Threat actors and attack surfaces
objective: Compare common threat actors by motivation and capability, and explain the threat vectors and social engineering techniques that give them a way in.
kind: lesson
estimatedMinutes: 35
prerequisites:
  - Security concepts and the CIA triad (the first lesson in this track)
completionChecks:
  - I can name the threat actor types in SY0-701 and give a likely motivation and resource level for each.
  - I can explain the difference between a threat vector and an attack surface and give three examples of each.
  - I can recognize phishing, vishing, smishing, pretexting, business email compromise and watering hole attacks from a short description.
  - I can explain why unsupported systems, open ports and default credentials keep appearing in breach write-ups.
references:
  - title: MITRE ATT&CK knowledge base of adversary tactics and techniques
    url: https://attack.mitre.org/
  - title: CISA Known Exploited Vulnerabilities Catalog
    url: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
  - title: Verizon Data Breach Investigations Report
    url: https://www.verizon.com/business/resources/reports/dbir/
  - title: CISA Secure Our World (phishing, MFA, updates and password guidance)
    url: https://www.cisa.gov/secure-our-world
status: published
lastReviewed: "2026-09-15"
---

Defenders who understand who is likely to attack them, and how, make better decisions about where to spend limited time. That is why the largest domain of SY0-701 opens with threat actors and threat vectors before it gets to malware and mitigations. This lesson gives you the actor types, the ways in, and the social engineering patterns that show up in most real breaches. None of this requires tools; it requires reading carefully and thinking like someone who wants something you have.

## Who attacks, and why

The objectives describe actors by three attributes: whether they are **internal or external**, how much **funding and resources** they have, and their **level of sophistication**. Motivations include data exfiltration, espionage, service disruption, blackmail, financial gain, philosophical or political beliefs, ethical goals, revenge, disruption for its own sake, and war.

- **Nation-state** actors are external, well funded and highly capable. They pursue espionage, long-term access and, in conflict, disruption. The term advanced persistent threat (APT) usually refers to them.
- **Organized crime** groups are external and financially motivated. Ransomware, business email compromise and payment card theft are their business lines, and they are often as capable as state actors.
- **Hacktivists** act on political or philosophical beliefs. Website defacement, denial of service and leaking documents are typical; funding and skill vary widely.
- **Insider threats** are internal: employees, contractors or students with legitimate access. Motivation can be revenge or money, but many insider incidents are unintentional, such as emailing a spreadsheet to the wrong person.
- **Unskilled attackers** (the objectives use this term instead of "script kiddie") run tools they did not write. Low sophistication does not mean low impact; automated scanners find weak targets at scale.
- **Shadow IT** is not an attacker at all but is listed with them: systems and services set up without the IT or security team's knowledge, which create exposure nobody is watching.

> **Tip:** Exam questions rarely name the actor. They describe funding, patience and goals and ask you to infer. "Months of quiet access to a defense contractor" points to a nation-state; "encrypted files and a payment demand" points to organized crime.

## Threat vectors and attack surfaces

The **attack surface** is the sum of every point where an attacker could try to get in: every exposed service, account, device, person and supplier. A **threat vector** is the specific path or method used to reach one of those points. Reducing the attack surface (closing ports, removing unused accounts, retiring old systems) shrinks the number of vectors that can work.

Vectors the objectives expect you to know:

- **Message-based**: email, SMS and instant messaging, still the most common way in.
- **Image-based** and **file-based**: malicious content hidden in images, documents, archives or installers.
- **Voice call**: phone-based deception, discussed below.
- **Removable devices**: a found USB drive plugged in "to see whose it is".
- **Vulnerable software**: client-based (an agent on the endpoint is exploited) or agentless (a service is exploited over the network).
- **Unsupported systems and applications**: no patches means every newly published vulnerability stays open forever.
- **Unsecure networks**: open or weakly protected wireless, unmanaged wired ports, Bluetooth pairing left discoverable.
- **Open service ports** and **default credentials**: a database listening on the internet with the vendor's default password is a vector you can find with a search engine.
- **Supply chain**: managed service providers (MSPs), vendors and suppliers whose access or software becomes the way in. One compromised provider can reach hundreds of customers at once.

A student example: a club laptop that still has the default local administrator password, an old content management system plugin on the club website, and a shared USB drive that travels between members' machines are three vectors on one small attack surface.

## Social engineering

Human vectors exploit how people work rather than how software works. The objectives list these forms:

- **Phishing** (email), **vishing** (voice) and **smishing** (SMS) all try to get you to click, pay or reveal a credential. Spear phishing targets a specific person; whaling targets executives.
- **Pretexting** builds an invented but plausible scenario: "This is the help desk, we are migrating accounts and need you to confirm your password."
- **Impersonation** claims to be someone specific, and **brand impersonation** copies a company's look in fake login pages and emails.
- **Business email compromise (BEC)** uses a compromised or convincingly spoofed business account to request payments, gift cards or changed bank details. It causes some of the largest financial losses each year without any malware at all.
- **Watering hole** attacks compromise a site the target group already visits, such as a niche forum or a supplier's portal, rather than approaching the target directly.
- **Typosquatting** registers look-alike domains to catch mistyped addresses and to make phishing links look legitimate.
- **Misinformation and disinformation** shape what people believe, which matters for elections, markets and reputations as well as for individual scams.

These work because they trigger authority, urgency, scarcity, familiarity, trust or intimidation. The defense is procedural: verify unusual requests through a second channel you already trust, make reporting easy and blame-free, require multifactor authentication so a stolen password is not enough, and use email authentication (SPF, DKIM and DMARC, covered in the monitoring lesson) so spoofed mail is rejected before a human sees it.

> **Careful:** Urgency is the tell. Any message that combines "right now" with money, credentials or secrecy deserves a phone call to a number you already have, not the one in the message.

## Supply chain as a vector

Modern organizations run on other people's code and services. A malicious update pushed through a legitimate vendor, a compromised open-source dependency, a hardware component with pre-installed malware, or an MSP whose remote management tool is abused are all supply chain attacks. You cannot patch your way out of trusting suppliers, so the controls are managerial: vendor assessment, contract clauses, software bills of materials, monitoring of third-party access, and limiting what any one supplier can reach. The governance lesson returns to this.

## Guided practice

1. Read the summaries of three recent entries in the CISA Known Exploited Vulnerabilities catalog. For each, write which vector an attacker would use (unsupported software, open port, file-based, and so on) and which actor type would most plausibly exploit it and why.
2. Map your own attack surface: list the devices, accounts and online services you rely on as a student. Mark which lack multifactor authentication, which run software you have not updated in months, and which still use a default or reused password. Pick two to fix this week.
3. Write two short phishing pretexts aimed at a fictional student club treasurer, then write the verification step that would defeat each. Do not send them to anyone; the point is to notice the pressure cues you used.
4. Take one news story about a breach and label the actor, the motivation, the initial vector and what part of the CIA triad was hit.

## Check yourself

- **An actor motivated by political beliefs defaces a company website. Which type?** Hacktivist; the motive is ideological, not financial.
- **What is the difference between a threat vector and an attack surface?** The surface is every place an attacker could try; a vector is the specific path used to reach one of them.
- **A treasurer gets an email from the president's real account asking for gift card codes within the hour.** Business email compromise, using authority and urgency; verify by calling the president on a known number.
- **A department sets up its own file-sharing service without telling IT. Which listed category?** Shadow IT; not malicious, but unmonitored exposure.
- **Why are unsupported systems singled out as a vector?** Because known vulnerabilities will never be patched, so any published exploit works indefinitely.
- **What makes a watering hole attack different from phishing?** The attacker compromises a site the targets already trust and visit instead of sending them anything.
