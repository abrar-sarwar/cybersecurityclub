import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/primitives";
import { PageHero } from "@/components/site/page-hero";
import { ProjectLibrary } from "@/components/careers/project-library";
import { DIFFICULTY, DIFFICULTY_ORDER, LIBRARY_PROJECTS } from "@/content/careers/projects";
import { PROJECT_BENEFITS } from "@/content/careers/github";
import { LibraryHud } from "@/components/careers/library-hud";

export const metadata: Metadata = {
  title: "Project Library",
  description:
    "Cybersecurity projects you can work through at your own pace and put on a résumé, each with the full stack, the framework to follow, name ideas and a GitHub walkthrough.",
  alternates: { canonical: "/careers/projects" },
};

export default function ProjectLibraryPage() {
  return (
    <article>
      <PageHero
        variant="compact"
        before={<Breadcrumbs items={[{ label: "Careers", href: "/careers" }, { label: "Project library" }]} />}
        eyebrow="Project library"
        title="Projects"
        description="These are projects that can be beneficial to you: learn at your own pace and put them on your résumé. Filter by difficulty, then open any project for the full stack, the framework to follow, five name ideas and how to publish it."
        corner={<LibraryHud />}
      />

      <div className="container-x careers-detail">
        <section className="chain" aria-labelledby="why-heading">
          <h2 id="why-heading" className="sr-only">
            Why finishing one of these matters
          </h2>
          <ol className="chain-track">
            {PROJECT_BENEFITS.map((benefit, index) => (
              <li key={benefit.label} className="chain-step" style={{ ["--i" as string]: index }}>
                <span className="chain-wire" aria-hidden="true" />
                <span className="chain-node" aria-hidden="true" />
                <p className="chain-label">{benefit.label}</p>
                <p className="chain-body">{benefit.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="careers-section careers-section-first mt-12" aria-labelledby="library-heading">
          <h2 id="library-heading" className="careers-section-title">
            Pick one and finish it
          </h2>
          <p className="careers-prose">
            Everything runs on public data, published reports or a lab on your own machine. Easy projects prove you can finish and publish something; hard ones are the projects an interviewer spends the most time asking about.
          </p>
          <ul className="library-legend">
            {DIFFICULTY_ORDER.map((id) => (
              <li key={id} data-level={id}>
                <span className="library-legend-head">
                  <span className="project-card-meter" aria-hidden="true">
                    <i data-on={DIFFICULTY[id].weight >= 1} />
                    <i data-on={DIFFICULTY[id].weight >= 2} />
                    <i data-on={DIFFICULTY[id].weight >= 3} />
                  </span>
                  {DIFFICULTY[id].label}
                  <span className="library-legend-value">{DIFFICULTY[id].resumeValue}</span>
                </span>
                <span className="library-legend-note">{DIFFICULTY[id].note}</span>
              </li>
            ))}
          </ul>
          <ProjectLibrary projects={LIBRARY_PROJECTS} />
        </section>

        <section className="careers-section" aria-labelledby="after-heading">
          <h2 id="after-heading" className="careers-section-title">
            What happens after you finish one
          </h2>
          <p className="careers-prose">
            Give it a name of its own, publish it on GitHub with your notes and evidence, and put the numbers you counted into one résumé line. Every project page walks through all three.
          </p>
          <p className="careers-prose">
            <Link href="/careers#paths" className="careers-inline-link">
              Browse the career paths <ArrowRight className="inline size-4" aria-hidden />
            </Link>
          </p>
        </section>
      </div>
    </article>
  );
}
