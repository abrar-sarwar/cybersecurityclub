import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
];

const ONE_PER_BRANCH = ["north-west-tip", "north-east-branch", "east-outer", "south-east-junction", "south-west-tip", "west-branch"];

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

const INTRO_PLAYED = () => window.sessionStorage.setItem("cyber-home-intro-played", "1");

type PhaseRecord = { phase: string; pressed: number; locked: boolean; shieldRed: number };

/**
 * Samples the network every animation frame from page load, so short phases
 * (the fade, the red shield) are verified without racing their timers.
 */
function recordPhases() {
  const records: PhaseRecord[] = [];
  (window as unknown as { phases: PhaseRecord[] }).phases = records;
  const sample = () => {
    const stage = document.querySelector(".network-experience");
    const svg = [...document.querySelectorAll<SVGSVGElement>(".network-canvas")].find((el) => getComputedStyle(el).display !== "none");
    const alert = document.querySelector(".shield-logo-alert");
    if (stage && svg && alert) {
      const phase = stage.getAttribute("data-phase") ?? "";
      const nodes = [...svg.querySelectorAll(".network-node")];
      const pressed = nodes.filter((node) => node.getAttribute("aria-pressed") === "true").length;
      const locked = nodes.every((node) => node.getAttribute("aria-disabled") === "true");
      const shieldRed = Number(getComputedStyle(alert).opacity);
      const last = records.at(-1);
      if (!last || last.phase !== phase) records.push({ phase, pressed, locked, shieldRed });
      else Object.assign(last, { pressed: Math.max(last.pressed, pressed), locked: last.locked && locked, shieldRed: Math.max(last.shieldRed, shieldRed) });
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
}

const phaseRecords = (page: Page) => page.evaluate(() => (window as unknown as { phases: PhaseRecord[] }).phases);

// Most tests start after the opening sequence; it has its own test below.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(INTRO_PLAYED);
});

const canvas = (page: Page) => page.locator(".network-canvas:visible");
const star = (page: Page, id: string) => canvas(page).locator(`[data-node="${id}"]`);
const phase = (page: Page) => page.locator(".network-experience");

