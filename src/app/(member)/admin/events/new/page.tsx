import type { Metadata } from "next";
import { EventForm } from "@/components/portal/staff-forms";
import { StaffHeading } from "@/components/portal/staff-ui";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "New event" };

export default async function NewEventPage() {
  await requireStaff("officer", "/admin/events/new");
  return (
    <div className="max-w-2xl space-y-6">
      <StaffHeading back={{ href: "/admin/events", label: "Events" }} title="New event" />
      <div className="card p-6 sm:p-8">
        <EventForm initial={{ title: "", description: "", location: "", starts_at: "", ends_at: "" }} />
      </div>
    </div>
  );
}
