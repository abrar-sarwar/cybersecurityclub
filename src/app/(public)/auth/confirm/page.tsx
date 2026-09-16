import type { Metadata } from "next";
import { SubmitButton } from "@/components/portal/submit-button";
import { Alert, SectionHeading } from "@/components/ui/primitives";
import { safeNextPath } from "@/lib/portal";
import { confirmEmailSignIn } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "Finish signing in",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Landing page for token-hash sign-in links (recommended Supabase magic link
 * template). Signing in waits for the button so opening the link alone does
 * nothing.
 */
export default async function ConfirmSignInPage(props: PageProps<"/auth/confirm">) {
  const { token_hash: tokenHash, type, next } = await props.searchParams;
  const valid = typeof tokenHash === "string" && tokenHash.length > 0 && typeof type === "string";

  return (
    <section className="container-x max-w-xl py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Sign in" title="Finish signing in" />
      <div className="card mt-8 space-y-5 p-6 sm:p-8">
        {valid ? (
          <form action={confirmEmailSignIn} className="space-y-5">
            <p className="text-sm leading-6 text-muted">
              Continue only if you asked for this sign-in link on this device.
            </p>
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="next" value={safeNextPath(next)} />
            <SubmitButton size="lg" pendingText="Signing in">Continue</SubmitButton>
          </form>
        ) : (
          <Alert tone="danger" title="This link is incomplete">Request a new sign-in link from the join page.</Alert>
        )}
      </div>
    </section>
  );
}
