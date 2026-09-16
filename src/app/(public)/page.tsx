import type { Metadata } from "next";
import { branding } from "@config/branding";
import { CyberHome } from "@/components/marketing/cyber-home";

export const metadata: Metadata = {
  title: branding.displayName,
  description: branding.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <CyberHome />;
}
