import { CAREER_FLOWS } from "@/content/careers/flows";
import type { CareerId } from "@/content/careers/types";

/** The shape of the work: connected nodes, in the homepage's trace style. */
export function CareerFlow({ path }: { path: CareerId }) {
  const steps = CAREER_FLOWS[path];
  return (
    <ol className="career-flow">
      {steps.map((step, index) => (
        <li key={step.label} className="career-flow-step" style={{ "--flow-index": index } as React.CSSProperties}>
          <span className="career-flow-node" aria-hidden="true">
            <span className="career-flow-dot" />
          </span>
          <span className="career-flow-label">{step.label}</span>
          <span className="career-flow-note">{step.note}</span>
        </li>
      ))}
    </ol>
  );
}
