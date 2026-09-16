import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/portal/member-forms";
import { SectionHeading } from "@/components/ui/primitives";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Finish joining" };

export default async function OnboardingPage() {
  const viewer = await requireUser("/onboarding");
  if (viewer.isComplete) redirect("/dashboard");
  const { profile } = viewer;

  return (
    <section className="container-x max-w-2xl py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Join the club"
        title="A few details and you are in"
        description="This takes a minute. Your sign-in account stays yours after graduation; your GSU student email proves you are a current student."
      />
      <div className="card mt-8 p-6 sm:p-8">
        <OnboardingForm
          initial={{
            full_name: profile.full_name,
            student_email: profile.student_email,
            grad_month: profile.grad_month,
            grad_year: profile.grad_year,
            major: profile.major,
            interests: profile.interests,
            notify_events: profile.notify_events,
          }}
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">
        We only collect what is on this form. No student ID, birthday or address.
      </p>
    </section>
  );
}
