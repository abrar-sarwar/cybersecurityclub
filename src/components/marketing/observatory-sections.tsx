import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { Figure } from "@/components/media/slot-image";
import { Globe } from "./observatory-motion";
import { stripMarkdown } from "./sections";
import { formatEventRange } from "@/lib/dates";
import { resolveSingle, type ResolvedImage } from "@/server/services/media";
import type { EventView } from "@/server/services/events";
import type { StoryView } from "@/server/services/people";
import type { loadObservatory } from "@/content/observatory";

type Content = ReturnType<typeof loadObservatory>;

export function ObservatoryHero() {
  return (
    <section className="observatory-hero" aria-labelledby="hero-heading">
      <div className="container-x hero-composition">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">Georgia State University <span aria-hidden>·</span> Cybersecurity Club</p>
          <h1 id="hero-heading">Your people.<br /><span>A bigger world.</span></h1>
          <p className="hero-description">Meet students who share your curiosity. Practice cybersecurity, build projects, and stay connected to what’s next.</p>
          <div className="hero-actions">
            <ButtonLink href="/join" size="lg">Join the club <ArrowUpRight size={18} aria-hidden /></ButtonLink>
            <ButtonLink href="/events" size="lg" variant="outline">Explore events <ArrowRight size={17} aria-hidden /></ButtonLink>
          </div>
          <p className="hero-reassurance"><span aria-hidden />All experience levels welcome.</p>
        </div>
        <div className="hero-planet"><Globe /><p className="globe-caption">Rooted in Atlanta. Curious about everywhere.</p></div>
      </div>
      <div className="container-x hero-baseline"><span>Learn together. Build what’s next.</span><span>Atlanta, Georgia <span aria-hidden>↗</span></span></div>
    </section>
  );
}

export function ObservatoryEvent({ event }: { event: EventView | null }) {
  return (
    <section className="event-section" aria-labelledby="next-event-heading">
      <div className="container-x">
        <div className="section-kicker"><h2 className="eyebrow" id="next-event-heading">01 / Next up</h2><Link className="text-link" href="/events">All events <ArrowUpRight size={16} aria-hidden /></Link></div>
        {event ? (
          <article className="agenda-row">
            <time className="agenda-date" dateTime={event.startsAt.toISOString()}><span>{event.startsAt.toLocaleDateString("en-US", { month: "short", timeZone: branding.timezone })}</span><strong>{event.startsAt.toLocaleDateString("en-US", { day: "2-digit", timeZone: branding.timezone })}</strong></time>
            <div>
              <p className="eyebrow">{event.status === "cancelled" ? "Cancelled" : event.audienceLevel === "beginner" ? "Beginners welcome" : "Club event"}{event.isSample ? " · Sample" : ""}</p>
              <h3><Link href={`/events/${event.slug}`}>{event.title}</Link></h3>
              <p className="event-meta">{formatEventRange(event.startsAt, event.endsAt)} · {event.timezone === "America/New_York" ? "Eastern" : event.timezone}{event.location ? ` · ${event.location}` : ""}</p>
              {event.description ? <p className="event-description">{stripMarkdown(event.description)}</p> : null}
            </div>
            <ButtonLink href={event.status !== "cancelled" && event.pinUrl ? event.pinUrl : `/events/${event.slug}`} variant="outline">{event.status !== "cancelled" && event.pinUrl ? "RSVP on PIN" : "Event details"}<ArrowUpRight size={16} aria-hidden /></ButtonLink>
          </article>
        ) : (
          <div className="event-notice"><p>Good company. Something to look forward to.<span>Our next date will be announced on Discord and PIN.</span></p><ButtonLink href={branding.links.discordInvite} variant="outline" external>Find us on Discord <ArrowUpRight size={16} aria-hidden /></ButtonLink></div>
        )}
      </div>
    </section>
  );
}

export function ObservatoryCommunity({ images }: { images: ResolvedImage[] }) {
  return (
    <section className="section community-section" aria-labelledby="community-heading">
      <div className="container-x">
        <div className="editorial-split">
          <div><p className="eyebrow">02 / In good company</p><h2 id="community-heading" className="section-title">Serious curiosity.<br />Good company.</h2></div>
          <div className="community-copy"><p>Find people to practice with, trade ideas with, and learn alongside. Start where you are.</p><p className="text-muted">A question at a workshop. A teammate for your first CTF. Someone who’s just as excited about the thing you’re building.</p><Link href="/community" className="text-link">Meet the community <ArrowUpRight size={17} aria-hidden /></Link></div>
        </div>
        {images.length ? <div className="community-photos">{images.slice(0, 2).map((image, index) => <Figure key={image.id} image={image} className={index ? "secondary-photo" : "feature-photo"} frameClassName="aspect-[16/10]" sizes="(min-width: 768px) 60vw, 100vw" />)}</div> : null}
        <ul className="community-practices"><li><span>Come curious</span>Workshops & peer learning</li><li><span>Try something</span>Projects & CTF practice</li><li><span>Go further</span>Career conversations & connections</li></ul>
      </div>
    </section>
  );
}

