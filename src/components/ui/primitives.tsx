import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "article" | "section" | "li" }) {
  return <Tag className={cn("card", className)}>{children}</Tag>;
}

type Tone = "brand" | "navy" | "muted" | "success" | "warning" | "danger" | "cyan";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  navy: "bg-surface text-white",
  muted: "bg-pale-2 text-muted",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  cyan: "bg-cyan-100 text-cyan-700",
};

export function Badge({ children, tone = "brand", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Alert({
  tone = "brand",
  title,
  children,
  className,
}: {
  tone?: "brand" | "success" | "warning" | "danger" | "muted";
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const styles: Record<string, string> = {
    brand: "border-brand-200 bg-brand-50 text-brand-800",
    success: "border-success-600/30 bg-success-50 text-success-600",
    warning: "border-amber-300 bg-warning-50 text-warning-700",
    danger: "border-danger-600/30 bg-danger-50 text-danger-700",
    muted: "border-line bg-pale text-ink",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm leading-6", styles[tone], className)} role={tone === "danger" ? "alert" : "status"}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-0.5" : ""}>{children}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-t border-line py-6", className)}>
      {icon ? <div className="mb-3 flex size-8 items-center text-accent">{icon}</div> : null}
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      {description ? <div className="mt-2 max-w-xl text-base leading-7 text-muted">{description}</div> : null}
      {action ? <div className="mt-4 flex flex-wrap">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, label, className, size = "md" }: { value: number; label?: string; className?: string; size?: "sm" | "md" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      ) : null}
      <div
        className={cn("w-full overflow-hidden rounded-full bg-pale-2", size === "sm" ? "h-1.5" : "h-2.5")}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-pale-2", className)} aria-hidden />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
      <Tag className={cn("font-display font-bold tracking-tight text-navy-900", Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-[2.125rem] leading-tight")}>
        {title}
      </Tag>
      {description ? <div className="mt-3 text-[1.0625rem] leading-7 text-muted">{description}</div> : null}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-700">
                {item.label}
              </Link>
            ) : (
              <span className="text-navy-900" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[0.75rem] text-navy-900">{children}</kbd>;
}
