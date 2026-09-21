import { PORTFOLIO_GUIDE, WRITE_UP_TEMPLATE } from "@/content/careers/portfolio";
import { CopyTemplateButton } from "./copy-template-button";

/** Shown with every starter project. */
export function PortfolioGuide({ id = "portfolio" }: { id?: string }) {
  const guide = PORTFOLIO_GUIDE;
  return (
    <section id={id} className="careers-section" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="careers-section-title">
        {guide.heading}
      </h2>
      {guide.intro.map((paragraph) => (
        <p key={paragraph} className="careers-prose">
          {paragraph}
        </p>
      ))}
      <p className="careers-prose mt-5 font-semibold text-navy-900">Include:</p>
      <ol className="careers-numbered mt-3">
        {guide.sections.map((section) => (
          <li key={section.label}>
            <strong className="text-navy-900">{section.label}:</strong> {section.prompt}
          </li>
        ))}
      </ol>
      {guide.publishing.map((paragraph) => (
        <p key={paragraph} className="careers-prose">
          {paragraph}
        </p>
      ))}

      <h3 className="careers-subtitle">Put numbers in it</h3>
      <p className="careers-prose">{guide.numbers}</p>

      <h3 className="careers-subtitle">{guide.naming.heading}</h3>
      <p className="careers-prose">{guide.naming.body}</p>
      <p className="careers-resume-format">{guide.naming.format}</p>
      <ul className="careers-naming">
        {guide.naming.examples.map((example) => (
          <li key={example.weak}>
            <span className="careers-naming-weak">{example.weak}</span>
            <span aria-hidden="true">→</span>
            <span className="careers-naming-strong">{example.strong}</span>
          </li>
        ))}
      </ul>

      <h3 className="careers-subtitle">Why link a report?</h3>
      {guide.value.map((paragraph) => (
        <p key={paragraph} className="careers-prose">
          {paragraph}
        </p>
      ))}

      <figure className="careers-resume">
        <figcaption className="careers-resume-label">Example résumé entry</figcaption>
        <p className="careers-resume-line">
          <strong>{guide.example.name}</strong>
          <span aria-hidden="true">|</span>
          <span>{guide.example.stack.join(", ")}</span>
          <span aria-hidden="true">|</span>
          <span className="careers-resume-link">{guide.example.linkLabel}</span>
        </p>
        <p className="mt-1.5 leading-7 text-ink">{guide.example.bullet}</p>
      </figure>
      <p className="careers-prose">{guide.naming.link}</p>

      <div className="mt-6">
        <CopyTemplateButton template={WRITE_UP_TEMPLATE} />
        <details className="careers-template">
          <summary>Preview the write-up template</summary>
          <pre>{WRITE_UP_TEMPLATE}</pre>
        </details>
      </div>
    </section>
  );
}
