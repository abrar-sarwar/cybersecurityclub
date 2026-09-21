import { cn } from "@/lib/cn";

/**
 * The homepage's corrupted-signal heading: brief red and cyan slices on load
 * and on hover. The duplicate layers are decoration and hidden from assistive
 * technology; reduced motion removes them.
 */
export function GlitchHeading({
  as: Tag = "h1",
  id,
  children,
  className,
}: {
  as?: "h1" | "h2";
  id?: string;
  children: string;
  className?: string;
}) {
  return (
    <Tag id={id} className={cn("signal-glitch", className)}>
      <span className="glitch-text">{children}</span>
      <span className="glitch-layer glitch-layer-red" aria-hidden="true">
        {children}
      </span>
      <span className="glitch-layer glitch-layer-cyan" aria-hidden="true">
        {children}
      </span>
    </Tag>
  );
}
