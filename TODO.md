
# Cybersecurity Club Website Revamp

## 1. Product Goal

Build a modern cybersecurity club website that acts as the central public-facing hub for the organization.

The website should help a visitor quickly answer:

- what is this club?
- can I join if I am a beginner?
- what is happening next?
- how do I join the Discord?
- how do I learn cybersecurity?
- how do I start practicing?
- how do I compete?
- who runs the club?

The site should feel active and technical without becoming intimidating or overly corporate.

Take visual and structural inspiration from:

- GreyHat @ GT: simple cybersecurity identity, prominent club/CTF positioning, meetings, events, competition team
- The Hack Pack: practical learning orientation, strong community language, training/resources, competition infrastructure

The site should prioritize **participation over marketing**.

---

# 2. Primary User Types

## New Student

Someone who has little or no cybersecurity experience.

They should be able to:

- understand what the club does within 15–30 seconds
- see that beginners are welcome
- join the Discord immediately
- find the next club meeting
- find beginner resources
- understand how to start practicing cybersecurity

The website should never make cybersecurity experience feel like a prerequisite.

---

## Active Club Member

Someone who already participates in the organization.

They should be able to:

- check upcoming meetings
- view the monthly event calendar
- find workshop materials
- find CTF resources
- access CyLabs / picoCTF / Hack The Box quickly
- find upcoming competitions
- apply for the competitive team

The website should function as a useful bookmark rather than something they only visit once.

---

## Competitive Cybersecurity Student

Someone interested in CTFs, CPTC, NCL, CyberForce, or other competitions.

They should be able to:

- understand what the competitive team is
- see what competitions the club participates in
- see expectations for competitive members
- find training platforms
- access recommended practice material
- apply to the team

Competition participation should feel like a progression from general club membership rather than a completely separate organization.

---

## Recruiter / Sponsor / Faculty Visitor

Someone evaluating the organization professionally.

They should be able to quickly understand:

- what the organization does
- what technical activities students participate in
- what competitions the organization attends
- who leads the organization
- how active the organization is

This user is secondary to students, but the website should still look polished enough to represent the club externally.

---

# 3. Global Navigation

Primary navigation:

**Home**  
**Events**  
**Challenges & Competitions**  
**Resources**  
**Team**

Persistent actions:

**Join Discord**  
Primary CTA, visually distinct.

Optional secondary links:

- GitHub
- LinkedIn
- Instagram

On mobile, navigation should collapse cleanly into a simple menu.

The Discord CTA should remain easy to access from every page.

---

# 4. Home

## Purpose

The homepage should answer:

> "What is this club, and what can I do here?"

It should quickly funnel visitors toward either:

**Join the community**

or

**Attend something**

Avoid turning the homepage into a giant information dump.

---

## Hero

### Goal

Immediately communicate:

- cybersecurity club
- hands-on learning
- competitions
- beginners welcome

### Example Structure

**Headline**

Learn cybersecurity by doing it.

**Supporting copy**

Workshops, hands-on labs, CTFs, competitions, and a community of students learning security together.

### Primary CTA

**Join the Discord**

This should be the strongest CTA on the website.

### Secondary CTA

**See Upcoming Events**

---

## Upcoming Event Spotlight

Directly beneath or near the hero.

Show the next 1–3 events.

Each card should contain:

- event name
- date
- time
- location
- event type
- difficulty / audience when appropriate

Example:

> Web Exploitation Workshop  
> October 8 · 6:30 PM  
> Beginner Friendly  
> Classroom 123

CTA:

**View all events**

If no events are scheduled, display a graceful fallback such as:

> New events are being planned. Join the Discord for announcements.

---

## What We Do

A concise overview using 3–4 cards.

### Learn

Hands-on workshops covering practical cybersecurity skills.

Examples:

- web exploitation
- networking
- reverse engineering
- forensics
- cryptography
- Active Directory
- malware analysis

### Practice

Apply those skills through:

- CyLabs
- Hack The Box
- picoCTF
- CTF challenges

### Compete

Represent the university in collegiate cybersecurity competitions.

### Community

Meet students interested in cybersecurity, share knowledge, form teams, and work through challenges together.

---

## Beginner Callout

Explicitly communicate that experience is not required.

