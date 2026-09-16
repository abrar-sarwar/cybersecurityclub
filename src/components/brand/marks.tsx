import { branding } from "@config/branding";
import { cn } from "@/lib/cn";

/**
 * TEMPORARY MARK.
 * The official club logo file was not available when the site was built, so
 * this generic shield glyph stands in. It is deliberately simple and must not
 * be mistaken for the real identity. It is replaced automatically as soon as
 * an officer assigns an image to the "site.logo" media slot.
 */
export function TemporaryMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={branding.logo.temporaryLabel}
      data-placeholder="true"
      className={cn("shrink-0", className)}
    >
      <path
        d="M24 3.5 6.5 10v12.4c0 10.5 7 19.2 17.5 22.1 10.5-2.9 17.5-11.6 17.5-22.1V10L24 3.5Z"
        fill="#1747B0"
      />
      <path
        d="M24 8.3 11 13.2v9.3c0 8.1 5.2 14.9 13 17.6 7.8-2.7 13-9.5 13-17.6v-9.3L24 8.3Z"
        fill="#2D5CCB"
      />
      <g stroke="#DBE6FF" strokeWidth="1.5" strokeLinecap="round">
        <path d="M16 19.5 24 24l8-4.5M24 24v9M16 19.5v8M32 19.5v8" />
      </g>
      <g fill="#FFFFFF">
        <circle cx="16" cy="19.5" r="2.1" />
        <circle cx="32" cy="19.5" r="2.1" />
        <circle cx="24" cy="24" r="2.4" />
        <circle cx="24" cy="33" r="2.1" />
      </g>
    </svg>
  );
}

/** Decorative connected-node artwork used behind marketing sections. */
export function NetworkArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 420" fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id="na-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1747B0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0EA5C6" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <g stroke="#1747B0" strokeOpacity="0.22" strokeWidth="1.25">
        <path d="M70 320 200 250 320 300 430 210 470 90" />
        <path d="M200 250 150 120 320 70 430 210" />
        <path d="M320 300 320 70M150 120 70 320M200 250 320 70" />
        <path d="M470 90 320 70M430 210 320 300" />
      </g>
      <g fill="#1747B0" fillOpacity="0.12">
        <circle cx="150" cy="120" r="34" />
        <circle cx="430" cy="210" r="46" />
        <circle cx="200" cy="250" r="26" />
      </g>
      <g fill="url(#na-g)">
        <circle cx="70" cy="320" r="7" />
        <circle cx="200" cy="250" r="9" />
        <circle cx="320" cy="300" r="7" />
        <circle cx="430" cy="210" r="11" />
        <circle cx="470" cy="90" r="6" />
        <circle cx="150" cy="120" r="8" />
        <circle cx="320" cy="70" r="7" />
      </g>
      <path
        d="M260 150c-30 0-52 22-52 50 0 36 26 62 52 74 26-12 52-38 52-74 0-28-22-50-52-50Z"
        fill="#FFFFFF"
        stroke="#1747B0"
        strokeOpacity="0.5"
        strokeWidth="2"
      />
      <path d="M260 165c-20 0-36 15-36 35 0 25 18 44 36 54 18-10 36-29 36-54 0-20-16-35-36-35Z" fill="#EEF3FF" stroke="#1747B0" strokeOpacity="0.35" strokeWidth="1.5" />
      <g stroke="#1747B0" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round">
        <path d="M246 195 260 203l14-8M260 203v22M246 195v14M274 195v14" />
      </g>
      <g fill="#1747B0">
        <circle cx="246" cy="195" r="3" />
        <circle cx="274" cy="195" r="3" />
        <circle cx="260" cy="203" r="3.5" />
        <circle cx="260" cy="225" r="3" />
      </g>
    </svg>
  );
}

/** Small shield icon used in feature lists. */
export function ShieldGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M12 2.5 4 5.7v6.1c0 5 3.3 9.1 8 10.7 4.7-1.6 8-5.7 8-10.7V5.7L12 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 11.2 12 13l3.5-1.8M12 13v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8.5" cy="11.2" r="1.1" fill="currentColor" />
      <circle cx="15.5" cy="11.2" r="1.1" fill="currentColor" />
      <circle cx="12" cy="13" r="1.2" fill="currentColor" />
    </svg>
  );
}
