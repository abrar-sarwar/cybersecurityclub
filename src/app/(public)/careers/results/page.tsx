import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/primitives";
import { CareerResults } from "@/components/careers/career-results";

export const metadata: Metadata = {
  title: "Your Cybersecurity Starting Points",
  description: "Career paths that reflect the work you selected in the questionnaire.",
  alternates: { canonical: "/careers/results" },
  robots: { index: false, follow: true },
};

export default function CareerResultsPage() {
  return (
    <div className="container-x careers-results">
      <Breadcrumbs items={[{ label: "Careers", href: "/careers" }, { label: "Your starting points" }]} />
      <CareerResults />
    </div>
  );
}
