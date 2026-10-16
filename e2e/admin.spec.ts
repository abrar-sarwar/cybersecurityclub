import { expect, test } from "@playwright/test";

test("signed-out visitors to /admin are sent to the login page", async ({ request }) => {
  const res = await request.get("/admin", { maxRedirects: 0 });
  expect([302, 307, 308]).toContain(res.status());
  expect(res.headers()["location"]).toMatch(/\/admin\/login$/);
});

test("admin pages are never cached or indexed", async ({ request }) => {
  const res = await request.get("/admin/login");
  expect(res.status()).toBe(200);
  // `next start` sends no-store for dynamic pages; `next dev` sends no-cache.
  expect(res.headers()["cache-control"]).toMatch(/no-store|no-cache/);
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
});

test("a wrong password stays on the login page", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Officer password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  // The Next.js route announcer is also role="alert", so target the form's own message.
  await expect(page.locator("p.adm-error")).toContainText("not right");
  expect(page.url()).toContain("/admin/login");
});

test("the right password reaches the event list", async ({ page }) => {
  const password = process.env.ADMIN_PASSWORD;
  test.skip(!password, "ADMIN_PASSWORD is not set in the test environment");
  await page.goto("/admin/login");
  await page.getByLabel("Officer password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
});
