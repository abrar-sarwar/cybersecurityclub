import { cn } from "@/lib/cn";

const SHAPES = ["pad", "diamond", "ring"] as const;

/**
 * The square pads, diamonds and rings used for stars in the homepage network,
 * reused as markers so the career pages share its visual language.
 */
export function NodeMark({ index, className }: { index: number; className?: string }) {
  const shape = SHAPES[index % SHAPES.length];
  return (
    <svg viewBox="0 0 20 20" className={cn("node-mark", className)} aria-hidden="true" focusable="false">
      {shape === "pad" ? <rect x="4.5" y="4.5" width="11" height="11" rx="1" /> : null}
      {shape === "diamond" ? <path d="M10 2.5L17.5 10L10 17.5L2.5 10Z" /> : null}
      {shape === "ring" ? <circle cx="10" cy="10" r="6" /> : null}
      <circle className="node-mark-core" cx="10" cy="10" r="2" />
    </svg>
  );
}
