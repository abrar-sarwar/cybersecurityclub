import type { Metadata } from "next";
import { EventForm } from "@/components/admin/event-form";
import { NotConfigured } from "@/components/admin/not-configured";
import type { EventFormValues } from "@/lib/events/form";
import { requireAdmin } from "@/server/admin/auth";
import { readAdminConfig } from "@/server/admin/password";
import { saveEvent } from "../../actions";

export const metadata: Metadata = { title: "New event" };
export const dynamic = "force-dynamic";

const EMPTY: EventFormValues = { title: "", description: "", date: "", start_time: "", end_time: "", location: "", category: "", registration_url: "", status: "upcoming", published: "on", image_alt: "" };

export default async function NewEventPage() {
  const config = readAdminConfig();
  if (!config.ok) return <NotConfigured missing={config.missing} />;
  await requireAdmin();
  return (
    <section className="adm-card">
      <h1 className="adm-title">New event</h1>
      <p className="adm-muted">Saving stores the event and shows it on the site right away when it is published.</p>
      <EventForm action={saveEvent} initial={EMPTY} eventId={null} imageUrl={null} />
    </section>
  );
}
