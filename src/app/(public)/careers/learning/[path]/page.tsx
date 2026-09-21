import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Breadcrumbs } from "@/components/ui/primitives";
import { Markdown } from "@/components/learn/markdown";
import { PageHero } from "@/components/site/page-hero";
import { QuizLink } from "@/components/careers/quiz-link";
import { getPath, getProject, loadLessonsForPath, loadPaths } from "@/content/loaders";
import { safeLoad } from "@/content/safe";
import { branding } from "@config/branding";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/careers/learning/[path]">): Promise<Metadata> {
  const { path } = await props.params;
  const p = safeLoad(() => getPath(path), null);
  if (!p) return { title: "Path not found" };
  return { title: p.title, description: p.tagline, alternates: { canonical: `/careers/learning/${p.slug}` } };
}

export default async function PathOverviewPage(props: PageProps<"/careers/learning/[path]">) {
  const { path: slug } = await props.params;
  const path = safeLoad(() => getPath(slug), null);
  if (!path || path.status !== "published") notFound();
  const lessons = safeLoad(() => loadLessonsForPath(path.slug), []);
  const project = path.portfolioProject ? safeLoad(() => getProject(path.portfolioProject!), null) : null;
  const otherPaths = safeLoad(() => loadPaths().filter((p) => p.slug !== path.slug && p.status === "published").slice(0, 3), []);
  const totalMinutes = lessons.reduce((n, l) => n + l.estimatedMinutes, 0);
  const lessonCount = path.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <>
    <PageHero
      variant="compact"
      before={<Breadcrumbs items={[{ label: "Careers", href: "/careers" }, { label: "Careers", href: "/careers" }, { label: path.title }]} />}
      eyebrow={path.availability === "complete" ? "Complete learning path" : "Path overview · modules planned"}
      title={path.title}
      description={path.summary}
    />
    <div className="container-x section">
      <div className="grid gap-10 lg:grid-cols-[1.35fr_0.85fr]">
        <div>
          <section aria-labelledby="role">
            <h2 id="role" className="font-display text-2xl font-bold text-navy-900">
              What the role involves
            </h2>
            <Markdown content={path.roleOverview} className="mt-3" />
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold text-navy-900">Typical tasks</h3>
                <ul className="mt-2 space-y-1.5 text-[0.95rem] text-ink">
                  {path.typicalTasks.map((t) => (
                    <li key={t} className="flex gap-2">
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-accent" aria-hidden />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-navy-900">Prerequisites</h3>
                <ul className="mt-2 space-y-1.5 text-[0.95rem] text-ink">
                  {path.prerequisites.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-5 font-semibold text-navy-900">Starting skills</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {path.startingSkills.map((s) => (
                    <li key={s}>
                      <Badge tone="muted">{s}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-10" aria-labelledby="modules">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="modules" className="font-display text-2xl font-bold text-navy-900">
                Modules and lessons
              </h2>
              {path.modules.length ? (
                <p className="text-sm text-muted">
                  {lessonCount} lessons · about {Math.round(totalMinutes / 60)} hours
                </p>
              ) : null}
            </div>
            {path.modules.length ? (
              <ol className="mt-5 space-y-5">
                {path.modules.map((m, mi) => (
                  <li key={m.slug} className="card p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Module {mi + 1}</p>
                    <h3 className="mt-1 font-display text-lg font-bold text-navy-900">{m.title}</h3>
                    <p className="mt-1 text-sm text-muted">{m.summary}</p>
                    <ol className="mt-4 divide-y divide-line">
                      {m.lessons.map((ls) => {
                        const lesson = lessons.find((l) => l.slug === ls);
                        return (
                          <li key={ls} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="size-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
                              <div className="min-w-0">
                                <span className="font-medium text-navy-900">{lesson?.title ?? ls}</span>
                                {lesson?.kind === "exercise" ? <Badge tone="cyan" className="ml-2">Exercise</Badge> : null}
                              </div>
                            </div>
                            {lesson ? (
                              <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                                <Clock className="size-3.5" aria-hidden /> {lesson.estimatedMinutes} min
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ol>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-line-strong bg-pale p-6 text-[0.95rem] text-muted">
                This path currently has a role overview, starting skills and certification options. Lessons and exercises are planned. In the meantime, the complete paths cover the foundations most of these roles build on.
              </div>
            )}
          </section>

          {project ? (
            <section className="mt-10" aria-labelledby="project">
              <h2 id="project" className="font-display text-2xl font-bold text-navy-900">
                Portfolio project
              </h2>
              <div className="card mt-4 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={project.difficulty === "beginner" ? "cyan" : "brand"}>{project.difficulty}</Badge>
                  <span className="text-xs text-muted">~{project.estimatedHours} hours</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-navy-900">{project.title}</h3>
                <p className="mt-1 text-[0.95rem] leading-6 text-muted">{project.objective}</p>
              </div>
            </section>
          ) : null}

          <section className="mt-10 grid gap-8 sm:grid-cols-2" aria-label="Next steps">
            <div>
              <h2 className="font-display text-xl font-bold text-navy-900">Topics to build next</h2>
              <ul className="mt-3 space-y-1.5 text-[0.95rem] text-ink">
                {path.buildNext.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-500" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-navy-900">Ongoing learning routine</h2>
              <ul className="mt-3 space-y-1.5 text-[0.95rem] text-ink">
                {path.learningRoutine.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="font-semibold text-navy-900">Not sure this is your direction?</p>
            <p className="mt-1 text-sm text-muted">Answer twenty questions about the work that interests you and see which career paths to explore first.</p>
            <div className="mt-4 flex flex-col gap-2">
              <QuizLink className="btn-cyber btn-cyber-primary btn-cyber-md">Find My Path</QuizLink>
              <ButtonLink href="/careers" variant="outline">
                Explore Career Paths
              </ButtonLink>
            </div>
          </div>
          {path.certifications.length ? (
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">Certification options</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {path.certifications.map((c) => (
                  <li key={c.name}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                      {c.name} <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                    <span className="block text-muted">{c.issuer}{c.note ? ` · ${c.note}` : ""}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">Certifications are optional and never required to participate.</p>
            </div>
          ) : null}
          {path.support.length ? (
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">Where to get help</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {path.support.map((s) => (
                  <li key={s.label}>
                    {s.kind === "discord" ? (
                      <a href={branding.links.discordInvite} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
                        {s.label}
                      </a>
                    ) : s.kind === "event" ? (
                      <Link href="/events" className="text-brand-700 hover:underline">
                        {s.label}
                      </Link>
                    ) : s.href ? (
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
                        {s.label}
                      </a>
                    ) : (
                      s.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {otherPaths.length ? (
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">Other paths</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {otherPaths.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/careers/learning/${p.slug}`} className="font-medium text-brand-700 hover:underline">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/careers" className="mt-3 inline-block text-sm text-muted hover:text-brand-700">
                All learning paths
              </Link>
            </div>
          ) : null}
          <p className="text-xs text-muted">Last reviewed {path.lastReviewed}.</p>
        </aside>
      </div>
    </div>
    </>
  );
}
