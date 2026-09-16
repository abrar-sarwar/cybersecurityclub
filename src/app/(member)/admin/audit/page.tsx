import type { Metadata } from "next";
import Link from "next/link";
import { StaffHeading, TableShell, td, th } from "@/components/portal/staff-ui";
import { EmptyState } from "@/components/ui/primitives";
import { formatDate, formatTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Audit log" };

const ACTION_LABELS: Record<string, string> = {
  "member.role_changed": "Role changed",
  "member.membership_status_changed": "Membership status changed",
  "event.deleted": "Event deleted",
  "event.announcement_sent": "Event email sent",
};

function describe(action: string, details: Json) {
  const value = (details && typeof details === "object" && !Array.isArray(details) ? details : {}) as Record<string, Json | undefined>;
  if (value.from !== undefined && value.to !== undefined) return `${String(value.from)} → ${String(value.to)}`;
  if (action === "event.announcement_sent") return `${String(value.recipients ?? 0)} recipients`;
  if (action === "event.deleted") return String(value.title ?? "");
  return "";
}

export default async function AuditLogPage() {
  await requireStaff("admin", "/admin/audit");
  const supabase = await createClient();
  const { data: entries, error } = await supabase
    .from("audit_log")
    .select("id, actor_id, action, target_user_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const ids = [...new Set(entries.flatMap((entry) => [entry.actor_id, entry.target_user_id]).filter((id): id is string => Boolean(id)))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const names = new Map((people ?? []).map((person) => [person.id, person.full_name ?? "Unnamed member"]));

  return (
    <div className="space-y-6">
      <StaffHeading title="Audit log" description="The latest 200 role, membership and event changes. Entries cannot be edited or deleted." />
      {entries.length ? (
        <TableShell>
          <thead>
            <tr>
              <th scope="col" className={th}>When</th>
              <th scope="col" className={th}>Action</th>
              <th scope="col" className={th}>By</th>
              <th scope="col" className={th}>Member</th>
              <th scope="col" className={th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className={`${td} whitespace-nowrap`}>{formatDate(entry.created_at)}<span className="block text-xs text-muted">{formatTime(entry.created_at)}</span></td>
                <td className={td}>{ACTION_LABELS[entry.action] ?? entry.action}</td>
                <td className={td}>{entry.actor_id ? names.get(entry.actor_id) ?? "Deleted account" : <span className="text-muted">System or SQL</span>}</td>
                <td className={td}>
                  {entry.target_user_id ? (
                    <Link href={`/admin/members/${entry.target_user_id}`} className="text-accent hover:underline">{names.get(entry.target_user_id) ?? "Deleted account"}</Link>
                  ) : "–"}
                </td>
                <td className={td}>{describe(entry.action, entry.details)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : (
        <EmptyState title="No entries yet" description="Role and membership changes appear here." />
      )}
    </div>
  );
}
