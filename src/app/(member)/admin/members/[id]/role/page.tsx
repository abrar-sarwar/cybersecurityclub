import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SubmitButton } from "@/components/portal/submit-button";
import { StaffHeading } from "@/components/portal/staff-ui";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { ROLE_LABELS } from "@/lib/portal";
import { memberRoleSchema, uuidSchema } from "@/lib/portal-schemas";
import { createClient } from "@/lib/supabase/server";
import { changeMemberRole } from "@/server/actions/staff";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Confirm role change" };

const ROLE_EFFECTS = {
  member: "They lose access to officer tools.",
  officer: "They can see member profiles, manage events, check people in and record activity.",
  admin: "They can do everything officers can, change roles and membership status, and read the audit log.",
};

export default async function ConfirmRolePage(props: PageProps<"/admin/members/[id]/role">) {
  const { id } = await props.params;
  const viewer = await requireStaff("admin", `/admin/members/${id}/role`);
  const memberId = uuidSchema.safeParse(id);
  const role = memberRoleSchema.safeParse((await props.searchParams).to);
  if (!memberId.success) notFound();
  if (!role.success || memberId.data === viewer.id) redirect(`/admin/members/${id}`);

  const supabase = await createClient();
  const { data: member } = await supabase.from("profiles").select("id, full_name, role").eq("id", memberId.data).maybeSingle();
  if (!member) notFound();
  const back = `/admin/members/${member.id}`;
  if (member.role === role.data) redirect(back);

  return (
    <div className="max-w-2xl space-y-6">
      <StaffHeading back={{ href: back, label: member.full_name ?? "Member" }} title="Confirm role change" />
      <div className="card space-y-5 p-6">
        <p className="text-base text-ink">
          Change <strong className="text-navy-900">{member.full_name ?? "this member"}</strong> from{" "}
          <strong className="text-navy-900">{ROLE_LABELS[member.role]}</strong> to{" "}
          <strong className="text-navy-900">{ROLE_LABELS[role.data]}</strong>?
        </p>
        <Alert tone="warning">{ROLE_EFFECTS[role.data]} This change is recorded in the audit log with your name.</Alert>
        <form action={changeMemberRole} className="flex flex-wrap gap-3">
          <input type="hidden" name="user_id" value={member.id} />
          <input type="hidden" name="role" value={role.data} />
          <SubmitButton variant={role.data === "member" ? "danger" : "primary"} pendingText="Saving">
            Confirm: make {ROLE_LABELS[role.data].toLowerCase()}
          </SubmitButton>
          <ButtonLink href={back} variant="ghost">Cancel</ButtonLink>
        </form>
      </div>
    </div>
  );
}
