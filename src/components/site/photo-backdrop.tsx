"use client";

import { useEffect, useState } from "react";
import { CLUB_PHOTOS, type ClubPhoto } from "@/content/club/photos";

/**
 * Club photographs cycling behind a hero. Every photo stays mounted and only
 * opacity and transform change, so a swap costs one composited frame.
 *
 * It sits behind text, so it is heavily darkened and overlaid with scanlines
 * and a sweep: the photograph reads as texture, never as content. The images
 * are decorative here (the page states what they are), so they carry no alt
 * text and the whole layer is hidden from assistive tech.
 */
export function PhotoBackdrop({
  photos = CLUB_PHOTOS,
  interval = 5000,
}: {
  photos?: readonly ClubPhoto[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  // Read once during the first render, so the effect never sets state synchronously.
  const [still] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (still || photos.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % photos.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [still, photos.length, interval]);

  return (
    <div className="hero-photos" aria-hidden="true" data-still={still || undefined}>
      {photos.map((photo, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.src}
          className="hero-photo"
          src={photo.src}
          alt=""
          width={photo.width}
          height={photo.height}
          data-active={i === index || undefined}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
        />
      ))}
      <div className="hero-photo-grain" />
      <div className="hero-photo-sweep" />
      <div className="hero-photo-veil" />
    </div>
  );
}
