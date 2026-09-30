import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/primitives";
import { PageHero } from "@/components/site/page-hero";
import { InterviewPractice } from "@/components/resources/interview-practice";
import { ToolExplorer } from "@/components/resources/tool-explorer";
import { VideoEmbed } from "@/components/resources/video-embed";
import { withCode } from "@/components/resources/with-code";
import { loadInterviewContent } from "@/content/loaders";
import { GUIDES, getGuide, linkedGuides, type GuideItem, type GuideSection } from "@/content/resources";
import { TOOLS, TOOL_CATEGORIES } from "@/content/resources/tools";
import { safeLoad } from "@/content/safe";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata(props: PageProps<"/resources/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.title,
    description: guide.summary,
    alternates: { canonical: `/resources/${guide.slug}` },
  };
}

const checkedFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

function Item({ item }: { item: GuideItem }) {
  return (
    <li>
      {item.label ? <strong className="guide-item-label">{item.label} </strong> : null}
      {withCode(item.body)}
    </li>
  );
}

/** The interactive block a section asks for. The question bank is read from the club's content files. */
function Widget({ kind }: { kind: NonNullable<GuideSection["widget"]> }) {
  if (kind === "tools") return <ToolExplorer tools={TOOLS} categories={TOOL_CATEGORIES} />;
  const topics = safeLoad(() => loadInterviewContent().topics, []);
  return topics.length ? <InterviewPractice topics={topics} /> : <p className="careers-note">The practice questions could not be loaded. Try again shortly.</p>;
}

export default async function GuidePage(props: PageProps<"/resources/[slug]">) {
  const { slug } = await props.params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const videoSection = guide.sections.find((section) => section.video);
  const linked = linkedGuides(guide.slug);

  return (
    <article>
      <PageHero
        variant="compact"
        before={<Breadcrumbs items={[{ label: "Resources", href: "/resources" }, { label: guide.title }]} />}
        eyebrow={guide.eyebrow}
        title={guide.title}
        description={guide.summary}
      >
        {videoSection ? <ButtonLink href={`#${videoSection.id}`}>Watch the video</ButtonLink> : null}
        <ButtonLink href="#links" variant="outline">
          Jump to the links
        </ButtonLink>
      </PageHero>

      <div className="container-x careers-detail careers-detail-grid">
        <nav className="careers-toc" aria-label="On this page">
          <p className="careers-label">On this page</p>
          <ul>
            {guide.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
            <li>
              <a href="#links">Links</a>
            </li>
          </ul>
        </nav>

        <div className="careers-detail-body">
          <dl className="project-facts">
            {guide.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <p className="careers-note guide-notice">
            <strong>{guide.notice.title}</strong>
            {withCode(guide.notice.body)}
          </p>

          {guide.sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={index === 0 ? "careers-section careers-section-first" : "careers-section"}
              aria-labelledby={`${section.id}-heading`}
            >
              <h2 id={`${section.id}-heading`} className="careers-section-title">
                {section.title}
              </h2>
              {section.intro ? <p className="careers-prose">{withCode(section.intro)}</p> : null}
              {section.widget ? <Widget kind={section.widget} /> : null}
              {section.weights ? (
                <div className="guide-weights">
                  <p className="careers-label">Share of the exam</p>
                  <ul>
                    {section.weights.map((domain) => (
                      <li key={domain.name}>
                        <span>{domain.name}</span>
                        <span className="guide-weights-percent">{domain.percent}%</span>
                        {/* Widths are relative to a third of the exam, so the largest domain nearly fills the row. */}
                        <span className="guide-weights-bar" aria-hidden="true">
                          <i style={{ width: `${Math.min(100, domain.percent * 3)}%` }} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {section.steps ? (
                <ol className="careers-numbered">
                  {section.steps.map((step) => (
                    <Item key={step.body} item={step} />
                  ))}
                </ol>
              ) : null}
              {section.bullets ? (
                <ul className="careers-bullets">
                  {section.bullets.map((bullet) => (
                    <Item key={bullet.body} item={bullet} />
                  ))}
                </ul>
              ) : null}
              {section.video ? <VideoEmbed video={section.video} /> : null}
              {section.note ? <p className="careers-note">{withCode(section.note)}</p> : null}
            </section>
          ))}

          <section id="links" className="careers-section" aria-labelledby="links-heading">
            <h2 id="links-heading" className="careers-section-title">
              Links
            </h2>
            <p className="careers-prose">
              Every link was opened on {checkedFormat.format(new Date(guide.checked))}. Prices and promo codes change, so confirm them on the page before you pay.
            </p>
            {guide.links.map((group) => (
              <Fragment key={group.group}>
                <h3 className="careers-subtitle">{group.group}</h3>
                <ul className="careers-resources">
                  {group.items.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                        <ExternalLink className="size-3.5" aria-hidden />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      <p>{link.note}</p>
                      {link.promo ? (
                        <p className="guide-promo">
                          Promo code <code>{link.promo}</code> was shared by a member and may have expired.
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Fragment>
            ))}
          </section>

          <section id="next" className="careers-section" aria-labelledby="next-heading">
            <h2 id="next-heading" className="careers-section-title">
              Where this leads
            </h2>
            <p className="careers-prose">The resources this one is linked to on the map.</p>
            <ul className="project-next">
              {linked.map((other) => (
                <li key={other.slug}>
                  <Link href={`/resources/${other.slug}`} className="careers-inline-link">
                    {other.title}
                  </Link>
                  <p>{other.card}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/careers/projects">
                Browse the projects <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/resources" variant="outline">
                All resources
              </ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
