import type { Metadata } from "next";
import { branding } from "@config/branding";
import { SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Our accessibility commitments and how to report a problem.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <section className="container-x max-w-3xl py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Accessibility" title="Everyone should be able to use this site" description="We build with keyboard navigation, screen readers, reduced motion and enlarged text in mind, and we fix problems when they are reported." />
      <div className="prose prose-club mt-8 max-w-none">
        <h2>What we do</h2>
        <ul>
          <li>Semantic headings and landmarks, visible keyboard focus, and a skip link on every page.</li>
          <li>Form fields with labels and error messages that are announced to assistive technology.</li>
          <li>Menus and dialogs that trap focus while open and close with Escape.</li>
          <li>Color contrast that meets WCAG AA for text, and information that never depends on color or hover alone.</li>
          <li>Animations that are short, optional, and disabled when your system asks for reduced motion.</li>
          <li>Layouts that work at 360 px wide and with text enlarged to 200%.</li>
        </ul>
        <h2>Known limitations</h2>
        <p>Some lesson diagrams are described in a caption rather than fully in text. Third-party sites we link to (PIN, Discord, vendors) have their own accessibility practices.</p>
        <h2>Report a problem</h2>
        <p>
          If something is hard to use, email <a href={`mailto:${branding.contact.accessibilityEmail}?subject=${encodeURIComponent("Accessibility issue")}`}>{branding.contact.accessibilityEmail}</a> with the page address and what happened. An officer will reply and track the fix.
        </p>
      </div>
    </section>
  );
}
