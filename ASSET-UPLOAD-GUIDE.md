# Observatory asset and content guide

The homepage is ready for real club media. No documentary photos, approved official logo, approved project entries, reviewed news, or member portraits were supplied with this redesign. Empty optional sections stay out of the public homepage. The shield currently displayed is the existing **temporary mark**, not an approved club logo.

## Replace an image

1. Obtain permission to publish the image and confirm the caption, credit, and identities. Keep approval records outside the public web directory.
2. Export a suitably sized WebP or optimized PNG under `public/assets/club/`. Do not put private originals here.

Never claim that a generated photograph documents a club event.

## Employer logos

Employer names come from the owner's supplied brief. Only entries marked `confirmed: true` appear. They describe internships, not sponsorship. Logos live in `public/assets/internships/` and each entry records the file's `source` (the company's own site or its Wikimedia Commons file page). Download official files only; never recreate trademark logos from memory. Marks are shown as white one-color logos (`treatment: "mono"`) unless the file is the company's own dark-background version (`"original"`). An employer without a `logo` shows as a text wordmark. If a company asks for different use of its mark, replace or remove the file and entry.

## Branding and preview

Identity and links live in `config/branding.ts`; shared theme tokens live in `src/app/globals.css` and layout styles in `src/app/observatory.css`. Keep the corresponding color values in sync when changing the palette. The fonts remain the existing self-hosted-at-build Inter and Manrope with `display: swap`.

Start the local preview with `npm run dev`, then open `http://localhost:3000`.
