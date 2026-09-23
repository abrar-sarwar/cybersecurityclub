import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CAREER_PATHS } from "@/content/careers/paths";
import type { CareerPath, UpcomingPath } from "@/content/careers/types";
import { NodeMark } from "@/components/site/node-mark";

/** Every career path as a row on a vertical trace, for browsing without the questionnaire. */
export function CareerList({
  paths = CAREER_PATHS,
  headingLevel = "h3",
  upcoming = [],
}: {
  paths?: readonly CareerPath[];
  headingLevel?: "h2" | "h3";
  /** Announced paths, shown after the written ones with no link to follow yet. */
  upcoming?: readonly UpcomingPath[];
}) {
  const Heading = headingLevel;
  return (
    <ul className="careers-trace">
      {paths.map((path) => (
        <li key={path.id} className="careers-trace-item">
          <NodeMark index={CAREER_PATHS.indexOf(path)} className="careers-trace-mark" />
          <div className="min-w-0">
            <Heading className="font-display text-xl font-bold text-navy-900">
              <Link href={`/careers/${path.slug}`} className="careers-trace-link">
                {path.name}
              </Link>
            </Heading>
            <p className="mt-1.5 max-w-2xl text-[0.975rem] leading-7 text-muted">{path.summary}</p>
            <p className="mt-2 text-sm text-ink">
              <span className="text-faint">Starter project:</span> {path.project.title}
            </p>
          </div>
          <div className="careers-trace-roles">
            <p className="careers-label">Related roles</p>
            <p className="mt-1.5 text-sm leading-6 text-ink">{path.roles.join(", ")}</p>
          </div>
          <ArrowRight className="careers-trace-arrow" aria-hidden />
        </li>
      ))}
      {upcoming.map((path, index) => (
        <li key={path.name} className="careers-trace-item careers-trace-soon">
          <NodeMark index={paths.length + index} className="careers-trace-mark" />
          <div className="min-w-0">
            <Heading className="font-display text-xl font-bold text-navy-900">
              {path.name}
              <span className="soon-tag careers-trace-tag">Coming soon</span>
            </Heading>
            <p className="mt-1.5 max-w-2xl text-[0.975rem] leading-7 text-muted">{path.summary}</p>
            <p className="mt-2 text-sm text-faint">The full pathway, with a starter project, is being written.</p>
          </div>
          <div className="careers-trace-roles">
            <p className="careers-label">Related roles</p>
            <p className="mt-1.5 text-sm leading-6 text-ink">{path.roles.join(", ")}</p>
          </div>
          <span aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}