for (const viewport of VIEWPORTS) {
  test(`layout keeps content clear at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    await expect(page.getByRole("heading", { level: 1, name: "Cybersecurity Club at GSU" })).toBeVisible();
    for (const name of ["About", "Events", "Careers", "Explore Career Paths", "Join Discord"]) {
      await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    }

    const report = await page.evaluate(() => {
      const box = (r: DOMRect) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
      const heading = document.createRange();
      heading.selectNodeContents(document.querySelector("#cyber-home-heading")!);
      const description = document.createRange();
      description.selectNodeContents(document.querySelector(".cyber-home-description")!);
      const content = [
        ...[...heading.getClientRects()].map(box),
        ...[...description.getClientRects()].map(box),
        ...[...document.querySelectorAll(".cyber-home-actions a, .cyber-home-nav a")].map((el) => box(el.getBoundingClientRect())),
      ];
      const distance = (x: number, y: number, r: ReturnType<typeof box>) =>
        Math.hypot(x - Math.max(r.x, Math.min(x, r.x + r.width)), y - Math.max(r.y, Math.min(y, r.y + r.height)));

      const svg = [...document.querySelectorAll<SVGSVGElement>(".network-canvas")].find((el) => getComputedStyle(el).display !== "none")!;
      const matrix = svg.getScreenCTM()!;
      let traceGap = Infinity;
      for (const path of svg.querySelectorAll<SVGPathElement>(".network-trace, .network-feeder")) {
        for (let length = 0; length <= path.getTotalLength(); length += 3) {
          const point = path.getPointAtLength(length).matrixTransform(matrix);
          for (const rect of content) traceGap = Math.min(traceGap, distance(point.x, point.y, rect));
        }
      }
      let hitGap = Infinity;
      const offscreen: string[] = [];
      for (const node of svg.querySelectorAll<SVGGElement>(".network-node")) {
        const hit = node.querySelector(".node-hit")!.getBoundingClientRect();
        if (hit.left < 0 || hit.right > innerWidth) offscreen.push(node.dataset.node!);
        for (const rect of content) {
          hitGap = Math.min(hitGap, distance(hit.x + hit.width / 2, hit.y + hit.height / 2, rect) - hit.width / 2);
        }
      }
      // Earth stays a thin sliver at the bottom of the homepage section (which may scroll on phones).
      const horizon = document.querySelector(".cyber-horizon")!.getBoundingClientRect();
      const section = document.querySelector(".cyber-home")!.getBoundingClientRect();
      const logos = document.querySelector(".internship-window")!.getBoundingClientRect();
      const actions = document.querySelector(".cyber-home-actions")!.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        traceGap,
        hitGap,
        offscreen,
        horizonVisible: section.bottom - horizon.top,
        logosBelowButtons: logos.top - actions.bottom,
        logosAboveHorizon: horizon.top - logos.bottom,
      };
    });

    expect(report.overflow).toBeLessThanOrEqual(0);
    expect(report.traceGap).toBeGreaterThan(16);
    expect(report.hitGap).toBeGreaterThan(8);
    expect(report.offscreen).toEqual([]);
    expect(report.horizonVisible).toBeGreaterThan(20);
    expect(report.horizonVisible).toBeLessThan(80);
    expect(report.logosBelowButtons).toBeGreaterThan(20);
    expect(report.logosAboveHorizon).toBeGreaterThan(8);

    const unclickable = await page.evaluate(() => {
      const svg = [...document.querySelectorAll<SVGSVGElement>(".network-canvas")].find((el) => getComputedStyle(el).display !== "none")!;
      return [...svg.querySelectorAll<SVGGElement>(".network-node")]
        .filter((node) => {
          const dot = node.querySelector(".node-visible")!.getBoundingClientRect();
          const hit = document.elementFromPoint(dot.x + dot.width / 2, dot.y + dot.height / 2);
          return (hit?.closest(".network-node") as SVGGElement | null)?.dataset.node !== node.dataset.node;
        })
        .map((node) => node.dataset.node);
    });
    expect(unclickable).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("one star per branch charges the shield, locks, and resets", async ({ page }) => {
  test.slow(); // Waits for two full animation cycles.
  const errors = watchErrors(page);
  await page.addInitScript(recordPhases);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const horizonStyle = () => page.locator(".cyber-horizon").evaluate((el) => getComputedStyle(el).boxShadow);
  const blueHorizon = await horizonStyle();

  for (const id of ["north-west-junction", "north-west-tip", ...ONE_PER_BRANCH.slice(1, 5)]) await star(page, id).click();
  await expect(phase(page)).toHaveAttribute("data-phase", "idle");
  await expect(page.getByRole("status")).toHaveText("5 of 6 branches connected.");

  await star(page, ONE_PER_BRANCH[5]).click();
  await expect(page.getByRole("status")).toHaveText(/All six branches connected|Network reset/);
  expect(await horizonStyle()).toBe(blueHorizon);

  await expect(phase(page)).toHaveAttribute("data-cycle", "1", { timeout: 8_000 });
  await expect(phase(page)).toHaveAttribute("data-phase", "idle");
  const records = await phaseRecords(page);
  expect(records.map((record) => record.phase)).toEqual(["idle", "charging", "fading", "idle"]);
  const [, charging, fading] = records;
  expect(charging).toMatchObject({ pressed: 7, locked: true });
  expect(charging.shieldRed).toBeGreaterThan(0.95);
  expect(fading.locked).toBe(true);
  await expect(canvas(page).locator('[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator(".shield-logo-alert")).toHaveCSS("opacity", "0");
  expect(await horizonStyle()).toBe(blueHorizon);

  for (const id of ONE_PER_BRANCH) await star(page, id).click();
  await expect(phase(page)).toHaveAttribute("data-cycle", "2", { timeout: 8_000 });
  expect(errors).toEqual([]);
});

test("the opening sequence plays once per session, then hands over the network", async ({ browser }) => {
  test.slow(); // Waits for the full opening sequence and a reload.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(recordPhases);
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto("/");

  await expect(phase(page)).toHaveAttribute("data-cycle", "1", { timeout: 10_000 });
  await expect(phase(page)).toHaveAttribute("data-phase", "idle");
  const records = await phaseRecords(page);
  expect(records.map((record) => record.phase)).toEqual(["idle", "intro", "charging", "fading", "idle"]);
  const [, intro, charging] = records;
  expect(intro).toMatchObject({ pressed: 48, locked: true });
  expect(charging.shieldRed).toBeGreaterThan(0.95);
  await expect(page.getByRole("status")).toHaveText("");

  await expect(canvas(page).locator('[aria-pressed="true"]')).toHaveCount(0);
  await star(page, "north-west-tip").click();
  await expect(star(page, "north-west-tip")).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await page.waitForTimeout(2_000);
  expect((await phaseRecords(page)).map((record) => record.phase)).toEqual(["idle"]);
  expect(errors).toEqual([]);
  await context.close();
});

test("the internship logos are fully visible without scrolling", async ({ browser }) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 1280, height: 640 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width < 820 });
    await context.addInitScript(INTRO_PLAYED);
    const page = await context.newPage();
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const logos = await page.locator(".internship-window").boundingBox();
    const size = `${viewport.width}×${viewport.height}`;
    expect(logos, size).not.toBeNull();
    expect(logos!.y, size).toBeGreaterThan(0);
    expect(logos!.y + logos!.height, size).toBeLessThanOrEqual(viewport.height);
    await expect(page.getByRole("heading", { name: "Our members got internships at" }), size).toBeInViewport({ ratio: 1 });
    await context.close();
  }
});

test("signals travel along the feeder lines and traces while idle", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const svg = canvas(page);
  await expect(svg.locator(".network-feeder")).toHaveCount(12);
  await expect(svg.locator(".signal-head")).toHaveCount(12);
  await expect(svg.locator(".signal-outward")).toHaveCount(12);
  const head = svg.locator(".signal-head").first();
  await expect(head).toHaveCSS("animation-name", "signal-travel");
  const offset = () => head.evaluate((el) => getComputedStyle(el).strokeDashoffset);
  const before = await offset();
  await page.waitForTimeout(300);
  expect(await offset()).not.toBe(before);

  // Signals pause while the shield charges.
  for (const id of ONE_PER_BRANCH) await star(page, id).click();
  await expect(phase(page)).toHaveAttribute("data-phase", "charging");
  await expect(svg.locator(".ambient-pulses")).toHaveCSS("visibility", "hidden");
  await expect(phase(page)).toHaveAttribute("data-phase", "idle");
  await expect(svg.locator(".ambient-pulses")).toHaveCSS("visibility", "visible");
});

test("the network is one tab stop with arrow-key movement", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "Join Discord" }).focus();
  await page.keyboard.press("Tab");
  await expect(star(page, "north-west-junction")).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(star(page, "north-west-branch")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(star(page, "north-west-branch")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(star(page, "north-west-branch")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(star(page, "west-beacon")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.locator(".network-node:focus")).toHaveCount(0);
});

test("touch completes the sequence on a phone", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await context.addInitScript(INTRO_PLAYED);
  const page = await context.newPage();
  await page.goto("/");
  for (const id of ONE_PER_BRANCH) await star(page, id).locator(".node-hit").tap();
  await expect(phase(page)).toHaveAttribute("data-phase", "charging");
  await expect(phase(page)).toHaveAttribute("data-phase", "idle");
  await expect(canvas(page).locator('[aria-pressed="true"]')).toHaveCount(0);
  await context.close();
});

test("reduced motion skips pulses and shake but still completes", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  for (const id of ONE_PER_BRANCH) await star(page, id).click();
  await expect(phase(page)).toHaveAttribute("data-phase", "charging");
  await expect(canvas(page).locator(".charge-head").first()).toBeHidden();
  await expect(canvas(page).locator(".ambient-pulses")).toBeHidden();
  await expect(page.locator(".shield-logo")).toHaveCSS("animation-name", "none");
  await expect(phase(page)).toHaveAttribute("data-phase", "idle");
  await context.close();
});

test("the heading glitches on hover and the internship logos scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Cybersecurity Club at GSU", exact: true })).toBeVisible();
  await expect(page.getByText("Georgia State students who learn, build, and compete in security.")).toBeVisible();

  const glitch = page.locator(".glitch-layer-red");
  await expect(glitch).toHaveCSS("animation-name", "none");
  await page.locator("#cyber-home-heading").hover();
  await expect(glitch).toHaveCSS("animation-name", "glitch-slice-red");
  await page.mouse.move(5, 5);
  await expect(glitch).toHaveCSS("animation-name", "none");

  const strip = page.getByRole("region", { name: "Our members got internships at" });
  const names = ["IBM", "Palo Alto Networks", "CrowdStrike", "USPS", "Equifax", "Grady Health", "Steampunk Inc", "State Farm", "GTRI"];
  for (const name of names) {
    const logo = strip.getByRole("img", { name, exact: true });
    await expect(logo).toHaveCount(1);
    expect(await logo.evaluate((img: HTMLImageElement) => img.complete || img.loading === "lazy")).toBe(true);
  }
  await expect(strip.getByText("AARC").first()).toBeVisible();
  await expect(strip.locator(".internship-track")).toHaveCSS("animation-name", "internship-scroll");
  const shift = () => strip.locator(".internship-track").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  const before = await shift();
  await page.waitForTimeout(400);
  expect(await shift()).not.toBe(before);

  // Hovering the logos does not pause the scroll.
  await strip.locator(".internship-window").hover();
  const hovered = await shift();
  await page.waitForTimeout(400);
  expect(await shift()).not.toBe(hovered);
});

test("reduced motion shows the internship logos as a still list", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const strip = page.getByRole("region", { name: "Our members got internships at" });
  await expect(strip.locator(".internship-track")).toHaveCSS("animation-name", "none");
  await expect(strip.locator(".internship-list-copy")).toBeHidden();
  for (const img of await strip.locator(".internship-list:not(.internship-list-copy) img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toBeInViewport();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await context.close();
});

test("homepage links reach their pages", async ({ page, request }) => {
  await page.goto("/");
  for (const [name, path] of [["About", "/about"], ["Events", "/events"], ["Careers", "/careers"], ["Explore Career Paths", "/careers"]]) {
    const href = await page.getByRole("link", { name, exact: true }).getAttribute("href");
    expect(href).toBe(path);
    expect((await request.get(path)).status()).toBe(200);
  }
  const discord = page.getByRole("link", { name: "Join Discord", exact: true });
  await expect(discord).toHaveAttribute("href", /^https:\/\/discord\.gg\//);
  await expect(discord).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: /log in|sign in|sign up|register/i })).toHaveCount(0);
});
