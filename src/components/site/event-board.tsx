import { Check } from "lucide-react";
import { EVENT_FLYERS, TEASERS, TEASER_BANNER, TEASER_WORDS, type Flyer } from "@/content/club/flyers";

/**
 * The semester as a horizontal timeline: a compact rail with one node per
 * session, so the whole term is visible without scrolling.
 *
 * Sessions already held are ticked and show their flyer as a thumbnail. The
 * next one still to happen pulses, and a ping sweeps the rail and flashes red
 * as it crosses that node. Slots after it are locked placeholders carrying a
 * platform mark and drifting terms, and promise nothing specific.
 */
type Stop =
  | { kind: "event"; flyer: Flyer; past: boolean; next: boolean }
  | { kind: "locked"; code: string; mark: string };

/** Compared against the date only, so an event counts as held from the next day. */
function isPast(datetime: string, today: string) {
  return datetime < today;
}

/**
 * `today` is resolved once on the server in the club's own timezone and passed
 * in, so every visitor sees the same rail and the markup hydrates cleanly.
 */
export function EventBoard({ today }: { today: string }) {
  const nextIndex = EVENT_FLYERS.findIndex((flyer) => !isPast(flyer.datetime, today));

  const stops: Stop[] = [
    ...EVENT_FLYERS.map((flyer, index) => ({
      kind: "event" as const,
      flyer,
      past: isPast(flyer.datetime, today),
      next: index === nextIndex,
    })),
    ...TEASERS.map((teaser, i) => ({
      kind: "locked" as const,
      code: teaser.code,
      mark: i < 3 ? "/assets/events/tryhackme.webp" : "/assets/events/redhat.webp",
    })),
  ];

  return (
    <div className="rail">
      <div className="rail-line" aria-hidden="true">
        <span className="rail-ping" />
      </div>

      <ol className="rail-stops">
        {stops.map((stop, index) =>
          stop.kind === "event" ? (
            <li
              key={stop.flyer.title}
              className="rail-stop"
              data-state={stop.past ? "done" : stop.next ? "next" : "ahead"}
              style={{ ["--i" as string]: index }}
            >
              <span className="rail-dot" aria-hidden="true">
                {stop.past ? <Check className="size-3.5" /> : <span className="rail-dot-core" />}
              </span>
              <p className="rail-date">
                <time dateTime={stop.flyer.datetime}>{stop.flyer.date}</time>
              </p>
              <p className="rail-title">{stop.flyer.title}</p>
              <div className="rail-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stop.flyer.image} alt={stop.flyer.alt} width={stop.flyer.width} height={stop.flyer.height} loading="lazy" decoding="async" />
              </div>
              <p className="rail-detail">{stop.flyer.detail}</p>
              {stop.next ? <p className="rail-flag">Next up</p> : null}
            </li>
          ) : (
            <li key={stop.code} className="rail-stop rail-stop-locked" style={{ ["--i" as string]: index }}>
              <span className="rail-dot rail-dot-locked" aria-hidden="true" />
              <p className="rail-date">TBA</p>
              <p className="rail-title">Coming soon</p>
              <div className="rail-thumb rail-thumb-locked" aria-hidden="true">
                {/* Terms drift behind the platform mark, so a blank slot still reads as a teaser. */}
                <span className="rail-words">
                  {Array.from({ length: 10 }, (_, w) => (
                    <i key={w} style={{ ["--w" as string]: w }}>
                      {TEASER_WORDS[(index * 5 + w * 3) % TEASER_WORDS.length]}
                    </i>
                  ))}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stop.mark} alt="" width={34} height={34} loading="lazy" decoding="async" />
              </div>
              <p className="rail-code" data-text={stop.code}>
                {stop.code}
              </p>
            </li>
          ),
        )}
      </ol>

      <p className="rail-banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/events/tryhackme.webp" alt="" width={18} height={18} loading="lazy" decoding="async" />
        {TEASER_BANNER}
      </p>
    </div>
  );
}
