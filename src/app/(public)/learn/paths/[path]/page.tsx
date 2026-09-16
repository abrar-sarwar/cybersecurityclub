import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink, Lock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Breadcrumbs } from "@/components/ui/primitives";
import { Markdown } from "@/components/learn/markdown";
import { PathIcon } from "@/components/learn/path-card";
import { getPath, getProject, loadLessonsForPath, loadPaths } from "@/content/loaders";
import { safeLoad } from "@/content/safe";
import { getViewer } from "@/server/session";
import { branding } from "@config/branding";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/learn/paths/[path]">): Promise<Metadata> {
  const { path } = await props.params;
  const p = safeLoad(() => getPath(path), null);
  if (!p) return { title: "Path not found" };
  return { title: p.title, description: p.tagline, alternates: { canonical: `/learn/paths/${p.slug}` } };
}

export default async function PathOverviewPage(props: PageProps<"/learn/paths/[path]">) {
  const { path: slug } = await props.params;
  const path = safeLoad(() => getPath(slug), null);
  if (!path || path.status !== "published") notFound();
  const viewer = await getViewer();
  const isMember = Boolean(viewer && (viewer.isVerified || viewer.isOfficer));
  const lessons = safeLoad(() => loadLessonsForPath(path.slug), []);
  const project = path.portfolioProject ? safeLoad(() => getProject(path.portfolioProject!), null) : null;
  // Progress tracking is paused while it moves from the legacy tables to the member portal.
  const progress = new Map<string, { status: string }>();
  const otherPaths = safeLoad(() => loadPaths().filter((p) => p.slug !== path.slug && p.status === "published").slice(0, 3), []);
  const totalMinutes = lessons.reduce((n, l) => n + l.estimatedMinutes, 0);
  const completed = [...progress.values()].filter((p) => p.status === "completed").length;
  const lessonCount = path.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="container-x py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Learn", href: "/learn" }, { label: path.title }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.35fr_0.85fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-accent">
              <PathIcon icon={path.icon} className="size-6" />
            </div>
            {path.availability === "complete" ? <Badge tone="success">Complete path</Badge> : <Badge tone="muted">Overview only · modules planned</Badge>}
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">{path.title}</h1>
          <p className="mt-3 text-lg leading-8 text-muted">{path.summary}</p>

          <section className="mt-8" aria-labelledby="role">
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
                  {isMember ? ` · ${completed} completed` : ""}
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
                        const status = progress.get(`lesson:${path.slug}/${ls}`)?.status;
                        const href = `/learn/paths/${path.slug}/${m.slug}/${ls}`;
                        return (
                          <li key={ls} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-3">
                              {isMember ? (
                                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${status === "completed" ? "border-success-600 bg-success-50 text-success-600" : "border-line-strong text-transparent"}`} aria-hidden>
                                  <CheckCircle2 className="size-4" />
                                </span>
                              ) : (
                                <Lock className="size-4 shrink-0 text-faint" aria-hidden />
                              )}
                              <div className="min-w-0">
                                {isMember ? (
                                  <Link href={href} className="font-medium text-navy-900 hover:text-brand-700">
                                    {lesson?.title ?? ls}
                                  </Link>
                                ) : (
                                  <span className="font-medium text-navy-900">{lesson?.title ?? ls}</span>
                                )}
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
                {isMember ? (
                  <ButtonLink href={`/projects/${project.slug}`} variant="secondary" className="mt-4">
                    Open project
                  </ButtonLink>
                ) : null}
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
            {isMember && viewer ? (
              <>
                <p className="font-semibold text-navy-900">Progress tracking is coming back</p>
                <p className="mt-1 text-sm text-muted">Choosing a path and saving lesson progress are paused while they move into the member portal. The lessons are open to you now.</p>
                <ButtonLink href="/dashboard" variant="secondary" className="mt-4 w-full">
                  Go to your dashboard
                </ButtonLink>
              </>
            ) : (
              <>
                <p className="font-semibold text-navy-900">Members can choose this path</p>
                <p className="mt-1 text-sm text-muted">Lessons and projects open after you verify your GSU student email.</p>
                <div className="mt-4 flex flex-col gap-2">
                  <ButtonLink href="/join">Join the club</ButtonLink>
                  <ButtonLink href={`/join?next=/learn/paths/${path.slug}#sign-in`} variant="outline">
                    Sign in
                  </ButtonLink>
                </div>
              </>
            )}
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
                    <Link href={`/learn/paths/${p.slug}`} className="font-medium text-brand-700 hover:underline">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/learn" className="mt-3 inline-block text-sm text-muted hover:text-brand-700">
                Explore all paths
              </Link>
            </div>
          ) : null}
          <p className="text-xs text-muted">Last reviewed {path.lastReviewed}.</p>
        </aside>
      </div>
    </div>
  );
}
