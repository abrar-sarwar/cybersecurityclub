import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/primitives";
import { NodeMark } from "@/components/site/node-mark";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { CareerFlow } from "@/components/careers/career-flow";
import { CareerScenario } from "@/components/careers/career-scenario";
import { QuizLink } from "@/components/careers/quiz-link";
import { PortfolioGuide } from "@/components/careers/portfolio-guide";
import { CAREER_BY_ID, CAREER_PATHS, getCareerBySlug } from "@/content/careers/paths";
import { PROJECTS_BY_PATH } from "@/content/careers/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return CAREER_PATHS.map((path) => ({ slug: path.slug }));
}

export async function generateMetadata(props: PageProps<"/careers/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const path = getCareerBySlug(slug);
  if (!path) return { title: "Career path not found" };
  return {
    title: `${path.name} Career Path`,
    description: `${path.summary} Includes a beginner project: ${path.project.title}.`,
    alternates: { canonical: `/careers/${path.slug}` },
  };
}

const SECTIONS = [
  { id: "work", label: "What the work involves" },
  { id: "flow", label: "How the work flows" },
  { id: "tasks", label: "Everyday tasks" },
  { id: "day", label: "A day on the job" },
  { id: "roles", label: "Related job titles" },
  { id: "project", label: "Starter project" },
  { id: "more-projects", label: "More projects" },
  { id: "walkthrough", label: "Project walkthrough" },
  { id: "publish", label: "What to publish" },
  { id: "resume", label: "Example résumé bullet" },
  { id: "portfolio", label: "Portfolio write-up" },
  { id: "related", label: "Related paths" },
];

