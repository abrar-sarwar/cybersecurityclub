import type { Metadata } from "next";
import { branding } from "@config/branding";
import { CyberHome } from "@/components/marketing/cyber-home";
import { loadObservatory } from "@/content/observatory";
import { safeLoad } from "@/content/safe";

export const metadata: Metadata = {
  title: branding.displayName,
  description: branding.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const content = safeLoad(loadObservatory, { employers: [], projects: [], news: [] });
  const employers = content.employers.filter((employer) => employer.confirmed);
  return <CyberHome employers={employers} />;
}
