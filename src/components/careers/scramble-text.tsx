"use client";

import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/#$%&";

/**
 * Reveals text character by character with a brief scramble, like a decoding
 * readout. The wrapper carries the real text as its accessible name, so
 * assistive technology never reads the scrambled characters, and reduced
 * motion skips the effect.
 */
export function ScrambleText({ text, start = true, delay = 0, speed = 16 }: { text: string; start?: boolean; delay?: number; speed?: number }) {
  const [shown, setShown] = useState(text);
  const [rendered, setRendered] = useState(text);

  // Derived reset: a new string starts from the real text, never a stale one.
  if (text !== rendered) {
    setRendered(text);
    setShown(text);
  }

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let timer = 0;
    const tick = () => {
      frame += 1;
      const revealed = frame;
      if (revealed >= text.length) {
        setShown(text);
        return;
      }
      setShown(
        text
          .split("")
          .map((character, index) => (index < revealed || character === " " ? character : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
      timer = window.setTimeout(tick, speed);
    };
    const first = window.setTimeout(tick, delay);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(timer);
    };
  }, [text, start, delay, speed]);

  return (
    <span aria-label={text}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
