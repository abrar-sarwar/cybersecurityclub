import { expect, test } from "@playwright/test";

test("the events page lists, charts and archives events from the database", async ({ page }) => {
  await page.goto("/events");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Workshops, meetings and competitions");
  await expect(page.getByRole("heading", { name: "Upcoming events" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  await expect(page.locator("table caption")).toHaveText(/^Events in [A-Z][a-z]+ \d{4}$/);
  await expect(page.getByRole("heading", { name: "Past events" })).toBeVisible();
  // The events the site shipped with are seeded in the table, so the archive is never empty.
  await expect(page.locator("#past-events")).toContainText("Resume Workshop");
});

test("the calendar's agenda opens an event's details in a dialog", async ({ page }) => {
  await page.goto("/events");
  await page.getByRole("button", { name: "Agenda" }).click();
  await page.getByRole("button", { name: "Previous month" }).click({ clickCount: 1 });
  // Walk back to September 2026, where the seeded events are, from whatever month it is now.
  for (let i = 0; i < 36 && !(await page.getByText(/^September 2026$/).isVisible()); i++) {
    await page.getByRole("button", { name: "Previous month" }).click();
  }
  await page.getByRole("button", { name: /Resume Workshop/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Resume Workshop" })).toBeVisible();
  await expect(dialog).toContainText("5:30 to 7:30 PM");
  await expect(dialog).toContainText("CLSO 150");
  await page.getByRole("button", { name: "Close event details" }).click();
  await expect(dialog).toBeHidden();
});

test("the homepage spotlight shows upcoming events or says why not", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("section[aria-labelledby='home-events']");
  await expect(section.getByRole("heading", { name: "Upcoming events" })).toBeVisible();
  await expect(section).not.toContainText("Loading events");
  await expect(section.locator("li, .signal-empty").first()).toBeVisible();
});

test("a homepage event card leads to that event on the events page", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("section[aria-labelledby='home-events'] li a").first();
  test.skip((await card.count()) === 0, "no upcoming events to click");
  const href = await card.getAttribute("href");
  expect(href).toMatch(/^\/events#event-[A-Za-z0-9_-]+$/);
  await card.click();
  await page.waitForURL(/\/events#event-/);
  const target = page.locator(`[id="${href!.split("#")[1]}"]`);
  await expect(target).toBeVisible();
  await expect(target.getByRole("link", { name: /Register|Find it on PIN/ }).first()).toBeVisible();
});
