import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { NotConfigured } from "@/components/admin/not-configured";
import { hasAdminSession } from "@/server/admin/auth";
import { readAdminConfig } from "@/server/admin/password";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const config = readAdminConfig();
  if (!config.ok) return <NotConfigured missing={config.missing} />;
  if (await hasAdminSession()) redirect("/admin");
  return (
    <section className="adm-card adm-narrow">
      <h1 className="adm-title">Sign in</h1>
      <p className="adm-muted">The shared officer password. Ask the board if you do not have it.</p>
      <LoginForm action={signIn} />
    </section>
  );
}
