import type { Metadata } from "next";
import { branding } from "@config/branding";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the club website stores, where questionnaire answers stay, and how to contact the officers about your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Privacy" title="What we store and why" description="This site is run by student officers. It has no accounts, and nothing on it asks you to sign in." />
      <section className="container-x section max-w-4xl">
      <div className="card prose prose-club max-w-none p-6 sm:p-10">
        <h2>Information we collect</h2>
        <ul>
          <li><strong>No accounts:</strong> the website does not ask for your name, email address, student ID or résumé, and there is nothing to register for.</li>
          <li><strong>Career questionnaire:</strong> your answers are kept in your own browser’s session storage so a refresh does not lose your place. They are never sent to the club or saved on a server. They are cleared when you close the tab or retake the questionnaire.</li>
          <li><strong>Technical records:</strong> standard server logs kept by the hosting provider to run and protect the site.</li>
        </ul>
        <h2>Who can see it</h2>
        <ul>
          <li>Member stories are published only with the member’s explicit permission.</li>
          <li>The public member directory lists only members who chose to be listed, and shows a name and short headline, never an email address.</li>
          <li>We do not sell or share personal data with third parties.</li>
        </ul>
        <h2>Cookies and analytics</h2>
        <p>The site does not set sign-in cookies or run advertising trackers. It uses your browser’s storage only for questionnaire progress and small interface preferences.</p>
        <h2>Other services</h2>
        <p>Discord, PIN, Instagram and LinkedIn are separate services with their own privacy policies. Event RSVPs happen on PIN, not on this website.</p>
        <h2 id="your-data">Questions about your data</h2>
        <p>
          Earlier versions of this website offered member accounts. That feature has been removed. To ask about information from it, or to request its deletion, email{" "}
          <a href={`mailto:${branding.contact.privacyEmail}?subject=${encodeURIComponent("Data request")}`}>{branding.contact.privacyEmail}</a>. Officers respond and record the request.
        </p>
        <h2>Changes</h2>
        <p>This page is reviewed by the officer team when the site changes. Last reviewed: September 2026.</p>
      </div>
      </section>
    </>
  );
}
