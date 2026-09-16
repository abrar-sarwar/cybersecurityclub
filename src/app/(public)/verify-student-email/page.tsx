import type { Metadata } from "next";
import { VerifyStudentEmailForm } from "@/components/portal/member-forms";
import { ButtonLink } from "@/components/ui/button";
import { Alert, SectionHeading } from "@/components/ui/primitives";
import { getViewer } from "@/server/session";

export const metadata: Metadata = {
  title: "Confirm your student email",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function VerifyStudentEmailPage(props: PageProps<"/verify-student-email">) {
  const { token } = await props.searchParams;
  const viewer = await getViewer();
  const hasToken = typeof token === "string" && token.length > 0;

  return (
    <section className="container-x max-w-xl py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Student verification" title="Confirm your student email" />
      <div className="card mt-8 space-y-5 p-6 sm:p-8">
        {!hasToken ? (
          <Alert tone="danger" title="This link is incomplete">Open the full link from the email, or resend it from your dashboard.</Alert>
        ) : !viewer ? (
          <>
            <p className="text-sm leading-6 text-muted">
              Sign in with the account you used to join the club, and you will come back here to confirm. The link only works for that account.
            </p>
            <ButtonLink href={`/join?next=${encodeURIComponent(`/verify-student-email?token=${token}`)}#sign-in`} size="lg">
              Sign in to continue
            </ButtonLink>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-pale-2 px-4 py-3 text-sm leading-6">
              <p className="text-muted">Verifying the club account</p>
              <p className="font-semibold text-navy-900">{viewer.profile.full_name ?? "Your account"}{viewer.email ? ` · ${viewer.email}` : ""}</p>
              {viewer.profile.student_email ? <p className="text-muted">Student email: {viewer.profile.student_email}</p> : null}
            </div>
            <p className="text-sm leading-6 text-muted">
              Only confirm if you added this student email to this account yourself. Nothing changes until you press the button.
            </p>
            <VerifyStudentEmailForm token={token} />
          </>
        )}
      </div>
    </section>
  );
}