Example:

### Never touched cybersecurity before?

That's completely fine.

Start with our beginner resources, come to a workshop, and work through challenges alongside other members.

Buttons:

**Start Learning**

**Join Discord**

---

## Competitive Team Preview

Small section introducing the competitive program.

Example:

### Ready to compete?

Our competitive cybersecurity team trains for CTFs and collegiate cybersecurity competitions throughout the year.

CTA:

**Learn about the team**

---

## User Requirements

A homepage visitor must be able to:

- understand the club's purpose without scrolling extensively
- find Discord within one interaction
- find the next event within one scroll
- clearly understand beginners are welcome
- navigate toward learning resources
- navigate toward competitions

---

# 5. Events

## Purpose

Events should be the canonical place for answering:

> "What is the club doing?"

GreyHat uses its meetings page to expose general meetings, CTF meetings, competitions, and an upcoming-events calendar, which is a useful model for keeping regular club activity visible.

The page should support both quick scanning and longer-term planning.

---

# Upcoming Events

Display upcoming events chronologically.

Each event card should support:

- title
- date
- start/end time
- location
- description
- event category
- difficulty
- optional registration link
- optional slides/resources link

Categories could include:

- Workshop
- General Body Meeting
- CTF
- Competition
- Social
- Speaker
- Career
- Training

Difficulty labels:

- Beginner
- Intermediate
- Advanced
- All Levels

Do not require every event to specify difficulty.

---

# Monthly Calendar

Include an interactive calendar view.

Users should be able to switch between:

- month
- agenda/list

Optional:

- week view

Clicking an event should open its details.

Prefer an integration rather than manually maintaining two separate calendars.

Potential sources:

- Google Calendar
- ICS feed
- university event calendar

---

# Past Events

Create a lightweight event archive.

Each entry can include:

- event title
- date
- short description
- event category
- slides
- GitHub repository
- recording
- challenge material

This transforms the page from just a calendar into a record of what the club teaches.

Example:

### Intro to Web Exploitation

September 17

Learn how HTTP requests, cookies, authentication, and common web vulnerabilities work.

**Slides**  
**Workshop Lab**

---

## User Requirements

Users must be able to:

- immediately identify the next club event
- understand where and when the event occurs
- determine whether an event is beginner-friendly
- browse the month's events visually
- access materials from previous workshops
- open external registration links when required

---

# 6. Challenges & Competitions

## Purpose

This should become one of the club's most important pages.

It answers:

> "How do I actually practice hacking?"

and

> "How do I compete for the university?"

Treat this as a pathway rather than simply a collection of links.

---

# Competitive Team Hero

Prominent callout:

### Represent GSU in cybersecurity competitions.

Train with other students, solve challenges, and compete in collegiate CTF and cybersecurity competitions.

Primary CTA:

**Apply to the Competitive Team**

Secondary CTA:

**Start Practicing**

---

# Competitive Team Pathway

Explain roughly how someone progresses.

### 1. Learn

Attend workshops or work through beginner resources.

### 2. Practice

Solve challenges on platforms such as:

- CyLabs
- picoCTF
- Hack The Box

### 3. Participate

Join club CTF sessions and internal practice.

### 4. Compete

Participate in external competitions with the university team.

The goal is to make competitive cybersecurity feel approachable instead of exclusive.

---

# Current / Upcoming Competitions

Cards containing:

- competition name
- competition type
- date
- team size
- registration status
- short description

Examples may eventually include:

- NCL
- CPTC
- CyberForce
- CCDC
- collegiate CTFs

Only display competitions the club actually intends to participate in.

---

# CyLabs Integration

## MVP

Provide a prominent link:

**Practice on CyLabs**

Include short context explaining what members should use it for.

Example:

> Work through curated challenges used by the club to build practical cybersecurity skills.

---

## Stretch Goal

Integrate CyLabs data if an API or supported integration exists.

Potential information:

- active challenges
- member solves
- challenge categories
- leaderboard
- recommended challenge of the week

Do not block the site redesign on this integration.

---

# Hack The Box

## MVP

Link to curated Hack The Box machines.

Organize recommendations by difficulty or topic.

Example:

### Beginner Machines

- machine
- category
- difficulty

