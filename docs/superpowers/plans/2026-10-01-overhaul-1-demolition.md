# Overhaul 1: Demolition and Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the site to five working pages (Home, Events, Challenges, Resources, Team) with no careers section and no database.

**Architecture:** A new Playwright spec pins the target shape first (which routes exist, what the nav and sitemap say). Navigation is rewired and stub pages added while the old code still exists, so the site works at every commit. Then the careers code, the database and their dependencies are deleted in two separate commits, with a typecheck after each deletion group.

**Tech Stack:** Next.js 16.3.5 (App Router), React 19, TypeScript, Tailwind 4, Playwright, `tsx --test` for unit tests.

**Spec:** `docs/superpowers/specs/2026-10-01-overhaul-1-demolition-design.md`

## Global Constraints

- **Read the Next.js docs first.** `AGENTS.md` says this Next.js version differs from training data. Before editing `layout.tsx`, `sitemap.ts`, `robots.ts` or `next.config.ts`, read the matching guide under `node_modules/next/dist/docs/`.
- **No Claude-written copy ships as final content.** Stub pages show a visibly marked "Content pending" block. Functional labels (nav labels, button text already used elsewhere on the site) are allowed.
- **No CSS pruning.** Do not delete selectors from `signal.css`, `observatory.css` or `globals.css`. That is a later cleanup pass.
- **Out of scope:** the homepage hero, its internship strip, `content/observatory.json`, and the Events and Team pages.
- **No redirects** for `/careers/**` or `/stories`. They return 404.
- **Commits:** never add a `Co-Authored-By` trailer.
- **Confirm before deleting.** Every file marked "if unused" is deleted only after `grep -rn "<name>" src e2e config scripts` shows no importer.
- **E2E setup:** Playwright needs a running server and has no `webServer` config. Start one in the background with `npm run build && PORT=3001 npm run start`, and restart it after code changes. The base URL defaults to `http://localhost:3001`.

## Review Focus

1. **A visitor following an old `/careers` link** lands on the 404 page; every link on that page must lead somewhere that exists. Pinned in Task 1 ("the 404 page offers only working links").
2. **A phone visitor opening the menu** sees Join Discord as the one primary action, not an outline button left over from when it was second. Pinned in Task 1 ("the phone menu has Discord as its only action").
3. **A fresh clone with no `.env` file** builds and serves. Pinned in Task 4, Step 7 (build with `.env` moved aside).
4. **Any page still linking to a removed route**, including the footer and the homepage about section. Pinned in Task 1 ("no page links to a removed route").
5. **The sitemap advertising deleted or missing pages** to search engines. Pinned in Task 1 ("the sitemap lists exactly the live pages").

## File Structure

| File | Action | Responsibility |
| --- | --- | --- |
| `e2e/site.spec.ts` | Create | Pins the five-page shape: routes, nav, links, sitemap, robots |
| `src/components/site/pending-content.tsx` | Create | The one marked "Content pending" block, reused by later sub-projects for empty slots |
| `src/app/(public)/challenges/page.tsx` | Create | Stub page |
| `src/app/(public)/resources/page.tsx` | Create | Stub page |
| `src/components/layout/nav-config.ts` | Modify | Nav targets; single Discord action |
| `src/components/layout/site-header.tsx` | Modify | Discord as primary action; no quiz link |
| `src/components/layout/site-footer.tsx` | Modify | "Explore" column points at new pages |
| `src/app/not-found.tsx` | Modify | Second button goes to `/events` |
| `src/components/site/about-club.tsx` | Modify | Remove the careers card |
| `src/app/sitemap.ts`, `robots.ts` | Modify | Static, careers-free |
| `next.config.ts` | Modify | Drop careers redirects, noindex rule, Prisma external |
| `src/app/layout.tsx` | Modify | Static metadata, no database lookup |
| `config/branding.ts` | Modify | Drop media slot fields |
| `package.json`, `.env.example`, `README.md` | Modify | Scripts, env and docs without database or careers |
| `e2e/home.spec.ts` | Modify | Two link lists updated |
| careers, stories, learn, database files | Delete | See Tasks 3 and 4 |

---

### Task 1: Pin the target shape with a failing e2e spec

**Files:**
- Create: `e2e/site.spec.ts`

