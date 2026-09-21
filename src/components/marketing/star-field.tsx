import { cn } from "@/lib/cn";

type Star = { x: number; y: number; r: number; opacity: number; twinkle: boolean; tint: boolean };

/** Deterministic, so the server and client render the same sky. */
function createStars(count: number, seedValue: number): Star[] {
  let seed = seedValue;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const tenth = (value: number) => Math.round(value * 10) / 10;
  return Array.from({ length: count }, (_, index) => {
    const bright = random() > 0.93;
    return {
      x: tenth(random() * 1440),
      y: tenth(random() * 900),
      r: tenth(bright ? 1 + random() * 0.5 : 0.35 + random() * 0.5),
      opacity: tenth(bright ? 0.65 + random() * 0.25 : 0.2 + random() * 0.4),
      twinkle: index % 11 === 0,
      tint: random() > 0.62,
    };
  });
}

const SKIES = {
  home: createStars(170, 20260916),
  page: createStars(130, 20260917),
};

/** The homepage star field, shared so every page sits under the same sky. */
export function StarField({ className = "cyber-stars", sky = "home" }: { className?: string; sky?: keyof typeof SKIES }) {
  return (
    <svg className={cn(className)} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {SKIES[sky].map((star, index) => (
        <circle
          key={index}
          cx={star.x}
          cy={star.y}
          r={star.r}
          className={star.twinkle ? "star is-twinkling" : "star"}
          fill={star.tint ? "#8fb8ff" : "#e3edff"}
          opacity={star.opacity}
          style={star.twinkle ? { animationDelay: `${-(index % 7) * 0.9}s` } : undefined}
        />
      ))}
    </svg>
  );
}
