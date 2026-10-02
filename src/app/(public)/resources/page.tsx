import type { Metadata } from "next";
import Link from "next/link";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { JumpNav, ResourceAnchor, ToolCard } from "@/components/resources/resource-parts";
import {
  GETTING_STARTED,
  SECURITY_PLUS_DOMAINS,
  SECURITY_PLUS_EXAM,
  SECURITY_PLUS_RESOURCES,
  TOOL_CATEGORIES,
  TOOLS,
  WORKSHOP_TOPICS,
} from "@/content/club/resources";

export const metadata: Metadata = {
  title: "Resources",
  description: `A beginner roadmap, a Security+ ${SECURITY_PLUS_EXAM} study guide and a CTF toolkit, curated by the ${branding.displayName}.`,
  alternates: { canonical: "/resources" },
};

const SECTIONS = [
  { id: "getting-started", label: "Getting started" },
  { id: "security-plus", label: "Security+" },
  { id: "ctf-toolkit", label: "CTF toolkit" },
  { id: "workshops", label: "Workshops" },
];

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Resources"
        description="A page to bookmark: where to start, what to study for Security+, and the tools to keep open during a CTF."
      />
      <JumpNav items={SECTIONS} />

      <section id="getting-started" className="section" aria-labelledby="getting-started-heading">
        <div className="container-x">
          <SectionHeading
            id="getting-started-heading"
            eyebrow="Getting started"
            title="New to cybersecurity? Start here."
            description="Six steps, in order. Each one has a free resource or two to work through."
          />
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {GETTING_STARTED.map((step, index) => (
              <li key={step.title} className="card flex gap-4 p-5">
                <span aria-hidden="true" className="font-mono text-sm font-bold text-brand-700">
                  0{index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-navy-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{step.summary}</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6">
                    {step.resources.map((resource) => (
                      <li key={resource.name}>
                        <ResourceAnchor url={resource.url}>{resource.name}</ResourceAnchor>
                        <span className="text-muted"> — {resource.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="security-plus" className="section surface-pale" aria-labelledby="security-plus-heading">
        <div className="container-x">
          <SectionHeading
            id="security-plus-heading"
            eyebrow="Certification"
            title={`Security+ (${SECURITY_PLUS_EXAM}) study guide`}
            description="The exam is split into five domains. Study them in order, and spend the most time where the weight is."
          />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY_PLUS_DOMAINS.map((domain) => (
              <li key={domain.number} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">Domain {domain.number}</span>
                  <Badge tone="brand">{domain.weight}% of exam</Badge>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-navy-900">{domain.title}</h3>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
                  {domain.topics.map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <h3 className="mt-10 font-display text-lg font-bold text-navy-900">Study resources</h3>
          <ul className="mt-4 divide-y divide-line border-y border-line text-sm leading-6">
            {SECURITY_PLUS_RESOURCES.map((resource) => (
              <li key={resource.name} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
                <span className="sm:w-72 sm:shrink-0">
                  {resource.url ? (
                    <ResourceAnchor url={resource.url}>{resource.name}</ResourceAnchor>
                  ) : (
                    <span className="flex flex-wrap items-center gap-2 font-semibold text-navy-900">
                      {resource.name}
                      <Badge tone="muted">Coming soon</Badge>
                    </span>
                  )}
                </span>
                <span className="text-muted">{resource.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="ctf-toolkit" className="section" aria-labelledby="ctf-toolkit-heading">
        <div className="container-x">
          <SectionHeading
            id="ctf-toolkit-heading"
            eyebrow="CTF toolkit"
            title="Things to keep open in another tab during a CTF"
            description="Grouped by challenge category. Each one says what it does, so you can pick without opening it."
          />
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm" aria-label="Tool categories">
            {TOOL_CATEGORIES.map((category) => (
              <li key={category}>
                <a href={`#tools-${slug(category)}`} className="inline-flex min-h-9 items-center text-muted hover:text-navy-900">
                  {category}
                </a>
              </li>
            ))}
          </ul>
          {TOOL_CATEGORIES.map((category) => (
            <div key={category} className="mt-8">
              <h3 id={`tools-${slug(category)}`} className="font-display text-lg font-bold text-navy-900">
                {category}
              </h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TOOLS.filter((tool) => tool.category === category).map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="workshops" className="section surface-pale" aria-labelledby="workshops-heading">
        <div className="container-x">
          <SectionHeading
            id="workshops-heading"
            eyebrow="Workshops"
            title="Club workshop resources"
            description={
              <>
                Slides and exercises from club workshops will be collected here by topic. Until then, see{" "}
                <Link href="/events#past-events" className="font-semibold text-navy-900 underline underline-offset-4 hover:text-brand-700">
                  past events
                </Link>{" "}
                for what each session covered.
              </>
            }
          />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WORKSHOP_TOPICS.map((item) => (
              <li key={item.topic} className="card p-4">
                <h3 className="font-display text-base font-bold text-navy-900">{item.topic}</h3>
                {item.links?.length ? (
                  <ul className="mt-2 space-y-1 text-sm leading-6">
                    {item.links.map((link) => (
                      <li key={link.url}>
                        <ResourceAnchor url={link.url}>{link.label}</ResourceAnchor>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">Materials coming soon.</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="resources-cta-heading">
        <div className="container-x flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="resources-cta-heading" className="signal-section-title">
              Stuck? Ask in Discord.
            </h2>
            <p className="mt-2 text-muted">Someone in the club has probably hit the same wall.</p>
          </div>
          <ButtonLink href={branding.links.discordInvite} variant="discord" size="lg" external>
            <DiscordMark />
            Join Discord
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
