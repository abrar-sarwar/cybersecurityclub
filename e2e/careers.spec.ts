import { expect, test, type Page } from "@playwright/test";
import { CAREER_BY_ID, CAREER_PATHS } from "../src/content/careers/paths";
import { DIFFICULTY, LIBRARY_PROJECTS, byResumeWeight } from "../src/content/careers/projects";
import { GITHUB_WALKTHROUGH } from "../src/content/careers/github";
import { BOARD_HEADING, EXEC_BOARD } from "../src/content/club/board";
import { CLUB_PHOTOS } from "../src/content/club/photos";
import { EVENT_FLYERS, NCL, TEASERS } from "../src/content/club/flyers";
import { clubToday } from "../src/lib/dates";
import { QUESTIONS } from "../src/content/careers/questions";

const STORAGE_KEY = "cyber-careers-attempt";

type StoredAnswer = { kind: "choices"; optionIds: string[] } | { kind: "unsure" };

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

/** Stores a finished attempt so result states can be checked directly. */
async function seedAttempt(page: Page, picks: Record<string, string[]>, finished = true) {
  const answers: Record<string, StoredAnswer> = {};
  for (const question of QUESTIONS) {
    const chosen = picks[question.id];
    answers[question.id] = chosen ? { kind: "choices", optionIds: chosen } : { kind: "unsure" };
  }
  await page.addInitScript(
    ([key, value]) => {
      if (!window.sessionStorage.getItem(key)) window.sessionStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify({ version: 1, answers, position: QUESTIONS.length - 1, finished })],
  );
}

const option = (page: Page, text: string) => page.getByRole("checkbox", { name: text, exact: true });
const unsure = (page: Page) => page.getByRole("checkbox", { name: "Not sure yet", exact: true });
const questionHeading = (page: Page) => page.locator("#quiz-question");
const continueButton = (page: Page) => page.getByRole("button", { name: /^(Continue|See My Matches)$/ });

test("the landing page introduces the questionnaire and lists every path", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/careers");
  await expect(page.getByRole("heading", { level: 1, name: "Find your path in cybersecurity" })).toBeVisible();
  await expect(page.getByText("Answer 20 questions about the work that interests you.", { exact: false })).toBeVisible();
  await expect(page.getByText("No experience needed. Choose up to two answers per question, or select “Not sure yet.”")).toBeVisible();
  await expect(page.getByRole("link", { name: "Find My Path", exact: true }).first()).toHaveAttribute("href", "/careers/quiz");

  await page.getByRole("link", { name: "Explore All Paths" }).click();
  await expect(page).toHaveURL(/#paths$/);
  const list = page.locator("#paths");
  for (const path of CAREER_PATHS) {
    await expect(list.getByRole("link", { name: path.name, exact: true })).toHaveAttribute("href", `/careers/${path.slug}`);
  }
  expect(errors).toEqual([]);
});

