import Link from "next/link";
import { ArrowRight, Cloud, Code2, Crosshair, Globe, KeyRound, Radar, Scale, Search, ShieldCheck, Siren, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import type { LearningPath } from "@/content/schemas";
import { cn } from "@/lib/cn";

export const PATH_ICONS: Record<LearningPath["icon"], LucideIcon> = {
  Radar,
  ShieldCheck,
  KeyRound,
  Code2,
  Crosshair,
  Cloud,
  Search,
  Globe,
  Scale,
  Siren,
};

export function PathIcon({ icon, className }: { icon: LearningPath["icon"]; className?: string }) {
  const Icon = PATH_ICONS[icon] ?? ShieldCheck;
  return <Icon className={className} aria-hidden />;
}

export function PathCard({ path, href, selected, progressLabel }: { path: LearningPath; href?: string; selected?: boolean; progressLabel?: string }) {
  const lessonCount = path.modules.reduce((n, m) => n + m.lessons.length, 0);
  return (
    <li className={cn("card group relative flex flex-col p-6 transition-shadow duration-150 hover:shadow-soft", selected && "border-brand-300 ring-2 ring-brand-100")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-accent">
          <PathIcon icon={path.icon} className="size-5" />
        </div>
        {path.availability === "complete" ? <Badge tone="success">Complete path</Badge> : <Badge tone="muted">Overview only</Badge>}
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-navy-900">
        <Link href={href ?? `/learn/paths/${path.slug}`} className="after:absolute after:inset-0 after:rounded-2xl after:content-['']">
          {path.title}
        </Link>
      </h3>
      <p className="mt-1.5 flex-1 text-[0.95rem] leading-6 text-muted">{path.tagline}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted">{path.availability === "complete" ? `${path.modules.length} modules · ${lessonCount} lessons` : "Role overview and starting skills"}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-700 transition-transform duration-150 group-hover:translate-x-0.5">
          {progressLabel ?? (selected ? "Your path" : "View")} <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
    </li>
  );
}
