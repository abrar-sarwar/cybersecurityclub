import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { NotConfigured } from "@/components/admin/not-configured";
import { formValuesFrom } from "@/lib/events/form";
import { requireAdmin } from "@/server/admin/auth";
import { readAdminEvents } from "@/server/admin/events";
import { readAdminConfig } from "@/server/admin/password";
import { saveEvent } from "../../actions";

export const metadata: Metadata = { title: "Edit event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const config = readAdminConfig();
  if (!config.ok) return <NotConfigured missing={config.missing} />;
  await requireAdmin();
  const { id } = await params;
  const result = await readAdminEvents();
  if (!result.ok) {
    return (
      <p className="adm-problem" role="alert">
        The events database could not be read. Try again in a moment.
      </p>
    );
  }
  const event = result.events.find((e) => e.id === id);
  if (!event) notFound();
  return (
    <section className="adm-card">
      <h1 className="adm-title">{event.title}</h1>
      <p className="adm-muted">
        Event id <code>{event.id}</code>. Saving replaces the stored event.
      </p>
      <EventForm action={saveEvent} initial={formValuesFrom(event)} eventId={event.id} imageUrl={event.imageUrl} />
    </section>
  );
}