**Interfaces:**
- Produces: the test names below, which Tasks 2 to 4 make pass. The stub marker is the attribute `data-pending-content`.

- [ ] **Step 1: Record the e2e baseline**

`e2e/home.spec.ts` may already have failures unrelated to this work. Start the server and record them so later runs can be compared.

```bash
npm run build && (PORT=3001 npm run start &)
npx playwright test e2e/home.spec.ts --reporter=line 2>&1 | tail -30
```

Write the names of any failing tests into the commit message of Step 4 under a "Pre-existing failures" line. Expected: the two tests that look for `About`, `Events` and `Careers` links inside `.cyber-home` fail, because the hero now has only a Join Discord link.

- [ ] **Step 2: Write the spec**

Create `e2e/site.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const LIVE = ["/", "/events", "/challenges", "/resources", "/team", "/privacy", "/accessibility"];
const GONE = ["/careers", "/careers/quiz", "/careers/projects", "/careers/results", "/stories", "/learn"];
const REMOVED_LINK = /^\/(careers|stories|learn)(\/|$|#|\?)/;

const NAV = [
  ["Home", "/"],
  ["Events", "/events"],
  ["Challenges", "/challenges"],
  ["Resources", "/resources"],
  ["Team", "/team"],
];

async function internalHrefs(page: import("@playwright/test").Page) {
  return page.locator("a[href^='/']").evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
}

test("every live page responds", async ({ request }) => {
  for (const path of LIVE) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test("removed routes are gone", async ({ request }) => {
  for (const path of GONE) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("the header nav points at the five pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const links = page.locator(".signal-header-nav a");
  await expect(links).toHaveCount(NAV.length);
  for (const [index, [label, href]] of NAV.entries()) {
    await expect(links.nth(index)).toHaveText(label);
    await expect(links.nth(index)).toHaveAttribute("href", href);
  }
});

test("the header's only action is Join Discord", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const actions = page.locator(".signal-header-actions a");
  await expect(actions).toHaveCount(1);
  await expect(actions).toHaveText("Join Discord");
  await expect(actions).toHaveAttribute("href", /^https:\/\/discord\.gg\//);
  await expect(actions).toHaveClass(/btn-cyber-primary/);
  await expect(page.getByRole("link", { name: "Find My Path" })).toHaveCount(0);
});

test("the phone menu has Discord as its only action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog");
  const action = dialog.locator("a.btn-cyber");
  await expect(action).toHaveCount(1);
  await expect(action).toHaveText("Join Discord");
  await expect(action).toHaveClass(/btn-cyber-primary/);
});

test("no page links to a removed route", async ({ page }) => {
  for (const path of LIVE) {
    await page.goto(path);
    const stale = (await internalHrefs(page)).filter((href) => REMOVED_LINK.test(href));
    expect(stale, `stale links on ${path}`).toEqual([]);
  }
});

test("the 404 page offers only working links", async ({ page, request }) => {
  const response = await page.goto("/careers");
  expect(response?.status()).toBe(404);
  const hrefs = [...new Set(await internalHrefs(page))];
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    expect((await request.get(href.split("#")[0] || "/")).status(), href).toBe(200);
  }
});

test("the sitemap lists exactly the live pages", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  expect(paths.sort()).toEqual([...LIVE].sort());
});

test("robots.txt no longer mentions careers", async ({ request }) => {
  const text = await (await request.get("/robots.txt")).text();
  expect(text).not.toContain("careers");
  expect(text).toContain("sitemap.xml");
});

test("the new pages are marked as unfinished", async ({ page }) => {
  for (const [path, title] of [["/challenges", "Challenges & Competitions"], ["/resources", "Resources"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator("[data-pending-content]")).toContainText("Content pending");
  }
});
```

- [ ] **Step 3: Run it and confirm it fails for the right reasons**

Run: `npx playwright test e2e/site.spec.ts --reporter=line`

Expected: FAIL. `/challenges` and `/resources` return 404, `/careers` returns 200, the nav has the old hrefs, the header has two actions. No test should fail on a locator typo or a timeout unrelated to those facts.

- [ ] **Step 4: Commit**

```bash
git add e2e/site.spec.ts
git commit -m "Add an e2e spec for the five-page site shape"
```

---

### Task 2: Rewire navigation and add the stub pages

The careers code still exists after this task; only the links to it change.

