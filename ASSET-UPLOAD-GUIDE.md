# Observatory asset and content guide

The homepage is ready for real club media. No documentary photos, approved official logo, approved project entries, reviewed news, or member portraits were supplied with this redesign. Empty optional sections stay out of the public homepage. The shield currently displayed is the existing **temporary mark**, not an approved club logo.

## Replace an image

This checkout has a database-backed media resolver and a file manifest. It does **not** contain working Media Manager pages, upload endpoints, or `/media/…` delivery routes. Use the persistent file workflow below now. Do not treat an officer-only placeholder or a database model as a working upload interface.

1. Obtain permission to publish the image and confirm the caption, credit, and identities. Keep approval records outside the public web directory.
2. Export a suitably sized WebP or optimized PNG under `public/assets/club/`. Do not put private originals here.
3. Add an asset record to `content/media-manifest.json`. Use its actual pixel dimensions, descriptive alt text, accurate caption, credit, and a focal point between 0 and 1. Keep `status: "draft"` until approved.
4. Assign the asset ID to a slot in the same file. Single slots use `{ "asset": "asset-id" }`; galleries use `{ "assets": ["asset-id", "second-id"] }`.
5. Set `status: "published"`, restart/reload the local preview, and review desktop and mobile crops. An uploaded database assignment, if one already exists, takes precedence over the manifest; the delivery integration must work before using that source.

Example (replace every factual field and supply the file before publishing):

```json
{
  "assets": {
    "approved-workshop": {
      "src": "/assets/club/community/approved-workshop.webp",
      "alt": "Describe the actual people and activity in this photograph",
      "caption": "Use the approved event name and date, if known",
      "credit": "Photographer, with permission",
      "width": 1600,
      "height": 1000,
      "focalPoint": { "x": 0.5, "y": 0.4 },
      "status": "draft"
    }
  },
  "slots": {
    "home.communityFeature": { "asset": "approved-workshop" }
  }
}
```

Merge this structure into the existing manifest; retain its `version` and other assets/slots. Never claim that a generated photograph documents a club event. Photos retain natural color. Focal points control cropping; logo rendering uses `object-fit: contain` and a small light backing.

## Asset map

| Asset | Slot or file | Suggested dimensions | Current status |
| --- | --- | --- | --- |
| Approved club logo | `site.logo` | Original ratio, at least 512px wide | Not supplied; existing temporary mark retained |
| Small icon | `site.favicon` | 512 × 512 | Not supplied; existing fallback retained |
| Social preview | `site.socialPreview` | 1200 × 630 | Dark generated text fallback |
| Globe fallback | `public/assets/observatory/globe-poster.webp` | 720 × 720, transparent | Generated from geographic land data; decorative, empty alt |
| Community feature | `home.communityFeature` | 1600 × 1000 | Awaiting approved photograph |
| Secondary workshop | `home.workshopPhoto` | 1000 × 625 | Awaiting approved photograph |
| Existing homepage images | `home.communityGallery`, then `home.hero` | Landscape | Preserved as fallbacks for community photos, not the globe |
| About / join photo | `about.hero`, `join.photo` | 3:2 / 4:3 | Awaiting approved photographs |
| Community gallery | `community.gallery` | 1200px or wider | Existing slot preserved |
| Event covers | `event.<event-id>.cover` | 1200 × 800 | Existing event service and slot naming preserved |
| Project screenshots | `showcase.<project-id>.screenshot` | 1400px wide, 16:9 | Publish only an approved actual project |
| Leadership portraits | `leadership.<officer-id>.portrait` | 800 × 1000 | Existing consent/publication workflow preserved |
| Member-story portraits | `story.<story-id>.photo` or existing story photo asset | 800 × 1000 | Homepage requires a real portrait and approved story |
| Employer marks | Plain text names in `content/observatory.json` | No logo files currently used | Six owner-confirmed names, including USPS |

Alt text, captions, credit, and focal points live on the asset record. `status: "published"` represents the publishing decision; the manifest does not itself store consent evidence. Keep approvals in the club's records. Uploaded records use the existing media metadata instead.

## Projects and news

`content/observatory.json` is the persistent editorial source for the new public showcase and news rows. It is validated by `src/content/observatory.ts`. These are public presentation entries, separate from gated lesson projects, progress, and member records.

An approved project entry needs:

```json
{
  "id": "actual-project-slug",
  "title": "Approved project title",
  "summary": "The actual problem the project addresses.",
  "skills": ["Actual skill"],
  "href": "https://example.com/replace-with-the-real-project",
  "imageSlot": "showcase.actual-project-slug.screenshot",
  "approved": false,
  "status": "draft"
}
```

Replace the example URL; use a working HTTPS demo, writeup, or repository. Obtain the creator's permission before setting both `approved: true` and `status: "published"`. The first three eligible entries appear as one featured project and two secondary entries. Personal work is not automatically club work. An empty list shows a real email submission link.

A news entry needs `title`, `source`, `topic`, `publishedAt` and `reviewedAt` (`YYYY-MM-DD`), `relevance` (one factual sentence), original-source HTTPS `href`, and `status`. Verify the source and dates before publishing. The homepage shows up to three published entries whose publication and review are within the last 90 days and not in the future. Stale entries are omitted rather than presented as current. The source file retains them for editing. There is no news feed or invented live ticker.

Member stories still come from the existing service, which requires publication permission and confirmed company information. The homepage omits samples and requires a portrait. Story/editor backend data remains untouched; editor pages are absent from this checkout.

Employer names come from the owner's supplied brief. Only entries marked `confirmed: true` appear. They describe internships, not sponsorship. Use plain text until suitable approved employer mark assets are available; never recreate trademark logos from memory.

## Globe maintenance and motion

The renderer uses locally hosted fine-point land geometry derived from [Natural Earth's 1:110m land data](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson), a [public-domain dataset](https://www.naturalearthdata.com/about/terms-of-use/). The source is checked in at `scripts/data/ne_110m_land.geojson`; no runtime third-party request is made.

Run `npx tsx scripts/build-globe.ts` to regenerate the compact point file and matching WebP poster. `src/lib/globe.ts` shares the projection with the renderer. This is geographic decoration, not incident telemetry or member location data. No Atlanta marker is drawn.

The canvas loads after essential content, runs at at most 24 fps, caps device pixel ratio at 1.5 and its backing canvas at 1080px, rotates once per roughly 120 seconds, and stops offscreen or when the document is hidden. The visible motion button pauses both the globe and employer animation and remembers the preference when storage is available. Reduced motion uses the poster and a static employer list. Narrow screens use a wrapping employer list regardless of motion preference. On fetch or canvas initialization failure, the local poster remains.

## Branding and preview

Identity and links live in `config/branding.ts`; shared theme tokens live in `src/app/globals.css` and layout styles in `src/app/observatory.css`. Keep the corresponding color values in sync when changing the palette. The fonts remain the existing self-hosted-at-build Inter and Manrope with `display: swap`.

Start the local preview with `npm run dev`, then open `http://localhost:3000`. Run `node scripts/capture-observatory.cjs` for responsive screenshots and the behavior checks recorded in `screenshots/observatory/checks.json`. This redesign does not publish or change site access.
