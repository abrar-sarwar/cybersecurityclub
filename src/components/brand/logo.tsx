import Image from "next/image";
import Link from "next/link";
import { branding } from "@config/branding";
import { cn } from "@/lib/cn";

/** Club lockup: the network shield from the homepage beside the wordmark. */
export function Logo({
  href = "/",
  size = "md",
  className,
  wordmark = true,
}: {
  href?: string | null;
  size?: "sm" | "md";
  className?: string;
  wordmark?: boolean;
}) {
  const height = size === "sm" ? 30 : 36;
  const width = Math.round((height * branding.logo.width) / branding.logo.height);

  const content = (
    <span className={cn("signal-logo", size === "sm" && "signal-logo-sm", className)}>
      <Image
        src={branding.logo.src}
        alt={wordmark ? "" : branding.logo.alt}
        width={width}
        height={height}
        className="signal-logo-mark"
        priority={size === "md"}
      />
      {wordmark ? (
        <span className="signal-logo-text">
          <span className="signal-logo-primary">{branding.wordmark.primary}</span>
          <span className="signal-logo-secondary">{branding.wordmark.secondary}</span>
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="signal-logo-link" aria-label={`${branding.displayName} home`}>
      {content}
    </Link>
  );
}
