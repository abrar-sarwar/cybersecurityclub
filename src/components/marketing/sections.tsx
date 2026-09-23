import { Badge } from "@/components/ui/primitives";
import { ResolvedImg } from "@/components/media/slot-image";
import type { StoryView } from "@/server/services/people";

export function StoryCard({ story }: { story: StoryView }) {
  return (
    <li className="card flex flex-col p-6">
      <div className="flex items-center gap-4">
        {story.photo ? (
          <div className="size-14 shrink-0 overflow-hidden rounded-full bg-pale-2">
            <ResolvedImg image={story.photo} sizes="56px" />
          </div>
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display text-lg font-bold text-brand-700" aria-hidden>
            {story.memberName
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-navy-900">
            {story.memberName}
            {story.isSample ? <Badge tone="warning" className="ml-2 align-middle">Sample</Badge> : null}
          </p>
          <p className="text-sm text-muted">
            {story.roleTitle} · {story.company}
            {story.dates ? ` · ${story.dates}` : ""}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[0.95rem] leading-6 text-ink">{story.summary}</p>
      {story.contribution ? <p className="mt-3 text-sm leading-6 text-muted">How the club helped: {story.contribution}</p> : null}
      {story.profileUrl ? (
        <a href={story.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-brand-700 hover:underline">
          Professional profile
        </a>
      ) : null}
    </li>
  );
}

export function stripMarkdown(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`~]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

