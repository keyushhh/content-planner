import type { ReactNode } from "react";
import { mockCount } from "@/lib/mock-engagement";

/**
 * Decorative only — a scannable code needs a real QR encoder. This lays out a version-1
 * grid with the three finder patterns in place so it reads unmistakably as a QR code,
 * and the modules are seeded so a given campaign or post always draws the same one.
 */
export function QrGlyph({ seed, className }: { seed: string; className?: string }) {
  const size = 21;
  const finders = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ] as const;

  const reserved = (x: number, y: number) =>
    finders.some(([ox, oy]) => x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7);

  const modules: ReactNode[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (reserved(x, y)) continue;
      if (mockCount(`${seed}-qr-${x}-${y}`, 0, 1) === 0) continue;
      modules.push(
        <rect key={`${x}-${y}`} x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.3} />,
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} fill="currentColor" aria-hidden>
      {modules}
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} rx={2} />
          <rect x={x + 1} y={y + 1} width={5} height={5} rx={1.4} fill="#ffffff" />
          <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.9} />
        </g>
      ))}
    </svg>
  );
}
