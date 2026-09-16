"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { ProfileFields, type ProfileValues } from "@/components/portal/profile-fields";
import { SubmitButton } from "@/components/portal/submit-button";
import { Field, FormError, FormSuccess, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/primitives";
import {
  changeStudentEmail,
  completeOnboarding,
  confirmStudentEmail,
  confirmUnsubscribe,
  resendStudentVerification,
  updateSettings,
  type FormState,
  type UnsubscribeState,
  type VerifyState,
} from "@/server/actions/member";

const idle: FormState = { status: "idle" };

function merge(initial: ProfileValues, state: FormState): ProfileValues {
  return state.values ? ({ ...initial, ...state.values } as ProfileValues) : initial;
}

export function OnboardingForm({ initial }: { initial: ProfileValues & { student_email?: string | null } }) {
  const [state, action] = useActionState(completeOnboarding, idle);
  const values = merge(initial, state) as ProfileValues & { student_email?: string | null };
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormError message={state.message} />
      <Field
        label="GSU student email"
        name="student_email"
        hint="Must end in @student.gsu.edu. We email you a link to confirm it. It is not used to sign in."
        error={errors.student_email}
      >
        <Input
          name="student_email"
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder="pantherid1@student.gsu.edu"
          required
          defaultValue={values.student_email ?? ""}
          hint="Must end in @student.gsu.edu. We email you a link to confirm it. It is not used to sign in."
          error={errors.student_email}
        />
      </Field>
      <ProfileFields values={values} errors={errors} />
      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Saving">
        Save and send verification link
      </SubmitButton>
    </form>
  );
}

export function SettingsForm({ initial }: { initial: ProfileValues }) {
  const [state, action] = useActionState(updateSettings, idle);
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormError message={state.status === "error" ? state.message : null} />
      <FormSuccess message={state.status === "success" ? state.message : null} />
      <ProfileFields values={merge(initial, state)} errors={state.errors} />
      <SubmitButton pendingText="Saving">Save changes</SubmitButton>
    </form>
  );
}

export function ResendVerificationForm() {
  const [state, action] = useActionState(resendStudentVerification, idle);
  return (
    <form action={action} className="flex flex-col gap-2 sm:items-end">
      <SubmitButton variant="outline" size="sm" pendingText="Sending">
        <MailCheck className="size-4" aria-hidden />
        Resend link
      </SubmitButton>
      {state.status === "success" ? <p className="text-sm text-success-600" role="status">{state.message}</p> : null}
      {state.status === "error" ? <p className="text-sm text-danger-700" role="alert">{state.message}</p> : null}
    </form>
  );
}

export function ChangeStudentEmailForm({ current }: { current: string | null }) {
  const [state, action] = useActionState(changeStudentEmail, idle);
  const error = state.errors?.student_email;
  return (
    <form action={action} className="space-y-3" noValidate>
      <FormError message={state.status === "error" ? state.message : null} />
      <FormSuccess message={state.status === "success" ? state.message : null} />
      <Field label="Student email" name="student_email" error={error}>
        <Input
          name="student_email"
          type="email"
          inputMode="email"
          required
          defaultValue={(state.values?.student_email as string | undefined) ?? current ?? ""}
          error={error}
        />
      </Field>
      <SubmitButton variant="outline" pendingText="Sending">
        Update and send a new link
      </SubmitButton>
    </form>
  );
}

const VERIFY_RESULTS: Record<Exclude<VerifyState["status"], "idle">, { tone: "success" | "warning" | "danger"; title: string; body: string }> = {
  verified: { tone: "success", title: "Student email confirmed", body: "Member features are unlocked." },
  already_verified: { tone: "success", title: "Already confirmed", body: "This student email was confirmed earlier." },
  email_changed: {
    tone: "warning",
    title: "This link is for an older address",
    body: "The student email on your account changed after this link was sent. Use the newest link, or resend one from your dashboard.",
  },
  email_in_use: {
    tone: "danger",
    title: "Already confirmed on another account",
    body: "This student email is verified on a different account. Contact an officer if it belongs to you.",
  },
  wrong_account: {
    tone: "danger",
    title: "This link belongs to a different account",
    body: "Nothing was changed. If you did not add this student email to your own club account, ignore the email. Otherwise sign out and sign in with the account you used when joining.",
  },
  invalid: {
    tone: "danger",
    title: "This link does not work",
    body: "It may have expired, already been used, or been replaced by a newer link. Resend it from your dashboard.",
  },
  signed_out: { tone: "warning", title: "Your session ended", body: "Sign in again, then open the link from your email." },
  rate_limited: { tone: "warning", title: "Too many attempts", body: "Wait a few minutes and try again." },
};

export function VerifyStudentEmailForm({ token }: { token: string }) {
  const [state, action] = useActionState(confirmStudentEmail, { status: "idle" } as VerifyState);
  if (state.status !== "idle") {
    const result = VERIFY_RESULTS[state.status];
    return (
      <div className="space-y-4">
        <Alert tone={result.tone} title={result.title}>{result.body}</Alert>
        <Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">
          Go to your dashboard
        </Link>
      </div>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <SubmitButton size="lg" pendingText="Confirming">Confirm my student email</SubmitButton>
    </form>
  );
}

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action] = useActionState(confirmUnsubscribe, { status: "idle" } as UnsubscribeState);
  if (state.status === "done") {
    return (
      <Alert tone="success" title="You are unsubscribed">
        You will not get club event emails. You can turn them back on in your settings.
      </Alert>
    );
  }
  return (
    <form action={action} className="space-y-4">
      {state.status === "invalid" ? <Alert tone="danger" title="This link does not work">Sign in and turn event emails off in your settings instead.</Alert> : null}
      {state.status === "rate_limited" ? <Alert tone="warning" title="Too many attempts">Wait a few minutes and try again.</Alert> : null}
      <input type="hidden" name="token" value={token} />
      <SubmitButton pendingText="Updating">Stop event emails</SubmitButton>
    </form>
  );
}
