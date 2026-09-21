import { DIFFICULTY, DIFFICULTY_ORDER, LIBRARY_PROJECTS } from "@/content/careers/projects";

/**
 * Status readout for the library, pinned to the top right of the hero. It
 * counts what is actually in the data, so it can never drift from the grid.
 */
export function LibraryHud() {
  const counts = DIFFICULTY_ORDER.map((level) => ({
    level,
    label: DIFFICULTY[level].label,
    count: LIBRARY_PROJECTS.filter((project) => project.difficulty === level).length,
  }));
  const most = Math.max(...counts.map((row) => row.count));

  return (
    <aside className="hud" aria-label="Library status">
      <p className="hud-title">
        <span className="hud-dot" aria-hidden="true" />
        Library status
      </p>
      <p className="hud-total">
        <strong>{LIBRARY_PROJECTS.length}</strong> projects online
      </p>
      <ul className="hud-rows">
        {counts.map((row) => (
          <li key={row.level} data-level={row.level}>
            <span className="hud-row-label">{row.label}</span>
            <span className="hud-bar" aria-hidden="true">
              <span style={{ width: `${Math.round((row.count / most) * 100)}%` }} />
            </span>
            <span className="hud-row-count">{row.count}</span>
          </li>
        ))}
      </ul>
      <p className="hud-foot">
        <span className="hud-scan" aria-hidden="true" />
        Hard nodes reject the ping
      </p>
    </aside>
  );
}
