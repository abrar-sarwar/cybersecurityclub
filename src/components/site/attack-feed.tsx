"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A simulated attack feed: a console that streams blocked intrusion attempts
 * beside the club values, so the empty column earns its space.
 *
 * Everything here is invented for the page. It is labelled as a simulation in
 * the visible header, carries no real telemetry, and is hidden from assistive
 * tech so a screen reader is never told fake security events are happening.
 */
type Line = { id: number; time: string; tag: string; text: string; level: "info" | "warn" | "block" };

const SOURCES = ["185.203.x.x", "45.9.x.x", "92.118.x.x", "103.74.x.x", "194.26.x.x", "212.70.x.x", "23.94.x.x"];
const PORTS = [22, 443, 3389, 8080, 445, 1433, 5900, 21];

const EVENTS: { tag: string; level: Line["level"]; make: () => string }[] = [
  { tag: "SSH", level: "block", make: () => `Brute force from ${pick(SOURCES)} blocked after 47 attempts` },
  { tag: "SCAN", level: "warn", make: () => `Port sweep detected on ${PORTS.length} ports from ${pick(SOURCES)}` },
  { tag: "WAF", level: "block", make: () => `SQL injection payload rejected at /api/login` },
  { tag: "AUTH", level: "warn", make: () => `Impossible travel: sign-in from two regions in 4 minutes` },
  { tag: "DNS", level: "info", make: () => `Beacon interval 60.0s flagged to ${pick(SOURCES)}` },
  { tag: "EDR", level: "block", make: () => `Credential dump attempt stopped on WORKSTATION-${(Math.random() * 90 + 10) | 0}` },
  { tag: "MAIL", level: "warn", make: () => `Phishing lure quarantined: "Payroll update required"` },
  { tag: "WAF", level: "block", make: () => `Directory traversal ../../etc/passwd denied` },
  { tag: "IAM", level: "info", make: () => `Stale access key rotated after 91 days` },
  { tag: "NET", level: "block", make: () => `Outbound to known C2 dropped on port ${pick(PORTS)}` },
  { tag: "EDR", level: "warn", make: () => `Encoded PowerShell launched by a document process` },
  { tag: "AUTH", level: "block", make: () => `Password spray across 312 accounts halted` },
];

function pick<T>(list: readonly T[]): T {
  return list[(Math.random() * list.length) | 0];
}

function stamp() {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
}

const MAX_LINES = 7;

export function AttackFeed() {
  const [lines, setLines] = useState<Line[]>([]);
  const [blocked, setBlocked] = useState(1284);
  const counter = useRef(0);
  const [still] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    // Seed a full console so the panel never starts empty.
    const seed = Array.from({ length: MAX_LINES }, () => {
      const event = pick(EVENTS);
      return { id: counter.current++, time: stamp(), tag: event.tag, text: event.make(), level: event.level };
    });
    setLines(seed);
  }, []);

  useEffect(() => {
    if (still) return;
    let timer = 0;

    const push = () => {
      if (!document.hidden) {
        const event = pick(EVENTS);
        setLines((current) => [
          { id: counter.current++, time: stamp(), tag: event.tag, text: event.make(), level: event.level },
          ...current.slice(0, MAX_LINES - 1),
        ]);
        if (event.level === "block") setBlocked((n) => n + 1);
      }
      // Irregular spacing reads as live traffic rather than a metronome.
      timer = window.setTimeout(push, 1500 + Math.random() * 2200);
    };

    timer = window.setTimeout(push, 1200);
    return () => window.clearTimeout(timer);
  }, [still]);

  return (
    <aside className="feed" aria-hidden="true">
      <header className="feed-head">
        <span className="feed-dot" />
        <span className="feed-title">Threat feed</span>
        <span className="feed-sim">Simulated</span>
      </header>

      <div className="feed-stats">
        <div>
          <p className="feed-stat-value">{blocked.toLocaleString("en-US")}</p>
          <p className="feed-stat-label">Blocked today</p>
        </div>
        <div>
          <p className="feed-stat-value feed-stat-ok">0</p>
          <p className="feed-stat-label">Got through</p>
        </div>
      </div>

      <ul className="feed-lines">
        {lines.map((line) => (
          <li key={line.id} className="feed-line" data-level={line.level}>
            <span className="feed-time">{line.time}</span>
            <span className="feed-tag">{line.tag}</span>
            <span className="feed-text">{line.text}</span>
          </li>
        ))}
      </ul>

      <footer className="feed-foot">
        <span className="feed-bar">
          <span className="feed-bar-fill" />
        </span>
        This is a mock-up. The work behind it is what the club teaches.
      </footer>
    </aside>
  );
}
