"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The club values, unboxed: each one is a row on a vertical trace that decodes
 * itself as it scrolls into view. The heading scrambles through glyphs before
 * resolving, and a pulse runs down the trace behind it.
 *
 * The real text is always in the DOM; only a decorative layer animates, so the
 * content is readable without JavaScript and with reduced motion.
 */
export type Value = { title: string; body: string };

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01<>/\\#$%&*+=";

function Scrambled({ text, play }: { text: string; play: boolean }) {
  const [shown, setShown] = useState(text);
  const settled = useRef(false);

  useEffect(() => {
    if (!play || settled.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settled.current = true;
      return;
    }

    settled.current = true;
    let revealed = 0;
    let tick = 0;

    const id = window.setInterval(() => {
      tick += 1;
      // Two frames of noise per character, then that character locks in.
      if (tick % 2 === 0) revealed += 1;

      if (revealed >= text.length) {
        setShown(text);
        window.clearInterval(id);
        return;
      }

      const scrambled = text
        .split("")
        .map((character, index) => {
          if (index < revealed || character === " ") return character;
          return GLYPHS[(Math.random() * GLYPHS.length) | 0];
        })
        .join("");
      setShown(scrambled);
    }, 28);

    return () => window.clearInterval(id);
  }, [play, text]);

  // The accessible name never changes, only the painted glyphs.
  return (
    <span aria-label={text}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

export function ValueStack({ values }: { values: readonly Value[] }) {
  const [live, setLive] = useState<number>(-1);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const element = list.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const rows = [...element.querySelectorAll("li")];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = rows.indexOf(entry.target as HTMLLIElement);
          entry.target.setAttribute("data-shown", "true");
          setLive((current) => Math.max(current, index));
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.35 },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  return (
    <ol className="values" ref={list}>
      {values.map((value, index) => (
        <li key={value.title} className="value-row" style={{ ["--i" as string]: index }}>
          <span className="value-rail" aria-hidden="true">
            <span className="value-node" />
          </span>
          <div className="value-body">
            <p className="value-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="value-title">
              <Scrambled text={value.title} play={index <= live} />
            </h3>
            <p className="value-text">{value.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
