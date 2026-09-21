import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { GlitchHeading } from "./glitch-heading";
import { HeroCircuit } from "./hero-circuit";

/**
 * Opening section for every inner page, built from the homepage's parts:
 * star field and glow (from the layout backdrop), circuit edges, a glitch
 * heading, and the homepage button styles for actions.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  before,
  corner,
  backdrop,
  variant = "feature",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  /** Actions, usually buttons. */
  children?: ReactNode;
  /** Shown above the eyebrow, such as breadcrumbs. */
  before?: ReactNode;
  /** Panel pinned to the top right of the hero, such as a status readout. */
  corner?: ReactNode;
  /** Decorative layer behind the hero copy, such as cycling photographs. */
  backdrop?: ReactNode;
  /** "feature" is centered with circuit edges; "compact" is left-aligned for detail pages. */
  variant?: "feature" | "compact";
  className?: string;
}) {
  return (
    <section className={cn("signal-hero", `signal-hero-${variant}`, className)} aria-labelledby="page-title">
      {backdrop}
      {variant === "feature" ? <HeroCircuit /> : null}
      {corner ? <div className="signal-hero-corner">{corner}</div> : null}
      <div className="container-x signal-hero-inner">
        {before ? <div className="signal-hero-before">{before}</div> : null}
        <p className="signal-eyebrow">
          <span className="signal-eyebrow-mark" aria-hidden="true" />
          {eyebrow}
        </p>
        <GlitchHeading id="page-title" className="signal-hero-title">
          {title}
        </GlitchHeading>
        {description ? <div className="signal-hero-lead">{description}</div> : null}
        {children ? <div className="signal-hero-actions">{children}</div> : null}
      </div>
      <div className="signal-cable" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
