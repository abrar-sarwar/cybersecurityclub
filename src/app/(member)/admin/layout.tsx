import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = {
  title: { default: "Officer tools", template: "%s · Officer tools" },
};

/**
 * Shared navigation for staff pages. The role check here only shapes the
 * navigation; every page and server action checks the role again itself.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await requireStaff("officer", "/admin");
  const links = [
    { href: "/admin/members", label: "Members" },
    { href: "/admin/events", label: "Events" },
    ...(viewer.isAdmin ? [{ href: "/admin/audit", label: "Audit log" }] : []),
  ];

  return (
    <div className="container-x py-8 sm:py-10">
      <nav aria-label="Officer tools" className="mb-8 flex flex-wrap items-center gap-1 border-b border-line pb-3">
        <span className="mr-3 text-xs font-semibold uppercase tracking-wide text-accent">Officer tools</span>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-ink hover:bg-pale-2 hover:text-navy-900">
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