test("every career path has a complete public page", async ({ page, request }) => {
  for (const path of CAREER_PATHS) {
    await page.goto(`/careers/${path.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: path.name })).toBeVisible();
    for (const heading of ["What people in this area work on", "Examples of everyday tasks", "Related job titles", path.project.title, "Project walkthrough", "What to publish", "Optional extension", "Example résumé bullet", "Turn your project into a portfolio piece", "Related paths to explore"]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.locator("#walkthrough ol > li")).toHaveCount(path.project.steps.length);
    await expect(page.getByText("Example, to adapt after completing the project")).toBeVisible();
    await expect(page.locator("#resume .careers-resume-line")).toContainText(path.project.resumeExample.stack[0]);
    await expect(page.locator("#resume .careers-metrics tbody tr")).toHaveCount(path.project.metrics.length);
    for (const id of path.related) {
      const related = CAREER_PATHS.find((candidate) => candidate.id === id)!;
      await expect(page.locator("#related").getByRole("link", { name: related.name, exact: true })).toHaveAttribute("href", `/careers/${related.slug}`);
    }
  }
  expect((await request.get("/careers/not-a-path")).status()).toBe(404);
});

test("answers allow one or two choices, and “Not sure yet” is exclusive", async ({ page }) => {
  await page.goto("/careers/quiz");
  const [a, b, c] = QUESTIONS[0].options.map((o) => o.text);
  await expect(page.getByText("Question 1 of 20", { exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Questionnaire progress" })).toHaveAttribute("aria-valuenow", "1");

  await option(page, a).check();
  await expect(option(page, a)).toBeChecked();
  await expect(page.getByText("1 of 2 chosen.")).toBeVisible();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[0].prompt);

  await option(page, b).check();
  await expect(page.getByText("2 of 2 chosen.")).toBeVisible();

  // A third choice is refused and explained in words.
  await option(page, c).click();
  await expect(option(page, c)).not.toBeChecked();
  await expect(page.getByRole("status").filter({ hasText: "You’ve already chosen two answers." })).toBeVisible();

  await unsure(page).check();
  await expect(unsure(page)).toBeChecked();
  await expect(option(page, a)).not.toBeChecked();
  await expect(option(page, b)).not.toBeChecked();

  await option(page, c).check();
  await expect(unsure(page)).not.toBeChecked();
  await expect(option(page, c)).toBeChecked();

  // Choosing never moves on by itself.
  await expect(questionHeading(page)).toHaveText(QUESTIONS[0].prompt);
});

test("an answer is required, Back keeps answers, and earlier answers can change", async ({ page }) => {
  await page.goto("/careers/quiz");
  await continueButton(page).click();
  await expect(page.getByRole("alert").filter({ hasText: "Choose at least one answer" })).toBeVisible();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[0].prompt);
  await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();

  await option(page, QUESTIONS[0].options[1].text).check();
  await continueButton(page).click();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[1].prompt);
  await expect(questionHeading(page)).toBeFocused();
  await expect(page.getByText("Question 2 of 20", { exact: true })).toBeVisible();

  await unsure(page).check();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[0].prompt);
  await expect(option(page, QUESTIONS[0].options[1].text)).toBeChecked();

  await option(page, QUESTIONS[0].options[1].text).uncheck();
  await option(page, QUESTIONS[0].options[3].text).check();
  await continueButton(page).click();
  await expect(unsure(page)).toBeChecked();

  const stored = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!), STORAGE_KEY);
  expect(stored.answers.q1).toEqual({ kind: "choices", optionIds: ["q1-d"] });
  expect(stored.answers.q2).toEqual({ kind: "unsure" });
});

test("the questionnaire works from the keyboard", async ({ page }) => {
  await page.goto("/careers/quiz");
  await option(page, QUESTIONS[0].options[0].text).focus();
  await page.keyboard.press("Space");
  await expect(option(page, QUESTIONS[0].options[0].text)).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(option(page, QUESTIONS[0].options[1].text)).toBeFocused();
  await page.keyboard.press("Space");
  await expect(option(page, QUESTIONS[0].options[1].text)).toBeChecked();

  const focusRing = await option(page, QUESTIONS[0].options[1].text).evaluate((input) => getComputedStyle(input.closest("label")!).outlineStyle);
  expect(focusRing).toBe("solid");

  await continueButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(questionHeading(page)).toHaveText(QUESTIONS[1].prompt);
  await expect(questionHeading(page)).toBeFocused();
});

test("scoring labels and career names are never shown beside answers", async ({ page }) => {
  await page.goto("/careers/quiz");
  const text = await page.locator("form").innerText();
  for (const path of CAREER_PATHS) expect(text).not.toContain(path.name);
  for (const id of ["soc", "offensive", "appsec", "intel", "iam", "grc", "forensics", "hunting", "malware"]) {
    expect(text.toLowerCase()).not.toMatch(new RegExp(`\\b${id}\\b`));
  }
});

test("opening the questionnaire always starts over, and a refresh keeps your place", async ({ page }) => {
  await seedAttempt(page, { q1: ["q1-a"], q2: ["q2-b"], q3: ["q3-c"] }, false);
  await page.goto("/careers");
  await page.getByRole("link", { name: "Find My Path", exact: true }).first().click();
  await expect(page).toHaveURL(/\/careers\/quiz$/);
  await expect(questionHeading(page)).toHaveText(QUESTIONS[0].prompt);
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);

  // Answers still survive a reload of the questionnaire itself.
  await option(page, QUESTIONS[0].options[2].text).check();
  await continueButton(page).click();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[1].prompt);
  await page.reload();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[1].prompt);

  // Opening it again from the site starts from scratch.
  await page.getByRole("link", { name: "Careers", exact: true }).first().click();
  await page.getByRole("link", { name: "Find My Path", exact: true }).first().click();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[0].prompt);
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
});

test("answering every question reaches results, survives a refresh, and retaking clears it", async ({ page }) => {
  test.slow();
  const errors = watchErrors(page);
  await page.goto("/careers/quiz");
  for (const [index, question] of QUESTIONS.entries()) {
    await expect(questionHeading(page)).toHaveText(question.prompt);
    const pick = question.options.find((o) => o.path === "hunting" || o.path === "intel");
    if (pick) await option(page, pick.text).check();
    else await unsure(page).check();
    if (index === 9) {
      await page.reload();
      await expect(questionHeading(page)).toHaveText(question.prompt);
      await expect(pick ? option(page, pick.text) : unsure(page)).toBeChecked();
    }
    if (index === QUESTIONS.length - 1) await expect(continueButton(page)).toHaveText(/See My Matches/);
    await continueButton(page).click();
  }

  await expect(page).toHaveURL(/\/careers\/results$/);
  await expect(page.getByRole("heading", { level: 1, name: "Your cybersecurity starting points" })).toBeFocused();
  const top = page.locator(".careers-summary-row").first();
  await expect(top.getByRole("link")).toHaveText("Threat Hunting / Detection");
  await expect(top.getByRole("link")).toHaveAttribute("href", "/careers/threat-hunting-detection");
  await expect(top.locator(".careers-summary-percent")).toHaveText(/^\d{1,3}%$/);
  // The bar fills to the match percentage.
  const fill = await top.locator(".careers-summary-fill").evaluate((el) => (el as HTMLElement).style.width);
  expect(fill).toMatch(/^\d{1,3}%$/);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Your cybersecurity starting points" })).toBeVisible();

  // Results offer one action: start again.
  await expect(page.getByRole("link", { name: "Explore All Paths" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Review My Answers" })).toHaveCount(0);
  await page.getByRole("button", { name: "Retake the Questionnaire" }).click();
  await expect(page).toHaveURL(/\/careers\/quiz$/);
  await expect(questionHeading(page)).toHaveText(QUESTIONS[0].prompt);
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), STORAGE_KEY)).toBeNull();
  expect(errors).toEqual([]);
});

test("changing a finished answer keeps matches available; clearing one asks to finish", async ({ page }) => {
  await seedAttempt(page, { q1: ["q1-a"], q2: ["q2-b"], q3: ["q3-b"], q5: ["q5-c"], q7: ["q7-c"], q11: ["q11-b"] });
  await page.goto("/careers/quiz?question=3");
  await expect(questionHeading(page)).toHaveText(QUESTIONS[2].prompt);
  await expect(page).toHaveURL(/\/careers\/quiz$/);
  // A finished attempt offers the shortcut in the button bar, not above the question.
  await expect(page.getByRole("link", { name: "See My Matches" })).toBeVisible();

  await option(page, QUESTIONS[2].options[0].text).check();
  await page.getByRole("link", { name: "See My Matches" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Your cybersecurity starting points" })).toBeVisible();
  // The changed answer now counts toward digital forensics.
  await expect(page.locator(".careers-summary-link", { hasText: "Digital Forensics" })).toHaveCount(1);

  await page.goto("/careers/quiz?question=1");
  await option(page, QUESTIONS[0].options[0].text).uncheck();
  await expect(page.getByRole("link", { name: "See My Matches" })).toHaveCount(0);
  await page.goto("/careers/results");
  await expect(page.getByRole("heading", { level: 1, name: "Finish the questionnaire to see your matches" })).toBeVisible();
  await page.getByRole("link", { name: "Continue the Questionnaire" }).click();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[0].prompt);
});

test("results without an attempt offer to start or browse", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/careers/results");
  await expect(page.getByRole("heading", { level: 1, name: "No questionnaire answers in this session" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Find My Path", exact: true }).last()).toHaveAttribute("href", "/careers/quiz");
  await expect(page.getByRole("link", { name: "Explore All Paths" })).toHaveAttribute("href", "/careers#paths");

  // Corrupt or expired session data behaves like no attempt.
  await page.evaluate((key) => sessionStorage.setItem(key, "{not json"), STORAGE_KEY);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "No questionnaire answers in this session" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("all “Not sure yet” answers show the exploration state", async ({ page }) => {
  await seedAttempt(page, {});
  await page.goto("/careers/results");
  await expect(page.getByRole("heading", { level: 1, name: "You’re still exploring" })).toBeVisible();
  await expect(page.locator(".careers-summary-row")).toHaveCount(0);
  for (const path of CAREER_PATHS) await expect(page.getByRole("link", { name: path.name, exact: true })).toBeVisible();
});

test("few specific answers are early suggestions with a way back to skipped questions", async ({ page }) => {
  await seedAttempt(page, { q1: ["q1-b"], q5: ["q5-a"] });
  await page.goto("/careers/results");
  await expect(page.getByText("Early suggestions", { exact: true })).toBeVisible();
  // Only paths with points appear: offensive security alone, never zero-score fillers.
  await expect(page.locator(".careers-summary-row")).toHaveCount(1);
  await expect(page.locator(".careers-summary-link")).toContainText("Offensive Security");
  await page.getByRole("link", { name: "Revisit skipped questions" }).click();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[1].prompt);
});

test("matches are ranked with a bar, a percentage and tied paths marked", async ({ page }) => {
  // hunting 5/7, intel 2/6, then soc and ir tied at 1/7.
  await seedAttempt(page, { q1: ["q1-a", "q1-d"], q3: ["q3-b"], q4: ["q4-b"], q6: ["q6-a"], q7: ["q7-c"], q14: ["q14-a"], q17: ["q17-b"], q20: ["q20-b"] });
  await page.goto("/careers/results");
  const rows = page.locator(".careers-summary-row");
  await expect(rows).toHaveCount(4);
  await expect(rows.locator(".careers-summary-link")).toHaveText([
    "Threat Hunting / Detection",
    "Threat Intelligence",
    "SOC Analysis",
    "Incident Response",
  ]);
  await expect(rows.locator(".careers-summary-percent")).toHaveText(["71%", "33%", "14%", "14%"]);
  // A clear leader means no tie labels anywhere, including the pair at 14%.
  await expect(page.getByText("Equally matched")).toHaveCount(0);
  // Every row opens its path, and nothing below needs scrolling.
  await expect(rows.nth(1).getByRole("link")).toHaveAttribute("href", "/careers/threat-intelligence");
  await expect(page.getByText("Click a path to learn more.")).toBeVisible();
  // The whole ranking sits inside the first screen.
  const panel = await page.locator(".careers-summary").boundingBox();
  expect(panel!.y + panel!.height).toBeLessThanOrEqual(900);
});

test("only a tie for first place is labeled", async ({ page }) => {
  // soc and offensive both take two of their seven options.
  await seedAttempt(page, { q1: ["q1-a", "q1-b"], q6: ["q6-c"], q5: ["q5-a"], q13: ["q13-b"], q20: ["q20-d"] });
  await page.goto("/careers/results");
  const rows = page.locator(".careers-summary-row");
  await expect(rows.nth(0).getByText("Equally matched")).toBeVisible();
  await expect(rows.nth(1).getByText("Equally matched")).toBeVisible();
  await expect(rows.nth(2).getByText("Equally matched")).toHaveCount(0);
});

test("a career page shows the work flow and a decision walkthrough", async ({ page }) => {
  await page.goto("/careers/soc-analysis");
  await expect(page.locator("#flow .career-flow-step")).toHaveCount(5);
  await expect(page.locator("#flow")).toContainText("Triage");

  const scenario = page.locator("#day");
  await scenario.scrollIntoViewIfNeeded();
  await expect(scenario.getByText("4,200 alerts overnight, 10 marked critical")).toBeVisible();
  const steps = scenario.locator(".scenario-step");
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(1)).toHaveAttribute("data-locked", "true");

  for (const index of [0, 1, 2]) {
    await steps.nth(index).locator(".scenario-option").first().click();
    await expect(steps.nth(index).locator(".scenario-verdict")).toBeVisible();
  }
  await expect(scenario.getByText("What you just practised")).toBeVisible();
  await expect(scenario.getByRole("link", { name: /Do it for real/ })).toHaveAttribute("href", "#project");
  await scenario.getByRole("button", { name: "Start over" }).click();
  await expect(scenario.locator(".scenario-verdict")).toHaveCount(0);
});

test("the write-up template copies and announces success", async ({ browser }) => {
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  await page.goto("/careers/threat-hunting-detection");
  // The example résumé line is name, tools and frameworks, then a link.
  await expect(page.getByRole("heading", { name: "Name it, then show your tools" })).toBeVisible();
  await expect(page.getByText("Project name | tools, datasets and frameworks | link").first()).toBeVisible();
  const example = page.locator(".careers-resume-line").first();
  await expect(example).toContainText("Beacon");
  await expect(example).toContainText("Sigma");
  await expect(example).toContainText("GitHub");
  await page.getByRole("button", { name: "Copy Write-Up Template" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Write-up template copied to your clipboard." })).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  for (const heading of ["## Goal", "## Environment", "## My work", "## Evidence", "## Findings", "## Fix or recommendation", "## Sources and limitations"]) {
    expect(clipboard).toContain(heading);
  }
  await context.close();
});

test("career pages fit a phone and keep large touch targets", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  for (const url of ["/careers", "/careers/quiz", "/careers/results", `/careers/${CAREER_PATHS[0].slug}`]) {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), url).toBeLessThanOrEqual(0);
  }
  await page.goto("/careers/quiz");
  const heights = await page.locator(".careers-option").evaluateAll((labels) => labels.map((label) => label.getBoundingClientRect().height));
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  await option(page, QUESTIONS[0].options[0].text).tap();
  await expect(option(page, QUESTIONS[0].options[0].text)).toBeChecked();
  await context.close();
});

test("reduced motion still runs the questionnaire", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/careers/quiz");
  await unsure(page).check();
  await continueButton(page).click();
  await expect(questionHeading(page)).toHaveText(QUESTIONS[1].prompt);
  await context.close();
});

test("the old learning addresses redirect into the careers hub", async ({ page }) => {
  await page.goto("/community");
  await expect(page).toHaveURL(/\/team$/);
  await expect(page.getByRole("heading", { name: BOARD_HEADING, exact: true })).toBeVisible();
  await page.goto("/learn");
  await expect(page).toHaveURL(/\/careers$/);
  await page.goto("/learn/paths/product-application-security");
  await expect(page).toHaveURL(/\/careers\/learning\/product-application-security$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the careers hub keeps its sections, with unwritten guides marked coming soon", async ({ page }) => {
  await page.goto("/careers");
  await expect(page.locator(".careers-jump a")).toHaveCount(4);
  for (const id of ["paths", "home-lab", "certifications", "interview-prep"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }

  // The learning-paths section is gone, and nothing links to its old anchor.
  await expect(page.locator("#learning")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Learning paths", exact: true })).toHaveCount(0);
  await expect(page.locator('a[href*="#learning"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Learn", exact: true })).toHaveCount(0);

  // Home lab, certifications and interview prep say so plainly.
  await expect(page.locator(".soon")).toHaveCount(3);
  for (const id of ["home-lab", "certifications", "interview-prep"]) {
    await expect(page.locator(`#${id}`).locator(".soon").first(), id).toContainText("Coming soon");
  }
});

test("the footer carries the social accounts and keeps the legal pages reachable", async ({ page }) => {
  await page.goto("/about");
  const socials = page.locator(".signal-footer-socials a");
  await expect(socials).toHaveCount(3);
  for (const [label, href] of [
    ["Discord", "https://discord.gg/Mpb6FRj8s6"],
    ["Instagram", "https://www.instagram.com/cybersecurityclubgsu/"],
    ["LinkedIn", "https://www.linkedin.com/company/cybersecurity-club-gsu/posts/?feedView=all"],
  ] as const) {
    const link = page.getByRole("link", { name: new RegExp(`^${label}`) });
    await expect(link, label).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
  }

  // The footer's Site column is gone, but privacy and accessibility are still linked.
  await expect(page.locator('footer nav[aria-label="Site"]')).toHaveCount(0);
  await expect(page.locator(".signal-footer-fine").getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  await expect(page.locator(".signal-footer-fine").getByRole("link", { name: "Accessibility" })).toHaveAttribute("href", "/accessibility");
});

test("account pages and sign-in prompts are gone, and public pages still work", async ({ page, request }) => {
  for (const path of ["/dashboard", "/onboarding", "/settings", "/admin", "/admin/members", "/sign-in", "/auth/confirm", "/verify-student-email", "/unsubscribe"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  for (const path of ["/", "/about", "/events", "/join", "/privacy", "/careers", "/careers/quiz", "/careers/learning/product-application-security"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }

  for (const path of ["/about", "/events", "/join", "/careers"]) {
    await page.goto(path);
    // Anchored, so project copy such as "Failed-Login Hunt" is not mistaken for an auth link.
    const authLabel = /^(log ?in|sign ?in|sign ?up|register( account)?|create account|my account|dashboard)$/i;
    await expect(page.getByRole("link", { name: authLabel }), path).toHaveCount(0);
    await expect(page.getByRole("button", { name: authLabel }), path).toHaveCount(0);
    await expect(page.locator('a[href*="sign-in"], a[href*="/login"], a[href*="/dashboard"], a[href*="/settings"]'), path).toHaveCount(0);
    await expect(page.locator("input[type=email], input[type=password]"), path).toHaveCount(0);
  }

  await page.goto("/careers");
  const header = page.locator("header.site-header");
  await expect(header.getByRole("link", { name: "Find My Path" }).first()).toHaveAttribute("href", "/careers/quiz");
  await expect(header.getByRole("link", { name: "Join Discord" })).toHaveAttribute("href", /^https:\/\/discord\.gg\//);

  // External RSVP links on events stay intact.
  await page.goto("/events");
  for (const rsvp of await page.getByRole("link", { name: "RSVP on PIN" }).all()) {
    await expect(rsvp).toHaveAttribute("href", /^https:\/\//);
  }
});

test("the project library ranks thirty projects and each opens a full walkthrough", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/careers/projects");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(`${LIBRARY_PROJECTS.length} projects`);
  const cards = page.locator(".project-card");
  await expect(cards).toHaveCount(LIBRARY_PROJECTS.length);

  // Ranked: the grid reads 1, 2, 3 ... in order, best first.
  const ranks = await page.locator(".project-card-rank").allInnerTexts();
  expect(ranks).toEqual(LIBRARY_PROJECTS.map((_, index) => String(index + 1).padStart(2, "0")));

  const top = LIBRARY_PROJECTS.find((project) => project.rank === 1)!;
  await cards.first().getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/careers/projects/${top.slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(top.title);

  // Everything a student needs to run it: framework, steps, names, publishing, résumé line.
  for (const framework of top.frameworks) {
    await expect(page.getByText(framework.name, { exact: true }).first()).toBeVisible();
  }
  await expect(page.locator(".project-names li")).toHaveCount(top.nameIdeas.length);
  expect(top.nameIdeas.length).toBeGreaterThanOrEqual(5);
  await expect(page.locator("#steps ol li")).toHaveCount(top.steps.length);
  await expect(page.locator(".gh-step")).toHaveCount(GITHUB_WALKTHROUGH.steps.length);
  await expect(page.getByText("git push", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".careers-resume-line")).toContainText(top.nameIdeas[0]);
  await expect(page.getByRole("link", { name: `About ${CAREER_BY_ID[top.path].name}` })).toHaveAttribute(
    "href",
    `/careers/${CAREER_BY_ID[top.path].slug}`,
  );

  expect(errors).toEqual([]);
});

test("every project page is reachable, and the library lives outside the careers hub", async ({ page, request }) => {
  for (const project of LIBRARY_PROJECTS) {
    expect((await request.get(`/careers/projects/${project.slug}`)).status(), project.slug).toBe(200);
  }

  // The careers hub no longer carries the library; the header does.
  await page.goto("/careers");
  await expect(page.locator("#projects")).toHaveCount(0);
  await expect(page.locator(".project-card")).toHaveCount(0);
  await page.locator("header.site-header").getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/careers\/projects$/);
});

test("difficulty filters and the résumé sort reorder the library", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/careers/projects");
  const visible = page.locator(".project-card:not([data-hidden])");
  await expect(visible).toHaveCount(LIBRARY_PROJECTS.length);

  for (const level of ["Easy", "Medium", "Hard"] as const) {
    const expected = LIBRARY_PROJECTS.filter((project) => DIFFICULTY[project.difficulty].label === level);
    await page.getByRole("button", { name: new RegExp(`^${level}`) }).click();
    await expect(page.getByRole("button", { name: new RegExp(`^${level}`) })).toHaveAttribute("aria-pressed", "true");
    await expect(visible).toHaveCount(expected.length);
    await expect(visible.first().locator(".project-card-title")).toHaveText(expected[0].title);
  }

  await page.getByRole("button", { name: /^All/ }).click();
  await expect(visible).toHaveCount(LIBRARY_PROJECTS.length);

  // Default order is the ranked one; the résumé sort puts the hard ones first.
  await expect(visible.first().locator(".project-card-title")).toHaveText(LIBRARY_PROJECTS[0].title);
  await page.getByRole("button", { name: "Best for résumé" }).click();
  const hardest = [...LIBRARY_PROJECTS].sort(byResumeWeight)[0];
  await expect(visible.first().locator(".project-card-title")).toHaveText(hardest.title);
  await expect(visible.first()).toHaveAttribute("data-level", "hard");
  await expect(visible.last()).toHaveAttribute("data-level", "easy");

  expect(errors).toEqual([]);
});

test("the board has its own page, linked from the nav and from About", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/about");

  // About hands off to the members page instead of listing officers itself.
  await expect(page.getByRole("heading", { name: "The exec board" })).toBeVisible();
  await page.getByRole("link", { name: "Meet the team" }).click();
  await expect(page).toHaveURL(/\/team$/);

  // The pyramid is the whole board: every person appears once, with no roster list.
  await expect(page.locator(".team-network .team-node")).toHaveCount(EXEC_BOARD.length);
  await expect(page.getByRole("heading", { name: BOARD_HEADING, exact: true })).toBeVisible();
  await expect(page.locator(".board-lines")).toHaveCount(0);
  await expect(page.locator(".board-card")).toHaveCount(0);
  expect(EXEC_BOARD.some((member) => member.slug === "luigi")).toBe(false);
  for (const member of EXEC_BOARD) {
    await expect(page.locator(".team-node-name").filter({ hasText: member.name })).toHaveCount(1);
    // Roles stay on the diagram; what each seat does no longer appears anywhere.
    await expect(page.getByText(member.remit)).toHaveCount(0);
  }

  // Projects and Members sit in the header next to Careers.
  const nav = page.locator("header.site-header nav[aria-label='Site']");
  await expect(nav.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/careers/projects");
  await expect(nav.getByRole("link", { name: "Team" })).toHaveAttribute("href", "/team");
  await nav.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/careers\/projects$/);

  expect(errors).toEqual([]);
});

test("board profiles open LinkedIn from the pyramid", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/team");

  const linked = EXEC_BOARD.filter((member) => member.linkedin);
  expect(linked.length).toBeGreaterThan(0);

  for (const member of linked) {
    const node = page.locator(`.team-network a[href="${member.linkedin}"]`);
    await expect(node, `${member.name} node`).toHaveCount(1);
    await expect(node).toHaveAttribute("target", "_blank");
    await expect(node).toHaveAttribute("rel", /noopener/);
    await expect(node.locator(".team-node-name")).toHaveText(member.name);
  }

  // Officers without a profile are shown, but never wrapped in an empty link.
  for (const member of EXEC_BOARD.filter((m) => !m.linkedin)) {
    const group = page.locator(".team-node").filter({ hasText: member.name });
    await expect(group, member.name).toHaveCount(1);
    await expect(group.locator("a")).toHaveCount(0);
  }

  expect(errors).toEqual([]);
});

test("club photos and member quotes render, and the photos actually load", async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto("/about");
  // The photographs now sit behind the hero rather than in a section of their own.
  const photos = page.locator(".hero-photo");
  await expect(photos).toHaveCount(CLUB_PHOTOS.length);
  await expect(page.getByRole("heading", { name: "What meetings actually look like" })).toHaveCount(0);

  // Exactly one is shown at a time and it decodes; a broken file fails here.
  await expect(page.locator(".hero-photo[data-active]")).toHaveCount(1);
  const lead = page.locator(".hero-photo[data-active]");
  await expect(lead).toHaveJSProperty("complete", true);
  expect(await lead.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  // Decorative behind text, so they are hidden from assistive tech.
  await expect(page.locator(".hero-photos")).toHaveAttribute("aria-hidden", "true");

  // The backdrop advances on its own.
  const shown = () => page.locator(".hero-photo[data-active]").getAttribute("src");
  const first = await shown();
  await expect.poll(shown, { timeout: 9000 }).not.toBe(first);

  // The values column is paired with the simulated threat feed, labelled as such.
  await page.locator(".values-split").scrollIntoViewIfNeeded();
  await expect(page.locator(".feed")).toBeVisible();
  await expect(page.locator(".feed-sim")).toHaveText("Simulated");
  await expect(page.locator(".feed")).toHaveAttribute("aria-hidden", "true");
  const top = () => page.locator(".feed-line").first().innerText();
  const firstLine = await top();
  await expect.poll(top, { timeout: 9000 }).not.toBe(firstLine);

  const quote = page.locator(".voice").first();
  await expect(quote).toContainText("made my college degree worth it");
  await expect(quote.getByRole("link", { name: /Emran H\./ })).toHaveAttribute("href", "https://www.linkedin.com/in/emran-habib/");
  await expect(quote).toContainText("Ex President of Cybersecurity Club");
  // Space is held for the quotes still to come.
  await expect(page.locator(".voice-pending")).toHaveCount(2);
  await expect(quote.locator(".voice-photo")).toHaveJSProperty("complete", true);

  // The values read as a decoded trace, not a grid of cards.
  await page.locator(".values").scrollIntoViewIfNeeded();
  await expect(page.locator(".value-row")).toHaveCount(4);
  await expect(page.locator(".value-row[data-shown]").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Beginners are welcome, and we mean it" })).toBeVisible();

  await page.goto("/events");
  // Events live in one place now, under Upcoming events.
  await expect(page.getByRole("heading", { name: "Upcoming events" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Fall 2026 board" })).toHaveCount(0);

  // The CTF call-out sits above the timeline.
  const ctfY = (await page.locator(".ctf").boundingBox())!.y;
  const railY = (await page.locator(".rail").boundingBox())!.y;
  expect(ctfY).toBeLessThan(railY);

  // The NCL call-out links straight out to the interest form.
  const form = page.getByRole("link", { name: /Interest form/ });
  await expect(form).toHaveAttribute("href", NCL.formUrl);
  await expect(form).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("heading", { name: NCL.heading })).toBeVisible();

  // The term is one compact rail: a stop per session, then the locked slots.
  await expect(page.locator(".rail-stop")).toHaveCount(EVENT_FLYERS.length + TEASERS.length);
  for (const flyer of EVENT_FLYERS) {
    const stop = page.locator(".rail-stop").filter({ hasText: flyer.title }).first();
    await expect(stop, flyer.title).toContainText(flyer.date);
    await expect(stop.locator("time")).toHaveAttribute("datetime", flyer.datetime);
  }
  await expect(page.locator(".rail-stop-locked")).toHaveCount(TEASERS.length);
  await expect(page.locator(".rail-banner")).toContainText("Cybersecurity Awareness Month");

  // Sessions are ticked or pending strictly by date, and exactly one is next.
  const today = clubToday();
  const held = EVENT_FLYERS.filter((flyer) => flyer.datetime < today);
  await expect(page.locator('.rail-stop[data-state="done"]')).toHaveCount(held.length);
  await expect(page.locator('.rail-stop[data-state="next"]')).toHaveCount(held.length < EVENT_FLYERS.length ? 1 : 0);

  // Each session shows its flyer as a thumbnail, and it is not a link or a button.
  const thumbs = page.locator(".rail-stop:not(.rail-stop-locked) .rail-thumb img");
  await expect(thumbs).toHaveCount(EVENT_FLYERS.length);
  for (let i = 0; i < EVENT_FLYERS.length; i++) {
    await expect(thumbs.nth(i)).toHaveJSProperty("complete", true);
    expect(await thumbs.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  }
  await expect(page.locator(".rail-stop a, .rail-stop button")).toHaveCount(0);

  // Locked slots carry a platform mark instead of a flyer.
  await expect(page.locator(".rail-thumb-locked img")).toHaveCount(TEASERS.length);

  expect(errors).toEqual([]);
});

test("the board and the timeline are usable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/team");
  // The pyramid needs width it does not have here, so the card grid stands in.
  await expect(page.locator(".team-network")).toBeHidden();
  const cards = page.locator(".board-cards li");
  await expect(cards).toHaveCount(EXEC_BOARD.length);
  for (const member of EXEC_BOARD) {
    await expect(page.locator(".board-cards").getByText(member.name, { exact: true })).toHaveCount(1);
  }
  // Profiles still open from the cards.
  const linked = EXEC_BOARD.filter((m) => m.linkedin);
  await expect(page.locator(".board-cards a[href^='https://www.linkedin.com']")).toHaveCount(linked.length);

  await page.goto("/events");
  await expect(page.locator(".rail-stop")).toHaveCount(EVENT_FLYERS.length + TEASERS.length);
  await expect(page.locator(".rail-thumb img").first()).toHaveJSProperty("complete", true);

  // Nothing may push the page sideways on a phone.
  for (const path of ["/", "/about", "/team", "/events", "/careers", "/careers/projects"]) {
    await page.goto(path);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, path).toBeLessThanOrEqual(390);
  }
});

test("the mobile menu opens over the page and navigates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/careers");

  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // The header sets a backdrop-filter, which would otherwise trap the fixed
  // overlay inside the header's own box: it must cover the whole viewport.
  const overlay = page.locator(".signal-menu-panel");
  const box = (await overlay.boundingBox())!;
  expect(box.height).toBeGreaterThan(700);
  // Opaque, so the page cannot read through it.
  await expect(overlay).toHaveCSS("background-color", "rgb(2, 7, 20)");

  // Every nav link is reachable and the current page is marked.
  for (const label of ["About", "Events", "Careers", "Projects", "Team"]) {
    await expect(dialog.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(dialog.getByRole("link", { name: "Careers", exact: true })).toHaveAttribute("aria-current", "page");

  await dialog.getByRole("link", { name: "Team", exact: true }).click();
  await expect(page).toHaveURL(/\/team$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