export async function ObservatoryProjects({ projects }: { projects: Content["projects"] }) {
  const approved = projects.filter((p) => p.approved && p.status === "published").slice(0, 3);
  const images = await Promise.all(approved.map((p) => resolveSingle(p.imageSlot)));
  return (
    <section id="projects" className="section project-section" aria-labelledby="projects-heading">
      <div className="container-x">
        <div className="section-kicker"><p className="eyebrow">03 / Made by members</p><span className="quiet-label">Ideas into practice</span></div>
        <h2 id="projects-heading" className="section-title">Build something.<br />Make it yours.</h2>
        {approved.length ? <div className="project-showcase">{approved.map((project, index) => <article key={project.id} className={index === 0 ? "project-feature" : "project-entry"}>
          {images[index] ? <Figure image={images[index]!} frameClassName="aspect-video" sizes="(min-width: 1024px) 60vw, 100vw" /> : null}
          <h3><a href={project.href} target="_blank" rel="noopener noreferrer">{project.title}<ArrowUpRight size={20} aria-hidden /></a></h3><p>{project.summary}</p><ul className="skill-tags">{project.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
        </article>)}</div> : <div className="project-invitation"><p>The next project we share could be yours.<span>Built a tool, explored an idea, or written something useful? Send it to the officers for review.</span></p><ButtonLink href={`mailto:${branding.contact.email}?subject=Project%20for%20the%20club%20website`} variant="outline">Share your project <ArrowUpRight size={17} aria-hidden /></ButtonLink></div>}
      </div>
    </section>
  );
}

export function ObservatoryLearning() {
  const steps = [
    ["Explore your interests", "Discover the questions and problems that catch your attention."],
    ["Choose a path", "Find a direction in the catalog, from application security to security operations."],
    ["Practice with purpose", "Turn lessons into practical work, and learn to explain what you built."],
  ];
  return <section className="section learning-section" aria-labelledby="learning-heading"><div className="container-x editorial-split">
    <div><p className="eyebrow">04 / A direction, not a prerequisite</p><h2 id="learning-heading" className="section-title">Find your direction.<br />Build the skills.</h2><p className="section-description">You don’t need to have it all figured out. Explore the catalog, then take your next step with the club.</p><ButtonLink href="/learn" variant="outline">Explore learning paths <ArrowRight size={17} aria-hidden /></ButtonLink><p className="member-note">Full lessons and practice resources are for approved members. <Link href="/join">How to join</Link></p></div>
    <ol className="learning-steps">{steps.map(([title, body], index) => <li key={title}><span className="step-number">0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div><ArrowUpRight size={19} aria-hidden /></li>)}</ol>
  </div></section>;
}

export function ObservatoryNews({ news, today }: { news: Content["news"]; today: string }) {
  // Current items must have a recent human review; older articles remain in the source file.
  const cutoff = new Date(new Date(today).getTime() - 90 * 86400000).toISOString().slice(0, 10);
  const items = news.filter((item) => item.status === "published" && item.publishedAt <= today && item.publishedAt >= cutoff && item.reviewedAt <= today && item.reviewedAt >= cutoff).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3);
  if (!items.length) return null;
  return <section className="section" aria-labelledby="news-heading"><div className="container-x"><p className="eyebrow">Worth a closer look</p><h2 id="news-heading" className="section-title">On our radar.</h2><ul className="news-list">{items.map((item) => <li key={item.href}><div className="news-meta"><span>{item.source} · {item.topic}</span><time dateTime={item.publishedAt}>{item.publishedAt}</time></div><h3><a href={item.href} target="_blank" rel="noopener noreferrer">{item.title}<ArrowUpRight size={20} aria-hidden /></a></h3><p>{item.relevance}</p></li>)}</ul></div></section>;
}

export function ObservatorySpotlight({ stories }: { stories: StoryView[] }) {
  const story = stories.find((item) => !item.isSample && item.photo);
  if (!story) return null;
  return <section className="section spotlight-section" aria-labelledby="spotlight-heading"><div className="container-x editorial-split"><Figure image={story.photo!} frameClassName="aspect-[4/3]" sizes="(min-width: 768px) 40vw, 100vw" /><div><p className="eyebrow">Member spotlight</p><h2 id="spotlight-heading" className="section-title">{story.memberName}</h2><p className="spotlight-role">{story.roleTitle} · {story.company}{story.dates ? ` · ${story.dates}` : ""}</p><p className="section-description">{story.summary}</p><Link href="/stories" className="text-link">More member stories <ArrowUpRight size={17} aria-hidden /></Link></div></div></section>;
}
