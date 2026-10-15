import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { NotConfigured } from "@/components/admin/not-configured";
import { formValuesFrom } from "@/lib/events/form";
import { requireAdmin } from "@/server/admin/auth";
import { readAdminSheet } from "@/server/admin/events";
import { readAdminConfig } from "@/server/admin/password";
import { saveEvent } from "../../actions";

export const metadata: Metadata = { title: "Edit event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const config = readAdminConfig();
  if (!config.ok) return <NotConfigured missing={config.missing} />;
  await requireAdmin();
  const { id } = await params;
  const result = await readAdminSheet();
  if (!result.ok) {
    return (
      <p className="adm-problem" role="alert">
        The sheet could not be read.{result.detail ? ` ${result.detail}.` : ""}
      </p>
    );
  }
  const event = result.sheet.events.find((e) => e.id === id);
  if (!event) notFound();
  return (
    <section className="adm-card">
      <h1 className="adm-title">{event.title}</h1>
      <p className="adm-muted">
        Sheet row {event.row}, id <code>{event.id}</code>. Saving rewrites that row.
      </p>
      <EventForm action={saveEvent} initial={formValuesFrom(event)} eventId={event.id} imageUrl={event.imageUrl} />
    </section>
  );
}
