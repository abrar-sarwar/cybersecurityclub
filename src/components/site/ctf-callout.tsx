import { ArrowUpRight } from "lucide-react";
import { NCL } from "@/content/club/flyers";

/**
 * The NCL recruitment call-out. It states only what is being organised (a
 * team is forming and the form collects interest) and links straight out to
 * the form, so nothing here promises a roster spot or a competition result.
 */
export function CtfCallout() {
  return (
    <aside className="ctf">
      <div className="ctf-glow" aria-hidden="true" />
      <div className="ctf-body">
        <p className="ctf-eyebrow">
          <span className="ctf-pulse" aria-hidden="true" />
          {NCL.eyebrow}
        </p>
        <h2 className="ctf-title">{NCL.heading}</h2>
        <p className="ctf-text">{NCL.body}</p>
        <a className="ctf-action" href={NCL.formUrl} target="_blank" rel="noopener noreferrer">
          {NCL.linkLabel}
          <ArrowUpRight className="size-4" aria-hidden />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <ul className="ctf-points">
        {NCL.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </aside>
  );
}