**Files:**
- Create: `src/components/site/pending-content.tsx`, `src/app/(public)/challenges/page.tsx`, `src/app/(public)/resources/page.tsx`
- Modify: `src/components/layout/nav-config.ts`, `src/components/layout/site-header.tsx`, `src/components/layout/site-footer.tsx:42-49`, `src/app/not-found.tsx:29-31`, `src/components/site/about-club.tsx:72-115`, `src/app/sitemap.ts`, `src/app/robots.ts`, `next.config.ts`, `e2e/home.spec.ts`

**Interfaces:**
- Produces: `PendingContent({ what: string })` from `@/components/site/pending-content`, rendering an element with `data-pending-content`. `HEADER_ACTIONS` becomes `{ discord: { label: "Join Discord" } }` with no `primary` key.

- [ ] **Step 1: Read the Next.js guides for the files this task edits**

```bash
ls node_modules/next/dist/docs/
grep -rl "sitemap\|robots" node_modules/next/dist/docs --include=*.md* | head
```

Read the sitemap, robots and redirects guides. Note any change from the code below and follow the guide where they differ.

- [ ] **Step 2: Create the pending-content block**

Create `src/components/site/pending-content.tsx`:

```tsx
/**
 * Marks a slot the club has not filled yet. The club writes the site's copy;
 * this block stands in until they do, and is never used for real content.
 */
export function PendingContent({ what }: { what: string }) {
  return (
    <div className="card p-6 sm:p-8" data-pending-content>
      <p className="signal-eyebrow">
        <span className="signal-eyebrow-mark" aria-hidden="true" />
        Content pending
      </p>
      <p className="mt-3 text-muted">{what}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create the two stub pages**

Create `src/app/(public)/challenges/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { PendingContent } from "@/components/site/pending-content";

export const metadata: Metadata = {
  title: "Challenges & Competitions",
  alternates: { canonical: "/challenges" },
};

export default function ChallengesPage() {
  return (
    <>
      <PageHero eyebrow="Compete" title="Challenges & Competitions" />
      <section className="section">
        <div className="container-x">
          <PendingContent what="Goes here: the competitive team application, CyLabs and Hack The Box." />
        </div>
      </section>
    </>
  );
}
```

Create `src/app/(public)/resources/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { PendingContent } from "@/components/site/pending-content";

