"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas matrix rain. Canvas rather than DOM nodes because this draws a few
 * hundred glyphs per frame; doing that with elements would thrash layout.
 *
 * It only runs while it is on screen, stops entirely under reduced motion,
 * and caps the pixel ratio, so it stays cheap on a laptop battery.
 */
const GLYPHS = "01ABCDEF<>{}[]/\\|=+*#$%&@ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";

export function MatrixRain({ className, speed = 1 }: { className?: string; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const FONT = 14;
    let columns: { y: number; speed: number; length: number }[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas!.width = Math.floor(width * ratio);
      canvas!.height = Math.floor(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.font = `${FONT}px var(--font-mono, monospace)`;
      context!.textBaseline = "top";

      const count = Math.ceil(width / FONT);
      columns = Array.from({ length: count }, () => ({
        // Start scattered above the canvas so the first frame is already mid-fall.
        y: Math.random() * -height,
        speed: (1.6 + Math.random() * 2.6) * speed,
        length: 6 + Math.floor(Math.random() * 14),
      }));
    }

    function draw() {
      if (!running) return;
      frame = requestAnimationFrame(draw);

      // Fade the previous frame instead of clearing: that is what leaves trails.
      context!.globalCompositeOperation = "destination-out";
      context!.fillStyle = "rgba(0, 0, 0, 0.14)";
      context!.fillRect(0, 0, width, height);
      context!.globalCompositeOperation = "source-over";

      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const x = i * FONT;
        const head = column.y;

        for (let step = 0; step < column.length; step++) {
          const y = head - step * FONT;
          if (y < -FONT || y > height) continue;
          const glyph = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          if (step === 0) {
            context!.fillStyle = "rgba(226, 240, 255, 0.92)";
          } else {
            const fade = 1 - step / column.length;
            context!.fillStyle = `rgba(96, 165, 250, ${(fade * 0.5).toFixed(3)})`;
          }
          context!.fillText(glyph, x, y);
        }

        column.y += column.speed;
        if (column.y - column.length * FONT > height) {
          column.y = Math.random() * -120;
          column.speed = (1.6 + Math.random() * 2.6) * speed;
          column.length = 6 + Math.floor(Math.random() * 14);
        }
      }
    }

    function start() {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    resize();

    // Only burn frames while the canvas is actually in view.
    const visibility = new IntersectionObserver((entries) => (entries.some((e) => e.isIntersecting) ? start() : stop()), {
      rootMargin: "120px",
    });
    visibility.observe(canvas);

    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);

    const onVisibilityChange = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      visibility.disconnect();
      sizes.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [speed]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