export default async function CareerPathPage(props: PageProps<"/careers/[slug]">) {
  const { slug } = await props.params;
  const path = getCareerBySlug(slug);
  if (!path) notFound();
  const { project } = path;

  return (
    <article>
      <PageHero
        variant="compact"
        before={<Breadcrumbs items={[{ label: "Careers", href: "/careers" }, { label: path.name }]} />}
        eyebrow="Career path"
        title={path.name}
        description={path.summary}
      >
        <ButtonLink href="#project">Starter project: {project.title}</ButtonLink>
      </PageHero>

      <div className="container-x careers-detail careers-detail-grid">
        <nav className="careers-toc" aria-label="On this page">
          <p className="careers-label">On this page</p>
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="careers-detail-body">
          <section id="work" className="careers-section careers-section-first" aria-labelledby="work-heading">
            <h2 id="work-heading" className="careers-section-title">
              What people in this area work on
            </h2>
            {path.overview.map((paragraph) => (
              <p key={paragraph} className="careers-prose">
                {paragraph}
              </p>
            ))}
            <h3 className="careers-subtitle">Terms used on this page</h3>
            <dl className="careers-terms">
              {path.terms.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.definition}</dd>
                </div>
              ))}
            </dl>
          </section>

          <Reveal>
            <section id="flow" className="careers-section" aria-labelledby="flow-heading">
              <h2 id="flow-heading" className="careers-section-title">
                How the work flows
              </h2>
              <p className="careers-prose">One piece of work, start to finish. Every step below is something you can practise in the starter project.</p>
              <CareerFlow path={path.id} />
            </section>
          </Reveal>

          <section id="tasks" className="careers-section" aria-labelledby="tasks-heading">
            <h2 id="tasks-heading" className="careers-section-title">
              Examples of everyday tasks
            </h2>
            <ul className="careers-bullets">
              {path.tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </section>

          <section id="roles" className="careers-section" aria-labelledby="roles-heading">
            <h2 id="roles-heading" className="careers-section-title">
              Related job titles
            </h2>
            <ul className="careers-roles">
              {path.roles.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
            <p className="careers-prose">
              These are career areas to explore, not a checklist. Some of these job titles usually require experience, and completing a starter project does not by itself make someone ready for them.
            </p>
          </section>

          <section id="project" className="careers-section" aria-labelledby="project-heading">
            <p className="careers-label">Starter project</p>
            <h2 id="project-heading" className="careers-section-title mt-2">
              {project.title}
            </h2>
            <p className="careers-prose">{project.summary}</p>
            {project.notes?.map((note) => (
              <p key={note} className="careers-note">
                {note}
              </p>
            ))}
            <h3 className="careers-subtitle">What you’ll use</h3>
            <ul className="careers-bullets">
              {project.materials.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {path.resources.length ? (
              <>
                <h3 className="careers-subtitle">Resources to start with</h3>
                <ul className="careers-resources">
                  {path.resources.map((resource) => (
                    <li key={resource.href}>
                      <a href={resource.href} target="_blank" rel="noopener noreferrer">
                        {resource.label}
                        <ExternalLink className="size-3.5" aria-hidden />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      <p>{resource.description}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section id="more-projects" className="careers-section" aria-labelledby="more-projects-heading">
            <h2 id="more-projects-heading" className="careers-section-title">
              More projects for this path
            </h2>
            <p className="careers-prose">Each one comes with the framework to follow, five name ideas and a walkthrough for publishing it on GitHub.</p>
            <ul className="project-next">
              {PROJECTS_BY_PATH(path.id).map((libraryProject) => (
                <li key={libraryProject.slug}>
                  <Link href={`/careers/projects/${libraryProject.slug}`} className="careers-inline-link">
                    {libraryProject.title}
                  </Link>
                  <p>{libraryProject.summary}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="walkthrough" className="careers-section" aria-labelledby="walkthrough-heading">
            <h2 id="walkthrough-heading" className="careers-section-title">
              Project walkthrough
            </h2>
            <ol className="careers-numbered">
              {project.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section id="publish" className="careers-section" aria-labelledby="publish-heading">
            <h2 id="publish-heading" className="careers-section-title">
              What to publish
            </h2>
            <ul className="careers-bullets">
              {project.publish.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="careers-subtitle">Optional extension</h3>
            <p className="careers-prose mt-2">{project.extension}</p>
          </section>

          <section id="resume" className="careers-section" aria-labelledby="resume-heading">
            <h2 id="resume-heading" className="careers-section-title">
              Example résumé bullet
            </h2>
            <p className="careers-prose">
              Numbers are what make a bullet worth reading, so count them while you work: how much data you searched, how many findings you fixed, how many tests you added. Every figure should be one a reader can find in your report. Write the line after the work is done, and leave out impact or experience you cannot show.
            </p>

            <h3 className="careers-subtitle">Numbers to record while you work</h3>
            <div className="careers-metrics">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Count</th>
                    <th scope="col">Where it comes from</th>
                  </tr>
                </thead>
                <tbody>
                  {project.metrics.map((metric) => (
                    <tr key={metric.label}>
                      <th scope="row">{metric.label}</th>
                      <td>{metric.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="careers-resume-format">Project name | tools, datasets and frameworks | link</p>
            <figure className="careers-resume">
              <figcaption className="careers-resume-label">Example, to adapt after completing the project</figcaption>
              <p className="careers-resume-line">
                <strong>{project.resumeExample.name}</strong>
                <span aria-hidden="true">|</span>
                <span>{project.resumeExample.stack.join(", ")}</span>
                <span aria-hidden="true">|</span>
                <span className="careers-resume-link">GitHub</span>
              </p>
              <p className="mt-1.5 leading-7 text-ink">{project.resumeExample.bullet}</p>
            </figure>
            <p className="careers-prose">
              Give the project a name of its own: “{project.resumeExample.name}” is an example, not a label to copy. List the tools, datasets and frameworks you actually used, since several relevant ones show more than a single tool does. Hyperlink the last part to your published repository or report.
            </p>
          </section>

          <Reveal>
            <section id="day" className="careers-section" aria-labelledby="day-heading">
              <p className="careers-label">A day on the job</p>
              <h2 id="day-heading" className="careers-section-title mt-2">
                Try the work before you try the project
              </h2>
              <p className="careers-prose">
                A short walkthrough of a realistic situation. Nothing is scored: each choice explains what would happen, so you can talk through the reasoning later.
              </p>
              <CareerScenario path={path.id} projectTitle={project.title} />
            </section>
          </Reveal>

          <PortfolioGuide />

          <section id="related" className="careers-section" aria-labelledby="related-heading">
            <h2 id="related-heading" className="careers-section-title">
              Related paths to explore
            </h2>
            <ul className="careers-related">
              {path.related.map((id) => {
                const related = CAREER_BY_ID[id];
                return (
                  <li key={id}>
                    <NodeMark index={CAREER_PATHS.indexOf(related)} className="careers-related-mark" />
                    <div>
                      <Link href={`/careers/${related.slug}`} className="careers-inline-link text-lg">
                        {related.name}
                      </Link>
                      <p className="mt-1 leading-7 text-muted">{related.summary}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <QuizLink className="btn-cyber btn-cyber-primary btn-cyber-lg">
                Find My Path <ArrowRight className="size-4" aria-hidden />
              </QuizLink>
              <ButtonLink href="/careers#paths" variant="outline">
                Explore All Paths
              </ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