export const metadata: Metadata = {
  title: "Resources",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero eyebrow="Learn" title="Resources" />
      <section className="section">
        <div className="container-x">
          <PendingContent what="Goes here: curated resources, Security+ study material and CTF tools." />
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Point the nav at the new pages**

Replace the whole of `src/components/layout/nav-config.ts`:

```ts
export const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/challenges", label: "Challenges" },
  { href: "/resources", label: "Resources" },
  { href: "/team", label: "Team" },
] as const;

/** The header's one call to action. The site has no accounts; it leads to Discord. */
export const HEADER_ACTIONS = {
  discord: { label: "Join Discord" },
} as const;
```

- [ ] **Step 5: Make Discord the header's single action**

Replace the whole of `src/components/layout/site-header.tsx`:

```tsx
import { branding } from "@config/branding";
import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { HEADER_ACTIONS, PUBLIC_NAV } from "@/components/layout/nav-config";
import { NavLinks } from "@/components/layout/nav-links";

export function SiteHeader() {
  const discord = { href: branding.links.discordInvite, label: HEADER_ACTIONS.discord.label, external: true };

  return (
    <header className="site-header signal-header">
      <div className="container-x signal-header-inner">
        <Logo />
        <nav className="signal-header-nav" aria-label="Site">
          <NavLinks items={[...PUBLIC_NAV]} />
        </nav>
        <div className="signal-header-actions">
          <a href={discord.href} target="_blank" rel="noopener noreferrer" className="btn-cyber btn-cyber-primary btn-cyber-sm">
            {discord.label}
          </a>
        </div>
        <div className="signal-header-mobile">
          <a
            href={discord.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cyber btn-cyber-primary btn-cyber-sm signal-header-mobile-cta"
          >
            {discord.label}
          </a>
          <MobileNav items={[...PUBLIC_NAV]} actions={[discord]} brandLabel={branding.shortName} />
        </div>
      </div>
    </header>
  );
}
```

`MobileNav` styles `actions[0]` as primary, so passing only `discord` gives it the primary style with no change to that component.

- [ ] **Step 6: Update the footer's Explore column**

In `src/components/layout/site-footer.tsx`, replace the `Explore` column's links:

```ts
  {
    title: "Explore",
    links: [
      { href: "/challenges", label: "Challenges" },
      { href: "/resources", label: "Resources" },
    ],
  },
```

- [ ] **Step 7: Fix the 404 page's second button**

In `src/app/not-found.tsx`, replace the `/careers` button:

```tsx
          <ButtonLink href="/events" variant="outline" size="lg">
            See upcoming events
          </ButtonLink>
```

- [ ] **Step 8: Remove the careers card from the homepage about section**

In `src/components/site/about-club.tsx`, delete the whole second card: the `<div className="card p-6 sm:p-8">` that contains the heading "Explore cybersecurity careers", through its closing `</div>` (lines 93 to 115). Its parent then has one child, so change the parent's class from `container-x grid gap-10 lg:grid-cols-2` to `container-x`.

Remove the `NodeMark` import if it is now unused, then check whether the file itself is orphaned:

```bash
grep -rn "node-mark" src --include=*.tsx | grep -v "components/careers\|(public)/careers"
```

If that prints nothing, `git rm src/components/site/node-mark.tsx`.

- [ ] **Step 9: Make the sitemap static**

Replace the whole of `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PAGES = ["/", "/events", "/challenges", "/resources", "/team", "/privacy", "/accessibility"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return PAGES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/events" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
```

- [ ] **Step 10: Drop the careers rule from robots**

Replace the whole of `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
```

- [ ] **Step 11: Clean the careers entries out of `next.config.ts`**

Delete the `privateRoutePatterns` constant and its doc comment. Replace `redirects()` and `headers()`:

```ts
  async redirects() {
    return [
      // The about page was folded into the homepage, under the hero.
      { source: "/about", destination: "/#about", permanent: true },
      // The community page was folded into the members page.
      { source: "/community", destination: "/team", permanent: true },
      // The members page was renamed to the team page.
      { source: "/members", destination: "/team", permanent: true },
    ];
  },
```

```ts
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
```

Leave `serverExternalPackages` alone; Task 4 changes it.

- [ ] **Step 12: Update the two stale link lists in `e2e/home.spec.ts`**

The hero now has one link, Join Discord. Find the two places that list `"About", "Events", "Careers"`:

1. In the layout test (around line 63), the loop `for (const name of ["About", "Events", "Careers", "Join Discord"])` becomes `for (const name of ["Join Discord"])`.
2. In `homepage links reach their pages` (line 339), delete the `for` loop over `[["About", "/#about"], ["Events", "/events"], ["Careers", "/careers"]]`. Keep the Discord assertions and the "no log in link" assertion that follow it.

Read the surrounding code first. If the layout test measures those links' positions in a way that needs more than one element, keep the measurement and reduce only the list.

- [ ] **Step 13: Verify**

```bash
npm run typecheck && npm run lint
npm run build && (PORT=3001 npm run start &)
npx playwright test e2e/site.spec.ts e2e/home.spec.ts --reporter=line
```

Expected: typecheck and lint pass. In `site.spec.ts` everything passes except `removed routes are gone` and `the 404 page offers only working links` (careers still exists). `home.spec.ts` has no failures beyond any unrelated ones recorded in Task 1, Step 1.

- [ ] **Step 14: Commit**

```bash
git add -A src e2e next.config.ts
git commit -m "Point the nav at Challenges and Resources and add their stub pages

Discord becomes the header's single action. The footer, 404 page and
homepage about section no longer link to careers. The sitemap is a
static list of the seven public pages."
```

---

### Task 3: Delete the careers section and stories

**Files:**
- Delete: listed per step
- Modify: `package.json`, `src/app/globals.css` (only if the typography check in Step 6 says so)

**Interfaces:**
- Consumes: nothing from this task's deletions is imported by Home, Events, Team, Privacy or Accessibility after Task 2.

- [ ] **Step 1: Delete the routes**

```bash
git rm -r "src/app/(public)/careers" "src/app/(public)/stories"
npm run typecheck
```

Expected: PASS. If `.next/types` reports stale route types, run `rm -rf .next` and typecheck again.

- [ ] **Step 2: Delete the careers and learn code**

```bash
git rm -r src/components/careers src/components/learn src/content/careers src/lib/careers
git rm src/content/loaders.ts src/content/schemas.ts src/server/services/content-links.ts src/server/services/people.ts
npm run typecheck
```

Expected: FAIL only in `src/components/marketing/sections.tsx` (imports `StoryView`). Step 3 removes it. Any other error means a live page still depends on deleted code: stop and fix that import rather than deleting further.

- [ ] **Step 3: Delete components left with no importer**

Check each, and delete only when the grep prints nothing:

```bash
for name in marketing/sections media/slot-image site/ctf-callout site/reveal; do
  echo "$name: $(grep -rln "components/$name\"\|\./$(basename $name)\"" src)"
done
```

Expected: all four print nothing after the name. Then:

```bash
git rm src/components/marketing/sections.tsx src/components/media/slot-image.tsx src/components/site/ctf-callout.tsx src/components/site/reveal.tsx
for name in slug enums; do echo "$name: $(grep -rln "lib/$name\"" src | grep -v server/services/media.ts)"; done
```

`src/lib/enums.ts` has no importer: `git rm src/lib/enums.ts`. `src/lib/slug.ts` is still imported by `src/server/services/media.ts`; leave it for Task 4.

```bash
npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 4: Delete the content and its checker**

```bash
git rm -r content/paths content/certifications content/interview content/lab
git rm scripts/content-check.ts e2e/careers.spec.ts
cat content/README.md
```

`content/README.md` documents only the deleted learning folders and the media manifest, so `git rm content/README.md` (drop the `cat` once confirmed).

- [ ] **Step 5: Update the package scripts**

In `package.json`:

- `test:unit` becomes `"tsx --test src/components/marketing/network-state.test.ts src/components/marketing/network-layout.test.ts src/content/club/flyers.test.ts"`
- delete the `content:check` script
- `verify` becomes `"npm run typecheck && npm run lint && npm run test:unit"` (this also drops `media:check`, whose script file does not exist; remove that script entry too)

- [ ] **Step 6: Remove dependencies that are now unused**

```bash
for pkg in react-markdown remark-gfm gray-matter; do echo "$pkg: $(grep -rln "\"$pkg\"\|'$pkg'" src scripts config e2e 2>/dev/null)"; done
grep -rn "className=\"[^\"]*\bprose\b" src --include=*.tsx
```

Expected: the three packages print nothing, so `npm uninstall react-markdown remark-gfm gray-matter`. The `prose` grep prints the privacy and accessibility pages, so `@tailwindcss/typography` and its `@plugin` line in `globals.css` **stay**.

- [ ] **Step 7: Verify**

```bash
rm -rf .next
npm run typecheck && npm run lint && npm run test:unit
npm run build && (PORT=3001 npm run start &)
npx playwright test e2e/site.spec.ts e2e/home.spec.ts --reporter=line
grep -rniE "careers|/stories|quiz" src e2e config --include=*.ts --include=*.tsx
```

Expected: everything passes; every test in `site.spec.ts` passes. The final grep prints nothing except, possibly, the sentence about member stories in `src/app/(public)/privacy/page.tsx`. Leave that sentence: it is club-written policy copy, and it is reported to the club in Task 5.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Delete the careers section and the stories page

Removes the questionnaire, career and learning paths, project library,
lesson content and their loaders, schemas, tests and content checker,
along with react-markdown, remark-gfm and gray-matter."
```