### Web

### Active Directory

### Linux Privilege Escalation

### Windows

---

## Stretch Goal

Display team/member progress through an API if appropriate and permitted.

Potential metrics:

- machines completed
- active machine recommendation
- team leaderboard

Keep integration optional.

---

# Weekly / Featured Challenge

Optional but valuable.

Example:

### Challenge of the Week

**Hack The Box: Machine Name**

Focus:

Web enumeration → initial access → Linux privilege escalation

Difficulty:

Beginner

CTA:

**Start Machine**

This gives returning members a reason to revisit the website.

---

## User Requirements

A user must be able to:

- understand how competitive cybersecurity works within the club
- find the competitive team application immediately
- find places to practice
- identify beginner-appropriate challenges
- find upcoming competitions
- progress from beginner resources toward competition participation

---

# 7. Resources

## Purpose

Create a curated cybersecurity learning hub.

This should **not** attempt to replace Google.

Only include resources the club actively recommends.

The value comes from curation.

---

# Getting Started

Start with a clear beginner pathway.

Example:

### New to cybersecurity?

Start here.

1. Learn basic Linux commands
2. Learn basic networking
3. Learn how HTTP works
4. Complete beginner CTF challenges
5. Attend club workshops
6. Begin Hack The Box machines

Each step should contain a small number of recommended resources.

---

# Security+ Study Guide

Create a dedicated subsection for students preparing for Security+.

Organize resources by objective.

Potential categories:

- general security concepts
- threats and vulnerabilities
- security architecture
- security operations
- security program management

Resources might include:

- official exam objectives
- Professor Messer
- practice exams
- flashcards
- club study notes

Avoid hosting copyrighted materials directly.

---

# CTF Toolkit

This should essentially be:

> "Things I want open in another tab during a CTF."

Organize tools by category.

### General

- CyberChef
- GTFOBins
- HackTricks

### Web

- Burp Suite
- jwt.io
- RequestBin-style utilities

### Cryptography

- CyberChef
- dCode
- hash identification tools

### Reverse Engineering

- Ghidra
- Compiler Explorer
- shellcode references

### Forensics

- Wireshark
- ExifTool
- file format references

### Binary Exploitation

- pwntools
- ROPgadget
- checksec

### OSINT

Curated OSINT resources.

Each resource should contain:

- resource name
- one-sentence description
- external link

Optional metadata:

- beginner friendly
- requires install
- browser tool
- CLI tool

---

# Club Workshop Resources

Past workshop materials could also be surfaced here.

Organize by topic:

- networking
- Linux
- web
- cryptography
- forensics
- reverse engineering
- binary exploitation
- Active Directory

Avoid duplicating content.

The Resources page may link back to Past Events.

---

## User Requirements

A user should be able to:

- find a beginner learning path
- quickly find Security+ resources
- find useful CTF tools by category
- understand what each tool is for without opening it
- access club-created learning material
- bookmark the page and use it repeatedly

---

# 8. Team

## Purpose

Show the people responsible for the organization and recognize students representing the university competitively.

GreyHat separates administrative leadership, infrastructure/competition roles, competitors, and alumni, which is a useful model for distinguishing organizational responsibilities.

---

# Executive Board

Display member cards.

Recommended fields:

- photo
- name
- role
- major/year if desired
- short bio
- technical interests
- LinkedIn
- GitHub

Roles could include:

- President
- Vice President
- Technical Director
- Treasurer
- Outreach
- Competitive Team Captain

Avoid overly long biographies.

---

# Competitive Team

Separate visual section.

Explain what the team does before listing members.

Example:

> The competitive team represents GSU in Capture the Flag events and collegiate cybersecurity competitions.

Cards may contain:

- name
- competition role
- specialties
- competitions participated in

Example specialties:

- web
- cryptography
- reversing
- pwn
- forensics
- networking
- defense

---

# Optional Alumni Section

Not required for the initial redesign.

Later this could recognize:

- former presidents
- former competition captains
- significant contributors

---

## User Requirements

Users should be able to:

- identify current leadership
- identify competitive team members
- understand who handles which part of the organization
- access professional profiles where provided
- distinguish executive leadership from the competition team

---

# 9. Site-Wide Functional Requirements

