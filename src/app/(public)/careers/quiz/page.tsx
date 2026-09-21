import type { Metadata } from "next";
import { CareerQuiz } from "@/components/careers/career-quiz";

export const metadata: Metadata = {
  title: "Find My Path",
  description: "A twenty-question interest questionnaire about cybersecurity work. No account, email, or experience needed.",
  alternates: { canonical: "/careers/quiz" },
};

export default async function CareerQuizPage(props: PageProps<"/careers/quiz">) {
  const { question } = await props.searchParams;
  const requested = typeof question === "string" && /^\d{1,2}$/.test(question) ? Number(question) : undefined;
  return (
    <div className="container-x careers-narrow">
      <h1 className="sr-only">Find My Path</h1>
      <CareerQuiz initialQuestion={requested} />
    </div>
  );
}