---

### Task 4: Remove the database

**Files:**
- Delete: `prisma/`, `supabase/`, `src/server/db.ts`, `src/server/safe-db.ts`, `src/server/env.ts`, `src/server/services/media.ts`, `src/server/services/events.ts`, `src/lib/slug.ts`, `content/media-manifest.json`
- Modify: `src/app/layout.tsx:8-56`, `config/branding.ts`, `next.config.ts`, `package.json`, `.env.example`, `.gitignore`

**Interfaces:**
- Consumes: `branding.displayName`, `branding.shortName`, `branding.description`, `branding.colors.background` from `@config/branding`; `siteUrl()` from `@/lib/site`.
- Produces: `src/app/layout.tsx` exports a static `metadata` object instead of `generateMetadata`.

- [ ] **Step 1: Read the Next.js metadata guide**

```bash
grep -rl "opengraph-image\|generateMetadata" node_modules/next/dist/docs --include=*.md* | head
```

Confirm from the guide that `src/app/icon.png`, `apple-icon.png`, `favicon.ico` and `opengraph-image.tsx` are picked up by file convention with no `icons` or `openGraph.images` entry in the metadata. If this version requires them to be declared, declare them in Step 2 using those file paths.

- [ ] **Step 2: Make the layout metadata static**

In `src/app/layout.tsx`, delete the two imports of `resolveSingle` and `safeDb`, and replace the whole `generateMetadata` function with:

```tsx
// Icons and the social preview come from the files beside this one
// (icon.png, apple-icon.png, favicon.ico, opengraph-image.tsx).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: branding.displayName,
    template: `%s · ${branding.shortName}`,
  },
  description: branding.description,
  applicationName: branding.displayName,
  openGraph: {
    type: "website",
    siteName: branding.displayName,
    title: branding.displayName,
    description: branding.description,
  },
  twitter: {
    card: "summary_large_image",
    title: branding.displayName,
    description: branding.description,
  },
  robots: { index: true, follow: true },
};
```

- [ ] **Step 3: Drop the media slot fields from branding**

In `config/branding.ts`:

- delete the `favicon: { slot: "site.favicon" },` entry
- delete the `socialPreview: { slot: ..., width: 1200, height: 630 },` entry; after Step 2 nothing reads it (`grep -rn "branding.socialPreview\|branding.favicon" src config` prints nothing)
- in `src/app/opengraph-image.tsx:8`, change the doc comment to `/** Generated social preview. */`, since there is no slot to replace it
- in the file's opening comment, delete the paragraph that begins "Photos and social previews are resolved through media slots", and change "Pages read from this file and from the media slot system" to "Pages read from this file"

- [ ] **Step 4: Delete the database code and data**

```bash
git rm -r prisma supabase
git rm src/server/db.ts src/server/safe-db.ts src/server/env.ts src/server/services/media.ts src/server/services/events.ts src/lib/slug.ts content/media-manifest.json
rm -f prisma/dev.db
npm run typecheck
```

`src/server/services/events.ts` holds only `sampleFilter`, whose one caller was deleted in Task 3; `env.ts` was used only by it. Confirm before deleting: `grep -rn "sampleFilter\|server/env\|lib/slug" src` prints only the files being removed.

Expected: typecheck PASS. `src/server/services/portraits.ts` stays; it reads files, not the database.

- [ ] **Step 5: Update `next.config.ts` and `package.json`**

In `next.config.ts`: `serverExternalPackages: ["sharp"]`.

In `package.json`:

- `"build": "next build"`
- delete `postinstall`, `db:migrate`, `db:deploy`, `db:generate`, `db:studio`, `db:seed`, `db:reset`
- delete the top-level `"prisma": { "seed": ... }` block

Then:

```bash
npm uninstall @prisma/client prisma
grep -rn "tsx " package.json
```

`tsx` stays; `test:unit` uses it.

- [ ] **Step 6: Cut `.env.example` down to what the site reads**

Replace the whole of `.env.example`:

```bash
# ---------------------------------------------------------------------------
# Cybersecurity Club at GSU - environment configuration
# Copy this file to .env and fill in values. Never commit real secrets. .env and
# .env.* are gitignored; only this example is tracked.
# The site has no accounts and no database, so nothing here is secret.
# ---------------------------------------------------------------------------

# Public URL of the site (no trailing slash). REQUIRED in production.
# Used for the sitemap, canonical links and social previews.
APP_URL="http://localhost:3000"

# Public invite link shown to visitors (from the PIN organization profile).
NEXT_PUBLIC_DISCORD_INVITE_URL="https://discord.gg/Mpb6FRj8s6"
```

Confirm no other variable is read: `grep -rhn "process\.env\.[A-Z_]*" -o src config next.config.ts | sort -u` should list only `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DISCORD_INVITE_URL` and `NODE_ENV`. Add any other variable it finds to the file with a one-line comment.

Remove any `prisma` or `*.db` lines from `.gitignore`.

- [ ] **Step 7: Verify, including a build with no `.env`**

