import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/primitives";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { GithubWalkthrough } from "@/components/careers/github-walkthrough";
import { CAREER_BY_ID } from "@/content/careers/paths";
import { FRAMEWORK_HOWTO } from "@/content/careers/github";
import { DIFFICULTY, LIBRARY_PROJECTS, getLibraryProject } from "@/content/careers/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return LIBRARY_PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(props: PageProps<"/careers/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getLibraryProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} Project`,
    description: `${project.summary} ${project.benefit}`,
    alternates: { canonical: `/careers/projects/${project.slug}` },
  };
}

const SECTIONS = [
  { id: "worth", label: "Why it is worth it" },
  { id: "name", label: "Name it" },
  { id: "framework", label: "The framework" },
  { id: "steps", label: "Do the work" },
  { id: "publish", label: "What to publish" },
  { id: "github", label: "Put it on GitHub" },
  { id: "resume", label: "The résumé line" },
];

export default async function ProjectPage(props: PageProps<"/careers/projects/[slug]">) {
  const { slug } = await props.params;
  const project = getLibraryProject(slug);
  if (!project) notFound();
  const path = CAREER_BY_ID[project.path];
  const nearby = LIBRARY_PROJECTS.filter((other) => other.path === project.path && other.slug !== project.slug);
  const level = DIFFICULTY[project.difficulty];

  return (
    <article>
      <PageHero
        variant="compact"
        before={
          <Breadcrumbs
            items={[{ label: "Careers", href: "/careers" }, { label: "Projects", href: "/careers/projects" }, { label: project.title }]}
          />
        }
        eyebrow={`Project ${String(project.rank).padStart(2, "0")}`}
        title={project.title}
        description={project.summary}
      >
        <ButtonLink href="#steps">Start the walkthrough</ButtonLink>
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
          <dl className="project-facts">
            <div>
              <dt>Career path</dt>
              <dd>
                <Link href={`/careers/${path.slug}`} className="careers-inline-link">
                  {path.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd className="project-fact-level" data-level={project.difficulty}>
                <span className="project-card-meter" aria-hidden="true">
                  <i data-on={level.weight >= 1} />
                  <i data-on={level.weight >= 2} />
                  <i data-on={level.weight >= 3} />
                </span>
                {level.label}
              </dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{project.hours}</dd>
            </div>
            <div>
              <dt>On a résumé</dt>
              <dd>{level.resumeValue}</dd>
            </div>
          </dl>

          <section id="worth" className="careers-section careers-section-first" aria-labelledby="worth-heading">
            <h2 id="worth-heading" className="careers-section-title">
              Why this one is worth your hours
            </h2>
            <p className="careers-prose">{project.benefit}</p>
            <p className="careers-note">{level.note}</p>
            <h3 className="careers-subtitle">What you walk away with</h3>
            <ul className="project-stack">
              {project.stack.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
            <p className="careers-prose">
              Those names go on your résumé line, and every one of them is something an interviewer can ask you about, so use them honestly.
            </p>
          </section>

          <section id="name" className="careers-section" aria-labelledby="name-heading">
            <h2 id="name-heading" className="careers-section-title">
              Give it a name of its own
            </h2>
            <p className="careers-prose">
              “{project.title}” describes the work. It is not the name. Pick one of these, or invent your own, then use it everywhere: the repository, the README title and the résumé.
            </p>
            <ul className="project-names">
              {project.nameIdeas.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>

          <section id="framework" className="careers-section" aria-labelledby="framework-heading">
            <h2 id="framework-heading" className="careers-section-title">
              The framework you follow
            </h2>
            <ul className="project-frameworks">
              {project.frameworks.map((framework) => (
                <li key={framework.name}>
                  <p className="project-framework-name">{framework.name}</p>
                  <p>{framework.use}</p>
                </li>
              ))}
            </ul>
            <h3 className="careers-subtitle">{FRAMEWORK_HOWTO.heading}</h3>
            <p className="careers-prose">{FRAMEWORK_HOWTO.intro}</p>
            <ol className="careers-numbered">
              {FRAMEWORK_HOWTO.steps.map((step) => (
                <li key={step.label}>
                  <strong>{step.label}.</strong> {step.body}
                </li>
              ))}
            </ol>
            <p className="careers-note">{FRAMEWORK_HOWTO.note}</p>
          </section>

          <section id="steps" className="careers-section" aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="careers-section-title">
              Do the work
            </h2>
            <p className="careers-prose">Keep a note file open. One line per step: what you ran, what came back, what you decided.</p>
            <ol className="careers-numbered">
              {project.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section id="publish" className="careers-section" aria-labelledby="publish-heading">
            <h2 id="publish-heading" className="careers-section-title">
              What ends up in the repository
            </h2>
            <ul className="careers-bullets">
              {project.publish.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <Reveal>
            <section id="github" className="careers-section" aria-labelledby="github-heading">
              <h2 id="github-heading" className="careers-section-title">
                Put it on GitHub
              </h2>
              <GithubWalkthrough />
            </section>
          </Reveal>

          <section id="resume" className="careers-section" aria-labelledby="resume-heading">
            <h2 id="resume-heading" className="careers-section-title">
              The résumé line
            </h2>
            <p className="careers-resume-format">Project name | tools, datasets and frameworks | link</p>
            <figure className="careers-resume">
              <figcaption className="careers-resume-label">Example, with your own name and your own numbers</figcaption>
              <p className="careers-resume-line">
                <strong>{project.nameIdeas[0]}</strong>
                <span aria-hidden="true">|</span>
                <span>{[...project.stack, ...project.frameworks.map((framework) => framework.name)].slice(0, 5).join(", ")}</span>
                <span aria-hidden="true">|</span>
                <span className="careers-resume-link">GitHub</span>
              </p>
              <p className="mt-1.5 leading-7 text-ink">{project.resumeBullet}</p>
            </figure>
            <p className="careers-prose">
              The numbers come from your notes, not from this page. Count as you work, keep every figure checkable in your report, and hyperlink the last part to the repository.
            </p>
          </section>

          <section className="careers-section" aria-labelledby="next-heading">
            <h2 id="next-heading" className="careers-section-title">
              Next
            </h2>
            <ul className="project-next">
              {nearby.map((other) => (
                <li key={other.slug}>
                  <Link href={`/careers/projects/${other.slug}`} className="careers-inline-link">
                    {other.title}
                  </Link>
                  <p>{other.summary}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/careers/projects">
                All {LIBRARY_PROJECTS.length} projects <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href={`/careers/${path.slug}`} variant="outline">
                About {path.name}
              </ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
