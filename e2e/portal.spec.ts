import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import type { Database } from "../src/lib/supabase/database.types";
import { createVerificationToken, hashToken, signUnsubscribeToken } from "../src/lib/tokens";

/**
 * Member portal flows against a real Supabase project (normally the local
 * stack from `supabase start`). Skipped unless these are set for the test run:
 * NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * SUPABASE_SECRET_KEY and APP_SECRET (the same values the app server uses).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const appSecret = process.env.APP_SECRET;

test.skip(!url || !publishableKey || !secretKey || !appSecret, "Supabase test environment is not configured");
test.describe.configure({ mode: "serial" });

const run = Date.now().toString(36);
const people = {
  member: { email: `member-${run}@example.com`, name: "Morgan Member", student: `mmember${run}@student.gsu.edu` },
  other: { email: `other-${run}@example.com`, name: "Olive Other", student: `oother${run}@student.gsu.edu` },
  admin: { email: `admin-${run}@example.com`, name: "Avery Admin", student: `aadmin${run}@student.gsu.edu` },
};
const ids: Record<keyof typeof people, string> = { member: "", other: "", admin: "" };
let admin: SupabaseClient<Database>;
let eventId = "";

async function tokenHashFor(email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  return data.properties.hashed_token;
}

function confirmUrl(tokenHash: string, next: string) {
  return `/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=${encodeURIComponent(next)}`;
}

async function signIn(page: Page, who: keyof typeof people, next = "/dashboard") {
  await page.goto(confirmUrl(await tokenHashFor(people[who].email), next));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/confirm"));
}

async function apiClientFor(who: keyof typeof people) {
  const client = createClient<Database>(url!, publishableKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.verifyOtp({ type: "magiclink", token_hash: await tokenHashFor(people[who].email) });
  if (error) throw error;
  return client;
}

test.beforeAll(async () => {
  admin = createClient<Database>(url!, secretKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const key of Object.keys(people) as (keyof typeof people)[]) {
    const { data, error } = await admin.auth.admin.createUser({
      email: people[key].email,
      email_confirm: true,
      user_metadata: { full_name: people[key].name },
    });
    if (error) throw error;
    ids[key] = data.user.id;
  }
  // "other" and "admin" are fully onboarded and verified; "admin" is seeded as admin.
  for (const key of ["other", "admin"] as const) {
    const { error } = await admin
      .from("profiles")
      .update({ student_email: people[key].student, student_email_verified_at: new Date().toISOString(), grad_month: 5, grad_year: 2029 })
      .eq("id", ids[key]);
    if (error) throw error;
  }
  await admin.from("profiles").update({ role: "admin" }).eq("id", ids.admin);

  const start = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const { data: event, error } = await admin
    .from("events")
    .insert({ title: `E2E Workshop ${run}`, location: "Langdale Hall", starts_at: start.toISOString(), created_by: ids.admin })
    .select("id")
    .single();
  if (error) throw error;
  eventId = event.id;
});

test.afterAll(async () => {
  if (eventId) await admin.from("events").delete().eq("id", eventId);
  for (const id of Object.values(ids)) if (id) await admin.auth.admin.deleteUser(id);
});

test("signed-out visitors are sent to /join from member areas", async ({ page }) => {
  for (const path of ["/dashboard", "/onboarding", "/settings", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/join\\?next=${encodeURIComponent(path)}`));
  }
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("opening a sign-in link alone does not sign the browser in", async ({ page }) => {
  await page.goto(confirmUrl(await tokenHashFor(people.other.email), "/dashboard"));
  await expect(page.getByRole("heading", { name: "Finish signing in" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/join\?next=/);
});

test("post-sign-in redirects cannot leave the site", async ({ page }) => {
  await signIn(page, "other", "/.//example.org/phish");
  expect(new URL(page.url()).origin).toBe(new URL(test.info().project.use.baseURL!).origin);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("the email link form rejects GSU addresses and confirms personal ones", async ({ page }) => {
  await page.goto("/join");
  await page.getByLabel("Email me a sign-in link").fill("someone@student.gsu.edu");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByText("Use a personal email so you keep access after graduation")).toBeVisible();
  await page.getByLabel("Email me a sign-in link").fill(`magic-${run}@example.com`);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByText("Check your inbox")).toBeVisible();
});

test("a new member onboards, verifies their student email and can RSVP", async ({ page }) => {
  await signIn(page, "member");
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByLabel("Name")).toHaveValue(people.member.name);
  await expect(page.getByLabel("Email me about upcoming club events")).not.toBeChecked();

  await page.getByLabel("GSU student email").fill("wrong@gmail.com");
  await page.getByRole("button", { name: "Save and send verification link" }).click();
  await expect(page.getByText("Use your @student.gsu.edu address.")).toBeVisible();

  await page.getByLabel("GSU student email").fill(people.member.student);
  await page.getByLabel("Month").selectOption("5");
  await page.getByLabel("Year").selectOption({ index: 3 });
  await page.getByLabel("CTFs").check();
  await page.getByRole("button", { name: "Save and send verification link" }).click();

  // "send_failed" is expected against a production build without RESEND_API_KEY.
  await expect(page).toHaveURL(/\/dashboard\?verification=(sent|rate_limited|send_failed)/);
  await expect(page.getByText("Verify your student email", { exact: true })).toBeVisible();
  await expect(page.getByText("RSVP opens after you verify your student email.")).toBeVisible();

  // The link from the email: issue a token the same way the server does.
  const token = createVerificationToken();
  const { error } = await admin.rpc("request_student_email_verification", {
    p_user_id: ids.member,
    p_email: people.member.student,
    p_token_hash: hashToken(token),
    p_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  expect(error).toBeNull();

  // Signed out, the link asks you to sign in first.
  const browser = page.context().browser()!;
  const stranger = await browser.newContext();
  const strangerPage = await stranger.newPage();
  await strangerPage.goto(`/verify-student-email?token=${token}`);
  await expect(strangerPage.getByRole("link", { name: "Sign in to continue" })).toBeVisible();

  // Someone else's account cannot use the link (for example a victim tricked into clicking).
  await signIn(strangerPage, "other", `/verify-student-email?token=${token}`);
  await strangerPage.getByRole("button", { name: "Confirm my student email" }).click();
  await expect(strangerPage.getByText("This link belongs to a different account")).toBeVisible();
  await stranger.close();

  // Opening the link alone changes nothing (mail scanners cannot use it up).
  await page.goto(`/verify-student-email?token=${token}`);
  await expect(page.getByText(people.member.name)).toBeVisible();
  const { data: before } = await admin.from("profiles").select("student_email_verified_at").eq("id", ids.member).single();
  expect(before?.student_email_verified_at).toBeNull();
  await page.getByRole("button", { name: "Confirm my student email" }).click();
  await expect(page.getByText("Student email confirmed")).toBeVisible();

  // Single use.
  await page.goto(`/verify-student-email?token=${token}`);
  await page.getByRole("button", { name: "Confirm my student email" }).click();
  await expect(page.getByText("This link does not work")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Verify your student email", { exact: true })).toHaveCount(0);
  await expect(page.getByText(`E2E Workshop ${run}`)).toBeVisible();
  await page.getByRole("button", { name: "RSVP", exact: true }).click();
  await expect(page.getByText("You are going")).toBeVisible();
});

test("members edit allowed profile fields in settings", async ({ page }) => {
  await signIn(page, "member", "/settings");
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByLabel("Major").fill("Computer Information Systems");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Your profile is saved.")).toBeVisible();
  const { data } = await admin.from("profiles").select("major, role").eq("id", ids.member).single();
  expect(data).toEqual({ major: "Computer Information Systems", role: "member" });
});

test("a member cannot read another profile, change their role, or open /admin", async ({ page }) => {
  const member = await apiClientFor("member");

  const { data: visible, error: readError } = await member.from("profiles").select("id");
  expect(readError).toBeNull();
  expect(visible?.map((row) => row.id)).toEqual([ids.member]);

  const { data: other } = await member.from("profiles").select("id").eq("id", ids.other);
  expect(other).toEqual([]);

  const { error: roleError } = await member.from("profiles").update({ role: "admin" }).eq("id", ids.member);
  expect(roleError?.code).toBe("42501");

  const { error: verifyError } = await member
    .from("profiles")
    .update({ student_email_verified_at: new Date().toISOString() })
    .eq("id", ids.member);
  expect(verifyError?.code).toBe("42501");

  const { error: rpcError } = await member.rpc("set_member_role", { target_user_id: ids.member, new_role: "admin" });
  expect(rpcError?.message).toContain("Only admins can change roles");

  const { error: activityError } = await member
    .from("activity")
    .insert({ user_id: ids.member, type: "challenge_completed", reference_id: "self-award", awarded_by: ids.member });
  expect(activityError?.code).toBe("42501");

  const { error: serverOnlyError } = await member.rpc("hit_rate_limit", { p_bucket: "x", p_subject: "y", p_max: 1, p_window_seconds: 60 });
  expect(serverOnlyError?.code).toBe("42501");

  const { data: audit } = await member.from("audit_log").select("id");
  expect(audit).toEqual([]);

  const { data: role } = await admin.from("profiles").select("role").eq("id", ids.member).single();
  expect(role?.role).toBe("member");

  await signIn(page, "member");
  for (const path of ["/admin", "/admin/members", `/admin/members/${ids.other}`, "/admin/audit", `/admin/events/${eventId}`]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
  await expect(page.getByRole("link", { name: "Officer tools" })).toHaveCount(0);
});

test("an admin changes a role after confirming, and the change is audited", async ({ page }) => {
  await signIn(page, "admin", "/admin/members");
  await expect(page).toHaveURL(/\/admin\/members$/);

  await page.getByRole("searchbox", { name: "Search" }).fill(people.member.name);
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByRole("link", { name: people.member.name }).click();
  await expect(page.getByRole("heading", { level: 1, name: people.member.name })).toBeVisible({ timeout: 20_000 });

  await page.getByLabel("Role").selectOption("officer");
  await page.getByRole("button", { name: "Review" }).first().click();
  await expect(page).toHaveURL(/\/role\?to=officer$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Confirm role change" })).toBeVisible();

  const { data: unchanged } = await admin.from("profiles").select("role").eq("id", ids.member).single();
  expect(unchanged?.role).toBe("member");

  await page.getByRole("button", { name: "Confirm: make officer" }).click();
  await expect(page.getByText("Role updated and recorded in the audit log.")).toBeVisible();

  const { data: log } = await admin
    .from("audit_log")
    .select("actor_id, details")
    .eq("target_user_id", ids.member)
    .eq("action", "member.role_changed");
  expect(log).toEqual([{ actor_id: ids.admin, details: { from: "member", to: "officer", source: "authenticated" } }]);

  await page.goto("/admin/audit");
  await expect(page.getByRole("cell", { name: "Role changed" }).first()).toBeVisible();

  // The new officer checks someone in; the attendance is credited as activity.
  await signIn(page, "member", `/admin/events/${eventId}`);
  await expect(page.getByRole("heading", { name: `E2E Workshop ${run}` })).toBeVisible();
  await page.getByRole("button", { name: "Check in" }).first().click();
  await expect(page.getByText("Checked in.")).toBeVisible();
  const { data: activity } = await admin.from("activity").select("type").eq("user_id", ids.member);
  expect(activity).toEqual([{ type: "workshop_attended" }]);

  // Officers still cannot open admin-only pages.
  expect((await page.goto("/admin/audit"))?.status()).toBe(404);
});

test("event emails unsubscribe with the signed link, without signing in", async ({ page }) => {
  await admin.from("profiles").update({ notify_events: true }).eq("id", ids.other);
  await page.goto(`/unsubscribe?token=${encodeURIComponent(signUnsubscribeToken(appSecret!, ids.other))}`);
  await page.getByRole("button", { name: "Stop event emails" }).click();
  await expect(page.getByText("You are unsubscribed")).toBeVisible();
  const { data } = await admin.from("profiles").select("notify_events").eq("id", ids.other).single();
  expect(data?.notify_events).toBe(false);

  await page.goto(`/unsubscribe?token=${encodeURIComponent(signUnsubscribeToken("wrong-secret-wrong-secret-wrong-secret", ids.admin))}`);
  await page.getByRole("button", { name: "Stop event emails" }).click();
  await expect(page.getByText("This link does not work")).toBeVisible();
});
