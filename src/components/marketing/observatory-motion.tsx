"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

const MotionContext = createContext({ moving: false, reduced: false, toggle: () => {} });

export function ObservatoryMotion({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(true);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(preference.matches);
    const frame = requestAnimationFrame(() => {
      sync();
      try { setPaused(localStorage.getItem("observatory-motion") === "paused"); } catch { setPaused(false); }
    });
    preference.addEventListener("change", sync);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener("change", sync); };
  }, []);
  function toggle() {
    const next = !paused;
    setPaused(next);
    try { localStorage.setItem("observatory-motion", next ? "paused" : "playing"); } catch { /* Motion works without storage. */ }
  }
  return <MotionContext.Provider value={{ moving: !paused && !reduced, reduced, toggle }}>{children}</MotionContext.Provider>;
}

export function MotionControl() {
  const { moving, reduced, toggle } = useContext(MotionContext);
  return (
    <button type="button" className="motion-control" onClick={toggle} disabled={reduced} aria-label={reduced ? "Motion off: reduced motion preference" : moving ? "Pause page motion" : "Resume page motion"}>
      {moving ? <Pause size={13} aria-hidden /> : <Play size={13} aria-hidden />}
      <span>{reduced ? "Motion off" : moving ? "Pause motion" : "Resume motion"}</span>
    </button>
  );
}

export function Globe() {
  const { moving, reduced } = useContext(MotionContext);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const movingRef = useRef(moving);
  const rendererRef = useRef<ReturnType<typeof import("./globe-renderer").createGlobeRenderer> | null>(null);
  const visible = useRef(false);
  useEffect(() => {
    movingRef.current = moving;
    rendererRef.current?.setRunning(moving && visible.current && !document.hidden);
  }, [moving]);
  useEffect(() => {
    if (reduced || !canvas.current) return;
    const target = canvas.current;
    const controller = new AbortController();
    let disposed = false;
    const sync = () => rendererRef.current?.setRunning(movingRef.current && visible.current && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; sync(); });
    observer.observe(target);
    document.addEventListener("visibilitychange", sync);
    const failed = () => { rendererRef.current?.destroy(); rendererRef.current = null; setReady(false); };
    target.addEventListener("contextlost", failed);
    async function load() {
      setReady(false);
      try {
        const [module, response] = await Promise.all([import("./globe-renderer"), fetch("/assets/observatory/land-points.json", { signal: controller.signal })]);
        if (!response.ok) throw new Error("Globe data unavailable");
        const points = await response.json();
        if (disposed) return;
        rendererRef.current = module.createGlobeRenderer(target, points, failed);
        setReady(true);
        sync();
      } catch { if (!disposed) setReady(false); /* Keep the local poster on failure. */ }
    }
    // Essential content is already rendered; defer the optional renderer until idle.
    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(() => void load(), { timeout: 2500 }) : null;
    const timer = idle === null ? setTimeout(() => void load(), 800) : null;
    return () => {
      disposed = true; controller.abort(); observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      target.removeEventListener("contextlost", failed);
      if (idle !== null) window.cancelIdleCallback(idle);
      if (timer !== null) clearTimeout(timer);
      rendererRef.current?.destroy(); rendererRef.current = null;
    };
  }, [reduced]);
  return (
    <div className="observatory-globe" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/observatory/globe-poster.webp" width="720" height="720" alt="" decoding="async" className={ready && !reduced ? "globe-poster is-rendered" : "globe-poster"} />
      <canvas ref={canvas} width="720" height="720" className={ready && !reduced ? "globe-canvas is-ready" : "globe-canvas"} />
    </div>
  );
}

export function EmployerStrip({ companies }: { companies: string[] }) {
  const { moving } = useContext(MotionContext);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    let inView = false;
    const sync = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(target);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);
  return (
    <section className="employer-strip" aria-labelledby="employer-heading" data-moving={moving && visible}>
      <noscript><style>{`.employer-track{display:block;width:100%;animation:none}.employer-track ul{flex-wrap:wrap;justify-content:space-between;padding:0;gap:24px}.employer-track .employer-copy{display:none}.employer-window{mask-image:none}.motion-control{display:none}`}</style></noscript>
      <div className="container-x">
        <div className="strip-heading"><h2 id="employer-heading">Our members have interned at</h2><MotionControl /></div>
        <div className="employer-window" ref={ref}>
          <div className="employer-track">
            <ul>{companies.map((name) => <li key={name}>{name}</li>)}</ul>
            <ul aria-hidden="true" className="employer-copy">{companies.map((name) => <li key={name}>{name}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
