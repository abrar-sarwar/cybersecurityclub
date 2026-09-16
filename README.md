# Cybersecurity Club at GSU

The club website: public pages (about, events, community, learning catalog) and
a member portal (sign-in, student email verification, profiles, dashboard and
officer tools). Built with Next.js (App Router), Supabase for auth and member
data, Resend for email, and Prisma for the existing public content.

## Local development

```bash
npm install
npm run env:local          # creates .env with a generated APP_SECRET
supabase start             # local Supabase on ports 553xx (needs Docker)
```

`supabase start` prints a publishable key and a secret key. Put them in `.env`
with the local URL, then start the app:

```bash
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:55321"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SECRET_KEY="sb_secret_..."
```

```bash
npm run dev
```

Local sign-in links arrive in Mailpit at http://127.0.0.1:55324. Without
`RESEND_API_KEY`, student verification emails are printed in the dev server log.

### Checks

| Command | What it runs |
| --- | --- |
| `npm run test:unit` | Validation, redirects, tokens, homepage network logic |
| `npm run test:db` | pgTAP tests for grants, row level security and the admin functions (`supabase/tests`) |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright against a running server (`PLAYWRIGHT_BASE_URL`, default `http://localhost:3001`). Portal flows run when `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` and `APP_SECRET` are set to the same values the server uses. |

After changing a migration, run `supabase db reset` and `npm run db:types`.

## Member portal

### How it works

- `/join`: "Continue with Google" (main) and "Email me a sign-in link" (fallback).
  Members sign in with a **personal** account so they keep access after graduation.
- `/auth/callback` (Google and default magic links) and `/auth/confirm`
  (token-hash magic links, finished with a button press so an opened or planted
  link cannot sign a browser in) send new members to `/onboarding` and returning
  members with a complete profile to `/dashboard`. Post-sign-in redirects only
  ever go to paths on this site.
- `/onboarding`: name, GSU student email, expected graduation, optional major and
  interests, event-email opt-in (off by default). Submitting emails a single-use
  link to the student address. GSU mail is Microsoft 365, so Google sign-in alone
  does not prove student status.
- `/verify-student-email`: the member must be signed in to the account that
  requested the link, and confirms with a button press. Clicking a link someone
  else requested verifies nothing, and mail scanners (Microsoft Safe Links)
  cannot use the link up by opening it.
- `/dashboard`, `/settings`: next event and RSVP, membership, activity, getting
  started, event emails. RSVPs stay locked until the student email is verified.
- `/admin`: officers see members (search and filters), events, RSVPs and check-in,
  and record challenges. Admins also change roles and membership status (with a
  confirmation step) and read the audit log.
- `/unsubscribe` and `/api/email/unsubscribe`: every event email carries a signed
  link and a one-click `List-Unsubscribe` header that turn `notify_events` off.

Schema and access rules live in `supabase/migrations`:

- **Row level security on every table.** Members read and update only their own
  profile; column grants plus a trigger limit updates to `full_name`, `grad_month`,
  `grad_year`, `major`, `interests` and `notify_events`. Members cannot touch
  `role`, `membership_status`, `student_email_verified_at` or `activity`.
- **Officers** read member profiles, create and edit events, check people in and
  award activity. **Admins** change roles and membership status through
  `set_member_role` and `set_membership_status`; a trigger writes every such
  change to `audit_log`, whichever path made it.
- **New accounts always start as `member`.** Nobody picks a role at sign-up.
- The secret key is only used in server code (`src/lib/supabase/admin.ts`,
  guarded by `server-only`), for issuing verification tokens, rate limiting,
  event email recipients and one-click unsubscribe.
- Sessions use `@supabase/ssr` with httpOnly cookies; `src/proxy.ts` refreshes
  them on every request and turns signed-out visitors away from `/dashboard`,
  `/onboarding`, `/settings` and `/admin`. Every page and server action checks the
  session and role again on the server.
- Verification sends, sign-in links, staff role and status changes, event emails
  and unsubscribes are rate limited (`src/server/rate-limit.ts`). Per-IP limits
  read `x-real-ip` / `x-forwarded-for`, which Vercel sets; behind another proxy,
  make sure it overwrites those headers. Every form and action input is
  validated with zod (`src/lib/portal-schemas.ts`).
