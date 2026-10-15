/** Shown instead of any admin page when the two admin secrets are missing. */
export function NotConfigured({ missing }: { missing: string[] }) {
  return (
    <section className="adm-card" role="status">
      <h1 className="adm-title">The admin page is not set up</h1>
      <p className="adm-muted">
        Set <code>{missing.join("</code> and <code>")}</code> in the server environment and redeploy. The setup is described in docs/events-google-sheet.md.
      </p>
    </section>
  );
}
