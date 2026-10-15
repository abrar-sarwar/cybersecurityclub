import Link from "next/link";
import { NotConfigured } from "@/components/admin/not-configured";
import { ButtonLink } from "@/components/ui/button";
import { clubToday } from "@/lib/dates";
import type { ClubEvent } from "@/lib/events/event";
import { eventDetail } from "@/lib/events/format";
import { requireAdmin } from "@/server/admin/auth";
import { readAdminSheet } from "@/server/admin/events";
import { readAdminConfig } from "@/server/admin/password";

export const dynamic = "force-dynamic";

function Row({ event }: { event: ClubEvent }) {
  const [, month, day] = event.date.split("-");
  const detail = eventDetail(event);
  return (
    <li className="adm-row">
      <span className="adm-row-date">
        {event.date.slice(0, 4)}-{month}-{day}
      </span>
      <div>
        <p className="adm-row-title">
          {event.title}
          {!event.published ? (
            <span className="adm-badge" data-tone="hidden">
              Hidden
            </span>
          ) : null}
          {event.status === "cancelled" ? (
            <span className="adm-badge" data-tone="cancelled">
              Cancelled
            </span>
          ) : null}
          {event.status === "completed" ? <span className="adm-badge">Completed</span> : null}
        </p>
        {detail ? <p className="adm-row-detail">{detail}</p> : null}
      </div>
      <Link href={`/admin/events/${encodeURIComponent(event.id)}`} className="adm-link">
        Edit
      </Link>
    </li>
  );
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const config = readAdminConfig();
  if (!config.ok) return <NotConfigured missing={config.missing} />;
  await requireAdmin();
  const { saved } = await searchParams;
  const result = await readAdminSheet();
  const today = clubToday();
  const events = result.ok ? [...result.sheet.events].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)) : [];
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today).reverse();

  return (
    <>
      <div className="adm-head">
        <h1 className="adm-title">Events</h1>
        <ButtonLink href="/admin/events/new">New event</ButtonLink>
      </div>
      {saved ? (
        <p className="adm-notice" role="status">
          Saved. The site shows the change now; the sheet has the row too.
        </p>
      ) : null}
      {!result.ok ? (
        <p className="adm-problem" role="alert">
          {result.reason === "unconfigured" ? "The Google Sheet is not configured on the server." : `The sheet could not be read.${result.detail ? ` ${result.detail}.` : ""}`}
        </p>
      ) : null}
      {result.ok && result.sheet.problems.length ? (
        <div className="adm-problem" role="status">
          Rows the site cannot read as typed in the sheet:
          <ul>
            {result.sheet.problems.map((p, i) => (
              <li key={i}>
                Row {p.row}
                {p.field ? `, ${p.field}` : ""}: {p.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.ok && events.length === 0 ? <p className="adm-muted">No events yet. Add the first one.</p> : null}
      {upcoming.length ? (
        <>
          <h2 className="adm-section">Upcoming</h2>
          <ol className="adm-list">
            {upcoming.map((e) => (
              <Row key={e.id} event={e} />
            ))}
          </ol>
        </>
      ) : null}
      {past.length ? (
        <>
          <h2 className="adm-section">Past</h2>
          <ol className="adm-list">
            {past.map((e) => (
              <Row key={e.id} event={e} />
            ))}
          </ol>
        </>
      ) : null}
    </>
  );
}
