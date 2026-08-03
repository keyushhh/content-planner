// FNV-1a plus a murmur3 finalizer, so near-identical seeds still scatter.
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return Math.abs(hash);
}

export function mockCount(seed: string, min: number, max: number): number {
  return min + (hashSeed(seed) % (max - min + 1));
}

export function mockTrendPercent(seed: string, min = 8, max = 32): number {
  return mockCount(`trend-${seed}`, min, max);
}

// A seeded random walk normalised to 0..1. It reflects off the bounds rather than clamping
// (no flat plateaus), and is oriented so its back half averages above its front half —
// over ~24 steps variance swamps any drift, and the shape must agree with the delta chip.
export function mockSeries(seed: string, count = 24): number[] {
  const walk: number[] = [];
  let value = 0.5;

  for (let i = 0; i < count; i++) {
    value += (mockCount(`${seed}-step-${i}`, 0, 1000) / 1000 - 0.5) * 0.2;
    if (value > 1) value = 2 - value;
    if (value < 0) value = -value;
    walk.push(value);
  }

  const min = Math.min(...walk);
  const span = Math.max(...walk) - min || 1;
  const series = walk.map((v) => (v - min) / span);

  const third = Math.max(1, Math.round(count / 3));
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const rising = mean(series.slice(-third)) >= mean(series.slice(0, third));
  return rising ? series : series.map((v) => 1 - v);
}
