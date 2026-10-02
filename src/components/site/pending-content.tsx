/**
 * Marks a slot the club has not filled yet. The club writes the site's copy;
 * this block stands in until they do, and is never used for real content.
 */
export function PendingContent({ what }: { what: string }) {
  return (
    <div className="card p-6 sm:p-8" data-pending-content>
      <p className="signal-eyebrow">
        <span className="signal-eyebrow-mark" aria-hidden="true" />
        Content pending
      </p>
      <p className="mt-3 text-muted">{what}</p>
    </div>
  );
}