## Responsive Design

Must work well on:

- desktop
- laptop
- tablet
- mobile

Mobile should be treated as a first-class experience.

---

## Performance

The site should feel extremely fast.

Avoid:

- massive JavaScript bundles
- unnecessary animation libraries
- background videos
- oversized images
- excessive frontend dependencies

Prefer static rendering where possible.

---

## Accessibility

Require:

- semantic HTML
- keyboard navigation
- appropriate color contrast
- alt text
- visible focus states
- responsive typography
- accessible calendar/event interactions

---

## External Links

External resources should visually indicate when they leave the website.

Examples:

↗ Discord  
↗ Hack The Box  
↗ CyLabs

---

# 10. Content Architecture

Avoid hardcoding content directly inside page components.

Use structured data.

For example:

`events`

- title
- description
- date
- location
- category
- difficulty
- links

`resources`

- name
- description
- category
- url
- tags

`team`

- name
- role
- bio
- image
- links
- specialties

`competitions`

- name
- date
- description
- registration
- status

This makes future editing significantly easier.

Content could initially live in:

- JSON
- YAML
- Markdown / MDX

A CMS is unnecessary for the first version unless nontechnical club officers need to manage the website.

---

# 11. Visual Direction

Aim for:

**technical + collegiate + approachable**

Avoid making the site feel like:

- a generic SaaS landing page
- a hacker movie
- an enterprise cybersecurity vendor
- an esports organization

Good visual elements:

- monospace accents
- subtle terminal references
- grid layouts
- technical diagrams
- restrained cybersecurity motifs
- command-line inspired microcopy
- challenge/category badges

Use these sparingly.

The club itself should remain the visual focus.

---

# 12. Homepage Information Hierarchy

Recommended ordering:

1. Hero
2. Upcoming Event
3. What We Do
4. Beginner Callout
5. Challenges / Practice
6. Competitive Team
7. Join Discord CTA
8. Footer

The visitor should encounter an actionable item every few sections.

---

# 13. MVP

The first production release should include:

### Home
- hero
- Discord CTA
- next events
- club overview
- beginner CTA
- competitive team preview

### Events
- upcoming events
- calendar
- past events

### Challenges & Competitions
- competitive team application
- upcoming competitions
- CyLabs link
- Hack The Box recommendations
- practice pathway

### Resources
- beginner resources
- Security+
- CTF toolkit
- workshop resources

### Team
- executive board
- competitive team

### Global
- responsive navigation
- footer/social links
- structured content
- good performance
- SEO metadata

---

# 14. Stretch Features

Do these only after the core website works well.

### Challenge Dashboard

Pull:

- solves
- leaderboards
- featured challenges

from supported platforms.

### Member Profiles

Members could optionally associate:

- HTB profile
- GitHub
- competition history

### Workshop Repository

Automatically surface club workshop repositories from GitHub.

### Competition History

Archive:

- competitions attended
- placements
- team rosters
- photos
- writeups

### Search

Search:

- resources
- past workshops
- tools
- events

Probably unnecessary until the content library becomes large.

---

# 15. Primary Product Flows

## Brand-New Student

Homepage  
→ understands what club does  
→ sees beginners welcome  
→ views next workshop  
→ joins Discord

---

## Student Who Wants to Learn Cybersecurity

Homepage  
→ Resources  
→ Getting Started  
→ recommended beginner material  
→ practice challenge

---

## Student Who Wants to Compete

Homepage  
→ Challenges & Competitions  
→ practice pathway  
→ CyLabs / Hack The Box  
→ competitive team application

---

## Existing Member

Homepage / Events  
→ checks next meeting  
→ opens event details  
→ accesses slides or challenge

---

# 16. Definition of Success

The redesign is successful when a first-time visitor can answer within roughly one minute:

**Who are you?**

A student cybersecurity organization focused on practical skills, community, and competition.

**Can beginners join?**

Yes.

**When are you meeting?**

Visible immediately.

**How do I join?**

Discord.

**How do I start learning?**

Resources.

**How do I practice?**

Challenges & Competitions.

**How do I compete?**

Competitive team application.

The website should ultimately feel less like an informational brochure and more like the **front door to the club's cybersecurity ecosystem**.
