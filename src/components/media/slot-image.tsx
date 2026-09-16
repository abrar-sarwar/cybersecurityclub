import type { ResolvedImage } from "@/server/services/media";
import { cn } from "@/lib/cn";

/**
 * Renders a resolved image with responsive sources, explicit dimensions and a
 * focal point. Uploaded assets ship their own WebP variants; manifest assets
 * are static files under /public and are served as-is.
 */
export function ResolvedImg({
  image,
  sizes = "100vw",
  className,
  priority = false,
  imgClassName,
}: {
  image: ResolvedImage;
  sizes?: string;
  className?: string;
  priority?: boolean;
  imgClassName?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.srcSet ? sizes : undefined}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      className={cn("h-full w-full object-cover", className, imgClassName)}
      style={{ objectPosition: `${Math.round(image.focalX * 100)}% ${Math.round(image.focalY * 100)}%` }}
    />
  );
}

export function Figure({
  image,
  sizes,
  className,
  frameClassName,
  priority,
  showCaption = true,
}: {
  image: ResolvedImage;
  sizes?: string;
  className?: string;
  frameClassName?: string;
  priority?: boolean;
  showCaption?: boolean;
}) {
  const caption = [image.caption, image.credit ? `Photo: ${image.credit}` : null].filter(Boolean).join(" · ");
  return (
    <figure className={className}>
      <div className={cn("overflow-hidden rounded-2xl bg-pale-2", frameClassName)}>
        <ResolvedImg image={image} sizes={sizes} priority={priority} />
      </div>
      {showCaption && caption ? <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption> : null}
    </figure>
  );
}

/** Tasteful placeholder used when a slot has no published image yet. */
export function PhotoPlaceholder({ label, className, ratioClassName = "aspect-[16/9]" }: { label?: string; className?: string; ratioClassName?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-pale bg-network",
        ratioClassName,
        className,
      )}
      role="img"
      aria-label={label ?? "Photo coming soon"}
    >
      <div className="relative text-center">
        <svg viewBox="0 0 48 48" className="mx-auto size-10 text-brand-300" fill="none" aria-hidden>
          <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="18" cy="20" r="3" fill="currentColor" />
          <path d="m10 34 10-9 7 6 5-4 6 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label ? <p className="mt-2 text-sm font-medium text-muted">{label}</p> : null}
      </div>
    </div>
  );
}