- Event deletions are audited by a trigger; event emails are recorded in the
  audit log and limited to one per event per day.
- Only the fields above are collected: no student IDs, birthdays or addresses.

### 1. Supabase project

1. Create a project. Link it and apply the migrations:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```
2. **Project Settings > API Keys**: copy the project URL, the publishable key
   and a secret key into your hosting environment as `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`. The secret
   key must never get a `NEXT_PUBLIC_` prefix.
3. **Authentication > URL Configuration** (restricts where sign-in may redirect):
   - Site URL: `https://<your-domain>`
   - Redirect URLs: exactly `https://<your-domain>/auth/callback` and
     `https://<your-domain>/auth/confirm`. Add a `www.` variant only if you serve
     it. Avoid wildcards in production; use a separate Supabase project for
     preview deployments.
4. **Authentication > Sign In / Providers > Email**: keep email enabled (it powers
   the sign-in link) with **Confirm email** on. Password sign-in is not offered in
   the UI.
5. **Authentication > Emails > SMTP Settings**: send auth email through Resend
   (see step 3) so sign-in links come from the club domain and are not held to
   Supabase's default email limits. Custom SMTP is also required to edit email
   templates on new free-tier projects.
6. Recommended, **Authentication > Emails > Magic Link** template: link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/dashboard`.
   This works even when a member opens the email on another device. The default
   template also works through `/auth/callback`, but only in the browser that
   requested the link.
7. Set `APP_URL` to the site's public URL and `APP_SECRET` to a random 32+
   character value (`openssl rand -base64 32`).

### 2. Google OAuth

1. In Google Cloud Console, configure the **OAuth consent screen** (External, app
   name, support email, authorized domain = your domain, scopes `openid`,
   `email`, `profile`) and publish it.
2. **Credentials > Create credentials > OAuth client ID > Web application**:
   - Authorized JavaScript origins: `https://<your-domain>`
   - Authorized redirect URI: the callback shown on the Supabase Google provider
     page, `https://<project-ref>.supabase.co/auth/v1/callback`
3. Paste the client ID and secret into **Supabase > Authentication > Sign In /
   Providers > Google** and enable it.
4. Local testing (optional): create a separate client with redirect URI
   `http://127.0.0.1:55321/auth/v1/callback`, set
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`,
   set `enabled = true` under `[auth.external.google]` in `supabase/config.toml`,
   and restart Supabase.

### 3. Email provider (Resend)

1. Add and verify the club's sending domain in Resend (SPF and DKIM DNS records).
2. Create an API key with sending access only. Set `RESEND_API_KEY` and
   `EMAIL_FROM` (an address on the verified domain) in the hosting environment.
   They are read only on the server.
3. For Supabase Auth email, use Resend SMTP in Supabase: host `smtp.resend.com`,
   port `465`, username `resend`, password = a Resend API key, sender = the same
   verified address.
4. Send a test verification to a `@student.gsu.edu` inbox before launch; Microsoft
   365 filtering can quarantine mail from new domains.

### 4. Seed the first admin

Admins are never chosen at sign-up. After the first admin has signed in once:

```bash
npm run admin:grant -- their-sign-in-email@gmail.com
```

This runs locally with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` from
`.env` and is recorded in the audit log. Alternatively, in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'their-sign-in-email@gmail.com');
```

After that, admins manage roles in `/admin/members`.

### 5. MFA for admins

**Admins should turn on MFA before using officer tools.** They should:

- Sign in with Google, and turn on 2-Step Verification for that Google account.
- Avoid the email-link fallback unless that mailbox is also protected by MFA.
- Turn on MFA for the Supabase dashboard, Resend, the hosting provider and GitHub.

Regular members do not need 2FA for launch.

### Not built yet

The practice range, the progress graph and member 2FA are out of scope. The
`activity` table (`challenge_completed`, `workshop_attended`) is ready for them.
Learning path progress still lives in the legacy Prisma tables and saving it is
paused until it moves to Supabase. The public `/events` page still lists PIN
events from Prisma; portal events are managed in `/admin/events`.
