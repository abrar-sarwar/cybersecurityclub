import type { Metadata } from "next";
import Link from "next/link";
import { RoleBadge, StaffHeading, TableShell, td, th, VerificationBadge } from "@/components/portal/staff-ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/primitives";
import { MEMBER_ROLES, ROLE_LABELS } from "@/lib/portal";
import { memberSearchSchema } from "@/lib/portal-schemas";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Members" };

const PAGE_SIZE = 50;

export default async function MembersPage(props: PageProps<"/admin/members">) {
  await requireStaff("officer", "/admin/members");
  const filters = memberSearchSchema.parse(await props.searchParams);
  const supabase = await createClient();

  const from = (filters.page - 1) * PAGE_SIZE;
  let query = supabase
    .from("profiles")
    .select("id, full_name, student_email, student_email_verified_at, grad_year, role, membership_status", { count: "exact" })
    .order("full_name", { ascending: true, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1);
  if (filters.q) query = query.or(`full_name.ilike."*${filters.q}*",student_email.ilike."*${filters.q}*"`);
  if (filters.verified === "yes") query = query.not("student_email_verified_at", "is", null);
  if (filters.verified === "no") query = query.is("student_email_verified_at", null);
  if (filters.role !== "all") query = query.eq("role", filters.role);
  if (filters.year) query = query.eq("grad_year", filters.year);

  const { data: members, count, error } = await query;
  if (error) throw error;
  const total = count ?? 0;
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.verified !== "all") params.set("verified", filters.verified);
    if (filters.role !== "all") params.set("role", filters.role);
    if (filters.year) params.set("year", String(filters.year));
    params.set("page", String(page));
    return `/admin/members?${params}`;
  };

  return (
    <div className="space-y-6">
      <StaffHeading title="Members" description={`${total} ${total === 1 ? "member matches" : "members match"} these filters.`} />

      <form method="get" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end" role="search">
        <div>
          <label htmlFor="q" className="mb-1.5 block text-sm font-semibold text-navy-900">Search</label>
          <Input name="q" type="search" placeholder="Name or student email" defaultValue={filters.q} />
        </div>
        <div>
          <label htmlFor="verified" className="mb-1.5 block text-sm font-semibold text-navy-900">Verification</label>
          <Select name="verified" defaultValue={filters.verified}>
            <option value="all">All</option>
            <option value="yes">Verified</option>
            <option value="no">Not verified</option>
          </Select>
        </div>
        <div>
          <label htmlFor="role" className="mb-1.5 block text-sm font-semibold text-navy-900">Role</label>
          <Select name="role" defaultValue={filters.role}>
            <option value="all">All</option>
            {MEMBER_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
          </Select>
        </div>
        <div>
          <label htmlFor="year" className="mb-1.5 block text-sm font-semibold text-navy-900">Grad year</label>
          <Input name="year" type="number" inputMode="numeric" min={2000} max={2100} defaultValue={filters.year ?? ""} />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Filter</Button>
          <ButtonLink href="/admin/members" variant="ghost">Reset</ButtonLink>
        </div>
      </form>

      {members.length ? (
        <TableShell>
          <thead>
            <tr>
              <th scope="col" className={th}>Name</th>
              <th scope="col" className={th}>Student email</th>
              <th scope="col" className={th}>Verification</th>
              <th scope="col" className={th}>Grad year</th>
              <th scope="col" className={th}>Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-pale-2/60">
                <td className={td}>
                  <Link href={`/admin/members/${member.id}`} className="font-semibold text-navy-900 hover:text-brand-700 hover:underline">
                    {member.full_name ?? "Unnamed member"}
                  </Link>
                  {member.membership_status === "suspended" ? <span className="ml-2 text-xs text-danger-700">Suspended</span> : null}
                </td>
                <td className={td}>{member.student_email ?? <span className="text-faint">None yet</span>}</td>
                <td className={td}><VerificationBadge profile={member} /></td>
                <td className={td}>{member.grad_year ?? "–"}</td>
                <td className={td}><RoleBadge role={member.role} /></td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : (
        <EmptyState title="No members found" description="Try a different search or clear the filters." />
      )}

      {total > PAGE_SIZE ? (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3 text-sm">
          {filters.page > 1 ? <ButtonLink href={pageHref(filters.page - 1)} variant="outline" size="sm">Previous</ButtonLink> : <span />}
          <span className="text-muted">Page {filters.page} of {Math.ceil(total / PAGE_SIZE)}</span>
          {from + PAGE_SIZE < total ? <ButtonLink href={pageHref(filters.page + 1)} variant="outline" size="sm">Next</ButtonLink> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
