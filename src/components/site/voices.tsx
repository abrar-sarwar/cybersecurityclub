import { ArrowUpRight } from "lucide-react";
import { VOICES, VOICES_EXPECTED, type Voice } from "@/content/club/voices";

/**
 * Member quotes. Slots that are still waiting on a quote render as a marked
 * placeholder, so the row keeps its shape and it is obvious that more are
 * coming rather than looking like a gap in the design.
 */
export function Voices({ voices = VOICES, expected = VOICES_EXPECTED }: { voices?: readonly Voice[]; expected?: number }) {
  const pending = Math.max(0, expected - voices.length);

  return (
    <ul className="voices">
      {voices.map((voice) => (
        <li key={voice.name} className="voice">
          <blockquote className="voice-quote">
            <span className="voice-mark" aria-hidden="true">
              &ldquo;
            </span>
            {voice.quote}
          </blockquote>
          <div className="voice-by">
            {voice.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="voice-photo" src={voice.photo} alt="" width={40} height={40} loading="lazy" decoding="async" />
            ) : null}
            <div>
            {voice.linkedin ? (
              <a href={voice.linkedin} target="_blank" rel="noopener noreferrer" className="voice-name">
                {voice.name}
                <ArrowUpRight className="size-3.5" aria-hidden />
                <span className="sr-only"> (LinkedIn, opens in a new tab)</span>
              </a>
            ) : (
              <p className="voice-name">{voice.name}</p>
            )}
            <p className="voice-title">{voice.title}</p>
            </div>
          </div>
        </li>
      ))}
      {Array.from({ length: pending }, (_, index) => (
        <li key={`pending-${index}`} className="voice-pending" aria-hidden="true">
          More to come
        </li>
      ))}
    </ul>
  );
}
