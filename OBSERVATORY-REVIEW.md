# Observatory redesign review

The implemented preview uses **http://localhost:3000**. The production build passed. The owner requested a Git checkpoint before the final production-browser rerun completed; restart the preview if needed tomorrow. No deployment or audience change was made.

## Design changes

- Replaced the light, panel-based opening with a midnight composition, large Manrope typography, cobalt actions, and a fine-point geographic globe that sits directly in the page.
- Added the six owner-confirmed internship names, including **USPS**, as plain text. The strip scrolls slowly on desktop, pauses on hover/focus, and wraps on mobile and in reduced-motion mode.
- Rebuilt the homepage around an open event row, editorial community introduction, project showcase/invitation, numbered learning preview, and three joining steps. Unpublished news and member spotlights are omitted.
- Applied the dark theme to available public routes, shared buttons, forms, alerts, progress indicators, lesson diagrams, and the generated social preview. Kept existing Inter and Manrope fonts, backend services, authentication API, membership checks, event data, and progress actions.
- Improved mobile menu focus containment, Escape dismissal, focus restoration, scroll locking, and closing after an anchor navigation. Footer links use a compact two-column mobile layout.
- Added persistent, documented media slots and a file-backed editorial source. No temporary upload interface, fake event, fabricated member outcome, generated documentary photo, or threat telemetry was added.

## Preview files

- [Desktop, full page](screenshots/observatory/home-1440.png)
- [Desktop opening](screenshots/observatory/home-1440-viewport.png)
- [Mobile, full page](screenshots/observatory/home-390.png)
- [Mobile opening](screenshots/observatory/home-390-viewport.png)
- [Enlarged text](screenshots/observatory/home-enlarged-text.png)
- [JavaScript disabled](screenshots/observatory/home-no-javascript.png)
- [Asset and editorial guide](ASSET-UPLOAD-GUIDE.md)

Additional screenshots cover 360, 768, and 1024px widths and the Events, Learn, and Join pages.

## Verification

- `npm run build`: passed, including Prisma client generation, TypeScript, and Next.js page generation.
- `npm run lint`: passed. CommonJS scripts explicitly allow CommonJS imports.
- `npm run typecheck`: passed after regenerating stale Next.js route types with `next typegen`; the final production build also typechecked successfully.
- `node scripts/capture-observatory.cjs`: the earlier complete development-server run passed public-route, 360/390/768/1024/1440px overflow, 200% root text, mobile joining, menu keyboard, pause persistence, offscreen rendering, simulated hidden-document, fetch-failure fallback, and JavaScript-disabled checks. The final production-server rerun was incomplete when work was checkpointed. Its [checks.json](screenshots/observatory/checks.json) is partial, and the newly added canvas-context-loss check still needs a completed run. Rerun the script tomorrow; screenshots currently include captures from both runs.
- Anonymous requests to `/dashboard`, `/admin`, `/projects`, and `/account` still redirect to sign-in. This is a check of existing routing restrictions, not a complete authorization audit.
- Calculated shared text-token contrast against the four principal surfaces: all checked pairs exceed 4.5:1. White on primary cobalt is 5.17:1; white on the hover color is 4.75:1. Details: [contrast.json](screenshots/observatory/contrast.json).
- Desktop and mobile screenshots were visually inspected and enlarged-text overflow was corrected. No Lighthouse score, loading-time claim, or complete WCAG certification is asserted.

## Existing gaps and unavailable content

The following were present before this redesign and remain outside its visual scope:

1. `/sign-in` and `/sign-up` return 404. The checkout includes the Better Auth backend and membership/progress services, but does not contain the account, member-dashboard, full lesson, or officer-tool pages that its navigation references. Their links and access rules were preserved. End-to-end sign-in, account approval, saved progress, and officer workflows cannot be verified without those pages.
2. `npm run content:check` fails on pre-existing malformed YAML in `content/paths/product-application-security/lessons/dependencies-and-supply-chain.md`: the unquoted `objective` contains a colon. The existing loader also reports that YAML `lastReviewed` values become `Date` objects while its schema expects strings. The path overview responds successfully, but its lesson list can fall back to an empty state. Learning source content and schemas were not rewritten as part of the visual redesign.
3. `package.json` references `scripts/media-check.ts`, which is absent. Therefore the repository's aggregate `verify` command is not a passing delivery gate even though lint, typechecking, the production build, and the targeted browser checks pass.
4. No approved club logo, real community photography, published showcase projects, reviewed news items, or eligible member portraits were supplied. The temporary mark is retained; optional sections stay hidden or use compact, honest invitations. The six employer names are confirmed by the owner's supplied brief.
5. The media resolver and database models exist, but this checkout has no working upload manager, upload API, or `/media/…` delivery route. The supplied manifest workflow is persistent and usable now. A working officer upload integration remains a separate dependency.

To edit after reviewing the built preview, stop `npm run start` and run `npm run dev`. Rebuild before starting a new production preview. On Windows, stop the server before `prisma generate` so the loaded Prisma DLL can be replaced.
