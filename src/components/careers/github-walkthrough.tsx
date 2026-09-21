import { GITHUB_WALKTHROUGH } from "@/content/careers/github";

/** The publish step, written as a walkthrough rather than a list of git commands. */
export function GithubWalkthrough() {
  return (
    <div className="gh-walk">
      <p className="careers-prose">{GITHUB_WALKTHROUGH.intro}</p>
      <ol className="gh-steps">
        {GITHUB_WALKTHROUGH.steps.map((step, index) => (
          <li key={step.label} className="gh-step">
            <span className="gh-step-index" aria-hidden="true">
              {index + 1}
            </span>
            <div className="gh-step-body">
              <h4 className="gh-step-label">{step.label}</h4>
              <pre className="gh-step-command">
                <code>{step.command}</code>
              </pre>
              <p className="gh-step-seen">{step.seen}</p>
              <p className="gh-step-note">
                <span className="gh-step-note-tag">Note it down</span> {step.note}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <ul className="careers-bullets">
        {GITHUB_WALKTHROUGH.habits.map((habit) => (
          <li key={habit}>{habit}</li>
        ))}
      </ul>
    </div>
  );
}
