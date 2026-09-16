import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SubmitButton } from "@/components/portal/submit-button";
import { StaffHeading } from "@/components/portal/staff-ui";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { MEMBERSHIP_STATUS_LABELS } from "@/lib/portal";
import { membershipStatusSchema, uuidSchema } from "@/lib/portal-schemas";
import { createClient } from "@/lib/supabase/server";
import { changeMembershipStatus } from "@/server/actions/staff";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Confirm membership change" };

export default async function ConfirmStatusPage(props: PageProps<"/admin/members/[id]/status">) {
  const { id } = await props.params;
  const viewer = await requireStaff("admin", `/admin/members/${id}/status`);
  const memberId = uuidSchema.safeParse(id);
  const status = membershipStatusSchema.safeParse((await props.searchParams).to);
  if (!memberId.success) notFound();
  if (!status.success || memberId.data === viewer.id) redirect(`/admin/members/${id}`);

  const supabase = await createClient();
  const { data: member } = await supabase.from("profiles").select("id, full_name, membership_status").eq("id", memberId.data).maybeSingle();
  if (!member) notFound();
  const back = `/admin/members/${member.id}`;
  if (member.membership_status === status.data) redirect(back);
  const suspending = status.data === "suspended";

  return (
    <div className="max-w-2xl space-y-6">
      <StaffHeading back={{ href: back, label: member.full_name ?? "Member" }} title="Confirm membership change" />
      <div className="card space-y-5 p-6">
        <p className="text-base text-ink">
          Change <strong className="text-navy-900">{member.full_name ?? "this member"}</strong> from{" "}
          <strong className="text-navy-900">{MEMBERSHIP_STATUS_LABELS[member.membership_status]}</strong> to{" "}
          <strong className="text-navy-900">{MEMBERSHIP_STATUS_LABELS[status.data]}</strong>?
        </p>
        <Alert tone="warning">
          {suspending
            ? "Suspended members keep their sign-in but lose RSVPs and any officer or admin access until reactivated."
            : "Their member features and any officer or admin role become active again."}{" "}
          This change is recorded in the audit log with your name.
        </Alert>
        <form action={changeMembershipStatus} className="flex flex-wrap gap-3">
          <input type="hidden" name="user_id" value={member.id} />
          <input type="hidden" name="status" value={status.data} />
          <SubmitButton variant={suspending ? "danger" : "primary"} pendingText="Saving">
            Confirm: {suspending ? "suspend membership" : "reactivate membership"}
          </SubmitButton>
          <ButtonLink href={back} variant="ghost">Cancel</ButtonLink>
        </form>
      </div>
    </div>
  );
}
