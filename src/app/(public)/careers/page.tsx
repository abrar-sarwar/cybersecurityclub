import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CareerList } from "@/components/careers/career-list";
import { ResumeNotice } from "@/components/careers/resume-notice";
import { QuizLink } from "@/components/careers/quiz-link";
import { CAREER_PATHS, UPCOMING_PATHS } from "@/content/careers/paths";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Careers and Learning",
  description:
    "Answer 20 questions about the work that interests you, explore twelve cybersecurity career paths, and get beginner projects you can turn into portfolio pieces. No account needed.",
  alternates: { canonical: "/careers" },
};

// Learning content is read from files on each request.
export const dynamic = "force-dynamic";

const JUMP_LINKS = [
  { href: "#paths", label: "Career paths" },
  { href: "#interview-prep", label: "Interview prep" },
];

const STEPS = [
  { title: "Answer twenty questions", body: "Pick the work that sounds interesting. There are no right answers, and nothing asks about experience." },
  { title: "See your starting points", body: "Get your strongest matches, with the answers behind each one." },
  { title: "Try a starter project", body: "Every path has a beginner project and guidance for turning it into a portfolio piece." },
];

export default function CareersLandingPage() {

  return (
    <>
      <PageHero
        eyebrow="Career exploration"
        title="Find your path in cybersecurity"
        description={
          <div className="careers-hero-copy">
            <p className="careers-hero-lead">
              Answer 20 questions about the work that interests you. Discover your strongest career matches, explore what those roles involve, and get beginner projects you can turn into portfolio pieces.
            </p>
            <p>No experience needed. Choose up to two answers per question, or select “Not sure yet.”</p>
            <p>Your results are a starting point. You can explore any path, switch your focus, or retake the questionnaire whenever your interests change.</p>
          </div>
        }
      >
        <QuizLink className="btn-cyber btn-cyber-primary btn-cyber-lg">Find My Path</QuizLink>
        <ButtonLink href="#paths" variant="outline" size="lg">
          Explore All Paths
        </ButtonLink>
      </PageHero>

      <section className="container-x careers-how" aria-labelledby="how-heading">
        <ResumeNotice />
        <h2 id="how-heading" className="sr-only">
          How it works
        </h2>
        <ol className="careers-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="careers-step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h3 className="font-display text-lg font-bold text-navy-900">{step.title}</h3>
              <p className="mt-1.5 leading-7 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
        <nav className="careers-jump" aria-label="On this page">
          <ul>
            {JUMP_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section id="paths" className="careers-paths" aria-labelledby="paths-heading">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="signal-eyebrow mb-3">
              <span className="signal-eyebrow-mark" aria-hidden="true" />
              Browse
            </p>
            <h2 id="paths-heading" className="signal-section-title">
              All {CAREER_PATHS.length} career paths
            </h2>
            <p className="careers-prose">
              Browse any path without taking the questionnaire. These are areas of work to explore; several related job titles usually require experience, and a starter project is a first step rather than proof of job readiness.
            </p>
          </div>
          <CareerList upcoming={UPCOMING_PATHS} />
        </div>
      </section>

      <section className="surface-pale section" id="interview-prep" aria-labelledby="interview-heading">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-accent">
              <MessagesSquare className="size-5" aria-hidden />
            </div>
            <h2 id="interview-heading" className="mt-4 font-display text-2xl font-bold text-navy-900">
              Interview preparation
            </h2>
            <p className="mt-2 text-[0.95rem] leading-6 text-muted">
              Technical, behavioral, scenario and project prompts with what strong answers include, common weak patterns and likely follow-ups. We never suggest claiming work you have not done.
            </p>
          </div>
          <div>
            <p className="text-[0.95rem] leading-6 text-muted">
              The guide covers what to expect, how to structure an answer, three short videos, and a question bank to practice out loud.
            </p>
            <div className="mt-5">
              <ButtonLink href="/resources/interview-prep">Open interview prep</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
