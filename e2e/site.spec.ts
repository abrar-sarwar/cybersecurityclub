import { expect, test } from "@playwright/test";

const LIVE = ["/", "/events", "/challenges", "/competitions", "/resources", "/team", "/privacy", "/accessibility"];
const GONE = ["/careers", "/careers/quiz", "/careers/projects", "/careers/results", "/stories", "/learn"];
const REMOVED_LINK = /^\/(careers|stories|learn)(\/|$|#|\?)/;

const NAV = [
  ["Home", "/"],
  ["Events", "/events"],
  ["Challenges", "/challenges"],
  ["Competitions", "/competitions"],
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

test("the header nav points at the six pages", async ({ page }) => {
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
  await expect(actions).toHaveClass(/btn-cyber-discord/);
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
  await expect(action).toHaveClass(/btn-cyber-discord/);
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

test("challenges and competitions are separate pages", async ({ page }) => {
  for (const [path, title] of [["/challenges", "Challenges"], ["/competitions", "Competitions"]]) {
    await page.goto(path);
    await expect(page).toHaveTitle(new RegExp(`^${title} · `));
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", new RegExp(`${path}$`));
  }
  await page.goto("/challenges");
  await expect(page.locator("#competitions")).toHaveCount(0);
  await expect(page.locator("main a[href='/competitions']")).toHaveCount(1);
});
