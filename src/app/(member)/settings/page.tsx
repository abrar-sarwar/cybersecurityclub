import type { Metadata } from "next";
import { ChangeStudentEmailForm, SettingsForm } from "@/components/portal/member-forms";
import { SubmitButton } from "@/components/portal/submit-button";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { signOut } from "@/server/actions/auth";
import { requireMember } from "@/server/session";

export const metadata: Metadata = { title: "Profile settings" };

export default async function SettingsPage() {
  const viewer = await requireMember("/settings");
  const { profile } = viewer;

  return (
    <section className="container-x max-w-3xl py-10 sm:py-14">
      <SectionHeading as="h1" eyebrow="Settings" title="Your profile" description="Update your details and event emails. Your role and verification status are managed by the club." />

      <div className="card mt-8 p-6 sm:p-8">
        <SettingsForm
          initial={{
            full_name: profile.full_name,
            grad_month: profile.grad_month,
            grad_year: profile.grad_year,
            major: profile.major,
            interests: profile.interests,
            notify_events: profile.notify_events,
          }}
        />
      </div>

      <div id="student-email" className="card mt-6 scroll-mt-28 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy-900">Student email</h2>
          {profile.student_email_verified_at ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Not verified</Badge>}
        </div>
        {profile.student_email_verified_at ? (
          <p className="mt-3 text-sm leading-6 text-muted">
            <span className="font-medium text-ink">{profile.student_email}</span> is confirmed. Ask an officer if it needs to change.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            <p className="text-sm leading-6 text-muted">Typo or new address? Update it and we send a fresh link. Older links stop working.</p>
            <ChangeStudentEmailForm current={profile.student_email} />
          </div>
        )}
      </div>

      <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
        <div className="text-sm leading-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Sign-in account</h2>
          <p className="text-muted">{viewer.email ?? "Signed in"}</p>
        </div>
        <form action={signOut}>
          <SubmitButton variant="outline" pendingText="Signing out">Sign out</SubmitButton>
        </form>
      </div>
    </section>
  );
}
