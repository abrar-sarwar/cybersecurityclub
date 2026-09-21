# Content authoring guide

All learning material lives in this folder as structured files so officers can
review it in pull requests and the site can validate it. Run `npm run
content:check` after editing; the build refuses invalid content.

Schemas: `src/content/schemas.ts` (Zod). Loaders: `src/content/loaders.ts`.

## Folder layout

```
content/
  media-manifest.json                image slots for the initial asset import
  paths/<path-slug>/path.json        path metadata, modules, lesson order
  paths/<path-slug>/lessons/*.md     lessons and exercises (markdown + frontmatter)
  projects/<slug>.json               project library entries
  certifications/<track>/track.json  study track metadata and topic map
  certifications/<track>/lessons/*.md
  certifications/<track>/questions.json   ORIGINAL practice questions
  interview/topics.json              interview topics and prompts
  interview/guides/*.md              long-form guides (e.g. staying-updated)
  lab/lab-guide.json                 home-lab environments and wizard fit rules
  lab/environments/*.md              per-environment setup guides
```

## Writing rules

- Plain, welcoming language. No hacker clichés, no fear, no hype.
- Never invent statistics, employers, or outcomes. Never promise jobs.
- Technical claims must be accurate for 2026. Where tools change often, say
  "check the official page" and add the page under `references`/`sources`.
- Only original practice questions. Never reproduce exam questions or dumps.
- Practice must be safe and authorized: sample data, local isolated VMs,
  intentionally vulnerable apps that run locally. Never target real systems.
- Every file carries `lastReviewed` (YYYY-MM-DD) and `status`
  (`draft` or `published`).
- Keep markdown simple: headings (`##`, `###`), paragraphs, lists, tables,
  fenced code blocks, links, bold. No raw HTML.
- Diagrams: put `diagram: <id>` in lesson frontmatter to render a built-in
  SVG. Available ids are listed in `DIAGRAM_IDS` in `src/content/schemas.ts`.
- Callouts: start a blockquote with `**Note:**`, `**Tip:**` or
  `**Careful:**` and it renders as a styled callout.

## Lesson frontmatter

```yaml
---
title: What a SOC actually does
objective: Explain what a security operations center is for and walk through the life of one alert.
kind: lesson            # or exercise
estimatedMinutes: 25
prerequisites:
  - Know what an IP address and a log file are (see Networking basics)
diagram: alert-lifecycle   # optional
completionChecks:
  - I can explain the difference between an event, an alert and an incident.
  - I can describe what a tier-1 analyst does with a new alert.
references:
  - title: NIST SP 800-61r3, Incident Response Recommendations
    url: https://csrc.nist.gov/pubs/sp/800/61/r3/final
status: published
lastReviewed: 2026-09-15
---
```

Body structure that renders well:

```
Intro paragraph (why this matters, 2-4 sentences)

## Core ideas
...

## Guided practice
Numbered steps a member can do in under the estimated time.

## Check yourself
A few questions with short answers in a details-style list.
```

Length: lessons 700-1400 words; exercises 400-900 words plus steps.

## Path file (`path.json`)

See `src/content/schemas.ts` -> `pathSchema`. Lesson slugs listed in
`modules[].lessons` must exist in `lessons/`. `portfolioProject` must match a
project slug. `interviewTopics` must match ids in `interview/topics.json`.

## Content keys

Events reference related lessons by key:

- `lesson:<path-slug>/<lesson-slug>`
- `cert-lesson:<track-slug>/<lesson-slug>`
- `project:<slug>`

Renaming a slug breaks those references; prefer editing in place.
