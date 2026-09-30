"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { InterviewTopic } from "@/content/schemas";

type Category = InterviewTopic["category"];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "technical", label: "Technical" },
  { id: "behavioral", label: "Behavioral" },
  { id: "scenario", label: "Scenario" },
  { id: "project", label: "Project" },
];

/**
 * One interview question at a time. The notes on what a strong answer
 * includes stay closed until asked for, so the question gets answered out
 * loud first.
 */
export function InterviewPractice({ topics }: { topics: readonly InterviewTopic[] }) {
  const [category, setCategory] = useState<Category>("technical");
  const [position, setPosition] = useState(0);

  const run = (id: Category) => topics.filter((topic) => topic.category === id).flatMap((topic) => topic.prompts.map((prompt) => ({ topic: topic.title, prompt })));
  const questions = run(category);
  const current = questions[Math.min(position, questions.length - 1)];
  if (!current) return null;

  return (
    <div className="interview-practice">
      <div className="interview-types" role="group" aria-label="Question type">
        {CATEGORIES.map((type) => (
          <button
            key={type.id}
            type="button"
            className="interview-type"
            aria-pressed={type.id === category}
            onClick={() => {
              setCategory(type.id);
              setPosition(0);
            }}
          >
            {type.label} <span className="interview-type-count">{run(type.id).length}</span>
          </button>
        ))}
      </div>

      <div className="interview-card">
        <div className="interview-card-head">
          <p className="careers-label">{current.topic}</p>
          <p className="interview-count">
            Question {position + 1} of {questions.length}
          </p>
        </div>
        <p className="interview-question">{current.prompt.question}</p>

        {/* Keyed by question, so moving on closes the notes again. */}
        <details key={current.prompt.id} className="interview-notes">
          <summary>Show what a strong answer includes</summary>
          <h4>A strong answer includes</h4>
          <ul className="careers-bullets">
            {current.prompt.strongAnswer.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <h4>Weak patterns</h4>
          <ul className="careers-bullets">
            {current.prompt.weakPatterns.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <h4>Likely follow-ups</h4>
          <ul className="careers-bullets">
            {current.prompt.followUps.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </details>

        <div className="interview-nav">
          <button type="button" className="btn-cyber btn-cyber-outline btn-cyber-sm" disabled={position === 0} onClick={() => setPosition(position - 1)}>
            <ChevronLeft className="size-4" aria-hidden />
            Previous question
          </button>
          <button
            type="button"
            className="btn-cyber btn-cyber-primary btn-cyber-sm"
            disabled={position >= questions.length - 1}
            onClick={() => setPosition(position + 1)}
          >
            Next question
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
