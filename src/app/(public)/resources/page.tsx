import type { Metadata } from "next";
import { branding } from "@config/branding";
import { TryHackMeIcon } from "@/components/challenges/platform-icon";
import { ResourceAnchor, WikiSection } from "@/components/resources/resource-parts";
import { CTF_SOFTWARE, CTF_WEBSITES, PLATFORMS, SECURITY_PLUS, SECURITY_PLUS_EXAM, TRYHACKME } from "@/content/club/resources";

export const metadata: Metadata = {
  title: "Resources",
  description: `Security+ ${SECURITY_PLUS_EXAM} study material, practice platforms and CTF tools, curated by the ${branding.displayName}.`,
  alternates: { canonical: "/resources" },
};

const CONTENTS = [SECURITY_PLUS, PLATFORMS, CTF_WEBSITES, CTF_SOFTWARE];

export default function ResourcesPage() {
  return (
    <>
      <header className="container-x pb-6 pt-8 sm:pt-10">
        <div className="border-b border-line pb-5">
          <h1 id="page-title" className="signal-section-title">
            Resources
          </h1>
          <p className="mt-2 text-sm text-muted">Study material, practice platforms and the tools we use in CTFs.</p>
        </div>
      </header>

      <div className="container-x grid gap-10 pb-16 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Contents</h2>
          <ol className="mt-2 space-y-1 text-sm">
            {CONTENTS.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="inline-flex min-h-8 items-center text-navy-900 hover:text-brand-700 hover:underline">
                  <span className="mr-2 font-mono text-muted">{index + 1}.</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 max-w-3xl space-y-12">
          <WikiSection section={SECURITY_PLUS} />

          <WikiSection section={PLATFORMS}>
            <div className="thm mt-4 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <TryHackMeIcon className="size-8 text-[#ff5f5f]" aria-hidden="true" />
                <h3 className="font-display text-xl font-bold text-white">
                  <ResourceAnchor url={TRYHACKME.url} className="hover:underline underline-offset-4">
                    {TRYHACKME.name}
                  </ResourceAnchor>
                </h3>
                <span className="ml-auto font-mono text-xs uppercase tracking-wider text-[#ff5f5f]">Start here</span>
              </div>
              <p className="mt-3 text-sm leading-6">{TRYHACKME.description}</p>
              <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6">
                <span className="font-mono text-xs uppercase tracking-wider text-[#ff5f5f]">Recommended path · </span>
                <ResourceAnchor url={TRYHACKME.recommended.url} className="font-semibold text-white underline underline-offset-4 hover:text-[#ff5f5f]">
                  {TRYHACKME.recommended.name}
                </ResourceAnchor>
                <span>: {TRYHACKME.recommended.description}</span>
              </p>
            </div>
          </WikiSection>

          <WikiSection section={CTF_WEBSITES} />
          <WikiSection section={CTF_SOFTWARE} />

          <p className="text-sm text-muted">
            Stuck, or know a tool that belongs here?{" "}
            <ResourceAnchor url={branding.links.discordInvite}>Ask in Discord</ResourceAnchor>.
          </p>
        </div>
      </div>
    </>
  );
}
