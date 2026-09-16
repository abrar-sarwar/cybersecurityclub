import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/portal/member-forms";
import { Alert, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Event emails",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function UnsubscribePage(props: PageProps<"/unsubscribe">) {
  const { token } = await props.searchParams;

  return (
    <section className="container-x max-w-xl py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Email preferences" title="Stop club event emails" />
      <div className="card mt-8 p-6 sm:p-8">
        {typeof token === "string" && token ? (
          <UnsubscribeForm token={token} />
        ) : (
          <Alert tone="danger" title="This link is incomplete">Sign in and turn event emails off in your settings instead.</Alert>
        )}
      </div>
    </section>
  );
}
