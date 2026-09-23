"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CAREER_BY_ID } from "@/content/careers/paths";
import { DIFFICULTY, DIFFICULTY_ORDER, byResumeWeight, type LibraryProject, type ProjectDifficulty } from "@/content/careers/projects";

type Filter = ProjectDifficulty | "all";
type Sort = "start" | "resume";

const SORTS: { id: Sort; label: string; hint: string }[] = [
  { id: "start", label: "Best to start", hint: "Ordered for a first portfolio, easiest wins first." },
  { id: "resume", label: "Best for résumé", hint: "Hardest first: the projects an interviewer digs into." },
];

/**
 * The library grid. Cards are keyed by slug, so sorting moves existing DOM
 * nodes instead of rebuilding them, and filtering hides with an attribute
 * rather than unmounting. Reading order always matches what is on screen.
 */
export function ProjectLibrary({ projects }: { projects: readonly LibraryProject[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("start");

  const counts = useMemo(() => {
    const tally = { all: projects.length, easy: 0, medium: 0, hard: 0 };
    for (const project of projects) tally[project.difficulty] += 1;
    return tally;
  }, [projects]);

  const ordered = useMemo(
    () => [...projects].sort(sort === "resume" ? byResumeWeight : (a, b) => a.rank - b.rank),
    [projects, sort],
  );

  const shown = filter === "all" ? projects.length : counts[filter];

  return (
    <div className="library">
      <div className="library-controls">
        <div className="library-filters" role="group" aria-label="Filter by difficulty">
          {(["all", ...DIFFICULTY_ORDER] as Filter[]).map((id) => (
            <button
              key={id}
              type="button"
              className="library-chip"
              data-active={filter === id}
              data-level={id}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {id === "all" ? "All" : DIFFICULTY[id].label}
              <span className="library-chip-count">{counts[id]}</span>
            </button>
          ))}
        </div>
        <div className="library-sort" role="group" aria-label="Sort projects">
          {SORTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="library-sort-button"
              data-active={sort === option.id}
              aria-pressed={sort === option.id}
              title={option.hint}
              onClick={() => setSort(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="library-status" role="status">
        {shown} {shown === 1 ? "project" : "projects"}
        {filter === "all" ? "" : ` rated ${DIFFICULTY[filter].label.toLowerCase()}`}. {filter === "all" ? SORTS.find((s) => s.id === sort)!.hint : DIFFICULTY[filter].note}
      </p>

      <ul className="project-grid">
        {ordered.map((project, index) => {
          const level = DIFFICULTY[project.difficulty];
          const hidden = filter !== "all" && project.difficulty !== filter;
          return (
            <li
              key={project.slug}
              className="project-card"
              data-level={project.difficulty}
              data-hidden={hidden || undefined}
              // Staggers the ping so it travels across the grid rather than firing everywhere at once.
              style={{ ["--i" as string]: index % 10 }}
            >
              <Link href={`/careers/projects/${project.slug}`} className="project-card-link" tabIndex={hidden ? -1 : undefined}>
                <span className="project-card-wire" aria-hidden="true">
                  <span className="project-card-ping" />
                </span>
                <span className="project-card-top">
                  <span className="project-card-level">
                    <span className="project-card-meter" aria-hidden="true">
                      <i data-on={level.weight >= 1} />
                      <i data-on={level.weight >= 2} />
                      <i data-on={level.weight >= 3} />
                    </span>
                    {level.label}
                  </span>
                </span>
                <span className="sr-only">
                  {level.label}. {level.resumeValue}.{" "}
                </span>
                <span className="project-card-title">{project.title}</span>
                <span className="project-card-summary">{project.summary}</span>
                <span className="project-card-foot">
                  <span className="project-card-path">{CAREER_BY_ID[project.path].name}</span>
                  <span className="project-card-hours">{project.hours.replace(" hours", " h").replace(" to ", "-")}</span>
                </span>
                <span className="project-card-value" aria-hidden="true">
                  {level.resumeValue}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
