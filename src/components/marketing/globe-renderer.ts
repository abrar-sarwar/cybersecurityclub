import { projectGlobePoint, type GlobePoint } from "@/lib/globe";

/** No WebGL or animation dependency. Resolution and frame rate are deliberately bounded. */
export function createGlobeRenderer(canvas: HTMLCanvasElement, points: GlobePoint[], onFailure: () => void) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas unavailable");
  const context = ctx;
  let angle = 0;
  let frame = 0;
  let previous = 0;
  let running = false;
  function draw() {
    const pixels = Math.min(1080, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5)));
    if (pixels < 1) return;
    if (canvas.width !== pixels) canvas.width = canvas.height = pixels;
    context.setTransform(pixels / 720, 0, 0, pixels / 720, 0, 0);
    context.clearRect(0, 0, 720, 720);
    const atmosphere = context.createRadialGradient(360, 360, 270, 360, 360, 315);
    atmosphere.addColorStop(0, "rgba(40,92,255,.13)");
    atmosphere.addColorStop(0.45, "rgba(56,124,255,.2)");
    atmosphere.addColorStop(1, "rgba(40,92,255,0)");
    context.fillStyle = atmosphere;
    context.beginPath(); context.arc(360, 360, 315, 0, Math.PI * 2); context.fill();
    const sea = context.createRadialGradient(223, 200, 0, 223, 200, 515);
    sea.addColorStop(0, "#102b60"); sea.addColorStop(.48, "#09172e"); sea.addColorStop(1, "#05070d");
    context.fillStyle = sea;
    context.beginPath(); context.arc(360, 360, 286, 0, Math.PI * 2); context.fill();
    const rim = context.createLinearGradient(120, 100, 580, 610);
    rim.addColorStop(0, "rgba(101,156,255,.65)"); rim.addColorStop(.55, "rgba(40,92,255,.15)"); rim.addColorStop(1, "rgba(5,7,13,0)");
    context.strokeStyle = rim; context.lineWidth = 1.2; context.stroke();
    context.fillStyle = "#72a8ff";
    for (const point of points) {
      const p = projectGlobePoint(point, angle);
      if (p.depth <= 0) continue;
      context.globalAlpha = p.alpha;
      context.beginPath(); context.arc(p.x, p.y, 1.22, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
  }
  function tick(now: number) {
    if (!running) return;
    if (!previous || now - previous >= 1000 / 24) {
      if (previous) angle += Math.min(now - previous, 100) / 120000 * Math.PI * 2;
      previous = now;
      safeDraw();
    }
    if (running) frame = requestAnimationFrame(tick);
  }
  function safeDraw() {
    try { draw(); } catch {
      running = false; cancelAnimationFrame(frame); resize.disconnect(); onFailure();
    }
  }
  const resize = new ResizeObserver(safeDraw);
  resize.observe(canvas);
  try { draw(); } catch (error) { resize.disconnect(); throw error; }
  return {
    setRunning(value: boolean) {
      if (running === value) return;
      running = value;
      cancelAnimationFrame(frame);
      previous = 0;
      if (running) frame = requestAnimationFrame(tick);
    },
    destroy() { running = false; cancelAnimationFrame(frame); resize.disconnect(); },
  };
}
