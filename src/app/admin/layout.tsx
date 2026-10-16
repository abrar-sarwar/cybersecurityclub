import type { Metadata } from "next";
import Link from "next/link";
import { hasAdminSession } from "@/server/admin/auth";
import { signOut } from "./actions";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Events admin", template: "%s · Events admin" },
  robots: { index: false, follow: false },
};

/** The officers' area: its own small header, no site chrome, never indexed. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await hasAdminSession();
  return (
    <div className="adm">
      <header className="adm-bar">
        <Link href="/admin" className="adm-brand">
          Events admin
        </Link>
        <nav className="adm-nav" aria-label="Admin">
          <Link href="/events" className="adm-link">
            View site
          </Link>
          {signedIn ? (
            <form action={signOut}>
              <button type="submit" className="adm-link">
                Sign out
              </button>
            </form>
          ) : null}
        </nav>
      </header>
      <main className="adm-main">{children}</main>
    </div>
  );
}
