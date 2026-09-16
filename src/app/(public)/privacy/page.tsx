import type { Metadata } from "next";
import { branding } from "@config/branding";
import { SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the club website stores, who can see it, and how to correct or delete your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <section className="container-x max-w-3xl py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Privacy" title="What we store and why" description="This site is run by student officers. We keep only what the club needs to run membership and the learning platform." />
      <div className="prose prose-club mt-8 max-w-none">
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your name, personal email (sign-in), GSU email (student verification), expected graduation, and optional profile fields such as major, interests or a Discord username.</li>
          <li><strong>Membership records:</strong> your membership status, role, education status, and notes officers add when reviewing an account.</li>
          <li><strong>Learning records:</strong> questionnaire answers, chosen paths, lesson and project progress, practice answers, and private notes you write.</li>
          <li><strong>Technical records:</strong> session cookies needed to keep you signed in, and standard server logs.</li>
        </ul>
        <h2>Who can see it</h2>
        <ul>
          <li>Your personal email, questionnaire answers, notes, submissions and progress are private to you. Officers with the administrator role can see membership records and aggregate participation, but not your private notes.</li>
          <li>Nothing about you appears publicly unless you opt in to the member directory from your account page. Even then, only your name and headline are shown, never your email.</li>
          <li>Member stories are published only with the member’s explicit permission.</li>
          <li>We do not sell or share personal data with third parties. Email delivery and hosting providers process data only to run the site.</li>
        </ul>
        <h2>Cookies and analytics</h2>
        <p>We use a session cookie to keep you signed in and a small amount of local browser storage for interface preferences and unsent drafts. We do not run advertising trackers.</p>
        <h2>Graduation and alumni</h2>
        <p>An expected graduation date is only an estimate. When it passes we ask you to confirm; we never mark you as graduated automatically, and confirming graduation does not remove your access.</p>
        <h2>Correcting or deleting your data</h2>
        <p>
          You can update most details on your account page. To correct something you cannot edit, or to request deletion of your account and learning records, email{" "}
          <a href={`mailto:${branding.contact.privacyEmail}?subject=${encodeURIComponent("Account data request")}`}>{branding.contact.privacyEmail}</a> from the address on your account, or use the{" "}
          <a href="/account/data">data request form</a> when signed in. Officers respond and record the request.
        </p>
        <h2>Changes</h2>
        <p>This page is reviewed by the officer team when the site changes. Last reviewed: September 2026.</p>
      </div>
    </section>
  );
}
