import Link from "next/link";
import { branding } from "@config/branding";
import { resolveSingle } from "@/server/services/media";
import { TemporaryMark } from "@/components/brand/marks";
import { cn } from "@/lib/cn";

/**
 * Club identity lockup. Renders the official logo when the "site.logo" slot
 * resolves to a published image; otherwise a clearly temporary mark.
 * Never stretches or crops the official mark (object-fit: contain).
 */
export async function Logo({
  href = "/",
  size = "md",
  className,
  wordmark = true,
}: {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  wordmark?: boolean;
}) {
  const image = await resolveSingle(branding.logo.slot);
  const heights = { sm: 34, md: branding.logo.headerHeight, lg: 72 };
  const h = heights[size];

  const mark = image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={`${Math.round(h * (image.width / image.height))}px`}
      alt={image.alt || branding.logo.alt}
      width={Math.round(h * (image.width / image.height))}
      height={h}
      style={{ height: h, width: "auto", objectFit: "contain" }}
      className="shrink-0 rounded-sm bg-white p-1"
      decoding="async"
    />
  ) : (
    <TemporaryMark size={h} />
  );

  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {mark}
      {wordmark ? (
        <span className="flex flex-col leading-tight">
          <span className={cn("font-display font-bold tracking-tight text-navy-900", size === "sm" ? "text-[0.95rem]" : "text-[1.05rem] sm:text-lg")}>
            {branding.wordmark.primary}
          </span>
          <span className={cn("font-medium text-muted", size === "sm" ? "text-[0.7rem]" : "text-[0.75rem] sm:text-[0.8rem]")}>
            {branding.wordmark.secondary}
          </span>
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="rounded-lg" aria-label={`${branding.displayName} home`}>
      {content}
    </Link>
  );
}
