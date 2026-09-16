import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, Badge } from "@/components/ui/primitives";
import { ROLE_LABELS, type MemberRole, type Profile } from "@/lib/portal";

const NOTICES: Record<string, string> = {
  created: "Event created.",
  deleted: "Event deleted.",
  checked_in: "Checked in.",
  check_in_removed: "Check-in removed.",
  role_updated: "Role updated and recorded in the audit log.",
  status_updated: "Membership status updated and recorded in the audit log.",
  announced: "Event email sent.",
};

const ERRORS: Record<string, string> = {
  rate_limited: "Too many sensitive changes in a short time. Wait a while and try again.",
  delete_failed: "The event could not be deleted.",
  check_in_failed: "The check-in could not be saved.",
  role_failed: "The role could not be changed.",
  status_failed: "The membership status could not be changed.",
  announcement_unavailable: "Emails can only be sent for upcoming events.",
  announcement_rate_limited: "An email for this event was already sent in the last 24 hours.",
  announcement_failed: "The email could not be sent. Nothing was recorded, so you can try again.",
};

export function StaffNotice({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const notice = typeof searchParams.notice === "string" ? NOTICES[searchParams.notice] : undefined;
  const error = typeof searchParams.error === "string" ? ERRORS[searchParams.error] : undefined;
  const count = typeof searchParams.count === "string" && /^\d+$/.test(searchParams.count) ? Number(searchParams.count) : null;
  if (!notice && !error) return null;
  return (
    <div className="space-y-2">
      {notice ? (
        <Alert tone="success">
          {notice}
          {searchParams.notice === "announced" && count !== null ? ` ${count} member${count === 1 ? "" : "s"} emailed.` : null}
        </Alert>
      ) : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </div>
  );
}

export function VerificationBadge({ profile }: { profile: Pick<Profile, "student_email_verified_at" | "student_email"> }) {
  if (profile.student_email_verified_at) return <Badge tone="success">Verified</Badge>;
  return <Badge tone={profile.student_email ? "warning" : "muted"}>{profile.student_email ? "Unverified" : "No student email"}</Badge>;
}

export function RoleBadge({ role }: { role: MemberRole }) {
  return <Badge tone={role === "member" ? "muted" : role === "admin" ? "danger" : "cyan"}>{ROLE_LABELS[role]}</Badge>;
}

export function StaffHeading({ title, description, action, back }: { title: string; description?: ReactNode; action?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex text-sm text-muted hover:text-brand-700">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900">{title}</h1>
        {description ? <div className="mt-2 text-sm leading-6 text-muted">{description}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export const th = "border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted";
export const td = "border-b border-line px-4 py-3 align-middle text-ink";
