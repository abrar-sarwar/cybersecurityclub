import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, FlaskConical, Hammer, Lock, MessagesSquare } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { PathCard } from "@/components/learn/path-card";
import { loadCertTracks, loadInterviewContent, loadLabGuide, loadPaths, loadProjects } from "@/content/loaders";
import { safeLoad } from "@/content/safe";
import { getViewer } from "@/server/session";

export const metadata: Metadata = {
  title: "Learn",
  description: "Preview the member learning platform: cybersecurity paths, projects, a home-lab wizard, Network+ and Security+ study tracks, and interview preparation.",
  alternates: { canonical: "/learn" },
};

export const dynamic = "force-dynamic";

export default async function LearnCatalogPage() {
  const viewer = await getViewer();
  const isMember = Boolean(viewer && (viewer.isVerified || viewer.isOfficer));
  const paths = safeLoad(() => loadPaths().filter((p) => p.status === "published"), []);
  const projects = safeLoad(() => loadProjects().filter((p) => p.status === "published"), []);
  const certs = safeLoad(() => loadCertTracks().filter((t) => t.status === "published"), []);
  const lab = safeLoad(() => loadLabGuide(), null);
  const interview = safeLoad(() => loadInterviewContent(), null);
  const complete = paths.filter((p) => p.availability === "complete");
  const overviews = paths.filter((p) => p.availability !== "complete");

  return (
    <>
      <section className="container-x pt-14 pb-10 sm:pt-20">
        <SectionHeading as="h1" eyebrow="Learning platform" title="Choose a path, build real experience, learn to explain it" description="Anyone can browse what the platform covers. Lessons, projects, the lab wizard, practice questions and interview notes open for approved members." />
        {!isMember ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-800">
            <Lock className="size-4 shrink-0" aria-hidden />
            <p className="flex-1">
              You are previewing the catalog.{" "}
              {viewer ? (
                <>
                  {viewer.isSuspended ? "Your membership is suspended." : "Verify your GSU student email to unlock everything."}{" "}
                  <Link href="/dashboard" className="font-semibold underline underline-offset-2">
                    Go to your dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/join" className="font-semibold underline underline-offset-2">
                    Join the club
                  </Link>{" "}
                  or{" "}
                  <Link href="/join?next=/learn#sign-in" className="font-semibold underline underline-offset-2">
                    sign in
                  </Link>{" "}
                  to unlock everything.
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard">Go to your dashboard</ButtonLink>
            <ButtonLink href="/questionnaire" variant="outline">
              Take the path questionnaire
            </ButtonLink>
          </div>
        )}
      </section>

      <section className="container-x pb-14" id="paths" aria-labelledby="paths-heading">
        <h2 id="paths-heading" className="font-display text-2xl font-bold text-navy-900">
          Complete learning paths
        </h2>
        <p className="mt-1 text-muted">Ordered modules, guided practice, a portfolio project, certification options and interview preparation.</p>
        {complete.length ? (
          <ul className="mt-6 grid gap-5 md:grid-cols-3">
            {complete.map((p) => (
              <PathCard key={p.slug} path={p} />
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed border-line-strong bg-pale p-6 text-sm text-muted">Path content is being prepared.</p>
        )}
        {overviews.length ? (
          <>
            <h3 className="mt-12 font-display text-xl font-bold text-navy-900">More paths (overviews)</h3>
            <p className="mt-1 text-muted">Role overviews and starting skills. Full modules are planned; the label on each card shows what is available today.</p>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {overviews.map((p) => (
                <PathCard key={p.slug} path={p} />
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="surface-pale border-y border-line section" id="projects" aria-labelledby="projects-heading">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="Project library" title="Projects you can finish and talk about" description="Each project has an objective, target skills, difficulty, estimated time, environment, steps with hints, completion criteria, a deliverable, reflection questions and matching interview topics." />
          <ul className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.slug} className="card p-5">
                <div className="flex items-center gap-2">
                  <Hammer className="size-4 text-accent" aria-hidden />
                  <Badge tone={p.difficulty === "beginner" ? "cyan" : p.difficulty === "intermediate" ? "brand" : "navy"}>{p.difficulty}</Badge>
                  <span className="text-xs text-muted">~{p.estimatedHours} h</span>
                </div>
                <h3 className="mt-2 font-display text-base font-bold text-navy-900">{isMember ? <Link href={`/projects/${p.slug}`} className="hover:text-brand-700">{p.title}</Link> : p.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{p.summary}</p>
              </li>
            ))}
            {!projects.length ? <li className="text-sm text-muted">Projects are being prepared.</li> : null}
          </ul>
        </div>
      </section>

      <section className="section" id="home-lab" aria-labelledby="lab-heading">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <FlaskConical className="size-5" aria-hidden />
            </div>
            <h2 id="lab-heading" className="mt-4 font-display text-2xl font-bold text-navy-900">
              Home lab setup wizard
            </h2>
            <p className="mt-2 text-[0.95rem] leading-6 text-muted">
              Answer a few questions about your computer (operating system, processor, memory, storage, install permissions, experience) and get a setup guide that fits it, including verified official download links, resource allocation, network isolation, snapshots, common errors, a first exercise and cleanup.
            </p>
            {lab ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {lab.environments.map((e) => (
                  <li key={e.id}>
                    <Badge tone={e.type === "browser" ? "cyan" : "muted"}>{e.name}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
            <ButtonLink href={isMember ? "/lab-setup" : "/join"} variant="secondary" className="mt-5">
              {isMember ? "Open the wizard" : "Members only · Join"}
            </ButtonLink>
          </div>
          <div className="card p-6 sm:p-8" id="certifications">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-accent">
              <BookOpenCheck className="size-5" aria-hidden />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-navy-900">Network+ and Security+ study tracks</h2>
            <p className="mt-2 text-[0.95rem] leading-6 text-muted">
              Plain-language overviews, topic maps, lessons, original practice questions with explanations, practical exercises and a review checklist. Useful foundations during college; they are not required for every role and do not guarantee a job.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {certs.map((t) => (
                <li key={t.slug} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                  <span className="font-medium text-navy-900">{t.name}</span>
                  <span className="text-muted">
                    {t.examCode} · verified {t.verifiedOn}
                  </span>
                </li>
              ))}
            </ul>
            <ButtonLink href={isMember ? "/certifications" : "/join"} variant="secondary" className="mt-5">
              {isMember ? "Open study tracks" : "Members only · Join"}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="surface-pale border-t border-line section" id="interview-prep" aria-labelledby="interview-heading">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-accent">
              <MessagesSquare className="size-5" aria-hidden />
            </div>
            <h2 id="interview-heading" className="mt-4 font-display text-2xl font-bold text-navy-900">
              Interview preparation
            </h2>
            <p className="mt-2 text-[0.95rem] leading-6 text-muted">
              Technical, behavioral, scenario and project prompts with what strong answers include, common weak patterns and likely follow-ups. Private practice notes stay with you. We never suggest claiming work you have not done.
            </p>
            <ButtonLink href={isMember ? "/interview-prep" : "/join"} variant="secondary" className="mt-5">
              {isMember ? "Start practicing" : "Members only · Join"}
            </ButtonLink>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(interview?.topics ?? []).map((t) => (
              <li key={t.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t.category}</p>
                <p className="mt-0.5 font-medium text-navy-900">{t.title}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
