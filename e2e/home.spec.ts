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
    for (const name of ["About", "Events", "Community", "Join the club", "Log In"]) {
      await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    }

    const report = await page.evaluate(() => {
      const box = (r: DOMRect) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
      const heading = document.createRange();
      heading.selectNodeContents(document.querySelector("#cyber-home-heading")!);
      const content = [
        ...[...heading.getClientRects()].map(box),
        ...[...document.querySelectorAll(".cyber-home-actions a, .cyber-home-nav a")].map((el) => box(el.getBoundingClientRect())),
      ];
      const distance = (x: number, y: number, r: ReturnType<typeof box>) =>
        Math.hypot(x - Math.max(r.x, Math.min(x, r.x + r.width)), y - Math.max(r.y, Math.min(y, r.y + r.height)));

      const svg = [...document.querySelectorAll<SVGSVGElement>(".network-canvas")].find((el) => getComputedStyle(el).display !== "none")!;
      const matrix = svg.getScreenCTM()!;
      let traceGap = Infinity;
      for (const path of svg.querySelectorAll<SVGPathElement>(".network-trace")) {
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
      const horizon = document.querySelector(".cyber-horizon")!.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        traceGap,
        hitGap,
        offscreen,
        horizonVisible: innerHeight - horizon.top,
      };
    });

    expect(report.overflow).toBeLessThanOrEqual(0);
    expect(report.traceGap).toBeGreaterThan(16);
    expect(report.hitGap).toBeGreaterThan(8);
    expect(report.offscreen).toEqual([]);
    expect(report.horizonVisible).toBeGreaterThan(20);
    expect(report.horizonVisible).toBeLessThan(80);

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
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const horizonStyle = () => page.locator(".cyber-horizon").evaluate((el) => getComputedStyle(el).boxShadow);
  const blueHorizon = await horizonStyle();

  for (const id of ["north-west-junction", "north-west-tip", ...ONE_PER_BRANCH.slice(1, 5)]) await star(page, id).click();
  await expect(phase(page)).toHaveAttribute("data-phase", "idle");
  await expect(page.getByRole("status")).toHaveText("5 of 6 branches connected.");

  await star(page, ONE_PER_BRANCH[5]).click();
  await expect(phase(page)).toHaveAttribute("data-phase", "charging");
  await expect(page.getByRole("status")).toHaveText("All six branches connected. The shield is charged.");
  await expect(star(page, "east-junction")).toHaveAttribute("aria-disabled", "true");
  await star(page, "east-junction").click({ force: true });
  await expect(star(page, "east-junction")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".shield-logo-alert")).toHaveCSS("opacity", "1");
  expect(await horizonStyle()).toBe(blueHorizon);

  await expect(phase(page)).toHaveAttribute("data-phase", "fading");
  await star(page, "east-junction").click({ force: true });
  await expect(star(page, "east-junction")).toHaveAttribute("aria-pressed", "false");

  await expect(phase(page)).toHaveAttribute("data-phase", "idle");
  await expect(phase(page)).toHaveAttribute("data-cycle", "1");
  await expect(canvas(page).locator('[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator(".shield-logo-alert")).toHaveCSS("opacity", "0");

  for (const id of ONE_PER_BRANCH) await star(page, id).click();
  await expect(phase(page)).toHaveAttribute("data-cycle", "2");
  expect(errors).toEqual([]);
});

test("the network is one tab stop with arrow-key movement", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "Log In" }).focus();
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
  await expect(star(page, "west-tip")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.locator(".network-node:focus")).toHaveCount(0);
});

test("touch completes the sequence on a phone", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
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

test("homepage links reach their pages", async ({ page, request }) => {
  await page.goto("/");
  for (const [name, path] of [["About", "/about"], ["Events", "/events"], ["Community", "/community"], ["Join the club", "/join"]]) {
    const href = await page.getByRole("link", { name, exact: true }).getAttribute("href");
    expect(href).toBe(path);
    expect((await request.get(path)).status()).toBe(200);
  }
  await expect(page.getByRole("link", { name: "Log In", exact: true })).toHaveAttribute("href", "/join#sign-in");
});