```bash
rm -rf .next
[ -f .env ] && mv .env .env.aside
npm run typecheck && npm run lint && npm run test:unit && npm run build
status=$?
[ -f .env.aside ] && mv .env.aside .env
[ $status -eq 0 ] && (PORT=3001 npm run start &)
npx playwright test --reporter=line
grep -rniE "prisma|safeDb|DATABASE_URL|supabase" src config e2e next.config.ts package.json .env.example
```

Expected: the build succeeds with no environment file and prints no Prisma step. All Playwright tests pass, apart from unrelated failures recorded in Task 1. The grep prints nothing. Always restore `.env`, even when the build fails.

Check the head of the homepage for icons and the social image:

```bash
curl -s http://localhost:3001/ | grep -oE '<(link|meta)[^>]*(icon|og:image|twitter:image)[^>]*>'
```

Expected: an icon link, an apple-touch-icon link, and `og:image` and `twitter:image` tags.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Remove Prisma, the database and the media slot system

Nothing on the site reads a database any more: events and the board are
TypeScript files and portraits are files on disk. Icons and the social
preview come from the files in src/app. The build is now plain
next build and needs no DATABASE_URL."
```

---

### Task 5: Bring the docs in line and do the final check

**Files:**
- Modify: `README.md`
- Delete or modify: `ASSET-UPLOAD-GUIDE.md`, `OBSERVATORY-REVIEW.md`

- [ ] **Step 1: Update `README.md`**

- Opening paragraph becomes: "The club website: home, events, challenges, resources and team. Built with Next.js (App Router). There is no database: events, the board and page content are files in `src/content/`." Keep the paragraph that says the site has no accounts.
- In the Checks table, the `test:unit` row's description becomes "Homepage network logic and event date handling". Add a row: `npm run verify` | "Typecheck, lint and unit tests".
- Delete the whole "Career exploration" section (from `## Career exploration` up to, not including, `## Retired member portal`).
- Replace the body of "Retired member portal" with:

```markdown
An earlier version had Supabase sign-in, member dashboards and a Prisma
database. That code, the schema and the migrations have been removed from this
repository; they remain in git history and on the `member-portal` branch.

Removing the schema here does not delete anything from a hosted database. If a
production database from that version still exists, it holds member records
and must be exported or deleted deliberately by the club. Requests about data
from the old accounts go to the privacy email listed on `/privacy`.
```

- [ ] **Step 2: Deal with the two guides that describe the media slot system**

Read `ASSET-UPLOAD-GUIDE.md` and `OBSERVATORY-REVIEW.md`. The first documents the database-backed media resolver and manifest that Task 4 deleted. If every instruction in it depends on the manifest or slots, `git rm ASSET-UPLOAD-GUIDE.md`; if part of it describes dropping files into `public/assets/` (which still works for team portraits and event flyers), keep only that part. `OBSERVATORY-REVIEW.md` is a dated review record of an earlier build; leave it unchanged unless it gives setup instructions that no longer work, in which case delete those instructions.

- [ ] **Step 3: Full verification against the spec**

```bash
rm -rf .next
npm run verify && npm run build && (PORT=3001 npm run start &)
npx playwright test --reporter=line
for p in / /events /challenges /resources /team /careers /careers/quiz /stories; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001$p)"
done
grep -rniE "careers|/stories|prisma|quiz" src e2e config --include=*.ts --include=*.tsx
git status --short
```

Expected: verify, build and all e2e tests pass. The first five paths print 200 and the last three print 404. The grep prints at most the member-stories sentence on the privacy page. `git status` shows only the README and guide changes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Update the README for the five-page site with no database"
```

- [ ] **Step 5: Report to the club**

In the final summary, list these for the club to act on; none can be done from the repository:

1. **Hosting:** change the build command if it runs `prisma generate` or `prisma migrate deploy`, and remove `DATABASE_URL`, `DATABASE_PROVIDER`, `PIN_*`, `CRON_SECRET` and `ALLOW_SAMPLE_DATA` from the host's environment.
2. **Old database:** if a production database exists, decide whether to export or delete it.
3. **Privacy page:** it still says "Member stories are published only with the member's explicit permission." The stories page is gone, so the club should decide whether to keep that sentence.
4. **Search engines:** `/careers/**` and `/stories` now return 404 and will drop out of search results over time.
