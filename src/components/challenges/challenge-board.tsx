"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { platformIcon } from "./platform-icon";
import type { Challenge, Platform, PlatformId } from "@/content/club/practice";

const railHeadingClass = "font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-muted";
const railItemClass =
  "flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-md border border-line px-3 py-2 text-left text-sm font-medium text-navy-900 transition-colors hover:border-line-strong hover:bg-white/5 lg:border-transparent";
const railListClass =
  "-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0";

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/**
 * The challenge board: a rail of numbered learning-path stages and a platform filter beside
 * the challenges, grouped by stage. `children` sits above the groups.
 */
export function ChallengeBoard({
  challenges,
  stages,
  platforms,
  children,
}: {
  challenges: Challenge[];
  /** Learning-path stages, in the order to work through them. */
  stages: readonly { title: string; summary: string }[];
  /** Platforms that have at least one challenge, in display order. */
  platforms: Platform[];
  children?: ReactNode;
}) {
  const [filter, setFilter] = useState<PlatformId | "all">("all");

  const platformById = new Map(platforms.map((platform) => [platform.id, platform]));
  const visible = filter === "all" ? challenges : challenges.filter((c) => c.platform === filter);
  const groups = stages
    .map(({ title, summary }, index) => ({
      title,
      summary,
      step: index + 1,
      id: slug(title),
      items: visible.filter((c) => c.category === title),
    }))
    .filter((group) => group.items.length > 0);

  const filters: { id: PlatformId | "all"; name: string; count: number }[] = [
    { id: "all", name: "All platforms", count: challenges.length },
    ...platforms.map((platform) => ({
      id: platform.id,
      name: platform.name,
      count: challenges.filter((c) => c.platform === platform.id).length,
    })),
  ];

  return (
    <div className="container-x flex flex-col gap-8 pb-14 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10">
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:gap-8">
        <nav aria-labelledby="categories-heading">
          <h2 id="categories-heading" className={railHeadingClass}>
            Learning path
          </h2>
          <ul className={railListClass}>
            {groups.map((group) => (
              <li key={group.id} className="shrink-0">
                <a href={`#${group.id}`} className={railItemClass}>
                  <span>
                    <span className="mr-2 font-mono text-xs text-muted">{String(group.step).padStart(2, "0")}</span>
                    {group.title}
                  </span>
                  <span className="font-mono text-xs text-muted">{group.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {platforms.length > 1 ? (
          <div role="group" aria-labelledby="filter-heading">
            <h2 id="filter-heading" className={railHeadingClass}>
              Platform
            </h2>
            <ul className={railListClass}>
              {filters.map((item) => (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={filter === item.id}
                    onClick={() => setFilter(item.id)}
                    data-platform={item.id === "all" ? undefined : item.id}
                    className={cn(railItemClass, "challenge-filter")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="challenge-filter-dot" aria-hidden="true" />
                      {item.name}
                    </span>
                    <span className="font-mono text-xs text-muted">{item.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-col gap-10">
        {children}

        {groups.map((group) => (
          <section key={group.id} id={group.id} className="challenge-group scroll-mt-6" aria-labelledby={`${group.id}-heading`}>
            <h2 id={`${group.id}-heading`}>
              <span className="challenge-group-step">
                <span className="sr-only">Stage </span>
                {String(group.step).padStart(2, "0")}
              </span>
              {group.title}
              <span className="challenge-group-count">
                {group.items.length}
                <span className="sr-only"> challenges</span>
              </span>
            </h2>
            <p className="challenge-group-summary">{group.summary}</p>
            <ul className="challenge-tiles">
              {group.items.map((challenge) => {
                const Icon = platformIcon[challenge.platform];
                const external = /^https?:/.test(challenge.href);
                return (
                  <li key={`${challenge.platform}-${challenge.title}`}>
                    <a
                      href={challenge.href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="challenge-tile"
                      data-platform={challenge.platform}
                    >
                      <span className="challenge-tile-top">
                        <span className="challenge-platform">
                          <Icon className="size-3.5" aria-hidden="true" />
                          {platformById.get(challenge.platform)?.name}
                        </span>
                        <span className="challenge-diff" data-difficulty={challenge.difficulty}>
                          {challenge.difficulty}
                        </span>
                      </span>
                      <span className="challenge-tile-name">
                        {challenge.title}
                        <span className="challenge-tile-arrow" aria-hidden="true">
                          {external ? "↗" : "→"}
                        </span>
                      </span>
                      <span className="challenge-tile-summary">{challenge.summary}</span>
                      {challenge.tags?.length ? (
                        <span className="challenge-tags">
                          {challenge.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </span>
                      ) : null}
                      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
