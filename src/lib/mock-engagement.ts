// FNV-1a with a murmur3-style finalizer so near-identical seeds (e.g. "seed-0" vs "seed-1")
// still produce well-scattered values instead of a visibly sequential pattern.
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

// A seeded random walk, not independent samples per point: independent samples read as a
// directionless sawtooth, which is what makes a fake sparkline look fake.
// Two details that matter for it reading as real data:
//   - the walk reflects off 0 and 1 rather than clamping, so it never sits on a flat
//     plateau at the top or bottom of the plot;
//   - the result is oriented so its back half averages above its front half. Over only
//     ~24 steps a walk's variance swamps any per-step drift, so without this some seeds
//     trend visibly downward while the tile's delta chip claims growth.
// Values come back normalised to 0..1 so a sparkline always uses its full height.
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
