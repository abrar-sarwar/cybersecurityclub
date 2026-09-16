"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { SubmitButton } from "@/components/portal/submit-button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/primitives";
import { sendMagicLink, signInWithGoogle, type MagicLinkState } from "@/server/actions/auth";

const initial: MagicLinkState = { status: "idle" };

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5 rounded-full bg-white p-[2px]" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9Z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9Z" />
    </svg>
  );
}

/** "Continue with Google" first, emailed sign-in link as the fallback. */
export function AuthOptions({ next }: { next: string }) {
  const [state, action] = useActionState(sendMagicLink, initial);

  return (
    <div id="sign-in" className="card scroll-mt-28 p-6 sm:p-7">
      <h2 className="font-display text-xl font-bold text-navy-900">Sign in or create your account</h2>
      <p className="mt-1.5 text-sm leading-6 text-muted">
        Use a personal account you will keep after graduation. You confirm your GSU student email in the next step.
      </p>

      <form action={signInWithGoogle} className="mt-5">
        <input type="hidden" name="next" value={next} />
        <SubmitButton size="lg" className="w-full" pendingText="Opening Google">
          <GoogleMark />
          Continue with Google
        </SubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-faint" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      {state.status === "sent" ? (
        <Alert tone="success" title="Check your inbox">
          If {state.email} can receive mail, a sign-in link is on its way. It works once and expires in an hour.
        </Alert>
      ) : (
        <form action={action} className="space-y-3" noValidate>
          <input type="hidden" name="next" value={next} />
          <Field label="Email me a sign-in link" name="email" error={state.status === "error" ? state.message : null}>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@gmail.com"
              required
              defaultValue={state.email}
              error={state.status === "error" ? state.message : null}
            />
          </Field>
          <SubmitButton variant="outline" className="w-full" pendingText="Sending link">
            <Mail className="size-4" aria-hidden />
            Email me a sign-in link
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
